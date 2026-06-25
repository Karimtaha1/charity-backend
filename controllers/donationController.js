const { getPool } = require('../config/database');

exports.createDonation = async (req, res) => {
  try {
    const { donorName, donorEmail, donorPhone, amount, donationType, projectId, paymentMethod, message, isAnonymous } = req.body;

    const pool = await getPool();
    const result = await pool.request()
      .input('donorName', donorName)
      .input('donorEmail', donorEmail || null)
      .input('donorPhone', donorPhone || null)
      .input('amount', amount)
      .input('donationType', donationType || 'one-time')
      .input('projectId', projectId || null)
      .input('paymentMethod', paymentMethod)
      .input('transactionId', 'TXN-' + Date.now())
      .input('isAnonymous', isAnonymous ? 1 : 0)
      .input('message', message || null)
      .query(`INSERT INTO Donations (donorName, donorEmail, donorPhone, amount, donationType, projectId, paymentMethod, transactionId, isAnonymous, message)
              OUTPUT INSERTED.*
              VALUES (@donorName, @donorEmail, @donorPhone, @amount, @donationType, @projectId, @paymentMethod, @transactionId, @isAnonymous, @message)`);

    if (projectId) {
      await pool.request()
        .input('projectId', projectId)
        .input('amount', amount)
        .query("UPDATE Projects SET raisedAmount = raisedAmount + @amount WHERE id = @projectId");
    }

    await pool.request()
      .input('amount', amount)
      .query("UPDATE SiteSettings SET totalDonations = totalDonations + @amount WHERE id = 1");

    res.status(201).json({
      success: true,
      donation: result.recordset[0],
      message: { ar: 'تم استلام تبرعك بنجاح', en: 'Donation received successfully' }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getDonations = async (req, res) => {
  try {
    const { page = 1, limit = 20, status, type, search } = req.query;
    const offset = (page - 1) * limit;

    const pool = await getPool();
    let baseQuery = "SELECT d.*, p.titleAr as projectTitleAr, p.titleEn as projectTitleEn FROM Donations d LEFT JOIN Projects p ON d.projectId = p.id WHERE 1=1";
    let countQuery = "SELECT COUNT(*) as total FROM Donations d WHERE 1=1";
    const request = pool.request();

    if (status) {
      baseQuery += " AND d.paymentStatus = @status";
      countQuery += " AND d.paymentStatus = @status";
      request.input('status', status);
    }
    if (type) {
      baseQuery += " AND d.donationType = @type";
      countQuery += " AND d.donationType = @type";
      request.input('type', type);
    }
    if (search) {
      baseQuery += " AND (d.donorName LIKE @search OR d.donorEmail LIKE @search)";
      countQuery += " AND (d.donorName LIKE @search OR d.donorEmail LIKE @search)";
      request.input('search', `%${search}%`);
    }

    baseQuery += " ORDER BY d.createdAt DESC OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY";
    request.input('offset', parseInt(offset));
    request.input('limit', parseInt(limit));

    const result = await request.query(baseQuery);
    const countResult = await pool.request().query(countQuery);

    res.json({
      success: true,
      donations: result.recordset,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: countResult.recordset[0].total,
        pages: Math.ceil(countResult.recordset[0].total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateDonationStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { paymentStatus } = req.body;

    const pool = await getPool();
    await pool.request()
      .input('id', id)
      .input('status', paymentStatus)
      .query("UPDATE Donations SET paymentStatus = @status WHERE id = @id");

    res.json({ success: true, message: { ar: 'تم تحديث الحالة', en: 'Status updated' } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getDonationSummary = async (req, res) => {
  try {
    const pool = await getPool();

    const [byType, byMonth, byProject] = await Promise.all([
      pool.request().query("SELECT donationType, SUM(amount) as total, COUNT(*) as count FROM Donations WHERE paymentStatus = 'completed' GROUP BY donationType"),
      pool.request().query("SELECT MONTH(createdAt) as month, SUM(amount) as total FROM Donations WHERE paymentStatus = 'completed' AND YEAR(createdAt) = YEAR(GETDATE()) GROUP BY MONTH(createdAt) ORDER BY month"),
      pool.request().query("SELECT p.titleAr, p.titleEn, SUM(d.amount) as total FROM Donations d JOIN Projects p ON d.projectId = p.id WHERE d.paymentStatus = 'completed' GROUP BY p.titleAr, p.titleEn")
    ]);

    res.json({ success: true, byType: byType.recordset, byMonth: byMonth.recordset, byProject: byProject.recordset });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

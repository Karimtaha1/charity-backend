const { getPool } = require('../config/database');

exports.createVolunteer = async (req, res) => {
  try {
    const { fullName, email, phone, governorate, field, skills } = req.body;

    const pool = await getPool();
    const result = await pool.request()
      .input('fullName', fullName)
      .input('email', email || null)
      .input('phone', phone)
      .input('governorate', governorate)
      .input('field', field)
      .input('skills', skills || null)
      .query(`INSERT INTO Volunteers (fullName, email, phone, governorate, field, skills)
              OUTPUT INSERTED.*
              VALUES (@fullName, @email, @phone, @governorate, @field, @skills)`);

    await pool.request().query('UPDATE SiteSettings SET totalVolunteers = totalVolunteers + 1 WHERE id = 1');

    res.status(201).json({
      success: true,
      volunteer: result.recordset[0],
      message: { ar: 'تم تسجيل طلبك بنجاح', en: 'Application submitted successfully' }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getVolunteers = async (req, res) => {
  try {
    const { status, field, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    const pool = await getPool();
    let query = 'SELECT * FROM Volunteers WHERE 1=1';
    const request = pool.request();

    if (status) {
      query += ' AND status = @status';
      request.input('status', status);
    }
    if (field) {
      query += ' AND field = @field';
      request.input('field', field);
    }

    query += ' ORDER BY createdAt DESC OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY';
    request.input('offset', parseInt(offset));
    request.input('limit', parseInt(limit));

    const result = await request.query(query);

    res.json({ success: true, volunteers: result.recordset });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateVolunteerStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;

    const pool = await getPool();
    await pool.request()
      .input('id', id)
      .input('status', status)
      .input('notes', notes || null)
      .query('UPDATE Volunteers SET status = @status, notes = @notes WHERE id = @id');

    res.json({ success: true, message: { ar: 'تم تحديث الحالة', en: 'Status updated' } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

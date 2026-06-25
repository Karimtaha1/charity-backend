const { getPool } = require('../config/database');

exports.getProjects = async (req, res) => {
  try {
    const { category, status, page = 1, limit = 10, lang = 'ar' } = req.query;
    const offset = (page - 1) * limit;

    const pool = await getPool();
    let query = "SELECT * FROM Projects WHERE 1=1";
    const request = pool.request();

    if (category) {
      query += " AND category = @category";
      request.input('category', category);
    }
    if (status) {
      query += " AND status = @status";
      request.input('status', status);
    }

    query += " ORDER BY createdAt DESC OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY";
    request.input('offset', parseInt(offset));
    request.input('limit', parseInt(limit));

    const result = await request.query(query);

    const projects = result.recordset.map(p => ({
      id: p.id,
      title: lang === 'en' ? p.titleEn : p.titleAr,
      description: lang === 'en' ? p.descriptionEn : p.descriptionAr,
      category: p.category,
      goalAmount: p.goalAmount,
      raisedAmount: p.raisedAmount,
      progress: Math.round((p.raisedAmount / p.goalAmount) * 100),
      beneficiariesCount: p.beneficiariesCount,
      location: p.location,
      image: p.image,
      status: p.status,
      startDate: p.startDate,
      endDate: p.endDate
    }));

    res.json({ success: true, projects });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getProject = async (req, res) => {
  try {
    const { id } = req.params;
    const { lang = 'ar' } = req.query;

    const pool = await getPool();
    const result = await pool.request()
      .input('id', id)
      .query("SELECT * FROM Projects WHERE id = @id");

    if (result.recordset.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: { ar: 'المشروع غير موجود', en: 'Project not found' } 
      });
    }

    const p = result.recordset[0];
    res.json({
      success: true,
      project: {
        id: p.id,
        title: lang === 'en' ? p.titleEn : p.titleAr,
        description: lang === 'en' ? p.descriptionEn : p.descriptionAr,
        titleAr: p.titleAr,
        titleEn: p.titleEn,
        descriptionAr: p.descriptionAr,
        descriptionEn: p.descriptionEn,
        category: p.category,
        goalAmount: p.goalAmount,
        raisedAmount: p.raisedAmount,
        progress: Math.round((p.raisedAmount / p.goalAmount) * 100),
        beneficiariesCount: p.beneficiariesCount,
        location: p.location,
        image: p.image,
        status: p.status,
        startDate: p.startDate ? p.startDate.toISOString().split('T')[0] : null,
        endDate: p.endDate ? p.endDate.toISOString().split('T')[0] : null,
        createdAt: p.createdAt
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.createProject = async (req, res) => {
  try {
    const { titleAr, titleEn, descriptionAr, descriptionEn, category, goalAmount, location, startDate, endDate } = req.body;
    const image = req.file ? `/uploads/${req.file.filename}` : null;

    const pool = await getPool();
    const result = await pool.request()
      .input('titleAr', titleAr)
      .input('titleEn', titleEn)
      .input('descriptionAr', descriptionAr)
      .input('descriptionEn', descriptionEn)
      .input('category', category)
      .input('goalAmount', goalAmount)
      .input('location', location)
      .input('image', image)
      .input('startDate', startDate || null)
      .input('endDate', endDate || null)
      .query(`INSERT INTO Projects (titleAr, titleEn, descriptionAr, descriptionEn, category, goalAmount, location, image, startDate, endDate)
              OUTPUT INSERTED.* 
              VALUES (@titleAr, @titleEn, @descriptionAr, @descriptionEn, @category, @goalAmount, @location, @image, @startDate, @endDate)`);

    res.status(201).json({ success: true, project: result.recordset[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateProject = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const pool = await getPool();
    let setClause = [];
    const request = pool.request().input('id', id);

    Object.keys(updates).forEach((key) => {
      if (key !== 'id') {
        setClause.push(`${key} = @${key}`);
        request.input(key, updates[key]);
      }
    });

    const query = `UPDATE Projects SET ${setClause.join(', ')}, updatedAt = GETDATE() WHERE id = @id`;
    await request.query(query);

    res.json({ success: true, message: { ar: 'تم تحديث المشروع', en: 'Project updated' } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteProject = async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await getPool();
    await pool.request().input('id', id).query("DELETE FROM Projects WHERE id = @id");
    res.json({ success: true, message: { ar: 'تم حذف المشروع', en: 'Project deleted' } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

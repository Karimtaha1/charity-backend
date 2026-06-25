const { getPool } = require('../config/database');

exports.getPartners = async (req, res) => {
  try {
    const pool = await getPool();
    const result = await pool.request().query('SELECT * FROM Partners WHERE isActive = 1 ORDER BY createdAt DESC');
    res.json({ success: true, partners: result.recordset });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getPartner = async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await getPool();
    const result = await pool.request()
      .input('id', id)
      .query('SELECT * FROM Partners WHERE id = @id');

    if (result.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        message: { ar: 'الشريك غير موجود', en: 'Partner not found' }
      });
    }

    res.json({ success: true, partner: result.recordset[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.createPartner = async (req, res) => {
  try {
    const { nameAr, nameEn, type, website, description } = req.body;
    const logo = req.file ? `/uploads/${req.file.filename}` : null;

    const pool = await getPool();
    const result = await pool.request()
      .input('nameAr', nameAr)
      .input('nameEn', nameEn)
      .input('type', type)
      .input('logo', logo)
      .input('website', website || null)
      .input('description', description || null)
      .query(`INSERT INTO Partners (nameAr, nameEn, type, logo, website, description)
              OUTPUT INSERTED.*
              VALUES (@nameAr, @nameEn, @type, @logo, @website, @description)`);

    res.status(201).json({ success: true, partner: result.recordset[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updatePartner = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const pool = await getPool();
    let setClause = [];
    const request = pool.request().input('id', id);

    Object.keys(updates).forEach(key => {
      if (key !== 'id') {
        setClause.push(`${key} = @${key}`);
        request.input(key, updates[key]);
      }
    });

    const query = `UPDATE Partners SET ${setClause.join(', ')} WHERE id = @id`;
    await request.query(query);
    res.json({ success: true, message: { ar: 'تم التحديث', en: 'Updated' } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.deletePartner = async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await getPool();
    await pool.request().input('id', id).query('DELETE FROM Partners WHERE id = @id');
    res.json({ success: true, message: { ar: 'تم الحذف', en: 'Deleted' } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

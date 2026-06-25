const { getPool } = require('../config/database');

exports.getSettings = async (req, res) => {
  try {
    const pool = await getPool();
    const result = await pool.request().query('SELECT * FROM SiteSettings WHERE id = 1');
    res.json({ success: true, settings: result.recordset[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateSettings = async (req, res) => {
  try {
    const updates = req.body;

    const pool = await getPool();
    let setClause = [];
    const request = pool.request();

    Object.keys(updates).forEach(key => {
      if (key !== 'id') {
        setClause.push(`${key} = @${key}`);
        request.input(key, updates[key]);
      }
    });

    setClause.push('updatedAt = GETDATE()');

    const query = `UPDATE SiteSettings SET ${setClause.join(', ')} WHERE id = 1`;
    await request.query(query);
    res.json({ success: true, message: { ar: 'تم تحديث الإعدادات', en: 'Settings updated' } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

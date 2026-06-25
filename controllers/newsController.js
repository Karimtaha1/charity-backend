const { getPool } = require('../config/database');
const sql = require('mssql');

// Helper: Format datetime-local to SQL Server format
function formatDateForSQL(dateString) {
  if (!dateString || dateString === '' || dateString === 'null') return null;
  // Convert "2026-06-15T10:30" to "2026-06-15 10:30:00"
  if (dateString.includes('T')) {
    return dateString.replace('T', ' ') + ':00';
  }
  return dateString;
}

// Helper: Parse boolean from string/boolean/number
function parseBoolean(value) {
  if (typeof value === 'boolean') return value ? 1 : 0;
  if (typeof value === 'string') {
    return (value.toLowerCase() === 'true' || value === '1') ? 1 : 0;
  }
  if (typeof value === 'number') return value ? 1 : 0;
  return 0;
}

exports.getNews = async (req, res) => {
  try {
    const { type, lang = 'ar', page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    const pool = await getPool();
    let query = 'SELECT * FROM NewsEvents WHERE 1=1';
    const request = pool.request();

    if (type) {
      query += ' AND type = @type';
      request.input('type', type);
    }

    query += ' ORDER BY createdAt DESC OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY';
    request.input('offset', parseInt(offset));
    request.input('limit', parseInt(limit));

    const result = await request.query(query);

    const news = result.recordset.map(n => ({
      id: n.id,
      title: lang === 'en' ? n.titleEn : n.titleAr,
      content: lang === 'en' ? n.contentEn : n.contentAr,
      titleAr: n.titleAr,
      titleEn: n.titleEn,
      contentAr: n.contentAr,
      contentEn: n.contentEn,
      type: n.type,
      image: n.image,
      eventDate: n.eventDate,
      location: n.location,
      isFeatured: n.isFeatured,
      viewsCount: n.viewsCount,
      createdAt: n.createdAt
    }));

    res.json({ success: true, news });
  } catch (error) {
    console.error('getNews error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getNewsById = async (req, res) => {
  try {
    const { id } = req.params;
    const { lang = 'ar' } = req.query;

    const pool = await getPool();
    const result = await pool.request()
      .input('id', sql.Int, parseInt(id))
      .query('SELECT * FROM NewsEvents WHERE id = @id');

    if (result.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        message: { ar: 'الخبر غير موجود', en: 'News not found' }
      });
    }

    const n = result.recordset[0];
    res.json({
      success: true,
      news: {
        id: n.id,
        title: lang === 'en' ? n.titleEn : n.titleAr,
        content: lang === 'en' ? n.contentEn : n.contentAr,
        titleAr: n.titleAr,
        titleEn: n.titleEn,
        contentAr: n.contentAr,
        contentEn: n.contentEn,
        type: n.type,
        image: n.image,
        eventDate: n.eventDate,
        location: n.location,
        isFeatured: n.isFeatured,
        viewsCount: n.viewsCount,
        createdAt: n.createdAt
      }
    });
  } catch (error) {
    console.error('getNewsById error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.createNews = async (req, res) => {
  try {
    const { titleAr, titleEn, contentAr, contentEn, type, eventDate, location, isFeatured } = req.body;
    const image = req.file ? `/uploads/${req.file.filename}` : null;

    // FIX: Format date for SQL Server
    const formattedEventDate = formatDateForSQL(eventDate);

    // FIX: Parse boolean correctly from string
    const featured = parseBoolean(isFeatured);

    const pool = await getPool();
    const result = await pool.request()
      .input('titleAr', sql.NVarChar(sql.MAX), titleAr)
      .input('titleEn', sql.NVarChar(sql.MAX), titleEn)
      .input('contentAr', sql.NVarChar(sql.MAX), contentAr)
      .input('contentEn', sql.NVarChar(sql.MAX), contentEn)
      .input('type', sql.NVarChar(50), type || 'news')
      .input('image', sql.NVarChar(500), image)
      .input('eventDate', sql.DateTime, formattedEventDate)
      .input('location', sql.NVarChar(255), location || null)
      .input('isFeatured', sql.Bit, featured)
      .query(`INSERT INTO NewsEvents (titleAr, titleEn, contentAr, contentEn, type, image, eventDate, location, isFeatured)
              OUTPUT INSERTED.*
              VALUES (@titleAr, @titleEn, @contentAr, @contentEn, @type, @image, @eventDate, @location, @isFeatured)`);

    res.status(201).json({ 
      success: true, 
      message: { ar: 'تم إضافة الخبر بنجاح', en: 'News added successfully' },
      news: result.recordset[0] 
    });
  } catch (error) {
    console.error('createNews error:', error);
    res.status(500).json({ 
      success: false, 
      message: { ar: 'حدث خطأ أثناء إضافة الخبر', en: 'Error adding news' },
      error: error.message 
    });
  }
};

exports.updateNews = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const pool = await getPool();
    let setClause = [];
    const request = pool.request().input('id', sql.Int, parseInt(id));

    // FIX: Handle special fields (date, boolean, image)
    Object.keys(updates).forEach(key => {
      if (key === 'id') return;

      let value = updates[key];
      let sqlType = sql.NVarChar(sql.MAX);

      if (key === 'eventDate') {
        value = formatDateForSQL(value);
        sqlType = sql.DateTime;
      } else if (key === 'isFeatured') {
        value = parseBoolean(value);
        sqlType = sql.Bit;
      } else if (key === 'image' && req.file) {
        value = `/uploads/${req.file.filename}`;
        sqlType = sql.NVarChar(500);
      }

      setClause.push(`${key} = @${key}`);
      request.input(key, sqlType, value);
    });

    // Also handle image if uploaded but not in body
    if (req.file && !updates.image) {
      setClause.push('image = @image');
      request.input('image', sql.NVarChar(500), `/uploads/${req.file.filename}`);
    }

    const query = `UPDATE NewsEvents SET ${setClause.join(', ')} WHERE id = @id`;
    await request.query(query);

    res.json({ 
      success: true, 
      message: { ar: 'تم تحديث الخبر بنجاح', en: 'News updated successfully' } 
    });
  } catch (error) {
    console.error('updateNews error:', error);
    res.status(500).json({ 
      success: false, 
      message: { ar: 'حدث خطأ أثناء التحديث', en: 'Error updating news' },
      error: error.message 
    });
  }
};

exports.deleteNews = async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await getPool();
    await pool.request()
      .input('id', sql.Int, parseInt(id))
      .query('DELETE FROM NewsEvents WHERE id = @id');

    res.json({ 
      success: true, 
      message: { ar: 'تم حذف الخبر بنجاح', en: 'News deleted successfully' } 
    });
  } catch (error) {
    console.error('deleteNews error:', error);
    res.status(500).json({ 
      success: false, 
      message: { ar: 'حدث خطأ أثناء الحذف', en: 'Error deleting news' } 
    });
  }
};

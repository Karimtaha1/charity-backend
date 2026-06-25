const { getPool } = require('../config/database');

exports.getStories = async (req, res) => {
  try {
    const { lang = 'ar', featured, page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    const pool = await getPool();
    let query = 'SELECT * FROM SuccessStories WHERE 1=1';
    const request = pool.request();

    if (featured) {
      query += ' AND isFeatured = 1';
    }

    query += ' ORDER BY createdAt DESC OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY';
    request.input('offset', parseInt(offset));
    request.input('limit', parseInt(limit));

    const result = await request.query(query);

    const stories = result.recordset.map(s => ({
      id: s.id,
      title: lang === 'en' ? s.titleEn : s.titleAr,
      content: lang === 'en' ? s.contentEn : s.contentAr,
      titleAr: s.titleAr,
      titleEn: s.titleEn,
      contentAr: s.contentAr,
      contentEn: s.contentEn,
      beneficiaryName: s.beneficiaryName,
      category: s.category,
      image: s.image,
      videoUrl: s.videoUrl,
      isFeatured: s.isFeatured,
      viewsCount: s.viewsCount,
      createdAt: s.createdAt
    }));

    res.json({ success: true, stories });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getStory = async (req, res) => {
  try {
    const { id } = req.params;
    const { lang = 'ar' } = req.query;

    const pool = await getPool();
    const result = await pool.request()
      .input('id', id)
      .query('SELECT * FROM SuccessStories WHERE id = @id');

    if (result.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        message: { ar: 'القصة غير موجودة', en: 'Story not found' }
      });
    }

    const s = result.recordset[0];
    res.json({
      success: true,
      story: {
        id: s.id,
        title: lang === 'en' ? s.titleEn : s.titleAr,
        content: lang === 'en' ? s.contentEn : s.contentAr,
        titleAr: s.titleAr,
        titleEn: s.titleEn,
        contentAr: s.contentAr,
        contentEn: s.contentEn,
        beneficiaryName: s.beneficiaryName,
        category: s.category,
        image: s.image,
        videoUrl: s.videoUrl,
        isFeatured: s.isFeatured,
        viewsCount: s.viewsCount,
        createdAt: s.createdAt
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.createStory = async (req, res) => {
  try {
    const { titleAr, titleEn, contentAr, contentEn, beneficiaryName, category, videoUrl, isFeatured } = req.body;
    const image = req.file ? `/uploads/${req.file.filename}` : null;

    const pool = await getPool();
    const result = await pool.request()
      .input('titleAr', titleAr)
      .input('titleEn', titleEn)
      .input('contentAr', contentAr)
      .input('contentEn', contentEn)
      .input('beneficiaryName', beneficiaryName)
      .input('category', category)
      .input('image', image)
      .input('videoUrl', videoUrl || null)
      .input('isFeatured', isFeatured ? 1 : 0)
      .query(`INSERT INTO SuccessStories (titleAr, titleEn, contentAr, contentEn, beneficiaryName, category, image, videoUrl, isFeatured)
              OUTPUT INSERTED.*
              VALUES (@titleAr, @titleEn, @contentAr, @contentEn, @beneficiaryName, @category, @image, @videoUrl, @isFeatured)`);

    res.status(201).json({ success: true, story: result.recordset[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateStory = async (req, res) => {
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

    const query = `UPDATE SuccessStories SET ${setClause.join(', ')} WHERE id = @id`;
    await request.query(query);
    res.json({ success: true, message: { ar: 'تم التحديث', en: 'Updated' } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteStory = async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await getPool();
    await pool.request().input('id', id).query('DELETE FROM SuccessStories WHERE id = @id');
    res.json({ success: true, message: { ar: 'تم الحذف', en: 'Deleted' } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

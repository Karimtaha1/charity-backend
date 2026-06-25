const { getPool } = require('../config/database');

exports.createMessage = async (req, res) => {
  try {
    const { name, email, phone, subject, message } = req.body;

    const pool = await getPool();
    const result = await pool.request()
      .input('name', name)
      .input('email', email)
      .input('phone', phone || null)
      .input('subject', subject || null)
      .input('message', message)
      .query(`INSERT INTO ContactMessages (name, email, phone, subject, message)
              OUTPUT INSERTED.*
              VALUES (@name, @email, @phone, @subject, @message)`);

    res.status(201).json({
      success: true,
      message: { ar: 'تم إرسال رسالتك بنجاح', en: 'Message sent successfully' }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getMessages = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    const pool = await getPool();
    let query = 'SELECT * FROM ContactMessages WHERE 1=1';
    const request = pool.request();

    if (status) {
      query += ' AND status = @status';
      request.input('status', status);
    }

    query += ' ORDER BY createdAt DESC OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY';
    request.input('offset', parseInt(offset));
    request.input('limit', parseInt(limit));

    const result = await request.query(query);

    res.json({ success: true, messages: result.recordset });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateMessageStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const pool = await getPool();
    await pool.request()
      .input('id', id)
      .input('status', status)
      .query('UPDATE ContactMessages SET status = @status WHERE id = @id');

    res.json({ success: true, message: { ar: 'تم تحديث الحالة', en: 'Status updated' } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await getPool();
    await pool.request().input('id', id).query('DELETE FROM ContactMessages WHERE id = @id');
    res.json({ success: true, message: { ar: 'تم الحذف', en: 'Deleted' } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

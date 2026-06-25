const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getPool } = require('../config/database');

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const pool = await getPool();

    const result = await pool.request()
      .input('email', email)
      .query('SELECT * FROM Users WHERE email = @email AND isActive = 1');

    if (result.recordset.length === 0) {
      return res.status(401).json({
        success: false,
        message: { ar: 'بريد أو كلمة مرور غير صحيحة', en: 'Invalid credentials' }
      });
    }

    const user = result.recordset[0];
    const isMatch = await bcrypt.compare(password, user.passwordHash);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: { ar: 'بريد أو كلمة مرور غير صحيحة', en: 'Invalid credentials' }
      });
    }

    await pool.request()
      .input('id', user.id)
      .query('UPDATE Users SET lastLogin = GETDATE() WHERE id = @id');

    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE || '7d' }
    );

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        avatar: user.avatar
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: { ar: 'حدث خطأ أثناء تسجيل الدخول', en: 'Login failed' }
    });
  }
};

exports.getMe = async (req, res) => {
  try {
    const pool = await getPool();
    const result = await pool.request()
      .input('id', req.user.id)
      .query('SELECT id, fullName, email, role, avatar, lastLogin FROM Users WHERE id = @id');

    res.json({ success: true, user: result.recordset[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.createUser = async (req, res) => {
  try {
    const { fullName, email, phone, password, role } = req.body;
    const pool = await getPool();

    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await pool.request()
      .input('fullName', fullName)
      .input('email', email)
      .input('phone', phone)
      .input('passwordHash', hashedPassword)
      .input('role', role || 'staff')
      .query(`INSERT INTO Users (fullName, email, phone, passwordHash, role) 
              OUTPUT INSERTED.* 
              VALUES (@fullName, @email, @phone, @passwordHash, @role)`);

    res.status(201).json({ success: true, user: result.recordset[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const jwt = require('jsonwebtoken');
const { getPool } = require('../config/database');

const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ 
        success: false, 
        message: { ar: 'غير مصرح', en: 'Access denied. No token provided.' } 
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const pool = await getPool();
    const result = await pool.request()
      .input('id', decoded.id)
      .query('SELECT id, fullName, email, role, isActive FROM Users WHERE id = @id');

    if (result.recordset.length === 0) {
      return res.status(401).json({ 
        success: false, 
        message: { ar: 'المستخدم غير موجود', en: 'User not found' } 
      });
    }

    const user = result.recordset[0];
    if (!user.isActive) {
      return res.status(401).json({ 
        success: false, 
        message: { ar: 'الحساب معطل', en: 'Account is deactivated' } 
      });
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ 
      success: false, 
      message: { ar: 'توكن غير صالح', en: 'Invalid token' } 
    });
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        success: false, 
        message: { ar: 'ليس لديك صلاحية', en: 'Insufficient permissions' } 
      });
    }
    next();
  };
};

const i18n = (req, res, next) => {
  req.lang = req.headers['accept-language']?.startsWith('en') ? 'en' : 'ar';
  next();
};

const auditLog = async (req, action, tableName, recordId, oldValues, newValues) => {
  try {
    const pool = await getPool();
    await pool.request()
      .input('userId', req.user?.id || null)
      .input('action', action)
      .input('tableName', tableName)
      .input('recordId', recordId)
      .input('oldValues', JSON.stringify(oldValues))
      .input('newValues', JSON.stringify(newValues))
      .input('ipAddress', req.ip)
      .query(`INSERT INTO AuditLog (userId, action, tableName, recordId, oldValues, newValues, ipAddress) 
              VALUES (@userId, @action, @tableName, @recordId, @oldValues, @newValues, @ipAddress)`);
  } catch (err) {
    console.error('Audit log error:', err);
  }
};

module.exports = { auth, authorize, i18n, auditLog };

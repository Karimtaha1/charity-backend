const errorHandler = (err, req, res, next) => {
  console.error(err.stack);
  const lang = req.lang || 'ar';

  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: { ar: 'بيانات غير صحيحة', en: 'Validation Error' },
      errors: err.errors
    });
  }

  if (err.name === 'UnauthorizedError') {
    return res.status(401).json({
      success: false,
      message: { ar: 'غير مصرح', en: 'Unauthorized' }
    });
  }

  res.status(err.status || 500).json({
    success: false,
    message: { 
      ar: err.message || 'حدث خطأ في الخادم', 
      en: err.message || 'Internal Server Error' 
    }
  });
};

module.exports = errorHandler;

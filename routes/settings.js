const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const settingsController = require('../controllers/settingsController');
const { auth, authorize } = require('../middleware/auth');

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const relevantErrors = errors.array().filter(err => {
      const value = req.body[err.path] || req.body[err.param];
      if (!value || value === '' || value === 'null' || value === 'undefined') {
        return false;
      }
      return true;
    });
    if (relevantErrors.length > 0) {
      return res.status(400).json({
        success: false,
        message: { ar: 'بيانات غير صالحة', en: 'Invalid input data' },
        errors: relevantErrors
      });
    }
  }
  next();
};

// @route   GET /api/settings
// @desc    Get all settings
// @access  Public
router.get('/', settingsController.getSettings);

// @route   PUT /api/settings
// @desc    Update settings
// @access  Private/Admin
router.put('/', auth, authorize('admin', 'superadmin'), [
  body('siteName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 200 })
    .withMessage({ ar: 'اسم الموقع يجب أن يكون بين 2 و 200 حرف', en: 'Site name must be between 2 and 200 characters' }),
  body('siteDescription')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage({ ar: 'وصف الموقع يجب ألا يتجاوز 1000 حرف', en: 'Site description must not exceed 1000 characters' }),
  body('contactEmail')
    .optional()
    .isEmail()
    .normalizeEmail()
    .withMessage({ ar: 'البريد الإلكتروني غير صالح', en: 'Invalid email address' }),
  body('contactPhone')
    .optional()
    .trim()
    .matches(/^\+?[0-9\s\-()]{8,20}$/)
    .withMessage({ ar: 'رقم الهاتف غير صالح', en: 'Invalid phone number' }),
  body('address')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage({ ar: 'العنوان يجب ألا يتجاوز 500 حرف', en: 'Address must not exceed 500 characters' }),
  body('facebook')
    .optional()
    .trim()
    .isURL()
    .withMessage({ ar: 'رابط فيسبوك غير صالح', en: 'Invalid Facebook URL' }),
  body('twitter')
    .optional()
    .trim()
    .isURL()
    .withMessage({ ar: 'رابط تويتر غير صالح', en: 'Invalid Twitter URL' }),
  body('instagram')
    .optional()
    .trim()
    .isURL()
    .withMessage({ ar: 'رابط انستغرام غير صالح', en: 'Invalid Instagram URL' }),
  body('youtube')
    .optional()
    .trim()
    .isURL()
    .withMessage({ ar: 'رابط يوتيوب غير صالح', en: 'Invalid YouTube URL' }),
  handleValidationErrors
], settingsController.updateSettings);

module.exports = router;
const express = require('express');
const router = express.Router();
const { body, param, validationResult } = require('express-validator');
const newsController = require('../controllers/newsController');
const { auth, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    // Filter out errors from optional fields that are empty/falsy
    const relevantErrors = errors.array().filter(err => {
      const value = req.body[err.path] || req.body[err.param];
      if (!value || value === '' || value === 'null' || value === 'undefined') {
        return false; // Skip empty optional fields
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

// @route   GET /api/news
// @desc    Get all news
// @access  Public
router.get('/', newsController.getNews);

// @route   GET /api/news/:id
// @desc    Get single news
// @access  Public
router.get('/:id', [
  param('id').isInt({ min: 1 }).withMessage({ ar: 'معرف غير صالح', en: 'Invalid ID' }),
  handleValidationErrors
], newsController.getNewsById);

// @route   POST /api/news
// @desc    Create news
// @access  Private/Admin
router.post('/', auth, authorize('admin', 'superadmin'), upload.single('image'), [
  body('titleAr')
    .optional()
    .trim()
    .isLength({ min: 3, max: 200 })
    .withMessage({ ar: 'العنوان العربي يجب أن يكون بين 3 و 200 حرف', en: 'Arabic title must be between 3 and 200 characters' }),
  body('titleEn')
    .optional()
    .trim()
    .isLength({ min: 3, max: 200 })
    .withMessage({ ar: 'العنوان الإنجليزي يجب أن يكون بين 3 و 200 حرف', en: 'English title must be between 3 and 200 characters' }),
  body('contentAr')
    .optional()
    .trim()
    .isLength({ min: 10, max: 10000 })
    .withMessage({ ar: 'المحتوى العربي يجب أن يكون بين 10 و 10000 حرف', en: 'Arabic content must be between 10 and 10000 characters' }),
  body('contentEn')
    .optional()
    .trim()
    .isLength({ min: 10, max: 10000 })
    .withMessage({ ar: 'المحتوى الإنجليزي يجب أن يكون بين 10 و 10000 حرف', en: 'English content must be between 10 and 10000 characters' }),
  body('type')
    .optional()
    .trim()
    .isIn(['news', 'event', 'announcement'])
    .withMessage({ ar: 'التصنيف غير صالح', en: 'Invalid type' }),
  body('isFeatured')
    .optional()
    .isBoolean()
    .withMessage({ ar: 'حالة التمييز يجب أن تكون true أو false', en: 'isFeatured must be boolean' }),
  handleValidationErrors
], newsController.createNews);

// @route   PUT /api/news/:id
// @desc    Update news
// @access  Private/Admin
router.put('/:id', auth, authorize('admin', 'superadmin'), upload.single('image'), [
  param('id').isInt({ min: 1 }).withMessage({ ar: 'معرف غير صالح', en: 'Invalid ID' }),
  body('title')
    .optional()
    .trim()
    .isLength({ min: 3, max: 200 })
    .withMessage({ ar: 'العنوان يجب أن يكون بين 3 و 200 حرف', en: 'Title must be between 3 and 200 characters' }),
  body('content')
    .optional()
    .trim()
    .isLength({ min: 10, max: 10000 })
    .withMessage({ ar: 'المحتوى يجب أن يكون بين 10 و 10000 حرف', en: 'Content must be between 10 and 10000 characters' }),
  handleValidationErrors
], newsController.updateNews);

// @route   DELETE /api/news/:id
// @desc    Delete news
// @access  Private/Admin
router.delete('/:id', auth, authorize('admin', 'superadmin'), [
  param('id').isInt({ min: 1 }).withMessage({ ar: 'معرف غير صالح', en: 'Invalid ID' }),
  handleValidationErrors
], newsController.deleteNews);

module.exports = router;
const express = require('express');
const router = express.Router();
const { body, param, validationResult } = require('express-validator');
const storyController = require('../controllers/storyController');
const { auth, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    // Filter out errors from optional fields that are empty/falsy
    const relevantErrors = errors.array().filter(err => {
      // If the field is empty and has 'optional' in the path, skip it
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

// @route   GET /api/stories
// @desc    Get all stories
// @access  Public
router.get('/', storyController.getStories);

// @route   GET /api/stories/:id
// @desc    Get single story
// @access  Public
router.get('/:id', [
  param('id').isInt({ min: 1 }).withMessage({ ar: 'معرف غير صالح', en: 'Invalid ID' }),
  handleValidationErrors
], storyController.getStory);

// @route   POST /api/stories
// @desc    Create story
// @access  Private/Admin
router.post('/', auth, authorize('admin', 'superadmin'), upload.single('image'), [
  body('titleAr')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ min: 3, max: 200 })
    .withMessage({ ar: 'العنوان العربي يجب أن يكون بين 3 و 200 حرف', en: 'Arabic title must be between 3 and 200 characters' }),
  body('titleEn')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ min: 3, max: 200 })
    .withMessage({ ar: 'العنوان الإنجليزي يجب أن يكون بين 3 و 200 حرف', en: 'English title must be between 3 and 200 characters' }),
  body('contentAr')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ min: 10, max: 10000 })
    .withMessage({ ar: 'المحتوى العربي يجب أن يكون بين 10 و 10000 حرف', en: 'Arabic content must be between 10 and 10000 characters' }),
  body('contentEn')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ min: 10, max: 10000 })
    .withMessage({ ar: 'المحتوى الإنجليزي يجب أن يكون بين 10 و 10000 حرف', en: 'English content must be between 10 and 10000 characters' }),
  body('beneficiaryName')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 100 })
    .withMessage({ ar: 'اسم المستفيد يجب ألا يتجاوز 100 حرف', en: 'Beneficiary name must not exceed 100 characters' }),
  body('category')
    .optional({ checkFalsy: true })
    .trim()
    .isIn(['education', 'health', 'water', 'women', 'families', 'training', 'general'])
    .withMessage({ ar: 'التصنيف غير صالح', en: 'Invalid category' }),
  body('isFeatured')
    .optional({ checkFalsy: true })
    .isBoolean()
    .withMessage({ ar: 'حالة التمييز يجب أن تكون true أو false', en: 'isFeatured must be boolean' }),
  handleValidationErrors
], storyController.createStory);

// @route   PUT /api/stories/:id
// @desc    Update story
// @access  Private/Admin
router.put('/:id', auth, authorize('admin', 'superadmin'), upload.single('image'), [
  param('id').isInt({ min: 1 }).withMessage({ ar: 'معرف غير صالح', en: 'Invalid ID' }),
  body('titleAr').optional()
    .trim()
    .isLength({ min: 3, max: 200 })
    .withMessage({ ar: 'العنوان يجب أن يكون بين 3 و 200 حرف', en: 'Title must be between 3 and 200 characters' }),
  body('contentAr').optional()
    .trim()
    .isLength({ min: 10, max: 10000 })
    .withMessage({ ar: 'المحتوى يجب أن يكون بين 10 و 10000 حرف', en: 'Content must be between 10 and 10000 characters' }),
  handleValidationErrors
], storyController.updateStory);

// @route   DELETE /api/stories/:id
// @desc    Delete story
// @access  Private/Admin
router.delete('/:id', auth, authorize('admin', 'superadmin'), [
  param('id').isInt({ min: 1 }).withMessage({ ar: 'معرف غير صالح', en: 'Invalid ID' }),
  handleValidationErrors
], storyController.deleteStory);

module.exports = router;
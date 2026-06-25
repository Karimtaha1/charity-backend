const express = require('express');
const router = express.Router();
const { body, param, validationResult } = require('express-validator');
const projectController = require('../controllers/projectController');
const { auth, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');

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

// @route   GET /api/projects
// @desc    Get all projects
// @access  Public
router.get('/', projectController.getProjects);

// @route   GET /api/projects/:id
// @desc    Get single project
// @access  Public
router.get('/:id', [
  param('id').isInt({ min: 1 }).withMessage({ ar: 'معرف غير صالح', en: 'Invalid ID' }),
  handleValidationErrors
], projectController.getProject);

// @route   POST /api/projects
// @desc    Create project
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
  body('descriptionAr')
    .optional()
    .trim()
    .isLength({ min: 10, max: 5000 })
    .withMessage({ ar: 'الوصف العربي يجب أن يكون بين 10 و 5000 حرف', en: 'Arabic description must be between 10 and 5000 characters' }),
  body('descriptionEn')
    .optional()
    .trim()
    .isLength({ min: 10, max: 5000 })
    .withMessage({ ar: 'الوصف الإنجليزي يجب أن يكون بين 10 و 5000 حرف', en: 'English description must be between 10 and 5000 characters' }),
  body('goalAmount')
    .isFloat({ min: 1, max: 100000000 })
    .withMessage({ ar: 'المبلغ المستهدف يجب أن يكون بين 1 و 100,000,000', en: 'Goal amount must be between 1 and 100,000,000' }),
  body('category')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage({ ar: 'التصنيف يجب ألا يتجاوز 100 حرف', en: 'Category must not exceed 100 characters' }),
  body('location')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage({ ar: 'الموقع يجب ألا يتجاوز 200 حرف', en: 'Location must not exceed 200 characters' }),
  handleValidationErrors
], projectController.createProject);

// @route   PUT /api/projects/:id
// @desc    Update project
// @access  Private/Admin
router.put('/:id', auth, authorize('admin', 'superadmin'), upload.single('image'), [
  param('id').isInt({ min: 1 }).withMessage({ ar: 'معرف غير صالح', en: 'Invalid ID' }),
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
  body('descriptionAr')
    .optional()
    .trim()
    .isLength({ min: 10, max: 5000 })
    .withMessage({ ar: 'الوصف العربي يجب أن يكون بين 10 و 5000 حرف', en: 'Arabic description must be between 10 and 5000 characters' }),
  body('descriptionEn')
    .optional()
    .trim()
    .isLength({ min: 10, max: 5000 })
    .withMessage({ ar: 'الوصف الإنجليزي يجب أن يكون بين 10 و 5000 حرف', en: 'English description must be between 10 and 5000 characters' }),
  body('goalAmount')
    .optional()
    .isFloat({ min: 1, max: 100000000 })
    .withMessage({ ar: 'المبلغ المستهدف يجب أن يكون بين 1 و 100,000,000', en: 'Goal amount must be between 1 and 100,000,000' }),
  handleValidationErrors
], projectController.updateProject);

// @route   DELETE /api/projects/:id
// @desc    Delete project
// @access  Private/Admin
router.delete('/:id', auth, authorize('admin', 'superadmin'), [
  param('id').isInt({ min: 1 }).withMessage({ ar: 'معرف غير صالح', en: 'Invalid ID' }),
  handleValidationErrors
], projectController.deleteProject);

module.exports = router;
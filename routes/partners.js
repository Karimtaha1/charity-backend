const express = require('express');
const router = express.Router();
const { body, param, validationResult } = require('express-validator');
const partnerController = require('../controllers/partnerController');
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

// @route   GET /api/partners
// @desc    Get all partners
// @access  Public
router.get('/', partnerController.getPartners);

// @route   GET /api/partners/:id
// @desc    Get single partner
// @access  Public
router.get('/:id', [
  param('id').isInt({ min: 1 }).withMessage({ ar: 'معرف غير صالح', en: 'Invalid ID' }),
  handleValidationErrors
], partnerController.getPartner);

// @route   POST /api/partners
// @desc    Create partner
// @access  Private/Admin
router.post('/', auth, authorize('admin', 'superadmin'), upload.single('logo'), [
  body('name')
    .trim()
    .isLength({ min: 2, max: 200 })
    .withMessage({ ar: 'الاسم يجب أن يكون بين 2 و 200 حرف', en: 'Name must be between 2 and 200 characters' }),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage({ ar: 'الوصف يجب ألا يتجاوز 1000 حرف', en: 'Description must not exceed 1000 characters' }),
  body('website')
    .optional()
    .trim()
    .isURL()
    .withMessage({ ar: 'رابط الموقع غير صالح', en: 'Invalid website URL' }),
  body('email')
    .optional()
    .isEmail()
    .normalizeEmail()
    .withMessage({ ar: 'البريد الإلكتروني غير صالح', en: 'Invalid email address' }),
  handleValidationErrors
], partnerController.createPartner);

// @route   PUT /api/partners/:id
// @desc    Update partner
// @access  Private/Admin
router.put('/:id', auth, authorize('admin', 'superadmin'), upload.single('logo'), [
  param('id').isInt({ min: 1 }).withMessage({ ar: 'معرف غير صالح', en: 'Invalid ID' }),
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 200 })
    .withMessage({ ar: 'الاسم يجب أن يكون بين 2 و 200 حرف', en: 'Name must be between 2 and 200 characters' }),
  body('website')
    .optional()
    .trim()
    .isURL()
    .withMessage({ ar: 'رابط الموقع غير صالح', en: 'Invalid website URL' }),
  handleValidationErrors
], partnerController.updatePartner);

// @route   DELETE /api/partners/:id
// @desc    Delete partner
// @access  Private/Admin
router.delete('/:id', auth, authorize('admin', 'superadmin'), [
  param('id').isInt({ min: 1 }).withMessage({ ar: 'معرف غير صالح', en: 'Invalid ID' }),
  handleValidationErrors
], partnerController.deletePartner);

module.exports = router;
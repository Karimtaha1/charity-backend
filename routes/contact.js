const express = require('express');
const router = express.Router();
const { body, param, validationResult } = require('express-validator');
const contactController = require('../controllers/contactController');
const { auth, authorize } = require('../middleware/auth');

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

// @route   POST /api/contact
// @desc    Submit contact form
// @access  Public
router.post('/', [
  body('name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage({ ar: 'الاسم يجب أن يكون بين 2 و 100 حرف', en: 'Name must be between 2 and 100 characters' }),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage({ ar: 'البريد الإلكتروني غير صالح', en: 'Invalid email address' }),
  body('phone')
    .optional()
    .trim()
    .matches(/^\+?[0-9\s\-()]{8,20}$/)
    .withMessage({ ar: 'رقم الهاتف غير صالح', en: 'Invalid phone number' }),
  body('subject')
    .optional()
    .trim()
    .isLength({ min: 2, max: 200 })
    .withMessage({ ar: 'الموضوع يجب أن يكون بين 2 و 200 حرف', en: 'Subject must be between 2 and 200 characters' }),
  body('message')
    .trim()
    .isLength({ min: 5, max: 2000 })
    .withMessage({ ar: 'الرسالة يجب أن تكون بين 5 و 2000 حرف', en: 'Message must be between 5 and 2000 characters' }),
  handleValidationErrors
], contactController.createMessage);

// @route   GET /api/contact
// @desc    Get all contact submissions
// @access  Private/Admin
router.get('/', auth, authorize('admin', 'superadmin'), contactController.getMessages);

// @route   GET /api/contact/:id
// @desc    Get single contact
// @access  Private/Admin
router.get('/:id', auth, authorize('admin', 'superadmin'), [
  param('id').isInt({ min: 1 }).withMessage({ ar: 'معرف غير صالح', en: 'Invalid ID' }),
  handleValidationErrors
], contactController.getMessages);

// @route   PUT /api/contact/:id
// @desc    Update contact status
// @access  Private/Admin
router.put('/:id', auth, authorize('admin', 'superadmin'), [
  param('id').isInt({ min: 1 }).withMessage({ ar: 'معرف غير صالح', en: 'Invalid ID' }),
  handleValidationErrors
], contactController.updateMessageStatus);

// @route   PUT /api/contact/:id/status
// @desc    Update contact status (alternative endpoint)
// @access  Private/Admin
router.put('/:id/status', auth, authorize('admin', 'superadmin'), [
  param('id').isInt({ min: 1 }).withMessage({ ar: 'معرف غير صالح', en: 'Invalid ID' }),
  handleValidationErrors
], contactController.updateMessageStatus);

// @route   DELETE /api/contact/:id
// @desc    Delete contact
// @access  Private/Admin
router.delete('/:id', auth, authorize('admin', 'superadmin'), [
  param('id').isInt({ min: 1 }).withMessage({ ar: 'معرف غير صالح', en: 'Invalid ID' }),
  handleValidationErrors
], contactController.deleteMessage);

module.exports = router;
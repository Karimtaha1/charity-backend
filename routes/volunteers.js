const express = require('express');
const router = express.Router();
const { body, param, validationResult } = require('express-validator');
const volunteerController = require('../controllers/volunteerController');
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

// @route   POST /api/volunteers
// @desc    Register volunteer
// @access  Public
router.post('/', [
  body('fullName')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage({ ar: 'الاسم يجب أن يكون بين 2 و 100 حرف', en: 'Full name must be between 2 and 100 characters' }),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage({ ar: 'البريد الإلكتروني غير صالح', en: 'Invalid email address' }),
  body('phone')
    .optional()
    .trim()
    .matches(/^\+?[0-9\s\-()]{8,20}$/)
    .withMessage({ ar: 'رقم الهاتف غير صالح', en: 'Invalid phone number' }),
  body('governorate')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage({ ar: 'المحافظة يجب أن تكون بين 2 و 50 حرف', en: 'Governorate must be between 2 and 50 characters' }),
  body('field')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage({ ar: 'مجال التطوع يجب أن يكون بين 2 و 100 حرف', en: 'Field must be between 2 and 100 characters' }),
  body('skills')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage({ ar: 'المهارات يجب ألا تتجاوز 500 حرف', en: 'Skills must not exceed 500 characters' }),
  handleValidationErrors
], volunteerController.createVolunteer);

// @route   GET /api/volunteers
// @desc    Get all volunteers
// @access  Private/Admin
router.get('/', auth, authorize('admin', 'superadmin'), volunteerController.getVolunteers);

// @route   PUT /api/volunteers/:id
// @desc    Update volunteer status
// @access  Private/Admin
router.put('/:id', auth, authorize('admin', 'superadmin'), [
  param('id').isInt({ min: 1 }).withMessage({ ar: 'معرف غير صالح', en: 'Invalid ID' }),
  body('status')
    .optional()
    .isIn(['pending', 'approved', 'rejected'])
    .withMessage({ ar: 'الحالة غير صالحة', en: 'Invalid status' }),
  handleValidationErrors
], volunteerController.updateVolunteerStatus);

module.exports = router;
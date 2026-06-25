const express = require('express');
const router = express.Router();
const { body, param, validationResult } = require('express-validator');
const donationController = require('../controllers/donationController');
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

// @route   POST /api/donations
// @desc    Create donation
// @access  Public
router.post('/', [
  body('donorName')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage({ ar: 'اسم المتبرع يجب أن يكون بين 2 و 100 حرف', en: 'Donor name must be between 2 and 100 characters' }),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage({ ar: 'البريد الإلكتروني غير صالح', en: 'Invalid email address' }),
  body('phone')
    .optional()
    .trim()
    .matches(/^\+?[0-9\s\-()]{8,20}$/)
    .withMessage({ ar: 'رقم الهاتف غير صالح', en: 'Invalid phone number' }),
  body('amount')
    .isFloat({ min: 1, max: 1000000 })
    .withMessage({ ar: 'المبلغ يجب أن يكون بين 1 و 1,000,000', en: 'Amount must be between 1 and 1,000,000' }),
  body('projectId')
    .optional()
    .isInt({ min: 1 })
    .withMessage({ ar: 'معرف المشروع غير صالح', en: 'Invalid project ID' }),
  body('paymentMethod')
    .optional()
    .trim()
    .isIn(['cash', 'bank_transfer', 'fawry', 'vodafone_cash', 'instapay'])
    .withMessage({ ar: 'طريقة الدفع غير صالحة', en: 'Invalid payment method' }),
  body('message')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage({ ar: 'الرسالة يجب ألا تتجاوز 500 حرف', en: 'Message must not exceed 500 characters' }),
  handleValidationErrors
], donationController.createDonation);

// @route   GET /api/donations
// @desc    Get all donations
// @access  Private/Admin
router.get('/', auth, authorize('admin', 'superadmin'), donationController.getDonations);

// @route   GET /api/donations/summary
// @desc    Get donation summary
// @access  Private/Admin
router.get('/summary', auth, authorize('admin', 'superadmin'), donationController.getDonationSummary);

// @route   PUT /api/donations/:id
// @desc    Update donation status
// @access  Private/Admin
router.put('/:id', auth, authorize('admin', 'superadmin'), [
  param('id').isInt({ min: 1 }).withMessage({ ar: 'معرف غير صالح', en: 'Invalid ID' }),
  body('status')
    .optional()
    .isIn(['pending', 'completed', 'failed'])
    .withMessage({ ar: 'الحالة غير صالحة', en: 'Invalid status' }),
  handleValidationErrors
], donationController.updateDonationStatus);

module.exports = router;
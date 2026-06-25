const express = require('express');
const router = express.Router();
const donationStatsController = require('../controllers/donationStatsController');
const { auth, authorize } = require('../middleware/auth');

// @route   GET /api/donation-stats
// @desc    Get donation stats (Public)
router.get('/', donationStatsController.getDonationStats);

// @route   PUT /api/donation-stats
// @desc    Update donation stats (Admin only)
// @access  Private/Admin
router.put('/', auth, authorize('admin', 'superadmin'), donationStatsController.updateDonationStats);

module.exports = router;

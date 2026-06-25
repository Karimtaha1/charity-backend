const express = require('express');
const router = express.Router();
const { auth, authorize } = require('../middleware/auth');
const dashboardController = require('../controllers/dashboardController');

// @route   GET /api/dashboard/stats
// @desc    Get dashboard statistics
// @access  Private/Admin
router.get('/stats', auth, authorize('admin', 'superadmin'), dashboardController.getDashboardStats);

// @route   GET /api/dashboard/public-stats
// @desc    Get public statistics
// @access  Public
router.get('/public-stats', dashboardController.getPublicStats);

module.exports = router;
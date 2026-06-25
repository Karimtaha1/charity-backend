const { getPool } = require('../config/database');

function calculateChange(current, previous) {
  if (!previous || previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 100);
}

exports.getDashboardStats = async (req, res) => {
  try {
    const pool = await getPool();

    const [
      totalDonations,
      monthlyDonations,
      lastMonthDonations,
      totalProjects,
      activeProjects,
      lastMonthProjects,
      totalVolunteers,
      pendingVolunteers,
      lastMonthVolunteers,
      totalBeneficiaries,
      lastMonthBeneficiaries,
      totalMessages,
      unreadMessages,
      donationsByMonth,
      projectsByCategory,
      recentDonations,
      recentVolunteers,
      recentMessages
    ] = await Promise.all([
      pool.request().query("SELECT ISNULL(SUM(amount), 0) as total FROM Donations WHERE paymentStatus = 'completed'"),
      pool.request().query("SELECT ISNULL(SUM(amount), 0) as total FROM Donations WHERE paymentStatus = 'completed' AND MONTH(createdAt) = MONTH(GETDATE()) AND YEAR(createdAt) = YEAR(GETDATE())"),
      pool.request().query("SELECT ISNULL(SUM(amount), 0) as total FROM Donations WHERE paymentStatus = 'completed' AND MONTH(createdAt) = MONTH(DATEADD(MONTH, -1, GETDATE())) AND YEAR(createdAt) = YEAR(DATEADD(MONTH, -1, GETDATE()))"),
      pool.request().query("SELECT COUNT(*) as count FROM Projects"),
      pool.request().query("SELECT COUNT(*) as count FROM Projects WHERE status = 'active'"),
      pool.request().query("SELECT COUNT(*) as count FROM Projects WHERE MONTH(createdAt) = MONTH(DATEADD(MONTH, -1, GETDATE())) AND YEAR(createdAt) = YEAR(DATEADD(MONTH, -1, GETDATE()))"),
      pool.request().query("SELECT COUNT(*) as count FROM Volunteers WHERE status = 'approved'"),
      pool.request().query("SELECT COUNT(*) as count FROM Volunteers WHERE status = 'pending'"),
      pool.request().query("SELECT COUNT(*) as count FROM Volunteers WHERE status = 'approved' AND MONTH(createdAt) = MONTH(DATEADD(MONTH, -1, GETDATE())) AND YEAR(createdAt) = YEAR(DATEADD(MONTH, -1, GETDATE()))"),
      pool.request().query("SELECT COUNT(*) as count FROM Beneficiaries"),
      pool.request().query("SELECT COUNT(*) as count FROM Beneficiaries WHERE MONTH(createdAt) = MONTH(DATEADD(MONTH, -1, GETDATE())) AND YEAR(createdAt) = YEAR(DATEADD(MONTH, -1, GETDATE()))"),
      pool.request().query("SELECT COUNT(*) as count FROM ContactMessages"),
      pool.request().query("SELECT COUNT(*) as count FROM ContactMessages WHERE status = 'unread'"),
      pool.request().query("SELECT DATENAME(MONTH, createdAt) as month, SUM(amount) as total FROM Donations WHERE paymentStatus = 'completed' AND createdAt >= DATEADD(MONTH, -5, GETDATE()) GROUP BY DATENAME(MONTH, createdAt), MONTH(createdAt) ORDER BY MONTH(createdAt)"),
      pool.request().query("SELECT category, COUNT(*) as count, SUM(raisedAmount) as raised FROM Projects GROUP BY category"),
      pool.request().query("SELECT TOP 10 d.*, p.titleAr as projectTitle FROM Donations d LEFT JOIN Projects p ON d.projectId = p.id ORDER BY d.createdAt DESC"),
      pool.request().query("SELECT TOP 10 * FROM Volunteers ORDER BY createdAt DESC"),
      pool.request().query("SELECT TOP 10 * FROM ContactMessages ORDER BY createdAt DESC")
    ]);

    res.json({
      success: true,
      stats: {
        totalDonations: totalDonations.recordset[0].total,
        monthlyDonations: monthlyDonations.recordset[0].total,
        totalProjects: totalProjects.recordset[0].count,
        activeProjects: activeProjects.recordset[0].count,
        totalVolunteers: totalVolunteers.recordset[0].count,
        pendingVolunteers: pendingVolunteers.recordset[0].count,
        totalBeneficiaries: totalBeneficiaries.recordset[0].count,
        totalMessages: totalMessages.recordset[0].count,
        unreadMessages: unreadMessages.recordset[0].count,
        // Month-over-month changes (calculated dynamically)
        donationChange: calculateChange(monthlyDonations.recordset[0].total, lastMonthDonations.recordset[0].total),
        donationChangeDirection: monthlyDonations.recordset[0].total >= lastMonthDonations.recordset[0].total ? 'up' : 'down',
        beneficiariesChange: calculateChange(totalBeneficiaries.recordset[0].count, lastMonthBeneficiaries.recordset[0].count),
        beneficiariesChangeDirection: totalBeneficiaries.recordset[0].count >= lastMonthBeneficiaries.recordset[0].count ? 'up' : 'down',
        projectsChange: calculateChange(activeProjects.recordset[0].count, lastMonthProjects.recordset[0].count),
        projectsChangeDirection: activeProjects.recordset[0].count >= lastMonthProjects.recordset[0].count ? 'up' : 'down',
        volunteersChange: calculateChange(totalVolunteers.recordset[0].count, lastMonthVolunteers.recordset[0].count),
        volunteersChangeDirection: totalVolunteers.recordset[0].count >= lastMonthVolunteers.recordset[0].count ? 'up' : 'down'
      },
      charts: {
        donationsByMonth: donationsByMonth.recordset,
        projectsByCategory: projectsByCategory.recordset
      },
      recent: {
        donations: recentDonations.recordset,
        volunteers: recentVolunteers.recordset,
        messages: recentMessages.recordset
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getPublicStats = async (req, res) => {
  try {
    const pool = await getPool();

    const result = await pool.request().query(`
      SELECT 
        (SELECT ISNULL(SUM(amount), 0) FROM Donations WHERE paymentStatus = 'completed') as totalDonations,
        (SELECT COUNT(*) FROM Beneficiaries) as totalBeneficiaries,
        (SELECT COUNT(*) FROM Projects) as totalProjects,
        (SELECT COUNT(*) FROM Projects WHERE status = 'active') as activeProjects,
        (SELECT COUNT(*) FROM Volunteers WHERE status = 'approved') as totalVolunteers,
        (SELECT COUNT(*) FROM SuccessStories) as totalStories
    `);

    const stats = result.recordset[0];

    // Calculate goals percentage based on active projects ratio
    const goalsPercentage = Math.min(95, Math.round((stats.activeProjects / Math.max(stats.totalProjects, 1)) * 100 + 70));

    res.json({ 
      success: true, 
      stats: {
        totalDonations: stats.totalDonations,
        totalBeneficiaries: stats.totalBeneficiaries,
        totalProjects: stats.totalProjects,
        activeProjects: stats.activeProjects,
        totalVolunteers: stats.totalVolunteers,
        totalStories: stats.totalStories,
        goalsPercentage: goalsPercentage
      }
    });
  } catch (error) {
    console.error('Error in getPublicStats:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};
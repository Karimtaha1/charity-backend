const { getPool } = require('../config/database');

// Get donation stats
exports.getDonationStats = async (req, res) => {
  try {
    const pool = await getPool();
    const result = await pool.request().query('SELECT * FROM DonationStats WHERE id = 1');

    if (result.recordset.length === 0) {
      // Create default record if not exists
      await pool.request().query(`
        INSERT INTO DonationStats (id, totalDonations, monthlyDonations, yearlyDonations, updatedAt)
        VALUES (1, 0, 0, 0, GETDATE())
      `);
      return res.json({
        success: true,
        stats: { totalDonations: 0, monthlyDonations: 0, yearlyDonations: 0 }
      });
    }

    res.json({ success: true, stats: result.recordset[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update donation stats
exports.updateDonationStats = async (req, res) => {
  try {
    const { totalDonations, monthlyDonations, yearlyDonations } = req.body;
    const pool = await getPool();

    // Check if record exists
    const checkResult = await pool.request().query('SELECT id FROM DonationStats WHERE id = 1');

    if (checkResult.recordset.length === 0) {
      // Insert new record
      await pool.request()
        .input('totalDonations', totalDonations || 0)
        .input('monthlyDonations', monthlyDonations || 0)
        .input('yearlyDonations', yearlyDonations || 0)
        .query(`
          INSERT INTO DonationStats (id, totalDonations, monthlyDonations, yearlyDonations, updatedAt)
          VALUES (1, @totalDonations, @monthlyDonations, @yearlyDonations, GETDATE())
        `);
    } else {
      // Update existing record
      await pool.request()
        .input('totalDonations', totalDonations || 0)
        .input('monthlyDonations', monthlyDonations || 0)
        .input('yearlyDonations', yearlyDonations || 0)
        .query(`
          UPDATE DonationStats 
          SET totalDonations = @totalDonations,
              monthlyDonations = @monthlyDonations,
              yearlyDonations = @yearlyDonations,
              updatedAt = GETDATE()
          WHERE id = 1
        `);
    }

    res.json({
      success: true,
      message: { ar: 'تم تحديث إحصائيات التبرعات', en: 'Donation stats updated' }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

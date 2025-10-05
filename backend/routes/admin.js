const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const authenticateToken = require('../middleware/authenticateToken');
const ResolvedReport = require('../models/ResolvedReport');

router.post('/login', adminController.login);
router.post('/register', adminController.register);
router.patch('/reports/:reportId/status', adminController.updateReportStatus);

// Get all resolved reports
router.get('/resolved-reports', async (req, res) => {
  try {
    const resolvedReports = await ResolvedReport.find()
      .populate('user', 'fName lName email')
      .sort({ resolvedAt: -1 });
    res.json(resolvedReports);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});


module.exports = router;
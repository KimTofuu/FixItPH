const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authenticateToken, isAdmin } = require('../middleware/authenticateToken');

router.post('/register', adminController.register);
router.post('/login', adminController.login);

router.get('/profile', authenticateToken, isAdmin, adminController.getProfile);
router.patch('/profile', authenticateToken, isAdmin, adminController.updateProfile);

router.patch('/reports/:reportId/status', authenticateToken, isAdmin, adminController.updateReportStatus);

// Delete flagged reports (add these with your other admin routes)
router.delete('/reports/:reportId/delete-flagged', authenticateToken, isAdmin, adminController.deleteFlaggedReport);
router.post('/reports/batch-delete', authenticateToken, isAdmin, adminController.batchDeleteReports);
router.delete('/reports/:reportId/delete-and-warn', authenticateToken, isAdmin, adminController.deleteReportAndWarnUser);

module.exports = router;
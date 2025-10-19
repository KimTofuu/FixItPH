const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const { upload } = require('../config/multer'); // Import from multer config
const authenticateToken = require('../middleware/authenticateToken');

router.post('/', authenticateToken, upload.single('image'), reportController.createReport);
router.get('/', reportController.getAllReports);
router.get('/getAllReports', reportController.getAllReports);
router.get('/getAllPendingReports', reportController.getAllPendingReports);
router.get('/getAllInProgressReports', reportController.getAllInProgressReports);
router.get('/getAllResolvedReports', reportController.getAllResolvedReports);

// new endpoints used by frontend
router.get('/resolvedReports', reportController.getResolvedReports);
router.get('/resolvedReports/count', reportController.getResolvedReportsCount);

router.post('/getReport', reportController.getReport);
router.post('/getReportByUser', reportController.getReportByUser);
router.get('/my', authenticateToken, reportController.getMyReports);
router.post('/:id/comment', authenticateToken, reportController.addComment);
router.delete('/:id', authenticateToken, reportController.deleteReport);
router.patch('/:id', authenticateToken, upload.single('image'), reportController.updateReport);

module.exports = router;
const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');

router.post('/', reportController.createReport);
router.get('/', reportController.getAllReports);
router.get('/getAllReports', reportController.getAllReports);
router.get('/getAllPendingReports', reportController.getAllPendingReports);
router.get('/getAllInProgressReports', reportController.getAllInProgressReports);
router.get('/getAllResolvedReports', reportController.getAllResolvedReports);
router.post('/getReport', reportController.getReport);
router.post('/getReportByUser', reportController.getReportByUser);

module.exports = router;
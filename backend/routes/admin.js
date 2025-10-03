const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');

router.post('/login', adminController.login);
router.post('/register', adminController.register);
router.patch('/reports/:reportId/status', adminController.updateReportStatus);

module.exports = router;
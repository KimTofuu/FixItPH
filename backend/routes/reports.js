const express = require('express');
const router = express.Router();
const multer = require('multer');
const reportController = require('../controllers/reportController');
const { authenticateToken, isAdmin } = require('../middleware/authenticateToken');

// --- Configure Multer for File Uploads ---
// This is the missing part. It tells multer where to temporarily save files.
const storage = multer.diskStorage({}); 

// This filter ensures only image and video files are accepted.
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/')) {
    cb(null, true);
  } else {
    cb(new Error('Not an image or video file!'), false);
  }
};

const upload = multer({ storage, fileFilter });
// --- End of Multer Config ---


// --- USER ROUTES ---
router.get('/', reportController.getAllReports);
router.post('/', authenticateToken, upload.single('image'), reportController.createReport);
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

// --- ADMIN ROUTES ---
router.get('/admin/reports-for-approval', authenticateToken, isAdmin, reportController.getReportsForApproval);
router.patch('/admin/reports/:id/approve', authenticateToken, isAdmin, reportController.approveReport);
router.delete('/admin/reports/:id/reject', authenticateToken, isAdmin, reportController.rejectReport); // Add this line

module.exports = router;
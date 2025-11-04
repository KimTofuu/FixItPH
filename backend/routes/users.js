const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticateToken } = require('../middleware/authenticateToken');
const { upload } = require('../config/cloudinaryConfig'); // ✅ Import Cloudinary upload

// Auth routes
router.post('/register', userController.register);
router.post('/login', userController.login);
router.post('/logout', userController.logout);

// Profile routes
router.get('/me', authenticateToken, userController.getMyProfile);
router.get('/profile', authenticateToken, userController.getProfile);
router.patch('/profile', authenticateToken, userController.updateProfile);
router.patch('/change-password', authenticateToken, userController.changePassword);

// ✅ CHANGE THIS LINE - Use Cloudinary upload instead of old multer
router.post(
  '/me/profile-picture',
  authenticateToken,
  upload.single('profilePicture'), // This uploads to Cloudinary
  userController.uploadProfilePicture
);

router.delete('/me/profile-picture', authenticateToken, userController.deleteProfilePicture);

// Password reset
router.post('/forgot-password', userController.forgotPassword);
router.post('/reset-password', userController.resetPassword);

// Other routes
router.get('/all', userController.getAllUsers);
router.post('/get-user', userController.getUser);

module.exports = router;
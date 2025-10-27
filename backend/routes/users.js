const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticateToken } = require('../middleware/authenticateToken');
const upload = require('../middleware/upload');
const otpController = require('../controllers/otpController');

// Public auth routes
router.post('/register', userController.register);
router.post('/login', userController.login);
router.post('/logout', userController.logout);

// Admin/utility routes
router.get('/getAllUsers', userController.getAllUsers);
router.post('/getUser', userController.getUser);
router.get('/protected', authenticateToken, userController.protected);

// Current user profile routes (use /me only)
router.get('/me', authenticateToken, userController.getProfile);
router.patch('/me', authenticateToken, userController.updateProfile);

// Password management
router.post('/change-password', authenticateToken, userController.changePassword);

// Password reset routes
router.post('/forgot-password', userController.forgotPassword);
router.post('/reset-password', userController.resetPassword);

// Profile picture routes
router.post('/me/profile-picture', authenticateToken, upload.single('profilePicture'), userController.uploadProfilePicture);
router.delete('/me/profile-picture', authenticateToken, userController.deleteProfilePicture);

// OTP routes
router.post('/request-otp', otpController.requestOtp);
router.post('/verify-otp', otpController.verifyOtp);
router.post('/request-sms-otp', otpController.requestSmsOtp);
router.post('/verify-sms-otp', authenticateToken, otpController.verifySmsOtp);

module.exports = router;
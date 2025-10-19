const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const jwt = require('jsonwebtoken');
const { upload, uploadProfilePicture } = require("../config/multer");
const otpController = require('../controllers/otpController');

// JWT authentication middleware
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.sendStatus(401);

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
}

require('dotenv').config();

// Auth routes
router.post('/register', userController.register);
router.post('/login', userController.login);
router.post('/logout', userController.logout);

// User routes
router.get('/getAllUsers', userController.getAllUsers);
router.post('/getUser', userController.getUser);
router.get('/protected', authenticateToken, userController.protected);

// Current user profile routes
router.get('/me', authenticateToken, userController.getMe);
router.patch('/me', authenticateToken, userController.updateMe);
router.get('/profile', authenticateToken, userController.getProfile);
router.patch('/profile', authenticateToken, userController.updateProfile);

// Profile picture routes
router.post('/me/profile-picture', authenticateToken, uploadProfilePicture.single('profilePicture'), userController.uploadProfilePicture);
router.delete('/me/profile-picture', authenticateToken, userController.deleteProfilePicture);

// OTP routes
router.post('/request-otp', otpController.requestOtp);
router.post('/verify-otp', otpController.verifyOtp);
router.post('/request-sms-otp', otpController.requestSmsOtp);
router.post('/verify-sms-otp', authenticateToken, otpController.verifySmsOtp);

module.exports = router;
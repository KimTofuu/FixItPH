const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const jwt = require('jsonwebtoken');
const upload = require("../config/multer");
const { uploadProfilePic } = require("../controllers/userController");
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

router.post('/register', userController.register);
router.post('/login', userController.login);
router.get('/getAllUsers', userController.getAllUsers);
router.post('/getUser', userController.getUser);
router.post('/logout', userController.logout);
router.get('/protected', authenticateToken, userController.protected);
router.post('/request-otp', otpController.requestOtp);
router.post('/verify-otp', otpController.verifyOtp);

router.get('/me', authenticateToken, userController.getMe);
router.patch('/me', authenticateToken, userController.updateMe);

router.post('/request-sms-otp', otpController.requestSmsOtp);
router.post('/verify-sms-otp', authenticateToken, otpController.verifySmsOtp);

// new endpoints for current user
router.get('/profile', authenticateToken, userController.getProfile);
router.patch('/profile', authenticateToken, userController.updateProfile);

module.exports = router;
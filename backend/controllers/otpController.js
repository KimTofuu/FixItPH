const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const EmailOtp = require('../models/EmailOtp');
const User = require('../models/Users');
const { sendOtpEmail } = require('../utils/emailService');

exports.requestOtp = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Email is required' });

    // generate 6-digit numeric OTP
    const otp = String(Math.floor(100000 + Math.random() * 900000));
    const otpHash = await bcrypt.hash(otp, 10);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // upsert OTP record
    await EmailOtp.findOneAndUpdate(
      { email },
      { otpHash, expiresAt },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    // send email (may throw)
    await sendOtpEmail(email, otp);

    return res.json({ success: true, message: 'OTP sent' });
  } catch (err) {
    console.error('requestOtp error', err);
    return res.status(500).json({ success: false, message: 'Failed to send OTP' });
  }
};

exports.verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) return res.status(400).json({ message: 'Email and OTP required' });

    const record = await EmailOtp.findOne({ email });
    if (!record) return res.status(400).json({ message: 'No OTP requested for this email' });
    if (record.expiresAt < new Date()) {
      await EmailOtp.deleteOne({ email });
      return res.status(400).json({ message: 'OTP expired' });
    }

    const match = await bcrypt.compare(otp, record.otpHash);
    if (!match) return res.status(400).json({ message: 'Invalid OTP' });

    // valid: delete OTP and respond success
    await EmailOtp.deleteOne({ email });
    return res.json({ success: true, message: 'Email verified' });
  } catch (err) {
    console.error('verifyOtp error', err);
    return res.status(500).json({ success: false, message: 'OTP verification failed' });
  }
};
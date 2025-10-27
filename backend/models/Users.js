const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  fName: {
    type: String,
    required: true,
  },
  lName: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  contact: {
    type: String,
    required: false,
    default: '',
  },
  password: {
    type: String,
    required: false,
    default: '',
  },
  barangay: {
    type: String,
    required: false,
    default: '',
  },
  municipality: {
    type: String,
    required: false,
    default: '',
  },
  profilePicture: {
    url: { type: String, default: '' },
    public_id: { type: String, default: '' },
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user',
  },
  // Add these fields for password reset
  resetPasswordToken: {
    type: String,
  },
  resetPasswordExpires: {
    type: Date,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('User', userSchema);

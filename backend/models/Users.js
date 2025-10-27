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
    required: false, // Changed to optional
    default: '',
  },
  password: {
    type: String,
    required: false, // Changed to optional (Google users don't have password)
    default: '',
  },
  barangay: {
    type: String,
    required: false, // Changed to optional
    default: '',
  },
  municipality: {
    type: String,
    required: false, // Changed to optional
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
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('User', userSchema);

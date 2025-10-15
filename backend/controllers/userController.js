const bcrypt = require('bcryptjs');
const User = require('../models/Users');
const jwt = require('jsonwebtoken');
const cloudinary = require("../config/cloudinary");

// Registration
exports.register = async (req, res) => {
  try {
    const { fName, lName, email, contact, password, confirmPassword, barangay, municipality } = req.body;
    if (password !== confirmPassword) {
      return res.status(400).json({ message: 'Passwords do not match' });
    }
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ fName, lName, email, contact, password: hashedPassword, barangay, municipality });
    await newUser.save();
    res.status(201).json({ success: true, message: 'User registered successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
    console.error(err);
  }
};

// Login
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.cookie('token', token, { httpOnly: true, secure: true, sameSite: 'strict' });
    res.status(200).json({ message: 'Login successful', token });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
    console.error(err);
  }
};

// Get all users
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find({}, '-password');
    res.status(200).json(users);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
    console.error(err);
  }
};

// Get user by ID
exports.getUser = async (req, res) => {
  try {
    const { id } = req.body;
    const user = await User.findById(id, '-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.status(200).json(user);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
    console.error(err);
  }
};

// Logout
exports.logout = (req, res) => {
  res.clearCookie('token');
  res.status(200).json({ message: 'Logout successful' });
};

// Protected route example
exports.protected = (req, res) => {
  res.json({ message: 'This is a protected route', user: req.user });
};

// Get current logged-in user
exports.getProfile = async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const user = await User.findById(userId, '-password');
    if (!user) return res.status(404).json({ message: 'User not found' });

    return res.status(200).json(user);
  } catch (err) {
    console.error('getMe error', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

// Update current logged-in user
exports.updateProfile = async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const updates = {};
    // Remove 'password' from allowed fields
    const allowed = ['fName','lName','email','contact','barangay','municipality'];

    for (const key of allowed) {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    }

    // Remove password hashing logic since password updates not allowed here
    
    const updated = await User.findByIdAndUpdate(userId, updates, { new: true, select: '-password' });
    if (!updated) return res.status(404).json({ message: 'User not found' });

    return res.status(200).json(updated);
  } catch (err) {
    console.error('updateMe error', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

// Get current logged-in user
exports.getMe = async (req, res) => {
  try {
    const userId = req.user?.userId || req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const user = await User.findById(userId).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    return res.status(200).json(user);
  } catch (err) {
    console.error('getMe error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

// Update current logged-in user
exports.updateMe = async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const updates = {};
    // Allow these fields to be updated
    const allowed = ['fName', 'lName', 'email', 'contact', 'barangay', 'municipality', 'contactVerified'];

    for (const key of allowed) {
      if (req.body[key] !== undefined) {
        updates[key] = req.body[key];
      }
    }

    const updated = await User.findByIdAndUpdate(
      userId, 
      updates, 
      { new: true, select: '-password' }
    );
    
    if (!updated) {
      return res.status(404).json({ message: 'User not found' });
    }

    return res.status(200).json(updated);
  } catch (err) {
    console.error('updateMe error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};
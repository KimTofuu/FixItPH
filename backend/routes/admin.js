const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const Admin = require('../models/Admins'); // Use the Admin model
const jwt = require('jsonwebtoken');

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find admin by email
    const admin = await Admin.findOne({ officialEmail: email });
    if (!admin) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Compare passwords
    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Generate JWT token
    const token = jwt.sign({ adminId: admin._id }, process.env.JWT_SECRET, { expiresIn: '1h' });

    res.status(200).json({ message: 'Login successful', token });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
    console.error(err);
  }
});

router.post('/register', async (req, res) => {
  try {
    const { barangayName, officialEmail, password, barangayAddress, officialContact, municipality } = req.body;

    // Check if admin already exists
    const existingAdmin = await Admin.findOne({ officialEmail });
    if (existingAdmin) {
      return res.status(400).json({ message: 'Admin already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10); 

    // Create new admin
    const newAdmin = new Admin({ barangayName, officialEmail, password: hashedPassword, barangayAddress, officialContact, municipality });
    await newAdmin.save();

    res.status(201).json({ message: 'Admin registered successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
    console.error(err);
  }
});

module.exports = router;
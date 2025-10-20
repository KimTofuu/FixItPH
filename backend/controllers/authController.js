const { google } = require('googleapis');
const jwt = require('jsonwebtoken');
const User = require('../models/Users');
const Admin = require('../models/Admins'); // Import the Admin model
const bcrypt = require('bcryptjs');

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI; // e.g. http://localhost:3001/auth/google/callback
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

const oauth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);

// scopes for profile & email
const SCOPES = ['profile', 'email'];

exports.googleAuth = (req, res) => {
  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    prompt: 'select_account',
  });
  res.redirect(url);
};

exports.googleCallback = async (req, res) => {
  try {
    const code = req.query.code;
    if (!code) return res.status(400).send('No code provided');

    // exchange code for tokens
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    // fetch userinfo
    const oauth2 = google.oauth2({ auth: oauth2Client, version: 'v2' });
    const { data } = await oauth2.userinfo.get();

    // data contains: id, email, verified_email, name, given_name, family_name, picture
    const email = (data.email || '').toLowerCase().trim();
    if (!email) return res.status(400).send('Google account has no email');

    // find or create user
    let user = await User.findOne({ email });
    if (!user) {
      user = new User({
        fName: data.given_name || data.name || 'User',
        lName: data.family_name || '',
        email,
        contact: '', // optional
        password: '', // no local password
        barangay: '',
        municipality: '',
        profilePicture: { url: data.picture || '', public_id: '' },
      });
      await user.save();
    }

    // Create JWT Payload with the user's role
    const payload = {
      userId: user._id,
      email: user.email,
      role: user.role, // <-- THIS IS THE CRITICAL LINE TO ADD/FIX
    };

    // Sign the token
    const token = jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: '1d' } // Set a reasonable expiration time
    );

    res.json({
      message: "Logged in successfully",
      token,
      user: {
        id: user._id,
        fName: user.fName,
        lName: user.lName,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    console.error('googleCallback error', err);
    return res.status(500).send('Authentication error');
  }
};

// --- UPDATED LOGIN FUNCTION ---
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1. First, check if the login attempt is for an Admin
    let admin = await Admin.findOne({ officialEmail: email });
    if (admin) {
      const isMatch = await bcrypt.compare(password, admin.password);
      if (!isMatch) {
        return res.status(400).json({ message: 'Invalid credentials' });
      }

      // If it's an admin, create a token with the 'admin' role
      const payload = {
        userId: admin._id,
        email: admin.officialEmail,
        role: 'admin', // <-- This is the key for your middleware
      };

      const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1d' });
      return res.json({ message: "Admin logged in successfully", token });
    }

    // 2. If not an admin, check if it's a regular User
    let user = await User.findOne({ email });
    if (user) {
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(400).json({ message: 'Invalid credentials' });
      }

      // If it's a user, create a token with the 'user' role
      const payload = {
        userId: user._id,
        email: user.email,
        role: user.role || 'user', // Default to 'user' if role is not set
      };

      const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1d' });
      return res.json({ message: "User logged in successfully", token });
    }

    // 3. If no account is found in either collection
    return res.status(400).json({ message: 'Invalid credentials' });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// --- NEW FUNCTION TO REGISTER AN ADMIN ---
exports.registerAdmin = async (req, res) => {
  try {
    const {
      barangayName,
      officialEmail,
      password,
      barangayAddress,
      officialContact,
      municipality,
    } = req.body;

    // Check if admin already exists
    let admin = await Admin.findOne({ officialEmail });
    if (admin) {
      return res.status(400).json({ message: 'Admin with this email already exists' });
    }

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create a new admin instance
    admin = new Admin({
      barangayName,
      officialEmail,
      password: hashedPassword,
      barangayAddress,
      officialContact,
      municipality,
    });

    // Save the new admin to the database
    await admin.save();

    res.status(201).json({ message: 'Admin registered successfully' });

  } catch (err) {
    console.error('Admin registration error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};
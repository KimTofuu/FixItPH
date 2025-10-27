const { google } = require('googleapis');
const User = require('../models/Users');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

exports.googleAuth = (req, res) => {
  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: ['profile', 'email'],
  });
  res.redirect(url);
};

exports.googleCallback = async (req, res) => {
  try {
    console.log('=== Google Callback Start ===');
    
    const code = req.query.code;
    
    if (!code) {
      console.error('No code received from Google');
      return res.redirect(`${FRONTEND_URL}/login?error=no_code`);
    }

    console.log('Exchanging code for tokens...');
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    console.log('Fetching user info...');
    const oauth2 = google.oauth2({ auth: oauth2Client, version: 'v2' });
    const { data } = await oauth2.userinfo.get();
    console.log('User data received:', { email: data.email, name: data.name });

    const email = (data.email || '').toLowerCase().trim();
    if (!email) {
      console.error('No email in Google user data');
      return res.redirect(`${FRONTEND_URL}/login?error=no_email`);
    }

    console.log('Looking for existing user...');
    let user = await User.findOne({ email });
    const isNewUser = !user;

    if (!user) {
      console.log('Creating new Google user...');
      
      // Generate a random password hash for Google users (won't be used)
      const randomPassword = await bcrypt.hash(Math.random().toString(36), 10);
      
      user = new User({
        fName: data.given_name || data.name?.split(' ')[0] || 'User',
        lName: data.family_name || data.name?.split(' ').slice(1).join(' ') || '',
        email: email,
        contact: '', // Optional, will be filled in profile
        password: randomPassword, // Random hash, Google users won't use it
        barangay: '', // Will be filled in profile completion
        municipality: '', // Will be filled in profile completion
        profilePicture: { 
          url: data.picture || '', 
          public_id: '' 
        },
        role: 'user',
      });
      
      await user.save();
      console.log('New Google user created:', user._id);
    } else {
      console.log('Existing user found:', user._id);
    }

    console.log('Generating JWT token...');
    const token = jwt.sign(
      {
        userId: user._id,
        email: user.email,
        role: user.role || 'user',
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Check if profile is incomplete
    const needsProfileCompletion = !user.barangay || !user.municipality;

    if (needsProfileCompletion) {
      console.log('Redirecting to welcome (profile incomplete)');
      return res.redirect(`${FRONTEND_URL}/welcome?token=${token}&new=true`);
    } else {
      console.log('Redirecting to user-map');
      return res.redirect(`${FRONTEND_URL}/user-map?token=${token}`);
    }

  } catch (err) {
    console.error('=== Google Callback Error ===');
    console.error('Error:', err.message);
    console.error('Stack:', err.stack);
    return res.redirect(`${FRONTEND_URL}/login?error=auth_failed&details=${encodeURIComponent(err.message)}`);
  }
};
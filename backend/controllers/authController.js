const { google } = require('googleapis');
const jwt = require('jsonwebtoken');
const User = require('../models/Users');

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

    // create JWT
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });

    // Option A (recommended): set HttpOnly cookie and redirect to frontend (no token in URL)
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    return res.redirect(`${FRONTEND_URL}/user-feed`);

    // Option B (if you prefer token in URL): uncomment and use instead of cookie above
    // return res.redirect(`${FRONTEND_URL}/auth/success?token=${token}`);
  } catch (err) {
    console.error('googleCallback error', err);
    return res.status(500).send('Authentication error');
  }
};
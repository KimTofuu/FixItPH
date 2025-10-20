// backend/middleware/authenticateToken.js
const jwt = require('jsonwebtoken');

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  // Send JSON for missing token
  if (!token) {
    return res.status(401).json({ message: 'Unauthorized: Token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    // Send JSON for invalid token
    if (err) {
      return res.status(403).json({ message: 'Forbidden: Invalid or expired token' });
    }
    req.user = user;
    next();
  });
}

function isAdmin(req, res, next) {
  console.log('isAdmin Check - User Payload:', req.user);
  if (req.user && req.user.role === 'admin') {
    console.log('isAdmin Check: SUCCESS');
    next();
  } else {
    console.log('isAdmin Check: FAILED - User is not an admin or role is missing.');
    res.status(403).json({ message: 'Forbidden: Admin access required' });
  }
}

module.exports = {
  authenticateToken,
  isAdmin,
};
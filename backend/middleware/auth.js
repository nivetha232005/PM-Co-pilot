// middleware/auth.js
// Verifies JWT from Authorization header and attaches req.user

const jwt  = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Protect routes — requires a valid Bearer token.
 */
async function protect(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided. Please log in.' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // Attach fresh user data (catches deactivated accounts)
    const user = await User.findById(decoded.id).select('-__v').lean();
    if (!user || !user.isActive) {
      return res.status(401).json({ error: 'User not found or deactivated.' });
    }
    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token.' });
  }
}

/**
 * Admin-only guard — must be used AFTER protect().
 */
function adminOnly(req, res, next) {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required.' });
  }
  next();
}

/**
 * Helper: sign a JWT for a user document.
 */
function signToken(user) {
  return jwt.sign(
    { id: user._id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
}

module.exports = { protect, adminOnly, signToken };

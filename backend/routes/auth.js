// routes/auth.js
// Google OAuth 2.0 flow using passport-google-oauth20
// POST /api/auth/google/token  → exchange Google ID token for our JWT (SPA flow)
// GET  /api/auth/google         → redirect flow (for testing)
// GET  /api/auth/me             → return current user

const express  = require('express');
const passport = require('passport');
const { OAuth2Client } = require('google-auth-library');
const User     = require('../models/User');
const { signToken, protect } = require('../middleware/auth');
const { sendWelcomeEmail }   = require('../services/emailService');

const router = express.Router();
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// ── SPA flow: frontend sends Google credential token, we verify & return JWT ─
// This is the recommended approach for React SPAs using Google Identity Services.
router.post('/google/token', async (req, res) => {
  const { credential } = req.body; // from Google Identity Services (GSI)
  if (!credential) return res.status(400).json({ error: 'Missing credential' });

  try {
    // 1. Verify the Google ID token
    const ticket  = await client.verifyIdToken({
      idToken:  credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();

    // 2. Find or create the user in MongoDB
    let user = await User.findOne({ googleId: payload.sub });
    const isNewUser = !user;

    if (!user) {
      // Check if email already exists (returning user who hasn't logged in via Google before)
      user = await User.findOne({ email: payload.email });
      if (user) {
        user.googleId   = payload.sub;
        user.profilePic = payload.picture || user.profilePic;
        await user.save();
      } else {
        // Brand new user
        user = await User.create({
          name:       payload.name,
          email:      payload.email,
          googleId:   payload.sub,
          profilePic: payload.picture || '',
        });
      }
    }

    // 3. Send welcome email for new users (non-blocking)
    if (isNewUser) {
      sendWelcomeEmail(user).catch(console.error);
    }

    // 4. Issue our own JWT
    const token = signToken(user);
    res.json({ token, user: { id: user._id, name: user.name, email: user.email, profilePic: user.profilePic, role: user.role } });

  } catch (err) {
    console.error('Google auth error:', err);
    res.status(401).json({ error: 'Invalid Google credential' });
  }
});

// ── Redirect flow (optional, useful for testing in browser) ─────────────────
router.get('/google',
  passport.authenticate('google', { scope: ['profile', 'email'], session: false })
);

router.get('/google/callback',
  passport.authenticate('google', { failureRedirect: `${process.env.CLIENT_URL}/login?error=oauth_failed`, session: false }),
  (req, res) => {
    const token = signToken(req.user);
    // Redirect to frontend with token in query (short-lived; frontend should store in memory/cookie)
    res.redirect(`${process.env.CLIENT_URL}?token=${token}`);
  }
);

// ── GET /api/auth/me ─────────────────────────────────────────────────────────
router.get('/me', protect, (req, res) => {
  res.json({ user: req.user });
});

module.exports = router;

// server.js — Enhanced PM Copilot Backend
// New: Google OAuth, JWT auth, in-app notifications, email service, admin updates

const express   = require('express');
const mongoose  = require('mongoose');
const cors      = require('cors');
const dotenv    = require('dotenv');
dotenv.config();
const path      = require('path');
const rateLimit = require('express-rate-limit');
const passport      = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User           = require('./models/User');

// Register Google strategy here — after dotenv.config() has already run
passport.use(
  new GoogleStrategy(
    {
      clientID:     process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL:  process.env.GOOGLE_CALLBACK_URL,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        let user = await User.findOne({ googleId: profile.id });
        if (!user) {
          user = await User.findOne({ email: profile.emails[0].value });
          if (user) {
            user.googleId   = profile.id;
            user.profilePic = profile.photos?.[0]?.value || user.profilePic;
            await user.save();
          } else {
            user = await User.create({
              name:       profile.displayName,
              email:      profile.emails[0].value,
              googleId:   profile.id,
              profilePic: profile.photos?.[0]?.value || '',
            });
          }
        }
        return done(null, user);
      } catch (err) {
        return done(err, null);
      }
    }
  )
);

dotenv.config();

const app = express();

// ── Middleware ───────────────────────────────────────────────────────────────
app.use(cors({
  origin:      process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(passport.initialize()); // ← new (session: false; we use JWT)

// Rate limiting
const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100 });
app.use('/api/', limiter);

// Tighter limit for auth endpoints (prevents brute-force)
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 20, message: 'Too many login attempts' });
app.use('/api/auth/', authLimiter);

// ── Static uploads folder ────────────────────────────────────────────────────
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ── Routes ───────────────────────────────────────────────────────────────────
// Existing routes
app.use('/api/chat',          require('./routes/chat'));
app.use('/api/upload',        require('./routes/upload'));
app.use('/api/sessions',      require('./routes/sessions'));
app.use('/api/projects',      require('./routes/projects'));

// New routes
app.use('/api/auth',          require('./routes/auth'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/updates',       require('./routes/updates'));

// ── Health check ─────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// ── Global error handler ─────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(err.status || 500).json({ error: err.message || 'Internal Server Error' });
});

// ── MongoDB ──────────────────────────────────────────────────────────────────
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => console.error('❌ MongoDB error:', err));

// ── Start ────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});

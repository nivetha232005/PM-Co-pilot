// routes/updates.js
// Admin routes for posting project updates / announcements
// POST /api/updates  → create update, trigger notifications + emails to ALL users
// GET  /api/updates  → list all updates (public, no auth needed)

const express  = require('express');
const Update   = require('../models/Update');
const User     = require('../models/User');
const { protect, adminOnly }         = require('../middleware/auth');
const { broadcastNotification }      = require('../services/notificationService');
const { sendBulkEmail }              = require('../services/emailService');

const router = express.Router();

// GET /api/updates — public feed
router.get('/', async (req, res) => {
  try {
    const updates = await Update.find()
      .sort({ createdAt: -1 })
      .populate('postedBy', 'name email')
      .lean();
    res.json({ updates });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch updates' });
  }
});

// POST /api/updates — admin only
router.post('/', protect, adminOnly, async (req, res) => {
  const { title, description, type = 'update' } = req.body;
  if (!title || !description) {
    return res.status(400).json({ error: 'title and description are required' });
  }

  try {
    // 1. Save the update
    const update = await Update.create({
      title,
      description,
      type,
      postedBy: req.user._id,
    });

    // 2. Broadcast in-app notification to all users (non-blocking)
    const notifMessage = `📢 New ${type}: "${title}"`;
    broadcastNotification({ message: notifMessage, type, link: '/updates' }).catch(console.error);

    // 3. Send email to all active users (non-blocking)
    const users = await User.find({ isActive: true }, 'name email').lean();
    sendBulkEmail(users, {
      subject: `📢 PM Copilot ${type.charAt(0).toUpperCase() + type.slice(1)}: ${title}`,
      buildBodyHtml: (user) => `
        <div style="display:inline-block;padding:2px 10px;border-radius:20px;font-size:11px;font-weight:600;background:#ede9fe;color:#7c3aed;margin-bottom:12px;">
          ${type.toUpperCase()}
        </div>
        <h2 style="margin-top:8px;">${title}</h2>
        <p>${description}</p>
        <p style="color:#9ca3af;font-size:12px;">Posted on ${new Date(update.createdAt).toLocaleString()}</p>
      `,
    }).catch(console.error);

    res.status(201).json({ update, message: 'Update posted. Notifications and emails queued.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create update' });
  }
});

// DELETE /api/updates/:id — admin only
router.delete('/:id', protect, adminOnly, async (req, res) => {
  try {
    await Update.findByIdAndDelete(req.params.id);
    res.json({ message: 'Update deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete update' });
  }
});

module.exports = router;

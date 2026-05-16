// routes/notifications.js
// GET  /api/notifications        → get user's notifications (newest first)
// PUT  /api/notifications/:id    → mark one as read
// PUT  /api/notifications/read-all → mark all as read
// DELETE /api/notifications/:id  → delete one

const express  = require('express');
const Notification = require('../models/Notification');
const { protect }  = require('../middleware/auth');
const { markAsRead, markAllAsRead } = require('../services/notificationService');

const router = express.Router();

// All notification routes require auth
router.use(protect);

// GET /api/notifications?limit=20&skip=0
router.get('/', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;
    const skip  = parseInt(req.query.skip)  || 0;

    const [notifications, unreadCount] = await Promise.all([
      Notification.find({ userId: req.user._id })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Notification.countDocuments({ userId: req.user._id, isRead: false }),
    ]);

    res.json({ notifications, unreadCount });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

// PUT /api/notifications/read-all  (must come before /:id)
router.put('/read-all', async (req, res) => {
  try {
    await markAllAsRead(req.user._id);
    res.json({ message: 'All notifications marked as read' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to mark notifications as read' });
  }
});

// PUT /api/notifications/:id
router.put('/:id', async (req, res) => {
  try {
    const notification = await markAsRead(req.params.id, req.user._id);
    if (!notification) return res.status(404).json({ error: 'Notification not found' });
    res.json({ notification });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update notification' });
  }
});

// DELETE /api/notifications/:id
router.delete('/:id', async (req, res) => {
  try {
    const deleted = await Notification.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    if (!deleted) return res.status(404).json({ error: 'Notification not found' });
    res.json({ message: 'Notification deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete notification' });
  }
});

module.exports = router;

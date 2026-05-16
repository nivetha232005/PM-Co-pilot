// models/Notification.js
// Per-user in-app notifications

const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema(
  {
    userId:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    message: { type: String, required: true },
    type:    { type: String, enum: ['feature', 'update', 'announcement', 'order', 'system'], default: 'update' },
    isRead:  { type: Boolean, default: false },
    link:    { type: String, default: '' }, // optional deep-link in the app
  },
  { timestamps: true }
);

// Compound index: fetching unread for a user is the hot path
NotificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', NotificationSchema);

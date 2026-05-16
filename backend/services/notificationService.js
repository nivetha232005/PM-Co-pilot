// services/notificationService.js
// Creates in-app notifications for one user or all users.

const Notification = require('../models/Notification');
const User         = require('../models/User');

/**
 * Create a single notification for a specific user.
 */
async function createNotification({ userId, message, type = 'update', link = '' }) {
  return Notification.create({ userId, message, type, link });
}

/**
 * Broadcast a notification to every active user in the system.
 * Uses bulk insert for efficiency.
 */
async function broadcastNotification({ message, type = 'update', link = '' }) {
  const users = await User.find({ isActive: true }, '_id').lean();
  if (!users.length) return;

  const docs = users.map(u => ({ userId: u._id, message, type, link, isRead: false }));
  await Notification.insertMany(docs, { ordered: false }); // ordered:false → don't stop on duplicate errors
  console.log(`🔔 Broadcast notification to ${docs.length} users`);
}

/**
 * Mark one notification as read.
 */
async function markAsRead(notificationId, userId) {
  return Notification.findOneAndUpdate(
    { _id: notificationId, userId },
    { isRead: true },
    { new: true }
  );
}

/**
 * Mark all of a user's notifications as read.
 */
async function markAllAsRead(userId) {
  return Notification.updateMany({ userId, isRead: false }, { isRead: true });
}

module.exports = {
  createNotification,
  broadcastNotification,
  markAsRead,
  markAllAsRead,
};

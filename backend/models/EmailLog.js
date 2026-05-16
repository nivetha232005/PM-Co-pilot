// models/EmailLog.js
// Audit trail for every outbound email

const mongoose = require('mongoose');

const EmailLogSchema = new mongoose.Schema(
  {
    to:      { type: String, required: true },
    subject: { type: String, required: true },
    status:  { type: String, enum: ['sent', 'failed'], required: true },
    error:   { type: String, default: '' }, // captured if status === 'failed'
  },
  { timestamps: true } // sentAt === createdAt
);

module.exports = mongoose.model('EmailLog', EmailLogSchema);

// models/Update.js
// Admin-posted project updates / announcements

const mongoose = require('mongoose');

const UpdateSchema = new mongoose.Schema(
  {
    title:       { type: String, required: true, trim: true },
    description: { type: String, required: true },
    type:        { type: String, enum: ['feature', 'update', 'announcement'], default: 'update' },
    postedBy:    { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Update', UpdateSchema);

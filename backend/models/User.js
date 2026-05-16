// models/User.js
// Stores Google OAuth users + JWT auth data

const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema(
  {
    name:       { type: String, required: true, trim: true },
    email:      { type: String, required: true, unique: true, lowercase: true, trim: true },
    googleId:   { type: String, unique: true, sparse: true }, // sparse: allows multiple nulls
    profilePic: { type: String, default: '' },
    role:       { type: String, enum: ['user', 'admin'], default: 'user' },
    isActive:   { type: Boolean, default: true },
  },
  { timestamps: true }
);

// Index for fast lookup by googleId
UserSchema.index({ googleId: 1 });

module.exports = mongoose.model('User', UserSchema);

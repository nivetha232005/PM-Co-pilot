const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
  role: { type: String, enum: ['user', 'assistant'], required: true },
  content: { type: String, required: true },
  timestamp: { type: Date, default: Date.now }
});

const FileSchema = new mongoose.Schema({
  filename: String,
  storedAs: String,
  size: String,
  pages: Number,
  wordCount: Number,
  uploadedAt: { type: Date, default: Date.now }
});

const SessionSchema = new mongoose.Schema({
  projectName: { type: String, default: 'Untitled Project' },
  role: { type: String, enum: ['PM', 'DEV'], default: 'PM' },
  files: [FileSchema],
  messages: [MessageSchema],
  tasks: [{ task: String, status: String, priority: String }],
  risks: [{ text: String, keywords: [String], severity: String }],
  timeline: { weeks: Number, phases: mongoose.Schema.Types.Mixed },
  techStack: [String],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Session', SessionSchema);

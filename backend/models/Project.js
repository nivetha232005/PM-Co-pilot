const mongoose = require('mongoose');

const ProjectSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: String,
  role: { type: String, default: 'PM' },
  status: { type: String, enum: ['Active', 'Completed', 'On Hold'], default: 'Active' },
  tasks: [{
    task: String,
    status: { type: String, default: 'Pending' },
    priority: String,
    assignedTo: String
  }],
  risks: [{
    text: String,
    keywords: [String],
    severity: String,
    status: { type: String, default: 'Open' }
  }],
  timeline: { weeks: Number, phases: mongoose.Schema.Types.Mixed },
  techStack: [String],
  documents: [{ filename: String, storedAs: String, uploadedAt: Date }],
  sessions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Session' }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Project', ProjectSchema);

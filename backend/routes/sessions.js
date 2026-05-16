const express = require('express');
const router = express.Router();
const Session = require('../models/Session');

// GET /api/sessions — Get all sessions
router.get('/', async (req, res) => {
  try {
    const sessions = await Session.find().sort({ createdAt: -1 }).limit(20);
    res.json(sessions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/sessions/:id — Get one session
router.get('/:id', async (req, res) => {
  try {
    const session = await Session.findById(req.params.id);
    if (!session) return res.status(404).json({ error: 'Session not found' });
    res.json(session);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/sessions — Create new session
router.post('/', async (req, res) => {
  try {
    const { projectName, role, files } = req.body;
    const session = new Session({
      projectName: projectName || 'Untitled Project',
      role: role || 'PM',
      files: files || [],
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date()
    });
    await session.save();
    res.status(201).json(session);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/sessions/:id — Update session
router.put('/:id', async (req, res) => {
  try {
    const session = await Session.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: new Date() },
      { new: true }
    );
    res.json(session);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/sessions/:id — Delete session
router.delete('/:id', async (req, res) => {
  try {
    await Session.findByIdAndDelete(req.params.id);
    res.json({ message: 'Session deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

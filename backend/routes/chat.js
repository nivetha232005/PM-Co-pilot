const express = require('express');
const router = express.Router();
const axios = require('axios');
const Session = require('../models/Session');

const GEMINI_KEY = process.env.GOOGLE_API_KEY || 'AIzaSyD594RClxo8lxaWu10OH8EOKjiC0h4A5rE';

router.post('/', async (req, res) => {
  try {
    const { messages, systemPrompt, sessionId } = req.body;

    const geminiMessages = messages.slice(-10).map(m => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }]
    }));

    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_KEY}`,
      {
        system_instruction: { parts: [{ text: systemPrompt }] },
        contents: geminiMessages,
        generationConfig: { maxOutputTokens: 1500, temperature: 0.7 }
      },
      { headers: { 'Content-Type': 'application/json' } }
    );

    const reply = response.data.candidates?.[0]?.content?.parts?.[0]?.text || 'No response.';

    if (sessionId) {
      await Session.findByIdAndUpdate(sessionId, {
        $push: {
          messages: [
            { role: 'user', content: messages[messages.length-1]?.content, timestamp: new Date() },
            { role: 'assistant', content: reply, timestamp: new Date() }
          ]
        }
      });
    }

    res.json({ reply });
  } catch (err) {
    console.error('Gemini error:', err.response?.data || err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
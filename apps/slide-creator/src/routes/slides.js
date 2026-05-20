'use strict';

const express = require('express');
const { loadSkill } = require('../skill-loader');
const { generateDeck } = require('../claude-client');

const router = express.Router();

router.post('/create', async (req, res) => {
  const { briefing } = req.body;

  if (!briefing || typeof briefing !== 'string' || briefing.trim() === '') {
    return res.status(400).json({ error: 'briefing is required and must be a non-empty string' });
  }

  try {
    const skillContent = loadSkill();
    const result = await generateDeck(briefing.trim(), skillContent);
    res.json({ result });
  } catch (error) {
    console.error('Slide generation error:', error.message);
    res.status(500).json({ error: `Failed to generate deck: ${error.message}` });
  }
});

module.exports = router;

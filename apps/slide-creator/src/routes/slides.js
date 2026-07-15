'use strict';

const express = require('express');
const { randomUUID } = require('crypto');
const { loadSkill } = require('../skill-loader');
const { DESIGN_SYSTEMS, generateDeck } = require('../claude-client');

const router = express.Router();
const jobs = new Map();

const JOB_TTL_MS = 60 * 60 * 1000;

function pruneJobs() {
  const now = Date.now();
  for (const [id, job] of jobs.entries()) {
    if (now - job.createdAt > JOB_TTL_MS) jobs.delete(id);
  }
}

router.post('/create', async (req, res) => {
  const { briefing, designSystem } = req.body;

  if (!briefing || typeof briefing !== 'string' || briefing.trim() === '') {
    return res.status(400).json({ error: 'briefing is required and must be a non-empty string' });
  }

  pruneJobs();
  const jobId = randomUUID();
  const job = {
    id: jobId,
    status: 'queued',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    deck: null,
    error: null,
  };
  jobs.set(jobId, job);

  res.status(202).json({ jobId, status: job.status });

  setImmediate(async () => {
    job.status = 'running';
    job.updatedAt = Date.now();
    try {
      const skillContent = loadSkill();
      const deck = await generateDeck(briefing.trim(), skillContent, { designSystem });
      job.status = 'completed';
      job.deck = deck;
      job.updatedAt = Date.now();
    } catch (error) {
      console.error('Slide generation error:', error.message);
      job.status = 'failed';
      job.error = `Failed to generate deck: ${error.message}`;
      job.updatedAt = Date.now();
    }
  });
});

router.get('/jobs/:jobId', (req, res) => {
  pruneJobs();
  const job = jobs.get(req.params.jobId);
  if (!job) {
    return res.status(404).json({ error: 'generation job not found' });
  }

  res.json({
    jobId: job.id,
    status: job.status,
    deck: job.deck,
    result: job.deck?.markdown,
    error: job.error,
    updatedAt: job.updatedAt,
  });
});

router.get('/design-systems', (req, res) => {
  res.json({
    designSystems: Object.entries(DESIGN_SYSTEMS).map(([id, value]) => ({
      id,
      name: value.name,
      direction: value.direction,
      references: value.references,
    })),
  });
});

module.exports = router;

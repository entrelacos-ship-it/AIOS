'use strict';

const { execSync } = require('child_process');

async function generateDeck(briefing, skillContent) {
  const fullPrompt = `${skillContent}\n\n---\n\nUser briefing:\n${briefing}`;

  try {
    const result = execSync('claude --print', {
      input: fullPrompt,
      encoding: 'utf8',
      timeout: 120000,
      env: process.env,
    });
    return result;
  } catch (error) {
    throw new Error(`Failed to generate deck via Claude CLI: ${error.stderr || error.message}`);
  }
}

module.exports = { generateDeck };

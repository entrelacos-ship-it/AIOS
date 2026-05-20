'use strict';

const Anthropic = require('@anthropic-ai/sdk');

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const MODEL = process.env.CLAUDE_MODEL || 'claude-sonnet-4-6';

async function generateDeck(briefing, skillContent) {
  try {
    const message = await client.messages.create({
      model: MODEL,
      max_tokens: 8192,
      system: skillContent,
      messages: [{ role: 'user', content: briefing }],
    });
    return message.content[0].text;
  } catch (error) {
    throw new Error(`Failed to generate deck via Claude API: ${error.message}`);
  }
}

module.exports = { generateDeck };

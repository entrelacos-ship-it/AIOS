'use strict';

const fs = require('fs');
const path = require('path');

const SKILL_PATH = path.resolve(__dirname, '../../../.agents/skills/slide-creator/SKILL.md');

function loadSkill() {
  if (!fs.existsSync(SKILL_PATH)) {
    throw new Error(`Skill file not found at: ${SKILL_PATH}`);
  }
  return fs.readFileSync(SKILL_PATH, 'utf8');
}

module.exports = { loadSkill };

'use strict';

const fs = require('fs');
const path = require('path');

const SKILL_PATH = process.env.SKILL_PATH ||
  path.resolve(__dirname, '../../../.agents/skills/slide-creator/SKILL.md');

const CONTEXT_DIRS = ['templates', 'references', 'agents'];
const CONTEXT_EXTENSIONS = new Set(['.md', '.yaml', '.yml', '.html']);

function readOptional(rootDir, relativePath) {
  const filePath = path.join(rootDir, relativePath);
  if (!fs.existsSync(filePath)) return '';
  return [
    `\n\n--- BEGIN ${relativePath} ---\n`,
    fs.readFileSync(filePath, 'utf8'),
    `\n--- END ${relativePath} ---\n`,
  ].join('');
}

function walkContextFiles(rootDir, relativeDir) {
  const dir = path.join(rootDir, relativeDir);
  if (!fs.existsSync(dir)) return [];

  return fs.readdirSync(dir, { withFileTypes: true })
    .flatMap((entry) => {
      const child = path.join(relativeDir, entry.name);
      if (entry.isDirectory()) return walkContextFiles(rootDir, child);
      if (!entry.isFile()) return [];
      return CONTEXT_EXTENSIONS.has(path.extname(entry.name).toLowerCase())
        ? [child.split(path.sep).join('/')]
        : [];
    })
    .sort((a, b) => a.localeCompare(b));
}

function loadSkill() {
  if (!fs.existsSync(SKILL_PATH)) {
    throw new Error(`Skill file not found at: ${SKILL_PATH}`);
  }
  const rootDir = path.dirname(SKILL_PATH);
  const baseSkill = fs.readFileSync(SKILL_PATH, 'utf8');
  const contextFiles = CONTEXT_DIRS.flatMap((dir) => walkContextFiles(rootDir, dir));
  const context = contextFiles.map((file) => readOptional(rootDir, file)).join('');

  return `${baseSkill}

---

# Runtime-loaded Slide Creator template context

The following bundled files are available and must be actively used for route selection, slide-function selection, visual grammar, HTML rendering, QA gates, and anti-pattern prevention. Do not ignore them.

Loaded bundled context files: ${contextFiles.join(', ')}

${context}`;
}

module.exports = { loadSkill };

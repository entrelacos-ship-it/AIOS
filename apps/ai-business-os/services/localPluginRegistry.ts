import { promises as fs } from 'node:fs';
import path from 'node:path';
import YAML from 'yaml';
import type { LocalPluginRecord, LocalPluginSkillRecord } from '../types.js';

type MarketplaceEntry = {
  name?: string;
  category?: string;
  source?: {
    source?: string;
    path?: string;
  };
};

type PluginManifest = {
  name?: string;
  skills?: string;
  interface?: {
    displayName?: string;
    shortDescription?: string;
    longDescription?: string;
  };
};

type SkillFrontmatter = {
  name?: string;
  description?: string;
};

type SkillInterface = {
  interface?: {
    display_name?: string;
    short_description?: string;
    default_prompt?: string;
  };
};

const MARKETPLACE_PATH = path.join(process.cwd(), '.agents', 'plugins', 'marketplace.json');

const exists = async (targetPath: string) => {
  try {
    await fs.access(targetPath);
    return true;
  } catch {
    return false;
  }
};

const readJson = async <T>(targetPath: string): Promise<T | null> => {
  try {
    const raw = await fs.readFile(targetPath, 'utf8');
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
};

const readYaml = async <T>(targetPath: string): Promise<T | null> => {
  try {
    const raw = await fs.readFile(targetPath, 'utf8');
    return YAML.parse(raw) as T;
  } catch {
    return null;
  }
};

const readSkillFrontmatter = async (targetPath: string): Promise<SkillFrontmatter | null> => {
  try {
    const raw = await fs.readFile(targetPath, 'utf8');
    const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---/);
    if (!match) return null;
    return YAML.parse(match[1]) as SkillFrontmatter;
  } catch {
    return null;
  }
};

const listSkillDirectories = async (skillsRoot: string) => {
  try {
    const entries = await fs.readdir(skillsRoot, { withFileTypes: true });
    return entries
      .filter((entry) => entry.isDirectory())
      .map((entry) => path.join(skillsRoot, entry.name));
  } catch {
    return [];
  }
};

const buildSkillRecord = async (pluginName: string, skillDir: string): Promise<LocalPluginSkillRecord | null> => {
  const skillPath = path.join(skillDir, 'SKILL.md');
  if (!(await exists(skillPath))) {
    return null;
  }

  const frontmatter = await readSkillFrontmatter(skillPath);
  const openai = await readYaml<SkillInterface>(path.join(skillDir, 'agents', 'openai.yaml'));
  const skillName = frontmatter?.name?.trim();

  if (!skillName) {
    return null;
  }

  const displayName = openai?.interface?.display_name?.trim() || skillName;
  const defaultPrompt = openai?.interface?.default_prompt?.trim() || `Use $${skillName}.`;

  return {
    name: skillName,
    displayName,
    description: frontmatter?.description?.trim() || '',
    shortDescription: openai?.interface?.short_description?.trim() || '',
    defaultPrompt,
    invocation: `$${skillName}`,
    path: skillDir,
    pluginName,
  };
};

export const listLocalPlugins = async (): Promise<LocalPluginRecord[]> => {
  const marketplace = await readJson<{ plugins?: MarketplaceEntry[] }>(MARKETPLACE_PATH);
  if (!marketplace?.plugins?.length) {
    return [];
  }

  const localPlugins = await Promise.all(
    marketplace.plugins.map(async (entry) => {
      if (entry.source?.source !== 'local' || !entry.source.path) {
        return null;
      }

      const pluginRoot = path.resolve(process.cwd(), entry.source.path);
      const manifest = await readJson<PluginManifest>(path.join(pluginRoot, '.codex-plugin', 'plugin.json'));
      if (!manifest) {
        return null;
      }

      const skillsDir = path.resolve(pluginRoot, manifest.skills || './skills');
      const skillDirs = await listSkillDirectories(skillsDir);
      const skills = (await Promise.all(skillDirs.map((skillDir) => buildSkillRecord(manifest.name || entry.name || '', skillDir))))
        .filter((skill): skill is LocalPluginSkillRecord => Boolean(skill))
        .sort((left, right) => left.displayName.localeCompare(right.displayName, 'pt-BR'));

      return {
        name: manifest.name?.trim() || entry.name?.trim() || path.basename(pluginRoot),
        displayName: manifest.interface?.displayName?.trim() || entry.name?.trim() || path.basename(pluginRoot),
        shortDescription: manifest.interface?.shortDescription?.trim() || '',
        longDescription: manifest.interface?.longDescription?.trim() || '',
        category: entry.category?.trim() || 'General',
        path: pluginRoot,
        skills,
      } satisfies LocalPluginRecord;
    }),
  );

  return localPlugins
    .filter((plugin): plugin is LocalPluginRecord => Boolean(plugin))
    .sort((left, right) => left.displayName.localeCompare(right.displayName, 'pt-BR'));
};

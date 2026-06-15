import { promises as fs } from 'fs';
import path from 'path';
import type { AIPromptTemplate, AIPromptTemplateId } from '../types';
import { DEFAULT_AI_PROMPT_TEMPLATES } from './aiPromptDefaults.js';

type StoredPromptState = {
  prompt: string;
  updatedAt: string;
};

type PromptStore = {
  version: number;
  prompts: Partial<Record<AIPromptTemplateId, StoredPromptState>>;
};

const STORE_DIR = path.join(process.cwd(), '.aiox');
const STORE_PATH = path.join(STORE_DIR, 'agent-prompt-config.json');
const STORE_VERSION = 1;

const nowIso = () => new Date().toISOString();

const ensureStoreDir = async () => {
  await fs.mkdir(STORE_DIR, { recursive: true });
};

const loadStore = async (): Promise<PromptStore> => {
  await ensureStoreDir();

  try {
    const raw = await fs.readFile(STORE_PATH, 'utf8');
    const parsed = JSON.parse(raw) as Partial<PromptStore>;
    return {
      version: STORE_VERSION,
      prompts: parsed.prompts || {},
    };
  } catch {
    return {
      version: STORE_VERSION,
      prompts: {},
    };
  }
};

const saveStore = async (store: PromptStore) => {
  await ensureStoreDir();
  await fs.writeFile(STORE_PATH, JSON.stringify(store, null, 2), 'utf8');
};

export const listPromptTemplates = async (): Promise<AIPromptTemplate[]> => {
  const store = await loadStore();

  return Object.values(DEFAULT_AI_PROMPT_TEMPLATES).map((definition) => {
    const stored = store.prompts[definition.id];
    return {
      ...definition,
      prompt: stored?.prompt || definition.prompt,
      updatedAt: stored?.updatedAt || 'Padrão do sistema',
    };
  });
};

export const updatePromptTemplate = async (promptId: AIPromptTemplateId, prompt: string) => {
  const definition = DEFAULT_AI_PROMPT_TEMPLATES[promptId];
  if (!definition) {
    throw new Error('Prompt template not found.');
  }

  const store = await loadStore();
  store.prompts[promptId] = {
    prompt: prompt.trim(),
    updatedAt: nowIso(),
  };
  await saveStore(store);

  return {
    ...definition,
    prompt: store.prompts[promptId]?.prompt || definition.prompt,
    updatedAt: store.prompts[promptId]?.updatedAt || nowIso(),
  } as AIPromptTemplate;
};

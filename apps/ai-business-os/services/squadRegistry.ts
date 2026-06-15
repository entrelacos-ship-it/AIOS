import { promises as fs } from 'fs';
import path from 'path';
import type { Squad, SquadAgent } from '../types.js';

type SquadStore = { version: number; squads: Squad[] };

const STORE_DIR = path.join(process.cwd(), '.aiox');
const STORE_PATH = path.join(STORE_DIR, 'squads.json');

const nowIso = () => new Date().toISOString();
const createId = (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const ensureDir = async () => fs.mkdir(STORE_DIR, { recursive: true });

const loadStore = async (): Promise<SquadStore> => {
  await ensureDir();
  try {
    const raw = await fs.readFile(STORE_PATH, 'utf8');
    const parsed = JSON.parse(raw) as Partial<SquadStore>;
    return { version: 1, squads: Array.isArray(parsed.squads) ? parsed.squads : [] };
  } catch (e: unknown) {
    if (typeof e === 'object' && e !== null && 'code' in e && e.code === 'ENOENT') {
      return { version: 1, squads: [] };
    }
    throw new Error('Squad store corrupted.');
  }
};

const saveStore = async (store: SquadStore) => {
  await ensureDir();
  await fs.writeFile(STORE_PATH, JSON.stringify(store, null, 2), 'utf8');
};

export const listSquads = async (): Promise<Squad[]> => {
  const store = await loadStore();
  return [...store.squads].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
};

export const getSquad = async (id: string): Promise<Squad | null> => {
  const store = await loadStore();
  return store.squads.find((s) => s.id === id) ?? null;
};

export const createSquad = async (input: {
  name: string;
  description: string;
  agents: Omit<SquadAgent, 'id'>[];
}): Promise<Squad> => {
  if (!input.name?.trim()) throw new Error('name is required.');
  const store = await loadStore();
  const timestamp = nowIso();
  const squad: Squad = {
    id: createId('squad'),
    name: input.name.trim(),
    description: (input.description ?? '').trim(),
    agents: (input.agents ?? []).map((a) => ({ ...a, id: createId('agent') })),
    createdAt: timestamp,
    updatedAt: timestamp,
  };
  store.squads.unshift(squad);
  await saveStore(store);
  return squad;
};

export const updateSquad = async (id: string, input: {
  name?: string;
  description?: string;
  agents?: Omit<SquadAgent, 'id'>[];
}): Promise<Squad> => {
  const store = await loadStore();
  const idx = store.squads.findIndex((s) => s.id === id);
  if (idx < 0) throw new Error('Squad not found.');
  const current = store.squads[idx]!;
  const updated: Squad = {
    ...current,
    name: input.name?.trim() ?? current.name,
    description: input.description?.trim() ?? current.description,
    agents: input.agents
      ? input.agents.map((a) => ({ ...a, id: createId('agent') }))
      : current.agents,
    updatedAt: nowIso(),
  };
  store.squads[idx] = updated;
  await saveStore(store);
  return updated;
};

export const deleteSquad = async (id: string): Promise<void> => {
  const store = await loadStore();
  const next = store.squads.filter((s) => s.id !== id);
  if (next.length === store.squads.length) throw new Error('Squad not found.');
  store.squads = next;
  await saveStore(store);
};

import { promises as fs } from 'fs';
import path from 'path';
import type { SquadRun, SquadStage } from '../types.js';

type RunStore = { version: number; runs: SquadRun[] };

const STORE_DIR = path.join(process.cwd(), '.aiox');
const STORE_PATH = path.join(STORE_DIR, 'squad-runs.json');
const MAX_RUNS = 100;

const nowIso = () => new Date().toISOString();
const createId = () => `run-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const ensureDir = async () => fs.mkdir(STORE_DIR, { recursive: true });

const loadStore = async (): Promise<RunStore> => {
  await ensureDir();
  try {
    const raw = await fs.readFile(STORE_PATH, 'utf8');
    const parsed = JSON.parse(raw) as Partial<RunStore>;
    return { version: 1, runs: Array.isArray(parsed.runs) ? parsed.runs : [] };
  } catch (e: unknown) {
    if (typeof e === 'object' && e !== null && 'code' in e && e.code === 'ENOENT') {
      return { version: 1, runs: [] };
    }
    throw new Error('Squad run store corrupted.');
  }
};

const saveStore = async (store: RunStore) => {
  await ensureDir();
  store.runs = store.runs.slice(0, MAX_RUNS);
  await fs.writeFile(STORE_PATH, JSON.stringify(store, null, 2), 'utf8');
};

export const listSquadRuns = async (squadId?: string): Promise<SquadRun[]> => {
  const store = await loadStore();
  const runs = squadId
    ? store.runs.filter((r) => r.squadId === squadId)
    : store.runs;
  return [...runs].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
};

export const getSquadRun = async (id: string): Promise<SquadRun | null> => {
  const store = await loadStore();
  return store.runs.find((r) => r.id === id) ?? null;
};

export const createSquadRun = async (input: {
  squadId: string;
  squadName: string;
  task: string;
  stages: Omit<SquadStage, 'output' | 'status' | 'startedAt' | 'finishedAt'>[];
}): Promise<SquadRun> => {
  const store = await loadStore();
  const run: SquadRun = {
    id: createId(),
    squadId: input.squadId,
    squadName: input.squadName,
    task: input.task,
    stages: input.stages.map((s) => ({
      ...s,
      output: '',
      status: 'pending',
    })),
    status: 'idle',
    currentStageIndex: 0,
    createdAt: nowIso(),
  };
  store.runs.unshift(run);
  await saveStore(store);
  return run;
};

export const updateSquadRun = async (id: string, patch: Partial<SquadRun>): Promise<SquadRun> => {
  const store = await loadStore();
  const idx = store.runs.findIndex((r) => r.id === id);
  if (idx < 0) throw new Error('Run not found.');
  store.runs[idx] = { ...store.runs[idx]!, ...patch };
  await saveStore(store);
  return store.runs[idx]!;
};

export const updateSquadRunStage = async (
  runId: string,
  stageIndex: number,
  patch: Partial<SquadStage>,
): Promise<SquadRun> => {
  const store = await loadStore();
  const idx = store.runs.findIndex((r) => r.id === runId);
  if (idx < 0) throw new Error('Run not found.');
  const run = store.runs[idx]!;
  if (stageIndex < 0 || stageIndex >= run.stages.length) throw new Error('Stage not found.');
  run.stages[stageIndex] = { ...run.stages[stageIndex]!, ...patch };
  store.runs[idx] = run;
  await saveStore(store);
  return run;
};

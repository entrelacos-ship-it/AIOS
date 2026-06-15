import { promises as fs } from 'fs';
import path from 'path';
import type { AutoEditProject, AutoEditStage, AutoEditWord, AutoEditSegment, AutoEditMetadata } from '../types.js';

type Store = { version: number; projects: AutoEditProject[] };

const STORE_DIR = path.join(process.cwd(), '.aiox');
const STORE_PATH = path.join(STORE_DIR, 'auto-edit.json');

const nowIso = () => new Date().toISOString();
const createId = () => `ae-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const isEnoent = (e: unknown) =>
  typeof e === 'object' && e !== null && 'code' in e && (e as { code: string }).code === 'ENOENT';

async function load(): Promise<Store> {
  await fs.mkdir(STORE_DIR, { recursive: true });
  try {
    const raw = await fs.readFile(STORE_PATH, 'utf8');
    return JSON.parse(raw) as Store;
  } catch (e) {
    if (isEnoent(e)) return { version: 1, projects: [] };
    throw e;
  }
}

async function save(store: Store): Promise<void> {
  await fs.mkdir(STORE_DIR, { recursive: true });
  await fs.writeFile(STORE_PATH, JSON.stringify(store, null, 2), 'utf8');
}

export async function listAutoEditProjects(): Promise<AutoEditProject[]> {
  const store = await load();
  return store.projects.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

export async function getAutoEditProject(id: string): Promise<AutoEditProject | null> {
  const store = await load();
  return store.projects.find((p) => p.id === id) ?? null;
}

export function createAutoEditProject(
  sourcePath: string,
  sourceFileName: string,
  includeShorts: boolean,
): AutoEditProject {
  const id = createId();
  const base = path.join(process.cwd(), 'outputs', 'auto-edit');
  return {
    id,
    title: path.basename(sourceFileName, path.extname(sourceFileName)),
    sourceFileName,
    sourcePath,
    normalizedPath: path.join(base, `${id}_norm.mp4`),
    outputPath: path.join(base, `${id}_output.mp4`),
    shortsPath: path.join(base, `${id}_shorts.mp4`),
    captionsPath: path.join(base, `${id}_captions.srt`),
    stage: 'idle',
    words: [],
    transcript: '',
    segments: [],
    metadata: null,
    includeShorts,
    error: '',
    createdAt: nowIso(),
    updatedAt: nowIso(),
  };
}

export async function syncAutoEditProject(project: AutoEditProject): Promise<void> {
  const store = await load();
  const idx = store.projects.findIndex((p) => p.id === project.id);
  if (idx >= 0) {
    store.projects[idx] = { ...project, updatedAt: nowIso() };
  } else {
    store.projects.push({ ...project, updatedAt: nowIso() });
  }
  await save(store);
}

export async function updateAutoEditStage(
  id: string,
  stage: AutoEditStage,
  patch?: Partial<AutoEditProject>,
): Promise<AutoEditProject> {
  const store = await load();
  const idx = store.projects.findIndex((p) => p.id === id);
  if (idx < 0) throw new Error(`AutoEdit project ${id} not found.`);
  store.projects[idx] = { ...store.projects[idx]!, ...patch, stage, updatedAt: nowIso() };
  await save(store);
  return store.projects[idx]!;
}

export async function deleteAutoEditProject(id: string): Promise<void> {
  const store = await load();
  store.projects = store.projects.filter((p) => p.id !== id);
  await save(store);
}

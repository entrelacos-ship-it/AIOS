import { promises as fs } from 'fs';
import path from 'path';
import type { EditAIVideoProject, EditAIProjectStatus, EditAIFormatoDestino, EditAIEditPreset, EditAICutReport } from '../types.js';

type ProjectStore = {
  version: number;
  projects: EditAIVideoProject[];
  deletedProjectIds: string[];
};

const STORE_DIR = path.join(process.cwd(), '.aiox');
const STORE_PATH = path.join(STORE_DIR, 'editai-projects.json');
const STORE_VERSION = 1;

const nowIso = () => new Date().toISOString();
const EDIT_PRESETS = new Set<EditAIEditPreset>(['auto', 'clean', 'kinetic', 'cinematic']);

const isMissingFile = (err: unknown): boolean =>
  typeof err === 'object' && err !== null && 'code' in err && (err as NodeJS.ErrnoException).code === 'ENOENT';

async function loadStore(): Promise<ProjectStore> {
  try {
    const raw = await fs.readFile(STORE_PATH, 'utf8');
    const parsed = JSON.parse(raw) as ProjectStore;
    return {
      version: STORE_VERSION,
      projects: Array.isArray(parsed.projects) ? parsed.projects : [],
      deletedProjectIds: Array.isArray(parsed.deletedProjectIds) ? parsed.deletedProjectIds : [],
    };
  } catch (err) {
    if (isMissingFile(err)) {
      return { version: STORE_VERSION, projects: [], deletedProjectIds: [] };
    }
    throw err;
  }
}

async function saveStore(store: ProjectStore): Promise<void> {
  await fs.mkdir(STORE_DIR, { recursive: true });
  await fs.writeFile(STORE_PATH, JSON.stringify(store, null, 2), 'utf8');
}

function normalizeProject(project: Partial<EditAIVideoProject> & { id: string }): EditAIVideoProject {
  const normalizeCut = (cut: EditAICutReport, index: number): EditAICutReport => {
    const status = cut.status ?? (cut.aprovado ? 'approved' : 'pending');
    const confidence = typeof cut.confidence === 'number' ? Math.max(0, Math.min(1, cut.confidence)) : null;
    const duracao = Number.isFinite(cut.duracao) ? cut.duracao : Math.max(0, cut.fim - cut.inicio);
    return {
      ...cut,
      id: cut.id || `${cut.tipo}-${Math.round(cut.inicio * 1000)}-${Math.round(cut.fim * 1000)}-${index}`,
      duracao,
      aprovado: status === 'approved',
      status,
      confidence: confidence ?? (cut.tipo === 'silencio' ? 0.88 : 0.65),
      reason: cut.reason || (
        cut.tipo === 'silencio'
          ? `Silêncio de ${duracao.toFixed(2)}s detectado automaticamente.`
          : cut.tipo === 'gaguejo'
            ? 'Possível repetição detectada pela IA.'
            : 'Possível refazimento detectado pela IA.'
      ),
      source: cut.source || 'ai',
      riskLevel: cut.riskLevel || (duracao > 2.5 ? 'high' : duracao > 1.2 ? 'medium' : 'low'),
    };
  };

  return {
    id: project.id,
    title: project.title || 'Sem título',
    sourceFileName: project.sourceFileName || '',
    status: (project.status as EditAIProjectStatus) || 'uploading',
    formatoDestino: (project.formatoDestino as EditAIFormatoDestino) || 'reels',
    editPreset: EDIT_PRESETS.has(project.editPreset as EditAIEditPreset) ? project.editPreset as EditAIEditPreset : 'auto',
    originalPath: project.originalPath || '',
    normalizedPath: project.normalizedPath || '',
    cutPath: project.cutPath || '',
    renderPath: project.renderPath || '',
    fps: typeof project.fps === 'number' ? project.fps : 30,
    words: Array.isArray(project.words) ? project.words : [],
    transcription: project.transcription || '',
    cutReport: Array.isArray(project.cutReport) ? project.cutReport.map(normalizeCut) : [],
    planText: project.planText || '',
    planApproved: project.planApproved === true,
    template: project.template ?? null,
    formato: project.formato || '',
    paleta: project.paleta ?? null,
    scenes: Array.isArray(project.scenes) ? project.scenes : [],
    renderProgress: typeof project.renderProgress === 'number' ? project.renderProgress : 0,
    error: project.error || '',
    createdAt: project.createdAt || nowIso(),
    updatedAt: project.updatedAt || nowIso(),
  };
}

export async function listEditAIProjects(): Promise<EditAIVideoProject[]> {
  const store = await loadStore();
  return store.projects
    .filter((p) => !store.deletedProjectIds.includes(p.id))
    .map((p) => normalizeProject(p))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function getEditAIProject(id: string): Promise<EditAIVideoProject | null> {
  const store = await loadStore();
  if (store.deletedProjectIds.includes(id)) return null;
  const project = store.projects.find((p) => p.id === id);
  return project ? normalizeProject(project) : null;
}

export async function syncEditAIProject(project: EditAIVideoProject): Promise<EditAIVideoProject> {
  const store = await loadStore();
  const normalized = normalizeProject({ ...project, updatedAt: nowIso() });
  const idx = store.projects.findIndex((p) => p.id === project.id);

  if (idx >= 0) {
    store.projects[idx] = normalized;
  } else {
    store.projects.unshift(normalized);
  }

  await saveStore(store);
  return normalized;
}

export async function deleteEditAIProject(
  id: string,
  opts: { deleteFiles?: boolean } = {},
): Promise<void> {
  const store = await loadStore();
  const project = store.projects.find((p) => p.id === id);

  if (project && opts.deleteFiles) {
    const filesToDelete = [project.originalPath, project.normalizedPath, project.cutPath, project.renderPath]
      .filter(Boolean);

    await Promise.all(
      filesToDelete.map((f) => fs.unlink(f!).catch(() => undefined)),
    );
  }

  if (!store.deletedProjectIds.includes(id)) {
    store.deletedProjectIds.push(id);
  }

  store.projects = store.projects.filter((p) => p.id !== id);
  await saveStore(store);
}

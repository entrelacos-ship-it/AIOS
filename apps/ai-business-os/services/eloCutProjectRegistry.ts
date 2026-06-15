import { promises as fs } from 'fs';
import path from 'path';
import type { EloCutProject, EloCutScene, TranscriptionSegment } from './eloCutService.js';

export type EloCutPublicationStatus = 'draft' | 'rendered' | 'scheduled' | 'published';

export type EloCutProjectRecord = {
  id: string;
  title: string;
  sourceFileName: string;
  inputVideoPath: string;
  outputVideoPath: string;
  transcription: TranscriptionSegment[];
  scenes: EloCutScene[];
  totalDuration: number;
  fps: number;
  status: EloCutProject['status'];
  renderProgress: number;
  downloadReady: boolean;
  error: string | null;
  createdAt: string;
  updatedAt: string;
  lastRenderedAt: string | null;
  publicationStatus: EloCutPublicationStatus;
  publicationPlatform: string;
  publicationUrl: string;
  publicationNotes: string;
  publishedAt: string | null;
};

type EloCutProjectStore = {
  version: number;
  projects: EloCutProjectRecord[];
  deletedProjectIds: string[];
};

type SyncProjectOptions = {
  title?: string;
  sourceFileName?: string;
  renderProgress?: number;
};

type UpdateControlOptions = Partial<Pick<
  EloCutProjectRecord,
  'title' | 'publicationPlatform' | 'publicationUrl' | 'publicationNotes'
>> & {
  publicationStatus?: EloCutPublicationStatus;
};

type DeleteProjectOptions = {
  deleteInputFile?: boolean;
  deleteOutputFile?: boolean;
};

const STORE_DIR = path.join(process.cwd(), '.aiox');
const STORE_PATH = path.join(STORE_DIR, 'elocut-projects.json');
const STORE_VERSION = 1;
const LEGACY_OUTPUT_DIR = path.join(process.cwd(), 'outputs', 'elocut');

const nowIso = () => new Date().toISOString();

const ensureStoreDir = async () => {
  await fs.mkdir(STORE_DIR, { recursive: true });
};

const fallbackOutputPath = (projectId: string) => path.join(process.cwd(), 'outputs', 'elocut', `${projectId}_output.mp4`);
const uploadsDir = path.join(process.cwd(), 'uploads', 'elocut');
const outputsDir = path.join(process.cwd(), 'outputs', 'elocut');

const fileExists = async (targetPath: string) => {
  try {
    await fs.access(targetPath);
    return true;
  } catch {
    return false;
  }
};

const isPathInside = (candidatePath: string, basePath: string) => {
  const resolvedCandidate = path.resolve(candidatePath);
  const resolvedBase = path.resolve(basePath);
  return resolvedCandidate === resolvedBase || resolvedCandidate.startsWith(`${resolvedBase}${path.sep}`);
};

const safeUnlink = async (targetPath: string) => {
  if (!targetPath) {
    return;
  }

  const allowed = isPathInside(targetPath, uploadsDir) || isPathInside(targetPath, outputsDir);
  if (!allowed) {
    return;
  }

  try {
    await fs.rm(targetPath, { force: true });
  } catch (error) {
    if ((error as NodeJS.ErrnoException)?.code !== 'ENOENT') {
      throw error;
    }
  }
};

const removeProjectArtifacts = async (projectId: string) => {
  try {
    const entries = await fs.readdir(outputsDir, { withFileTypes: true });
    const matchingEntries = entries.filter((entry) => entry.name.startsWith(`${projectId}_`));

    await Promise.all(matchingEntries.map(async (entry) => {
      const fullPath = path.join(outputsDir, entry.name);
      if (entry.isDirectory()) {
        await fs.rm(fullPath, { recursive: true, force: true });
        return;
      }

      await safeUnlink(fullPath);
    }));
  } catch {
    // Ignore missing directory; delete still succeeds for the persisted record.
  }
};

const normalizePublicationStatus = (value: unknown, downloadReady: boolean): EloCutPublicationStatus => {
  if (value === 'draft' || value === 'rendered' || value === 'scheduled' || value === 'published') {
    return value;
  }

  return downloadReady ? 'rendered' : 'draft';
};

const normalizeRecord = async (record: EloCutProjectRecord): Promise<EloCutProjectRecord> => {
  const resolvedOutputPath = record.outputVideoPath || fallbackOutputPath(record.id);
  const downloadReady = await fileExists(resolvedOutputPath);
  const missingRenderedFile = record.status === 'complete' && !downloadReady;
  const nextPublicationStatus = record.publicationStatus === 'published' || record.publicationStatus === 'scheduled'
    ? record.publicationStatus
    : downloadReady
      ? 'rendered'
      : 'draft';

  return {
    ...record,
    outputVideoPath: downloadReady ? resolvedOutputPath : record.outputVideoPath,
    downloadReady,
    status: missingRenderedFile ? 'error' : record.status,
    error: missingRenderedFile
      ? 'Rendered file is missing on disk. Please render the project again.'
      : record.error || null,
    lastRenderedAt: downloadReady ? (record.lastRenderedAt || record.updatedAt || record.createdAt) : null,
    publicationStatus: normalizePublicationStatus(nextPublicationStatus, downloadReady),
    publicationPlatform: record.publicationPlatform || '',
    publicationUrl: record.publicationUrl || '',
    publicationNotes: record.publicationNotes || '',
    publishedAt: record.publishedAt || null,
    renderProgress: Number.isFinite(record.renderProgress) ? record.renderProgress : 0,
    transcription: Array.isArray(record.transcription) ? record.transcription : [],
    scenes: Array.isArray(record.scenes) ? record.scenes : [],
  };
};

const discoverLegacyRenderedProjects = async (existingIds: Set<string>, deletedIds: Set<string>): Promise<EloCutProjectRecord[]> => {
  try {
    const entries = await fs.readdir(LEGACY_OUTPUT_DIR, { withFileTypes: true });
    const discovered = await Promise.all(
      entries
        .filter((entry) => entry.isFile() && /^elocut_\d+_output\.mp4$/i.test(entry.name))
        .map(async (entry) => {
          const match = entry.name.match(/^(elocut_\d+)_output\.mp4$/i);
          if (!match) {
            return null;
          }

          const id = match[1];
          if (existingIds.has(id) || deletedIds.has(id)) {
            return null;
          }

          const outputVideoPath = path.join(LEGACY_OUTPUT_DIR, entry.name);
          const stats = await fs.stat(outputVideoPath);
          const timestamp = stats.mtime.toISOString();

          return {
            id,
            title: id,
            sourceFileName: entry.name,
            inputVideoPath: '',
            outputVideoPath,
            transcription: [],
            scenes: [],
            totalDuration: 0,
            fps: 30,
            status: 'complete' as const,
            renderProgress: 100,
            downloadReady: true,
            error: null,
            createdAt: timestamp,
            updatedAt: timestamp,
            lastRenderedAt: timestamp,
            publicationStatus: 'rendered' as const,
            publicationPlatform: '',
            publicationUrl: '',
            publicationNotes: 'Importado automaticamente do histórico local de renders.',
            publishedAt: null,
          } satisfies EloCutProjectRecord;
        }),
    );

    return discovered.filter((item): item is EloCutProjectRecord => Boolean(item));
  } catch {
    return [];
  }
};

const loadStore = async (): Promise<EloCutProjectStore> => {
  await ensureStoreDir();

  try {
    const raw = await fs.readFile(STORE_PATH, 'utf8');
    const parsed = JSON.parse(raw) as Partial<EloCutProjectStore>;
    const projects = Array.isArray(parsed.projects) ? parsed.projects : [];
    const deletedProjectIds = Array.isArray(parsed.deletedProjectIds)
      ? parsed.deletedProjectIds.filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
      : [];
    const normalizedProjects = await Promise.all(projects.map((project) => normalizeRecord(project as EloCutProjectRecord)));
    const legacyProjects = await discoverLegacyRenderedProjects(
      new Set(normalizedProjects.map((project) => project.id)),
      new Set(deletedProjectIds),
    );
    return {
      version: STORE_VERSION,
      projects: [...legacyProjects, ...normalizedProjects],
      deletedProjectIds,
    };
  } catch {
    const legacyProjects = await discoverLegacyRenderedProjects(new Set(), new Set());
    return {
      version: STORE_VERSION,
      projects: legacyProjects,
      deletedProjectIds: [],
    };
  }
};

const saveStore = async (store: EloCutProjectStore) => {
  await ensureStoreDir();
  await fs.writeFile(STORE_PATH, JSON.stringify(store, null, 2), 'utf8');
};

const buildRecordFromProject = async (
  project: EloCutProject,
  existing?: EloCutProjectRecord,
  options: SyncProjectOptions = {},
): Promise<EloCutProjectRecord> => {
  const resolvedOutputPath = project.outputVideoPath || existing?.outputVideoPath || fallbackOutputPath(project.id);
  const downloadReady = await fileExists(resolvedOutputPath);
  const updatedAt = nowIso();
  const nextPublicationStatus = existing?.publicationStatus === 'published' || existing?.publicationStatus === 'scheduled'
    ? existing.publicationStatus
    : downloadReady
      ? 'rendered'
      : 'draft';

  return {
    id: project.id,
    title: options.title?.trim() || existing?.title || path.parse(options.sourceFileName || existing?.sourceFileName || project.id).name,
    sourceFileName: options.sourceFileName || existing?.sourceFileName || path.basename(project.inputVideoPath),
    inputVideoPath: project.inputVideoPath,
    outputVideoPath: downloadReady ? resolvedOutputPath : project.outputVideoPath,
    transcription: project.transcription,
    scenes: project.scenes,
    totalDuration: project.totalDuration,
    fps: project.fps,
    status: project.status,
    renderProgress: typeof options.renderProgress === 'number'
      ? options.renderProgress
      : existing?.renderProgress ?? 0,
    downloadReady,
    error: project.error || null,
    createdAt: existing?.createdAt || project.createdAt || updatedAt,
    updatedAt,
    lastRenderedAt: downloadReady ? (existing?.lastRenderedAt || updatedAt) : existing?.lastRenderedAt || null,
    publicationStatus: normalizePublicationStatus(nextPublicationStatus, downloadReady),
    publicationPlatform: existing?.publicationPlatform || '',
    publicationUrl: existing?.publicationUrl || '',
    publicationNotes: existing?.publicationNotes || '',
    publishedAt: existing?.publishedAt || null,
  };
};

export async function syncEloCutProjectRecord(project: EloCutProject, options: SyncProjectOptions = {}) {
  const store = await loadStore();
  const index = store.projects.findIndex((item) => item.id === project.id);
  const existing = index >= 0 ? store.projects[index] : undefined;
  const nextRecord = await buildRecordFromProject(project, existing, options);

  if (index >= 0) {
    store.projects[index] = nextRecord;
  } else {
    store.projects.unshift(nextRecord);
  }

  store.deletedProjectIds = store.deletedProjectIds.filter((item) => item !== project.id);

  await saveStore(store);
  return nextRecord;
}

export async function getEloCutProjectRecord(projectId: string) {
  const store = await loadStore();
  const record = store.projects.find((item) => item.id === projectId);
  if (!record) {
    return null;
  }

  const normalized = await normalizeRecord(record);
  if (JSON.stringify(normalized) !== JSON.stringify(record)) {
    const index = store.projects.findIndex((item) => item.id === projectId);
    store.projects[index] = normalized;
    await saveStore(store);
  }

  return normalized;
}

export async function listEloCutProjectRecords() {
  const store = await loadStore();
  const sorted = [...store.projects].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  return Promise.all(sorted.map((record) => normalizeRecord(record)));
}

export async function updateEloCutProjectControl(projectId: string, updates: UpdateControlOptions) {
  const store = await loadStore();
  const index = store.projects.findIndex((item) => item.id === projectId);

  if (index < 0) {
    throw new Error('Project not found.');
  }

  const current = await normalizeRecord(store.projects[index]);
  const requestedStatus = normalizePublicationStatus(updates.publicationStatus ?? current.publicationStatus, current.downloadReady);
  const nextStatus = requestedStatus === 'rendered' && !current.downloadReady ? 'draft' : requestedStatus;
  const nextPublishedAt = nextStatus === 'published'
    ? current.publishedAt || nowIso()
    : null;

  const nextRecord: EloCutProjectRecord = {
    ...current,
    title: typeof updates.title === 'string' && updates.title.trim() ? updates.title.trim() : current.title,
    publicationPlatform: typeof updates.publicationPlatform === 'string' ? updates.publicationPlatform.trim() : current.publicationPlatform,
    publicationUrl: typeof updates.publicationUrl === 'string' ? updates.publicationUrl.trim() : current.publicationUrl,
    publicationNotes: typeof updates.publicationNotes === 'string' ? updates.publicationNotes.trim() : current.publicationNotes,
    publicationStatus: nextStatus,
    publishedAt: nextPublishedAt,
    updatedAt: nowIso(),
  };

  store.projects[index] = nextRecord;
  await saveStore(store);
  return nextRecord;
}

export async function deleteEloCutProjectRecord(projectId: string, options: DeleteProjectOptions = {}) {
  const store = await loadStore();
  const index = store.projects.findIndex((item) => item.id === projectId);

  if (index < 0) {
    throw new Error('Project not found.');
  }

  const current = await normalizeRecord(store.projects[index]);
  store.projects.splice(index, 1);
  if (!store.deletedProjectIds.includes(projectId)) {
    store.deletedProjectIds.push(projectId);
  }
  await saveStore(store);

  if (options.deleteInputFile !== false) {
    await safeUnlink(current.inputVideoPath);
  }

  if (options.deleteOutputFile !== false) {
    const outputPath = current.outputVideoPath || fallbackOutputPath(current.id);
    await safeUnlink(outputPath);
    await removeProjectArtifacts(current.id);
  }

  return current;
}

import { promises as fs } from 'fs';
import path from 'path';
import type {
  BrandCalendarApprovalStatus,
  BrandCalendarPostRecord,
  BrandCalendarPostStatus,
  BrandEditorialLineScopeMode,
  BrandInstagramSyncStatus,
} from '../types';

type CalendarWorkspaceStore = {
  version: number;
  workspaces: BrandCalendarWorkspaceRecord[];
};

type CalendarScopeInput = {
  manifestoId: string | null;
  scopeMode: BrandEditorialLineScopeMode;
  blankWorkspaceId?: string | null;
};

type ReplaceBrandCalendarWorkspaceInput = CalendarScopeInput & {
  posts: BrandCalendarPostRecord[];
};

type BrandCalendarWorkspaceRecord = CalendarScopeInput & {
  posts: BrandCalendarPostRecord[];
  createdAt: string;
  updatedAt: string;
};

const STORE_DIR = path.join(process.cwd(), '.aiox');
const STORE_PATH = path.join(STORE_DIR, 'branding-calendar-workspaces.json');
const STORE_VERSION = 1;

const nowIso = () => new Date().toISOString();

const ensureStoreDir = async () => {
  await fs.mkdir(STORE_DIR, { recursive: true });
};

const isMissingFileError = (error: unknown) =>
  typeof error === 'object' &&
  error !== null &&
  'code' in error &&
  error.code === 'ENOENT';

const sanitizeText = (value: unknown) => (typeof value === 'string' ? value.replace(/\r\n/g, '\n').trim() : '');

const normalizeScope = (scope: CalendarScopeInput): CalendarScopeInput => {
  const manifestoId = scope.manifestoId?.trim() || null;

  if (scope.scopeMode === 'manifesto' && !manifestoId) {
    throw new Error('manifestoId is required for manifesto scope.');
  }

  return {
    manifestoId: scope.scopeMode === 'blank' ? null : manifestoId,
    scopeMode: scope.scopeMode,
    blankWorkspaceId: scope.scopeMode === 'blank' ? (scope.blankWorkspaceId?.trim() || null) : null,
  };
};

const matchesScope = (record: CalendarScopeInput, scope: CalendarScopeInput) => (
  record.scopeMode === scope.scopeMode &&
  record.manifestoId === scope.manifestoId &&
  (scope.scopeMode !== 'blank' || (record.blankWorkspaceId ?? null) === (scope.blankWorkspaceId ?? null))
);

const normalizeStatus = (status: unknown): BrandCalendarPostStatus => {
  if (status === 'Scheduled' || status === 'Published') {
    return status;
  }

  return 'Draft';
};

const normalizeApprovalStatus = (status: unknown): BrandCalendarApprovalStatus => {
  return status === 'Approved' ? 'Approved' : 'Needs Review';
};

const normalizeInstagramStatus = (status: unknown, scheduledAt: string, imageUrl: string): BrandInstagramSyncStatus => {
  if (status === 'Ready' || status === 'Scheduled' || status === 'Published' || status === 'Error') {
    return status;
  }

  return scheduledAt && imageUrl ? 'Ready' : 'Not Synced';
};

const normalizePost = (post: Partial<BrandCalendarPostRecord>, index: number): BrandCalendarPostRecord => {
  const id = sanitizeText(post.id) || `calendar-post-${Date.now()}-${index}`;
  const scheduledAt = sanitizeText(post.scheduledAt);
  const imageUrl = sanitizeText(post.imageUrl);

  return {
    id,
    day: sanitizeText(post.day),
    format: sanitizeText(post.format),
    editorialLine: sanitizeText(post.editorialLine),
    theme: sanitizeText(post.theme),
    description: sanitizeText(post.description),
    status: normalizeStatus(post.status),
    approvalStatus: normalizeApprovalStatus(post.approvalStatus),
    scheduledAt,
    instagramStatus: normalizeInstagramStatus(post.instagramStatus, scheduledAt, imageUrl),
    imageUrl,
  };
};

const loadStore = async (): Promise<CalendarWorkspaceStore> => {
  await ensureStoreDir();

  try {
    const raw = await fs.readFile(STORE_PATH, 'utf8');
    const parsed = JSON.parse(raw) as Partial<CalendarWorkspaceStore>;
    return {
      version: STORE_VERSION,
      workspaces: Array.isArray(parsed.workspaces) ? parsed.workspaces : [],
    };
  } catch (error) {
    if (isMissingFileError(error)) {
      return {
        version: STORE_VERSION,
        workspaces: [],
      };
    }

    throw new Error('Brand calendar workspace store is corrupted or unreadable.');
  }
};

const saveStore = async (store: CalendarWorkspaceStore) => {
  await ensureStoreDir();
  await fs.writeFile(STORE_PATH, JSON.stringify(store, null, 2), 'utf8');
};

export const listBrandCalendarWorkspace = async (scope: CalendarScopeInput): Promise<BrandCalendarPostRecord[]> => {
  const normalizedScope = normalizeScope(scope);
  const store = await loadStore();
  const workspace = store.workspaces.find((record) => matchesScope(record, normalizedScope));
  return Array.isArray(workspace?.posts) ? workspace.posts.map((post, index) => normalizePost(post, index)) : [];
};

export const replaceBrandCalendarWorkspace = async (
  input: ReplaceBrandCalendarWorkspaceInput,
): Promise<BrandCalendarPostRecord[]> => {
  const normalizedScope = normalizeScope(input);
  const store = await loadStore();
  const current = store.workspaces.find((record) => matchesScope(record, normalizedScope));
  const timestamp = nowIso();
  const posts = Array.isArray(input.posts) ? input.posts.map((post, index) => normalizePost(post, index)) : [];

  const nextWorkspace: BrandCalendarWorkspaceRecord = {
    manifestoId: normalizedScope.manifestoId,
    scopeMode: normalizedScope.scopeMode,
    blankWorkspaceId: normalizedScope.blankWorkspaceId ?? null,
    posts,
    createdAt: current?.createdAt || timestamp,
    updatedAt: timestamp,
  };

  store.workspaces = [
    ...store.workspaces.filter((record) => !matchesScope(record, normalizedScope)),
    nextWorkspace,
  ];

  await saveStore(store);
  return posts;
};

export const deleteBrandCalendarWorkspaceByManifesto = async (manifestoId: string): Promise<void> => {
  const normalizedManifestoId = manifestoId.trim();
  if (!normalizedManifestoId) {
    return;
  }

  const store = await loadStore();
  const nextWorkspaces = store.workspaces.filter((record) => record.manifestoId !== normalizedManifestoId);

  if (nextWorkspaces.length === store.workspaces.length) {
    return;
  }

  store.workspaces = nextWorkspaces;
  await saveStore(store);
};

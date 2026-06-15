import { promises as fs } from 'fs';
import path from 'path';
import type {
  BrandEditorialLineRecord,
  BrandEditorialLineScopeMode,
  BrandEditorialLineSource,
} from '../types';

type EditorialLineStore = {
  version: number;
  editorialLines: BrandEditorialLineRecord[];
};

type BrandEditorialLineInput = {
  id?: string;
  content: string;
  selected?: boolean;
  source?: BrandEditorialLineSource;
};

type EditorialScopeInput = {
  manifestoId: string | null;
  scopeMode: BrandEditorialLineScopeMode;
  blankWorkspaceId?: string | null;
};

type ReplaceBrandEditorialLinesInput = EditorialScopeInput & {
  lines: BrandEditorialLineInput[];
};

const STORE_DIR = path.join(process.cwd(), '.aiox');
const STORE_PATH = path.join(STORE_DIR, 'branding-editorial-lines.json');
const STORE_VERSION = 1;

const nowIso = () => new Date().toISOString();

const sanitizeText = (value: string) => value.replace(/\r\n/g, '\n').trim();

const ensureStoreDir = async () => {
  await fs.mkdir(STORE_DIR, { recursive: true });
};

const isMissingFileError = (error: unknown) =>
  typeof error === 'object' &&
  error !== null &&
  'code' in error &&
  error.code === 'ENOENT';

const loadStore = async (): Promise<EditorialLineStore> => {
  await ensureStoreDir();

  try {
    const raw = await fs.readFile(STORE_PATH, 'utf8');
    const parsed = JSON.parse(raw) as Partial<EditorialLineStore>;
    return {
      version: STORE_VERSION,
      editorialLines: Array.isArray(parsed.editorialLines) ? parsed.editorialLines : [],
    };
  } catch (error) {
    if (isMissingFileError(error)) {
      return {
        version: STORE_VERSION,
        editorialLines: [],
      };
    }

    throw new Error('Brand editorial lines store is corrupted or unreadable.');
  }
};

const saveStore = async (store: EditorialLineStore) => {
  await ensureStoreDir();
  await fs.writeFile(STORE_PATH, JSON.stringify(store, null, 2), 'utf8');
};

const createId = () => `editorial-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const matchesScope = (record: BrandEditorialLineRecord, scope: EditorialScopeInput) => (
  record.scopeMode === scope.scopeMode &&
  record.manifestoId === scope.manifestoId &&
  (scope.scopeMode !== 'blank' || (record.blankWorkspaceId ?? null) === (scope.blankWorkspaceId ?? null))
);

const normalizeScope = (scope: EditorialScopeInput): EditorialScopeInput => {
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

const normalizeLineInput = (line: BrandEditorialLineInput) => {
  const content = sanitizeText(line.content);

  if (!content) {
    return null;
  }

  return {
    id: line.id?.trim() || null,
    content,
    selected: Boolean(line.selected),
    source: line.source === 'ai' ? 'ai' : 'manual',
  };
};

export const listBrandEditorialLines = async (scope: EditorialScopeInput): Promise<BrandEditorialLineRecord[]> => {
  const normalizedScope = normalizeScope(scope);
  const store = await loadStore();
  return store.editorialLines.filter((record) => matchesScope(record, normalizedScope));
};

export const replaceBrandEditorialLines = async (
  input: ReplaceBrandEditorialLinesInput,
): Promise<BrandEditorialLineRecord[]> => {
  const normalizedScope = normalizeScope(input);
  const store = await loadStore();
  const existingScopeLines = store.editorialLines.filter((record) => matchesScope(record, normalizedScope));
  const existingScopeMap = new Map(existingScopeLines.map((record) => [record.id, record]));

  const nextScopeLines = input.lines
    .map(normalizeLineInput)
    .filter((line): line is NonNullable<typeof line> => Boolean(line))
    .map((line) => {
      const current = line.id ? existingScopeMap.get(line.id) : undefined;
      const timestamp = nowIso();

      return {
        id: current?.id || line.id || createId(),
        manifestoId: normalizedScope.manifestoId,
        scopeMode: normalizedScope.scopeMode,
        blankWorkspaceId: normalizedScope.blankWorkspaceId ?? null,
        content: line.content,
        selected: line.selected,
        source: line.source,
        createdAt: current?.createdAt || timestamp,
        updatedAt: timestamp,
      } satisfies BrandEditorialLineRecord;
    });

  store.editorialLines = [
    ...store.editorialLines.filter((record) => !matchesScope(record, normalizedScope)),
    ...nextScopeLines,
  ];

  await saveStore(store);
  return nextScopeLines;
};

export const deleteBrandEditorialLinesByManifesto = async (manifestoId: string): Promise<void> => {
  const normalizedManifestoId = manifestoId.trim();
  if (!normalizedManifestoId) {
    return;
  }

  const store = await loadStore();
  const nextLines = store.editorialLines.filter((record) => record.manifestoId !== normalizedManifestoId);

  if (nextLines.length === store.editorialLines.length) {
    return;
  }

  store.editorialLines = nextLines;
  await saveStore(store);
};

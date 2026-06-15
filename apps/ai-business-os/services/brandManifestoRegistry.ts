import { promises as fs } from 'fs';
import path from 'path';
import type { BrandManifestoRecord, BrandManifestoSourceType } from '../types';

type ManifestoStore = {
  version: number;
  manifestos: BrandManifestoRecord[];
};

type BrandManifestoInput = {
  name: string;
  content: string;
  sourceType?: BrandManifestoSourceType;
  sourceFileName?: string | null;
};

const STORE_DIR = path.join(process.cwd(), '.aiox');
const STORE_PATH = path.join(STORE_DIR, 'branding-manifestos.json');
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

const loadStore = async (): Promise<ManifestoStore> => {
  await ensureStoreDir();

  try {
    const raw = await fs.readFile(STORE_PATH, 'utf8');
    const parsed = JSON.parse(raw) as Partial<ManifestoStore>;
    return {
      version: STORE_VERSION,
      manifestos: Array.isArray(parsed.manifestos) ? parsed.manifestos : [],
    };
  } catch (error) {
    if (isMissingFileError(error)) {
      return {
        version: STORE_VERSION,
        manifestos: [],
      };
    }

    throw new Error('Brand manifesto store is corrupted or unreadable.');
  }
};

const saveStore = async (store: ManifestoStore) => {
  await ensureStoreDir();
  await fs.writeFile(STORE_PATH, JSON.stringify(store, null, 2), 'utf8');
};

const createId = () => `manifesto-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const normalizeInput = (input: BrandManifestoInput) => {
  const name = sanitizeText(input.name);
  const content = sanitizeText(input.content);

  if (!name) {
    throw new Error('name is required.');
  }

  if (!content) {
    throw new Error('content is required.');
  }

  return {
    name,
    content,
    sourceType: input.sourceType || 'manual',
    sourceFileName: input.sourceFileName?.trim() || null,
  };
};

export const listBrandManifestos = async (): Promise<BrandManifestoRecord[]> => {
  const store = await loadStore();
  return [...store.manifestos].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
};

export const getBrandManifesto = async (id: string): Promise<BrandManifestoRecord | null> => {
  const store = await loadStore();
  return store.manifestos.find((m) => m.id === id) ?? null;
};

export const createBrandManifesto = async (input: BrandManifestoInput): Promise<BrandManifestoRecord> => {
  const normalized = normalizeInput(input);
  const store = await loadStore();
  const timestamp = nowIso();

  const manifesto: BrandManifestoRecord = {
    id: createId(),
    name: normalized.name,
    content: normalized.content,
    sourceType: normalized.sourceType,
    sourceFileName: normalized.sourceFileName,
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  store.manifestos.unshift(manifesto);
  await saveStore(store);

  return manifesto;
};

export const updateBrandManifesto = async (id: string, input: Partial<BrandManifestoInput>): Promise<BrandManifestoRecord> => {
  const store = await loadStore();
  const index = store.manifestos.findIndex((manifesto) => manifesto.id === id);

  if (index < 0) {
    throw new Error('Manifesto not found.');
  }

  const current = store.manifestos[index];
  const normalized = normalizeInput({
    name: input.name ?? current.name,
    content: input.content ?? current.content,
    sourceType: input.sourceType ?? current.sourceType,
    sourceFileName: input.sourceFileName ?? current.sourceFileName,
  });

  const updated: BrandManifestoRecord = {
    ...current,
    name: normalized.name,
    content: normalized.content,
    sourceType: normalized.sourceType,
    sourceFileName: normalized.sourceFileName,
    updatedAt: nowIso(),
  };

  store.manifestos[index] = updated;
  await saveStore(store);

  return updated;
};

export const deleteBrandManifesto = async (id: string): Promise<void> => {
  const store = await loadStore();
  const next = store.manifestos.filter((manifesto) => manifesto.id !== id);

  if (next.length === store.manifestos.length) {
    throw new Error('Manifesto not found.');
  }

  store.manifestos = next;
  await saveStore(store);
};

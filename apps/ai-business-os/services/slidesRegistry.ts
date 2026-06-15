import { promises as fs } from 'fs';
import path from 'path';

export interface SlidesRecord {
  id: string;
  title: string;
  format: string;
  inputMode: string;
  outputType: string;
  dsBrand: string;
  slideCount: number;
  html: string | null;
  pptxFilename: string | null;
  createdAt: string;
  updatedAt: string;
}

type SlidesStore = {
  version: number;
  slides: SlidesRecord[];
};

type SlidesInput = {
  title: string;
  format: string;
  inputMode: string;
  outputType: string;
  dsBrand: string;
  slideCount: number;
  html?: string | null;
  pptxFilename?: string | null;
};

const STORE_DIR = path.join(process.cwd(), '.aiox');
const STORE_PATH = path.join(STORE_DIR, 'slides-registry.json');
const STORE_VERSION = 1;

const nowIso = () => new Date().toISOString();

const ensureDir = async () => {
  await fs.mkdir(STORE_DIR, { recursive: true });
};

const isMissingFile = (err: unknown) =>
  typeof err === 'object' && err !== null && 'code' in err && err.code === 'ENOENT';

const loadStore = async (): Promise<SlidesStore> => {
  await ensureDir();
  try {
    const raw = await fs.readFile(STORE_PATH, 'utf8');
    const parsed = JSON.parse(raw) as Partial<SlidesStore>;
    return { version: STORE_VERSION, slides: Array.isArray(parsed.slides) ? parsed.slides : [] };
  } catch (err) {
    if (isMissingFile(err)) return { version: STORE_VERSION, slides: [] };
    throw new Error('Slides registry is corrupted or unreadable.');
  }
};

const saveStore = async (store: SlidesStore) => {
  await ensureDir();
  await fs.writeFile(STORE_PATH, JSON.stringify(store, null, 2), 'utf8');
};

const createId = () => `slides-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

export const listSlides = async (): Promise<SlidesRecord[]> => {
  const store = await loadStore();
  return [...store.slides].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
};

export const getSlide = async (id: string): Promise<SlidesRecord> => {
  const store = await loadStore();
  const record = store.slides.find((s) => s.id === id);
  if (!record) throw new Error('Slide not found.');
  return record;
};

export const createSlide = async (input: SlidesInput): Promise<SlidesRecord> => {
  const store = await loadStore();
  const now = nowIso();
  const record: SlidesRecord = {
    id: createId(),
    title: input.title || 'Sem título',
    format: input.format,
    inputMode: input.inputMode,
    outputType: input.outputType,
    dsBrand: input.dsBrand,
    slideCount: input.slideCount,
    html: input.html ?? null,
    pptxFilename: input.pptxFilename ?? null,
    createdAt: now,
    updatedAt: now,
  };
  store.slides.unshift(record);
  await saveStore(store);
  return record;
};

export const updateSlide = async (id: string, input: Partial<SlidesInput>): Promise<SlidesRecord> => {
  const store = await loadStore();
  const idx = store.slides.findIndex((s) => s.id === id);
  if (idx < 0) throw new Error('Slide not found.');
  const current = store.slides[idx];
  const updated: SlidesRecord = {
    ...current,
    ...(input.title !== undefined && { title: input.title }),
    ...(input.html !== undefined && { html: input.html }),
    ...(input.pptxFilename !== undefined && { pptxFilename: input.pptxFilename }),
    ...(input.slideCount !== undefined && { slideCount: input.slideCount }),
    updatedAt: nowIso(),
  };
  store.slides[idx] = updated;
  await saveStore(store);
  return updated;
};

export const deleteSlide = async (id: string): Promise<void> => {
  const store = await loadStore();
  const next = store.slides.filter((s) => s.id !== id);
  if (next.length === store.slides.length) throw new Error('Slide not found.');
  store.slides = next;
  await saveStore(store);
};

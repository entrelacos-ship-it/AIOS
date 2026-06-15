import { promises as fs } from 'fs';
import path from 'path';

type CarouselDraftTextAlign = 'left' | 'center' | 'right';
type CarouselDraftFontFamily = 'serif' | 'sans';
type CarouselDraftImageFit = 'cover' | 'contain';
type CarouselDraftImagePlacement = 'background' | 'half';

export interface BrandCarouselDraftSlideRecord {
  id: number;
  title: string;
  body: string;
  visualPrompt: string;
  eyebrow: string;
  footerLabel: string;
  imageUrl: string;
  templateId: string;
  accentColor: string;
  secondaryColor: string;
  surfaceColor: string;
  textColor: string;
  titleFontSize: number;
  bodyFontSize: number;
  textAlign: CarouselDraftTextAlign;
  titleFontFamily: CarouselDraftFontFamily;
  bodyFontFamily: CarouselDraftFontFamily;
  imageFit: CarouselDraftImageFit;
  imagePlacement: CarouselDraftImagePlacement;
  imageScale: number;
  backgroundColor: string;
}

export interface BrandCarouselDraftBrandProfile {
  brandName: string;
  brandHandle: string;
  studioLabel: string;
  profileImageUrl: string;
}

export interface BrandCarouselDraftRecord {
  id: string;
  name: string;
  manifestoId: string | null;
  selectedAsset: string;
  carouselStylePreset: string;
  selectedSlideIndex: number;
  packagingEditorPanel: string;
  brandProfile: BrandCarouselDraftBrandProfile;
  slides: BrandCarouselDraftSlideRecord[];
  createdAt: string;
  updatedAt: string;
}

type CarouselDraftStore = {
  version: number;
  drafts: BrandCarouselDraftRecord[];
};

type BrandCarouselDraftInput = {
  name: string;
  manifestoId?: string | null;
  selectedAsset?: string;
  carouselStylePreset?: string;
  selectedSlideIndex?: number;
  packagingEditorPanel?: string;
  brandProfile?: Partial<BrandCarouselDraftBrandProfile>;
  slides?: Array<Partial<BrandCarouselDraftSlideRecord>>;
};

const STORE_DIR = path.join(process.cwd(), '.aiox');
const STORE_PATH = path.join(STORE_DIR, 'branding-carousel-drafts.json');
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

const sanitizeText = (value: string) => value.replace(/\r\n/g, '\n').trim();

const sanitizeOptionalText = (value: unknown) => typeof value === 'string' ? value.replace(/\r\n/g, '\n').trim() : '';

const clampNumber = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const loadStore = async (): Promise<CarouselDraftStore> => {
  await ensureStoreDir();

  try {
    const raw = await fs.readFile(STORE_PATH, 'utf8');
    const parsed = JSON.parse(raw) as Partial<CarouselDraftStore>;
    return {
      version: STORE_VERSION,
      drafts: Array.isArray(parsed.drafts) ? parsed.drafts : [],
    };
  } catch (error) {
    if (isMissingFileError(error)) {
      return {
        version: STORE_VERSION,
        drafts: [],
      };
    }

    throw new Error('Brand carousel draft store is corrupted or unreadable.');
  }
};

const saveStore = async (store: CarouselDraftStore) => {
  await ensureStoreDir();
  await fs.writeFile(STORE_PATH, JSON.stringify(store, null, 2), 'utf8');
};

const createId = () => `carousel-draft-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const normalizeSlides = (slides: Array<Partial<BrandCarouselDraftSlideRecord>>) => {
  if (!Array.isArray(slides) || slides.length === 0) {
    throw new Error('slides are required.');
  }

  return slides.map((slide, index) => ({
    id: Number.isFinite(slide.id) ? Number(slide.id) : index + 1,
    title: sanitizeOptionalText(slide.title) || `Slide ${index + 1}`,
    body: sanitizeOptionalText(slide.body),
    visualPrompt: sanitizeOptionalText(slide.visualPrompt),
    eyebrow: sanitizeOptionalText(slide.eyebrow),
    footerLabel: sanitizeOptionalText(slide.footerLabel),
    imageUrl: sanitizeOptionalText(slide.imageUrl),
    templateId: sanitizeOptionalText(slide.templateId) || 'editorial',
    accentColor: sanitizeOptionalText(slide.accentColor) || '#9900ff',
    secondaryColor: sanitizeOptionalText(slide.secondaryColor) || '#4f46e5',
    surfaceColor: sanitizeOptionalText(slide.surfaceColor) || '#141414',
    textColor: sanitizeOptionalText(slide.textColor) || '#f5f5f5',
    titleFontSize: clampNumber(Number(slide.titleFontSize) || 48, 20, 120),
    bodyFontSize: clampNumber(Number(slide.bodyFontSize) || 34, 20, 48),
    textAlign: slide.textAlign === 'center' || slide.textAlign === 'right' ? slide.textAlign : 'left',
    titleFontFamily: slide.titleFontFamily === 'sans' ? 'sans' : 'serif',
    bodyFontFamily: slide.bodyFontFamily === 'serif' ? 'serif' : 'sans',
    imageFit: slide.imageFit === 'contain' ? 'contain' : 'cover',
    imagePlacement: slide.imagePlacement === 'half' ? 'half' : 'background',
    imageScale: clampNumber(Number(slide.imageScale) || 100, 40, 180),
    backgroundColor: sanitizeOptionalText(slide.backgroundColor) || '#0a0a0a',
  }));
};

const normalizeInput = (input: BrandCarouselDraftInput, current?: BrandCarouselDraftRecord) => {
  const name = sanitizeText(input.name ?? current?.name ?? '');
  if (!name) {
    throw new Error('name is required.');
  }

  const slides = normalizeSlides(input.slides ?? current?.slides ?? []);
  const selectedSlideIndex = clampNumber(
    Number(input.selectedSlideIndex ?? current?.selectedSlideIndex ?? 0) || 0,
    0,
    Math.max(0, slides.length - 1),
  );

  return {
    name,
    manifestoId: sanitizeOptionalText(input.manifestoId ?? current?.manifestoId ?? '') || null,
    selectedAsset: sanitizeOptionalText(input.selectedAsset ?? current?.selectedAsset ?? '') || 'Carousel',
    carouselStylePreset: sanitizeOptionalText(input.carouselStylePreset ?? current?.carouselStylePreset ?? '') || 'brand-editorial',
    selectedSlideIndex,
    packagingEditorPanel: sanitizeOptionalText(input.packagingEditorPanel ?? current?.packagingEditorPanel ?? '') || 'content',
    brandProfile: {
      brandName: sanitizeOptionalText(input.brandProfile?.brandName ?? current?.brandProfile.brandName ?? ''),
      brandHandle: sanitizeOptionalText(input.brandProfile?.brandHandle ?? current?.brandProfile.brandHandle ?? ''),
      studioLabel: sanitizeOptionalText(input.brandProfile?.studioLabel ?? current?.brandProfile.studioLabel ?? ''),
      profileImageUrl: sanitizeOptionalText(input.brandProfile?.profileImageUrl ?? current?.brandProfile.profileImageUrl ?? ''),
    },
    slides,
  };
};

export const listBrandCarouselDrafts = async (): Promise<BrandCarouselDraftRecord[]> => {
  const store = await loadStore();
  return [...store.drafts].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
};

export const getBrandCarouselDraft = async (id: string): Promise<BrandCarouselDraftRecord> => {
  const store = await loadStore();
  const draft = store.drafts.find((item) => item.id === id);

  if (!draft) {
    throw new Error('Carousel draft not found.');
  }

  return draft;
};

export const createBrandCarouselDraft = async (input: BrandCarouselDraftInput): Promise<BrandCarouselDraftRecord> => {
  const normalized = normalizeInput(input);
  const store = await loadStore();
  const timestamp = nowIso();

  const draft: BrandCarouselDraftRecord = {
    id: createId(),
    createdAt: timestamp,
    updatedAt: timestamp,
    ...normalized,
  };

  store.drafts.unshift(draft);
  await saveStore(store);

  return draft;
};

export const updateBrandCarouselDraft = async (id: string, input: BrandCarouselDraftInput): Promise<BrandCarouselDraftRecord> => {
  const store = await loadStore();
  const index = store.drafts.findIndex((draft) => draft.id === id);

  if (index < 0) {
    throw new Error('Carousel draft not found.');
  }

  const current = store.drafts[index];
  const normalized = normalizeInput(input, current);
  const updated: BrandCarouselDraftRecord = {
    ...current,
    ...normalized,
    updatedAt: nowIso(),
  };

  store.drafts[index] = updated;
  await saveStore(store);

  return updated;
};

export const deleteBrandCarouselDraft = async (id: string): Promise<void> => {
  const store = await loadStore();
  const next = store.drafts.filter((draft) => draft.id !== id);

  if (next.length === store.drafts.length) {
    throw new Error('Carousel draft not found.');
  }

  store.drafts = next;
  await saveStore(store);
};

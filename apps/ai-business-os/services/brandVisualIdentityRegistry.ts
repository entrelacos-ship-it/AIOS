import { promises as fs } from 'fs';
import path from 'path';
import type {
  BrandEditorialLineScopeMode,
  BrandVisualIdentityRecord,
  BrandVisualIdentitySource,
} from '../types';

type VisualIdentityStore = {
  version: number;
  identities: BrandVisualIdentityRecord[];
};

type VisualIdentityScopeInput = {
  manifestoId: string | null;
  scopeMode: BrandEditorialLineScopeMode;
  blankWorkspaceId?: string | null;
};

type UpsertBrandVisualIdentityInput = VisualIdentityScopeInput & {
  brandName?: string;
  brandHandle?: string;
  brandStudioLabel?: string;
  instagramPageName?: string;
  instagramUsername?: string;
  profileImageUrl?: string;
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
  backgroundColor?: string;
  surfaceColor?: string;
  textColor?: string;
  titleFontFamily?: 'serif' | 'sans';
  bodyFontFamily?: 'serif' | 'sans';
  titleFontSize?: number;
  bodyFontSize?: number;
  visualStyle?: string;
  imageryDirection?: string;
  layoutNotes?: string;
  source?: BrandVisualIdentitySource;
};

const STORE_DIR = path.join(process.cwd(), '.aiox');
const STORE_PATH = path.join(STORE_DIR, 'branding-visual-identities.json');
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

const loadStore = async (): Promise<VisualIdentityStore> => {
  await ensureStoreDir();

  try {
    const raw = await fs.readFile(STORE_PATH, 'utf8');
    const parsed = JSON.parse(raw) as Partial<VisualIdentityStore>;
    return {
      version: STORE_VERSION,
      identities: Array.isArray(parsed.identities) ? parsed.identities : [],
    };
  } catch (error) {
    if (isMissingFileError(error)) {
      return {
        version: STORE_VERSION,
        identities: [],
      };
    }

    throw new Error('Brand visual identity store is corrupted or unreadable.');
  }
};

const saveStore = async (store: VisualIdentityStore) => {
  await ensureStoreDir();
  await fs.writeFile(STORE_PATH, JSON.stringify(store, null, 2), 'utf8');
};

const createId = () => `visual-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const normalizeScope = (scope: VisualIdentityScopeInput): VisualIdentityScopeInput => {
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

const matchesScope = (record: BrandVisualIdentityRecord, scope: VisualIdentityScopeInput) => (
  record.scopeMode === scope.scopeMode &&
  record.manifestoId === scope.manifestoId &&
  (scope.scopeMode !== 'blank' || (record.blankWorkspaceId ?? null) === (scope.blankWorkspaceId ?? null))
);

const ensureHex = (value: string | undefined, fallback: string) => {
  const next = (value || '').trim();
  return /^#[0-9a-fA-F]{6}$/.test(next) ? next : fallback;
};

const clamp = (value: number | undefined, min: number, max: number, fallback: number) => {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return fallback;
  }

  return Math.min(max, Math.max(min, Math.round(value)));
};

const buildDefaultIdentity = (scope: VisualIdentityScopeInput): BrandVisualIdentityRecord => {
  const timestamp = nowIso();
  return {
    id: createId(),
    manifestoId: scope.manifestoId,
    scopeMode: scope.scopeMode,
    blankWorkspaceId: scope.blankWorkspaceId ?? null,
    brandName: 'Entrelaç[OS]',
    brandHandle: '@entrelacos.ai',
    brandStudioLabel: 'Entrelaços Studio',
    instagramPageName: '',
    instagramUsername: '',
    profileImageUrl: '',
    primaryColor: '#9900ff',
    secondaryColor: '#9900ff',
    accentColor: '#9900ff',
    backgroundColor: '#141414',
    surfaceColor: '#1f1f1f',
    textColor: '#f5f5f5',
    titleFontFamily: 'serif',
    bodyFontFamily: 'sans',
    titleFontSize: 48,
    bodyFontSize: 34,
    visualStyle: 'Editorial premium, contrastado, direto e contemporâneo.',
    imageryDirection: 'Retratos, close-up, fundos escuros, contraste alto e poucos elementos.',
    layoutNotes: 'Priorizar capas fortes, áreas de respiro e CTAs objetivos no slide final.',
    source: 'manual',
    createdAt: timestamp,
    updatedAt: timestamp,
  };
};

export const getBrandVisualIdentity = async (
  scope: VisualIdentityScopeInput,
): Promise<BrandVisualIdentityRecord | null> => {
  const normalizedScope = normalizeScope(scope);
  const store = await loadStore();
  return store.identities.find((record) => matchesScope(record, normalizedScope)) || null;
};

export const upsertBrandVisualIdentity = async (
  input: UpsertBrandVisualIdentityInput,
): Promise<BrandVisualIdentityRecord> => {
  const normalizedScope = normalizeScope(input);
  const store = await loadStore();
  const current = store.identities.find((record) => matchesScope(record, normalizedScope));
  const base = current || buildDefaultIdentity(normalizedScope);

  const next: BrandVisualIdentityRecord = {
    ...base,
    manifestoId: normalizedScope.manifestoId,
    scopeMode: normalizedScope.scopeMode,
    blankWorkspaceId: normalizedScope.blankWorkspaceId ?? null,
    brandName: sanitizeText(input.brandName ?? base.brandName),
    brandHandle: sanitizeText(input.brandHandle ?? base.brandHandle),
    brandStudioLabel: sanitizeText(input.brandStudioLabel ?? base.brandStudioLabel),
    instagramPageName: sanitizeText(input.instagramPageName ?? base.instagramPageName),
    instagramUsername: sanitizeText(input.instagramUsername ?? base.instagramUsername),
    profileImageUrl: sanitizeText(input.profileImageUrl ?? base.profileImageUrl),
    primaryColor: ensureHex(input.primaryColor, base.primaryColor),
    secondaryColor: ensureHex(input.secondaryColor, base.secondaryColor),
    accentColor: ensureHex(input.accentColor, base.accentColor),
    backgroundColor: ensureHex(input.backgroundColor, base.backgroundColor),
    surfaceColor: ensureHex(input.surfaceColor, base.surfaceColor),
    textColor: ensureHex(input.textColor, base.textColor),
    titleFontFamily: input.titleFontFamily === 'sans' ? 'sans' : input.titleFontFamily === 'serif' ? 'serif' : base.titleFontFamily,
    bodyFontFamily: input.bodyFontFamily === 'serif' ? 'serif' : input.bodyFontFamily === 'sans' ? 'sans' : base.bodyFontFamily,
    titleFontSize: clamp(input.titleFontSize, 24, 96, base.titleFontSize),
    bodyFontSize: clamp(input.bodyFontSize, 20, 48, base.bodyFontSize),
    visualStyle: sanitizeText(input.visualStyle ?? base.visualStyle),
    imageryDirection: sanitizeText(input.imageryDirection ?? base.imageryDirection),
    layoutNotes: sanitizeText(input.layoutNotes ?? base.layoutNotes),
    source: input.source === 'instagram_seed' ? 'instagram_seed' : input.source === 'manual' ? 'manual' : base.source,
    updatedAt: nowIso(),
  };

  if (!next.brandName) {
    throw new Error('brandName is required.');
  }

  if (!next.brandHandle) {
    throw new Error('brandHandle is required.');
  }

  store.identities = [
    ...store.identities.filter((record) => !matchesScope(record, normalizedScope)),
    next,
  ];

  await saveStore(store);
  return next;
};

export const deleteBrandVisualIdentityByManifesto = async (manifestoId: string): Promise<void> => {
  const normalizedManifestoId = manifestoId.trim();
  if (!normalizedManifestoId) {
    return;
  }

  const store = await loadStore();
  const nextRecords = store.identities.filter((record) => record.manifestoId !== normalizedManifestoId);

  if (nextRecords.length === store.identities.length) {
    return;
  }

  store.identities = nextRecords;
  await saveStore(store);
};

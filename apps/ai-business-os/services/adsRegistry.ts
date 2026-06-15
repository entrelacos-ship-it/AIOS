import { promises as fs } from 'fs';
import path from 'path';
import type { AdsAuditRecord, AdsCopyRecord, AdsStrategyRecord } from '../types.js';

interface Store {
  version: number;
  audits: AdsAuditRecord[];
  copy: AdsCopyRecord[];
  strategy: AdsStrategyRecord[];
}

const STORE_DIR = path.join(process.cwd(), '.aiox');
const STORE_PATH = path.join(STORE_DIR, 'ads.json');

const nowIso = () => new Date().toISOString();
const createId = (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

const isEnoent = (e: unknown) =>
  typeof e === 'object' && e !== null && 'code' in e && (e as { code: string }).code === 'ENOENT';

async function load(): Promise<Store> {
  await fs.mkdir(STORE_DIR, { recursive: true });
  try {
    return JSON.parse(await fs.readFile(STORE_PATH, 'utf8')) as Store;
  } catch (e) {
    if (isEnoent(e)) return { version: 1, audits: [], copy: [], strategy: [] };
    throw e;
  }
}

async function save(store: Store): Promise<void> {
  await fs.mkdir(STORE_DIR, { recursive: true });
  await fs.writeFile(STORE_PATH, JSON.stringify(store, null, 2), 'utf8');
}

// ─── Audits ───────────────────────────────────────────────────────────────────

export async function listAdsAudits(): Promise<AdsAuditRecord[]> {
  const s = await load();
  return s.audits.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function saveAdsAudit(data: Omit<AdsAuditRecord, 'id' | 'createdAt'>): Promise<AdsAuditRecord> {
  const s = await load();
  const record: AdsAuditRecord = { ...data, id: createId('audit'), createdAt: nowIso() };
  s.audits.unshift(record);
  if (s.audits.length > 50) s.audits = s.audits.slice(0, 50);
  await save(s);
  return record;
}

export async function deleteAdsAudit(id: string): Promise<void> {
  const s = await load();
  s.audits = s.audits.filter((a) => a.id !== id);
  await save(s);
}

// ─── Copy ─────────────────────────────────────────────────────────────────────

export async function listAdsCopy(): Promise<AdsCopyRecord[]> {
  const s = await load();
  return s.copy.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function saveAdsCopy(data: Omit<AdsCopyRecord, 'id' | 'createdAt'>): Promise<AdsCopyRecord> {
  const s = await load();
  const record: AdsCopyRecord = { ...data, id: createId('copy'), createdAt: nowIso() };
  s.copy.unshift(record);
  if (s.copy.length > 100) s.copy = s.copy.slice(0, 100);
  await save(s);
  return record;
}

export async function deleteAdsCopy(id: string): Promise<void> {
  const s = await load();
  s.copy = s.copy.filter((c) => c.id !== id);
  await save(s);
}

// ─── Strategy ─────────────────────────────────────────────────────────────────

export async function listAdsStrategy(): Promise<AdsStrategyRecord[]> {
  const s = await load();
  return s.strategy.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function saveAdsStrategy(data: Omit<AdsStrategyRecord, 'id' | 'createdAt'>): Promise<AdsStrategyRecord> {
  const s = await load();
  const record: AdsStrategyRecord = { ...data, id: createId('strat'), createdAt: nowIso() };
  s.strategy.unshift(record);
  if (s.strategy.length > 50) s.strategy = s.strategy.slice(0, 50);
  await save(s);
  return record;
}

export async function deleteAdsStrategy(id: string): Promise<void> {
  const s = await load();
  s.strategy = s.strategy.filter((s2) => s2.id !== id);
  await save(s);
}

import { promises as fs } from 'fs';
import path from 'path';
import type { AIProviderId } from '../types.js';

export type AIUsageEvent = {
  id: string;
  providerId: AIProviderId;
  model: string;
  capability: string;
  requestedAt: string;
  promptTokens: number | null;
  completionTokens: number | null;
  totalTokens: number | null;
};

type AIUsageStore = {
  version: number;
  events: AIUsageEvent[];
};

type AIUsageSummary = {
  totalRequests: number;
  totalTokens: number;
  lastEvent: AIUsageEvent | null;
  currentModelUsagePercent: number;
  currentProviderUsagePercent: number;
  modelBreakdown: Array<{ model: string; requests: number; percent: number }>;
  providerBreakdown: Array<{ providerId: AIProviderId; requests: number; percent: number }>;
};

const STORE_DIR = path.join(process.cwd(), '.aiox');
const STORE_PATH = path.join(STORE_DIR, 'ai-usage.json');
const STORE_VERSION = 1;
const MAX_EVENTS = 500;

const ensureStoreDir = async () => {
  await fs.mkdir(STORE_DIR, { recursive: true });
};

const loadStore = async (): Promise<AIUsageStore> => {
  await ensureStoreDir();

  try {
    const raw = await fs.readFile(STORE_PATH, 'utf8');
    const parsed = JSON.parse(raw) as Partial<AIUsageStore>;
    return {
      version: STORE_VERSION,
      events: Array.isArray(parsed.events) ? parsed.events : [],
    };
  } catch {
    return {
      version: STORE_VERSION,
      events: [],
    };
  }
};

const saveStore = async (store: AIUsageStore) => {
  await ensureStoreDir();
  await fs.writeFile(STORE_PATH, JSON.stringify(store, null, 2), 'utf8');
};

export const recordAIUsageEvent = async (event: Omit<AIUsageEvent, 'id' | 'requestedAt'>) => {
  const store = await loadStore();
  const usageEvent: AIUsageEvent = {
    id: `ai_usage_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    requestedAt: new Date().toISOString(),
    ...event,
  };

  store.events.unshift(usageEvent);
  store.events = store.events.slice(0, MAX_EVENTS);
  await saveStore(store);
  return usageEvent;
};

export const getAIUsageSummary = async (): Promise<AIUsageSummary> => {
  const store = await loadStore();
  const totalRequests = store.events.length;
  const totalTokens = store.events.reduce((sum, event) => sum + (event.totalTokens || 0), 0);
  const lastEvent = store.events[0] || null;

  const modelCounts = new Map<string, number>();
  const providerCounts = new Map<AIProviderId, number>();

  store.events.forEach((event) => {
    modelCounts.set(event.model, (modelCounts.get(event.model) || 0) + 1);
    providerCounts.set(event.providerId, (providerCounts.get(event.providerId) || 0) + 1);
  });

  const modelBreakdown = [...modelCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([model, requests]) => ({
      model,
      requests,
      percent: totalRequests > 0 ? Math.round((requests / totalRequests) * 100) : 0,
    }));

  const providerBreakdown = [...providerCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([providerId, requests]) => ({
      providerId,
      requests,
      percent: totalRequests > 0 ? Math.round((requests / totalRequests) * 100) : 0,
    }));

  const currentModelUsagePercent = lastEvent
    ? modelBreakdown.find((item) => item.model === lastEvent.model)?.percent || 0
    : 0;
  const currentProviderUsagePercent = lastEvent
    ? providerBreakdown.find((item) => item.providerId === lastEvent.providerId)?.percent || 0
    : 0;

  return {
    totalRequests,
    totalTokens,
    lastEvent,
    currentModelUsagePercent,
    currentProviderUsagePercent,
    modelBreakdown,
    providerBreakdown,
  };
};

import { promises as fs } from 'fs';
import path from 'path';
import crypto from 'crypto';
import { GoogleGenAI } from '@google/genai';
import { recordAIUsageEvent } from './aiUsageRegistry.js';
import type {
  AICapability,
  AIProviderConfig,
  AIProviderHealth,
  AIProviderId,
  AIProviderRecord,
  AIRoutingPolicy,
} from '../types';

type GroqMessage = {
  role: 'system' | 'user' | 'assistant';
  content: string;
};

type GroqResponseFormat = {
  name: string;
  schema: Record<string, unknown>;
  strict?: boolean;
};

type RouterChatRequest = {
  capability: AICapability;
  messages: GroqMessage[];
  responseFormat?: GroqResponseFormat;
  temperature?: number;
  maxTokens?: number;
  model?: string;
};

type RouterImageGenerationRequest = {
  prompt: string;
  size: string;
  ratio: string;
  model?: string;
};

type RouterImageEditingRequest = {
  prompt: string;
  base64Image: string;
  mimeType?: string;
  model?: string;
};

type RouterVideoRequest = {
  prompt: string;
  aspectRatio: '16:9' | '9:16';
  model?: string;
};

type GroundingSource = {
  title: string;
  uri: string;
};

type AIRequestUsage = {
  promptTokens: number | null;
  completionTokens: number | null;
  totalTokens: number | null;
};

type StoredProviderState = {
  enabled: boolean;
  baseUrl?: string;
  modelDefaults: Partial<Record<AICapability, string>>;
  capabilities: Record<AICapability, boolean>;
  encryptedApiKey?: string;
  credentialUpdatedAt?: string;
  credentialStatus?: AIProviderConfig['credentialStatus'];
  lastHealth?: AIProviderHealth;
};

type ProviderStore = {
  version: number;
  providers: Record<AIProviderId, StoredProviderState>;
  routing: Record<AICapability, AIRoutingPolicy>;
};

const STORE_DIR = path.join(process.cwd(), '.aiox');
const STORE_PATH = path.join(STORE_DIR, 'provider-config.json');
const MASTER_KEY_PATH = path.join(STORE_DIR, 'provider-master.key');
const STORE_VERSION = 1;

const PROVIDERS: Array<{ id: AIProviderId; label: string }> = [
  { id: 'groq', label: 'Groq' },
  { id: 'gemini', label: 'Gemini' },
  { id: 'openai', label: 'OpenAI' },
  { id: 'anthropic', label: 'Anthropic' },
  { id: 'openrouter', label: 'OpenRouter' },
];

const CAPABILITIES: AICapability[] = [
  'text_generation',
  'structured_text',
  'image_generation',
  'image_editing',
  'video_generation',
  'search_grounded_text',
];

const ENV_KEY_MAP: Partial<Record<AIProviderId, string[]>> = {
  groq: ['GROQ_API_KEY'],
  gemini: ['GEMINI_API_KEY', 'API_KEY'],
  openai: ['OPENAI_API_KEY'],
  anthropic: ['ANTHROPIC_API_KEY'],
  openrouter: ['OPENROUTER_API_KEY'],
};

const SUPPORTED_PROVIDER_CAPABILITIES: Record<AIProviderId, readonly AICapability[]> = {
  groq: ['text_generation', 'structured_text'],
  gemini: ['text_generation', 'structured_text', 'image_generation', 'image_editing', 'video_generation', 'search_grounded_text'],
  openai: [],
  anthropic: [],
  openrouter: [],
};

const DEFAULT_PROVIDER_STATE: Record<AIProviderId, StoredProviderState> = {
  groq: {
    enabled: true,
    modelDefaults: {
      text_generation: 'openai/gpt-oss-20b',
      structured_text: 'openai/gpt-oss-20b',
    },
    capabilities: {
      text_generation: true,
      structured_text: true,
      image_generation: false,
      image_editing: false,
      video_generation: false,
      search_grounded_text: false,
    },
    credentialStatus: 'missing',
  },
  gemini: {
    enabled: true,
    modelDefaults: {
      text_generation: 'gemini-2.5-flash',
      structured_text: 'gemini-2.5-flash',
      image_generation: 'gemini-2.5-flash-image',
      image_editing: 'gemini-2.5-flash-image',
      video_generation: 'veo-3.1-fast-generate-preview',
      search_grounded_text: 'gemini-2.5-pro',
    },
    capabilities: {
      text_generation: true,
      structured_text: true,
      image_generation: true,
      image_editing: true,
      video_generation: true,
      search_grounded_text: true,
    },
    credentialStatus: 'missing',
  },
  openai: {
    enabled: false,
    modelDefaults: {},
    capabilities: {
      text_generation: true,
      structured_text: true,
      image_generation: true,
      image_editing: false,
      video_generation: false,
      search_grounded_text: false,
    },
    credentialStatus: 'missing',
  },
  anthropic: {
    enabled: false,
    modelDefaults: {},
    capabilities: {
      text_generation: true,
      structured_text: true,
      image_generation: false,
      image_editing: false,
      video_generation: false,
      search_grounded_text: false,
    },
    credentialStatus: 'missing',
  },
  openrouter: {
    enabled: false,
    modelDefaults: {},
    capabilities: {
      text_generation: true,
      structured_text: true,
      image_generation: true,
      image_editing: false,
      video_generation: false,
      search_grounded_text: false,
    },
    credentialStatus: 'missing',
  },
};

const DEFAULT_ROUTING: Record<AICapability, AIRoutingPolicy> = {
  text_generation: { capability: 'text_generation', primaryProvider: 'groq', fallbackOrder: ['gemini'] },
  structured_text: { capability: 'structured_text', primaryProvider: 'groq', fallbackOrder: ['gemini'] },
  image_generation: { capability: 'image_generation', primaryProvider: 'gemini', fallbackOrder: [] },
  image_editing: { capability: 'image_editing', primaryProvider: 'gemini', fallbackOrder: [] },
  video_generation: { capability: 'video_generation', primaryProvider: 'gemini', fallbackOrder: [] },
  search_grounded_text: { capability: 'search_grounded_text', primaryProvider: 'gemini', fallbackOrder: ['groq'] },
};

const nowIso = () => new Date().toISOString();

const cloneDefaults = (): ProviderStore => ({
  version: STORE_VERSION,
  providers: Object.fromEntries(
    PROVIDERS.map(({ id }) => [id, { ...DEFAULT_PROVIDER_STATE[id], capabilities: { ...DEFAULT_PROVIDER_STATE[id].capabilities }, modelDefaults: { ...DEFAULT_PROVIDER_STATE[id].modelDefaults } }]),
  ) as Record<AIProviderId, StoredProviderState>,
  routing: Object.fromEntries(
    CAPABILITIES.map((capability) => [capability, { ...DEFAULT_ROUTING[capability], fallbackOrder: [...DEFAULT_ROUTING[capability].fallbackOrder] }]),
  ) as Record<AICapability, AIRoutingPolicy>,
});

const ensureStoreDir = async () => {
  await fs.mkdir(STORE_DIR, { recursive: true });
};

const getMasterKey = async () => {
  await ensureStoreDir();

  if (process.env.AI_PROVIDER_MASTER_KEY) {
    return crypto.createHash('sha256').update(process.env.AI_PROVIDER_MASTER_KEY).digest();
  }

  try {
    const existing = await fs.readFile(MASTER_KEY_PATH, 'utf8');
    return crypto.createHash('sha256').update(existing.trim()).digest();
  } catch {
    const generated = crypto.randomBytes(32).toString('hex');
    await fs.writeFile(MASTER_KEY_PATH, generated, 'utf8');
    return crypto.createHash('sha256').update(generated).digest();
  }
};

const encryptSecret = async (value: string) => {
  const key = await getMasterKey();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const encrypted = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString('base64')}.${tag.toString('base64')}.${encrypted.toString('base64')}`;
};

const decryptSecret = async (payload?: string) => {
  if (!payload) return '';

  const [ivRaw, tagRaw, encryptedRaw] = payload.split('.');
  if (!ivRaw || !tagRaw || !encryptedRaw) return '';

  const key = await getMasterKey();
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, Buffer.from(ivRaw, 'base64'));
  decipher.setAuthTag(Buffer.from(tagRaw, 'base64'));
  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(encryptedRaw, 'base64')),
    decipher.final(),
  ]);

  return decrypted.toString('utf8');
};

const maskKey = (value: string) => {
  if (!value) return '';
  if (value.length <= 8) return '********';
  return `${value.slice(0, 4)}••••${value.slice(-4)}`;
};

const canProviderHandleCapability = (providerId: AIProviderId, capability: AICapability) =>
  SUPPORTED_PROVIDER_CAPABILITIES[providerId].includes(capability);

const getEnvApiKey = (providerId: AIProviderId) => {
  const envKeys = ENV_KEY_MAP[providerId] || [];

  for (const envKey of envKeys) {
    const value = process.env[envKey];
    if (value?.trim()) return value.trim();
  }

  return '';
};

const getProviderApiKey = async (providerId: AIProviderId, provider: StoredProviderState) => {
  const decrypted = await decryptSecret(provider.encryptedApiKey);
  if (decrypted) {
    return decrypted;
  }

  return getEnvApiKey(providerId);
};

const mergeProviderState = (providerId: AIProviderId, current?: StoredProviderState): StoredProviderState => {
  const defaults = DEFAULT_PROVIDER_STATE[providerId];
  const merged: StoredProviderState = {
    enabled: current?.enabled ?? defaults.enabled,
    baseUrl: current?.baseUrl ?? defaults.baseUrl,
    modelDefaults: { ...defaults.modelDefaults, ...(current?.modelDefaults || {}) },
    capabilities: Object.fromEntries(
      CAPABILITIES.map((capability) => [
        capability,
        canProviderHandleCapability(providerId, capability)
          ? (current?.capabilities?.[capability] ?? defaults.capabilities[capability])
          : false,
      ]),
    ) as Record<AICapability, boolean>,
    encryptedApiKey: current?.encryptedApiKey,
    credentialUpdatedAt: current?.credentialUpdatedAt,
    credentialStatus: current?.credentialStatus ?? defaults.credentialStatus,
    lastHealth: current?.lastHealth ?? { providerId, state: 'unknown', message: 'Not tested yet.', checkedAt: null },
  };

  return merged;
};

const loadStore = async (): Promise<ProviderStore> => {
  await ensureStoreDir();

  let store = cloneDefaults();

  try {
    const raw = await fs.readFile(STORE_PATH, 'utf8');
    const parsed = JSON.parse(raw) as Partial<ProviderStore>;

    store = {
      version: STORE_VERSION,
      providers: Object.fromEntries(PROVIDERS.map(({ id }) => [id, mergeProviderState(id, parsed.providers?.[id])])) as Record<AIProviderId, StoredProviderState>,
      routing: Object.fromEntries(
        CAPABILITIES.map((capability) => [
          capability,
          {
            ...DEFAULT_ROUTING[capability],
            ...(parsed.routing?.[capability] || {}),
            fallbackOrder: [...(parsed.routing?.[capability]?.fallbackOrder || DEFAULT_ROUTING[capability].fallbackOrder)],
          },
        ]),
      ) as Record<AICapability, AIRoutingPolicy>,
    };
  } catch {
    store = cloneDefaults();
  }

  let changed = false;

  for (const { id } of PROVIDERS) {
    const provider = store.providers[id];
    const envKey = getEnvApiKey(id);

    if (!provider.encryptedApiKey && envKey) {
      provider.encryptedApiKey = await encryptSecret(envKey);
      provider.credentialStatus = 'configured';
      provider.credentialUpdatedAt = nowIso();
      changed = true;
    }
  }

  if (changed) {
    await saveStore(store);
  }

  return store;
};

const saveStore = async (store: ProviderStore) => {
  await ensureStoreDir();
  await fs.writeFile(STORE_PATH, JSON.stringify(store, null, 2), 'utf8');
};

const toProviderRecord = async (providerId: AIProviderId, state: StoredProviderState): Promise<AIProviderRecord> => {
  const decrypted = await getProviderApiKey(providerId, state);
  return {
    config: {
      id: providerId,
      label: PROVIDERS.find((provider) => provider.id === providerId)?.label || providerId,
      enabled: state.enabled,
      baseUrl: state.baseUrl,
      modelDefaults: state.modelDefaults,
      capabilities: state.capabilities,
      credentialStatus: decrypted ? 'configured' : (state.credentialStatus || 'missing'),
      updatedAt: state.credentialUpdatedAt || nowIso(),
    },
    secret: {
      providerId,
      maskedKey: decrypted ? maskKey(decrypted) : '',
      hasKey: Boolean(decrypted),
      updatedAt: state.credentialUpdatedAt || null,
    },
  };
};

const testGroq = async (apiKey: string, model: string) => {
  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      messages: [{ role: 'user', content: 'Reply with OK.' }],
      temperature: 0,
      max_completion_tokens: 16,
    }),
  });

  if (!response.ok) {
    throw new Error(`Groq responded with ${response.status}`);
  }
};

const testGemini = async (apiKey: string, model: string) => {
  const client = new GoogleGenAI({ apiKey });
  const response = await client.models.generateContent({
    model,
    contents: 'Reply with OK.',
  });

  if (!response.text) {
    throw new Error('Gemini returned an empty response.');
  }
};

const updateHealth = async (providerId: AIProviderId, health: AIProviderHealth) => {
  const store = await loadStore();
  store.providers[providerId].lastHealth = health;
  await saveStore(store);
  return health;
};

const buildHealth = (providerId: AIProviderId, state: AIProviderHealth['state'], message: string): AIProviderHealth => ({
  providerId,
  state,
  message,
  checkedAt: nowIso(),
});

const toDataUrl = (data: string, mimeType = 'image/png') => `data:${mimeType};base64,${data}`;

const stripDataUrlPrefix = (payload: string) => {
  const match = payload.match(/^data:(.+?);base64,(.+)$/);
  if (!match) {
    return {
      mimeType: 'image/png',
      data: payload,
    };
  }

  return {
    mimeType: match[1] || 'image/png',
    data: match[2] || '',
  };
};

const extractGroundingSources = (response: Awaited<ReturnType<GoogleGenAI['models']['generateContent']>>): GroundingSource[] => {
  const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
  const seen = new Set<string>();
  const sources: GroundingSource[] = [];

  chunks.forEach((chunk) => {
    const title = chunk.web?.title?.trim();
    const uri = chunk.web?.uri?.trim();

    if (!title || !uri || seen.has(uri)) {
      return;
    }

    seen.add(uri);
    sources.push({ title, uri });
  });

  return sources;
};

const extractInlineImages = (response: Awaited<ReturnType<GoogleGenAI['models']['generateContent']>>) => {
  const parts = response.candidates?.[0]?.content?.parts || [];
  const images: string[] = [];

  parts.forEach((part) => {
    if (part.inlineData?.data) {
      images.push(toDataUrl(part.inlineData.data, part.inlineData.mimeType || 'image/png'));
    }
  });

  return images;
};

const fetchGeminiMediaAsDataUrl = async (uri: string, apiKey: string, fallbackMimeType: string) => {
  const separator = uri.includes('?') ? '&' : '?';
  const response = await fetch(`${uri}${separator}key=${encodeURIComponent(apiKey)}`);

  if (!response.ok) {
    throw new Error(`Gemini media download failed (${response.status})`);
  }

  const arrayBuffer = await response.arrayBuffer();
  const mimeType = response.headers.get('content-type') || fallbackMimeType;
  return toDataUrl(Buffer.from(arrayBuffer).toString('base64'), mimeType);
};

const testProviderInternal = async (providerId: AIProviderId, store?: ProviderStore): Promise<AIProviderHealth> => {
  const currentStore = store || await loadStore();
  const provider = currentStore.providers[providerId];

  if (!provider.enabled) {
    return updateHealth(providerId, buildHealth(providerId, 'disabled', 'Provider is disabled.'));
  }

  const apiKey = await getProviderApiKey(providerId, provider);
  if (!apiKey) {
    return updateHealth(providerId, buildHealth(providerId, 'missing_credentials', 'No credentials configured.'));
  }

  try {
    if (providerId === 'groq') {
      await testGroq(apiKey, provider.modelDefaults.structured_text || 'openai/gpt-oss-20b');
    } else if (providerId === 'gemini') {
      await testGemini(apiKey, provider.modelDefaults.structured_text || 'gemini-2.5-flash');
    } else {
      return updateHealth(providerId, buildHealth(providerId, 'unknown', 'Provider test is not implemented yet.'));
    }

    return updateHealth(providerId, buildHealth(providerId, 'healthy', 'Connection successful.'));
  } catch (error) {
    return updateHealth(
      providerId,
      buildHealth(providerId, 'error', error instanceof Error ? error.message : 'Provider test failed.'),
    );
  }
};

const callGroqProvider = async ({
  apiKey,
  model,
  messages,
  responseFormat,
  temperature,
  maxTokens,
  baseUrl,
}: {
  apiKey: string;
  model: string;
  messages: GroqMessage[];
  responseFormat?: GroqResponseFormat;
  temperature?: number;
  maxTokens?: number;
  baseUrl?: string;
}) => {
  const payload: Record<string, unknown> = {
    model,
    messages,
  };

  if (typeof temperature === 'number') payload.temperature = temperature;
  if (typeof maxTokens === 'number') payload.max_completion_tokens = maxTokens;

  if (responseFormat) {
    payload.response_format = {
      type: 'json_schema',
      json_schema: {
        name: responseFormat.name,
        strict: responseFormat.strict ?? true,
        schema: responseFormat.schema,
      },
    };
  }

  const response = await fetch(`${baseUrl || 'https://api.groq.com'}/openai/v1/chat/completions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`Groq request failed (${response.status})`);
  }

  const json = await response.json();
  const content = json?.choices?.[0]?.message?.content;

  if (typeof content !== 'string' || !content.trim()) {
    throw new Error('Groq returned no content.');
  }

  return {
    content,
    sources: [] as GroundingSource[],
    usage: {
      promptTokens: typeof json?.usage?.prompt_tokens === 'number' ? json.usage.prompt_tokens : null,
      completionTokens: typeof json?.usage?.completion_tokens === 'number' ? json.usage.completion_tokens : null,
      totalTokens: typeof json?.usage?.total_tokens === 'number' ? json.usage.total_tokens : null,
    } satisfies AIRequestUsage,
  };
};

const callGeminiProvider = async ({
  apiKey,
  capability,
  model,
  messages,
  responseFormat,
}: {
  apiKey: string;
  capability: AICapability;
  model: string;
  messages: GroqMessage[];
  responseFormat?: GroqResponseFormat;
}) => {
  const client = new GoogleGenAI({ apiKey });
  const systemMessage = messages.find((message) => message.role === 'system')?.content || '';
  const nonSystemMessages = messages.filter((message) => message.role !== 'system');
  const prompt = nonSystemMessages.map((message) => `${message.role.toUpperCase()}:\n${message.content}`).join('\n\n');
  const schemaHint = responseFormat ? `\n\nReturn valid JSON matching this schema:\n${JSON.stringify(responseFormat.schema)}` : '';

  const response = await client.models.generateContent({
    model,
    contents: `${prompt}${schemaHint}`,
    config: {
      systemInstruction: systemMessage || undefined,
      tools: capability === 'search_grounded_text' ? [{ googleSearch: {} }] : undefined,
      responseMimeType: responseFormat ? 'application/json' : undefined,
    },
  });

  if (!response.text) {
    throw new Error('Gemini returned no content.');
  }

  return {
    content: response.text,
    sources: capability === 'search_grounded_text' ? extractGroundingSources(response) : [],
    usage: {
      promptTokens: typeof response.usageMetadata?.promptTokenCount === 'number' ? response.usageMetadata.promptTokenCount : null,
      completionTokens: typeof response.usageMetadata?.candidatesTokenCount === 'number' ? response.usageMetadata.candidatesTokenCount : null,
      totalTokens: typeof response.usageMetadata?.totalTokenCount === 'number' ? response.usageMetadata.totalTokenCount : null,
    } satisfies AIRequestUsage,
  };
};

const callGeminiImageGeneration = async ({
  apiKey,
  model,
  prompt,
  size,
  ratio,
}: {
  apiKey: string;
  model: string;
  prompt: string;
  size: string;
  ratio: string;
}) => {
  const client = new GoogleGenAI({ apiKey });
  const response = await client.models.generateContent({
    model,
    contents: prompt,
    config: {
      imageConfig: {
        imageSize: size,
        aspectRatio: ratio,
      },
    },
  });

  return extractInlineImages(response);
};

const callGeminiImageEditing = async ({
  apiKey,
  model,
  prompt,
  base64Image,
  mimeType,
}: {
  apiKey: string;
  model: string;
  prompt: string;
  base64Image: string;
  mimeType?: string;
}) => {
  const client = new GoogleGenAI({ apiKey });
  const parsedImage = stripDataUrlPrefix(base64Image);
  const response = await client.models.generateContent({
    model,
    contents: {
      parts: [
        {
          inlineData: {
            mimeType: mimeType || parsedImage.mimeType || 'image/png',
            data: parsedImage.data,
          },
        },
        { text: prompt },
      ],
    },
  });

  return extractInlineImages(response)[0] || '';
};

const callGeminiVideoGeneration = async ({
  apiKey,
  model,
  prompt,
  aspectRatio,
}: {
  apiKey: string;
  model: string;
  prompt: string;
  aspectRatio: '16:9' | '9:16';
}) => {
  const client = new GoogleGenAI({ apiKey });
  let operation = await client.models.generateVideos({
    model,
    prompt,
    config: {
      numberOfVideos: 1,
      aspectRatio,
    },
  });

  while (!operation.done) {
    await new Promise((resolve) => setTimeout(resolve, 5000));
    operation = await client.operations.getVideosOperation({ operation });
  }

  const videoUri = operation.response?.generatedVideos?.[0]?.video?.uri;
  if (!videoUri) {
    throw new Error('Gemini returned no video URL.');
  }

  return fetchGeminiMediaAsDataUrl(videoUri, apiKey, 'video/mp4');
};

const getProviderSequence = async (capability: AICapability, store?: ProviderStore) => {
  const currentStore = store || await loadStore();
  const route = currentStore.routing[capability];
  const ordered = [route.primaryProvider, ...route.fallbackOrder].filter(Boolean) as AIProviderId[];

  return ordered.filter((providerId, index) => {
    if (ordered.indexOf(providerId) !== index) return false;
    const provider = currentStore.providers[providerId];
    return provider.enabled && provider.capabilities[capability] && canProviderHandleCapability(providerId, capability);
  });
};

export const getProviderSequenceForCapability = async (capability: AICapability) => {
  return getProviderSequence(capability);
};

export const listProviderRecords = async (): Promise<AIProviderRecord[]> => {
  const store = await loadStore();
  return Promise.all(PROVIDERS.map(({ id }) => toProviderRecord(id, store.providers[id])));
};

export const listRoutingPolicies = async (): Promise<AIRoutingPolicy[]> => {
  const store = await loadStore();
  return CAPABILITIES.map((capability) => store.routing[capability]);
};

export const listProviderHealth = async (): Promise<AIProviderHealth[]> => {
  const store = await loadStore();
  return PROVIDERS.map(({ id }) => store.providers[id].lastHealth || buildHealth(id, 'unknown', 'Not tested yet.'));
};

export const getProviderStatusSummary = async () => {
  const records = await listProviderRecords();
  const routing = await listRoutingPolicies();
  return {
    providers: records,
    routing,
  };
};

export const updateProviderConfig = async (
  providerId: AIProviderId,
  patch: Partial<Pick<AIProviderConfig, 'enabled' | 'baseUrl' | 'modelDefaults' | 'capabilities'>>,
) => {
  const store = await loadStore();
  const current = store.providers[providerId];

  store.providers[providerId] = {
    ...current,
    enabled: patch.enabled ?? current.enabled,
    baseUrl: patch.baseUrl ?? current.baseUrl,
    modelDefaults: {
      ...current.modelDefaults,
      ...(patch.modelDefaults || {}),
    },
    capabilities: Object.fromEntries(
      CAPABILITIES.map((capability) => [
        capability,
        canProviderHandleCapability(providerId, capability)
          ? (patch.capabilities?.[capability] ?? current.capabilities[capability])
          : false,
      ]),
    ) as Record<AICapability, boolean>,
  };

  await saveStore(store);
  return toProviderRecord(providerId, store.providers[providerId]);
};

export const setProviderCredentials = async (providerId: AIProviderId, apiKey: string) => {
  const store = await loadStore();
  store.providers[providerId].encryptedApiKey = await encryptSecret(apiKey.trim());
  store.providers[providerId].credentialUpdatedAt = nowIso();
  store.providers[providerId].credentialStatus = 'configured';
  await saveStore(store);
  return toProviderRecord(providerId, store.providers[providerId]);
};

export const clearProviderCredentials = async (providerId: AIProviderId) => {
  const store = await loadStore();
  delete store.providers[providerId].encryptedApiKey;
  store.providers[providerId].credentialUpdatedAt = nowIso();
  store.providers[providerId].credentialStatus = 'missing';
  await saveStore(store);
  return toProviderRecord(providerId, store.providers[providerId]);
};

export const updateRoutingPolicy = async (
  capability: AICapability,
  patch: Pick<AIRoutingPolicy, 'primaryProvider' | 'fallbackOrder'>,
) => {
  const store = await loadStore();
  store.routing[capability] = {
    capability,
    primaryProvider: patch.primaryProvider,
    fallbackOrder: patch.fallbackOrder.filter((providerId) => providerId !== patch.primaryProvider),
  };
  await saveStore(store);
  return store.routing[capability];
};

export const testProvider = async (providerId: AIProviderId) => {
  return testProviderInternal(providerId);
};

export const routeTextGeneration = async ({ capability, messages, responseFormat, temperature, maxTokens, model }: RouterChatRequest) => {
  // Atalho: text_generation e structured_text vão pelo Claude Code CLI usando
  // CLAUDE_CODE_OAUTH_TOKEN (subscription do usuário, sem API key).
  // Demais capabilities (image/video/search) continuam roteando pelos providers tradicionais.
  if ((capability === 'text_generation' || capability === 'structured_text') && process.env.CLAUDE_CODE_OAUTH_TOKEN) {
    const { claudeCliChat } = await import('./claudeCliChat.js');
    const systemMsg = messages.find((m) => m.role === 'system')?.content;
    const conversation = messages.filter((m) => m.role !== 'system');
    const result = await claudeCliChat({ system: systemMsg, messages: conversation, model });
    let data: unknown = null;
    if (responseFormat === 'json') {
      try { data = JSON.parse(result.content); } catch { data = null; }
    }
    return {
      providerId: 'claude-cli' as unknown as AIProviderId,
      content: result.content,
      data,
      sources: [] as GroundingSource[],
    };
  }

  const store = await loadStore();
  const providerSequence = await getProviderSequence(capability, store);
  const errors: string[] = [];

  for (const providerId of providerSequence) {
    const provider = store.providers[providerId];
    const apiKey = await getProviderApiKey(providerId, provider);

    if (!apiKey) {
      errors.push(`${providerId}: missing credentials`);
      continue;
    }

    try {
      const selectedModel = model || provider.modelDefaults[capability] || provider.modelDefaults.structured_text || provider.modelDefaults.text_generation;
      let content = '';
      let sources: GroundingSource[] = [];

      if (providerId === 'groq') {
        const result = await callGroqProvider({
          apiKey,
          model: selectedModel || 'openai/gpt-oss-20b',
          messages,
          responseFormat,
          temperature,
          maxTokens,
          baseUrl: provider.baseUrl,
        });
        content = result.content;
        sources = result.sources;
        await recordAIUsageEvent({
          providerId,
          model: selectedModel || 'openai/gpt-oss-20b',
          capability,
          promptTokens: result.usage.promptTokens,
          completionTokens: result.usage.completionTokens,
          totalTokens: result.usage.totalTokens,
        });
      } else if (providerId === 'gemini') {
        const result = await callGeminiProvider({
          apiKey,
          capability,
          model: selectedModel || 'gemini-2.5-flash',
          messages,
          responseFormat,
        });
        content = result.content;
        sources = result.sources;
        await recordAIUsageEvent({
          providerId,
          model: selectedModel || 'gemini-2.5-flash',
          capability,
          promptTokens: result.usage.promptTokens,
          completionTokens: result.usage.completionTokens,
          totalTokens: result.usage.totalTokens,
        });
      } else {
        errors.push(`${providerId}: provider adapter not implemented`);
        continue;
      }

      await updateHealth(providerId, buildHealth(providerId, 'healthy', 'Request completed successfully.'));

      let data: unknown = null;
      try {
        data = JSON.parse(content);
      } catch {
        data = null;
      }

      return {
        providerId,
        content,
        data,
        sources,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Provider request failed.';
      errors.push(`${providerId}: ${message}`);
      await updateHealth(providerId, buildHealth(providerId, 'error', message));
    }
  }

  throw new Error(`No provider could fulfill ${capability}. ${errors.join(' | ')}`);
};

export const routeImageGeneration = async ({ prompt, size, ratio, model }: RouterImageGenerationRequest) => {
  const store = await loadStore();
  const providerSequence = await getProviderSequence('image_generation', store);
  const errors: string[] = [];

  for (const providerId of providerSequence) {
    const provider = store.providers[providerId];
    const apiKey = await getProviderApiKey(providerId, provider);

    if (!apiKey) {
      errors.push(`${providerId}: missing credentials`);
      continue;
    }

    try {
      if (providerId !== 'gemini') {
        errors.push(`${providerId}: provider adapter not implemented`);
        continue;
      }

      const images = await callGeminiImageGeneration({
        apiKey,
        model: model || provider.modelDefaults.image_generation || 'gemini-2.5-flash-image',
        prompt,
        size,
        ratio,
      });

      await recordAIUsageEvent({
        providerId,
        model: model || provider.modelDefaults.image_generation || 'gemini-2.5-flash-image',
        capability: 'image_generation',
        promptTokens: null,
        completionTokens: null,
        totalTokens: null,
      });
      await updateHealth(providerId, buildHealth(providerId, 'healthy', 'Image generation completed successfully.'));
      return { providerId, images };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Image generation failed.';
      errors.push(`${providerId}: ${message}`);
      await updateHealth(providerId, buildHealth(providerId, 'error', message));
    }
  }

  throw new Error(`No provider could fulfill image_generation. ${errors.join(' | ')}`);
};

export const routeImageEditing = async ({ prompt, base64Image, mimeType, model }: RouterImageEditingRequest) => {
  const store = await loadStore();
  const providerSequence = await getProviderSequence('image_editing', store);
  const errors: string[] = [];

  for (const providerId of providerSequence) {
    const provider = store.providers[providerId];
    const apiKey = await getProviderApiKey(providerId, provider);

    if (!apiKey) {
      errors.push(`${providerId}: missing credentials`);
      continue;
    }

    try {
      if (providerId !== 'gemini') {
        errors.push(`${providerId}: provider adapter not implemented`);
        continue;
      }

      const image = await callGeminiImageEditing({
        apiKey,
        model: model || provider.modelDefaults.image_editing || 'gemini-2.5-flash-image',
        prompt,
        base64Image,
        mimeType,
      });

      await recordAIUsageEvent({
        providerId,
        model: model || provider.modelDefaults.image_editing || 'gemini-2.5-flash-image',
        capability: 'image_editing',
        promptTokens: null,
        completionTokens: null,
        totalTokens: null,
      });
      await updateHealth(providerId, buildHealth(providerId, 'healthy', 'Image editing completed successfully.'));
      return { providerId, image };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Image editing failed.';
      errors.push(`${providerId}: ${message}`);
      await updateHealth(providerId, buildHealth(providerId, 'error', message));
    }
  }

  throw new Error(`No provider could fulfill image_editing. ${errors.join(' | ')}`);
};

export const routeVideoGeneration = async ({ prompt, aspectRatio, model }: RouterVideoRequest) => {
  const store = await loadStore();
  const providerSequence = await getProviderSequence('video_generation', store);
  const errors: string[] = [];

  for (const providerId of providerSequence) {
    const provider = store.providers[providerId];
    const apiKey = await getProviderApiKey(providerId, provider);

    if (!apiKey) {
      errors.push(`${providerId}: missing credentials`);
      continue;
    }

    try {
      if (providerId !== 'gemini') {
        errors.push(`${providerId}: provider adapter not implemented`);
        continue;
      }

      const videoUrl = await callGeminiVideoGeneration({
        apiKey,
        model: model || provider.modelDefaults.video_generation || 'veo-3.1-fast-generate-preview',
        prompt,
        aspectRatio,
      });

      await recordAIUsageEvent({
        providerId,
        model: model || provider.modelDefaults.video_generation || 'veo-3.1-fast-generate-preview',
        capability: 'video_generation',
        promptTokens: null,
        completionTokens: null,
        totalTokens: null,
      });
      await updateHealth(providerId, buildHealth(providerId, 'healthy', 'Video generation completed successfully.'));
      return { providerId, videoUrl };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Video generation failed.';
      errors.push(`${providerId}: ${message}`);
      await updateHealth(providerId, buildHealth(providerId, 'error', message));
    }
  }

  throw new Error(`No provider could fulfill video_generation. ${errors.join(' | ')}`);
};

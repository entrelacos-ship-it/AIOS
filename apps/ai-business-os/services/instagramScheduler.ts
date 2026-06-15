import { promises as fs } from 'fs';
import path from 'path';
import crypto from 'crypto';

type InstagramConnection = {
  pageId: string;
  pageName: string;
  igUserId: string;
  igUsername: string;
  encryptedPageAccessToken: string;
  encryptedUserAccessToken: string;
  tokenExpiresAt: string | null;
  connectedAt: string;
  updatedAt: string;
};

type InstagramJobStatus = 'queued' | 'processing' | 'published' | 'error';

export type InstagramPublicationRequest = {
  localPostId: string;
  caption: string;
  imageUrl: string;
  scheduledAt: string;
  day?: string;
  format?: string;
  theme?: string;
};

export type InstagramSyncJob = {
  id: string;
  localPostId: string;
  caption: string;
  imageUrl: string;
  scheduledAt: string;
  day: string;
  format: string;
  theme: string;
  status: InstagramJobStatus;
  attempts: number;
  createdAt: string;
  updatedAt: string;
  lastAttemptAt: string | null;
  lastError: string | null;
  publishedMediaId: string | null;
};

type InstagramStore = {
  version: number;
  connection: InstagramConnection | null;
  jobs: InstagramSyncJob[];
};

const STORE_DIR = path.join(process.cwd(), '.aiox');
const STORE_PATH = path.join(STORE_DIR, 'instagram-sync.json');
const MASTER_KEY_PATH = path.join(STORE_DIR, 'instagram-sync.key');
const STORE_VERSION = 1;
const GRAPH_VERSION = process.env.INSTAGRAM_GRAPH_VERSION || 'v19.0';
const SCHEDULER_INTERVAL_MS = 60_000;

let schedulerHandle: NodeJS.Timeout | null = null;
let schedulerBusy = false;

const nowIso = () => new Date().toISOString();

const ensureStoreDir = async () => {
  await fs.mkdir(STORE_DIR, { recursive: true });
};

const getMasterKey = async () => {
  await ensureStoreDir();

  if (process.env.INSTAGRAM_SYNC_MASTER_KEY?.trim()) {
    return crypto.createHash('sha256').update(process.env.INSTAGRAM_SYNC_MASTER_KEY.trim()).digest();
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

const loadStore = async (): Promise<InstagramStore> => {
  await ensureStoreDir();

  try {
    const raw = await fs.readFile(STORE_PATH, 'utf8');
    const parsed = JSON.parse(raw) as Partial<InstagramStore>;
    return {
      version: STORE_VERSION,
      connection: parsed.connection || null,
      jobs: Array.isArray(parsed.jobs) ? parsed.jobs : [],
    };
  } catch {
    return {
      version: STORE_VERSION,
      connection: null,
      jobs: [],
    };
  }
};

const saveStore = async (store: InstagramStore) => {
  await ensureStoreDir();
  await fs.writeFile(STORE_PATH, JSON.stringify(store, null, 2), 'utf8');
};

const getConfig = () => {
  const clientId = process.env.INSTAGRAM_CLIENT_ID?.trim() || process.env.META_APP_ID?.trim() || '';
  const clientSecret = process.env.INSTAGRAM_CLIENT_SECRET?.trim() || process.env.META_APP_SECRET?.trim() || '';

  return {
    clientId,
    clientSecret,
    configured: Boolean(clientId && clientSecret),
  };
};

const ensureConfig = () => {
  const config = getConfig();
  if (!config.configured) {
    throw new Error('Instagram app não configurado. Defina INSTAGRAM_CLIENT_ID e INSTAGRAM_CLIENT_SECRET.');
  }
  return config;
};

const fetchJson = async <T>(url: string, init?: RequestInit): Promise<T> => {
  const response = await fetch(url, init);
  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message = (payload as { error?: { message?: string } })?.error?.message
      || (payload as { error?: string })?.error
      || `Instagram request failed (${response.status})`;
    throw new Error(message);
  }

  return payload as T;
};

const buildGraphUrl = (pathname: string, params?: Record<string, string>) => {
  const url = new URL(`https://graph.facebook.com/${GRAPH_VERSION}/${pathname.replace(/^\/+/, '')}`);
  Object.entries(params || {}).forEach(([key, value]) => {
    url.searchParams.set(key, value);
  });
  return url.toString();
};

const persistConnection = async (connection: Omit<InstagramConnection, 'updatedAt'>) => {
  const store = await loadStore();
  store.connection = {
    ...connection,
    updatedAt: nowIso(),
  };
  await saveStore(store);
  return store.connection;
};

const getConnectionWithTokens = async () => {
  const store = await loadStore();
  if (!store.connection) {
    return null;
  }

  return {
    ...store.connection,
    pageAccessToken: await decryptSecret(store.connection.encryptedPageAccessToken),
    userAccessToken: await decryptSecret(store.connection.encryptedUserAccessToken),
  };
};

const createJobId = () => `ig-job-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const publishToInstagram = async (job: InstagramSyncJob) => {
  const connection = await getConnectionWithTokens();
  if (!connection) {
    throw new Error('Instagram não conectado.');
  }

  if (!connection.pageAccessToken || !connection.igUserId) {
    throw new Error('Conexão Instagram incompleta. Refaça o login.');
  }

  if (!job.imageUrl.trim()) {
    throw new Error('imageUrl é obrigatório para publicar no Instagram.');
  }

  const createContainerBody = new URLSearchParams({
    image_url: job.imageUrl.trim(),
    caption: job.caption.trim(),
    access_token: connection.pageAccessToken,
  });

  const container = await fetchJson<{ id: string }>(
    buildGraphUrl(`${connection.igUserId}/media`),
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: createContainerBody.toString(),
    },
  );

  const publishBody = new URLSearchParams({
    creation_id: container.id,
    access_token: connection.pageAccessToken,
  });

  const published = await fetchJson<{ id: string }>(
    buildGraphUrl(`${connection.igUserId}/media_publish`),
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: publishBody.toString(),
    },
  );

  return {
    mediaId: published.id,
    username: connection.igUsername,
  };
};

const processDueJobsInternal = async () => {
  if (schedulerBusy) return;
  schedulerBusy = true;

  try {
    const store = await loadStore();
    const now = Date.now();
    let changed = false;

    for (const job of store.jobs) {
      if (job.status !== 'queued') continue;
      if (new Date(job.scheduledAt).getTime() > now) continue;

      job.status = 'processing';
      job.updatedAt = nowIso();
      changed = true;

      try {
        const published = await publishToInstagram(job);
        job.status = 'published';
        job.publishedMediaId = published.mediaId;
        job.lastError = null;
      } catch (error) {
        job.status = 'error';
        job.lastError = error instanceof Error ? error.message : 'Falha ao publicar no Instagram.';
      }

      job.attempts += 1;
      job.lastAttemptAt = nowIso();
      job.updatedAt = nowIso();
    }

    if (changed) {
      await saveStore(store);
    }
  } finally {
    schedulerBusy = false;
  }
};

export const startInstagramScheduler = () => {
  if (schedulerHandle) return;

  void processDueJobsInternal();
  schedulerHandle = setInterval(() => {
    void processDueJobsInternal();
  }, SCHEDULER_INTERVAL_MS);
};

export const buildInstagramAuthUrl = (redirectUri: string) => {
  const { clientId } = ensureConfig();
  const url = new URL(`https://www.facebook.com/${GRAPH_VERSION}/dialog/oauth`);
  url.searchParams.set('client_id', clientId);
  url.searchParams.set('display', 'page');
  url.searchParams.set('redirect_uri', redirectUri);
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('scope', 'instagram_basic,instagram_content_publish,pages_show_list,pages_read_engagement');
  url.searchParams.set('extras', JSON.stringify({ setup: { channel: 'IG_API_ONBOARDING' } }));
  return url.toString();
};

export const completeInstagramOAuth = async (code: string, redirectUri: string) => {
  const { clientId, clientSecret } = ensureConfig();

  const shortToken = await fetchJson<{ access_token: string }>(
    buildGraphUrl('oauth/access_token', {
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      code,
    }),
  );

  const longLivedToken = await fetchJson<{ access_token: string; expires_in?: number }>(
    buildGraphUrl('oauth/access_token', {
      grant_type: 'fb_exchange_token',
      client_id: clientId,
      client_secret: clientSecret,
      fb_exchange_token: shortToken.access_token,
    }),
  ).catch(() => ({ access_token: shortToken.access_token, expires_in: 0 }));

  const pages = await fetchJson<{
    data?: Array<{
      id: string;
      name: string;
      access_token: string;
      instagram_business_account?: { id: string; username?: string };
    }>;
  }>(
    buildGraphUrl('me/accounts', {
      fields: 'id,name,access_token,instagram_business_account{id,username}',
      access_token: longLivedToken.access_token,
    }),
  );

  const page = (pages.data || []).find((item) => item.instagram_business_account?.id);
  if (!page?.instagram_business_account?.id) {
    throw new Error('Nenhuma página com conta profissional do Instagram vinculada foi encontrada.');
  }

  const connected = await persistConnection({
    pageId: page.id,
    pageName: page.name,
    igUserId: page.instagram_business_account.id,
    igUsername: page.instagram_business_account.username || '',
    encryptedPageAccessToken: await encryptSecret(page.access_token),
    encryptedUserAccessToken: await encryptSecret(longLivedToken.access_token),
    tokenExpiresAt: longLivedToken.expires_in ? new Date(Date.now() + (longLivedToken.expires_in * 1000)).toISOString() : null,
    connectedAt: nowIso(),
  });

  return {
    connected: true,
    pageName: connected.pageName,
    igUsername: connected.igUsername,
    igUserId: connected.igUserId,
    tokenExpiresAt: connected.tokenExpiresAt,
  };
};

export const disconnectInstagram = async () => {
  const store = await loadStore();
  store.connection = null;
  await saveStore(store);
};

export const getInstagramStatus = async () => {
  const store = await loadStore();
  const config = getConfig();
  const queued = store.jobs.filter((job) => job.status === 'queued').length;
  const published = store.jobs.filter((job) => job.status === 'published').length;
  const errored = store.jobs.filter((job) => job.status === 'error').length;

  return {
    configured: config.configured,
    connected: Boolean(store.connection),
    account: store.connection ? {
      pageName: store.connection.pageName,
      igUsername: store.connection.igUsername,
      igUserId: store.connection.igUserId,
      tokenExpiresAt: store.connection.tokenExpiresAt,
      connectedAt: store.connection.connectedAt,
      updatedAt: store.connection.updatedAt,
    } : null,
    counters: {
      queued,
      published,
      errored,
    },
  };
};

export const listInstagramJobs = async () => {
  const store = await loadStore();
  return [...store.jobs].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
};

export const queueInstagramPublication = async (input: InstagramPublicationRequest) => {
  const connection = await getConnectionWithTokens();
  if (!connection) {
    throw new Error('Conecte uma conta do Instagram antes de programar posts.');
  }

  if (!input.imageUrl.trim()) {
    throw new Error('Informe uma URL pública de imagem no card antes de programar o post.');
  }

  if (!input.scheduledAt.trim()) {
    throw new Error('scheduledAt é obrigatório.');
  }

  const scheduledDate = new Date(input.scheduledAt);
  if (Number.isNaN(scheduledDate.getTime())) {
    throw new Error('scheduledAt inválido.');
  }

  const store = await loadStore();
  const existingIndex = store.jobs.findIndex((job) => job.localPostId === input.localPostId);
  const timestamp = nowIso();

  const nextJob: InstagramSyncJob = existingIndex >= 0
    ? {
        ...store.jobs[existingIndex],
        caption: input.caption.trim(),
        imageUrl: input.imageUrl.trim(),
        scheduledAt: input.scheduledAt,
        day: input.day?.trim() || store.jobs[existingIndex].day,
        format: input.format?.trim() || store.jobs[existingIndex].format,
        theme: input.theme?.trim() || store.jobs[existingIndex].theme,
        status: scheduledDate.getTime() > Date.now() ? 'queued' : 'processing',
        updatedAt: timestamp,
        lastError: null,
      }
    : {
        id: createJobId(),
        localPostId: input.localPostId,
        caption: input.caption.trim(),
        imageUrl: input.imageUrl.trim(),
        scheduledAt: input.scheduledAt,
        day: input.day?.trim() || '',
        format: input.format?.trim() || '',
        theme: input.theme?.trim() || '',
        status: scheduledDate.getTime() > Date.now() ? 'queued' : 'processing',
        attempts: 0,
        createdAt: timestamp,
        updatedAt: timestamp,
        lastAttemptAt: null,
        lastError: null,
        publishedMediaId: null,
      };

  if (existingIndex >= 0) {
    store.jobs[existingIndex] = nextJob;
  } else {
    store.jobs.unshift(nextJob);
  }

  await saveStore(store);

  if (scheduledDate.getTime() > Date.now()) {
    return {
      mode: 'scheduled' as const,
      job: {
        ...nextJob,
        status: 'queued' as const,
      },
      account: {
        igUsername: connection.igUsername,
      },
    };
  }

  try {
    const published = await publishToInstagram(nextJob);
    const refreshedStore = await loadStore();
    const current = refreshedStore.jobs.find((job) => job.localPostId === input.localPostId);
    if (current) {
      current.status = 'published';
      current.attempts += 1;
      current.lastAttemptAt = nowIso();
      current.lastError = null;
      current.publishedMediaId = published.mediaId;
      current.updatedAt = nowIso();
      await saveStore(refreshedStore);
      return {
        mode: 'published' as const,
        job: current,
        account: {
          igUsername: published.username,
        },
      };
    }
  } catch (error) {
    const refreshedStore = await loadStore();
    const current = refreshedStore.jobs.find((job) => job.localPostId === input.localPostId);
    if (current) {
      current.status = 'error';
      current.attempts += 1;
      current.lastAttemptAt = nowIso();
      current.lastError = error instanceof Error ? error.message : 'Falha ao publicar no Instagram.';
      current.updatedAt = nowIso();
      await saveStore(refreshedStore);
    }
    throw error;
  }

  throw new Error('Falha ao sincronizar publicação com Instagram.');
};

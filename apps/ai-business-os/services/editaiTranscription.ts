import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';
import { type EditAIWord, type AIProviderId } from '../types.js';
import { recordAIUsageEvent } from './aiUsageRegistry.js';

const CHUNK_SECONDS = 600; // 10 min max per chunk (Whisper limit)
const UPLOAD_LIMIT_BYTES = 25 * 1024 * 1024; // 25 MB
const MAX_ATTEMPTS = 2;
const RETRY_DELAY_MS = 2000;

interface TranscriptionProvider {
  providerId: string;
  label: string;
  endpoint: string;
  apiKey: string;
  model: string;
}

interface PreparedChunk {
  filePath: string;
  offsetSeconds: number;
}

function resolveBundledFfmpegPath(): string | null {
  const candidates = [
    process.env.FFMPEG_PATH?.trim(),
    path.join(process.cwd(), 'node_modules', '@remotion', 'compositor-win32-x64-msvc', 'ffmpeg.exe'),
    path.join(process.cwd(), 'node_modules', '@remotion', 'compositor-win32-arm64-msvc', 'ffmpeg.exe'),
    path.join(process.cwd(), 'node_modules', '@remotion', 'compositor-linux-x64-gnu', 'ffmpeg'),
    path.join(process.cwd(), 'node_modules', '@remotion', 'compositor-linux-arm64-gnu', 'ffmpeg'),
    path.join(process.cwd(), 'node_modules', '@remotion', 'compositor-darwin-x64', 'ffmpeg'),
    path.join(process.cwd(), 'node_modules', '@remotion', 'compositor-darwin-arm64', 'ffmpeg'),
  ].filter((c): c is string => Boolean(c));

  return candidates.find((c) => fs.existsSync(c)) ?? null;
}

async function prepareAudioChunks(videoPath: string): Promise<PreparedChunk[]> {
  const ffmpegPath = resolveBundledFfmpegPath();
  if (!ffmpegPath) {
    throw new Error('ffmpeg not found. Install @remotion compositor package or set FFMPEG_PATH.');
  }

  const durationSeconds = await probeAudioDuration(videoPath);
  const tempDir = path.join(process.cwd(), 'uploads', 'editai', 'transcription-cache');
  await fs.promises.mkdir(tempDir, { recursive: true });

  const base = `${path.basename(videoPath, path.extname(videoPath))}_${Date.now()}`;
  const chunks: PreparedChunk[] = [];

  for (let i = 0, offset = 0; offset < durationSeconds; i++, offset += CHUNK_SECONDS) {
    const chunkPath = path.join(tempDir, `${base}_${String(i).padStart(3, '0')}.mp3`);
    const duration = Math.min(CHUNK_SECONDS, Math.max(1, durationSeconds - offset));

    await new Promise<void>((resolve, reject) => {
      const args = ['-y', '-ss', String(offset), '-t', String(duration), '-i', videoPath,
        '-vn', '-ac', '1', '-ar', '16000', '-c:a', 'libmp3lame', '-b:a', '24k', chunkPath];

      const child = spawn(ffmpegPath, args, { stdio: ['ignore', 'ignore', 'pipe'] });
      let stderr = '';
      child.stderr.on('data', (c) => { stderr += c.toString(); });
      child.on('error', reject);
      child.on('close', (code) => {
        if (code === 0) { resolve(); return; }
        reject(new Error(`ffmpeg audio prep failed (exit ${code}). ${stderr.trim()}`));
      });
    });

    const stat = await fs.promises.stat(chunkPath);
    if (stat.size > UPLOAD_LIMIT_BYTES) {
      throw new Error(`Audio chunk too large (${stat.size} bytes). Split video before uploading.`);
    }

    chunks.push({ filePath: chunkPath, offsetSeconds: offset });
  }

  return chunks;
}

async function probeAudioDuration(videoPath: string): Promise<number> {
  const ffmpegPath = resolveBundledFfmpegPath();
  if (!ffmpegPath) throw new Error('ffmpeg not found.');

  const ffprobePath = ffmpegPath.replace(/ffmpeg(\.exe)?$/, 'ffprobe$1');
  if (!fs.existsSync(ffprobePath)) throw new Error('ffprobe not found.');

  return new Promise<number>((resolve, reject) => {
    const args = ['-v', 'error', '-show_entries', 'format=duration',
      '-of', 'default=noprint_wrappers=1:nokey=1', videoPath];

    const child = spawn(ffprobePath, args, { stdio: ['ignore', 'pipe', 'pipe'] });
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (c) => { stdout += c.toString(); });
    child.stderr.on('data', (c) => { stderr += c.toString(); });
    child.on('error', reject);
    child.on('close', (code) => {
      const duration = parseFloat(stdout.trim());
      if (code === 0 && isFinite(duration) && duration > 0) { resolve(duration); return; }
      reject(new Error(`ffprobe duration failed (exit ${code}). ${stderr.trim()}`));
    });
  });
}

function getProviders(): TranscriptionProvider[] {
  const providers: Array<TranscriptionProvider | null> = [
    // OpenAI is primary for word-level — Groq may not support word granularity
    process.env.OPENAI_API_KEY?.trim()
      ? { providerId: 'openai', label: 'OpenAI Whisper', model: 'whisper-1',
          endpoint: 'https://api.openai.com/v1/audio/transcriptions',
          apiKey: process.env.OPENAI_API_KEY.trim() }
      : null,
    process.env.GROQ_API_KEY?.trim()
      ? { providerId: 'groq', label: 'Groq Whisper', model: 'whisper-large-v3',
          endpoint: 'https://api.groq.com/openai/v1/audio/transcriptions',
          apiKey: process.env.GROQ_API_KEY.trim() }
      : null,
  ];

  return providers.filter((p): p is TranscriptionProvider => Boolean(p));
}

async function requestWords(provider: TranscriptionProvider, chunkPath: string, offsetSeconds: number): Promise<EditAIWord[]> {
  const formData = new FormData();
  formData.append('file', new Blob([fs.readFileSync(chunkPath)], { type: 'audio/mpeg' }), path.basename(chunkPath));
  formData.append('model', provider.model);
  formData.append('response_format', 'verbose_json');
  formData.append('timestamp_granularities[]', 'word');
  formData.append('language', 'pt');

  const response = await fetch(provider.endpoint, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${provider.apiKey}` },
    body: formData,
  });

  if (!response.ok) {
    const text = (await response.text()).trim().replace(/\s+/g, ' ');
    throw new Error(`${provider.label} word transcription failed (${response.status}): ${text}`);
  }

  const result = await response.json() as Record<string, unknown>;

  await recordAIUsageEvent({
    providerId: provider.providerId as AIProviderId,
    model: provider.model,
    capability: 'audio_transcription',
    promptTokens: null,
    completionTokens: null,
    totalTokens: null,
  });

  const rawWords = Array.isArray(result.words) ? result.words : [];

  if (rawWords.length === 0) {
    throw new Error(`${provider.label} returned no word-level timestamps. Ensure the model supports timestamp_granularities[]=word.`);
  }

  return rawWords
    .filter((w) => typeof w.start === 'number' && typeof w.end === 'number' && typeof w.word === 'string')
    .map((w) => ({
      index: 0, // assigned globally after all chunks merged
      word: String(w.word).trim(),
      start: Number(w.start) + offsetSeconds,
      end: Number(w.end) + offsetSeconds,
    }))
    .filter((w) => w.word.length > 0);
}

async function transcribeChunk(providers: TranscriptionProvider[], chunkPath: string, offsetSeconds: number): Promise<EditAIWord[]> {
  let lastError: Error | null = null;

  for (const provider of providers) {
    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
      try {
        return await requestWords(provider, chunkPath, offsetSeconds);
      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err));
        if (attempt < MAX_ATTEMPTS) {
          await new Promise((r) => setTimeout(r, RETRY_DELAY_MS * attempt));
        }
      }
    }
  }

  throw lastError ?? new Error('All transcription providers failed for word-level timestamps.');
}

export async function transcribeVideoWords(videoPath: string): Promise<EditAIWord[]> {
  const providers = getProviders();
  if (providers.length === 0) {
    throw new Error('No transcription provider configured. Set OPENAI_API_KEY or GROQ_API_KEY.');
  }

  const chunks = await prepareAudioChunks(videoPath);
  const allWords: EditAIWord[] = [];

  try {
    for (const chunk of chunks) {
      const words = await transcribeChunk(providers, chunk.filePath, chunk.offsetSeconds);
      allWords.push(...words);
    }
  } finally {
    await Promise.all(chunks.map((c) => fs.promises.unlink(c.filePath).catch(() => undefined)));
  }

  // Assign stable sequential indices — these never change after this point
  return allWords.map((w, i) => ({ ...w, index: i }));
}

import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';
import FormData from 'form-data';
import fetch from 'node-fetch';
import { bundle } from '@remotion/bundler';
import { renderMedia, selectComposition } from '@remotion/renderer';
import { routeTextGeneration } from './aiProviderRegistry.js';
import { recordAIUsageEvent } from './aiUsageRegistry.js';

export interface TranscriptionSegment {
  start: number;
  end: number;
  text: string;
}

export interface EloCutScene {
  id: string;
  startTime: number;
  endTime: number;
  transcript: string;
  title: string;
  description: string;
  visualStyle: 'kinetic' | 'minimal' | 'dramatic' | 'energetic';
  backgroundColor: string;
  accentColor: string;
  keywords: string[];
}

export interface EloCutSilenceRange {
  startTime: number;
  endTime: number;
}

export interface EloCutEditSegment {
  id: string;
  sourceStartTime: number;
  sourceEndTime: number;
  timelineStartTime: number;
  timelineEndTime: number;
  transition: 'cut' | 'fade';
  transcript: string;
}

export interface EloCutProject {
  id: string;
  inputVideoPath: string;
  outputVideoPath: string;
  normalizedVideoPath: string;
  editedVideoPath: string;
  transcription: TranscriptionSegment[];
  editedTranscription: TranscriptionSegment[];
  scenes: EloCutScene[];
  editSegments: EloCutEditSegment[];
  silences: EloCutSilenceRange[];
  totalDuration: number;
  fps: number;
  status: 'pending' | 'transcribing' | 'analyzing' | 'rendering' | 'complete' | 'error';
  error?: string;
  createdAt: string;
}

type SceneStyle = EloCutScene['visualStyle'];

type TranscriptionProvider = {
  providerId: 'groq' | 'openai';
  apiKey: string;
  endpoint: string;
  label: string;
  model: string;
};

type TranscriptionApiSegment = {
  start?: number;
  end?: number;
  text?: string;
};

type TranscriptionApiResponse = {
  segments?: TranscriptionApiSegment[];
};

type PreparedAudioChunk = {
  filePath: string;
  offsetSeconds: number;
};

type VideoStreamInfo = {
  codecName: string;
  width: number;
  height: number;
  pixFmt: string;
  fps: number;
};

const TRANSCRIPTION_RETRYABLE_STATUS = new Set([408, 429, 500, 502, 503, 504]);
const TRANSCRIPTION_MAX_ATTEMPTS = 3;
const TRANSCRIPTION_RETRY_DELAY_MS = 1500;
const TRANSCRIPTION_UPLOAD_LIMIT_BYTES = 25 * 1024 * 1024;
const TRANSCRIPTION_CHUNK_SECONDS = 20 * 60;
const OUTPUT_FILE_WAIT_TIMEOUT_MS = 30000;
const OUTPUT_FILE_WAIT_STEP_MS = 500;
const REMOTION_RENDER_TIMEOUT_MS = 120000;
const SILENCE_THRESHOLD_DB = '-32dB';
const SILENCE_MIN_DURATION_SECONDS = 0.18;
const SPEECH_LEAD_PADDING_SECONDS = 0.02;
const SPEECH_TAIL_PADDING_SECONDS = 0.05;
const MIN_EDIT_SEGMENT_DURATION_SECONDS = 0.35;
const MERGE_GAP_SECONDS = 0.06;
const TRANSCRIPTION_GAP_MIN_SECONDS = 0.14;
const TRANSCRIPTION_GAP_PADDING_SECONDS = 0.02;
const RESTART_MAX_GAP_SECONDS = 1.1;
const RESTART_MAX_SEGMENT_DURATION_SECONDS = 4.2;
const RESTART_PREFIX_WORD_THRESHOLD = 3;
const RESTART_OVERLAP_WORD_THRESHOLD = 2;
const RESTART_DROP_REMAINDER_WORD_THRESHOLD = 2;
const RESTART_STRONG_SIMILARITY_RATIO = 0.72;
const ELOCUT_SCENE_STYLES: SceneStyle[] = ['kinetic', 'minimal', 'dramatic', 'energetic'];
const ELOCUT_SCENE_BACKGROUNDS = ['#0F172A', '#111827', '#1F2937', '#101828'];
const ELOCUT_SCENE_ACCENTS = ['#8B5CF6', '#22C55E', '#F97316', '#06B6D4'];
const FILLER_WORDS = new Set([
  'ah', 'ahn', 'eh', 'é', 'hum', 'hmm', 'um', 'uh', 'uhm', 'tipo', 'né', 'ne', 'okay', 'ok',
]);

function getLocalServerOrigin(): string {
  const port = Number(process.env.PORT) || 3000;
  return `http://127.0.0.1:${port}`;
}

function toRenderableMediaSource(filePath: string): string {
  const fileName = path.basename(filePath);
  const cacheKey = encodeURIComponent(`${fileName}:${fs.statSync(filePath).mtimeMs}`);
  return `${getLocalServerOrigin()}/__elocut_media/${encodeURIComponent(fileName)}?v=${cacheKey}`;
}

class TranscriptionProviderError extends Error {
  status?: number;
  retryable: boolean;

  constructor(message: string, status?: number) {
    super(message);
    this.name = 'TranscriptionProviderError';
    this.status = status;
    this.retryable = typeof status === 'number' && TRANSCRIPTION_RETRYABLE_STATUS.has(status);
  }
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const getNullDevice = () => (process.platform === 'win32' ? 'NUL' : '/dev/null');

function sanitizeSceneStyle(value: unknown, index = 0): SceneStyle {
  return typeof value === 'string' && ELOCUT_SCENE_STYLES.includes(value as SceneStyle)
    ? value as SceneStyle
    : ELOCUT_SCENE_STYLES[index % ELOCUT_SCENE_STYLES.length];
}

function sanitizeHexColor(value: unknown, fallback: string): string {
  return typeof value === 'string' && /^#[0-9a-f]{6}$/i.test(value.trim()) ? value.trim() : fallback;
}

function normalizeKeywordList(value: unknown, fallbackText: string): string[] {
  if (Array.isArray(value)) {
    const keywords = value
      .filter((item): item is string => typeof item === 'string')
      .map((item) => item.trim())
      .filter(Boolean)
      .slice(0, 5);
    if (keywords.length > 0) {
      return keywords;
    }
  }

  return fallbackText
    .replace(/[^A-Za-z0-9À-ÿ\s]/g, ' ')
    .toLowerCase()
    .split(/\s+/)
    .filter((word) => word.length > 3)
    .slice(0, 4);
}

function sanitizeTranscriptText(text: string): string {
  return text.replace(/\s+/g, ' ').trim();
}

function normalizeWordToken(word: string): string {
  return word
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\p{L}\p{N}]/gu, '')
    .toLowerCase();
}

function dedupeAdjacentWords(text: string): string {
  const tokens = sanitizeTranscriptText(text).split(' ').filter(Boolean);
  const deduped: string[] = [];

  for (const token of tokens) {
    const normalized = normalizeWordToken(token);
    const previous = deduped[deduped.length - 1];
    const previousNormalized = previous ? normalizeWordToken(previous) : '';

    if (normalized && previousNormalized === normalized) {
      continue;
    }

    deduped.push(token);
  }

  return deduped.join(' ');
}

function trimRepeatedWordOverlap(previousText: string, nextText: string): string {
  const previousWords = dedupeAdjacentWords(previousText).split(' ').filter(Boolean);
  const nextWords = dedupeAdjacentWords(nextText).split(' ').filter(Boolean);
  const maxOverlap = Math.min(6, previousWords.length, nextWords.length);

  for (let size = maxOverlap; size >= 1; size -= 1) {
    const previousSlice = previousWords.slice(-size).map(normalizeWordToken).join(' ');
    const nextSlice = nextWords.slice(0, size).map(normalizeWordToken).join(' ');

    if (previousSlice && previousSlice === nextSlice) {
      return nextWords.slice(size).join(' ');
    }
  }

  return nextWords.join(' ');
}

function getNormalizedWords(text: string): string[] {
  return dedupeAdjacentWords(text)
    .split(' ')
    .map(normalizeWordToken)
    .filter(Boolean);
}

function countMatchingWordPrefix(wordsA: string[], wordsB: string[], maxWords = 8): number {
  const limit = Math.min(maxWords, wordsA.length, wordsB.length);

  for (let index = 0; index < limit; index += 1) {
    if (wordsA[index] !== wordsB[index]) {
      return index;
    }
  }

  return limit;
}

function countSuffixPrefixWordOverlap(previousText: string, nextText: string, maxWords = 8): number {
  const previousWords = getNormalizedWords(previousText);
  const nextWords = getNormalizedWords(nextText);
  const limit = Math.min(maxWords, previousWords.length, nextWords.length);

  for (let size = limit; size >= 1; size -= 1) {
    const previousSlice = previousWords.slice(-size).join(' ');
    const nextSlice = nextWords.slice(0, size).join(' ');

    if (previousSlice && previousSlice === nextSlice) {
      return size;
    }
  }

  return 0;
}

function getWordOverlapRatio(previousText: string, nextText: string): number {
  const previousWords = new Set(getNormalizedWords(previousText));
  const nextWords = new Set(getNormalizedWords(nextText));

  if (previousWords.size === 0 || nextWords.size === 0) {
    return 0;
  }

  let overlapCount = 0;
  for (const word of previousWords) {
    if (nextWords.has(word)) {
      overlapCount += 1;
    }
  }

  return overlapCount / Math.min(previousWords.size, nextWords.size);
}

function isDiscardableSpeechSegment(segment: TranscriptionSegment): boolean {
  const cleanedText = dedupeAdjacentWords(segment.text);
  const normalizedWords = cleanedText
    .split(' ')
    .map(normalizeWordToken)
    .filter(Boolean);

  if (normalizedWords.length === 0) {
    return true;
  }

  const uniqueWords = new Set(normalizedWords);
  const duration = Math.max(0, segment.end - segment.start);
  const onlyFillers = normalizedWords.every((word) => FILLER_WORDS.has(word));
  const repeatedSingleWord = uniqueWords.size === 1 && normalizedWords.length >= 2;

  return Boolean(
    onlyFillers
    || (duration <= 1.2 && repeatedSingleWord)
    || (duration <= 0.8 && normalizedWords.length <= 2),
  );
}

function trimSegmentEndByWordCount(segment: TranscriptionSegment, keptWordCount: number): TranscriptionSegment | null {
  const cleanedText = dedupeAdjacentWords(segment.text);
  const words = cleanedText.split(' ').filter(Boolean);

  if (words.length === 0 || keptWordCount <= 0) {
    return null;
  }

  if (keptWordCount >= words.length) {
    return { ...segment, text: cleanedText };
  }

  const duration = Math.max(0, segment.end - segment.start);
  const keptDuration = duration * (keptWordCount / words.length);
  const nextEnd = segment.start + keptDuration;

  if (nextEnd - segment.start < MIN_EDIT_SEGMENT_DURATION_SECONDS) {
    return null;
  }

  return {
    ...segment,
    end: nextEnd,
    text: words.slice(0, keptWordCount).join(' '),
  };
}

function prepareTranscriptionForEditing(transcription: TranscriptionSegment[]): TranscriptionSegment[] {
  const prepared = transcription
    .map((segment) => ({
      start: Math.max(0, segment.start),
      end: Math.max(segment.end, segment.start),
      text: dedupeAdjacentWords(segment.text),
    }))
    .filter((segment) => segment.text && !isDiscardableSpeechSegment(segment));

  for (let index = 1; index < prepared.length; index += 1) {
    const previous = prepared[index - 1];
    const current = prepared[index];
    const gap = Math.max(0, current.start - previous.end);

    if (gap > RESTART_MAX_GAP_SECONDS) {
      continue;
    }

    const previousWords = previous.text.split(' ').filter(Boolean);
    const currentWords = current.text.split(' ').filter(Boolean);
    const sharedPrefix = countMatchingWordPrefix(getNormalizedWords(previous.text), getNormalizedWords(current.text));
    const overlapRatio = getWordOverlapRatio(previous.text, current.text);

    if (
      (sharedPrefix >= RESTART_PREFIX_WORD_THRESHOLD || overlapRatio >= RESTART_STRONG_SIMILARITY_RATIO)
      && previous.end - previous.start <= RESTART_MAX_SEGMENT_DURATION_SECONDS
    ) {
      prepared[index - 1] = {
        ...previous,
        end: previous.start,
        text: '',
      };
      continue;
    }

    const overlapWords = countSuffixPrefixWordOverlap(previous.text, current.text);
    if (overlapWords < RESTART_OVERLAP_WORD_THRESHOLD) {
      continue;
    }

    const keptWordCount = previousWords.length - overlapWords;
    if (
      keptWordCount <= RESTART_DROP_REMAINDER_WORD_THRESHOLD
      || previous.end - previous.start <= 1.8
      || currentWords.length <= overlapWords + 1
    ) {
      prepared[index - 1] = {
        ...previous,
        end: previous.start,
        text: '',
      };
      continue;
    }

    const trimmedPrevious = trimSegmentEndByWordCount(previous, keptWordCount);
    prepared[index - 1] = trimmedPrevious ?? {
      ...previous,
      end: previous.start,
      text: '',
    };
  }

  return prepared.filter(
    (segment) =>
      segment.text
      && segment.end - segment.start >= MIN_EDIT_SEGMENT_DURATION_SECONDS
      && !isDiscardableSpeechSegment(segment),
  );
}

function buildGapRangesFromTranscription(transcription: TranscriptionSegment[]): EloCutSilenceRange[] {
  if (transcription.length <= 1) {
    return [];
  }

  const ranges: EloCutSilenceRange[] = [];

  for (let index = 1; index < transcription.length; index += 1) {
    const previous = transcription[index - 1];
    const current = transcription[index];
    const gapStart = previous.end + TRANSCRIPTION_GAP_PADDING_SECONDS;
    const gapEnd = current.start - TRANSCRIPTION_GAP_PADDING_SECONDS;

    if (gapEnd - gapStart < TRANSCRIPTION_GAP_MIN_SECONDS) {
      continue;
    }

    ranges.push({
      startTime: gapStart,
      endTime: gapEnd,
    });
  }

  return ranges;
}

function buildHeuristicScenes(segments: TranscriptionSegment[]): EloCutScene[] {
  if (segments.length === 0) {
    return [];
  }

  const desiredSceneCount = Math.min(8, Math.max(3, Math.ceil(segments.length / 6)));
  const chunkSize = Math.max(1, Math.ceil(segments.length / desiredSceneCount));
  const scenes: EloCutScene[] = [];

  for (let startIndex = 0, sceneIndex = 0; startIndex < segments.length; startIndex += chunkSize, sceneIndex += 1) {
    const chunk = segments.slice(startIndex, Math.min(startIndex + chunkSize, segments.length));
    const transcript = chunk.map((segment) => segment.text.trim()).filter(Boolean).join(' ');
    const first = chunk[0];
    const last = chunk[chunk.length - 1];
    const style = sanitizeSceneStyle(undefined, sceneIndex);
    const keywords = normalizeKeywordList(undefined, transcript);
    const titleWords = transcript
      .replace(/[^A-Za-z0-9À-ÿ\s]/g, ' ')
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 6);

    scenes.push({
      id: `scene_${sceneIndex + 1}`,
      startTime: first?.start ?? 0,
      endTime: last?.end ?? first?.end ?? first?.start ?? 0,
      transcript: transcript || first?.text || `Scene ${sceneIndex + 1}`,
      title: titleWords.join(' ') || `Cena ${sceneIndex + 1}`,
      description: `Trecho editorial resumindo ${keywords[0] ?? 'a mensagem principal'} com ritmo vertical premium e clareza visual.`,
      visualStyle: style,
      backgroundColor: ELOCUT_SCENE_BACKGROUNDS[sceneIndex % ELOCUT_SCENE_BACKGROUNDS.length],
      accentColor: ELOCUT_SCENE_ACCENTS[sceneIndex % ELOCUT_SCENE_ACCENTS.length],
      keywords: keywords.length > 0 ? keywords : ['video', 'edicao', 'narrativa'],
    });
  }

  return scenes;
}

function normalizeSceneCandidate(candidate: unknown, index: number, fallbackScenes: EloCutScene[]): EloCutScene {
  const fallback = fallbackScenes[Math.min(index, fallbackScenes.length - 1)] ?? {
    id: `scene_${index + 1}`,
    startTime: 0,
    endTime: 0,
    transcript: `Scene ${index + 1}`,
    title: `Cena ${index + 1}`,
    description: 'Bloco editorial gerado automaticamente.',
    visualStyle: sanitizeSceneStyle(undefined, index),
    backgroundColor: ELOCUT_SCENE_BACKGROUNDS[index % ELOCUT_SCENE_BACKGROUNDS.length],
    accentColor: ELOCUT_SCENE_ACCENTS[index % ELOCUT_SCENE_ACCENTS.length],
    keywords: ['video', 'edicao', 'narrativa'],
  };

  if (!candidate || typeof candidate !== 'object') {
    return fallback;
  }

  const value = candidate as Record<string, unknown>;
  const startTime = typeof value.startTime === 'number' ? value.startTime : fallback.startTime;
  const endTime = typeof value.endTime === 'number' ? value.endTime : fallback.endTime;
  const transcript = typeof value.transcript === 'string' && value.transcript.trim() ? value.transcript.trim() : fallback.transcript;

  return {
    id: typeof value.id === 'string' && value.id.trim() ? value.id.trim() : fallback.id,
    startTime,
    endTime: endTime >= startTime ? endTime : fallback.endTime,
    transcript,
    title: typeof value.title === 'string' && value.title.trim() ? value.title.trim() : fallback.title,
    description: typeof value.description === 'string' && value.description.trim() ? value.description.trim() : fallback.description,
    visualStyle: sanitizeSceneStyle(value.visualStyle, index),
    backgroundColor: sanitizeHexColor(value.backgroundColor, fallback.backgroundColor),
    accentColor: sanitizeHexColor(value.accentColor, fallback.accentColor),
    keywords: normalizeKeywordList(value.keywords, transcript).slice(0, 5),
  };
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
    path.join(process.cwd(), 'video-editor', 'node_modules', '@remotion', 'compositor-win32-x64-msvc', 'ffmpeg.exe'),
  ].filter((candidate): candidate is string => Boolean(candidate));

  return candidates.find((candidate) => fs.existsSync(candidate)) ?? null;
}

function resolveBundledFfprobePath(): string | null {
  const candidates = [
    process.env.FFPROBE_PATH?.trim(),
    path.join(process.cwd(), 'node_modules', '@remotion', 'compositor-win32-x64-msvc', 'ffprobe.exe'),
    path.join(process.cwd(), 'node_modules', '@remotion', 'compositor-win32-arm64-msvc', 'ffprobe.exe'),
    path.join(process.cwd(), 'node_modules', '@remotion', 'compositor-linux-x64-gnu', 'ffprobe'),
    path.join(process.cwd(), 'node_modules', '@remotion', 'compositor-linux-arm64-gnu', 'ffprobe'),
    path.join(process.cwd(), 'node_modules', '@remotion', 'compositor-darwin-x64', 'ffprobe'),
    path.join(process.cwd(), 'node_modules', '@remotion', 'compositor-darwin-arm64', 'ffprobe'),
    path.join(process.cwd(), 'video-editor', 'node_modules', '@remotion', 'compositor-win32-x64-msvc', 'ffprobe.exe'),
  ].filter((candidate): candidate is string => Boolean(candidate));

  return candidates.find((candidate) => fs.existsSync(candidate)) ?? null;
}

async function probeMediaDurationSeconds(videoPath: string): Promise<number> {
  const ffprobePath = resolveBundledFfprobePath();
  if (!ffprobePath) {
    throw new Error('ffprobe is required to measure video duration before transcription, but no ffprobe binary was found. Set FFPROBE_PATH or install the bundled Remotion compositor package.');
  }

  return new Promise<number>((resolve, reject) => {
    const args = [
      '-v',
      'error',
      '-show_entries',
      'format=duration',
      '-of',
      'default=noprint_wrappers=1:nokey=1',
      videoPath,
    ];

    const child = spawn(ffprobePath, args, { stdio: ['ignore', 'pipe', 'pipe'] });
    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (chunk) => {
      stdout += chunk.toString();
    });

    child.stderr.on('data', (chunk) => {
      stderr += chunk.toString();
    });

    child.on('error', (error) => {
      reject(error);
    });

    child.on('close', (code) => {
      const duration = Number.parseFloat(stdout.trim());
      if (code === 0 && Number.isFinite(duration) && duration > 0) {
        resolve(duration);
        return;
      }

      reject(new Error(`ffprobe failed while reading video duration (exit ${code}). ${stderr.trim() || stdout.trim()}`));
    });
  });
}

async function probeVideoStreamInfo(videoPath: string): Promise<VideoStreamInfo | null> {
  const ffprobePath = resolveBundledFfprobePath();
  if (!ffprobePath) {
    throw new Error('ffprobe is required to inspect the source video, but no ffprobe binary was found. Set FFPROBE_PATH or install the bundled Remotion compositor package.');
  }

  return new Promise<VideoStreamInfo | null>((resolve, reject) => {
    const args = [
      '-v',
      'error',
      '-select_streams',
      'v:0',
      '-show_entries',
      'stream=codec_name,width,height,pix_fmt,r_frame_rate',
      '-of',
      'json',
      videoPath,
    ];

    const child = spawn(ffprobePath, args, { stdio: ['ignore', 'pipe', 'pipe'] });
    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (chunk) => {
      stdout += chunk.toString();
    });

    child.stderr.on('data', (chunk) => {
      stderr += chunk.toString();
    });

    child.on('error', (error) => {
      reject(error);
    });

    child.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`ffprobe failed while reading video stream info (exit ${code}). ${stderr.trim() || stdout.trim()}`));
        return;
      }

      try {
        const payload = JSON.parse(stdout) as {
          streams?: Array<{
            codec_name?: string;
            width?: number;
            height?: number;
            pix_fmt?: string;
            r_frame_rate?: string;
          }>;
        };
        const stream = payload.streams?.[0];
        if (!stream) {
          resolve(null);
          return;
        }

        const [fpsNumRaw, fpsDenRaw] = String(stream.r_frame_rate || '0/1').split('/');
        const fpsNum = Number.parseFloat(fpsNumRaw);
        const fpsDen = Number.parseFloat(fpsDenRaw);
        const fps = fpsDen > 0 ? fpsNum / fpsDen : fpsNum;

        resolve({
          codecName: String(stream.codec_name || ''),
          width: Number(stream.width || 0),
          height: Number(stream.height || 0),
          pixFmt: String(stream.pix_fmt || ''),
          fps: Number.isFinite(fps) ? fps : 0,
        });
      } catch (error) {
        reject(error);
      }
    });
  });
}

async function prepareAudioChunksForTranscription(videoPath: string): Promise<PreparedAudioChunk[]> {
  const ffmpegPath = resolveBundledFfmpegPath();
  if (!ffmpegPath) {
    throw new Error('ffmpeg is required to prepare large videos for transcription, but no ffmpeg binary was found. Set FFMPEG_PATH or install the bundled Remotion compositor package.');
  }

  const durationSeconds = await probeMediaDurationSeconds(videoPath);
  const tempDir = path.join(process.cwd(), 'uploads', 'elocut', 'transcription-cache');
  await fs.promises.mkdir(tempDir, { recursive: true });
  const chunkBase = `${path.basename(videoPath, path.extname(videoPath))}_${Date.now()}`;
  const preparedChunks: PreparedAudioChunk[] = [];

  for (let index = 0, offsetSeconds = 0; offsetSeconds < durationSeconds; index += 1, offsetSeconds += TRANSCRIPTION_CHUNK_SECONDS) {
    const filePath = path.join(tempDir, `${chunkBase}_${String(index).padStart(3, '0')}.mp3`);
    const chunkDuration = Math.min(TRANSCRIPTION_CHUNK_SECONDS, Math.max(1, durationSeconds - offsetSeconds));

    await new Promise<void>((resolve, reject) => {
      const args = [
        '-y',
        '-ss',
        String(offsetSeconds),
        '-t',
        String(chunkDuration),
        '-i',
        videoPath,
        '-vn',
        '-ac',
        '1',
        '-ar',
        '16000',
        '-c:a',
        'libmp3lame',
        '-b:a',
        '24k',
        filePath,
      ];

      const child = spawn(ffmpegPath, args, { stdio: ['ignore', 'ignore', 'pipe'] });
      let stderr = '';

      child.stderr.on('data', (chunk) => {
        stderr += chunk.toString();
      });

      child.on('error', (error) => {
        reject(error);
      });

      child.on('close', (code) => {
        if (code === 0) {
          resolve();
          return;
        }

        reject(new Error(`ffmpeg failed while preparing transcription audio (exit ${code}). ${stderr.trim()}`));
      });
    });

    const stats = await fs.promises.stat(filePath);

    if (stats.size > TRANSCRIPTION_UPLOAD_LIMIT_BYTES) {
      throw new Error(`Prepared transcription audio chunk is still too large (${stats.size} bytes). Reduce chunk duration or split the source video before uploading.`);
    }

    preparedChunks.push({
      filePath,
      offsetSeconds,
    });
  }

  return preparedChunks;
}

async function waitForOutputFileReady(outputPath: string): Promise<void> {
  const startedAt = Date.now();
  let previousSize = -1;

  while (Date.now() - startedAt < OUTPUT_FILE_WAIT_TIMEOUT_MS) {
    try {
      const stats = await fs.promises.stat(outputPath);
      if (stats.isFile() && stats.size > 0) {
        if (stats.size === previousSize) {
          return;
        }

        previousSize = stats.size;
      }
    } catch {
      previousSize = -1;
    }

    await sleep(OUTPUT_FILE_WAIT_STEP_MS);
  }

  throw new Error(`Rendered file was not ready on disk within ${OUTPUT_FILE_WAIT_TIMEOUT_MS}ms: ${outputPath}`);
}

async function runFfmpegCommand(args: string[], errorContext: string): Promise<void> {
  const ffmpegPath = resolveBundledFfmpegPath();
  if (!ffmpegPath) {
    throw new Error('ffmpeg is required for EloCut video editing, but no ffmpeg binary was found. Set FFMPEG_PATH or install the bundled Remotion compositor package.');
  }

  await new Promise<void>((resolve, reject) => {
    const child = spawn(ffmpegPath, args, { stdio: ['ignore', 'ignore', 'pipe'] });
    let stderr = '';

    child.stderr.on('data', (chunk) => {
      stderr += chunk.toString();
    });

    child.on('error', (error) => {
      reject(error);
    });

    child.on('close', (code) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(new Error(`${errorContext} (exit ${code}). ${stderr.trim()}`));
    });
  });
}

function mergeRanges(ranges: EloCutSilenceRange[], maxGapSeconds = MERGE_GAP_SECONDS): EloCutSilenceRange[] {
  if (ranges.length === 0) {
    return [];
  }

  const sorted = [...ranges]
    .map((range) => ({
      startTime: Math.max(0, range.startTime),
      endTime: Math.max(range.endTime, range.startTime),
    }))
    .sort((a, b) => a.startTime - b.startTime);

  const merged: EloCutSilenceRange[] = [sorted[0]];

  for (const current of sorted.slice(1)) {
    const previous = merged[merged.length - 1];
    if (current.startTime <= previous.endTime + maxGapSeconds) {
      previous.endTime = Math.max(previous.endTime, current.endTime);
      continue;
    }

    merged.push(current);
  }

  return merged;
}

function subtractRanges(baseRanges: EloCutSilenceRange[], cutRanges: EloCutSilenceRange[]): EloCutSilenceRange[] {
  if (baseRanges.length === 0) {
    return [];
  }

  if (cutRanges.length === 0) {
    return baseRanges;
  }

  const sortedCuts = mergeRanges(cutRanges, 0);

  return baseRanges.flatMap((baseRange) => {
    let fragments: EloCutSilenceRange[] = [baseRange];

    for (const cutRange of sortedCuts) {
      fragments = fragments.flatMap((fragment) => {
        if (cutRange.endTime <= fragment.startTime || cutRange.startTime >= fragment.endTime) {
          return [fragment];
        }

        const nextFragments: EloCutSilenceRange[] = [];
        if (cutRange.startTime > fragment.startTime) {
          nextFragments.push({
            startTime: fragment.startTime,
            endTime: cutRange.startTime,
          });
        }

        if (cutRange.endTime < fragment.endTime) {
          nextFragments.push({
            startTime: cutRange.endTime,
            endTime: fragment.endTime,
          });
        }

        return nextFragments;
      });

      if (fragments.length === 0) {
        break;
      }
    }

    return fragments;
  });
}

async function normalizeSourceVideo(project: EloCutProject): Promise<string> {
  if (fs.existsSync(project.normalizedVideoPath)) {
    return project.normalizedVideoPath;
  }

  const streamInfo = await probeVideoStreamInfo(project.inputVideoPath);
  const alreadyCompatible = Boolean(
    streamInfo
    && streamInfo.codecName === 'h264'
    && streamInfo.width === 1080
    && streamInfo.height === 1920
    && Math.abs(streamInfo.fps - project.fps) < 0.05
    && streamInfo.pixFmt === 'yuv420p',
  );

  await fs.promises.mkdir(path.dirname(project.normalizedVideoPath), { recursive: true });
  await fs.promises.rm(project.normalizedVideoPath, { force: true }).catch(() => undefined);

  if (alreadyCompatible) {
    await fs.promises.copyFile(project.inputVideoPath, project.normalizedVideoPath);
    await waitForOutputFileReady(project.normalizedVideoPath);
    return project.normalizedVideoPath;
  }

  await runFfmpegCommand([
    '-y',
    '-i',
    project.inputVideoPath,
    '-c:v',
    'libx264',
    '-c:a',
    'aac',
    '-r',
    String(project.fps),
    '-preset',
    'medium',
    '-crf',
    '20',
    '-movflags',
    '+faststart',
    '-pix_fmt',
    'yuv420p',
    '-fps_mode',
    'cfr',
    project.normalizedVideoPath,
  ], 'ffmpeg failed while normalizing the source video');

  await waitForOutputFileReady(project.normalizedVideoPath);
  return project.normalizedVideoPath;
}

async function detectSilenceRanges(videoPath: string, totalDuration: number): Promise<EloCutSilenceRange[]> {
  const ffmpegPath = resolveBundledFfmpegPath();
  if (!ffmpegPath) {
    throw new Error('ffmpeg is required to detect silences for EloCut, but no ffmpeg binary was found. Set FFMPEG_PATH or install the bundled Remotion compositor package.');
  }

  return new Promise<EloCutSilenceRange[]>((resolve, reject) => {
    const args = [
      '-i',
      videoPath,
      '-map',
      '0:a:0',
      '-vn',
      '-sn',
      '-dn',
      '-af',
      `silencedetect=noise=${SILENCE_THRESHOLD_DB}:d=${SILENCE_MIN_DURATION_SECONDS}`,
      '-c:a',
      'pcm_s16le',
      '-f',
      'null',
      getNullDevice(),
    ];

    const child = spawn(ffmpegPath, args, { stdio: ['ignore', 'ignore', 'pipe'] });
    let stderr = '';

    child.stderr.on('data', (chunk) => {
      stderr += chunk.toString();
    });

    child.on('error', (error) => {
      reject(error);
    });

    child.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`ffmpeg failed while detecting silences (exit ${code}). ${stderr.trim()}`));
        return;
      }

      const silenceStarts = [...stderr.matchAll(/silence_start:\s*([0-9.]+)/g)].map((match) => Number.parseFloat(match[1]));
      const silenceEnds = [...stderr.matchAll(/silence_end:\s*([0-9.]+)/g)].map((match) => Number.parseFloat(match[1]));
      const ranges: EloCutSilenceRange[] = [];

      silenceStarts.forEach((startTime, index) => {
        if (!Number.isFinite(startTime)) {
          return;
        }

        const endTime = silenceEnds[index];
        ranges.push({
          startTime: Math.max(0, startTime),
          endTime: Number.isFinite(endTime) ? Math.min(totalDuration, Math.max(endTime, startTime)) : totalDuration,
        });
      });

      resolve(mergeRanges(ranges, 0));
    });
  });
}

function buildSpeechRangesFromTranscription(transcription: TranscriptionSegment[]): EloCutSilenceRange[] {
  const ranges = transcription
    .filter((segment) => !isDiscardableSpeechSegment(segment))
    .map((segment) => ({
      startTime: Math.max(0, segment.start - SPEECH_LEAD_PADDING_SECONDS),
      endTime: Math.max(segment.end + SPEECH_TAIL_PADDING_SECONDS, segment.start),
    }))
    .filter((range) => range.endTime - range.startTime >= MIN_EDIT_SEGMENT_DURATION_SECONDS);

  return mergeRanges(ranges);
}

function buildEditSegments(
  transcription: TranscriptionSegment[],
  silences: EloCutSilenceRange[],
  totalDuration: number,
): EloCutEditSegment[] {
  const speechRanges = buildSpeechRangesFromTranscription(transcription);
  const transcriptionGapRanges = buildGapRangesFromTranscription(transcription);
  const combinedSilenceRanges = mergeRanges([...silences, ...transcriptionGapRanges], 0);
  const silenceAwareRanges = speechRanges.length > 0
    ? subtractRanges(speechRanges, combinedSilenceRanges)
    : mergeRanges(
        combinedSilenceRanges.length === 0
          ? [{ startTime: 0, endTime: totalDuration }]
          : combinedSilenceRanges.flatMap((silence, index, all) => {
              const previousEnd = index === 0 ? 0 : all[index - 1].endTime;
              return silence.startTime - previousEnd >= MIN_EDIT_SEGMENT_DURATION_SECONDS
                ? [{ startTime: previousEnd, endTime: silence.startTime }]
                : [];
            }).concat(
              combinedSilenceRanges.length > 0 && totalDuration - combinedSilenceRanges[combinedSilenceRanges.length - 1].endTime >= MIN_EDIT_SEGMENT_DURATION_SECONDS
                ? [{ startTime: combinedSilenceRanges[combinedSilenceRanges.length - 1].endTime, endTime: totalDuration }]
                : [],
            ),
      );

  const filteredRanges = silenceAwareRanges
    .map((range) => ({
      startTime: Math.max(0, Math.min(range.startTime, totalDuration)),
      endTime: Math.max(0, Math.min(range.endTime, totalDuration)),
    }))
    .filter((range) => range.endTime - range.startTime >= MIN_EDIT_SEGMENT_DURATION_SECONDS);

  const finalRanges = mergeRanges(filteredRanges, 0)
    .filter((range) => range.endTime - range.startTime >= MIN_EDIT_SEGMENT_DURATION_SECONDS);

  const segments: EloCutEditSegment[] = [];
  let timelineCursor = 0;

  finalRanges.forEach((range, index) => {
    const transcript = dedupeAdjacentWords(transcription
      .filter((segment) => segment.end > range.startTime && segment.start < range.endTime)
      .map((segment) => segment.text.trim())
      .filter(Boolean)
      .join(' '));
    const duration = range.endTime - range.startTime;

    segments.push({
      id: `segment_${index + 1}`,
      sourceStartTime: range.startTime,
      sourceEndTime: range.endTime,
      timelineStartTime: timelineCursor,
      timelineEndTime: timelineCursor + duration,
      transition: index === 0 ? 'cut' : 'fade',
      transcript,
    });

    timelineCursor += duration;
  });

  return segments;
}

function mapTimeToEditedTimeline(timeInSource: number, editSegments: EloCutEditSegment[]): number {
  if (editSegments.length === 0) {
    return timeInSource;
  }

  for (const segment of editSegments) {
    if (timeInSource >= segment.sourceStartTime && timeInSource <= segment.sourceEndTime) {
      return segment.timelineStartTime + (timeInSource - segment.sourceStartTime);
    }

    if (timeInSource < segment.sourceStartTime) {
      return segment.timelineStartTime;
    }
  }

  const lastSegment = editSegments[editSegments.length - 1];
  return lastSegment.timelineEndTime;
}

function mapTranscriptionToEditedTimeline(
  transcription: TranscriptionSegment[],
  editSegments: EloCutEditSegment[],
): TranscriptionSegment[] {
  const mappedSegments: TranscriptionSegment[] = [];

  for (const segment of transcription) {
    for (const editSegment of editSegments) {
      const overlapStart = Math.max(segment.start, editSegment.sourceStartTime);
      const overlapEnd = Math.min(segment.end, editSegment.sourceEndTime);

      if (overlapEnd <= overlapStart) {
        continue;
      }

      const cleanedText = dedupeAdjacentWords(segment.text);
      if (!cleanedText) {
        continue;
      }

      mappedSegments.push({
        start: editSegment.timelineStartTime + (overlapStart - editSegment.sourceStartTime),
        end: editSegment.timelineStartTime + (overlapEnd - editSegment.sourceStartTime),
        text: cleanedText,
      });
    }
  }

  return mappedSegments.reduce<TranscriptionSegment[]>((acc, current) => {
    const previous = acc[acc.length - 1];
    const mergedText = previous ? trimRepeatedWordOverlap(previous.text, current.text) : current.text;

    if (!mergedText) {
      return acc;
    }

    const nextSegment = {
      ...current,
      text: mergedText,
    };

    if (
      previous
      && Math.abs(previous.end - nextSegment.start) <= 0.08
      && normalizeWordToken(previous.text) === normalizeWordToken(nextSegment.text)
    ) {
      previous.end = nextSegment.end;
      return acc;
    }

    acc.push(nextSegment);
    return acc;
  }, []);
}

function mapScenesToEditedTimeline(
  scenes: EloCutScene[],
  editSegments: EloCutEditSegment[],
): EloCutScene[] {
  return scenes.map((scene) => {
    const startTime = mapTimeToEditedTimeline(scene.startTime, editSegments);
    const endTime = mapTimeToEditedTimeline(scene.endTime, editSegments);
    return {
      ...scene,
      startTime,
      endTime: Math.max(endTime, startTime + 0.2),
    };
  });
}

async function createEditedVideoFromSegments(project: EloCutProject): Promise<string> {
  if (project.editSegments.length === 0) {
    await fs.promises.copyFile(project.normalizedVideoPath, project.editedVideoPath);
    await waitForOutputFileReady(project.editedVideoPath);
    return project.editedVideoPath;
  }

  const tempDir = path.join(process.cwd(), 'outputs', 'elocut', `${project.id}_segments`);
  await fs.promises.mkdir(tempDir, { recursive: true });
  const segmentFiles: string[] = [];

  try {
    for (const [index, segment] of project.editSegments.entries()) {
      const segmentFile = path.join(tempDir, `${project.id}_${String(index).padStart(3, '0')}.mp4`);
      await runFfmpegCommand([
        '-y',
        '-ss',
        segment.sourceStartTime.toFixed(3),
        '-to',
        segment.sourceEndTime.toFixed(3),
        '-i',
        project.normalizedVideoPath,
        '-c:v',
        'libx264',
        '-c:a',
        'aac',
        '-r',
        String(project.fps),
        '-preset',
        'medium',
        '-crf',
        '20',
        '-movflags',
        '+faststart',
        '-pix_fmt',
        'yuv420p',
        segmentFile,
      ], `ffmpeg failed while extracting edit segment ${segment.id}`);
      segmentFiles.push(segmentFile);
    }

    if (segmentFiles.length === 1) {
      await fs.promises.copyFile(segmentFiles[0], project.editedVideoPath);
    } else {
      const concatListPath = path.join(tempDir, `${project.id}_concat.txt`);
      await fs.promises.writeFile(
        concatListPath,
        segmentFiles.map((filePath) => `file '${filePath.replace(/\\/g, '/').replace(/'/g, "'\\''")}'`).join('\n'),
        'utf8',
      );

      await runFfmpegCommand([
        '-y',
        '-f',
        'concat',
        '-safe',
        '0',
        '-i',
        concatListPath,
        '-fflags',
        '+genpts',
        '-c:v',
        'libx264',
        '-c:a',
        'aac',
        '-r',
        String(project.fps),
        '-preset',
        'medium',
        '-crf',
        '20',
        '-movflags',
        '+faststart',
        '-pix_fmt',
        'yuv420p',
        '-fps_mode',
        'cfr',
        project.editedVideoPath,
      ], 'ffmpeg failed while concatenating the edited video timeline');
    }

    await waitForOutputFileReady(project.editedVideoPath);
    return project.editedVideoPath;
  } finally {
    await Promise.all(segmentFiles.map((filePath) => fs.promises.unlink(filePath).catch(() => undefined)));
    await fs.promises.rm(tempDir, { recursive: true, force: true }).catch(() => undefined);
  }
}

function createTranscriptionFormData(videoPath: string) {
  const formData = new FormData();
  formData.append('file', fs.createReadStream(videoPath));
  formData.append('response_format', 'verbose_json');
  formData.append('timestamp_granularities[]', 'segment');
  return formData;
}

function getTranscriptionProviders(): TranscriptionProvider[] {
  const providers: Array<TranscriptionProvider | null> = [
    process.env.GROQ_API_KEY?.trim()
      ? {
          providerId: 'groq',
          label: 'Groq Whisper',
          endpoint: 'https://api.groq.com/openai/v1/audio/transcriptions',
          apiKey: process.env.GROQ_API_KEY.trim(),
          model: 'whisper-large-v3',
        }
      : null,
    process.env.OPENAI_API_KEY?.trim()
      ? {
          providerId: 'openai',
          label: 'OpenAI Whisper',
          endpoint: 'https://api.openai.com/v1/audio/transcriptions',
          apiKey: process.env.OPENAI_API_KEY.trim(),
          model: 'whisper-1',
        }
      : null,
  ];

  return providers.filter((provider): provider is TranscriptionProvider => Boolean(provider));
}

async function requestTranscription(
  provider: TranscriptionProvider,
  videoPath: string,
): Promise<TranscriptionSegment[]> {
  const formData = createTranscriptionFormData(videoPath);
  formData.append('model', provider.model);

  const response = await fetch(provider.endpoint, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${provider.apiKey}`,
      ...formData.getHeaders(),
    },
    body: formData,
  });

  if (!response.ok) {
    const errorText = (await response.text()).trim().replace(/\s+/g, ' ');
    throw new TranscriptionProviderError(
      `${provider.label} transcription failed (${response.status}): ${errorText || 'empty response body'}`,
      response.status,
    );
  }

  const result = await response.json() as TranscriptionApiResponse;
  await recordAIUsageEvent({
    providerId: provider.providerId,
    model: provider.model,
    capability: 'audio_transcription',
    promptTokens: null,
    completionTokens: null,
    totalTokens: null,
  });

  return (result.segments || [])
    .filter((segment) => typeof segment.start === 'number' && typeof segment.end === 'number' && typeof segment.text === 'string')
    .map((segment) => ({
      start: Number(segment.start),
      end: Number(segment.end),
      text: segment.text?.trim() || '',
    }))
    .filter((segment) => segment.text.length > 0);
}

async function transcribeWithProvider(
  provider: TranscriptionProvider,
  videoPath: string,
): Promise<TranscriptionSegment[]> {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= TRANSCRIPTION_MAX_ATTEMPTS; attempt += 1) {
    try {
      const segments = await requestTranscription(provider, videoPath);
      if (segments.length === 0) {
        throw new Error(`${provider.label} returned no transcription segments.`);
      }
      return segments;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      const retryable = error instanceof TranscriptionProviderError && error.retryable;

      if (!retryable || attempt === TRANSCRIPTION_MAX_ATTEMPTS) {
        break;
      }

      await sleep(TRANSCRIPTION_RETRY_DELAY_MS * attempt);
    }
  }

  throw lastError ?? new Error(`${provider.label} transcription failed.`);
}

// Groq Whisper é o primário; OpenAI entra como fallback quando configurado.
export async function transcribeVideo(videoPath: string): Promise<TranscriptionSegment[]> {
  const providers = getTranscriptionProviders();
  if (providers.length === 0) {
    throw new Error('Audio transcription is not configured. Set GROQ_API_KEY or OPENAI_API_KEY.');
  }

  const preparedChunks = await prepareAudioChunksForTranscription(videoPath);
  const allSegments: TranscriptionSegment[] = [];

  try {
    for (const chunk of preparedChunks) {
      const failures: string[] = [];
      let chunkSegments: TranscriptionSegment[] | null = null;

      for (const provider of providers) {
        try {
          chunkSegments = await transcribeWithProvider(provider, chunk.filePath);
          break;
        } catch (error) {
          failures.push(error instanceof Error ? error.message : String(error));
        }
      }

      if (!chunkSegments) {
        throw new Error(`Audio transcription failed after all configured providers were attempted. ${failures.join(' | ')}`);
      }

      allSegments.push(
        ...chunkSegments.map((segment) => ({
          start: segment.start + chunk.offsetSeconds,
          end: segment.end + chunk.offsetSeconds,
          text: segment.text,
        })),
      );
    }
  } finally {
    await Promise.all(preparedChunks.map((chunk) => fs.promises.unlink(chunk.filePath).catch(() => undefined)));
  }

  return allSegments;
}

// Usa o router já configurado do projeto (Groq / DeepSeek / OpenRouter)
export async function analyzeTranscriptWithClaude(
  segments: TranscriptionSegment[]
): Promise<EloCutScene[]> {
  const fallbackScenes = buildHeuristicScenes(segments);
  const fullTranscript = segments
    .map(s => `[${s.start.toFixed(1)}s-${s.end.toFixed(1)}s] ${s.text}`)
    .join('\n');

  const result = await routeTextGeneration({
    capability: 'structured_text',
    responseFormat: {
      name: 'elocut_scene_breakdown',
      strict: true,
      schema: {
        type: 'array',
        items: {
          type: 'object',
          additionalProperties: false,
          required: ['id', 'startTime', 'endTime', 'transcript', 'title', 'description', 'visualStyle', 'backgroundColor', 'accentColor', 'keywords'],
          properties: {
            id: { type: 'string' },
            startTime: { type: 'number' },
            endTime: { type: 'number' },
            transcript: { type: 'string' },
            title: { type: 'string' },
            description: { type: 'string' },
            visualStyle: { type: 'string', enum: ELOCUT_SCENE_STYLES },
            backgroundColor: { type: 'string' },
            accentColor: { type: 'string' },
            keywords: {
              type: 'array',
              items: { type: 'string' },
              minItems: 3,
              maxItems: 5,
            },
          },
        },
        minItems: 3,
        maxItems: 8,
      },
    },
    messages: [
      {
        role: 'user',
        content: `You are a professional video editor AI. Analyze this video transcript and create a scene breakdown for automated video editing.

TRANSCRIPT:
${fullTranscript}

Return a JSON array of scenes. Each scene should have:
- id: unique string
- startTime: number (seconds)
- endTime: number (seconds)
- transcript: the text spoken in this segment
- title: short punchy title for this scene (max 6 words)
- description: visual description for the scene (1-2 sentences)
- visualStyle: one of "kinetic", "minimal", "dramatic", "energetic"
- backgroundColor: hex color matching the mood
- accentColor: complementary accent hex color
- keywords: array of 3-5 key terms from the segment

Group the transcript into 3-8 meaningful scenes. Return ONLY valid JSON array, no other text.`,
      },
    ],
    maxTokens: 4096,
  });

  const structuredScenes = Array.isArray(result.data)
    ? result.data
    : (() => {
        const jsonMatch = result.content.match(/\[[\s\S]*\]/);
        if (!jsonMatch) {
          return null;
        }

        try {
          return JSON.parse(jsonMatch[0]);
        } catch {
          return null;
        }
      })();

  if (!Array.isArray(structuredScenes) || structuredScenes.length === 0) {
    return fallbackScenes;
  }

  return structuredScenes
    .slice(0, 8)
    .map((scene, index) => normalizeSceneCandidate(scene, index, fallbackScenes));
}

export async function buildEloCutEditPlan(project: EloCutProject): Promise<EloCutProject> {
  const editableSourcePath = await normalizeSourceVideo(project);
  const durationSeconds = await probeMediaDurationSeconds(editableSourcePath);
  const silences = await detectSilenceRanges(editableSourcePath, durationSeconds);
  const editableTranscription = prepareTranscriptionForEditing(project.transcription);
  const editSegments = buildEditSegments(editableTranscription, silences, durationSeconds);
  const editedTranscription = mapTranscriptionToEditedTimeline(editableTranscription, editSegments);
  const editedScenes = mapScenesToEditedTimeline(project.scenes, editSegments);
  const editedDuration = editSegments.length > 0
    ? editSegments[editSegments.length - 1].timelineEndTime
    : durationSeconds;
  const removedDuration = Math.max(0, durationSeconds - editedDuration);

  console.log(
    `[EloCut] Edit plan ${project.id}: source=${durationSeconds.toFixed(2)}s, edited=${editedDuration.toFixed(2)}s, removed=${removedDuration.toFixed(2)}s, silences=${silences.length}, segments=${editSegments.length}`,
  );

  project.normalizedVideoPath = editableSourcePath;
  project.editedVideoPath = await createEditedVideoFromSegments({
    ...project,
    normalizedVideoPath: editableSourcePath,
    editSegments,
  });
  project.silences = silences;
  project.editSegments = editSegments;
  project.editedTranscription = editedTranscription;
  project.scenes = editedScenes;
  project.totalDuration = editedDuration;

  return project;
}

export async function renderEloCutVideo(
  project: EloCutProject,
  onProgress?: (progress: number) => void
): Promise<string> {
  const entryPoint = path.resolve(process.cwd(), 'remotion/EloCut/index.tsx');
  const outputPath = project.outputVideoPath;
  const editedVideoUrl = toRenderableMediaSource(project.editedVideoPath);

  const bundleLocation = await bundle({
    entryPoint,
    webpackOverride: (config) => config,
  });

  const composition = await selectComposition({
    serveUrl: bundleLocation,
    id: 'EloCut',
    timeoutInMilliseconds: REMOTION_RENDER_TIMEOUT_MS,
    inputProps: {
      editedVideoPath: editedVideoUrl,
      editSegments: project.editSegments,
      transcription: project.editedTranscription,
      scenes: project.scenes,
      fps: project.fps,
    },
  });

  await renderMedia({
    composition,
    serveUrl: bundleLocation,
    codec: 'h264',
    outputLocation: outputPath,
    timeoutInMilliseconds: REMOTION_RENDER_TIMEOUT_MS,
    inputProps: {
      editedVideoPath: editedVideoUrl,
      editSegments: project.editSegments,
      transcription: project.editedTranscription,
      scenes: project.scenes,
      fps: project.fps,
    },
    onProgress: ({ progress }) => {
      onProgress?.(Math.round(progress * 100));
    },
  });

  await waitForOutputFileReady(outputPath);
  return outputPath;
}

export function createEloCutProject(inputVideoPath: string): EloCutProject {
  const id = `elocut_${Date.now()}`;
  const outputDir = path.join(process.cwd(), 'outputs', 'elocut');
  fs.mkdirSync(outputDir, { recursive: true });

  return {
    id,
    inputVideoPath,
    outputVideoPath: path.join(outputDir, `${id}_output.mp4`),
    normalizedVideoPath: path.join(outputDir, `${id}_normalized.mp4`),
    editedVideoPath: path.join(outputDir, `${id}_edited_base.mp4`),
    transcription: [],
    editedTranscription: [],
    scenes: [],
    editSegments: [],
    silences: [],
    totalDuration: 0,
    fps: 30,
    status: 'pending',
    createdAt: new Date().toISOString(),
  };
}

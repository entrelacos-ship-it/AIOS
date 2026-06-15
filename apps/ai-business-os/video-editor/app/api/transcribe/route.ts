import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';
import FormData from 'form-data';
import type { EloCutProject, SRTSegment } from '@/lib/types';

export const runtime = 'nodejs';

type TranscriptionProvider = {
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

const TRANSCRIPTION_RETRYABLE_STATUS = new Set([408, 429, 500, 502, 503, 504]);
const TRANSCRIPTION_MAX_ATTEMPTS = 3;
const TRANSCRIPTION_RETRY_DELAY_MS = 1500;
const TRANSCRIPTION_UPLOAD_LIMIT_BYTES = 25 * 1024 * 1024;
const TRANSCRIPTION_CHUNK_SECONDS = 20 * 60;

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

function resolveBundledFfmpegPath(): string | null {
  const candidates = [
    process.env.FFMPEG_PATH?.trim(),
    path.join(process.cwd(), 'node_modules', '@remotion', 'compositor-win32-x64-msvc', 'ffmpeg.exe'),
    path.join(process.cwd(), 'node_modules', '@remotion', 'compositor-win32-arm64-msvc', 'ffmpeg.exe'),
    path.join(process.cwd(), 'node_modules', '@remotion', 'compositor-linux-x64-gnu', 'ffmpeg'),
    path.join(process.cwd(), 'node_modules', '@remotion', 'compositor-linux-arm64-gnu', 'ffmpeg'),
    path.join(process.cwd(), 'node_modules', '@remotion', 'compositor-darwin-x64', 'ffmpeg'),
    path.join(process.cwd(), 'node_modules', '@remotion', 'compositor-darwin-arm64', 'ffmpeg'),
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

async function prepareAudioChunksForTranscription(videoPath: string): Promise<PreparedAudioChunk[]> {
  const ffmpegPath = resolveBundledFfmpegPath();
  if (!ffmpegPath) {
    throw new Error('ffmpeg is required to prepare large videos for transcription, but no ffmpeg binary was found. Set FFMPEG_PATH or install the bundled Remotion compositor package.');
  }

  const durationSeconds = await probeMediaDurationSeconds(videoPath);
  const tempDir = path.join(process.cwd(), 'tmp', 'transcription-cache');
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

function formatSrtTime(totalSeconds: number): string {
  const safeSeconds = Math.max(0, totalSeconds);
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const seconds = Math.floor(safeSeconds % 60);
  const milliseconds = Math.round((safeSeconds - Math.floor(safeSeconds)) * 1000);

  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')},${String(milliseconds).padStart(3, '0')}`;
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
          label: 'Groq Whisper',
          endpoint: 'https://api.groq.com/openai/v1/audio/transcriptions',
          apiKey: process.env.GROQ_API_KEY.trim(),
          model: 'whisper-large-v3',
        }
      : null,
    process.env.OPENAI_API_KEY?.trim()
      ? {
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
): Promise<SRTSegment[]> {
  const formData = createTranscriptionFormData(videoPath);
  formData.append('model', provider.model);

  const { default: fetch } = await import('node-fetch');
  const response = await fetch(provider.endpoint, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${provider.apiKey}`,
      ...formData.getHeaders(),
    },
    body: formData as unknown as BodyInit,
  });

  if (!response.ok) {
    const errorText = (await response.text()).trim().replace(/\s+/g, ' ');
    throw new TranscriptionProviderError(
      `${provider.label} transcription failed (${response.status}): ${errorText || 'empty response body'}`,
      response.status,
    );
  }

  const result = await response.json() as TranscriptionApiResponse;
  return (result.segments || [])
    .filter((segment) => typeof segment.start === 'number' && typeof segment.end === 'number' && typeof segment.text === 'string')
    .map((segment, index) => {
      const startSeconds = Number(segment.start);
      const endSeconds = Number(segment.end);
      return {
        id: String(index + 1),
        text: segment.text?.trim() || '',
        startSeconds,
        endSeconds,
        startTime: formatSrtTime(startSeconds),
        endTime: formatSrtTime(endSeconds),
      };
    })
    .filter((segment) => segment.text.length > 0);
}

async function transcribeWithProvider(
  provider: TranscriptionProvider,
  videoPath: string,
): Promise<SRTSegment[]> {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= TRANSCRIPTION_MAX_ATTEMPTS; attempt += 1) {
    try {
      const subtitles = await requestTranscription(provider, videoPath);
      if (subtitles.length === 0) {
        throw new Error(`${provider.label} returned no transcription segments.`);
      }
      return subtitles;
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

export async function POST(req: NextRequest) {
  try {
    const providers = getTranscriptionProviders();
    if (providers.length === 0) {
      return NextResponse.json({ error: 'Missing GROQ_API_KEY or OPENAI_API_KEY' }, { status: 500 });
    }

    const { project }: { project: EloCutProject } = await req.json();
    const videoPath = project.normalizedPath || project.uploadPath;
    const preparedChunks = await prepareAudioChunksForTranscription(videoPath);
    const subtitles: SRTSegment[] = [];

    try {
      for (const chunk of preparedChunks) {
        const failures: string[] = [];
        let chunkSubtitles: SRTSegment[] | null = null;

        for (const provider of providers) {
          try {
            chunkSubtitles = await transcribeWithProvider(provider, chunk.filePath);
            break;
          } catch (error) {
            failures.push(error instanceof Error ? error.message : String(error));
          }
        }

        if (!chunkSubtitles) {
          throw new Error(`Audio transcription failed after all configured providers were attempted. ${failures.join(' | ')}`);
        }

        subtitles.push(
          ...chunkSubtitles.map((subtitle, index) => {
            const startSeconds = subtitle.startSeconds + chunk.offsetSeconds;
            const endSeconds = subtitle.endSeconds + chunk.offsetSeconds;
            return {
              id: String(subtitles.length + index + 1),
              text: subtitle.text,
              startSeconds,
              endSeconds,
              startTime: formatSrtTime(startSeconds),
              endTime: formatSrtTime(endSeconds),
            };
          }),
        );
      }
    } finally {
      await Promise.all(preparedChunks.map((chunk) => fs.promises.unlink(chunk.filePath).catch(() => undefined)));
    }

    return NextResponse.json({ project: { ...project, subtitles } });
  } catch (error) {
    console.error('[transcribe]', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

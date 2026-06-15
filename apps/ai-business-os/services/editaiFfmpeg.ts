import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';
import { type EditAICutReport } from '../types.js';
import { buildKeptSegments, getKeptDuration, normalizeApprovedCuts } from './editaiTimeline.js';

export interface VideoInfo {
  fps: number;
  duration: number;
  width: number;
  height: number;
  codecName: string;
}

export interface EditAISilenceRange {
  start: number;
  end: number;
}

function getNullDevice(): string {
  return process.platform === 'win32' ? 'NUL' : '/dev/null';
}

function resolveFfmpegPath(): string {
  const candidates = [
    process.env.FFMPEG_PATH?.trim(),
    path.join(process.cwd(), 'node_modules', '@remotion', 'compositor-win32-x64-msvc', 'ffmpeg.exe'),
    path.join(process.cwd(), 'node_modules', '@remotion', 'compositor-win32-arm64-msvc', 'ffmpeg.exe'),
    path.join(process.cwd(), 'node_modules', '@remotion', 'compositor-linux-x64-gnu', 'ffmpeg'),
    path.join(process.cwd(), 'node_modules', '@remotion', 'compositor-linux-arm64-gnu', 'ffmpeg'),
    path.join(process.cwd(), 'node_modules', '@remotion', 'compositor-darwin-x64', 'ffmpeg'),
    path.join(process.cwd(), 'node_modules', '@remotion', 'compositor-darwin-arm64', 'ffmpeg'),
  ].filter((c): c is string => Boolean(c));

  const found = candidates.find((c) => fs.existsSync(c));
  if (!found) {
    throw new Error('ffmpeg not found. Set FFMPEG_PATH or install a @remotion/compositor-* package.');
  }

  return found;
}

function resolveFfprobePath(): string {
  const ffmpegPath = resolveFfmpegPath();
  const ffprobePath = ffmpegPath.replace(/ffmpeg(\.exe)?$/, 'ffprobe$1');
  if (!fs.existsSync(ffprobePath)) {
    throw new Error(`ffprobe not found at expected path: ${ffprobePath}`);
  }
  return ffprobePath;
}

async function runFfmpeg(args: string[], context: string): Promise<void> {
  const ffmpegPath = resolveFfmpegPath();

  await new Promise<void>((resolve, reject) => {
    const child = spawn(ffmpegPath, args, { stdio: ['ignore', 'ignore', 'pipe'] });
    let stderr = '';
    child.stderr.on('data', (c) => { stderr += c.toString(); });
    child.on('error', reject);
    child.on('close', (code) => {
      if (code === 0) { resolve(); return; }
      reject(new Error(`${context} — ffmpeg exit ${code}. ${stderr.slice(-800).trim()}`));
    });
  });
}

function mergeSilenceRanges(ranges: EditAISilenceRange[], tolerance = 0.05): EditAISilenceRange[] {
  const sorted = ranges
    .filter((range) => Number.isFinite(range.start) && Number.isFinite(range.end) && range.end > range.start)
    .sort((a, b) => a.start - b.start);
  const merged: EditAISilenceRange[] = [];

  for (const range of sorted) {
    const last = merged[merged.length - 1];
    if (last && range.start <= last.end + tolerance) {
      last.end = Math.max(last.end, range.end);
    } else {
      merged.push({ ...range });
    }
  }

  return merged;
}

/** Normalize any video to H.264 CFR 30fps, AAC 44100Hz — required for Remotion + Whisper. */
export async function normalizeToH264(inputPath: string, outputPath: string): Promise<void> {
  await fs.promises.mkdir(path.dirname(outputPath), { recursive: true });

  await runFfmpeg([
    '-y', '-i', inputPath,
    '-c:v', 'libx264',
    '-crf', '23',
    '-r', '30',
    '-g', '30',       // keyframe every second
    '-c:a', 'aac',
    '-ar', '44100',
    '-movflags', '+faststart',
    '-pix_fmt', 'yuv420p',
    '-fps_mode', 'cfr',
    outputPath,
  ], 'normalize to H.264');
}

/** Probe video stream info — fps, duration, dimensions. */
export async function probeVideoInfo(videoPath: string): Promise<VideoInfo> {
  const ffprobePath = resolveFfprobePath();

  return new Promise<VideoInfo>((resolve, reject) => {
    const args = [
      '-v', 'error',
      '-select_streams', 'v:0',
      '-show_entries', 'stream=codec_name,width,height,pix_fmt,r_frame_rate:format=duration',
      '-of', 'json',
      videoPath,
    ];

    const child = spawn(ffprobePath, args, { stdio: ['ignore', 'pipe', 'pipe'] });
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (c) => { stdout += c.toString(); });
    child.stderr.on('data', (c) => { stderr += c.toString(); });
    child.on('error', reject);
    child.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`ffprobe failed (exit ${code}). ${stderr.trim()}`));
        return;
      }

      try {
        const json = JSON.parse(stdout) as Record<string, unknown>;
        const streams = json.streams as Array<Record<string, unknown>> | undefined;
        const format = json.format as Record<string, unknown> | undefined;
        const stream = streams?.[0] ?? {};

        const [fpsNum, fpsDen] = String(stream.r_frame_rate ?? '30/1').split('/').map(Number);
        const fps = fpsDen > 0 ? fpsNum / fpsDen : fpsNum;

        resolve({
          fps: isFinite(fps) ? fps : 30,
          duration: parseFloat(String(format?.duration ?? '0')) || 0,
          width: Number(stream.width ?? 0),
          height: Number(stream.height ?? 0),
          codecName: String(stream.codec_name ?? ''),
        });
      } catch (err) {
        reject(err);
      }
    });
  });
}

export async function detectAudioSilenceRanges(
  videoPath: string,
  totalDuration: number,
  opts: { noiseDb?: number; minDuration?: number } = {},
): Promise<EditAISilenceRange[]> {
  const ffmpegPath = resolveFfmpegPath();
  const noiseDb = opts.noiseDb ?? -30;
  const minDuration = opts.minDuration ?? 0.2;

  return new Promise<EditAISilenceRange[]>((resolve, reject) => {
    const args = [
      '-i',
      videoPath,
      '-map',
      '0:a:0',
      '-vn',
      '-sn',
      '-dn',
      '-af',
      `silencedetect=noise=${noiseDb}dB:d=${minDuration}`,
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
    child.on('error', reject);
    child.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`ffmpeg failed while detecting EditAI silences (exit ${code}). ${stderr.slice(-800).trim()}`));
        return;
      }

      const starts = [...stderr.matchAll(/silence_start:\s*([0-9.]+)/g)]
        .map((match) => Number.parseFloat(match[1]));
      const ends = [...stderr.matchAll(/silence_end:\s*([0-9.]+)/g)]
        .map((match) => Number.parseFloat(match[1]));

      const ranges = starts.map((start, index) => {
        const end = ends[index];
        return {
          start: Math.max(0, start),
          end: Number.isFinite(end) ? Math.min(totalDuration, Math.max(end, start)) : totalDuration,
        };
      });

      resolve(mergeSilenceRanges(ranges));
    });
  });
}

/**
 * Execute approved cuts using concat demuxer.
 * Keeps segments between cuts; approved=false cuts are skipped.
 */
export async function executeCuts(
  normalizedPath: string,
  outputPath: string,
  cutReport: EditAICutReport[],
): Promise<void> {
  const { duration } = await probeVideoInfo(normalizedPath);
  const approvedCuts = normalizeApprovedCuts(cutReport, duration);

  if (approvedCuts.length === 0) {
    // No cuts — just copy
    await fs.promises.mkdir(path.dirname(outputPath), { recursive: true });
    await runFfmpeg([
      '-y', '-i', normalizedPath,
      '-map', '0:v:0',
      '-map', '0:a?',
      '-c:v', 'libx264',
      '-preset', 'veryfast',
      '-crf', '18',
      '-c:a', 'aac',
      '-ar', '44100',
      '-ac', '2',
      '-movflags', '+faststart',
      '-pix_fmt', 'yuv420p',
      '-fps_mode', 'cfr',
      outputPath,
    ], 'copy without cuts');
    return;
  }

  const segments = buildKeptSegments(duration, approvedCuts);

  if (segments.length === 0) {
    throw new Error('All content would be cut. At least one segment must remain.');
  }

  const tempDir = path.join(process.cwd(), 'uploads', 'editai', 'cut-temp');
  await fs.promises.mkdir(tempDir, { recursive: true });
  const segmentFiles: string[] = [];

  // Extract each segment
  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i];
    const segPath = path.join(tempDir, `seg_${Date.now()}_${i}.mp4`);
    segmentFiles.push(segPath);

    await runFfmpeg([
      '-y',
      '-i', normalizedPath,
      '-ss', String(seg.start),
      '-t', String(seg.end - seg.start),
      '-map', '0:v:0',
      '-map', '0:a?',
      '-c:v', 'libx264',
      '-preset', 'veryfast',
      '-crf', '18',
      '-c:a', 'aac',
      '-ar', '44100',
      '-ac', '2',
      '-movflags', '+faststart',
      '-pix_fmt', 'yuv420p',
      '-fps_mode', 'cfr',
      '-avoid_negative_ts', 'make_zero',
      segPath,
    ], `extract segment ${i}`);
  }

  // Build concat list
  const concatListPath = path.join(tempDir, `concat_${Date.now()}.txt`);
  const concatContent = segmentFiles.map((f) => `file '${f.replace(/\\/g, '/')}'`).join('\n');
  await fs.promises.writeFile(concatListPath, concatContent, 'utf8');

  await fs.promises.mkdir(path.dirname(outputPath), { recursive: true });

  try {
    await runFfmpeg([
      '-y',
      '-f', 'concat',
      '-safe', '0',
      '-i', concatListPath,
      '-c:v', 'libx264',
      '-preset', 'veryfast',
      '-crf', '18',
      '-c:a', 'aac',
      '-ar', '44100',
      '-ac', '2',
      '-movflags', '+faststart',
      '-pix_fmt', 'yuv420p',
      '-fps_mode', 'cfr',
      outputPath,
    ], 'concat edited video');

    const outputInfo = await probeVideoInfo(outputPath);
    const expectedDuration = getKeptDuration(segments);
    const tolerance = Math.max(0.5, segments.length * 0.05);
    if (Math.abs(outputInfo.duration - expectedDuration) > tolerance) {
      throw new Error(
        `Edited video duration drifted after cuts. Expected ${expectedDuration.toFixed(2)}s, got ${outputInfo.duration.toFixed(2)}s.`,
      );
    }
  } finally {
    await Promise.all([
      ...segmentFiles.map((f) => fs.promises.unlink(f).catch(() => undefined)),
      fs.promises.unlink(concatListPath).catch(() => undefined),
    ]);
  }
}

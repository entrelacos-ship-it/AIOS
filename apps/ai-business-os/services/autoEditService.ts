import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';
import type { AutoEditProject, AutoEditWord, AutoEditSegment, AutoEditMetadata } from '../types.js';
import { syncAutoEditProject, updateAutoEditStage, getAutoEditProject } from './autoEditRegistry.js';
import { transcribeVideoWords } from './editaiTranscription.js';

export type SseEmit = (event: string, data: unknown) => void;

// ─── FFmpeg helpers ───────────────────────────────────────────────────────────

function resolveFfmpegPath(): string {
  const candidates = [
    process.env.FFMPEG_PATH?.trim(),
    path.join(process.cwd(), 'node_modules', '@remotion', 'compositor-linux-x64-gnu', 'ffmpeg'),
    path.join(process.cwd(), 'node_modules', '@remotion', 'compositor-linux-arm64-gnu', 'ffmpeg'),
    path.join(process.cwd(), 'node_modules', '@remotion', 'compositor-win32-x64-msvc', 'ffmpeg.exe'),
    path.join(process.cwd(), 'node_modules', '@remotion', 'compositor-darwin-arm64', 'ffmpeg'),
    path.join(process.cwd(), 'node_modules', '@remotion', 'compositor-darwin-x64', 'ffmpeg'),
  ].filter((c): c is string => Boolean(c));

  const found = candidates.find((c) => fs.existsSync(c));
  if (!found) throw new Error('ffmpeg not found. Set FFMPEG_PATH or install @remotion/compositor.');
  return found;
}

function resolveFfprobePath(): string {
  const ffmpegPath = resolveFfmpegPath();
  const p = ffmpegPath.replace(/ffmpeg(\.exe)?$/, 'ffprobe$1');
  if (!fs.existsSync(p)) throw new Error(`ffprobe not found at ${p}`);
  return p;
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
      reject(new Error(`${context} — ffmpeg exit ${code}. ${stderr.slice(-600).trim()}`));
    });
  });
}

async function probeVideoDimensions(videoPath: string): Promise<{ width: number; height: number; duration: number }> {
  const ffprobePath = resolveFfprobePath();
  return new Promise((resolve, reject) => {
    const child = spawn(ffprobePath, [
      '-v', 'error', '-select_streams', 'v:0',
      '-show_entries', 'stream=width,height:format=duration',
      '-of', 'json', videoPath,
    ], { stdio: ['ignore', 'pipe', 'pipe'] });
    let stdout = '';
    child.stdout.on('data', (c) => { stdout += c.toString(); });
    child.on('error', reject);
    child.on('close', (code) => {
      if (code !== 0) { reject(new Error('ffprobe failed')); return; }
      try {
        const j = JSON.parse(stdout) as Record<string, unknown>;
        const s = ((j.streams as Array<Record<string, unknown>>)?.[0]) ?? {};
        const f = (j.format as Record<string, unknown>) ?? {};
        resolve({
          width: Number(s.width ?? 0),
          height: Number(s.height ?? 0),
          duration: parseFloat(String(f.duration ?? '0')) || 0,
        });
      } catch (e) { reject(e); }
    });
  });
}

// ─── Stage 1: normalize ───────────────────────────────────────────────────────

async function normalizeVideo(sourcePath: string, outputPath: string): Promise<void> {
  await fs.promises.mkdir(path.dirname(outputPath), { recursive: true });
  await runFfmpeg([
    '-y', '-i', sourcePath,
    '-c:v', 'libx264', '-crf', '23', '-r', '30', '-g', '30',
    '-c:a', 'aac', '-ar', '44100',
    '-movflags', '+faststart',
    '-pix_fmt', 'yuv420p',
    '-fps_mode', 'cfr',
    outputPath,
  ], 'normalize');
}

// ─── Stage 3: LLM cut planner ─────────────────────────────────────────────────

async function planCuts(words: AutoEditWord[], transcript: string): Promise<AutoEditSegment[]> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY not set.');

  const Anthropic = (await import('@anthropic-ai/sdk')).default;
  const client = new Anthropic({ apiKey });

  const wordSample = words.slice(0, 600);
  const duration = words.length > 0 ? Math.ceil((words[words.length - 1]?.end ?? 0)) : 0;

  const prompt = `You are a professional video editor. Analyze this video transcript and return precise cut decisions.

VIDEO DURATION: ${duration}s
WORD-LEVEL TIMESTAMPS (first 600 words shown):
${JSON.stringify(wordSample, null, 0)}

FULL TRANSCRIPT:
${transcript.slice(0, 4000)}

RULES:
- Keep all substantive content (main points, arguments, stories, examples, calls to action)
- Cut: false starts (speaker restarts same sentence), stutters, excessive filler ("uh", "um", "like" used as filler), technical mistakes
- Keep natural breathing pauses (< 1s) — only cut genuine dead air (> 1.5s)
- Never cut mid-sentence unless it's a clear restart
- Each segment must be at least 0.5s

Return ONLY valid JSON, no markdown:
{"segments":[{"start":0.0,"end":12.5,"keep":true,"reason":"intro"},{"start":12.5,"end":13.2,"keep":false,"reason":"uh filler"},...]}`

  const msg = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 4096,
    messages: [{ role: 'user', content: prompt }],
  });

  const raw = (msg.content[0] as { type: string; text: string }).text.trim();
  const jsonStart = raw.indexOf('{');
  const jsonEnd = raw.lastIndexOf('}');
  const parsed = JSON.parse(raw.slice(jsonStart, jsonEnd + 1)) as { segments: AutoEditSegment[] };
  return parsed.segments;
}

// ─── Stage 4: execute cuts ────────────────────────────────────────────────────

async function executeCuts(
  normalizedPath: string,
  outputPath: string,
  segments: AutoEditSegment[],
  emit: SseEmit,
): Promise<void> {
  const kept = segments.filter((s) => s.keep);

  if (kept.length === 0) {
    throw new Error('Nenhum segmento selecionado para manter. Verifique o plano de cortes.');
  }

  await fs.promises.mkdir(path.dirname(outputPath), { recursive: true });

  if (kept.length === 1 && segments.length === 1) {
    await runFfmpeg([
      '-y', '-i', normalizedPath,
      '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '18',
      '-c:a', 'aac', '-ar', '44100', '-ac', '2',
      '-movflags', '+faststart', '-pix_fmt', 'yuv420p',
      outputPath,
    ], 'copy (no cuts)');
    return;
  }

  const tempDir = path.join(process.cwd(), 'uploads', 'auto-edit', 'temp');
  await fs.promises.mkdir(tempDir, { recursive: true });
  const segFiles: string[] = [];

  for (let i = 0; i < kept.length; i++) {
    const seg = kept[i]!;
    const segPath = path.join(tempDir, `seg_${Date.now()}_${i}.mp4`);
    segFiles.push(segPath);
    emit('log', { text: `Cortando segmento ${i + 1}/${kept.length} (${seg.start.toFixed(1)}s–${seg.end.toFixed(1)}s)` });
    await runFfmpeg([
      '-y', '-ss', String(seg.start), '-t', String(seg.end - seg.start),
      '-i', normalizedPath,
      '-map', '0:v:0', '-map', '0:a?',
      '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '18',
      '-c:a', 'aac', '-ar', '44100', '-ac', '2',
      '-movflags', '+faststart', '-pix_fmt', 'yuv420p',
      '-avoid_negative_ts', 'make_zero',
      segPath,
    ], `segment ${i}`);
  }

  const listPath = path.join(tempDir, `concat_${Date.now()}.txt`);
  await fs.promises.writeFile(
    listPath,
    segFiles.map((f) => `file '${f.replace(/\\/g, '/')}'`).join('\n'),
    'utf8',
  );

  emit('log', { text: 'Concatenando segmentos...' });
  await runFfmpeg([
    '-y', '-f', 'concat', '-safe', '0', '-i', listPath,
    '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '18',
    '-c:a', 'aac', '-ar', '44100', '-ac', '2',
    '-movflags', '+faststart', '-pix_fmt', 'yuv420p',
    outputPath,
  ], 'concat');

  // cleanup temp
  for (const f of [...segFiles, listPath]) {
    fs.unlink(f, () => undefined);
  }
}

// ─── Stage 5: captions (SRT) ──────────────────────────────────────────────────

function formatSrtTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const ms = Math.round((seconds % 1) * 1000);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')},${String(ms).padStart(3, '0')}`;
}

export function generateSrt(words: AutoEditWord[], segments: AutoEditSegment[]): string {
  const kept = segments.filter((s) => s.keep);

  const filteredWords = words.filter((w) =>
    kept.some((seg) => w.start >= seg.start - 0.05 && w.end <= seg.end + 0.05),
  );

  if (filteredWords.length === 0) return '';

  const WORDS_PER_LINE = 5;
  const lines: string[] = [];
  let index = 1;

  for (let i = 0; i < filteredWords.length; i += WORDS_PER_LINE) {
    const group = filteredWords.slice(i, i + WORDS_PER_LINE);
    const start = group[0]!.start;
    const end = group[group.length - 1]!.end;
    const text = group.map((w) => w.word).join(' ');

    lines.push(`${index}`);
    lines.push(`${formatSrtTime(start)} --> ${formatSrtTime(end)}`);
    lines.push(text);
    lines.push('');
    index++;
  }

  return lines.join('\n');
}

// ─── Stage 6: metadata ────────────────────────────────────────────────────────

async function generateMetadata(transcript: string): Promise<AutoEditMetadata> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY not set.');

  const Anthropic = (await import('@anthropic-ai/sdk')).default;
  const client = new Anthropic({ apiKey });

  const msg = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 1024,
    messages: [{
      role: 'user',
      content: `Generate YouTube/Instagram metadata for this video transcript. Return ONLY valid JSON, no markdown.

TRANSCRIPT:
${transcript.slice(0, 3000)}

{"title":"<60 chars, SEO-optimized, compelling>","description":"<150-250 chars, hooks viewer, natural keywords>","hashtags":["tag1","tag2",...],"shortsTitle":"<40 chars, punchy for Shorts/Reels>","shortsDescription":"<80 chars, action-oriented>"}`,
    }],
  });

  const raw = (msg.content[0] as { type: string; text: string }).text.trim();
  const jsonStart = raw.indexOf('{');
  const jsonEnd = raw.lastIndexOf('}');
  return JSON.parse(raw.slice(jsonStart, jsonEnd + 1)) as AutoEditMetadata;
}

// ─── Stage 7: shorts (9:16) ───────────────────────────────────────────────────

async function cropToShorts(inputPath: string, outputPath: string): Promise<void> {
  const { width, height } = await probeVideoDimensions(inputPath);
  await fs.promises.mkdir(path.dirname(outputPath), { recursive: true });

  const targetW = Math.floor(height * (9 / 16));
  const targetH = height;
  const x = Math.floor((width - targetW) / 2);

  const isAlready9x16 = Math.abs(width / height - 9 / 16) < 0.01;

  if (isAlready9x16) {
    await runFfmpeg([
      '-y', '-i', inputPath, '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '22',
      '-c:a', 'aac', '-ar', '44100', '-movflags', '+faststart', '-pix_fmt', 'yuv420p',
      outputPath,
    ], 'shorts copy');
    return;
  }

  await runFfmpeg([
    '-y', '-i', inputPath,
    '-vf', `crop=${targetW}:${targetH}:${x}:0`,
    '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '22',
    '-c:a', 'aac', '-ar', '44100',
    '-movflags', '+faststart', '-pix_fmt', 'yuv420p',
    outputPath,
  ], 'shorts crop');
}

// ─── Main pipeline ────────────────────────────────────────────────────────────

export async function runAutoEditPipeline(
  projectId: string,
  emit: SseEmit,
): Promise<void> {
  const project = await getAutoEditProject(projectId);
  if (!project) throw new Error(`Project ${projectId} not found.`);
  if (project.stage === 'done') {
    emit('done', { projectId, alreadyDone: true });
    return;
  }

  const emitStage = async (stage: AutoEditProject['stage'], patch?: Partial<AutoEditProject>) => {
    emit('stage', { name: stage });
    return updateAutoEditStage(projectId, stage, patch);
  };

  try {
    // Stage 1 — normalize
    emit('log', { text: 'Normalizando vídeo para H.264...' });
    await emitStage('normalizing');
    await normalizeVideo(project.sourcePath, project.normalizedPath);
    emit('log', { text: 'Normalização concluída.' });

    // Stage 2 — transcribe
    emit('log', { text: 'Transcrevendo com Whisper (Groq)...' });
    await emitStage('transcribing');
    const rawWords = await transcribeVideoWords(project.normalizedPath);
    const words: AutoEditWord[] = rawWords.map((w) => ({
      word: w.word,
      start: w.start,
      end: w.end,
    }));
    const transcript = words.map((w) => w.word).join(' ');
    await emitStage('transcribing', { words, transcript });
    emit('transcript', { words, text: transcript });
    emit('log', { text: `Transcrição: ${words.length} palavras.` });

    // Stage 3 — plan cuts
    emit('log', { text: 'Claude analisando transcrição para plano de cortes...' });
    await emitStage('planning');
    let segments: AutoEditSegment[];
    try {
      segments = await planCuts(words, transcript);
    } catch {
      const dur = words[words.length - 1]?.end ?? 0;
      segments = [{ start: 0, end: dur, keep: true, reason: 'sem plano disponível' }];
    }
    const keptCount = segments.filter((s) => s.keep).length;
    const cutCount = segments.filter((s) => !s.keep).length;
    await emitStage('planning', { segments });
    emit('plan', { segments, keptCount, cutCount });
    emit('log', { text: `Plano: ${keptCount} segmentos mantidos, ${cutCount} cortados.` });

    // Stage 4 — execute cuts
    emit('log', { text: 'Executando cortes com FFmpeg...' });
    await emitStage('cutting');
    await executeCuts(project.normalizedPath, project.outputPath, segments, emit);
    emit('log', { text: 'Cortes executados.' });

    // Stage 5 — captions
    emit('log', { text: 'Gerando legendas (SRT)...' });
    await emitStage('captioning');
    const srtContent = generateSrt(words, segments);
    if (srtContent) {
      await fs.promises.mkdir(path.dirname(project.captionsPath), { recursive: true });
      await fs.promises.writeFile(project.captionsPath, srtContent, 'utf8');
    }
    emit('captions', { lineCount: (srtContent.match(/^\d+$/gm) ?? []).length });
    emit('log', { text: 'Legendas geradas.' });

    // Stage 6 — metadata
    emit('log', { text: 'Gerando metadados SEO com Claude...' });
    await emitStage('metadata');
    let metadata: AutoEditMetadata = {
      title: project.title,
      description: '',
      hashtags: [],
    };
    try {
      metadata = await generateMetadata(transcript);
    } catch {
      // non-fatal
    }
    await emitStage('metadata', { metadata });
    emit('metadata', metadata);
    emit('log', { text: 'Metadados gerados.' });

    // Stage 7 — shorts (optional)
    if (project.includeShorts) {
      emit('log', { text: 'Gerando versão Shorts 9:16...' });
      await emitStage('shorts');
      await cropToShorts(project.outputPath, project.shortsPath);
      emit('log', { text: 'Versão Shorts pronta.' });
    }

    await emitStage('done', { metadata });
    emit('done', { projectId });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await emitStage('error', { error: message });
    emit('error', { message });
  }
}

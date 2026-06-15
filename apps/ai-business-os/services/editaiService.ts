import path from 'path';
import { randomUUID } from 'crypto';
import type { EditAIVideoProject, EditAICutReport, EditAIFormatoDestino } from '../types.js';
import { syncEditAIProject, getEditAIProject } from './editaiProjectRegistry.js';
import { transcribeVideoWords } from './editaiTranscription.js';
import { buildCutReport } from './editaiCutPlanner.js';
import {
  reindexWordsAfterCut,
  computeSceneFrames,
  normalizeScenesAgainstWords,
  normalizeSceneFrameOrder,
  validateScenesAgainstWords,
} from './editaiWordIndex.js';
import { normalizeToH264, probeVideoInfo, executeCuts, detectAudioSilenceRanges } from './editaiFfmpeg.js';
import { generatePlanText, generateScenes } from './editaiAIPlanner.js';
import { detectTemplate } from './editaiTemplates.js';
import { buildKeptSegments, getKeptDuration, normalizeApprovedCuts } from './editaiTimeline.js';

const OUTPUTS_DIR = path.join(process.cwd(), 'outputs', 'editai');
const MAX_APPROVED_REMOVAL_RATIO: Record<EditAIFormatoDestino, number> = {
  reels: 0.55,
  youtube: 0.35,
};

// F5: allowed previous statuses for each stage transition
const ALLOWED_PREV: Partial<Record<EditAIVideoProject['status'], EditAIVideoProject['status'][]>> = {
  normalizing: ['uploading'],
  transcribing: ['normalizing'],
  cutting: ['transcribing', 'awaiting_approval'], // awaiting_approval for stage 3b re-run
  awaiting_approval: ['cutting'],
  planning: ['cutting'],
  awaiting_plan: ['planning'],
  analyzing: ['awaiting_plan'],
  ready: ['analyzing'],
  rendering: ['ready', 'done'],
};

function assertValidTransition(project: EditAIVideoProject, nextStatus: EditAIVideoProject['status']): void {
  const allowed = ALLOWED_PREV[nextStatus];
  if (!allowed) return; // no restriction defined
  if (!allowed.includes(project.status)) {
    throw new Error(
      `Invalid status transition: "${project.status}" → "${nextStatus}". Allowed from: ${allowed.join(', ')}.`,
    );
  }
}

export function createEditAIProject(
  uploadedFilePath: string,
  sourceFileName: string,
  formatoDestino: EditAIFormatoDestino = 'reels',
): EditAIVideoProject {
  const id = randomUUID();
  const title = sourceFileName.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' ');

  return {
    id,
    title,
    sourceFileName,
    status: 'uploading',
    formatoDestino,
    editPreset: 'auto',
    originalPath: uploadedFilePath,
    normalizedPath: path.join(OUTPUTS_DIR, `${id}_normalized.mp4`),
    cutPath: path.join(OUTPUTS_DIR, `${id}_cut.mp4`),
    renderPath: path.join(OUTPUTS_DIR, `${id}_output.mp4`),
    fps: 30,
    words: [],
    transcription: '',
    cutReport: [],
    planText: '',
    planApproved: false,
    template: null,
    formato: '',
    paleta: null,
    scenes: [],
    renderProgress: 0,
    error: '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

async function updateStatus(
  project: EditAIVideoProject,
  status: EditAIVideoProject['status'],
): Promise<EditAIVideoProject> {
  assertValidTransition(project, status);
  project.status = status;
  project.error = '';
  return syncEditAIProject(project);
}

async function markError(project: EditAIVideoProject, error: unknown): Promise<EditAIVideoProject> {
  project.status = 'error';
  project.error = error instanceof Error ? error.message : String(error);
  return syncEditAIProject(project);
}

/** Stage 1: Normalize to H.264 30fps. Auto-runs after upload. */
export async function runStage1Normalize(projectId: string): Promise<void> {
  let project = await getEditAIProject(projectId);
  if (!project) throw new Error(`Project ${projectId} not found.`);

  try {
    project = await updateStatus(project, 'normalizing');
    await normalizeToH264(project.originalPath, project.normalizedPath);
    const info = await probeVideoInfo(project.normalizedPath);
    project.fps = Math.round(info.fps) || 30;
    await syncEditAIProject(project);
  } catch (err) {
    await markError(project, err);
    throw err;
  }
}

/** Stage 2: Transcribe with Whisper — word-level timestamps. Auto-runs after Stage 1. */
export async function runStage2Transcribe(projectId: string): Promise<void> {
  let project = await getEditAIProject(projectId);
  if (!project) throw new Error(`Project ${projectId} not found.`);

  try {
    project = await updateStatus(project, 'transcribing');
    const words = await transcribeVideoWords(project.normalizedPath);
    project.words = words;
    project.transcription = words.map((w) => w.word).join(' ');
    await syncEditAIProject(project);
  } catch (err) {
    await markError(project, err);
    throw err;
  }
}

/** Stage 3a: Build CutReport (no FFmpeg yet). Auto-runs after Stage 2. */
export async function runStage3BuildCutReport(projectId: string): Promise<void> {
  let project = await getEditAIProject(projectId);
  if (!project) throw new Error(`Project ${projectId} not found.`);

  try {
    project = await updateStatus(project, 'cutting');
    const info = await probeVideoInfo(project.normalizedPath);
    const audioSilences = await detectAudioSilenceRanges(project.normalizedPath, info.duration);
    const cutReport = buildCutReport(project.words, project.formatoDestino, {
      audioSilences,
      totalDuration: info.duration,
    });
    project.cutReport = cutReport;
    project.status = 'awaiting_approval';
    await syncEditAIProject(project);
  } catch (err) {
    await markError(project, err);
    throw err;
  }
}

/** Stage 3b: Execute approved cuts + reindex words. Called after user approves CutReport. */
export async function runStage3ExecuteCuts(
  projectId: string,
  approvedReport: EditAICutReport[],
): Promise<void> {
  let project = await getEditAIProject(projectId);
  if (!project) throw new Error(`Project ${projectId} not found.`);

  try {
    project.cutReport = approvedReport;
    project.status = 'cutting';
    await syncEditAIProject(project);

    const sourceInfo = await probeVideoInfo(project.normalizedPath);
    const approvedCuts = normalizeApprovedCuts(approvedReport, sourceInfo.duration);
    const keptDuration = getKeptDuration(buildKeptSegments(sourceInfo.duration, approvedCuts));
    const removedRatio = sourceInfo.duration > 0 ? 1 - (keptDuration / sourceInfo.duration) : 0;
    const maxRemovalRatio = MAX_APPROVED_REMOVAL_RATIO[project.formatoDestino];

    if (removedRatio > maxRemovalRatio) {
      throw new Error(
        `Approved cuts would remove ${(removedRatio * 100).toFixed(0)}% of the video. Review cuts and keep more content before applying.`,
      );
    }

    await executeCuts(project.normalizedPath, project.cutPath, approvedReport);

    // Reindex — words get new timestamps on edited timeline; indices are preserved
    project.words = reindexWordsAfterCut(project.words, approvedReport);
    project.transcription = project.words.map((w) => w.word).join(' ');

    await syncEditAIProject(project);
  } catch (err) {
    await markError(project, err);
    throw err;
  }
}

/** Stage 4A: Generate plan text. Auto-runs after Stage 3b. */
export async function runStage4APlan(projectId: string): Promise<void> {
  let project = await getEditAIProject(projectId);
  if (!project) throw new Error(`Project ${projectId} not found.`);

  try {
    project = await updateStatus(project, 'planning');
    const planText = await generatePlanText(
      project.words,
      project.transcription,
      project.formatoDestino,
      project.editPreset,
    );
    project.planText = planText;
    project.planApproved = false;
    project.status = 'awaiting_plan';
    await syncEditAIProject(project);
  } catch (err) {
    await markError(project, err);
    throw err;
  }
}

/** Stage 4B: Generate scenes JSON. Called after user approves plan. */
export async function runStage4BScenes(projectId: string): Promise<void> {
  let project = await getEditAIProject(projectId);
  if (!project) throw new Error(`Project ${projectId} not found.`);

  if (!project.planApproved) {
    throw new Error('planApproved must be true before generating scenes.');
  }

  try {
    project = await updateStatus(project, 'analyzing');

    const { formato, paleta, scenes: rawScenes } = await generateScenes(
      project.words,
      project.transcription,
      project.planText,
      project.planApproved,
      project.template,
      project.formatoDestino,
      project.editPreset,
    );

    const normalizedRawScenes = normalizeScenesAgainstWords(rawScenes, project.words);
    const { valid, invalidSceneIds } = validateScenesAgainstWords(normalizedRawScenes, project.words);
    if (!valid) {
      throw new Error(`OpenAI returned scenes with invalid word indices: scene IDs ${invalidSceneIds.join(', ')}`);
    }

    const scenes = normalizeSceneFrameOrder(
      computeSceneFrames(normalizedRawScenes, project.words, project.fps),
      project.fps,
    );

    if (!project.template) {
      const lastWord = project.words[project.words.length - 1];
      const duration = lastWord ? lastWord.end : 0;
      project.template = detectTemplate(formato, duration);
    }

    project.formato = formato;
    project.paleta = paleta;
    project.scenes = scenes;
    project.status = 'ready';
    await syncEditAIProject(project);
  } catch (err) {
    await markError(project, err);
    throw err;
  }
}

/** Stage 5: Render via Remotion. Called when user clicks "Renderizar". */
export async function runStage5Render(
  projectId: string,
  onProgress?: (progress: number) => void,
): Promise<void> {
  let project = await getEditAIProject(projectId);
  if (!project) throw new Error(`Project ${projectId} not found.`);

  if (project.status !== 'ready' && project.status !== 'done') {
    throw new Error(`Cannot render project in status "${project.status}". Must be "ready" or "done".`);
  }

  try {
    project = await updateStatus(project, 'rendering');

    // F4: throttle progress writes — max 1 write per 2 seconds or 5% delta
    let lastWriteTime = 0;
    let lastWrittenProgress = -1;

    const { renderEditAIVideo } = await import('./editaiRenderService.js');
    await renderEditAIVideo(project, (progress: number) => {
      const pct = Math.round(progress * 100);
      const now = Date.now();
      const shouldWrite =
        pct !== lastWrittenProgress &&
        (pct - lastWrittenProgress >= 5 || now - lastWriteTime >= 2000 || pct === 100);

      if (shouldWrite) {
        lastWriteTime = now;
        lastWrittenProgress = pct;
        project.renderProgress = pct;
        syncEditAIProject(project).catch(() => undefined);
      }

      onProgress?.(progress);
    });

    project.status = 'done';
    project.renderProgress = 100;
    await syncEditAIProject(project);
  } catch (err) {
    await markError(project, err);
    throw err;
  }
}

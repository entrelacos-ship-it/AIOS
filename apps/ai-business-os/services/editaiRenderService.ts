import fs from 'fs';
import path from 'path';
import { bundle } from '@remotion/bundler';
import { renderMedia, selectComposition } from '@remotion/renderer';
import type { EditAIVideoProject } from '../types.js';
import { probeVideoInfo } from './editaiFfmpeg.js';

const RENDER_TIMEOUT_MS = 300000; // 5 min

function getLocalServerOrigin(): string {
  const port = Number(process.env.PORT) || 3010;
  return `http://127.0.0.1:${port}`;
}

function toMediaUrl(filePath: string): string {
  const fileName = path.basename(filePath);
  const mtimeMs = fs.existsSync(filePath) ? fs.statSync(filePath).mtimeMs : Date.now();
  const cacheKey = encodeURIComponent(`${fileName}:${mtimeMs}`);
  return `${getLocalServerOrigin()}/__editai_media/${encodeURIComponent(fileName)}?v=${cacheKey}`;
}

export async function renderEditAIVideo(
  project: EditAIVideoProject,
  onProgress?: (progress: number) => void,
): Promise<string> {
  const entryPoint = path.resolve(process.cwd(), 'remotion', 'EditAI', 'index.tsx');
  const outputPath = project.renderPath;

  await fs.promises.mkdir(path.dirname(outputPath), { recursive: true });

  // Use cut video if it exists, otherwise normalized
  const videoSourcePath = fs.existsSync(project.cutPath)
    ? project.cutPath
    : project.normalizedPath;

  const cutVideoUrl = toMediaUrl(videoSourcePath);
  const videoDurationSeconds = fs.existsSync(videoSourcePath)
    ? (await probeVideoInfo(videoSourcePath)).duration
    : 0;

  const inputProps = {
    cutVideoUrl,
    videoDurationSeconds,
    words: project.words,
    scenes: project.scenes,
    fps: project.fps,
    paleta: project.paleta,
    editPreset: project.editPreset,
  };

  const bundleLocation = await bundle({
    entryPoint,
    webpackOverride: (config) => config,
  });

  const composition = await selectComposition({
    serveUrl: bundleLocation,
    id: 'EditAI',
    timeoutInMilliseconds: RENDER_TIMEOUT_MS,
    inputProps,
  });

  await renderMedia({
    composition,
    serveUrl: bundleLocation,
    codec: 'h264',
    outputLocation: outputPath,
    timeoutInMilliseconds: RENDER_TIMEOUT_MS,
    inputProps,
    onProgress: ({ progress }) => {
      onProgress?.(progress);
    },
  });

  return outputPath;
}

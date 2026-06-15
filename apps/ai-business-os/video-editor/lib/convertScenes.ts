import type { EloCutScene, SRTSegment } from './types';

export function parseSRTTime(timeStr: string): number {
  if (!timeStr) return 0;
  const normalized = timeStr.replace(',', '.');
  const [hms, ms] = normalized.split('.');
  const parts = (hms || '').split(':').map(Number);
  const [h, m, s] = parts.length === 3 ? parts : [0, parts[0] ?? 0, parts[1] ?? 0];
  return h * 3600 + m * 60 + s + Number('0.' + (ms ?? '0'));
}

function clampIndex(index: number, subtitles: SRTSegment[]) {
  if (subtitles.length === 0) return 0;
  return Math.min(Math.max(index, 0), subtitles.length - 1);
}

export function convertScenesFromLegendaIndex(
  scenes: EloCutScene[],
  subtitles: SRTSegment[],
  fps: number
): EloCutScene[] {
  if (subtitles.length === 0) {
    return scenes.map((scene, index) => ({
      ...scene,
      startLeg: Math.max(scene.startLeg, 0),
      endLeg: Math.max(scene.endLeg, scene.startLeg),
      startFrame: index * fps * 3,
      endFrame: (index + 1) * fps * 3,
      durationInFrames: fps * 3,
    }));
  }

  return scenes.map((scene) => {
    const safeStartLeg = clampIndex(scene.startLeg, subtitles);
    const safeEndLeg = clampIndex(Math.max(scene.endLeg, safeStartLeg), subtitles);
    const startSub = subtitles[safeStartLeg];
    const endSub = subtitles[safeEndLeg] ?? subtitles[subtitles.length - 1];

    if (!startSub || !endSub) {
      return {
        ...scene,
        startLeg: safeStartLeg,
        endLeg: safeEndLeg,
        durationInFrames: fps * 3,
      };
    }

    const startFrame = Math.round(startSub.startSeconds * fps);
    const endFrame = Math.round(endSub.endSeconds * fps);

    return {
      ...scene,
      startLeg: safeStartLeg,
      endLeg: safeEndLeg,
      startFrame,
      endFrame,
      durationInFrames: Math.max(endFrame - startFrame, fps),
    };
  });
}

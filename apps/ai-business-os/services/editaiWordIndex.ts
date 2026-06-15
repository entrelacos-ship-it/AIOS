import { type EditAIWord, type EditAICutReport, type EditAISceneRaw } from '../types.js';
import { buildKeptSegments, mapSourceTimeToEditedTime } from './editaiTimeline.js';

const FPS_DEFAULT = 30;

/**
 * Rebuild the word array after approved cuts.
 *
 * word.index is immutable — never changes.
 * word.start / word.end are shifted to the new (edited) timeline.
 * Words that fall inside a cut region are removed.
 */
export function reindexWordsAfterCut(
  words: EditAIWord[],
  approvedCuts: EditAICutReport[],
): EditAIWord[] {
  const cuts = approvedCuts
    .filter((c) => c.aprovado)
    .sort((a, b) => a.inicio - b.inicio);

  return applyTimestampShifts(words, cuts);
}

function applyTimestampShifts(
  words: EditAIWord[],
  sortedCuts: EditAICutReport[],
): EditAIWord[] {
  const sourceDuration = Math.max(
    ...words.map((word) => Number.isFinite(word.end) ? word.end : 0),
    ...sortedCuts.map((cut) => Number.isFinite(cut.fim) ? cut.fim : 0),
    0,
  );
  const segments = buildKeptSegments(sourceDuration, sortedCuts);
  const result: EditAIWord[] = [];

  for (const word of words) {
    const segment = segments.find((s) => word.start >= s.start && word.start <= s.end);
    if (!segment) continue;

    const mappedStart = mapSourceTimeToEditedTime(word.start, segments);
    const mappedEnd = mapSourceTimeToEditedTime(Math.min(word.end, segment.end), segments);
    if (mappedStart === null || mappedEnd === null) continue;

    const end = Math.max(mappedEnd, mappedStart + 0.01);
    result.push({
      ...word,
      start: mappedStart,
      end,
    });
  }

  return result;
}

/** Convert a word index to its frame number on the edited timeline. */
export function wordIndexToFrame(
  words: EditAIWord[],
  index: number,
  edge: 'start' | 'end',
  fps: number = FPS_DEFAULT,
): number {
  const word = words.find((w) => w.index === index);
  if (!word) {
    throw new Error(`Word index ${index} not found in post-cut word array.`);
  }
  return Math.round((edge === 'start' ? word.start : word.end) * fps);
}

/** Compute frame_inicio/frame_fim for all scenes from their word indices. */
export function computeSceneFrames(
  scenes: EditAISceneRaw[],
  words: EditAIWord[],
  fps: number = FPS_DEFAULT,
): Array<EditAISceneRaw & { frame_inicio: number; frame_fim: number }> {
  return scenes.map((scene) => ({
    ...scene,
    frame_inicio: wordIndexToFrame(words, scene.startLeg, 'start', fps),
    frame_fim: wordIndexToFrame(words, scene.endLeg, 'end', fps),
  }));
}

export function normalizeSceneFrameOrder<T extends EditAISceneRaw & { frame_inicio: number; frame_fim: number }>(
  scenes: T[],
  fps: number = FPS_DEFAULT,
): T[] {
  const minimumFrames = Math.max(1, Math.round(fps * 0.25));
  const sorted = [...scenes].sort((a, b) => a.frame_inicio - b.frame_inicio || a.id - b.id);
  let cursor = 0;

  return sorted.map((scene, index) => {
    const next = sorted[index + 1];
    const frameInicio = Math.max(scene.frame_inicio, cursor);
    const naturalEnd = Math.max(scene.frame_fim, frameInicio + minimumFrames);
    const frameFim = next && next.frame_inicio > frameInicio
      ? Math.max(frameInicio + minimumFrames, Math.min(naturalEnd, next.frame_inicio))
      : naturalEnd;
    cursor = frameFim;

    return {
      ...scene,
      frame_inicio: frameInicio,
      frame_fim: frameFim,
    };
  });
}

function resolveWordIndex(words: EditAIWord[], requestedIndex: number): number | null {
  if (words.length === 0 || !Number.isFinite(requestedIndex)) return null;

  const roundedIndex = Math.round(requestedIndex);
  const exact = words.find((w) => w.index === roundedIndex);
  if (exact) return exact.index;

  if (roundedIndex >= 0 && roundedIndex < words.length) {
    return words[roundedIndex].index;
  }

  return words.reduce((closest, word) => {
    const closestDistance = Math.abs(closest.index - roundedIndex);
    const wordDistance = Math.abs(word.index - roundedIndex);
    return wordDistance < closestDistance ? word : closest;
  }, words[0]).index;
}

/** Repair AI scene word references against the post-cut word array. */
export function normalizeScenesAgainstWords(
  scenes: EditAISceneRaw[],
  words: EditAIWord[],
): EditAISceneRaw[] {
  if (words.length === 0) return scenes;

  return scenes.map((scene) => {
    let startLeg = resolveWordIndex(words, scene.startLeg) ?? words[0].index;
    let endLeg = resolveWordIndex(words, scene.endLeg) ?? words[words.length - 1].index;

    const startPosition = words.findIndex((word) => word.index === startLeg);
    const endPosition = words.findIndex((word) => word.index === endLeg);

    if (startPosition > endPosition) {
      [startLeg, endLeg] = [endLeg, startLeg];
    }

    return {
      ...scene,
      startLeg,
      endLeg,
    };
  });
}

/** Validate that all scene word references exist in the post-cut word array. */
export function validateScenesAgainstWords(
  scenes: EditAISceneRaw[],
  words: EditAIWord[],
): { valid: boolean; invalidSceneIds: number[] } {
  const indices = new Set(words.map((w) => w.index));
  // F3: use Set to prevent duplicate scene IDs when both conditions fail
  const invalidSet = new Set<number>();

  for (const scene of scenes) {
    if (!indices.has(scene.startLeg) || !indices.has(scene.endLeg)) {
      invalidSet.add(scene.id);
    }
    if (scene.startLeg > scene.endLeg) {
      invalidSet.add(scene.id);
    }
  }

  const invalidSceneIds = [...invalidSet];
  return { valid: invalidSceneIds.length === 0, invalidSceneIds };
}

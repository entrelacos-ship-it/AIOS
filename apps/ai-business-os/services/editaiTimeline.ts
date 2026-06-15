import { type EditAICutReport } from '../types.js';

export interface EditAITimelineSegment {
  start: number;
  end: number;
  outputStart: number;
  outputEnd: number;
}

const CUT_EPSILON_SECONDS = 0.001;
const MIN_SEGMENT_SECONDS = 0.05;

export function normalizeApprovedCuts(
  cutReport: EditAICutReport[],
  durationSeconds = Number.POSITIVE_INFINITY,
): EditAICutReport[] {
  const sorted = cutReport
    .filter((cut) => (cut.status ?? (cut.aprovado ? 'approved' : 'pending')) === 'approved')
    .map((cut) => {
      const inicio = Math.max(0, Math.min(cut.inicio, durationSeconds));
      const fim = Math.max(0, Math.min(cut.fim, durationSeconds));
      return {
        ...cut,
        inicio: Math.min(inicio, fim),
        fim: Math.max(inicio, fim),
      };
    })
    .filter((cut) => cut.fim - cut.inicio > CUT_EPSILON_SECONDS)
    .sort((a, b) => a.inicio - b.inicio);

  const merged: EditAICutReport[] = [];

  for (const cut of sorted) {
    const last = merged[merged.length - 1];
    if (last && cut.inicio <= last.fim + CUT_EPSILON_SECONDS) {
      last.fim = Math.max(last.fim, cut.fim);
      last.duracao = last.fim - last.inicio;
      last.aprovado = true;
    } else {
      merged.push({ ...cut, duracao: cut.fim - cut.inicio, aprovado: true });
    }
  }

  return merged;
}

export function buildKeptSegments(
  durationSeconds: number,
  cutReport: EditAICutReport[],
): EditAITimelineSegment[] {
  const cuts = normalizeApprovedCuts(cutReport, durationSeconds);
  const segments: EditAITimelineSegment[] = [];
  let cursor = 0;
  let outputCursor = 0;

  for (const cut of cuts) {
    if (cut.inicio - cursor >= MIN_SEGMENT_SECONDS) {
      const duration = cut.inicio - cursor;
      segments.push({
        start: cursor,
        end: cut.inicio,
        outputStart: outputCursor,
        outputEnd: outputCursor + duration,
      });
      outputCursor += duration;
    }
    cursor = Math.max(cursor, cut.fim);
  }

  if (durationSeconds - cursor >= MIN_SEGMENT_SECONDS) {
    const duration = durationSeconds - cursor;
    segments.push({
      start: cursor,
      end: durationSeconds,
      outputStart: outputCursor,
      outputEnd: outputCursor + duration,
    });
  }

  return segments;
}

export function getKeptDuration(segments: EditAITimelineSegment[]): number {
  return segments.reduce((total, segment) => total + (segment.end - segment.start), 0);
}

export function mapSourceTimeToEditedTime(
  sourceTime: number,
  segments: EditAITimelineSegment[],
): number | null {
  const segment = segments.find((s) => sourceTime >= s.start && sourceTime <= s.end);
  if (!segment) return null;
  return segment.outputStart + (sourceTime - segment.start);
}

import { type EditAIWord, type EditAICutReport, type EditAIFormatoDestino } from '../types.js';

export interface EditAISilenceInput {
  start: number;
  end: number;
}

export interface EditAICutPlannerOptions {
  audioSilences?: EditAISilenceInput[];
  totalDuration?: number;
}

const THRESHOLDS = {
  reels: { silence: 0.45, redoMin: 0.3, redoMax: 0.8, maxAutoStutter: 1.2, maxAutoRedo: 2.4 },
  youtube: { silence: 0.75, redoMin: 0.4, redoMax: 1.2, maxAutoStutter: 1.6, maxAutoRedo: 3.2 },
} as const;

const REDO_ORPHAN_MIN = 3;
const MIN_CUT_SECONDS = 0.12;
const STOP_WORDS = new Set([
  'a', 'o', 'as', 'os', 'e', 'é', 'de', 'do', 'da', 'dos', 'das', 'um', 'uma',
  'que', 'com', 'para', 'pra', 'por', 'no', 'na', 'se', 'mas',
]);

function normalizeWord(word: string): string {
  return word
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '');
}

function buildPreview(words: EditAIWord[], centerIndex: number, radius = 5): string {
  const start = Math.max(0, centerIndex - radius);
  const end = Math.min(words.length - 1, centerIndex + radius);
  return words.slice(start, end + 1).map((w) => w.word).join(' ');
}

function buildPreviewAtTime(words: EditAIWord[], time: number): string {
  const containingIndex = words.findIndex((word) => word.start <= time && word.end >= time);
  if (containingIndex >= 0) return buildPreview(words, containingIndex);

  const nextIndex = words.findIndex((word) => word.start > time);
  if (nextIndex >= 0) return buildPreview(words, nextIndex);

  return words.slice(-8).map((word) => word.word).join(' ');
}

function normalizedAt(words: EditAIWord[], index: number): string {
  return normalizeWord(words[index]?.word ?? '');
}

function isUsefulRepeatedPhrase(tokens: string[]): boolean {
  return tokens.some((token) => token.length > 2 && !STOP_WORDS.has(token));
}

function phraseAt(words: EditAIWord[], start: number, length: number): string[] {
  return Array.from({ length }, (_, offset) => normalizedAt(words, start + offset));
}

function samePhrase(a: string[], b: string[]): boolean {
  return a.length === b.length && a.every((token, index) => token && token === b[index]);
}

function detectSilences(words: EditAIWord[], silenceThreshold: number): EditAICutReport[] {
  const cuts: EditAICutReport[] = [];

  for (let i = 0; i < words.length - 1; i++) {
    const gap = words[i + 1].start - words[i].end;
    if (gap > silenceThreshold) {
      cuts.push({
        id: `silencio-${Math.round(words[i].end * 1000)}-${Math.round(words[i + 1].start * 1000)}`,
        tipo: 'silencio',
        inicio: words[i].end,
        fim: words[i + 1].start,
        duracao: gap,
        preview: buildPreview(words, i),
        aprovado: true,
        status: 'approved',
        confidence: Math.min(0.98, 0.72 + Math.min(gap, 3) / 12),
        reason: `Silêncio de ${gap.toFixed(2)}s acima do limite automático.`,
        source: 'ai',
        riskLevel: gap > 3 ? 'medium' : 'low',
      });
    }
  }

  return cuts;
}

function detectAudioSilences(
  words: EditAIWord[],
  audioSilences: EditAISilenceInput[],
  silenceThreshold: number,
): EditAICutReport[] {
  return audioSilences
    .map((range) => {
      const start = Number(range.start);
      const end = Number(range.end);
      const duration = end - start;
      if (!Number.isFinite(start) || !Number.isFinite(end) || duration < silenceThreshold) return null;
      return createCut(
        'silencio',
        start,
        end,
        buildPreviewAtTime(words, start),
        true,
        Math.min(0.99, 0.82 + Math.min(duration, 3) / 15),
        `Silêncio real de áudio de ${duration.toFixed(2)}s detectado por FFmpeg.`,
      );
    })
    .filter((cut): cut is EditAICutReport => Boolean(cut));
}

function detectTailSilence(
  words: EditAIWord[],
  totalDuration: number | undefined,
  silenceThreshold: number,
): EditAICutReport[] {
  const lastWord = words[words.length - 1];
  if (!lastWord || !Number.isFinite(totalDuration)) return [];
  const start = lastWord.end;
  const end = totalDuration!;
  const duration = end - start;
  if (duration < silenceThreshold) return [];
  const cut = createCut(
    'silencio',
    start,
    end,
    buildPreviewAtTime(words, start),
    true,
    Math.min(0.96, 0.78 + Math.min(duration, 3) / 15),
    `Silêncio final de ${duration.toFixed(2)}s após a última palavra.`,
  );
  return cut ? [cut] : [];
}

function createCut(
  tipo: EditAICutReport['tipo'],
  inicio: number,
  fim: number,
  preview: string,
  aprovado: boolean,
  confidence: number,
  reason: string,
): EditAICutReport | null {
  const duracao = fim - inicio;
  if (!Number.isFinite(duracao) || duracao < MIN_CUT_SECONDS) return null;
  const riskLevel: EditAICutReport['riskLevel'] =
    duracao > 2.5 ? 'high' : duracao > 1.2 || confidence < 0.7 ? 'medium' : 'low';
  return {
    id: `${tipo}-${Math.round(inicio * 1000)}-${Math.round(fim * 1000)}`,
    tipo,
    inicio,
    fim,
    duracao,
    preview,
    aprovado,
    status: aprovado ? 'approved' : 'pending',
    confidence,
    reason,
    source: 'ai',
    riskLevel,
  };
}

function detectStutters(words: EditAIWord[], maxAutoStutter: number): EditAICutReport[] {
  const cuts: EditAICutReport[] = [];
  let i = 0;

  while (i < words.length - 1) {
    const curr = normalizeWord(words[i].word);
    const next = normalizeWord(words[i + 1].word);

    if (curr && curr === next) {
      let runEnd = i + 1;
      while (runEnd < words.length - 1 && normalizeWord(words[runEnd + 1].word) === curr) {
        runEnd += 1;
      }

      const cut = createCut(
        'gaguejo',
        words[i].start,
        words[runEnd].start,
        buildPreview(words, i),
        words[runEnd].start - words[i].start <= maxAutoStutter,
        0.88,
        `Repetição detectada da palavra "${words[i].word}".`,
      );
      if (cut) cuts.push(cut);

      i = runEnd + 1;
      continue;
    }

    const phraseA = [normalizeWord(words[i].word), normalizeWord(words[i + 1].word)];
    const phraseB = [normalizeWord(words[i + 2]?.word ?? ''), normalizeWord(words[i + 3]?.word ?? '')];
    const repeatedPhrase = phraseA.every(Boolean) && phraseA[0] === phraseB[0] && phraseA[1] === phraseB[1];

    if (repeatedPhrase) {
      const cut = createCut(
        'gaguejo',
        words[i].start,
        words[i + 2].start,
        buildPreview(words, i),
        words[i + 2].start - words[i].start <= maxAutoStutter,
        0.74,
        `Microfrase repetida: "${words[i].word} ${words[i + 1].word}".`,
      );
      if (cut) cuts.push(cut);
      i += 4;
      continue;
    }

    i += 1;
  }

  return cuts;
}

function detectNearRepeatedPhrases(words: EditAIWord[], maxAutoRedo: number): EditAICutReport[] {
  const cuts: EditAICutReport[] = [];
  const maxLookaheadWords = 8;
  const maxLookaheadSeconds = 3.2;

  for (let i = 0; i < words.length - 2; i++) {
    let matched = false;

    for (const phraseLength of [4, 3, 2]) {
      if (i + phraseLength >= words.length) continue;
      const firstPhrase = phraseAt(words, i, phraseLength);
      if (!isUsefulRepeatedPhrase(firstPhrase)) continue;

      const latestJ = Math.min(words.length - phraseLength, i + phraseLength + maxLookaheadWords);
      for (let j = i + 1; j <= latestJ; j++) {
        if (words[j].start - words[i].start > maxLookaheadSeconds) break;
        const secondPhrase = phraseAt(words, j, phraseLength);
        if (!samePhrase(firstPhrase, secondPhrase)) continue;

        const start = words[i].start;
        const end = words[j].start;
        const duration = end - start;
        const cut = createCut(
          'gaguejo',
          start,
          end,
          buildPreview(words, i),
          duration <= maxAutoRedo,
          phraseLength >= 3 ? 0.84 : 0.72,
          `Trecho repetido detectado: "${words.slice(i, i + phraseLength).map((word) => word.word).join(' ')}".`,
        );
        if (cut) cuts.push(cut);
        i = Math.max(i, j + phraseLength - 1);
        matched = true;
        break;
      }

      if (matched) break;
    }
  }

  return cuts;
}

function detectFalseStartRestarts(words: EditAIWord[], maxAutoRedo: number): EditAICutReport[] {
  const cuts: EditAICutReport[] = [];

  for (let i = 0; i < words.length - 4; i++) {
    const first = normalizedAt(words, i);
    const second = normalizedAt(words, i + 1);
    if (!first || !second || (STOP_WORDS.has(first) && STOP_WORDS.has(second))) continue;

    for (let j = i + 2; j <= Math.min(words.length - 2, i + 7); j++) {
      const restartGap = words[j].start - words[i + 1].end;
      if (restartGap > 2.8) break;
      if (normalizedAt(words, j) !== first || normalizedAt(words, j + 1) !== second) continue;

      const duration = words[j].start - words[i].start;
      const cut = createCut(
        'refazimento',
        words[i].start,
        words[j].start,
        buildPreview(words, i),
        duration <= maxAutoRedo,
        0.76,
        `Possível falsa largada retomada em "${words[j].word} ${words[j + 1].word}".`,
      );
      if (cut) cuts.push(cut);
      i = j + 1;
      break;
    }
  }

  return cuts;
}

function detectRedos(words: EditAIWord[], redoMin: number, redoMax: number, maxAutoRedo: number): EditAICutReport[] {
  const cuts: EditAICutReport[] = [];

  for (let i = REDO_ORPHAN_MIN; i < words.length - 1; i++) {
    const curr = words[i];
    const next = words[i + 1];

    const gap = next.start - curr.end;
    if (gap < redoMin || gap > redoMax) continue;

    // Check if words before the pause form an incomplete phrase
    // Heuristic: look back REDO_ORPHAN_MIN words — if none end a typical phrase,
    // the preceding segment is likely a false start
    const precedingWords = words.slice(Math.max(0, i - REDO_ORPHAN_MIN + 1), i + 1);
    const lastWord = precedingWords[precedingWords.length - 1].word;

    // Simple heuristic: phrases ending with short connective words suggest incomplete thought
    const connectivePattern = /^(e|ou|que|de|do|da|um|uma|no|na|por|para|com|se|mas|então|assim|isso|aqui|ali)$/i;
    if (!connectivePattern.test(lastWord)) continue;

    // Look ahead — if next words repeat context from before the pause, it's a redo
    const afterWords = words.slice(i + 1, i + 4).map((w) => w.word.toLowerCase());
    const beforeWords = precedingWords.slice(0, 3).map((w) => w.word.toLowerCase());
    const overlap = afterWords.filter((w) => beforeWords.includes(w));

    if (overlap.length < 1) continue;

    const redoStart = precedingWords[0].start;
    const cut = createCut(
      'refazimento',
      redoStart,
      next.start,
      buildPreview(words, i),
      next.start - redoStart <= maxAutoRedo,
      0.66,
      'Possível refazimento após pausa curta e retomada de contexto.',
    );
    if (cut) cuts.push(cut);
  }

  return cuts;
}

function mergeOverlappingCuts(cuts: EditAICutReport[]): EditAICutReport[] {
  const sorted = cuts
    .filter((cut) => cut.fim - cut.inicio >= MIN_CUT_SECONDS)
    .sort((a, b) => a.inicio - b.inicio);
  const merged: EditAICutReport[] = [];

  for (const cut of sorted) {
    const last = merged[merged.length - 1];
    if (last && cut.inicio <= last.fim + 0.05) {
      last.fim = Math.max(last.fim, cut.fim);
      last.duracao = last.fim - last.inicio;
      last.aprovado = last.aprovado && cut.aprovado;
      last.status = last.aprovado ? 'approved' : 'pending';
      last.riskLevel = last.riskLevel === 'high' || cut.riskLevel === 'high'
        ? 'high'
        : last.riskLevel === 'medium' || cut.riskLevel === 'medium'
          ? 'medium'
          : 'low';
    } else {
      merged.push({ ...cut });
    }
  }

  return merged;
}

export function buildCutReport(
  words: EditAIWord[],
  formatoDestino: EditAIFormatoDestino = 'reels',
  options: EditAICutPlannerOptions = {},
): EditAICutReport[] {
  if (words.length < 2) return [];

  const t = THRESHOLDS[formatoDestino];
  const silences = detectSilences(words, t.silence);
  const audioSilences = detectAudioSilences(words, options.audioSilences ?? [], t.silence);
  const tailSilences = detectTailSilence(words, options.totalDuration, t.silence);
  const stutters = detectStutters(words, t.maxAutoStutter);
  const repeatedPhrases = detectNearRepeatedPhrases(words, t.maxAutoRedo);
  const falseStarts = detectFalseStartRestarts(words, t.maxAutoRedo);
  const redos = detectRedos(words, t.redoMin, t.redoMax, t.maxAutoRedo);

  return mergeOverlappingCuts([
    ...silences,
    ...audioSilences,
    ...tailSilences,
    ...stutters,
    ...repeatedPhrases,
    ...falseStarts,
    ...redos,
  ]);
}

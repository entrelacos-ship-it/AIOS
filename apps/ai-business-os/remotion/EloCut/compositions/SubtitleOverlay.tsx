import React from 'react';
import { AbsoluteFill, interpolate } from 'remotion';

interface SubtitleOverlayProps {
  text: string;
  progress: number;
  accentColor?: string;
}

const normalizeWordToken = (word: string) =>
  word
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\p{L}\p{N}]/gu, '')
    .toLowerCase();

const dedupeAdjacentWords = (text: string) => {
  const words = text.replace(/\s+/g, ' ').trim().split(' ').filter(Boolean);
  const deduped: string[] = [];

  for (const word of words) {
    const previous = deduped[deduped.length - 1];
    if (previous && normalizeWordToken(previous) === normalizeWordToken(word)) {
      continue;
    }

    deduped.push(word);
  }

  return deduped;
};

export const SubtitleOverlay: React.FC<SubtitleOverlayProps> = ({ text, progress, accentColor = '#FACC15' }) => {
  const words = dedupeAdjacentWords(text);
  if (words.length === 0) {
    return null;
  }

  const clampedProgress = Math.min(1, Math.max(0, progress));
  const visibleWords = Math.max(1, Math.ceil(words.length * clampedProgress));
  const activeWordIndex = Math.max(0, visibleWords - 1);

  return (
    <AbsoluteFill
      style={{
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
        padding: '0 44px 26px',
        pointerEvents: 'none',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 920,
          display: 'flex',
          justifyContent: 'center',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'center',
            gap: '10px 12px',
            padding: '16px 24px',
            borderRadius: 28,
            background: 'linear-gradient(180deg, rgba(4,4,6,0.18), rgba(4,4,6,0.42))',
            backdropFilter: 'blur(12px)',
            boxShadow: '0 24px 64px rgba(0,0,0,0.35)',
          }}
        >
          {words.slice(0, visibleWords).map((word, index) => {
            const isActive = index === activeWordIndex;
            const scale = isActive ? interpolate(clampedProgress, [0, 1], [0.96, 1.06]) : 1;

            return (
              <span
                key={`${word}-${index}`}
                style={{
                  color: isActive ? '#050505' : '#FFFFFF',
                  background: isActive ? accentColor : 'rgba(255,255,255,0.10)',
                  border: isActive ? `1px solid ${accentColor}` : '1px solid rgba(255,255,255,0.12)',
                  borderRadius: 18,
                  padding: '8px 14px',
                  fontSize: 34,
                  fontWeight: 800,
                  lineHeight: 1.02,
                  letterSpacing: '-0.03em',
                  fontFamily: '"Sora", "Inter", "Segoe UI", sans-serif',
                  textTransform: 'uppercase',
                  transform: `scale(${scale})`,
                  boxShadow: isActive ? `0 10px 28px ${accentColor}44` : 'none',
                  textShadow: isActive ? 'none' : '0 4px 18px rgba(0,0,0,0.55)',
                }}
              >
                {word}
              </span>
            );
          })}
        </div>
      </div>
    </AbsoluteFill>
  );
};

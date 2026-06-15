import React from 'react';
import { useCurrentFrame, useVideoConfig } from 'remotion';
import type { EditAIWord } from '../../../types';

interface TikTokCaptionProps {
  words: EditAIWord[];
}

const SENTIMENT_COLORS: Record<string, string> = {
  positive: '#4CAF50',
  negative: '#F44336',
  neutral: '#FFFFFF',
};

const POSITIVE_WORDS = new Set([
  'liberdade', 'crescimento', 'conquista', 'amor', 'força', 'alegria', 'vitória',
  'cura', 'transformação', 'possível', 'pode', 'sim', 'bem', 'bom', 'ótimo',
  'incrível', 'poderoso', 'feliz', 'felicidade', 'sucesso',
]);

const NEGATIVE_WORDS = new Set([
  'dor', 'medo', 'perda', 'limite', 'sofrimento', 'ansiedade', 'angústia',
  'trauma', 'difícil', 'impossível', 'nunca', 'não', 'problema', 'falha', 'erro',
]);

function inferSentiment(word: string): 'positive' | 'negative' | 'neutral' {
  const lower = word.toLowerCase().replace(/[^a-záéíóúàãõâêîôûç]/g, '');
  if (POSITIVE_WORDS.has(lower)) return 'positive';
  if (NEGATIVE_WORDS.has(lower)) return 'negative';
  return 'neutral';
}

const WORDS_PER_GROUP = 3;

export const TikTokCaption: React.FC<TikTokCaptionProps> = ({ words }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const currentTimeSeconds = frame / fps;

  // Find the active word group centered on current playback position
  const activeWordIdx = words.findIndex(
    (w) => currentTimeSeconds >= w.start && currentTimeSeconds <= w.end,
  );

  if (activeWordIdx < 0) return null;

  const groupStart = Math.floor(activeWordIdx / WORDS_PER_GROUP) * WORDS_PER_GROUP;
  const groupWords = words.slice(groupStart, groupStart + WORDS_PER_GROUP);

  return (
    <div
      style={{
        position: 'absolute',
        bottom: '15%',
        left: '5%',
        right: '5%',
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 6,
        zIndex: 100,
      }}
    >
      {groupWords.map((w) => {
        const isActive = currentTimeSeconds >= w.start && currentTimeSeconds <= w.end;
        const sentiment = w.sentiment ?? inferSentiment(w.word);
        const color = SENTIMENT_COLORS[sentiment];

        return (
          <span
            key={w.index}
            style={{
              fontFamily: 'Sora, sans-serif',
              fontWeight: 700,
              fontSize: 52,
              color: isActive ? color : 'rgba(255,255,255,0.75)',
              textShadow: '0 0 8px rgba(0,0,0,0.9), 2px 2px 0 #000, -2px 2px 0 #000, 2px -2px 0 #000, -2px -2px 0 #000',
              letterSpacing: '-0.5px',
              lineHeight: 1.15,
              transform: isActive ? 'scale(1.08)' : 'scale(1)',
              transition: 'transform 0.1s ease',
            }}
          >
            {w.word}
          </span>
        );
      })}
    </div>
  );
};

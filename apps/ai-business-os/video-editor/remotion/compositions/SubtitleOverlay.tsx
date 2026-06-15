import React from 'react';
import { interpolate, spring, useVideoConfig } from 'remotion';
import type { EloCutScene, SRTSegment } from '../../lib/types';

interface Props {
  frame: number;
  subtitles: SRTSegment[];
  scene: EloCutScene;
}

const SENTIMENT_COLORS: Record<EloCutScene['sentiment'], string> = {
  neutral: '#F8F5EF',
  positive: '#86EFAC',
  negative: '#FDA4AF',
  excited: '#FFD166',
  calm: '#93C5FD',
};

function getActiveSubtitle(subtitles: SRTSegment[], seconds: number) {
  return subtitles.find((subtitle) => seconds >= subtitle.startSeconds && seconds <= subtitle.endSeconds)
    ?? subtitles[subtitles.length - 1]
    ?? null;
}

export const SubtitleOverlay: React.FC<Props> = ({ frame, subtitles, scene }) => {
  const { fps } = useVideoConfig();
  const seconds = frame / fps;
  const subtitle = getActiveSubtitle(subtitles, seconds);

  if (!subtitle) return null;

  const words = subtitle.text.split(/\s+/).filter(Boolean);
  const elapsed = Math.max(seconds - subtitle.startSeconds, 0);
  const wordDuration = Math.max((subtitle.endSeconds - subtitle.startSeconds) / Math.max(words.length, 1), 0.12);
  const activeWordIndex = Math.min(words.length - 1, Math.floor(elapsed / wordDuration));
  const panelOpacity = interpolate(frame, [0, 8], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const sentimentColor = SENTIMENT_COLORS[scene.sentiment] ?? '#F8F5EF';

  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', justifyContent: 'flex-end', padding: '0 70px 110px' }}>
      <div
        style={{
          opacity: panelOpacity,
          alignSelf: 'stretch',
          borderRadius: 28,
          padding: '22px 24px',
          background: 'linear-gradient(180deg, rgba(5,5,8,0.24), rgba(5,5,8,0.78))',
          backdropFilter: 'blur(18px)',
          boxShadow: '0 20px 70px rgba(0,0,0,0.35)',
        }}
      >
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, justifyContent: 'center' }}>
          {words.map((word, index) => {
            const isActive = index <= activeWordIndex;
            const bounce = spring({
              fps,
              frame: frame - Math.max(Math.round(index * wordDuration * fps) - 2, 0),
              config: { damping: 18, stiffness: 180, mass: 0.9 },
            });

            return (
              <span
                key={`${subtitle.id}-${index}`}
                style={{
                  fontSize: 44,
                  fontWeight: 800,
                  lineHeight: 1.1,
                  letterSpacing: '-0.03em',
                  color: isActive ? sentimentColor : 'rgba(248,245,239,0.68)',
                  textShadow: isActive ? `0 0 26px ${sentimentColor}44` : '0 2px 12px rgba(0,0,0,0.5)',
                  transform: `scale(${isActive ? 1 + bounce * 0.08 : 1})`,
                }}
              >
                {word}
              </span>
            );
          })}
        </div>
      </div>
    </div>
  );
};

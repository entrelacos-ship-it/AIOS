import React from 'react';
import { interpolate, spring, useVideoConfig } from 'remotion';
import { SubtitleOverlay } from '../SubtitleOverlay';
import type { EloCutScene, SRTSegment } from '../../../lib/types';

interface Props {
  frame: number;
  scene: EloCutScene;
  fps: number;
  subtitles: SRTSegment[];
}

export const HookScene: React.FC<Props> = ({ frame, scene, subtitles }) => {
  const { fps } = useVideoConfig();
  const rise = spring({ fps, frame, config: { damping: 20, stiffness: 110 } });
  const glowOpacity = interpolate(frame, [0, 20], [0.25, 1], { extrapolateRight: 'clamp' });

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        overflow: 'hidden',
        background: `radial-gradient(circle at 50% 0%, ${scene.accentColor}30, transparent 34%), linear-gradient(180deg, ${scene.backgroundColor}, #040406 80%)`,
      }}
    >
      {scene.illustrationUrl ? (
        <img
          src={scene.illustrationUrl}
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            opacity: 0.28,
            transform: `scale(${1 + rise * 0.04})`,
          }}
        />
      ) : null}

      <div
        style={{
          position: 'absolute',
          inset: -180,
          background: `radial-gradient(circle, ${scene.accentColor}22, transparent 58%)`,
          opacity: glowOpacity,
        }}
      />

      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '120px 78px 210px' }}>
        <div>
          <div
            style={{
              display: 'inline-flex',
              padding: '10px 18px',
              borderRadius: 999,
              background: `${scene.accentColor}18`,
              border: `1px solid ${scene.accentColor}35`,
              color: scene.accentColor,
              fontWeight: 700,
              fontSize: 22,
              marginBottom: 24,
            }}
          >
            {scene.visualStyle}
          </div>
          <h1
            style={{
              margin: 0,
              color: '#F8F5EF',
              fontSize: 98,
              lineHeight: 0.94,
              letterSpacing: '-0.06em',
              fontWeight: 800,
              transform: `translateY(${(1 - rise) * 42}px)`,
            }}
          >
            {scene.title}
          </h1>
          <p
            style={{
              marginTop: 22,
              maxWidth: 760,
              color: '#D8D1C7',
              fontSize: 30,
              lineHeight: 1.45,
              transform: `translateY(${(1 - rise) * 30}px)`,
            }}
          >
            {scene.description}
          </p>
        </div>

        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          {scene.keywords.slice(0, 4).map((keyword) => (
            <span
              key={keyword}
              style={{
                padding: '10px 16px',
                borderRadius: 999,
                border: '1px solid rgba(255,255,255,0.14)',
                background: 'rgba(255,255,255,0.04)',
                color: '#F8F5EF',
                fontSize: 22,
                fontWeight: 600,
              }}
            >
              {keyword}
            </span>
          ))}
        </div>
      </div>

      <SubtitleOverlay frame={frame} scene={scene} subtitles={subtitles} />
    </div>
  );
};

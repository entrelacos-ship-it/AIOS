import React from 'react';
import { spring, useVideoConfig } from 'remotion';
import { SubtitleOverlay } from '../SubtitleOverlay';
import type { EloCutScene, SRTSegment } from '../../../lib/types';

interface Props {
  frame: number;
  scene: EloCutScene;
  fps: number;
  subtitles: SRTSegment[];
}

export const OutroScene: React.FC<Props> = ({ frame, scene, subtitles }) => {
  const { fps } = useVideoConfig();
  const reveal = spring({ fps, frame, config: { damping: 15, stiffness: 110 } });

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        overflow: 'hidden',
        background: `radial-gradient(circle at center, ${scene.accentColor}26, transparent 36%), linear-gradient(180deg, #040406, ${scene.backgroundColor})`,
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
            opacity: 0.12,
          }}
        />
      ) : null}

      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', alignItems: 'center', padding: '160px 80px 230px' }}>
        <div style={{ textAlign: 'center', maxWidth: 840 }}>
          <p style={{ color: scene.accentColor, fontSize: 18, letterSpacing: '0.18em', textTransform: 'uppercase', fontWeight: 700 }}>
            Final beat
          </p>
          <h2
            style={{
              margin: '24px 0 0',
              color: '#F8F5EF',
              fontSize: 96,
              lineHeight: 0.94,
              letterSpacing: '-0.07em',
              transform: `translateY(${(1 - reveal) * 28}px)`,
            }}
          >
            {scene.title}
          </h2>
          <p
            style={{
              marginTop: 24,
              color: '#D8D1C7',
              fontSize: 30,
              lineHeight: 1.55,
              transform: `translateY(${(1 - reveal) * 22}px)`,
            }}
          >
            {scene.description}
          </p>
        </div>

        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
          {scene.keywords.slice(0, 3).map((keyword) => (
            <span
              key={keyword}
              style={{
                padding: '12px 18px',
                borderRadius: 999,
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.10)',
                color: '#F8F5EF',
                fontSize: 20,
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

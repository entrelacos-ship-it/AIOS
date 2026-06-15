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

export const TextRevealScene: React.FC<Props> = ({ frame, scene, subtitles }) => {
  const { fps } = useVideoConfig();
  const reveal = spring({ fps, frame, config: { damping: 16, stiffness: 140 } });
  const keywords = scene.keywords.slice(0, 4);

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        overflow: 'hidden',
        background: `linear-gradient(180deg, #040406, ${scene.backgroundColor})`,
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
            opacity: 0.16,
          }}
        />
      ) : null}

      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `linear-gradient(${scene.accentColor}12 1px, transparent 1px), linear-gradient(90deg, ${scene.accentColor}12 1px, transparent 1px)`,
          backgroundSize: '60px 60px',
          opacity: 0.7,
        }}
      />

      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '120px 70px 210px' }}>
        <div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {keywords.map((keyword, index) => (
              <span
                key={keyword}
                style={{
                  transform: `translateY(${(1 - reveal) * (30 + index * 8)}px)`,
                  opacity: reveal,
                  padding: '10px 16px',
                  borderRadius: 999,
                  background: `${scene.accentColor}18`,
                  border: `1px solid ${scene.accentColor}34`,
                  color: scene.accentColor,
                  fontSize: 18,
                  fontWeight: 700,
                }}
              >
                {keyword}
              </span>
            ))}
          </div>

          <h2
            style={{
              margin: '26px 0 0',
              fontSize: 104,
              lineHeight: 0.92,
              letterSpacing: '-0.08em',
              color: '#F8F5EF',
              transform: `translateY(${(1 - reveal) * 42}px)`,
            }}
          >
            {scene.title}
          </h2>

          <p
            style={{
              marginTop: 24,
              maxWidth: 840,
              color: '#D8D1C7',
              fontSize: 30,
              lineHeight: 1.45,
              transform: `translateY(${(1 - reveal) * 30}px)`,
            }}
          >
            {scene.description}
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 16 }}>
          {keywords.map((keyword) => (
            <div
              key={`${scene.id}-${keyword}`}
              style={{
                borderRadius: 24,
                padding: 22,
                border: '1px solid rgba(255,255,255,0.08)',
                background: 'rgba(255,255,255,0.03)',
                boxShadow: '0 16px 40px rgba(0,0,0,0.18)',
              }}
            >
              <p style={{ color: '#8C8B99', fontSize: 15, textTransform: 'uppercase', letterSpacing: '0.14em' }}>Focus</p>
              <p style={{ color: '#F8F5EF', fontSize: 36, fontWeight: 700, marginTop: 10 }}>{keyword}</p>
            </div>
          ))}
        </div>
      </div>

      <SubtitleOverlay frame={frame} scene={scene} subtitles={subtitles} />
    </div>
  );
};

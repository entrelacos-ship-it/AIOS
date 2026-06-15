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

export const TalkingHeadScene: React.FC<Props> = ({ frame, scene, subtitles }) => {
  const { fps } = useVideoConfig();
  const entrance = spring({ fps, frame, config: { damping: 17, stiffness: 120 } });
  const lineWidth = interpolate(frame, [0, 24], [0, 1], { extrapolateRight: 'clamp' });

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: `linear-gradient(160deg, ${scene.backgroundColor}, #050508 72%)`,
        overflow: 'hidden',
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
            opacity: 0.18,
          }}
        />
      ) : null}

      <div
        style={{
          position: 'absolute',
          top: 90,
          left: 72,
          width: 6,
          height: 250 * lineWidth,
          borderRadius: 999,
          background: scene.accentColor,
          boxShadow: `0 0 30px ${scene.accentColor}55`,
        }}
      />

      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '110px 76px 210px' }}>
        <div style={{ maxWidth: 860 }}>
          <p style={{ color: scene.accentColor, fontSize: 20, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase' }}>
            Narrative beat
          </p>
          <h2
            style={{
              margin: '18px 0 0',
              color: '#F8F5EF',
              fontSize: 84,
              lineHeight: 0.98,
              letterSpacing: '-0.05em',
              transform: `translateY(${(1 - entrance) * 36}px)`,
            }}
          >
            {scene.title}
          </h2>
          <p
            style={{
              marginTop: 22,
              color: '#D8D1C7',
              fontSize: 28,
              lineHeight: 1.5,
              maxWidth: 760,
              transform: `translateY(${(1 - entrance) * 28}px)`,
            }}
          >
            {scene.description}
          </p>
        </div>

        <div
          style={{
            alignSelf: 'flex-end',
            width: 360,
            height: 360,
            borderRadius: 40,
            border: '1px solid rgba(255,255,255,0.10)',
            background: `linear-gradient(180deg, ${scene.accentColor}18, rgba(255,255,255,0.02))`,
            boxShadow: `0 24px 80px ${scene.accentColor}22`,
            transform: `translateY(${(1 - entrance) * 48}px)`,
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'space-between',
            padding: 28,
          }}
        >
          <div>
            <p style={{ color: '#8C8B99', fontSize: 14, textTransform: 'uppercase', letterSpacing: '0.14em' }}>Tone</p>
            <p style={{ color: '#F8F5EF', fontSize: 30, fontWeight: 700, marginTop: 10 }}>{scene.sentiment}</p>
          </div>
          <div
            style={{
              width: 110,
              height: 110,
              borderRadius: 999,
              background: `radial-gradient(circle, ${scene.accentColor}, transparent 70%)`,
            }}
          />
        </div>
      </div>

      <SubtitleOverlay frame={frame} scene={scene} subtitles={subtitles} />
    </div>
  );
};

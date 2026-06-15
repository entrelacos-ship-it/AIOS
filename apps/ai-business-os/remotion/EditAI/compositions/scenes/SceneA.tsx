import React from 'react';
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import type { EditAIScene, EditAIPalette } from '../../../../types';

interface Props { scene: EditAIScene; paleta: EditAIPalette; frame: number; fps: number }

export const SceneA: React.FC<Props> = ({ scene, paleta, frame, fps }) => {
  const { durationInFrames } = useVideoConfig();
  const titulo = String((scene.conteudo as Record<string, unknown>).titulo ?? '');

  const enter = spring({ frame, fps, config: { damping: 12, stiffness: 100 } });
  const exitStart = durationInFrames - 8;
  const opacity = frame >= exitStart
    ? interpolate(frame, [exitStart, durationInFrames], [1, 0], { extrapolateRight: 'clamp' })
    : 1;

  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(160deg, ${paleta.primaria}EE, ${paleta.secundaria}CC)`,
        justifyContent: 'center',
        alignItems: 'center',
        opacity,
        padding: 60,
      }}
    >
      <div
        style={{
          transform: `scale(${interpolate(enter, [0, 1], [0.85, 1])})`,
          textAlign: 'center',
        }}
      >
        <p style={{
          fontFamily: 'Sora, sans-serif',
          fontWeight: 800,
          fontSize: 72,
          color: paleta.texto,
          textShadow: `0 4px 20px rgba(0,0,0,0.5)`,
          lineHeight: 1.15,
          margin: 0,
        }}>
          {titulo}
        </p>
        <div style={{
          marginTop: 24,
          height: 4,
          width: interpolate(enter, [0, 1], [0, 160]),
          background: paleta.acento,
          borderRadius: 2,
          margin: '24px auto 0',
        }} />
      </div>
    </AbsoluteFill>
  );
};

import React from 'react';
import { AbsoluteFill, interpolate, spring, useVideoConfig } from 'remotion';
import type { EditAIScene, EditAIPalette } from '../../../../types';

interface Props { scene: EditAIScene; paleta: EditAIPalette; frame: number; fps: number }

export const SceneC: React.FC<Props> = ({ scene, paleta, frame, fps }) => {
  const { durationInFrames } = useVideoConfig();
  const c = scene.conteudo as Record<string, unknown>;
  const titulo = String(c.titulo ?? '');
  const descricao = String(c.descricao ?? '');

  const enter = spring({ frame, fps, config: { damping: 12, stiffness: 100 } });
  const exitStart = durationInFrames - 8;
  const opacity = frame >= exitStart
    ? interpolate(frame, [exitStart, durationInFrames], [1, 0], { extrapolateRight: 'clamp' })
    : 1;

  return (
    <AbsoluteFill
      style={{
        background: `${paleta.secundaria}DD`,
        backdropFilter: 'blur(12px)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 60,
        opacity,
      }}
    >
      <div
        style={{
          transform: `translateX(${interpolate(enter, [0, 1], [-30, 0])}px)`,
          width: '100%',
        }}
      >
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          marginBottom: 24,
        }}>
          <div style={{ width: 6, height: 60, background: paleta.acento, borderRadius: 3, flexShrink: 0 }} />
          <p style={{
            fontFamily: 'Sora, sans-serif',
            fontWeight: 700,
            fontSize: 54,
            color: paleta.texto,
            margin: 0,
            lineHeight: 1.2,
          }}>
            {titulo}
          </p>
        </div>
        {descricao ? (
          <p style={{
            fontFamily: 'Sora, sans-serif',
            fontWeight: 400,
            fontSize: 32,
            color: paleta.texto,
            opacity: 0.8,
            margin: 0,
            lineHeight: 1.5,
            paddingLeft: 22,
          }}>
            {descricao}
          </p>
        ) : null}
      </div>
    </AbsoluteFill>
  );
};

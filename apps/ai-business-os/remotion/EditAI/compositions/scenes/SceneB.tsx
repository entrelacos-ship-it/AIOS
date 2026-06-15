import React from 'react';
import { AbsoluteFill, interpolate, spring, useVideoConfig } from 'remotion';
import type { EditAIScene, EditAIPalette } from '../../../../types';

interface Props { scene: EditAIScene; paleta: EditAIPalette; frame: number; fps: number }

export const SceneB: React.FC<Props> = ({ scene, paleta, frame, fps }) => {
  const { durationInFrames } = useVideoConfig();
  const c = scene.conteudo as Record<string, unknown>;
  const nome = String(c.nome ?? '');
  const subtitulo = String(c.subtitulo ?? '');

  const enter = spring({ frame, fps, config: { damping: 14, stiffness: 120 } });
  const exitStart = durationInFrames - 8;
  const opacity = frame >= exitStart
    ? interpolate(frame, [exitStart, durationInFrames], [1, 0], { extrapolateRight: 'clamp' })
    : 1;

  const slideY = interpolate(enter, [0, 1], [40, 0]);

  return (
    <AbsoluteFill style={{ justifyContent: 'flex-end', alignItems: 'flex-start', padding: 60, opacity }}>
      <div
        style={{
          transform: `translateY(${slideY}px)`,
          background: `${paleta.primaria}CC`,
          backdropFilter: 'blur(12px)',
          borderLeft: `4px solid ${paleta.acento}`,
          borderRadius: 8,
          padding: '20px 28px',
          maxWidth: 700,
        }}
      >
        <p style={{
          fontFamily: 'Sora, sans-serif',
          fontWeight: 700,
          fontSize: 40,
          color: paleta.acento,
          margin: 0,
          lineHeight: 1.2,
        }}>
          {nome}
        </p>
        {subtitulo ? (
          <p style={{
            fontFamily: 'Sora, sans-serif',
            fontWeight: 400,
            fontSize: 28,
            color: paleta.texto,
            margin: '8px 0 0',
            opacity: 0.85,
          }}>
            {subtitulo}
          </p>
        ) : null}
      </div>
    </AbsoluteFill>
  );
};

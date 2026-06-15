import React from 'react';
import { AbsoluteFill, interpolate, spring, useVideoConfig } from 'remotion';
import type { EditAIScene, EditAIPalette } from '../../../../types';

interface Props { scene: EditAIScene; paleta: EditAIPalette; frame: number; fps: number }

export const SceneG: React.FC<Props> = ({ scene, paleta, frame, fps }) => {
  const { durationInFrames } = useVideoConfig();
  const c = scene.conteudo as Record<string, unknown>;
  const numero = String(c.numero ?? '');
  const unidade = String(c.unidade ?? '');
  const descricao = String(c.descricao ?? '');

  const enter = spring({ frame, fps, config: { damping: 10, stiffness: 80 } });
  const exitStart = durationInFrames - 8;
  const opacity = frame >= exitStart
    ? interpolate(frame, [exitStart, durationInFrames], [1, 0], { extrapolateRight: 'clamp' })
    : 1;

  const scale = interpolate(enter, [0, 1], [0.6, 1]);

  return (
    <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center', opacity }}>
      <div style={{ textAlign: 'center', transform: `scale(${scale})` }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'center' }}>
          <span style={{
            fontFamily: 'Sora, sans-serif',
            fontWeight: 800,
            fontSize: 160,
            color: paleta.acento,
            lineHeight: 1,
            textShadow: `0 0 60px ${paleta.acento}66`,
          }}>
            {numero}
          </span>
          {unidade ? (
            <span style={{
              fontFamily: 'Sora, sans-serif',
              fontWeight: 800,
              fontSize: 72,
              color: paleta.acento,
              marginTop: 24,
              marginLeft: 8,
            }}>
              {unidade}
            </span>
          ) : null}
        </div>
        {descricao ? (
          <p style={{
            fontFamily: 'Sora, sans-serif',
            fontWeight: 600,
            fontSize: 36,
            color: paleta.texto,
            margin: '16px 0 0',
            opacity: 0.85,
            maxWidth: 700,
          }}>
            {descricao}
          </p>
        ) : null}
      </div>
    </AbsoluteFill>
  );
};

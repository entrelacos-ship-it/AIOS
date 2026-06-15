import React from 'react';
import { AbsoluteFill, interpolate, spring, useVideoConfig } from 'remotion';
import type { EditAIScene, EditAIPalette } from '../../../../types';

interface Props { scene: EditAIScene; paleta: EditAIPalette; frame: number; fps: number }

export const SceneF: React.FC<Props> = ({ scene, paleta, frame, fps }) => {
  const { durationInFrames } = useVideoConfig();
  const c = scene.conteudo as Record<string, unknown>;
  const remetente = String(c.remetente ?? '');
  const mensagem = String(c.mensagem ?? '');

  const enter = spring({ frame, fps, config: { damping: 14, stiffness: 120 } });
  const exitStart = durationInFrames - 8;
  const opacity = frame >= exitStart
    ? interpolate(frame, [exitStart, durationInFrames], [1, 0], { extrapolateRight: 'clamp' })
    : 1;

  const slideY = interpolate(enter, [0, 1], [30, 0]);

  return (
    <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center', padding: 60, opacity }}>
      <div style={{
        transform: `translateY(${slideY}px)`,
        maxWidth: 800,
        width: '100%',
      }}>
        {remetente ? (
          <p style={{
            fontFamily: 'Sora, sans-serif',
            fontWeight: 600,
            fontSize: 28,
            color: paleta.acento,
            margin: '0 0 12px 16px',
          }}>{remetente}</p>
        ) : null}
        <div style={{
          background: `${paleta.primaria}EE`,
          backdropFilter: 'blur(12px)',
          borderRadius: '0 20px 20px 20px',
          padding: '28px 36px',
          border: `1px solid ${paleta.acento}33`,
        }}>
          <p style={{
            fontFamily: 'Sora, sans-serif',
            fontWeight: 400,
            fontSize: 36,
            color: paleta.texto,
            margin: 0,
            lineHeight: 1.5,
            fontStyle: 'italic',
          }}>
            "{mensagem}"
          </p>
        </div>
        <div style={{
          marginTop: 8,
          marginLeft: 36,
          width: 0,
          height: 0,
          borderLeft: '12px solid transparent',
          borderRight: '0px solid transparent',
          borderTop: `14px solid ${paleta.primaria}EE`,
        }} />
      </div>
    </AbsoluteFill>
  );
};

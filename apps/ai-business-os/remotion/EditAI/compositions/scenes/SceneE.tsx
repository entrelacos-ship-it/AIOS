import React from 'react';
import { AbsoluteFill, interpolate, spring, useVideoConfig } from 'remotion';
import type { EditAIScene, EditAIPalette } from '../../../../types';

interface Props { scene: EditAIScene; paleta: EditAIPalette; frame: number; fps: number }

export const SceneE: React.FC<Props> = ({ scene, paleta, frame, fps }) => {
  const { durationInFrames } = useVideoConfig();
  const c = scene.conteudo as Record<string, unknown>;
  const numero = Number(c.numero ?? 1);
  const titulo = String(c.titulo ?? '');
  const icone = String(c.icone ?? '');

  const enter = spring({ frame, fps, config: { damping: 14, stiffness: 120 } });
  const exitStart = durationInFrames - 8;
  const opacity = frame >= exitStart
    ? interpolate(frame, [exitStart, durationInFrames], [1, 0], { extrapolateRight: 'clamp' })
    : 1;

  const scale = interpolate(enter, [0, 1], [0.8, 1]);

  return (
    <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center', opacity }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 32,
        background: `${paleta.primaria}CC`,
        backdropFilter: 'blur(12px)',
        borderRadius: 20,
        padding: '32px 48px',
        border: `2px solid ${paleta.acento}44`,
        transform: `scale(${scale})`,
        maxWidth: 900,
        width: '80%',
      }}>
        <div style={{
          width: 96,
          height: 96,
          borderRadius: '50%',
          background: paleta.acento,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}>
          <span style={{
            fontFamily: 'Sora, sans-serif',
            fontWeight: 800,
            fontSize: 44,
            color: '#050508',
          }}>
            {numero}
          </span>
        </div>
        <div style={{ flex: 1 }}>
          {icone ? (
            <span style={{ fontSize: 48, display: 'block', marginBottom: 8 }}>{icone}</span>
          ) : null}
          <p style={{
            fontFamily: 'Sora, sans-serif',
            fontWeight: 600,
            fontSize: 38,
            color: paleta.texto,
            margin: 0,
            lineHeight: 1.3,
          }}>{titulo}</p>
        </div>
      </div>
    </AbsoluteFill>
  );
};

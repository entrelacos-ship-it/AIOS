import React from 'react';
import { AbsoluteFill, interpolate, spring, useVideoConfig } from 'remotion';
import type { EditAIScene, EditAIPalette } from '../../../../types';

interface Props { scene: EditAIScene; paleta: EditAIPalette; frame: number; fps: number }

export const SceneI: React.FC<Props> = ({ scene, paleta, frame, fps }) => {
  const { durationInFrames } = useVideoConfig();
  const c = scene.conteudo as Record<string, unknown>;
  const acao = String(c.acao ?? '');
  const complemento = String(c.complemento ?? '');

  const enter = spring({ frame, fps, config: { damping: 10, stiffness: 80 } });
  const exitStart = durationInFrames - 8;
  const opacity = frame >= exitStart
    ? interpolate(frame, [exitStart, durationInFrames], [1, 0], { extrapolateRight: 'clamp' })
    : 1;

  const scale = interpolate(enter, [0, 1], [0.85, 1]);
  const glow = interpolate(enter, [0, 1], [0, 40]);

  return (
    <AbsoluteFill style={{ justifyContent: 'flex-end', alignItems: 'center', paddingBottom: 160, opacity }}>
      <div style={{
        transform: `scale(${scale})`,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 16,
      }}>
        <div style={{
          background: paleta.acento,
          borderRadius: 100,
          padding: '24px 60px',
          boxShadow: `0 0 ${glow}px ${paleta.acento}88`,
        }}>
          <p style={{
            fontFamily: 'Sora, sans-serif',
            fontWeight: 800,
            fontSize: 48,
            color: '#050508',
            margin: 0,
            textTransform: 'uppercase',
            letterSpacing: 1,
          }}>
            {acao}
          </p>
        </div>
        {complemento ? (
          <p style={{
            fontFamily: 'Sora, sans-serif',
            fontWeight: 600,
            fontSize: 28,
            color: paleta.texto,
            margin: 0,
            opacity: 0.8,
            textAlign: 'center',
            maxWidth: 600,
          }}>
            {complemento}
          </p>
        ) : null}
      </div>
    </AbsoluteFill>
  );
};

import React from 'react';
import { AbsoluteFill, interpolate, spring, useVideoConfig } from 'remotion';
import type { EditAIScene, EditAIPalette } from '../../../../types';

interface Props { scene: EditAIScene; paleta: EditAIPalette; frame: number; fps: number }

export const SceneH: React.FC<Props> = ({ scene, paleta, frame, fps }) => {
  const { durationInFrames } = useVideoConfig();
  const c = scene.conteudo as Record<string, unknown>;
  const passos = Array.isArray(c.passos) ? (c.passos as string[]) : [];

  const exitStart = durationInFrames - 8;
  const opacity = frame >= exitStart
    ? interpolate(frame, [exitStart, durationInFrames], [1, 0], { extrapolateRight: 'clamp' })
    : 1;

  return (
    <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center', padding: 60, opacity }}>
      <div style={{ width: '100%', maxWidth: 860 }}>
        {passos.map((passo, i) => {
          const stepDelay = i * 4;
          const stepEnter = spring({ frame: Math.max(0, frame - stepDelay), fps, config: { damping: 14, stiffness: 120 } });
          const slideX = interpolate(stepEnter, [0, 1], [-30, 0]);
          const stepOpacity = stepEnter;

          return (
            <div
              key={i}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 24,
                marginBottom: i < passos.length - 1 ? 24 : 0,
                transform: `translateX(${slideX}px)`,
                opacity: stepOpacity,
              }}
            >
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                flexShrink: 0,
              }}>
                <div style={{
                  width: 52,
                  height: 52,
                  borderRadius: '50%',
                  background: paleta.acento,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <span style={{
                    fontFamily: 'Sora, sans-serif',
                    fontWeight: 800,
                    fontSize: 24,
                    color: '#050508',
                  }}>{i + 1}</span>
                </div>
                {i < passos.length - 1 ? (
                  <div style={{ width: 2, height: 24, background: `${paleta.acento}55`, marginTop: 4 }} />
                ) : null}
              </div>
              <div style={{
                flex: 1,
                background: `${paleta.primaria}BB`,
                backdropFilter: 'blur(8px)',
                borderRadius: 12,
                padding: '18px 24px',
              }}>
                <p style={{
                  fontFamily: 'Sora, sans-serif',
                  fontWeight: 600,
                  fontSize: 34,
                  color: paleta.texto,
                  margin: 0,
                  lineHeight: 1.3,
                }}>{passo}</p>
              </div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

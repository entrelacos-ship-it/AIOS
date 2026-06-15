import React from 'react';
import { AbsoluteFill, interpolate, spring, useVideoConfig } from 'remotion';
import type { EditAIScene, EditAIPalette } from '../../../../types';

interface Props { scene: EditAIScene; paleta: EditAIPalette; frame: number; fps: number }

const StickFigure: React.FC<{ color: string; pose?: 'standing' | 'thinking' }> = ({ color, pose = 'standing' }) => (
  <svg width="120" height="200" viewBox="0 0 120 200" fill="none">
    {/* Head */}
    <circle cx="60" cy="30" r="22" stroke={color} strokeWidth="5" />
    {/* Body */}
    <line x1="60" y1="52" x2="60" y2="130" stroke={color} strokeWidth="5" strokeLinecap="round" />
    {/* Arms */}
    {pose === 'thinking' ? (
      <>
        <line x1="60" y1="80" x2="20" y2="110" stroke={color} strokeWidth="5" strokeLinecap="round" />
        <line x1="60" y1="80" x2="90" y2="60" stroke={color} strokeWidth="5" strokeLinecap="round" />
        <circle cx="90" cy="55" r="4" fill={color} />
      </>
    ) : (
      <>
        <line x1="60" y1="80" x2="15" y2="70" stroke={color} strokeWidth="5" strokeLinecap="round" />
        <line x1="60" y1="80" x2="105" y2="70" stroke={color} strokeWidth="5" strokeLinecap="round" />
      </>
    )}
    {/* Legs */}
    <line x1="60" y1="130" x2="30" y2="185" stroke={color} strokeWidth="5" strokeLinecap="round" />
    <line x1="60" y1="130" x2="90" y2="185" stroke={color} strokeWidth="5" strokeLinecap="round" />
  </svg>
);

export const SceneBoneco: React.FC<Props> = ({ scene, paleta, frame, fps }) => {
  const { durationInFrames } = useVideoConfig();
  const c = scene.conteudo as Record<string, unknown>;
  const situacao = String(c.situacao ?? '');
  const legenda = String(c.legenda ?? '');

  const enter = spring({ frame, fps, config: { damping: 14, stiffness: 100 } });
  const exitStart = durationInFrames - 8;
  const opacity = frame >= exitStart
    ? interpolate(frame, [exitStart, durationInFrames], [1, 0], { extrapolateRight: 'clamp' })
    : 1;

  const scale = interpolate(enter, [0, 1], [0.8, 1]);

  return (
    <AbsoluteFill
      style={{
        background: `${paleta.primaria}CC`,
        justifyContent: 'center',
        alignItems: 'center',
        opacity,
        padding: 60,
        flexDirection: 'column',
        gap: 32,
      }}
    >
      <div style={{ transform: `scale(${scale})`, display: 'flex', gap: 60, alignItems: 'flex-end' }}>
        <StickFigure color={paleta.texto} pose="standing" />
        <StickFigure color={paleta.acento} pose="thinking" />
      </div>

      {situacao ? (
        <div style={{
          background: `${paleta.secundaria}CC`,
          borderRadius: 16,
          padding: '20px 32px',
          maxWidth: 800,
          textAlign: 'center',
          border: `1px solid ${paleta.acento}44`,
          transform: `translateY(${interpolate(enter, [0, 1], [20, 0])}px)`,
        }}>
          <p style={{
            fontFamily: 'Sora, sans-serif',
            fontWeight: 400,
            fontSize: 30,
            color: paleta.texto,
            margin: 0,
            lineHeight: 1.5,
            opacity: 0.85,
          }}>{situacao}</p>
        </div>
      ) : null}

      {legenda ? (
        <p style={{
          fontFamily: 'Sora, sans-serif',
          fontWeight: 700,
          fontSize: 36,
          color: paleta.acento,
          margin: 0,
          textAlign: 'center',
        }}>{legenda}</p>
      ) : null}
    </AbsoluteFill>
  );
};

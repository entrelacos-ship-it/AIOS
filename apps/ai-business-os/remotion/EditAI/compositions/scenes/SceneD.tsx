import React from 'react';
import { AbsoluteFill, interpolate, spring, useVideoConfig } from 'remotion';
import type { EditAIScene, EditAIPalette } from '../../../../types';

interface Props { scene: EditAIScene; paleta: EditAIPalette; frame: number; fps: number }

export const SceneD: React.FC<Props> = ({ scene, paleta, frame, fps }) => {
  const { durationInFrames } = useVideoConfig();
  const c = scene.conteudo as Record<string, unknown>;
  const ladoEsq = String(c.lado_esq ?? '');
  const ladoDir = String(c.lado_dir ?? '');
  const labelEsq = String(c.label_esq ?? '');
  const labelDir = String(c.label_dir ?? '');

  const enter = spring({ frame, fps, config: { damping: 12, stiffness: 100 } });
  const exitStart = durationInFrames - 8;
  const opacity = frame >= exitStart
    ? interpolate(frame, [exitStart, durationInFrames], [1, 0], { extrapolateRight: 'clamp' })
    : 1;

  const SidePanel: React.FC<{ text: string; label: string; slideFrom: number; accent: boolean }> = ({
    text, label, slideFrom, accent,
  }) => (
    <div style={{
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 40,
      background: accent ? `${paleta.acento}22` : `${paleta.primaria}AA`,
      transform: `translateX(${interpolate(enter, [0, 1], [slideFrom, 0])}px)`,
      gap: 16,
    }}>
      {label ? (
        <span style={{
          fontFamily: 'Sora, sans-serif',
          fontWeight: 600,
          fontSize: 22,
          color: accent ? paleta.acento : paleta.texto,
          opacity: 0.7,
          textTransform: 'uppercase',
          letterSpacing: 2,
        }}>{label}</span>
      ) : null}
      <p style={{
        fontFamily: 'Sora, sans-serif',
        fontWeight: 700,
        fontSize: 44,
        color: paleta.texto,
        textAlign: 'center',
        margin: 0,
        lineHeight: 1.25,
      }}>{text}</p>
    </div>
  );

  return (
    <AbsoluteFill style={{ flexDirection: 'row', opacity }}>
      <SidePanel text={ladoEsq} label={labelEsq} slideFrom={-40} accent={false} />
      <div style={{ width: 3, background: paleta.acento, opacity: 0.5 }} />
      <SidePanel text={ladoDir} label={labelDir} slideFrom={40} accent={true} />
    </AbsoluteFill>
  );
};

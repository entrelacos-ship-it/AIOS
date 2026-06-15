import React from 'react';
import { AbsoluteFill, interpolate, OffthreadVideo, Sequence, useCurrentFrame, useVideoConfig } from 'remotion';
import type { EditAIWord, EditAIScene, EditAIPalette, EditAIEditPreset } from '../../../types';
import { TikTokCaption } from './TikTokCaption';
import { SceneA } from './scenes/SceneA';
import { SceneB } from './scenes/SceneB';
import { SceneC } from './scenes/SceneC';
import { SceneD } from './scenes/SceneD';
import { SceneE } from './scenes/SceneE';
import { SceneF } from './scenes/SceneF';
import { SceneG } from './scenes/SceneG';
import { SceneH } from './scenes/SceneH';
import { SceneI } from './scenes/SceneI';
import { SceneBoneco } from './scenes/SceneBoneco';

export interface EditAIVideoProps {
  cutVideoUrl: string;
  videoDurationSeconds: number;
  words: EditAIWord[];
  scenes: EditAIScene[];
  fps: number;
  paleta: EditAIPalette | null;
  editPreset: EditAIEditPreset;
}

interface SceneDispatchProps {
  scene: EditAIScene;
  paleta: EditAIPalette;
}

const DEFAULT_PALETTE: EditAIPalette = {
  primaria: '#1A1A2E',
  secundaria: '#0D0D14',
  acento: '#FFB800',
  texto: '#F0F0F0',
};

const PRESET_RENDER: Record<EditAIEditPreset, { base: number; active: number; vignette: number; sweep: number; contrast: number; saturate: number }> = {
  auto: { base: 1.035, active: 1.08, vignette: 0.75, sweep: 0.42, contrast: 1.04, saturate: 1.05 },
  clean: { base: 1.015, active: 1.035, vignette: 0.42, sweep: 0.18, contrast: 1.02, saturate: 1.0 },
  kinetic: { base: 1.05, active: 1.13, vignette: 0.82, sweep: 0.62, contrast: 1.08, saturate: 1.12 },
  cinematic: { base: 1.025, active: 1.055, vignette: 0.95, sweep: 0.28, contrast: 1.07, saturate: 0.96 },
};

const SceneDispatcher: React.FC<SceneDispatchProps> = ({ scene, paleta }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const props = { scene, paleta, frame, fps };

  switch (scene.tipo) {
    case 'A': return <SceneA {...props} />;
    case 'B': return <SceneB {...props} />;
    case 'C+': return <SceneC {...props} />;
    case 'D': return <SceneD {...props} />;
    case 'E': return <SceneE {...props} />;
    case 'F': return <SceneF {...props} />;
    case 'G': return <SceneG {...props} />;
    case 'H': return <SceneH {...props} />;
    case 'I': return <SceneI {...props} />;
    case 'BONECO': return <SceneBoneco {...props} />;
    default: return null;
  }
};

const EditorialOverlay: React.FC<{ paleta: EditAIPalette; frame: number; scenes: EditAIScene[]; editPreset: EditAIEditPreset }> = ({ paleta, frame, scenes, editPreset }) => {
  const preset = PRESET_RENDER[editPreset] ?? PRESET_RENDER.auto;
  const activeScene = scenes.find((scene) => frame >= scene.frame_inicio && frame <= scene.frame_fim);
  const sceneStart = activeScene?.frame_inicio ?? 0;
  const localFrame = Math.max(0, frame - sceneStart);
  const transitionOpacity = activeScene && localFrame < 12
    ? interpolate(localFrame, [0, 5, 12], [preset.sweep, preset.sweep * 0.43, 0], { extrapolateRight: 'clamp' })
    : 0;
  const sweepX = interpolate(localFrame, [0, 12], [-18, 118], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  return (
    <AbsoluteFill style={{ pointerEvents: 'none', zIndex: 35 }}>
      <AbsoluteFill
        style={{
          background: `radial-gradient(circle at 50% 35%, transparent 42%, rgba(0,0,0,0.34) 100%)`,
          opacity: preset.vignette,
        }}
      />
      {activeScene ? (
        <>
          <AbsoluteFill
            style={{
              background: `linear-gradient(120deg, transparent 0%, ${paleta.acento}55 45%, transparent 72%)`,
              opacity: transitionOpacity,
              transform: `translateX(${sweepX - 100}%)`,
            }}
          />
          <div
            style={{
              position: 'absolute',
              left: 36,
              top: 130,
              width: 6,
              height: interpolate(localFrame, [0, 14], [0, 130], { extrapolateRight: 'clamp' }),
              borderRadius: 999,
              background: paleta.acento,
              boxShadow: `0 0 28px ${paleta.acento}AA`,
              opacity: interpolate(localFrame, [0, 8, 26], [0, 1, 0.38], { extrapolateRight: 'clamp' }),
            }}
          />
        </>
      ) : null}
    </AbsoluteFill>
  );
};

export const EditAIVideo: React.FC<EditAIVideoProps> = ({
  cutVideoUrl,
  words,
  scenes,
  fps,
  paleta,
  editPreset = 'auto',
}) => {
  const resolvedPalette = paleta ?? DEFAULT_PALETTE;
  const preset = PRESET_RENDER[editPreset] ?? PRESET_RENDER.auto;
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const activeScene = scenes.find((scene) => frame >= scene.frame_inicio && frame <= scene.frame_fim);
  const localSceneFrame = activeScene ? Math.max(0, frame - activeScene.frame_inicio) : frame;
  const baseScale = activeScene
    ? interpolate(localSceneFrame, [0, 18, Math.max(36, activeScene.frame_fim - activeScene.frame_inicio)], [preset.base, preset.active, preset.base], {
        extrapolateRight: 'clamp',
      })
    : preset.base;

  return (
    <AbsoluteFill style={{ background: '#050508' }}>
      {/* Layer 1 — Base video */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800&display=swap');
      `}</style>

      {cutVideoUrl ? (
        <OffthreadVideo
          src={cutVideoUrl}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            transform: `scale(${baseScale})`,
            filter: `contrast(${preset.contrast}) saturate(${preset.saturate})`,
          }}
        />
      ) : (
        <AbsoluteFill style={{ background: '#050508' }} />
      )}

      <EditorialOverlay paleta={resolvedPalette} frame={frame} scenes={scenes} editPreset={editPreset} />

      {/* Layer 2 — Visual scenes */}
      {scenes.map((scene) => {
        const durationInFrames_ = Math.max(1, scene.frame_fim - scene.frame_inicio);
        return (
          <Sequence
            key={scene.id}
            from={scene.frame_inicio}
            durationInFrames={Math.min(durationInFrames_, durationInFrames - scene.frame_inicio)}
          >
            <SceneDispatcher scene={scene} paleta={resolvedPalette} />
          </Sequence>
        );
      })}

      {/* Layer 3 — TikTok captions */}
      <TikTokCaption words={words} />
    </AbsoluteFill>
  );
};

import React from 'react';
import { useCurrentFrame } from 'remotion';
import type { EloCutProject } from '../../lib/types';
import { HookScene } from './scenes/HookScene';
import { TalkingHeadScene } from './scenes/TalkingHeadScene';
import { TextRevealScene } from './scenes/TextRevealScene';
import { OutroScene } from './scenes/OutroScene';

interface Props {
  project: EloCutProject;
}

const SCENE_MAP = {
  hook: HookScene,
  talking_head: TalkingHeadScene,
  text_reveal: TextRevealScene,
  outro: OutroScene,
} as const;

export const EloCutVideo: React.FC<Props> = ({ project }) => {
  const frame = useCurrentFrame();
  const scenes = project.analysis?.scenes ?? [];
  const timeline = scenes.reduce<Array<{ scene: typeof scenes[number]; startFrame: number; duration: number }>>(
    (entries, scene) => {
      const previousEntry = entries[entries.length - 1];
      const startFrame = previousEntry ? previousEntry.startFrame + previousEntry.duration : 0;
      const duration = scene.durationInFrames ?? 90;

      return [...entries, { scene, startFrame, duration }];
    },
    [],
  );

  const activeEntry =
    timeline.find(({ startFrame, duration }) => frame >= startFrame && frame < startFrame + duration)
      ?? timeline[timeline.length - 1]
      ?? null;

  const activeScene = activeEntry?.scene ?? null;
  const activeDuration = activeEntry?.duration ?? 90;
  const localFrame = activeEntry ? Math.max(frame - activeEntry.startFrame, 0) : 0;
  const ActiveSceneComponent = activeScene ? (SCENE_MAP[activeScene.type] ?? TalkingHeadScene) : null;
  const activeSubtitles = activeScene
    ? project.subtitles.slice(activeScene.startLeg, activeScene.endLeg + 1)
    : [];

  return (
    <div style={{ position: 'absolute', inset: 0, background: '#050508', fontFamily: 'Sora, sans-serif' }}>
      {ActiveSceneComponent && activeScene ? (
        <ActiveSceneComponent
          key={`${activeScene.id}-${activeDuration}`}
          frame={localFrame}
          scene={activeScene}
          fps={project.fps}
          subtitles={activeSubtitles}
        />
      ) : null}
    </div>
  );
};

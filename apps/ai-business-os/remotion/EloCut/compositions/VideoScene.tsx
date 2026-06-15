import React from 'react';
import { AbsoluteFill, OffthreadVideo, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import type { EloCutEditSegment, EloCutScene, TranscriptionSegment } from '../../../services/eloCutService';
import { TitleScene } from './TitleScene';
import { SubtitleOverlay } from './SubtitleOverlay';

export interface EloCutVideoProps {
  editedVideoPath: string;
  editSegments: EloCutEditSegment[];
  transcription: TranscriptionSegment[];
  scenes: EloCutScene[];
  fps: number;
}

function getActiveScene(scenes: EloCutScene[], currentTime: number): EloCutScene | null {
  return scenes.find((scene) => currentTime >= scene.startTime && currentTime < scene.endTime)
    ?? scenes[scenes.length - 1]
    ?? null;
}

function getSceneProgress(scene: EloCutScene | null, currentTime: number): number {
  if (!scene) {
    return 0;
  }

  const duration = Math.max(0.2, scene.endTime - scene.startTime);
  return Math.min(1, Math.max(0, (currentTime - scene.startTime) / duration));
}

function getActiveSubtitleSegment(transcription: TranscriptionSegment[], currentTime: number): TranscriptionSegment | null {
  const activeSegments = transcription.filter((segment) => currentTime >= segment.start && currentTime <= segment.end);

  if (activeSegments.length === 0) {
    return null;
  }

  return activeSegments.sort((a, b) => b.start - a.start)[0] ?? null;
}

function getBoundaryProgress(editSegments: EloCutEditSegment[], currentTime: number, fps: number): number {
  const transitionWindowSeconds = 12 / fps;
  let strongestProgress = 0;

  for (const segment of editSegments.slice(1)) {
    const distance = Math.abs(currentTime - segment.timelineStartTime);
    if (distance > transitionWindowSeconds) {
      continue;
    }

    const progress = 1 - (distance / transitionWindowSeconds);
    if (progress > strongestProgress) {
      strongestProgress = progress;
    }
  }

  return strongestProgress;
}

export const EloCutVideo: React.FC<EloCutVideoProps> = ({ editedVideoPath, editSegments, transcription, scenes }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const currentTime = frame / fps;
  const activeScene = getActiveScene(scenes, currentTime);
  const activeSubtitle = getActiveSubtitleSegment(transcription, currentTime);
  const boundaryProgress = getBoundaryProgress(editSegments, currentTime, fps);
  const sceneProgress = getSceneProgress(activeScene, currentTime);
  const showVideo = typeof editedVideoPath === 'string' && editedVideoPath.trim().length > 0;

  const transitionSpring = spring({
    frame,
    fps,
    config: { damping: 14, stiffness: 160 },
    durationInFrames: 12,
    durationRestThreshold: 0.001,
  });

  const videoScale = 1 + interpolate(boundaryProgress, [0, 1], [0, 0.045]) * transitionSpring;
  const videoTranslateY = interpolate(boundaryProgress, [0, 1], [0, -18]);
  const transitionOpacity = interpolate(boundaryProgress, [0, 1], [0, 0.24]);
  const transitionGlow = interpolate(boundaryProgress, [0, 1], [0, 0.5]);

  const subtitleProgress = activeSubtitle
    ? Math.min(1, Math.max(0, (currentTime - activeSubtitle.start) / Math.max(0.12, activeSubtitle.end - activeSubtitle.start)))
    : 0;

  return (
    <AbsoluteFill style={{ backgroundColor: '#050505' }}>
      {showVideo ? (
        <OffthreadVideo
          src={editedVideoPath}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            transform: `scale(${videoScale}) translateY(${videoTranslateY}px)`,
            filter: `saturate(${1 + boundaryProgress * 0.18}) contrast(${1 + boundaryProgress * 0.08})`,
          }}
        />
      ) : null}

      <AbsoluteFill
        style={{
          opacity: transitionGlow,
          background: `radial-gradient(circle at 50% 45%, ${(activeScene?.accentColor || '#FACC15')}55 0%, rgba(0,0,0,0) 58%)`,
          mixBlendMode: 'screen',
        }}
      />

      {activeScene ? <TitleScene scene={activeScene} sceneProgress={sceneProgress} /> : null}
      <SubtitleOverlay
        text={activeSubtitle?.text || activeScene?.transcript || ''}
        progress={subtitleProgress}
        accentColor={activeScene?.accentColor || '#FACC15'}
      />

      <AbsoluteFill
        style={{
          background: 'linear-gradient(180deg, rgba(0,0,0,0.34) 0%, rgba(0,0,0,0.08) 33%, rgba(0,0,0,0.56) 100%)',
        }}
      />
      <AbsoluteFill
        style={{
          background: `linear-gradient(135deg, ${(activeScene?.accentColor || '#8B5CF6')}22 0%, rgba(0,0,0,0) 28%, rgba(0,0,0,0.18) 100%)`,
        }}
      />
      <AbsoluteFill
        style={{
          backgroundColor: `rgba(0,0,0,${transitionOpacity})`,
        }}
      />
    </AbsoluteFill>
  );
};

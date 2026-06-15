import React from 'react';
import { Composition } from 'remotion';
import { EloCutVideo, EloCutVideoProps } from './compositions/VideoScene';
import type { EloCutEditSegment, EloCutScene, TranscriptionSegment } from '../../services/eloCutService';

export const EloCutRoot: React.FC = () => {
  const defaultScenes: EloCutScene[] = [
    {
      id: 'scene_1',
      startTime: 0,
      endTime: 5,
      transcript: 'Welcome to EloCut',
      title: 'EloCut Preview',
      description: 'AI-powered video editing',
      visualStyle: 'kinetic',
      backgroundColor: '#0f0f1a',
      accentColor: '#7c3aed',
      keywords: ['AI', 'video', 'editing'],
    },
  ];
  const defaultTranscription: TranscriptionSegment[] = [
    {
      start: 0,
      end: 4,
      text: 'Welcome to EloCut',
    },
  ];
  const defaultSegments: EloCutEditSegment[] = [
    {
      id: 'segment_1',
      sourceStartTime: 0,
      sourceEndTime: 4,
      timelineStartTime: 0,
      timelineEndTime: 4,
      transition: 'cut',
      transcript: 'Welcome to EloCut',
    },
  ];

  return (
    <Composition
      id="EloCut"
      component={EloCutVideo}
      durationInFrames={120}
      fps={30}
      width={1080}
      height={1920}
      defaultProps={{
        editedVideoPath: '',
        editSegments: defaultSegments,
        transcription: defaultTranscription,
        scenes: defaultScenes,
        fps: 30,
      }}
      calculateMetadata={({ props }: { props: EloCutVideoProps }) => {
        const totalSeconds = props.editSegments.length > 0
          ? props.editSegments[props.editSegments.length - 1].timelineEndTime
          : props.scenes.reduce(
              (sum: number, scene: EloCutScene) => sum + (scene.endTime - scene.startTime),
              0,
            );
        return {
          durationInFrames: Math.max(Math.round(totalSeconds * props.fps), 30),
          fps: props.fps,
        };
      }}
    />
  );
};

import React from 'react';
import { Composition } from 'remotion';
import { EditAIVideo, type EditAIVideoProps } from './compositions/EditAIVideo';
import type { EditAIWord, EditAIScene, EditAIPalette } from '../../types';

const DEFAULT_PALETTE: EditAIPalette = {
  primaria: '#1A1A2E',
  secundaria: '#0D0D14',
  acento: '#FFB800',
  texto: '#F0F0F0',
};

const DEFAULT_WORDS: EditAIWord[] = [
  { index: 0, word: 'EditAI', start: 0, end: 2, sentiment: 'positive' },
  { index: 1, word: 'Preview', start: 2.2, end: 3.5, sentiment: 'neutral' },
];

const DEFAULT_SCENES: EditAIScene[] = [
  {
    id: 1,
    tipo: 'A',
    startLeg: 0,
    endLeg: 1,
    frame_inicio: 0,
    frame_fim: 90,
    conteudo: { titulo: 'EditAI Preview' },
  },
];

export const EditAIRoot: React.FC = () => {
  return (
    <Composition
      id="EditAI"
      component={EditAIVideo}
      durationInFrames={120}
      fps={30}
      width={1080}
      height={1920}
      defaultProps={{
        cutVideoUrl: '',
        videoDurationSeconds: 0,
        words: DEFAULT_WORDS,
        scenes: DEFAULT_SCENES,
        fps: 30,
        paleta: DEFAULT_PALETTE,
        editPreset: 'auto',
      } satisfies EditAIVideoProps}
      calculateMetadata={({ props }: { props: EditAIVideoProps }) => {
        const lastWord = props.words[props.words.length - 1];
        const wordDurationSeconds = lastWord ? lastWord.end + 0.5 : 5;
        const durationSeconds = Math.max(wordDurationSeconds, props.videoDurationSeconds || 0);
        return {
          durationInFrames: Math.max(Math.round(durationSeconds * props.fps), 30),
          fps: props.fps,
        };
      }}
    />
  );
};

import React from 'react';
import { Composition } from 'remotion';
import { EloCutVideo } from './compositions/EloCutVideo';
import type { EloCutProject } from '../lib/types';

interface EloCutCompositionProps {
  project: EloCutProject;
}

const defaultProject: EloCutProject = {
  id: 'preview',
  originalFilename: 'preview.mp4',
  uploadPath: '',
  subtitles: [],
  fps: 30,
  width: 1080,
  height: 1920,
  createdAt: new Date().toISOString(),
};

export const EloCutRoot: React.FC = () => (
  <Composition<EloCutCompositionProps>
    id="EloCut"
    component={EloCutVideo}
    durationInFrames={300}
    fps={30}
    width={1080}
    height={1920}
    defaultProps={{ project: defaultProject }}
  />
);

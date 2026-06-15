export type PipelineStep =
  | 'idle' | 'uploading' | 'normalizing' | 'transcribing'
  | 'analyzing' | 'editing' | 'rendering' | 'done' | 'error';

export interface SRTSegment {
  id: string;
  startTime: string;
  endTime: string;
  text: string;
  startSeconds: number;
  endSeconds: number;
}

export type SceneType = 'hook' | 'talking_head' | 'text_reveal' | 'outro';
export type VisualStyle = 'kinetic' | 'minimal' | 'dramatic' | 'energetic';
export type SentimentColor = 'neutral' | 'positive' | 'negative' | 'excited' | 'calm';

export interface EloCutScene {
  id: string;
  type: SceneType;
  startLeg: number;
  endLeg: number;
  title: string;
  description: string;
  visualStyle: VisualStyle;
  backgroundColor: string;
  accentColor: string;
  keywords: string[];
  illustrationPrompt?: string;
  illustrationUrl?: string;
  sentiment: SentimentColor;
  startFrame?: number;
  endFrame?: number;
  durationInFrames?: number;
}

export interface NarrativeFormat {
  type: 'educational' | 'storytelling' | 'listicle' | 'hook_cta' | 'interview';
  hook: string;
  pacing: 'fast' | 'medium' | 'slow';
  tone: 'professional' | 'casual' | 'energetic' | 'emotional';
}

export interface ColorPalette {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  text: string;
}

export interface EloCutAnalysis {
  narrativeFormat: NarrativeFormat;
  palette: ColorPalette;
  scenes: EloCutScene[];
  title: string;
  summary: string;
  totalDuration: number;
}

export interface EloCutProject {
  id: string;
  originalFilename: string;
  uploadPath: string;
  normalizedPath?: string;
  userPrompt?: string;
  subtitles: SRTSegment[];
  analysis?: EloCutAnalysis;
  outputPath?: string;
  fps: number;
  width: number;
  height: number;
  createdAt: string;
}

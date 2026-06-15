'use client';

import { convertScenesFromLegendaIndex } from '@/lib/convertScenes';
import type { EloCutProject } from '@/lib/types';

interface Props {
  project: EloCutProject;
  selectedId: string | null;
  onSelect: (id: string) => void;
}

function formatSeconds(seconds: number) {
  const mins = Math.floor(seconds / 60);
  const secs = Math.round(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export default function Timeline({ project, selectedId, onSelect }: Props) {
  const scenes = project.analysis
    ? convertScenesFromLegendaIndex(project.analysis.scenes, project.subtitles, project.fps)
    : [];
  const total = scenes.reduce((sum, scene) => sum + (scene.durationInFrames ?? project.fps * 3), 0) || 1;

  return (
    <div style={{
      borderRadius: 24,
      padding: 18,
      background: 'linear-gradient(180deg, rgba(18,18,24,0.96), rgba(10,10,14,0.96))',
      border: '1px solid rgba(255,255,255,0.07)',
      boxShadow: '0 16px 48px rgba(0,0,0,0.24)',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <p style={{ fontSize: 11, fontWeight: 700, color: '#8C8B99', letterSpacing: '0.08em' }}>TIMELINE</p>
        <p style={{ fontSize: 12, color: '#8C8B99' }}>{scenes.length} blocos</p>
      </div>
      <div style={{ display: 'flex', gap: 6, height: 58, borderRadius: 12, overflow: 'hidden' }}>
        {scenes.map((scene) => {
          const width = ((scene.durationInFrames ?? project.fps * 3) / total) * 100;
          const sel = scene.id === selectedId;
          return (
            <div
              key={scene.id}
              onClick={() => onSelect(scene.id)}
              title={scene.title}
              style={{
                width: `${width}%`,
                minWidth: 18,
                cursor: 'pointer',
                borderRadius: 12,
                padding: 8,
                background: sel
                  ? `linear-gradient(135deg, ${scene.backgroundColor}, ${scene.accentColor})`
                  : `linear-gradient(180deg, ${scene.backgroundColor}DD, ${scene.backgroundColor}99)`,
                border: sel ? `2px solid ${scene.accentColor}` : '1px solid rgba(255,255,255,0.08)',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'flex-end',
                justifyContent: 'space-between',
              }}
            >
              <span style={{ fontSize: 10, color: sel ? '#0B0905' : '#F7F2EA', fontWeight: 700 }}>
                {scene.title.slice(0, 16)}
              </span>
              <span style={{ fontSize: 10, color: sel ? '#0B0905' : '#D5D1C9' }}>
                {Math.round((scene.durationInFrames ?? project.fps * 3) / project.fps)}s
              </span>
            </div>
          );
        })}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
        <span style={{ fontSize: 11, color: '#8C8B99' }}>0s</span>
        <span style={{ fontSize: 11, color: '#8C8B99' }}>{formatSeconds(project.analysis?.totalDuration ?? 0)}</span>
      </div>
    </div>
  );
}

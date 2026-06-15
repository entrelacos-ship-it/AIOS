'use client';

import { useState } from 'react';
import { Player } from '@remotion/player';
import { convertScenesFromLegendaIndex } from '@/lib/convertScenes';
import type { EloCutProject } from '@/lib/types';
import { EloCutVideo } from '@/remotion/compositions/EloCutVideo';

interface Props {
  project: EloCutProject;
  selectedId: string | null;
}

function getFilename(filePath?: string) {
  return filePath?.split(/[\\/]/).pop();
}

export default function VideoPreview({ project, selectedId }: Props) {
  const [tab, setTab] = useState<'ai' | 'source'>('ai');
  const sourceFilename = getFilename(project.normalizedPath || project.uploadPath);
  const outputFilename = getFilename(project.outputPath);
  const scenes = project.analysis
    ? convertScenesFromLegendaIndex(project.analysis.scenes, project.subtitles, project.fps)
    : [];

  const durationInFrames = scenes.reduce(
    (sum, scene) => sum + (scene.durationInFrames ?? project.fps * 3),
    0
  ) || project.fps * 4;

  const selectedSceneIndex = scenes.findIndex((scene) => scene.id === selectedId);
  const initialFrame = scenes.slice(0, Math.max(selectedSceneIndex, 0)).reduce(
    (sum, scene) => sum + (scene.durationInFrames ?? project.fps * 3),
    0
  );

  const previewProject = project.analysis
    ? {
        ...project,
        analysis: {
          ...project.analysis,
          scenes,
        },
      }
    : project;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
        width: '100%',
      }}
    >
      <div
        style={{
          borderRadius: 24,
          padding: 18,
          background: 'linear-gradient(180deg, rgba(18,18,24,0.96), rgba(10,10,14,0.96))',
          border: '1px solid rgba(255,255,255,0.07)',
          boxShadow: '0 24px 60px rgba(0,0,0,0.28)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div>
            <p style={{ fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#8C8B99', fontWeight: 700 }}>
              Preview
            </p>
            <p style={{ color: '#F7F2EA', fontWeight: 700, fontSize: 18, marginTop: 6 }}>
              {tab === 'ai' ? 'Composição Remotion' : 'Vídeo normalizado'}
            </p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {(['ai', 'source'] as const).map((value) => (
              <button
                key={value}
                onClick={() => setTab(value)}
                style={{
                  borderRadius: 999,
                  border: '1px solid rgba(255,255,255,0.08)',
                  padding: '8px 14px',
                  background: tab === value ? 'rgba(255,184,0,0.14)' : 'rgba(255,255,255,0.03)',
                  color: tab === value ? '#FFCC4D' : '#A5A3B5',
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                {value === 'ai' ? 'IA' : 'Fonte'}
              </button>
            ))}
          </div>
        </div>

        <div
          style={{
            borderRadius: 24,
            overflow: 'hidden',
            border: '1px solid rgba(255,255,255,0.08)',
            background:
              'radial-gradient(circle at top, rgba(255,184,0,0.10), transparent 42%), #040406',
            aspectRatio: '9 / 16',
          }}
        >
          {tab === 'ai' && project.analysis ? (
            <Player
              component={EloCutVideo}
              durationInFrames={durationInFrames}
              fps={project.fps}
              compositionHeight={project.height}
              compositionWidth={project.width}
              controls
              autoPlay={false}
              initialFrame={initialFrame}
              style={{ width: '100%', height: '100%' }}
              inputProps={{ project: previewProject }}
            />
          ) : sourceFilename ? (
            <video
              src={`/api/video/${sourceFilename}`}
              controls
              style={{ width: '100%', height: '100%', objectFit: 'contain', background: '#000' }}
            />
          ) : null}
        </div>
      </div>

      <div
        style={{
          borderRadius: 24,
          padding: 18,
          background: 'linear-gradient(180deg, rgba(18,18,24,0.96), rgba(10,10,14,0.96))',
          border: '1px solid rgba(255,255,255,0.07)',
          boxShadow: '0 18px 48px rgba(0,0,0,0.22)',
        }}
      >
        <p style={{ fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#8C8B99', fontWeight: 700 }}>
          Resumo
        </p>
        {project.analysis ? (
          <>
            <p style={{ color: '#F7F2EA', fontWeight: 700, fontSize: 18, marginTop: 8 }}>
              {project.analysis.title}
            </p>
            <p style={{ color: '#A5A3B5', fontSize: 14, lineHeight: 1.6, marginTop: 8 }}>
              {project.analysis.summary}
            </p>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 14 }}>
              <span style={{ padding: '6px 10px', borderRadius: 999, fontSize: 12, background: 'rgba(255,184,0,0.14)', color: '#FFCC4D' }}>
                {project.analysis.narrativeFormat.type}
              </span>
              <span style={{ padding: '6px 10px', borderRadius: 999, fontSize: 12, background: 'rgba(255,255,255,0.05)', color: '#D2CCBF' }}>
                {project.analysis.narrativeFormat.pacing}
              </span>
              <span style={{ padding: '6px 10px', borderRadius: 999, fontSize: 12, background: 'rgba(255,255,255,0.05)', color: '#D2CCBF' }}>
                {project.subtitles.length} legendas
              </span>
              {outputFilename ? (
                <a
                  href={`/api/video/${outputFilename}`}
                  download
                  style={{
                    padding: '6px 10px',
                    borderRadius: 999,
                    fontSize: 12,
                    background: 'rgba(34,197,94,0.12)',
                    color: '#7EE2A8',
                    textDecoration: 'none',
                  }}
                >
                  Último render pronto
                </a>
              ) : null}
            </div>
          </>
        ) : (
          <p style={{ color: '#A5A3B5', fontSize: 14, marginTop: 8 }}>
            Assim que a análise terminar, o preview da composição Remotion aparece aqui.
          </p>
        )}
      </div>
    </div>
  );
}

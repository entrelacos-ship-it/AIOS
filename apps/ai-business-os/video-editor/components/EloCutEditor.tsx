'use client';

import { useEffect, useState } from 'react';
import SceneList from './SceneList';
import SceneInspector from './SceneInspector';
import VideoPreview from './VideoPreview';
import Timeline from './Timeline';
import type { EloCutProject, EloCutScene } from '@/lib/types';

interface Props {
  project: EloCutProject;
  onUpdate: (project: EloCutProject) => void;
}

function getDownloadUrl(project: EloCutProject) {
  const filename = project.outputPath?.split(/[\\/]/).pop();
  return filename ? `/api/video/${filename}` : null;
}

export default function EloCutEditor({ project, onUpdate }: Props) {
  const [selectedId, setSelectedId] = useState<string | null>(project.analysis?.scenes[0]?.id ?? null);
  const [rendering, setRendering] = useState(false);
  const [generatingIllustration, setGeneratingIllustration] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(getDownloadUrl(project));

  useEffect(() => {
    const currentIds = new Set(project.analysis?.scenes.map((scene) => scene.id) ?? []);
    if (!selectedId || !currentIds.has(selectedId)) {
      setSelectedId(project.analysis?.scenes[0]?.id ?? null);
    }
    setDownloadUrl(getDownloadUrl(project));
  }, [project, selectedId]);

  const scenes = project.analysis?.scenes ?? [];
  const selectedScene = scenes.find((scene) => scene.id === selectedId) ?? null;

  const updateScenes = (nextScenes: EloCutScene[]) => {
    if (!project.analysis) return;
    onUpdate({
      ...project,
      analysis: {
        ...project.analysis,
        scenes: nextScenes,
      },
    });
  };

  const handleSceneChange = (updatedScene: EloCutScene) => {
    updateScenes(scenes.map((scene) => (scene.id === updatedScene.id ? updatedScene : scene)));
  };

  const handleIllustration = async () => {
    if (!selectedScene) return;
    setGeneratingIllustration(true);

    try {
      const res = await fetch('/api/illustrate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sceneId: selectedScene.id,
          prompt:
            selectedScene.illustrationPrompt ||
            `${selectedScene.title}. ${selectedScene.description}. Vertical premium editorial illustration.`,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to generate illustration');
      handleSceneChange({ ...selectedScene, illustrationUrl: data.dataUrl });
    } catch (error) {
      alert(`Falha ao gerar ilustração: ${String(error)}`);
    } finally {
      setGeneratingIllustration(false);
    }
  };

  const handleRender = async () => {
    setRendering(true);
    try {
      const res = await fetch('/api/render', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ project }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Render failed');
      setDownloadUrl(data.downloadUrl);
      onUpdate(data.project);
    } catch (error) {
      alert(`Render failed: ${String(error)}`);
    } finally {
      setRendering(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18, minHeight: 'calc(100vh - 128px)' }}>
      <div
        style={{
          borderRadius: 28,
          padding: '24px 24px 22px',
          border: '1px solid rgba(255,255,255,0.08)',
          background:
            'radial-gradient(circle at top right, rgba(255,184,0,0.14), transparent 28%), linear-gradient(180deg, rgba(17,17,24,0.96), rgba(8,8,12,0.98))',
          boxShadow: '0 30px 80px rgba(0,0,0,0.34)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 24, alignItems: 'flex-start', flexWrap: 'wrap' }}>
          <div style={{ maxWidth: 760 }}>
            <p style={{ fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#8C8B99', fontWeight: 700 }}>
              Review Stage
            </p>
            <h2 style={{ fontSize: 30, lineHeight: 1.1, fontWeight: 800, color: '#F7F2EA', marginTop: 10 }}>
              {project.analysis?.title ?? project.originalFilename}
            </h2>
            <p style={{ fontSize: 14, color: '#A5A3B5', marginTop: 10, lineHeight: 1.7 }}>
              {project.analysis?.summary ?? 'Revise cada bloco narrativo, ajuste timing por legenda e gere a composição vertical final com Remotion.'}
            </p>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 16 }}>
              <span style={{ padding: '8px 12px', borderRadius: 999, background: 'rgba(255,184,0,0.14)', color: '#FFCC4D', fontSize: 12, fontWeight: 700 }}>
                {project.analysis?.narrativeFormat.type ?? 'análise'}
              </span>
              <span style={{ padding: '8px 12px', borderRadius: 999, background: 'rgba(255,255,255,0.05)', color: '#D2CCBF', fontSize: 12 }}>
                {project.analysis?.scenes.length ?? 0} cenas
              </span>
              <span style={{ padding: '8px 12px', borderRadius: 999, background: 'rgba(255,255,255,0.05)', color: '#D2CCBF', fontSize: 12 }}>
                {project.subtitles.length} legendas
              </span>
              <span style={{ padding: '8px 12px', borderRadius: 999, background: 'rgba(255,255,255,0.05)', color: '#D2CCBF', fontSize: 12 }}>
                1080x1920 · 30fps
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
            {downloadUrl ? (
              <a
                href={downloadUrl}
                download
                style={{
                  textDecoration: 'none',
                  padding: '12px 18px',
                  borderRadius: 16,
                  border: '1px solid rgba(126,226,168,0.32)',
                  color: '#7EE2A8',
                  background: 'rgba(34,197,94,0.10)',
                  fontWeight: 700,
                  fontSize: 14,
                }}
              >
                Baixar render
              </a>
            ) : null}
            <button
              onClick={handleRender}
              disabled={rendering}
              style={{
                border: 'none',
                borderRadius: 18,
                padding: '14px 22px',
                cursor: rendering ? 'wait' : 'pointer',
                background: rendering
                  ? 'rgba(255,184,0,0.18)'
                  : 'linear-gradient(135deg, #FFB800 0%, #FF7A00 100%)',
                color: rendering ? '#FFE08A' : '#0B0905',
                fontWeight: 800,
                fontSize: 14,
                boxShadow: rendering ? 'none' : '0 18px 40px rgba(255,184,0,0.24)',
              }}
            >
              {rendering ? 'Renderizando...' : 'Renderizar MP4'}
            </button>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '320px minmax(0, 1fr) 360px', gap: 18, minHeight: 0, alignItems: 'start' }}>
        <SceneList
          project={project}
          selectedId={selectedId}
          onSelect={setSelectedId}
          onUpdate={updateScenes}
        />
        <VideoPreview project={project} selectedId={selectedId} />
        <SceneInspector
          scene={selectedScene}
          maxSubtitleIndex={Math.max(project.subtitles.length - 1, 0)}
          generating={generatingIllustration}
          onChange={handleSceneChange}
          onGenerateIllustration={handleIllustration}
        />
      </div>

      <Timeline project={project} selectedId={selectedId} onSelect={setSelectedId} />
    </div>
  );
}

import React, { useEffect, useState } from 'react';
import { Download, RefreshCw, Loader2, Film, Edit3 } from 'lucide-react';
import type { EditAIVideoProject, EditAIScene } from '../../types';
import { View } from '../../types';

interface Props {
  projectId: string;
  onNavigate: (view: View, projectId?: string) => void;
}

const SCENE_TYPE_LABELS: Record<string, string> = {
  A: 'Tela Cheia', B: 'Lower Third', 'C+': 'Split', D: 'Split Vertical',
  E: 'Card', F: 'Mensagem', G: 'Número', H: 'Fluxo', I: 'CTA', BONECO: 'Ilustração',
};

export const EditAIReview: React.FC<Props> = ({ projectId, onNavigate }) => {
  const [project, setProject] = useState<EditAIVideoProject | null>(null);
  const [selectedScene, setSelectedScene] = useState<EditAIScene | null>(null);
  const [rerendering, setRerendering] = useState(false);

  useEffect(() => {
    fetch(`/api/editai/project/${projectId}`)
      .then((r) => r.json())
      .then((data: EditAIVideoProject) => {
        setProject(data);
        if (data.scenes?.length > 0) setSelectedScene(data.scenes[0]);
      });
  }, [projectId]);

  const handleRerender = async () => {
    setRerendering(true);
    await fetch(`/api/editai/project/${projectId}/render`, { method: 'POST' });
    onNavigate(View.EDIT_AI_RENDER, projectId);
  };

  const handleSceneEdit = async (updatedScene: EditAIScene) => {
    if (!project) return;
    const updatedScenes = project.scenes.map((s) => s.id === updatedScene.id ? updatedScene : s);
    await fetch(`/api/editai/project/${projectId}/scenes`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scenes: updatedScenes }),
    });
    setProject({ ...project, scenes: updatedScenes });
    setSelectedScene(updatedScene);
  };

  if (!project) {
    return (
      <div style={{ background: '#050508', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Loader2 size={24} style={{ color: '#FFB800', animation: 'spin 0.8s linear infinite' }} />
      </div>
    );
  }

  const videoUrl = `/api/editai/project/${projectId}/media/output`;

  return (
    <div style={{ background: '#050508', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '16px 24px',
        background: '#0D0D14',
        borderBottom: '1px solid #1A1A2E',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Film size={18} style={{ color: '#FFB800' }} />
          <h2 style={{ fontFamily: 'DM Sans, sans-serif', color: '#F0F0F0', fontSize: 18, fontWeight: 700, margin: 0 }}>
            {project.title} — Revisão
          </h2>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={handleRerender}
            disabled={rerendering}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              background: '#1A1A2E', color: '#F0F0F0', border: '1px solid #1A1A2E',
              borderRadius: 8, padding: '8px 16px',
              fontFamily: 'DM Sans, sans-serif', fontSize: 13, fontWeight: 600, cursor: 'pointer',
            }}
          >
            <RefreshCw size={14} /> Re-renderizar
          </button>
          <a
            href={videoUrl}
            download={`${project.title}.mp4`}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              background: '#FFB800', color: '#050508', textDecoration: 'none',
              borderRadius: 8, padding: '8px 16px',
              fontFamily: 'DM Sans, sans-serif', fontSize: 13, fontWeight: 700,
            }}
          >
            <Download size={14} /> Download
          </a>
        </div>
      </div>

      {/* Main area */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Video player */}
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, background: '#050508' }}>
          <video
            src={videoUrl}
            controls
            style={{
              maxHeight: 'calc(100vh - 140px)',
              aspectRatio: '9/16',
              borderRadius: 12,
              background: '#000',
              boxShadow: '0 0 60px rgba(0,0,0,0.8)',
            }}
          />
        </div>

        {/* Scene panel */}
        <div style={{
          width: 320,
          background: '#0D0D14',
          borderLeft: '1px solid #1A1A2E',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}>
          <p style={{
            fontFamily: 'DM Mono, monospace',
            fontSize: 11,
            color: '#8888AA',
            margin: 0,
            padding: '12px 16px',
            borderBottom: '1px solid #1A1A2E',
            textTransform: 'uppercase',
            letterSpacing: 1,
          }}>
            Cenas ({project.scenes?.length ?? 0})
          </p>
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {(project.scenes ?? []).map((scene) => (
              <div
                key={scene.id}
                onClick={() => setSelectedScene(scene)}
                style={{
                  padding: '14px 16px',
                  borderBottom: '1px solid #1A1A2E',
                  cursor: 'pointer',
                  background: selectedScene?.id === scene.id ? '#1A1A2E' : 'transparent',
                  transition: 'background 0.1s',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <span style={{
                    fontFamily: 'DM Mono, monospace',
                    fontSize: 11,
                    color: '#FFB800',
                    background: '#FFB80022',
                    padding: '2px 6px',
                    borderRadius: 4,
                  }}>
                    {scene.tipo}
                  </span>
                  <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 12, color: '#8888AA' }}>
                    {SCENE_TYPE_LABELS[scene.tipo] ?? scene.tipo}
                  </span>
                </div>
                <p style={{
                  fontFamily: 'DM Sans, sans-serif',
                  fontSize: 12,
                  color: '#F0F0F0',
                  margin: 0,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}>
                  {String(Object.values(scene.conteudo)[0] ?? '')}
                </p>
                <p style={{ fontFamily: 'DM Mono, monospace', fontSize: 10, color: '#8888AA', margin: '4px 0 0' }}>
                  f{scene.frame_inicio}–f{scene.frame_fim}
                </p>
              </div>
            ))}
          </div>

          {/* Scene editor */}
          {selectedScene && (
            <div style={{ borderTop: '1px solid #1A1A2E', padding: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
                <Edit3 size={14} style={{ color: '#FFB800' }} />
                <span style={{ fontFamily: 'DM Mono, monospace', fontSize: 11, color: '#FFB800', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  Editar Cena {selectedScene.id}
                </span>
              </div>
              {Object.entries(selectedScene.conteudo).map(([key, value]) => (
                <div key={key} style={{ marginBottom: 10 }}>
                  <label style={{ fontFamily: 'DM Mono, monospace', fontSize: 10, color: '#8888AA', display: 'block', marginBottom: 4, textTransform: 'uppercase' }}>
                    {key}
                  </label>
                  <input
                    value={String(value ?? '')}
                    onChange={(e) => handleSceneEdit({
                      ...selectedScene,
                      conteudo: { ...selectedScene.conteudo, [key]: e.target.value },
                    })}
                    style={{
                      width: '100%',
                      background: '#050508',
                      border: '1px solid #1A1A2E',
                      borderRadius: 6,
                      padding: '6px 10px',
                      color: '#F0F0F0',
                      fontFamily: 'DM Sans, sans-serif',
                      fontSize: 13,
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

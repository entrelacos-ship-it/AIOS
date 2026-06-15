import React, { useEffect, useRef, useState } from 'react';
import { Film, Loader2, CheckCircle2, XCircle } from 'lucide-react';
import type { EditAIVideoProject } from '../../types';
import { View } from '../../types';

interface Props {
  projectId: string;
  onNavigate: (view: View, projectId?: string) => void;
}

export const EditAIRenderProgress: React.FC<Props> = ({ projectId, onNavigate }) => {
  const [project, setProject] = useState<EditAIVideoProject | null>(null);
  const [error, setError] = useState('');
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const poll = async () => {
      try {
        const res = await fetch(`/api/editai/project/${projectId}`);
        if (!res.ok) return;
        const data: EditAIVideoProject = await res.json();
        setProject(data);

        if (data.status === 'done') {
          clearInterval(intervalRef.current!);
          setTimeout(() => onNavigate(View.EDIT_AI_REVIEW, projectId), 1200);
        }
        if (data.status === 'error') {
          clearInterval(intervalRef.current!);
          setError(data.error || 'Erro durante renderização.');
        }
      } catch {
        // silently retry
      }
    };

    poll();
    intervalRef.current = setInterval(poll, 1500);
    return () => clearInterval(intervalRef.current!);
  }, [projectId]);

  const progress = project?.renderProgress ?? 0;
  const isDone = project?.status === 'done';

  return (
    <div style={{
      background: '#050508',
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 48,
      gap: 32,
    }}>
      <div style={{ maxWidth: 540, width: '100%', textAlign: 'center' }}>
        {isDone ? (
          <CheckCircle2 size={48} style={{ color: '#4CAF50', marginBottom: 16 }} />
        ) : error ? (
          <XCircle size={48} style={{ color: '#EF4444', marginBottom: 16 }} />
        ) : (
          <Film size={48} style={{ color: '#FFB800', marginBottom: 16 }} />
        )}

        <h2 style={{ fontFamily: 'DM Sans, sans-serif', color: '#F0F0F0', fontSize: 22, fontWeight: 700, margin: '0 0 8px' }}>
          {isDone ? 'Renderização concluída!' : error ? 'Erro na renderização' : 'Etapa 5 — Renderizando com Remotion'}
        </h2>

        {!error && (
          <p style={{ fontFamily: 'DM Mono, monospace', fontSize: 13, color: '#FFB800', margin: '0 0 32px' }}>
            {progress}%
          </p>
        )}

        {!error && (
          <div style={{
            width: '100%',
            height: 8,
            background: '#1A1A2E',
            borderRadius: 4,
            overflow: 'hidden',
          }}>
            <div style={{
              height: '100%',
              width: `${progress}%`,
              background: isDone ? '#4CAF50' : '#FFB800',
              borderRadius: 4,
              transition: 'width 0.4s ease',
            }} />
          </div>
        )}

        {!isDone && !error && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 24, color: '#8888AA' }}>
            <Loader2 size={16} style={{ animation: 'spin 0.8s linear infinite' }} />
            <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 13 }}>
              Compondo {project?.scenes?.length ?? 0} cenas + legendas TikTok...
            </span>
          </div>
        )}

        {error && (
          <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 14, color: '#EF4444', marginTop: 16 }}>{error}</p>
        )}

        {isDone && (
          <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 14, color: '#8888AA', marginTop: 16 }}>
            Redirecionando para revisão...
          </p>
        )}
      </div>
    </div>
  );
};

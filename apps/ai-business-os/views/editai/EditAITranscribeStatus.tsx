import React, { useEffect, useRef, useState } from 'react';
import { CheckCircle2, Loader2, XCircle } from 'lucide-react';
import type { EditAIVideoProject, EditAIProjectStatus } from '../../types';
import { View } from '../../types';

interface Props {
  projectId: string;
  onNavigate: (view: View, projectId?: string) => void;
}

const STAGE_ORDER: Array<{ status: EditAIProjectStatus; label: string }> = [
  { status: 'uploading', label: 'Etapa 1 — Envio e preparação' },
  { status: 'normalizing', label: 'Etapa 1 — Normalizando para H.264 30fps' },
  { status: 'transcribing', label: 'Etapa 2 — Transcrição com Whisper (word-level)' },
  { status: 'cutting', label: 'Etapa 3 — Detectando silêncios e gaguejos' },
];

const STAGE_STATUSES = STAGE_ORDER.map((s) => s.status);

type StageState = 'pending' | 'active' | 'done';

function getStageState(stageStatus: EditAIProjectStatus, currentStatus: EditAIProjectStatus): StageState {
  const stageIdx = STAGE_STATUSES.indexOf(stageStatus);
  const currentIdx = STAGE_STATUSES.indexOf(currentStatus);

  if (currentStatus === 'awaiting_approval' || !STAGE_STATUSES.includes(currentStatus)) {
    return 'done'; // all pipeline stages done
  }
  if (stageIdx < currentIdx) return 'done';
  if (stageIdx === currentIdx) return 'active';
  return 'pending';
}

export const EditAITranscribeStatus: React.FC<Props> = ({ projectId, onNavigate }) => {
  const [project, setProject] = useState<EditAIVideoProject | null>(null);
  const [error, setError] = useState('');
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const poll = async () => {
      try {
        const res = await fetch(`/api/editai/project/${projectId}`);
        if (!res.ok) { setError('Projeto não encontrado.'); return; }
        const data: EditAIVideoProject = await res.json();
        setProject(data);

        if (data.status === 'awaiting_approval') {
          clearInterval(intervalRef.current!);
          onNavigate(View.EDIT_AI_CUT_REPORT, projectId);
        }
        if (data.status === 'error') {
          clearInterval(intervalRef.current!);
          setError(data.error || 'Erro no pipeline.');
        }
      } catch (err) {
        setError('Erro ao verificar status do projeto.');
      }
    };

    poll();
    intervalRef.current = setInterval(poll, 2500);
    return () => clearInterval(intervalRef.current!);
  }, [projectId]);

  const currentStatus = project?.status ?? 'uploading';

  return (
    <div style={{ background: '#050508', minHeight: '100vh', padding: 48, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 32 }}>
      <div style={{ maxWidth: 560, width: '100%' }}>
        <h2 style={{ fontFamily: 'DM Sans, sans-serif', color: '#F0F0F0', fontSize: 22, fontWeight: 700, margin: '0 0 32px' }}>
          Processando vídeo...
        </h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {STAGE_ORDER.map((stage) => {
            const state = getStageState(stage.status, currentStatus);
            return (
              <div
                key={stage.status}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 16,
                  padding: '16px 20px',
                  background: '#0D0D14',
                  borderRadius: 10,
                  border: `1px solid ${state === 'active' ? '#FFB800' : '#1A1A2E'}`,
                  opacity: state === 'pending' ? 0.4 : 1,
                  transition: 'all 0.2s',
                }}
              >
                {state === 'done' ? (
                  <CheckCircle2 size={20} style={{ color: '#4CAF50', flexShrink: 0 }} />
                ) : state === 'active' ? (
                  <Loader2 size={20} style={{ color: '#FFB800', flexShrink: 0, animation: 'spin 0.8s linear infinite' }} />
                ) : (
                  <div style={{ width: 20, height: 20, borderRadius: '50%', border: '2px solid #1A1A2E', flexShrink: 0 }} />
                )}
                <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 14, color: state === 'active' ? '#FFB800' : '#F0F0F0' }}>
                  {stage.label}
                </span>
              </div>
            );
          })}
        </div>

        {error ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 24, color: '#EF4444' }}>
            <XCircle size={18} />
            <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 14, margin: 0 }}>{error}</p>
          </div>
        ) : (
          <p style={{ fontFamily: 'DM Mono, monospace', fontSize: 12, color: '#8888AA', marginTop: 24, textAlign: 'center' }}>
            Status: {currentStatus}
          </p>
        )}
      </div>
    </div>
  );
};

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Upload, Film, Mic, Brain, Clapperboard, Download, CheckCircle, AlertCircle, Loader2, Play, Clock, Tag, Trash2 } from 'lucide-react';

type ProjectStatus = 'idle' | 'pending' | 'uploading' | 'transcribing' | 'analyzing' | 'rendering' | 'complete' | 'error';
type PublicationStatus = 'draft' | 'rendered' | 'scheduled' | 'published';
type EloCutFlowScreen = 'select' | 'confirm' | 'processing' | 'result';

interface EloCutScene {
  id: string;
  startTime: number;
  endTime: number;
  transcript: string;
  title: string;
  description: string;
  visualStyle: 'kinetic' | 'minimal' | 'dramatic' | 'energetic';
  backgroundColor: string;
  accentColor: string;
  keywords: string[];
}

interface EloCutProjectStatus {
  id: string;
  title: string;
  sourceFileName: string;
  status: ProjectStatus;
  scenes: EloCutScene[];
  transcription: { start: number; end: number; text: string }[];
  totalDuration: number;
  renderProgress?: number;
  downloadReady?: boolean;
  createdAt: string;
  updatedAt: string;
  lastRenderedAt?: string | null;
  publicationStatus: PublicationStatus;
  publicationPlatform: string;
  publicationUrl: string;
  publicationNotes: string;
  publishedAt?: string | null;
  error?: string;
}

const STYLE_LABELS: Record<string, string> = {
  kinetic: 'Cinético',
  minimal: 'Minimalista',
  dramatic: 'Dramático',
  energetic: 'Energético',
};

const PUBLICATION_LABELS: Record<PublicationStatus, string> = {
  draft: 'Editado',
  rendered: 'Renderizado',
  scheduled: 'Agendado',
  published: 'Publicado',
};

const STATUS_LABELS: Record<ProjectStatus, string> = {
  idle: 'Parado',
  pending: 'Preparando',
  uploading: 'Enviando',
  transcribing: 'Transcrevendo',
  analyzing: 'Analisando',
  rendering: 'Renderizando',
  complete: 'Concluído',
  error: 'Erro',
};

const STEP_CONFIG = [
  { key: 'uploading', label: 'Upload', icon: Upload, description: 'Enviando vídeo para o servidor' },
  { key: 'transcribing', label: 'Transcrever', icon: Mic, description: 'Whisper processando o áudio' },
  { key: 'analyzing', label: 'Analisar', icon: Brain, description: 'Claude gerando cenas' },
  { key: 'rendering', label: 'Renderizar', icon: Clapperboard, description: 'Remotion montando o vídeo' },
] as const;

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function formatDateTime(value?: string | null): string {
  if (!value) return 'Sem registro';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Sem registro';
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(date);
}

function getPublicationTone(status: PublicationStatus): { background: string; color: string; border: string } {
  switch (status) {
    case 'published':
      return { background: 'rgba(16,185,129,0.12)', color: '#34d399', border: '1px solid rgba(52,211,153,0.25)' };
    case 'scheduled':
      return { background: 'rgba(59,130,246,0.12)', color: '#60a5fa', border: '1px solid rgba(96,165,250,0.25)' };
    case 'rendered':
      return { background: 'rgba(168,85,247,0.12)', color: '#c084fc', border: '1px solid rgba(192,132,252,0.25)' };
    default:
      return { background: 'rgba(255,255,255,0.05)', color: '#9ca3af', border: '1px solid rgba(255,255,255,0.08)' };
  }
}

function getProjectStatusTone(status: ProjectStatus): { background: string; color: string; border: string } {
  switch (status) {
    case 'complete':
      return { background: 'rgba(16,185,129,0.12)', color: '#34d399', border: '1px solid rgba(52,211,153,0.25)' };
    case 'error':
      return { background: 'rgba(248,113,113,0.12)', color: '#f87171', border: '1px solid rgba(248,113,113,0.25)' };
    case 'pending':
    case 'rendering':
    case 'analyzing':
    case 'transcribing':
    case 'uploading':
      return { background: 'rgba(168,85,247,0.12)', color: '#c084fc', border: '1px solid rgba(192,132,252,0.25)' };
    default:
      return { background: 'rgba(255,255,255,0.05)', color: '#9ca3af', border: '1px solid rgba(255,255,255,0.08)' };
  }
}

function getStatusStepIndex(status: ProjectStatus): number {
  if (status === 'pending') return 0;
  const order: ProjectStatus[] = ['uploading', 'transcribing', 'analyzing', 'rendering', 'complete'];
  return order.indexOf(status);
}

function getFlowScreen(status: ProjectStatus, selectedFile: File | null): EloCutFlowScreen {
  if (status === 'complete') return 'result';
  if (status !== 'idle' && status !== 'error') return 'processing';
  if (selectedFile) return 'confirm';
  return 'select';
}

export const EloCutView: React.FC = () => {
  const [status, setStatus] = useState<ProjectStatus>('idle');
  const [projectId, setProjectId] = useState<string | null>(null);
  const [projectData, setProjectData] = useState<EloCutProjectStatus | null>(null);
  const [historyItems, setHistoryItems] = useState<EloCutProjectStatus[]>([]);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [renderProgress, setRenderProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [controlForm, setControlForm] = useState({
    title: '',
    publicationStatus: 'draft' as PublicationStatus,
    publicationPlatform: '',
    publicationUrl: '',
    publicationNotes: '',
  });
  const [isSavingControl, setIsSavingControl] = useState(false);
  const [isDeletingProject, setIsDeletingProject] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  const mergeHistoryItem = useCallback((project: EloCutProjectStatus) => {
    setHistoryItems((current) => {
      const next = [...current];
      const index = next.findIndex((item) => item.id === project.id);
      if (index >= 0) {
        next[index] = project;
      } else {
        next.unshift(project);
      }

      return next.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    });
  }, []);

  const loadHistory = useCallback(async () => {
    try {
      setHistoryLoading(true);
      setHistoryError(null);
      const res = await fetch('/api/elocut/history');
      if (!res.ok) throw new Error('Falha ao carregar o histórico do EloCut.');
      const payload = await res.json();
      const projects = Array.isArray(payload.projects) ? payload.projects as EloCutProjectStatus[] : [];
      setHistoryItems(projects);
    } catch (err) {
      setHistoryError(err instanceof Error ? err.message : 'Falha ao carregar o histórico do EloCut.');
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  const pollProjectStatus = useCallback(async (id: string) => {
    try {
      const res = await fetch(`/api/elocut/project/${id}/status`);
      if (!res.ok) throw new Error('Failed to fetch project status');
      const data: EloCutProjectStatus = await res.json();

      setProjectData(data);
      mergeHistoryItem(data);
      setStatus(data.status);

      if (data.renderProgress !== undefined) {
        setRenderProgress(data.renderProgress);
      }

      if (data.status === 'complete' || data.status === 'error') {
        stopPolling();
        if (data.status === 'error') {
          setErrorMessage(data.error || 'Ocorreu um erro desconhecido.');
        }
      }
    } catch (err) {
      console.error('Polling error:', err);
    }
  }, [mergeHistoryItem, stopPolling]);

  useEffect(() => {
    void loadHistory();
  }, [loadHistory]);

  useEffect(() => {
    if (projectId && status !== 'idle' && status !== 'complete' && status !== 'error') {
      stopPolling();
      pollRef.current = setInterval(() => pollProjectStatus(projectId), 2000);
    }
    return stopPolling;
  }, [projectId, status, pollProjectStatus, stopPolling]);

  const handleFileSelect = (file: File) => {
    const validTypes = ['video/mp4', 'video/quicktime', 'video/webm', 'video/x-msvideo', 'video/mpeg'];
    if (!validTypes.includes(file.type) && !file.name.match(/\.(mp4|mov|webm|avi|mkv)$/i)) {
      setErrorMessage('Formato de arquivo inválido. Use MP4, MOV, WebM, AVI ou MKV.');
      return;
    }
    setSelectedFile(file);
    setErrorMessage(null);
  };

  useEffect(() => {
    if (!projectData) return;
    setControlForm({
      title: projectData.title || '',
      publicationStatus: projectData.publicationStatus || 'draft',
      publicationPlatform: projectData.publicationPlatform || '',
      publicationUrl: projectData.publicationUrl || '',
      publicationNotes: projectData.publicationNotes || '',
    });
  }, [projectData]);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  };

  const handleStartProcessing = async () => {
    if (!selectedFile) return;

    setStatus('uploading');
    setErrorMessage(null);
    setProjectData(null);
    setRenderProgress(0);

    try {
      const formData = new FormData();
      formData.append('video', selectedFile);

      const res = await fetch('/api/elocut/upload', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({ error: 'Upload falhou.' }));
        throw new Error(errData.error || 'Upload falhou.');
      }

      const { projectId: newId } = await res.json();
      setProjectId(newId);
      setStatus('transcribing');
      void loadHistory();
      void pollProjectStatus(newId);
    } catch (err) {
      setStatus('error');
      setErrorMessage(err instanceof Error ? err.message : 'Erro ao enviar vídeo.');
    }
  };

  const handleDownload = async () => {
    if (!projectId) return;
    try {
      const response = await fetch(`/api/elocut/project/${projectId}/download`);
      if (!response.ok) {
        const payload = await response.json().catch(() => ({ error: 'Falha ao baixar o vídeo renderizado.' }));
        throw new Error(payload.error || 'Falha ao baixar o vídeo renderizado.');
      }

      const blob = await response.blob();
      const downloadUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `elocut_${projectId}.mp4`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(downloadUrl);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Falha ao baixar o vídeo renderizado.');
    }
  };

  const handleReset = () => {
    stopPolling();
    setStatus('idle');
    setProjectId(null);
    setProjectData(null);
    setRenderProgress(0);
    setErrorMessage(null);
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSelectHistoryItem = (item: EloCutProjectStatus) => {
    setProjectId(item.id);
    setProjectData(item);
    setStatus(item.status);
    setRenderProgress(item.renderProgress ?? 0);
    setErrorMessage(item.error || null);
    void pollProjectStatus(item.id);
  };

  const handleSaveControl = async () => {
    if (!projectData) return;

    try {
      setIsSavingControl(true);
      const response = await fetch(`/api/elocut/project/${projectData.id}/control`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(controlForm),
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload.error || 'Falha ao salvar o controle do projeto.');
      }

      const updatedProject = payload.project as EloCutProjectStatus;
      setProjectData(updatedProject);
      setStatus(updatedProject.status);
      mergeHistoryItem(updatedProject);
      setErrorMessage(null);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Falha ao salvar o controle do projeto.');
    } finally {
      setIsSavingControl(false);
    }
  };

  const handleDeleteProject = async () => {
    if (!projectData) return;

    const confirmed = window.confirm(
      `Excluir o projeto "${projectData.title || projectData.sourceFileName}"?\n\nIsso remove o item do histórico e apaga os arquivos gerados do EloCut.`,
    );

    if (!confirmed) {
      return;
    }

    try {
      setIsDeletingProject(true);
      const response = await fetch(`/api/elocut/project/${projectData.id}`, {
        method: 'DELETE',
      });
      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(payload.error || 'Falha ao excluir o projeto.');
      }

      stopPolling();
      setHistoryItems((current) => current.filter((item) => item.id !== projectData.id));
      setProjectId(null);
      setProjectData(null);
      setStatus('idle');
      setRenderProgress(0);
      setErrorMessage(null);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Falha ao excluir o projeto.');
    } finally {
      setIsDeletingProject(false);
    }
  };

  const currentStepIndex = getStatusStepIndex(status);
  const editedCount = historyItems.filter((item) => item.scenes.length > 0 || item.transcription.length > 0).length;
  const renderedCount = historyItems.filter((item) => item.downloadReady).length;
  const publishedCount = historyItems.filter((item) => item.publicationStatus === 'published').length;
  const flowScreen = getFlowScreen(status, selectedFile);
  const flowSteps = [
    {
      id: 'select' as const,
      label: 'Selecionar vídeo',
      description: 'Escolha o arquivo que vai entrar no pipeline.',
    },
    {
      id: 'confirm' as const,
      label: 'Confirmar processamento',
      description: 'Revise o arquivo e inicie a automação.',
    },
    {
      id: 'processing' as const,
      label: 'Acompanhar pipeline',
      description: 'Upload, transcrição, análise e render ficam visíveis.',
    },
    {
      id: 'result' as const,
      label: 'Revisar resultado',
      description: 'Baixe, acompanhe status e continue do histórico.',
    },
  ];
  const activeFlowStepIndex = flowSteps.findIndex((step) => step.id === flowScreen);
  const activeFlowDescription = flowSteps[activeFlowStepIndex]?.description ?? '';

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0a0a12', color: '#e5e7eb', fontFamily: '"Inter", "Segoe UI", sans-serif', padding: '40px 24px' }}>
      <div style={{ maxWidth: 900, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ marginBottom: 40 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: 'linear-gradient(135deg, #7c3aed, #a855f7)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Film size={20} color="#fff" />
            </div>
            <h1 style={{ margin: 0, fontSize: 28, fontWeight: 800, background: 'linear-gradient(90deg, #a855f7, #7c3aed)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              EloCut
            </h1>
          </div>
          <p style={{ margin: 0, color: '#9ca3af', fontSize: 15 }}>
            Edição de vídeo automática com IA — Whisper + Claude + Remotion
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginBottom: 24 }}>
          {[
            { label: 'Projetos no histórico', value: historyItems.length, helper: 'Base persistida do EloCut' },
            { label: 'Vídeos editados', value: editedCount, helper: 'Com cenas ou transcrição geradas' },
            { label: 'Vídeos renderizados', value: renderedCount, helper: 'Prontos para download' },
            { label: 'Vídeos publicados', value: publishedCount, helper: 'Marcados como publicados' },
          ].map((item) => (
            <div
              key={item.label}
              style={{
                padding: '16px 18px',
                borderRadius: 14,
                background: 'linear-gradient(180deg, rgba(124,58,237,0.10), rgba(15,23,42,0.45))',
                border: '1px solid rgba(255,255,255,0.08)',
              }}
            >
              <p style={{ margin: '0 0 6px', color: '#9ca3af', fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                {item.label}
              </p>
              <p style={{ margin: '0 0 4px', color: '#fff', fontSize: 28, fontWeight: 800 }}>
                {item.value}
              </p>
              <p style={{ margin: 0, color: '#6b7280', fontSize: 12 }}>
                {item.helper}
              </p>
            </div>
          ))}
        </div>

        <div
          style={{
            marginBottom: 24,
            padding: '18px 20px',
            borderRadius: 16,
            background: 'linear-gradient(180deg, rgba(16,24,40,0.92), rgba(9,9,16,0.96))',
            border: '1px solid rgba(168,85,247,0.18)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, marginBottom: 14, flexWrap: 'wrap' }}>
            <div>
              <p style={{ margin: '0 0 6px', color: '#c084fc', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Fluxo guiado
              </p>
              <h2 style={{ margin: '0 0 4px', fontSize: 18, fontWeight: 700, color: '#fff' }}>
                EloCut precisa operar por etapas explícitas
              </h2>
              <p style={{ margin: 0, color: '#9ca3af', fontSize: 13, maxWidth: 620 }}>
                O pipeline agora fica organizado em seleção, confirmação, processamento e resultado. Isso reduz erro operacional e deixa claro em que ponto o job está.
              </p>
            </div>
            <div style={{ padding: '8px 12px', borderRadius: 999, background: 'rgba(168,85,247,0.12)', border: '1px solid rgba(192,132,252,0.22)', color: '#e9d5ff', fontSize: 12, fontWeight: 700 }}>
              Etapa atual: {flowSteps[activeFlowStepIndex]?.label}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10 }}>
            {flowSteps.map((step, index) => {
              const isActive = index === activeFlowStepIndex;
              const isDone = index < activeFlowStepIndex;
              return (
                <div
                  key={step.id}
                  style={{
                    padding: '12px 14px',
                    borderRadius: 12,
                    border: isActive ? '1px solid rgba(192,132,252,0.45)' : '1px solid rgba(255,255,255,0.06)',
                    background: isActive
                      ? 'rgba(124,58,237,0.16)'
                      : isDone
                        ? 'rgba(34,197,94,0.10)'
                        : 'rgba(255,255,255,0.02)',
                  }}
                >
                  <p style={{ margin: '0 0 6px', fontSize: 12, fontWeight: 700, color: isActive ? '#f5f3ff' : isDone ? '#bbf7d0' : '#d1d5db' }}>
                    {index + 1}. {step.label}
                  </p>
                  <p style={{ margin: 0, fontSize: 12, lineHeight: 1.45, color: '#9ca3af' }}>
                    {step.description}
                  </p>
                </div>
              );
            })}
          </div>

          <div style={{ marginTop: 14, padding: '12px 14px', borderRadius: 12, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', color: '#cbd5e1', fontSize: 13 }}>
            {activeFlowDescription}
          </div>
        </div>

        <div style={{ display: 'grid', gap: 20, gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', marginBottom: 32 }}>
          <div style={{ padding: '20px', borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, gap: 12 }}>
              <div>
                <h2 style={{ margin: '0 0 4px', fontSize: 18, fontWeight: 700, color: '#e5e7eb' }}>
                  Histórico de vídeos
                </h2>
                <p style={{ margin: 0, color: '#6b7280', fontSize: 13 }}>
                  Reabra projetos, acompanhe o estágio e baixe renders antigos.
                </p>
              </div>
              <button
                onClick={() => void loadHistory()}
                style={{
                  padding: '10px 14px',
                  borderRadius: 8,
                  border: '1px solid rgba(255,255,255,0.1)',
                  background: 'rgba(255,255,255,0.04)',
                  color: '#d1d5db',
                  cursor: 'pointer',
                  fontSize: 13,
                  fontWeight: 600,
                }}
              >
                Atualizar
              </button>
            </div>

            {historyError && (
              <div style={{ marginBottom: 12, color: '#f87171', fontSize: 13 }}>
                {historyError}
              </div>
            )}

            {historyLoading ? (
              <div style={{ padding: '18px 0', color: '#9ca3af', fontSize: 14 }}>Carregando histórico...</div>
            ) : historyItems.length === 0 ? (
              <div style={{ padding: '18px 0', color: '#6b7280', fontSize: 14 }}>
                Nenhum vídeo no histórico ainda. Quando você renderizar o primeiro, ele fica salvo aqui.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxHeight: 420, overflowY: 'auto', paddingRight: 4 }}>
                {historyItems.map((item) => {
                  const publicationTone = getPublicationTone(item.publicationStatus);
                  const workflowTone = getProjectStatusTone(item.status);
                  const isSelected = projectId === item.id;

                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleSelectHistoryItem(item)}
                      style={{
                        textAlign: 'left',
                        padding: '16px',
                        borderRadius: 14,
                        border: isSelected ? '1px solid rgba(168,85,247,0.7)' : '1px solid rgba(255,255,255,0.08)',
                        background: isSelected ? 'rgba(124,58,237,0.10)' : 'rgba(255,255,255,0.02)',
                        cursor: 'pointer',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start', marginBottom: 10 }}>
                        <div>
                          <p style={{ margin: '0 0 4px', color: '#fff', fontSize: 15, fontWeight: 700 }}>
                            {item.title || item.sourceFileName}
                          </p>
                          <p style={{ margin: 0, color: '#6b7280', fontSize: 12 }}>
                            {item.sourceFileName} • {formatDateTime(item.createdAt)}
                          </p>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-end' }}>
                          <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 999, ...workflowTone }}>
                            {STATUS_LABELS[item.status]}
                          </span>
                          <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 999, ...publicationTone }}>
                            {PUBLICATION_LABELS[item.publicationStatus]}
                          </span>
                        </div>
                      </div>

                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, color: '#9ca3af', fontSize: 12 }}>
                        <span>{item.scenes.length} cenas</span>
                        <span>{item.transcription.length} segmentos</span>
                        <span>{item.totalDuration ? formatTime(item.totalDuration) : '0:00'} de vídeo</span>
                        <span>{item.downloadReady ? 'Download pronto' : 'Sem render final'}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div style={{ padding: '20px', borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
            <h2 style={{ margin: '0 0 4px', fontSize: 18, fontWeight: 700, color: '#e5e7eb' }}>
              Controle do vídeo
            </h2>
            <p style={{ margin: '0 0 16px', color: '#6b7280', fontSize: 13 }}>
              Defina título, estágio de publicação, link final e observações do vídeo selecionado.
            </p>

            {!projectData ? (
              <div style={{ color: '#6b7280', fontSize: 14 }}>
                Selecione um item do histórico ou processe um novo vídeo para editar o controle.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <span style={{ color: '#d1d5db', fontSize: 13, fontWeight: 600 }}>Título</span>
                  <input
                    value={controlForm.title}
                    onChange={(e) => setControlForm((current) => ({ ...current, title: e.target.value }))}
                    style={{ borderRadius: 10, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.03)', color: '#fff', padding: '11px 12px', fontSize: 14 }}
                    placeholder="Nome do projeto"
                  />
                </label>

                <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <span style={{ color: '#d1d5db', fontSize: 13, fontWeight: 600 }}>Estágio editorial</span>
                  <select
                    value={controlForm.publicationStatus}
                    onChange={(e) => setControlForm((current) => ({ ...current, publicationStatus: e.target.value as PublicationStatus }))}
                    style={{ borderRadius: 10, border: '1px solid rgba(255,255,255,0.1)', background: '#111827', color: '#fff', padding: '11px 12px', fontSize: 14 }}
                  >
                    <option value="draft">Editado</option>
                    <option value="rendered">Renderizado</option>
                    <option value="scheduled">Agendado</option>
                    <option value="published">Publicado</option>
                  </select>
                </label>

                <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <span style={{ color: '#d1d5db', fontSize: 13, fontWeight: 600 }}>Canal / plataforma</span>
                  <input
                    value={controlForm.publicationPlatform}
                    onChange={(e) => setControlForm((current) => ({ ...current, publicationPlatform: e.target.value }))}
                    style={{ borderRadius: 10, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.03)', color: '#fff', padding: '11px 12px', fontSize: 14 }}
                    placeholder="Instagram, TikTok, YouTube..."
                  />
                </label>

                <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <span style={{ color: '#d1d5db', fontSize: 13, fontWeight: 600 }}>URL publicada</span>
                  <input
                    value={controlForm.publicationUrl}
                    onChange={(e) => setControlForm((current) => ({ ...current, publicationUrl: e.target.value }))}
                    style={{ borderRadius: 10, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.03)', color: '#fff', padding: '11px 12px', fontSize: 14 }}
                    placeholder="https://..."
                  />
                </label>

                <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <span style={{ color: '#d1d5db', fontSize: 13, fontWeight: 600 }}>Observações</span>
                  <textarea
                    value={controlForm.publicationNotes}
                    onChange={(e) => setControlForm((current) => ({ ...current, publicationNotes: e.target.value }))}
                    style={{ minHeight: 92, resize: 'vertical', borderRadius: 10, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.03)', color: '#fff', padding: '11px 12px', fontSize: 14 }}
                    placeholder="Notas sobre revisão, aprovação, canal e performance."
                  />
                </label>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, color: '#9ca3af', fontSize: 12 }}>
                  <div style={{ padding: '10px 12px', borderRadius: 10, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                    Criado em
                    <div style={{ marginTop: 4, color: '#fff', fontSize: 13 }}>{formatDateTime(projectData.createdAt)}</div>
                  </div>
                  <div style={{ padding: '10px 12px', borderRadius: 10, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                    Última atualização
                    <div style={{ marginTop: 4, color: '#fff', fontSize: 13 }}>{formatDateTime(projectData.updatedAt)}</div>
                  </div>
                  <div style={{ padding: '10px 12px', borderRadius: 10, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                    Último render
                    <div style={{ marginTop: 4, color: '#fff', fontSize: 13 }}>{formatDateTime(projectData.lastRenderedAt)}</div>
                  </div>
                  <div style={{ padding: '10px 12px', borderRadius: 10, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                    Download
                    <div style={{ marginTop: 4, color: projectData.downloadReady ? '#34d399' : '#f59e0b', fontSize: 13 }}>
                      {projectData.downloadReady ? 'Arquivo disponível' : 'Aguardando render final'}
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleSaveControl}
                  disabled={isSavingControl}
                  style={{
                    marginTop: 4,
                    padding: '12px',
                    borderRadius: 10,
                    border: 'none',
                    background: 'linear-gradient(135deg, #0f766e, #14b8a6)',
                    color: '#fff',
                    fontSize: 14,
                    fontWeight: 700,
                    cursor: isSavingControl ? 'wait' : 'pointer',
                    opacity: isSavingControl ? 0.75 : 1,
                  }}
                >
                  {isSavingControl ? 'Salvando controle...' : 'Salvar controle do vídeo'}
                </button>

                <button
                  onClick={handleDeleteProject}
                  disabled={isDeletingProject}
                  style={{
                    padding: '12px',
                    borderRadius: 10,
                    border: '1px solid rgba(248,113,113,0.28)',
                    background: 'rgba(127,29,29,0.25)',
                    color: '#fca5a5',
                    fontSize: 14,
                    fontWeight: 700,
                    cursor: isDeletingProject ? 'wait' : 'pointer',
                    opacity: isDeletingProject ? 0.75 : 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                  }}
                >
                  <Trash2 size={16} />
                  {isDeletingProject ? 'Excluindo projeto...' : 'Excluir projeto'}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Upload Area */}
        {flowScreen === 'select' && (
          <div style={{ marginBottom: 32 }}>
            <div
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              style={{
                border: `2px dashed ${isDragging ? '#7c3aed' : selectedFile ? '#22c55e' : '#374151'}`,
                borderRadius: 16,
                padding: '48px 24px',
                textAlign: 'center',
                cursor: 'pointer',
                backgroundColor: isDragging ? 'rgba(124,58,237,0.08)' : selectedFile ? 'rgba(34,197,94,0.05)' : 'rgba(255,255,255,0.02)',
                transition: 'all 0.2s ease',
              }}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="video/*"
                style={{ display: 'none' }}
                onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileSelect(f); }}
              />
              {selectedFile ? (
                <>
                  <CheckCircle size={40} color="#22c55e" style={{ margin: '0 auto 12px' }} />
                  <p style={{ margin: '0 0 4px', fontWeight: 600, fontSize: 16, color: '#e5e7eb' }}>{selectedFile.name}</p>
                  <p style={{ margin: 0, color: '#6b7280', fontSize: 13 }}>{(selectedFile.size / 1024 / 1024).toFixed(1)} MB — clique para trocar</p>
                </>
              ) : (
                <>
                  <Upload size={40} color="#4b5563" style={{ margin: '0 auto 12px' }} />
                  <p style={{ margin: '0 0 4px', fontWeight: 600, fontSize: 16, color: '#d1d5db' }}>Arraste seu vídeo aqui</p>
                  <p style={{ margin: 0, color: '#6b7280', fontSize: 13 }}>MP4, MOV, WebM, AVI ou MKV — clique para selecionar</p>
                </>
              )}
            </div>

            {errorMessage && (
              <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 8, color: '#f87171', fontSize: 14, padding: '10px 14px', backgroundColor: 'rgba(248,113,113,0.1)', borderRadius: 8, border: '1px solid rgba(248,113,113,0.2)' }}>
                <AlertCircle size={16} />
                {errorMessage}
              </div>
            )}

            {selectedFile && (
              <button
                onClick={handleStartProcessing}
                style={{
                  marginTop: 16,
                  width: '100%',
                  padding: '14px',
                  background: 'linear-gradient(135deg, #7c3aed, #a855f7)',
                  border: 'none',
                  borderRadius: 10,
                  color: '#fff',
                  fontWeight: 700,
                  fontSize: 15,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  transition: 'opacity 0.2s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.9')}
                onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
              >
                <Play size={18} />
                Iniciar Processamento com IA
              </button>
            )}
          </div>
        )}

        {flowScreen === 'confirm' && selectedFile && (
          <div
            style={{
              marginBottom: 32,
              padding: '24px',
              backgroundColor: 'rgba(255,255,255,0.03)',
              borderRadius: 16,
              border: '1px solid rgba(255,255,255,0.07)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'flex-start', flexWrap: 'wrap', marginBottom: 18 }}>
              <div>
                <p style={{ margin: '0 0 6px', color: '#c084fc', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  Confirmação do job
                </p>
                <h2 style={{ margin: '0 0 4px', fontSize: 20, fontWeight: 700, color: '#fff' }}>
                  Revise o arquivo antes de iniciar
                </h2>
                <p style={{ margin: 0, color: '#9ca3af', fontSize: 13, maxWidth: 620 }}>
                  O EloCut vai subir o arquivo, transcrever, quebrar em cenas e renderizar um vídeo final. Se der erro, você já volta com contexto do ponto em que o pipeline falhou.
                </p>
              </div>
              <div style={{ padding: '10px 12px', borderRadius: 12, background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.16)', color: '#bbf7d0', fontSize: 12, fontWeight: 700 }}>
                Arquivo pronto para envio
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12, marginBottom: 18 }}>
              <div style={{ padding: '14px 16px', borderRadius: 12, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <p style={{ margin: '0 0 6px', fontSize: 12, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Arquivo</p>
                <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#fff' }}>{selectedFile.name}</p>
              </div>
              <div style={{ padding: '14px 16px', borderRadius: 12, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <p style={{ margin: '0 0 6px', fontSize: 12, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Peso</p>
                <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#fff' }}>{(selectedFile.size / 1024 / 1024).toFixed(1)} MB</p>
              </div>
              <div style={{ padding: '14px 16px', borderRadius: 12, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <p style={{ margin: '0 0 6px', fontSize: 12, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Próxima etapa</p>
                <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#fff' }}>Upload e transcrição</p>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 10, marginBottom: 18 }}>
              {[
                'O arquivo será enviado ao backend do EloCut.',
                'A transcrição vai gerar os blocos editáveis.',
                'O sistema tentará remover silêncio, erro e repetição.',
                'O andamento ficará visível na etapa de acompanhamento.',
              ].map((item) => (
                <div
                  key={item}
                  style={{
                    padding: '12px 14px',
                    borderRadius: 12,
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid rgba(255,255,255,0.06)',
                    color: '#d1d5db',
                    fontSize: 13,
                    lineHeight: 1.45,
                  }}
                >
                  {item}
                </div>
              ))}
            </div>

            {errorMessage && (
              <div style={{ marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8, color: '#fca5a5', fontSize: 13, padding: '10px 14px', backgroundColor: 'rgba(127,29,29,0.22)', borderRadius: 10, border: '1px solid rgba(248,113,113,0.22)' }}>
                <AlertCircle size={16} />
                {errorMessage}
              </div>
            )}

            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <button
                onClick={handleStartProcessing}
                style={{
                  flex: 1,
                  minWidth: 240,
                  padding: '14px',
                  background: 'linear-gradient(135deg, #7c3aed, #a855f7)',
                  border: 'none',
                  borderRadius: 10,
                  color: '#fff',
                  fontWeight: 700,
                  fontSize: 15,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                }}
              >
                <Play size={18} />
                Confirmar e iniciar pipeline
              </button>
              <button
                onClick={() => {
                  setSelectedFile(null);
                  setErrorMessage(null);
                  if (fileInputRef.current) fileInputRef.current.value = '';
                }}
                style={{
                  padding: '14px 18px',
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 10,
                  color: '#d1d5db',
                  fontWeight: 600,
                  fontSize: 14,
                  cursor: 'pointer',
                }}
              >
                Trocar vídeo
              </button>
            </div>
          </div>
        )}

        {/* Progress Steps */}
        {status !== 'idle' && (
          <div style={{ marginBottom: 32, padding: '24px', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 16, border: '1px solid rgba(255,255,255,0.07)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
              {STEP_CONFIG.map((step, index) => {
                const StepIcon = step.icon;
                const isDone = currentStepIndex > index || status === 'complete';
                const isActive = currentStepIndex === index;
                const isPending = currentStepIndex < index;

                return (
                  <div key={step.key} style={{ flex: 1, textAlign: 'center' }}>
                    <div style={{
                      width: 44,
                      height: 44,
                      borderRadius: '50%',
                      margin: '0 auto 8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: isDone ? '#7c3aed' : isActive ? 'rgba(124,58,237,0.2)' : 'rgba(255,255,255,0.05)',
                      border: `2px solid ${isDone ? '#7c3aed' : isActive ? '#7c3aed' : 'rgba(255,255,255,0.1)'}`,
                      transition: 'all 0.3s ease',
                    }}>
                      {isDone ? (
                        <CheckCircle size={20} color="#fff" />
                      ) : isActive ? (
                        <Loader2 size={20} color="#a855f7" style={{ animation: 'spin 1s linear infinite' }} />
                      ) : (
                        <StepIcon size={20} color={isPending ? '#4b5563' : '#a855f7'} />
                      )}
                    </div>
                    <p style={{ margin: '0 0 2px', fontSize: 12, fontWeight: 600, color: isDone || isActive ? '#e5e7eb' : '#4b5563' }}>
                      {step.label}
                    </p>
                    <p style={{ margin: 0, fontSize: 10, color: '#6b7280' }}>{step.description}</p>
                  </div>
                );
              })}
            </div>

            {/* Render progress bar */}
            {status === 'rendering' && (
              <div style={{ marginTop: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 12, color: '#9ca3af' }}>
                  <span>Renderizando cenas...</span>
                  <span>{renderProgress}%</span>
                </div>
                <div style={{ height: 6, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{
                    height: '100%',
                    width: `${renderProgress}%`,
                    background: 'linear-gradient(90deg, #7c3aed, #a855f7)',
                    borderRadius: 3,
                    transition: 'width 0.5s ease',
                  }} />
                </div>
              </div>
            )}

            {(status === 'complete' || Boolean(projectData?.downloadReady)) && (
              <div style={{ marginTop: 16, display: 'flex', gap: 10 }}>
                <button
                  onClick={handleDownload}
                  disabled={!projectData?.downloadReady}
                  style={{
                    flex: 1,
                    padding: '12px',
                    background: projectData?.downloadReady
                      ? 'linear-gradient(135deg, #059669, #10b981)'
                      : 'rgba(255,255,255,0.08)',
                    border: 'none',
                    borderRadius: 8,
                    color: projectData?.downloadReady ? '#fff' : '#9ca3af',
                    fontWeight: 700,
                    fontSize: 14,
                    cursor: projectData?.downloadReady ? 'pointer' : 'not-allowed',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                  }}
                >
                  <Download size={16} />
                  Baixar Vídeo Editado
                </button>
                <button
                  onClick={handleReset}
                  style={{
                    padding: '12px 20px',
                    background: 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 8,
                    color: '#9ca3af',
                    fontWeight: 600,
                    fontSize: 14,
                    cursor: 'pointer',
                  }}
                >
                  Novo Projeto
                </button>
              </div>
            )}

            {status === 'error' && (
              <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#f87171', fontSize: 14, padding: '10px 14px', backgroundColor: 'rgba(248,113,113,0.1)', borderRadius: 8 }}>
                  <AlertCircle size={16} />
                  {errorMessage || 'Ocorreu um erro durante o processamento.'}
                </div>
                <button
                  onClick={handleReset}
                  style={{
                    padding: '10px',
                    background: 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 8,
                    color: '#9ca3af',
                    fontWeight: 600,
                    fontSize: 14,
                    cursor: 'pointer',
                  }}
                >
                  Tentar Novamente
                </button>
              </div>
            )}
          </div>
        )}

        {/* Scene Preview */}
        {projectData && projectData.scenes.length > 0 && (
          <div style={{ marginBottom: 32 }}>
            <h2 style={{ margin: '0 0 16px', fontSize: 18, fontWeight: 700, color: '#e5e7eb' }}>
              Cenas Detectadas ({projectData.scenes.length})
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {projectData.scenes.map((scene, index) => (
                <div
                  key={scene.id}
                  style={{
                    borderRadius: 12,
                    border: '1px solid rgba(255,255,255,0.07)',
                    overflow: 'hidden',
                    backgroundColor: 'rgba(255,255,255,0.02)',
                  }}
                >
                  {/* Scene header bar */}
                  <div style={{
                    height: 4,
                    background: `linear-gradient(90deg, ${scene.backgroundColor}, ${scene.accentColor})`,
                  }} />
                  <div style={{ padding: '16px 20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ width: 22, height: 22, borderRadius: '50%', backgroundColor: scene.accentColor, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#fff', flexShrink: 0 }}>
                          {index + 1}
                        </span>
                        <span style={{ fontWeight: 700, fontSize: 15, color: '#e5e7eb' }}>{scene.title}</span>
                        <span style={{
                          fontSize: 11,
                          fontWeight: 600,
                          padding: '2px 8px',
                          borderRadius: 100,
                          backgroundColor: `${scene.accentColor}22`,
                          color: scene.accentColor,
                          border: `1px solid ${scene.accentColor}44`,
                        }}>
                          {STYLE_LABELS[scene.visualStyle] || scene.visualStyle}
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#6b7280', fontSize: 12, flexShrink: 0 }}>
                        <Clock size={12} />
                        {formatTime(scene.startTime)} – {formatTime(scene.endTime)}
                      </div>
                    </div>

                    <p style={{ margin: '0 0 10px', color: '#9ca3af', fontSize: 13, lineHeight: 1.5 }}>
                      {scene.description}
                    </p>

                    <p style={{ margin: '0 0 10px', color: '#6b7280', fontSize: 12, fontStyle: 'italic', lineHeight: 1.4 }}>
                      "{scene.transcript}"
                    </p>

                    {scene.keywords.length > 0 && (
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                        <Tag size={12} color="#4b5563" />
                        {scene.keywords.map((kw, ki) => (
                          <span
                            key={ki}
                            style={{
                              fontSize: 11,
                              padding: '2px 8px',
                              borderRadius: 6,
                              backgroundColor: 'rgba(255,255,255,0.05)',
                              color: '#9ca3af',
                              border: '1px solid rgba(255,255,255,0.08)',
                            }}
                          >
                            {kw}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Transcription preview */}
        {projectData && projectData.transcription.length > 0 && (
          <div>
            <h2 style={{ margin: '0 0 16px', fontSize: 18, fontWeight: 700, color: '#e5e7eb' }}>
              Transcrição Completa
            </h2>
            <div style={{
              maxHeight: 280,
              overflowY: 'auto',
              padding: '16px 20px',
              backgroundColor: 'rgba(255,255,255,0.02)',
              borderRadius: 12,
              border: '1px solid rgba(255,255,255,0.07)',
            }}>
              {projectData.transcription.map((seg, i) => (
                <div key={i} style={{ display: 'flex', gap: 12, marginBottom: 10 }}>
                  <span style={{ flexShrink: 0, fontSize: 11, color: '#4b5563', fontFamily: 'monospace', paddingTop: 1 }}>
                    {formatTime(seg.start)}
                  </span>
                  <span style={{ fontSize: 13, color: '#d1d5db', lineHeight: 1.5 }}>{seg.text}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Spinner animation styles */}
        <style>{`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    </div>
  );
};

export default EloCutView;

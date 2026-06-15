import React, { useEffect, useRef, useState } from 'react';
import {
  CheckCircle2,
  Loader2,
  Sparkles,
  Play,
  XCircle,
  Scissors,
  FileText,
  Layers,
} from 'lucide-react';
import type { EditAIVideoProject, EditAIProjectStatus } from '../../types';
import { View } from '../../types';

interface Props {
  projectId: string;
  onNavigate: (view: View, projectId?: string) => void;
}

// All statuses that belong to this view (post-cut-approval pipeline)
const POST_CUT_STATUSES: EditAIProjectStatus[] = [
  'awaiting_approval', // just arrived from CutReport, cuts not yet applied
  'cutting',           // FFmpeg running
  'planning',          // OpenAI generating plan text
  'awaiting_plan',     // plan ready, waiting for user
  'analyzing',         // OpenAI generating scenes
  'ready',             // scenes done, ready to render
];

type PipelineStep = {
  id: string;
  label: string;
  sublabel: string;
  icon: React.ElementType;
  activeStatuses: EditAIProjectStatus[];
  doneStatuses: EditAIProjectStatus[];
};

const STEPS: PipelineStep[] = [
  {
    id: 'cuts',
    label: 'Aplicando cortes',
    sublabel: 'FFmpeg — removendo silêncios e gaguejos',
    icon: Scissors,
    activeStatuses: ['awaiting_approval', 'cutting'],
    doneStatuses: ['planning', 'awaiting_plan', 'analyzing', 'ready', 'rendering', 'done'],
  },
  {
    id: 'plan',
    label: 'Plano visual',
    sublabel: 'IA analisa conteúdo e propõe estrutura de cenas',
    icon: FileText,
    activeStatuses: ['planning'],
    doneStatuses: ['awaiting_plan', 'analyzing', 'ready', 'rendering', 'done'],
  },
  {
    id: 'scenes',
    label: 'Gerando cenas',
    sublabel: 'IA cria JSON de cenas com índices de palavras',
    icon: Layers,
    activeStatuses: ['analyzing'],
    doneStatuses: ['ready', 'rendering', 'done'],
  },
];

function getStepState(
  step: PipelineStep,
  status: EditAIProjectStatus,
): 'pending' | 'active' | 'done' | 'gate' {
  if (step.doneStatuses.includes(status)) return 'done';
  if (step.activeStatuses.includes(status)) return 'active';
  if (step.id === 'plan' && status === 'awaiting_plan') return 'gate';
  return 'pending';
}

const STATUS_MESSAGES: Partial<Record<EditAIProjectStatus, string>> = {
  awaiting_approval: 'Iniciando processamento dos cortes aprovados...',
  cutting: 'Aplicando cortes no vídeo com FFmpeg...',
  planning: 'IA está analisando o conteúdo e criando o plano visual...',
  awaiting_plan: 'Plano pronto — revise e aprove para continuar.',
  analyzing: 'Gerando estrutura de cenas com GPT-4o...',
  ready: 'Tudo pronto para renderização!',
  error: 'Ocorreu um erro no pipeline.',
};

export const EditAIPlanApproval: React.FC<Props> = ({ projectId, onNavigate }) => {
  const [project, setProject] = useState<EditAIVideoProject | null>(null);
  const [planText, setPlanText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const planTextInitialized = useRef(false);

  useEffect(() => {
    planTextInitialized.current = false;
  }, [projectId]);

  useEffect(() => {
    const poll = async () => {
      try {
        const res = await fetch(`/api/editai/project/${projectId}`);
        if (!res.ok) return;
        const data: EditAIVideoProject = await res.json();
        setProject(data);

        // Only set planText once when it first arrives
        if (data.planText && !planTextInitialized.current) {
          setPlanText(data.planText);
          planTextInitialized.current = true;
        }

        if (data.status === 'done') {
          clearInterval(intervalRef.current!);
          onNavigate(View.EDIT_AI_REVIEW, projectId);
          return;
        }

        // Stop polling once ready (user action required)
        if (data.status === 'ready' || data.status === 'awaiting_plan' || data.status === 'error') {
          clearInterval(intervalRef.current!);
          intervalRef.current = null;
        }
      } catch {
        // silently retry on network error
      }
    };

    poll();
    intervalRef.current = setInterval(poll, 2000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [projectId]);

  // Resume polling when leaving a gate state (user clicked approve)
  const resumePolling = () => {
    if (!intervalRef.current) {
      intervalRef.current = setInterval(async () => {
        try {
          const res = await fetch(`/api/editai/project/${projectId}`);
          if (!res.ok) return;
          const data: EditAIVideoProject = await res.json();
          setProject(data);
          if (data.planText && !planTextInitialized.current) {
            setPlanText(data.planText);
            planTextInitialized.current = true;
          }
          if (['ready', 'awaiting_plan', 'error', 'done'].includes(data.status)) {
            clearInterval(intervalRef.current!);
            intervalRef.current = null;
            if (data.status === 'done') onNavigate(View.EDIT_AI_REVIEW, projectId);
          }
        } catch { /* retry */ }
      }, 2000);
    }
  };

  const handleApprovePlan = async () => {
    setSubmitting(true);
    try {
      await fetch(`/api/editai/project/${projectId}/plan/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planText }),
      });
      resumePolling();
    } finally {
      setSubmitting(false);
    }
  };

  const handleRender = async () => {
    await fetch(`/api/editai/project/${projectId}/render`, { method: 'POST' });
    onNavigate(View.EDIT_AI_RENDER, projectId);
  };

  const currentStatus = project?.status ?? 'awaiting_approval';
  const isProcessing = ['awaiting_approval', 'cutting', 'planning', 'analyzing'].includes(currentStatus);
  const isGate = currentStatus === 'awaiting_plan';
  const isReady = currentStatus === 'ready';
  const isError = currentStatus === 'error';

  return (
    <div style={{ background: '#050508', minHeight: '100vh', padding: '40px 48px' }}>
      <div style={{ maxWidth: 800, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 32 }}>
          <Sparkles size={20} style={{ color: '#FFB800' }} />
          <h2 style={{ fontFamily: 'DM Sans, sans-serif', color: '#F0F0F0', fontSize: 20, fontWeight: 700, margin: 0 }}>
            {isReady ? 'Pronto para renderizar' : isGate ? 'Revise o plano visual' : 'Processando pipeline IA'}
          </h2>
        </div>

        {/* Pipeline stepper */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0, marginBottom: 40 }}>
          {STEPS.map((step, i) => {
            const state = getStepState(step, currentStatus);
            const isLast = i === STEPS.length - 1;
            const Icon = step.icon;

            return (
              <div key={step.id}>
                <div style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 16,
                  padding: '14px 20px',
                  background: state === 'active' ? '#FFB80010'
                    : state === 'gate' ? '#1A1A2E'
                    : '#0D0D14',
                  border: `1px solid ${
                    state === 'active' ? '#FFB80044'
                    : state === 'done' ? '#4CAF5033'
                    : state === 'gate' ? '#FFB80066'
                    : '#1A1A2E'
                  }`,
                  borderRadius: 10,
                  opacity: state === 'pending' ? 0.35 : 1,
                  transition: 'all 0.3s',
                }}>
                  {/* Status icon */}
                  <div style={{
                    width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: state === 'done' ? '#4CAF5022'
                      : state === 'active' ? '#FFB80022'
                      : '#1A1A2E',
                    marginTop: 2,
                  }}>
                    {state === 'done'
                      ? <CheckCircle2 size={18} style={{ color: '#4CAF50' }} />
                      : state === 'active'
                      ? <Loader2 size={18} style={{ color: '#FFB800', animation: 'spin 0.8s linear infinite' }} />
                      : <Icon size={16} style={{ color: state === 'gate' ? '#FFB800' : '#8888AA' }} />
                    }
                  </div>

                  {/* Text */}
                  <div style={{ flex: 1 }}>
                    <p style={{
                      fontFamily: 'DM Sans, sans-serif',
                      fontWeight: 600,
                      fontSize: 14,
                      color: state === 'active' ? '#FFB800'
                        : state === 'done' ? '#4CAF50'
                        : state === 'gate' ? '#F0F0F0'
                        : '#8888AA',
                      margin: 0,
                    }}>
                      {step.label}
                      {state === 'gate' && (
                        <span style={{ marginLeft: 8, fontFamily: 'DM Mono, monospace', fontSize: 10, color: '#FFB800', background: '#FFB80022', padding: '2px 6px', borderRadius: 4 }}>
                          AGUARDA APROVAÇÃO
                        </span>
                      )}
                    </p>
                    <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 12, color: '#8888AA', margin: '2px 0 0' }}>
                      {step.sublabel}
                    </p>
                  </div>
                </div>

                {/* Connector line */}
                {!isLast && (
                  <div style={{ marginLeft: 37, width: 2, height: 8, background: '#1A1A2E' }} />
                )}
              </div>
            );
          })}
        </div>

        {/* Current status message */}
        {(isProcessing || isError) && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '12px 20px',
            background: isError ? '#EF444422' : '#FFB80011',
            border: `1px solid ${isError ? '#EF444444' : '#FFB80033'}`,
            borderRadius: 8,
            marginBottom: 24,
          }}>
            {isError
              ? <XCircle size={16} style={{ color: '#EF4444', flexShrink: 0 }} />
              : <Loader2 size={16} style={{ color: '#FFB800', animation: 'spin 0.8s linear infinite', flexShrink: 0 }} />
            }
            <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 13, color: isError ? '#EF4444' : '#FFB800' }}>
              {isError && project?.error ? project.error : (STATUS_MESSAGES[currentStatus] ?? 'Processando...')}
            </span>
            {isProcessing && (
              <span style={{ marginLeft: 'auto', fontFamily: 'DM Mono, monospace', fontSize: 10, color: '#8888AA' }}>
                {currentStatus}
              </span>
            )}
          </div>
        )}

        {/* GATE: Plan text editor */}
        {isGate && (
          <div>
            <p style={{ color: '#8888AA', fontFamily: 'DM Sans, sans-serif', fontSize: 13, margin: '0 0 12px' }}>
              Revise o plano proposto pela IA. Pode editar livremente antes de aprovar — este texto guia a geração de cenas.
            </p>
            <textarea
              value={planText}
              onChange={(e) => setPlanText(e.target.value)}
              style={{
                width: '100%',
                minHeight: 280,
                background: '#0D0D14',
                border: '1px solid #1A1A2E',
                borderRadius: 10,
                padding: '16px 20px',
                fontFamily: 'DM Sans, sans-serif',
                fontSize: 13,
                color: '#F0F0F0',
                lineHeight: 1.75,
                resize: 'vertical',
                outline: 'none',
                boxSizing: 'border-box',
              }}
              onFocus={(e) => { e.currentTarget.style.borderColor = '#FFB80066'; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = '#1A1A2E'; }}
            />
            <button
              disabled={submitting || !planText.trim()}
              onClick={handleApprovePlan}
              style={{
                marginTop: 12,
                width: '100%',
                padding: '14px 0',
                background: !submitting && planText.trim() ? '#FFB800' : '#1A1A2E',
                color: !submitting && planText.trim() ? '#050508' : '#8888AA',
                border: 'none',
                borderRadius: 10,
                fontFamily: 'DM Sans, sans-serif',
                fontWeight: 700,
                fontSize: 15,
                cursor: !submitting && planText.trim() ? 'pointer' : 'not-allowed',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                transition: 'all 0.15s',
              }}
            >
              {submitting
                ? <><Loader2 size={16} style={{ animation: 'spin 0.8s linear infinite' }} /> Aprovando e gerando cenas...</>
                : <><CheckCircle2 size={16} /> Aprovar Plano e Gerar Cenas</>
              }
            </button>
          </div>
        )}

        {/* READY: Scene list + render button */}
        {isReady && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20, color: '#4CAF50' }}>
              <CheckCircle2 size={18} />
              <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 14, fontWeight: 600 }}>
                {project?.scenes?.length ?? 0} cenas geradas com sucesso
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 24 }}>
              {(project?.scenes ?? []).map((scene) => (
                <div key={scene.id} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  background: '#0D0D14',
                  border: '1px solid #1A1A2E',
                  borderRadius: 8,
                  padding: '10px 14px',
                }}>
                  <span style={{
                    fontFamily: 'DM Mono, monospace',
                    fontSize: 11,
                    color: '#FFB800',
                    background: '#FFB80022',
                    padding: '2px 7px',
                    borderRadius: 4,
                    flexShrink: 0,
                    minWidth: 32,
                    textAlign: 'center',
                  }}>
                    {scene.tipo}
                  </span>
                  <span style={{ fontFamily: 'DM Mono, monospace', fontSize: 10, color: '#8888AA', flexShrink: 0 }}>
                    f{scene.frame_inicio}–{scene.frame_fim}
                  </span>
                  <span style={{
                    fontFamily: 'DM Sans, sans-serif',
                    fontSize: 13,
                    color: '#F0F0F0',
                    flex: 1,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}>
                    {String(Object.values(scene.conteudo)[0] ?? '')}
                  </span>
                </div>
              ))}
            </div>

            <button
              onClick={handleRender}
              style={{
                width: '100%',
                padding: '16px 0',
                background: '#FFB800',
                color: '#050508',
                border: 'none',
                borderRadius: 10,
                fontFamily: 'DM Sans, sans-serif',
                fontWeight: 700,
                fontSize: 16,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 10,
                boxShadow: '0 0 32px #FFB80044',
              }}
            >
              <Play size={18} /> Renderizar Vídeo Final
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

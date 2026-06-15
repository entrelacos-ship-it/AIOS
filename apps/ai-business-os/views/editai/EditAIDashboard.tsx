import React, { useEffect, useState } from 'react';
import { UploadCloud, Loader2, CheckCircle2, XCircle, Clock, Film, Trash2 } from 'lucide-react';
import type { EditAIVideoProject, EditAIProjectStatus } from '../../types';
import { View } from '../../types';

interface Props {
  onNavigate: (view: View, projectId?: string) => void;
}

const STATUS_LABELS: Record<EditAIProjectStatus, string> = {
  uploading: 'Enviando',
  normalizing: 'Normalizando',
  transcribing: 'Transcrevendo',
  cutting: 'Detectando cortes',
  awaiting_approval: 'Aguarda aprovação de cortes',
  planning: 'Gerando plano visual',
  awaiting_plan: 'Aguarda aprovação do plano',
  analyzing: 'Gerando cenas',
  ready: 'Pronto para renderizar',
  rendering: 'Renderizando',
  done: 'Concluído',
  error: 'Erro',
};

const StatusDot: React.FC<{ status: EditAIProjectStatus }> = ({ status }) => {
  if (status === 'done') return <CheckCircle2 size={16} className="text-green-400" />;
  if (status === 'error') return <XCircle size={16} className="text-red-400" />;
  if (['awaiting_approval', 'awaiting_plan', 'ready'].includes(status)) {
    return <Clock size={16} className="text-yellow-400" />;
  }
  return <Loader2 size={16} className="text-[#FFB800] animate-spin" />;
};

export const EditAIDashboard: React.FC<Props> = ({ onNavigate }) => {
  const [projects, setProjects] = useState<EditAIVideoProject[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/editai/history')
      .then((r) => r.json())
      .then((data) => setProjects(data.projects ?? []))
      .finally(() => setLoading(false));
  }, []);

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Remover este projeto e seus arquivos?')) return;
    await fetch(`/api/editai/project/${id}`, { method: 'DELETE' });
    setProjects((prev) => prev.filter((p) => p.id !== id));
  };

  const openProject = (project: EditAIVideoProject) => {
    const statusToView: Partial<Record<EditAIProjectStatus, View>> = {
      awaiting_approval: View.EDIT_AI_CUT_REPORT,
      awaiting_plan: View.EDIT_AI_PLAN_APPROVAL,
      planning: View.EDIT_AI_PLAN_APPROVAL,
      analyzing: View.EDIT_AI_PLAN_APPROVAL,
      ready: View.EDIT_AI_PLAN_APPROVAL,
      rendering: View.EDIT_AI_RENDER,
      done: View.EDIT_AI_REVIEW,
    };
    const view = statusToView[project.status] ?? View.EDIT_AI_TRANSCRIBE;
    onNavigate(view, project.id);
  };

  return (
    <div className="relative flex flex-col h-full p-8 gap-7 overflow-hidden" style={{ background: '#0A0A0F', minHeight: '100vh' }}>
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_25%_0%,rgba(107,70,193,0.25),transparent_48%),radial-gradient(ellipse_at_85%_12%,rgba(249,115,22,0.13),transparent_34%)]" />
      <div className="relative flex items-center justify-between">
        <div>
          <p className="text-[11px] font-mono uppercase tracking-[0.18em] text-[#14B8A6] mb-2">
            /// EDITOR AUTOMATIZADO
          </p>
          <h1 style={{ fontFamily: 'Syne, DM Sans, sans-serif', color: '#F8FAFC', fontSize: 34, fontWeight: 800, margin: 0 }}>
            EditAI
          </h1>
          <p style={{ color: '#CBD5E1', fontSize: 14, margin: '6px 0 0', fontFamily: 'DM Sans, sans-serif' }}>
            Estrutura também é cuidado: revise cortes, cenas e render em um workspace único.
          </p>
        </div>
        <button
          onClick={() => onNavigate(View.EDIT_AI_UPLOAD)}
          style={{
            background: 'linear-gradient(135deg, #6B46C1, #F97316)',
            color: '#FFFFFF',
            border: 'none',
            borderRadius: 999,
            padding: '13px 24px',
            fontFamily: 'DM Sans, sans-serif',
            fontWeight: 700,
            fontSize: 14,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            boxShadow: '0 12px 36px rgba(107,70,193,0.35)',
          }}
        >
          <UploadCloud size={18} />
          Novo Projeto
        </button>
      </div>

      {loading ? (
        <div className="relative flex items-center gap-3" style={{ color: '#CBD5E1' }}>
          <Loader2 size={18} className="animate-spin text-[#8B5CF6]" />
          <span style={{ fontFamily: 'DM Sans, sans-serif' }}>Carregando projetos...</span>
        </div>
      ) : projects.length === 0 ? (
        <div
          className="relative rounded-3xl border border-white/[0.08] bg-white/[0.045] backdrop-blur-xl shadow-[0_18px_60px_rgba(0,0,0,0.35)]"
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 16,
            flex: 1,
            color: '#CBD5E1',
            minHeight: 420,
          }}
        >
          <Film size={52} style={{ color: '#8B5CF6', opacity: 0.8 }} />
          <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 16, margin: 0, color: '#F8FAFC' }}>
            Nenhum projeto ainda.
          </p>
          <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 13, margin: 0 }}>
            Suba um vídeo e deixe a IA montar a primeira versão para revisão.
          </p>
        </div>
      ) : (
        <div className="relative" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {projects.map((project) => (
            <div
              key={project.id}
              onClick={() => openProject(project)}
              style={{
                background: 'rgba(255,255,255,0.045)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 18,
                padding: '20px 24px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 16,
                transition: 'border-color 0.15s',
                boxShadow: '0 12px 36px rgba(0,0,0,0.24)',
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(249,115,22,0.55)'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(255,255,255,0.08)'; }}
            >
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#6B46C1] to-[#F97316] flex items-center justify-center shadow-[0_10px_28px_rgba(107,70,193,0.35)]">
                <Film size={20} style={{ color: '#FFFFFF', flexShrink: 0 }} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 700, fontSize: 16, color: '#F8FAFC', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {project.title || project.sourceFileName}
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                  <StatusDot status={project.status} />
                  <span style={{ fontFamily: 'DM Mono, monospace', fontSize: 12, color: '#CBD5E1' }}>
                    {STATUS_LABELS[project.status]}
                  </span>
                </div>
              </div>
              <span style={{ fontFamily: 'DM Mono, monospace', fontSize: 11, color: '#CBD5E1', flexShrink: 0 }}>
                {new Date(project.createdAt).toLocaleDateString('pt-BR')}
              </span>
              <button
                onClick={(e) => handleDelete(project.id, e)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#8888AA', padding: 4, borderRadius: 6 }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = '#EF4444'; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = '#8888AA'; }}
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

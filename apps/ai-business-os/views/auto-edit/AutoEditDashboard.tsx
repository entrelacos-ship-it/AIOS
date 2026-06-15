import React, { useEffect, useState } from 'react';
import { Plus, Trash2, Film, CheckCircle2, Loader2, AlertCircle, Clock } from 'lucide-react';
import type { AutoEditProject } from '../../types';
import { View } from '../../types';

interface Props {
  onNavigate: (view: View, meta?: { projectId?: string }) => void;
}

const STAGE_LABELS: Record<string, string> = {
  idle: 'Aguardando',
  normalizing: 'Normalizando',
  transcribing: 'Transcrevendo',
  planning: 'Planejando cortes',
  cutting: 'Cortando',
  captioning: 'Legendas',
  metadata: 'Metadados',
  shorts: 'Shorts',
  done: 'Pronto',
  error: 'Erro',
};

function StageChip({ stage }: { stage: string }) {
  const colorMap: Record<string, string> = {
    idle: 'bg-gray-500/20 text-gray-400',
    done: 'bg-emerald-500/20 text-emerald-400',
    error: 'bg-red-500/20 text-red-400',
  };
  const color = colorMap[stage] ?? 'bg-rose-500/20 text-rose-400';
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${color}`}>
      {stage === 'done' && <CheckCircle2 className="w-2.5 h-2.5" />}
      {stage === 'error' && <AlertCircle className="w-2.5 h-2.5" />}
      {stage !== 'done' && stage !== 'error' && stage !== 'idle' && <Loader2 className="w-2.5 h-2.5 animate-spin" />}
      {stage === 'idle' && <Clock className="w-2.5 h-2.5" />}
      {STAGE_LABELS[stage] ?? stage}
    </span>
  );
}

export const AutoEditDashboard: React.FC<Props> = ({ onNavigate }) => {
  const [projects, setProjects] = useState<AutoEditProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/auto-edit');
      const data = await res.json() as { projects: AutoEditProject[] };
      setProjects(data.projects ?? []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, []);

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeleting(id);
    try {
      await fetch(`/api/auto-edit/${id}`, { method: 'DELETE' });
      setProjects((prev) => prev.filter((p) => p.id !== id));
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">AutoEdit</h1>
          <p className="text-gray-500 text-sm mt-0.5">Pipeline automático de edição por IA — cortes, legendas e metadados</p>
        </div>
        <button
          onClick={() => onNavigate(View.AUTO_EDIT_UPLOAD)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-sm font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          Novo Projeto
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-40">
          <Loader2 className="w-6 h-6 text-rose-400 animate-spin" />
        </div>
      ) : projects.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-60 gap-4 text-center border border-dashed border-[#1a1a1a] rounded-2xl">
          <div className="w-14 h-14 rounded-full bg-rose-500/10 flex items-center justify-center">
            <Film className="w-7 h-7 text-rose-400" />
          </div>
          <div>
            <p className="text-white font-medium">Nenhum projeto ainda</p>
            <p className="text-gray-500 text-sm mt-1">Faça upload de um vídeo para começar</p>
          </div>
          <button
            onClick={() => onNavigate(View.AUTO_EDIT_UPLOAD)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-sm font-medium transition-colors"
          >
            <Plus className="w-4 h-4" />
            Criar Projeto
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {projects.map((p) => (
            <button
              key={p.id}
              onClick={() => onNavigate(View.AUTO_EDIT_WORKSPACE, { projectId: p.id })}
              className="text-left bg-[#0d0d0d] border border-[#1a1a1a] rounded-xl p-5 hover:border-rose-500/30 transition-all group"
            >
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-rose-500/10 flex items-center justify-center flex-shrink-0">
                  <Film className="w-5 h-5 text-rose-400" />
                </div>
                <button
                  onClick={(e) => handleDelete(p.id, e)}
                  disabled={deleting === p.id}
                  className="opacity-0 group-hover:opacity-100 p-1.5 text-gray-600 hover:text-red-400 transition-all rounded"
                >
                  {deleting === p.id
                    ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    : <Trash2 className="w-3.5 h-3.5" />
                  }
                </button>
              </div>

              <p className="text-white font-medium text-sm truncate mb-1">{p.title}</p>
              <p className="text-gray-600 text-[10px] truncate mb-3">{p.sourceFileName}</p>

              <div className="flex items-center justify-between">
                <StageChip stage={p.stage} />
                {p.stage === 'done' && p.metadata?.title && (
                  <p className="text-[10px] text-gray-600 truncate max-w-[120px]">{p.metadata.title}</p>
                )}
              </div>

              {p.stage === 'error' && p.error && (
                <p className="text-[10px] text-red-400 mt-2 truncate">{p.error}</p>
              )}

              <p className="text-[10px] text-gray-700 mt-2">
                {new Date(p.createdAt).toLocaleDateString('pt-BR')}
              </p>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

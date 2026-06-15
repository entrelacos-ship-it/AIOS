import React, { useEffect, useState } from 'react';
import {
  Plus, Play, Trash2, Users, Clock, CheckCircle, AlertCircle,
  Loader2, Zap, Sparkles, ChevronDown, ChevronRight, Eye,
} from 'lucide-react';
import type { Squad, SquadRun } from '../../types';
import { View } from '../../types';

interface Props {
  onNavigate: (view: View, meta?: { squadId?: string; runId?: string }) => void;
}

const STATUS_ICONS: Record<string, React.ReactNode> = {
  done: <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />,
  error: <AlertCircle className="w-3.5 h-3.5 text-red-400" />,
  running: <Loader2 className="w-3.5 h-3.5 text-cyan-400 animate-spin" />,
  waiting_input: <Zap className="w-3.5 h-3.5 text-amber-400" />,
  aborted: <AlertCircle className="w-3.5 h-3.5 text-gray-500" />,
};

const STATUS_LABELS: Record<string, string> = {
  done: 'Concluído',
  error: 'Erro',
  running: 'Executando',
  waiting_input: 'Aguardando',
  aborted: 'Cancelado',
  idle: 'Não iniciado',
};

const AGENT_COLORS = [
  'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
  'bg-violet-500/20 text-violet-300 border-violet-500/30',
  'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  'bg-amber-500/20 text-amber-300 border-amber-500/30',
  'bg-pink-500/20 text-pink-300 border-pink-500/30',
];

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return 'agora';
  if (min < 60) return `${min}min atrás`;
  const hrs = Math.floor(min / 60);
  if (hrs < 24) return `${hrs}h atrás`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d atrás`;
  return new Date(dateStr).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
}

export const SquadDashboard: React.FC<Props> = ({ onNavigate }) => {
  const [squads, setSquads] = useState<Squad[]>([]);
  const [runs, setRuns] = useState<SquadRun[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [expandedRunId, setExpandedRunId] = useState<string | null>(null);
  const [showAllRuns, setShowAllRuns] = useState(false);
  const [filterSquadId, setFilterSquadId] = useState<string | null>(null);
  const [savedSlides, setSavedSlides] = useState<Record<string, { id: number; filename: string; url: string; localUrl: string }[]>>({});

  const load = async () => {
    setLoading(true);
    try {
      const [sq, ru] = await Promise.all([
        fetch('/api/squads').then((r) => r.json()),
        fetch('/api/squads/runs').then((r) => r.json()),
      ]);
      setSquads(sq.squads ?? []);
      setRuns(ru.runs ?? []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, []);

  // Load saved slides (rendered design/carousel) preview when a finished run is expanded
  useEffect(() => {
    if (!expandedRunId) return;
    const run = runs.find((r) => r.id === expandedRunId);
    if (!run || run.status !== 'done' || savedSlides[expandedRunId] !== undefined) return;
    fetch(`/api/squads/runs/${expandedRunId}/saved-slides`)
      .then((r) => r.json())
      .then((data) => setSavedSlides((prev) => ({ ...prev, [expandedRunId]: data.slides ?? [] })))
      .catch(() => setSavedSlides((prev) => ({ ...prev, [expandedRunId]: [] })));
  }, [expandedRunId, runs, savedSlides]);


  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await fetch(`/api/squads/${id}`, { method: 'DELETE' });
      await load();
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 text-cyan-400 animate-spin" />
      </div>
    );
  }

  // Filtered runs
  const filteredRuns = filterSquadId ? runs.filter((r) => r.squadId === filterSquadId) : runs;
  const visibleRuns = showAllRuns ? filteredRuns : filteredRuns.slice(0, 12);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Squad Manager</h1>
          <p className="text-gray-500 text-sm mt-1">Orquestre agentes IA em pipelines colaborativos</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onNavigate(View.SQUAD_MANAGER_BUILDER)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-[#2a2a2a] hover:border-[#3a3a3a] text-gray-400 hover:text-gray-200 text-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            Manual
          </button>
          <button
            onClick={() => onNavigate(View.SQUAD_MANAGER_AI_WIZARD)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-sm font-medium transition-colors"
          >
            <Sparkles className="w-4 h-4" />
            Criar com IA
          </button>
        </div>
      </div>

      {/* Squads grid */}
      {squads.length === 0 ? (
        <div className="border border-dashed border-[#222] rounded-xl p-12 text-center">
          <Users className="w-10 h-10 text-gray-700 mx-auto mb-4" />
          <p className="text-gray-500 text-sm">Nenhum squad criado ainda.</p>
          <button
            onClick={() => onNavigate(View.SQUAD_MANAGER_AI_WIZARD)}
            className="mt-4 text-cyan-400 text-sm hover:text-cyan-300 transition-colors"
          >
            Criar primeiro squad com IA →
          </button>
        </div>
      ) : (
        <div>
          <h2 className="text-xs font-bold text-gray-600 uppercase tracking-widest mb-4">Squads</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {squads.map((squad) => {
              const squadRuns = runs.filter((r) => r.squadId === squad.id);
              const lastRun = squadRuns[0];
              const runCount = squadRuns.length;
              return (
                <div
                  key={squad.id}
                  className="bg-[#0d0d0d] border border-[#1a1a1a] rounded-xl p-5 hover:border-[#2a2a2a] transition-colors group"
                >
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-white font-semibold text-sm truncate">{squad.name}</h3>
                      <p className="text-gray-500 text-xs mt-1 line-clamp-2">{squad.description}</p>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => onNavigate(View.SQUAD_MANAGER_BUILDER, { squadId: squad.id })}
                        className="p-1.5 rounded-md hover:bg-white/5 text-gray-600 hover:text-gray-300 transition-colors"
                      >
                        <Users className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(squad.id)}
                        disabled={deletingId === squad.id}
                        className="p-1.5 rounded-md hover:bg-red-500/10 text-gray-600 hover:text-red-400 transition-colors disabled:opacity-40"
                      >
                        {deletingId === squad.id
                          ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          : <Trash2 className="w-3.5 h-3.5" />
                        }
                      </button>
                    </div>
                  </div>

                  {/* Agents */}
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {squad.agents.map((agent, i) => (
                      <span
                        key={agent.id}
                        className={`text-[10px] px-2 py-0.5 rounded-full border ${AGENT_COLORS[i % AGENT_COLORS.length]}`}
                      >
                        {agent.name}
                      </span>
                    ))}
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-[10px] text-gray-600">
                      {lastRun ? (
                        <>
                          {STATUS_ICONS[lastRun.status] ?? null}
                          <span>{STATUS_LABELS[lastRun.status] ?? lastRun.status}</span>
                          {runCount > 1 && <span className="text-gray-700">· {runCount} execuções</span>}
                        </>
                      ) : (
                        <>
                          <Clock className="w-3 h-3" />
                          <span>Nunca executado</span>
                        </>
                      )}
                    </div>
                    <div className="flex gap-1.5">
                      {runCount > 0 && (
                        <button
                          onClick={() => setFilterSquadId(filterSquadId === squad.id ? null : squad.id)}
                          className={`flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs transition-colors ${
                            filterSquadId === squad.id
                              ? 'bg-purple-600/20 text-purple-300 border border-purple-500/30'
                              : 'bg-white/5 hover:bg-white/10 text-gray-500 hover:text-gray-300'
                          }`}
                          title="Filtrar histórico por este squad"
                        >
                          <Clock className="w-3 h-3" />
                          {runCount}
                        </button>
                      )}
                      <button
                        onClick={() => onNavigate(View.SQUAD_MANAGER_RUN, { squadId: squad.id })}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-400 text-xs font-medium transition-colors"
                      >
                        <Play className="w-3 h-3" />
                        Executar
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Execution history — expanded */}
      {runs.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <h2 className="text-xs font-bold text-gray-600 uppercase tracking-widest">
                Histórico de Execuções
              </h2>
              <span className="text-[10px] text-gray-700 bg-white/5 px-2 py-0.5 rounded-full">
                {filteredRuns.length} {filteredRuns.length === 1 ? 'execução' : 'execuções'}
              </span>
              {filterSquadId && (
                <button
                  onClick={() => setFilterSquadId(null)}
                  className="text-[10px] text-purple-400 hover:text-purple-300 transition-colors"
                >
                  × Limpar filtro
                </button>
              )}
            </div>
          </div>

          <div className="space-y-2">
            {visibleRuns.map((run) => {
              const isExpanded = expandedRunId === run.id;
              const doneStages = run.stages.filter((s) => s.status === 'done');
              const lastStage = doneStages[doneStages.length - 1];
              // First 100 chars of last stage output as preview
              const outputPreview = lastStage?.output?.replace(/[#*_\n]/g, ' ').trim().slice(0, 120);
              const slidesForRun = savedSlides[run.id];

              return (
                <div
                  key={run.id}
                  className="bg-[#0d0d0d] border border-[#1a1a1a] rounded-xl overflow-hidden hover:border-[#2a2a2a] transition-colors"
                >
                  {/* Run header — always visible */}
                  <button
                    onClick={() => setExpandedRunId(isExpanded ? null : run.id)}
                    className="w-full flex items-center gap-4 px-4 py-3 text-left"
                  >
                    {STATUS_ICONS[run.status] ?? <Clock className="w-3.5 h-3.5 text-gray-600" />}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white truncate">{run.task}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] text-gray-600">{run.squadName}</span>
                        <span className="text-[10px] text-gray-700">·</span>
                        <span className="text-[10px] text-gray-600">{doneStages.length}/{run.stages.length} etapas</span>
                        <span className="text-[10px] text-gray-700">·</span>
                        <span className={`text-[10px] ${run.status === 'done' ? 'text-emerald-600' : run.status === 'error' ? 'text-red-600' : 'text-gray-600'}`}>
                          {STATUS_LABELS[run.status] ?? run.status}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      {/* Stage dots */}
                      <div className="flex items-center gap-0.5">
                        {run.stages.map((s, i) => (
                          <div
                            key={i}
                            className={`w-1.5 h-1.5 rounded-full ${
                              s.status === 'done' ? 'bg-emerald-400' :
                              s.status === 'error' ? 'bg-red-400' :
                              s.status === 'running' ? 'bg-cyan-400 animate-pulse' :
                              'bg-gray-700'
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-[10px] text-gray-600 tabular-nums w-16 text-right">
                        {timeAgo(run.createdAt)}
                      </span>
                      {isExpanded ? (
                        <ChevronDown className="w-3.5 h-3.5 text-gray-600" />
                      ) : (
                        <ChevronRight className="w-3.5 h-3.5 text-gray-600" />
                      )}
                    </div>
                  </button>

                  {/* Preview line — when collapsed, show last output preview */}
                  {!isExpanded && outputPreview && (
                    <div className="px-4 pb-3 -mt-1">
                      <p className="text-[11px] text-gray-700 truncate italic pl-8">{outputPreview}…</p>
                    </div>
                  )}

                  {/* Expanded: per-stage breakdown */}
                  {isExpanded && (
                    <div className="border-t border-[#1a1a1a] px-4 py-3 space-y-2">
                      {run.stages.map((stage, i) => {
                        const stagePreview = stage.output?.replace(/[#*_\n]/g, ' ').trim().slice(0, 200);
                        return (
                          <div key={i} className="group/stage">
                            <div className="flex items-center gap-2 py-1.5">
                              <span
                                className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                                style={{ background: stage.agentColor || '#06b6d4' }}
                              />
                              <span className="text-xs font-medium text-gray-300">{stage.agentName}</span>
                              <span className="text-[10px] text-gray-700">· {stage.agentRole}</span>
                              {stage.status === 'done' && <CheckCircle className="w-2.5 h-2.5 text-emerald-500 ml-auto flex-shrink-0" />}
                              {stage.status === 'error' && <AlertCircle className="w-2.5 h-2.5 text-red-500 ml-auto flex-shrink-0" />}
                              {stage.status === 'pending' && <span className="text-[10px] text-gray-700 ml-auto">pendente</span>}
                            </div>
                            {/* Stage output preview */}
                            {stagePreview && (
                              <div className="ml-5 mb-2 text-[11px] text-gray-600 leading-relaxed line-clamp-3">
                                {stagePreview}…
                              </div>
                            )}
                            {stage.userFeedback && (
                              <div className="ml-5 mb-2 text-[10px] text-amber-500/70 bg-amber-500/5 rounded px-2 py-1 inline-block">
                                Direção: {stage.userFeedback}
                              </div>
                            )}
                          </div>
                        );
                      })}

                      {/* Generated design / slides preview */}
                      {run.status === 'done' && (
                        <div className="pt-2 border-t border-[#111]">
                          {slidesForRun === undefined ? (
                            <p className="text-[11px] text-gray-700">Carregando design gerado...</p>
                          ) : slidesForRun.length > 0 ? (
                            <div className="space-y-2">
                              <p className="text-[10px] text-gray-600 uppercase tracking-wider font-semibold">
                                Design gerado · {slidesForRun.length} slides
                              </p>
                              <div className="flex gap-2 overflow-x-auto pb-1">
                                {slidesForRun.map((slide) => (
                                  <img
                                    key={slide.id}
                                    src={slide.localUrl}
                                    alt={slide.filename}
                                    className="h-20 w-auto rounded-lg border border-[#1a1a1a] flex-shrink-0"
                                  />
                                ))}
                              </div>
                            </div>
                          ) : (
                            <p className="text-[11px] text-gray-700">
                              Nenhum design/slide gerado ainda para esta execução. Abra a execução completa e clique em "Gerar Slides".
                            </p>
                          )}
                        </div>
                      )}

                      {/* Action: open full view */}
                      <div className="flex justify-end pt-2 border-t border-[#111]">
                        <button
                          onClick={() => onNavigate(View.SQUAD_MANAGER_RUN, { runId: run.id })}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-600/15 hover:bg-cyan-600/25 text-cyan-400 text-xs font-medium transition-colors"
                        >
                          <Eye className="w-3 h-3" />
                          Abrir execução completa
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Show more / less */}
          {filteredRuns.length > 12 && (
            <div className="flex justify-center pt-4">
              <button
                onClick={() => setShowAllRuns(!showAllRuns)}
                className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
              >
                {showAllRuns ? `Mostrar menos ↑` : `Ver todas as ${filteredRuns.length} execuções ↓`}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

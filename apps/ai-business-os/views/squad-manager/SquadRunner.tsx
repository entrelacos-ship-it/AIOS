import React, { useEffect, useRef, useState } from 'react';
import {
  ArrowLeft, Play, Send, CheckCircle, AlertCircle,
  Loader2, ChevronRight, RotateCcw, StopCircle, Images, Download,
  Eye,
} from 'lucide-react';
import type { Squad, SquadRun } from '../../types';
import { View } from '../../types';

interface Props {
  squadId?: string;
  runId?: string;
  onNavigate: (view: View) => void;
}

const STAGE_STATUS_LABEL: Record<string, string> = {
  pending: 'Aguardando',
  running: 'Processando...',
  waiting_input: 'Aguardando direção',
  done: 'Concluído',
  error: 'Erro',
};

// Parses SSE text into events
function parseSseChunk(raw: string): Array<{ event: string; data: unknown }> {
  const events: Array<{ event: string; data: unknown }> = [];
  const blocks = raw.split('\n\n');
  for (const block of blocks) {
    if (!block.trim()) continue;
    const lines = block.split('\n');
    let event = 'message';
    let data = '';
    for (const line of lines) {
      if (line.startsWith('event: ')) event = line.slice(7);
      else if (line.startsWith('data: ')) data = line.slice(6);
    }
    if (data) {
      try { events.push({ event, data: JSON.parse(data) }); }
      catch { events.push({ event, data }); }
    }
  }
  return events;
}

export const SquadRunner: React.FC<Props> = ({ squadId, runId: initialRunId, onNavigate }) => {
  const [squad, setSquad] = useState<Squad | null>(null);
  const [run, setRun] = useState<SquadRun | null>(null);
  const [task, setTask] = useState('');
  const [userInput, setUserInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [slides, setSlides] = useState<Array<{ id: number; filename: string; dataUrl: string }> | null>(null);
  const [savedSlideUrls, setSavedSlideUrls] = useState<string[] | null>(null);
  const [approvedSlides, setApprovedSlides] = useState<Set<number>>(new Set());
  const [caption, setCaption] = useState('');
  const [isRendering, setIsRendering] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishResult, setPublishResult] = useState<string | null>(null);
  const [renderError, setRenderError] = useState<string | null>(null);
  const [publishError, setPublishError] = useState<string | null>(null);
  const [streamingStage, setStreamingStage] = useState<number | null>(null);
  const [streamingText, setStreamingText] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const [renderProgress, setRenderProgress] = useState({ current: 0, total: 0 });
  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  // ── Tab-based navigation: which stage to display ──────────────────────
  const [selectedStageIdx, setSelectedStageIdx] = useState<number>(0);

  // Auto-select streaming stage when execution starts
  useEffect(() => {
    if (streamingStage !== null) setSelectedStageIdx(streamingStage);
  }, [streamingStage]);

  // Auto-select first stage with content when run loads
  useEffect(() => {
    if (run && !isExecuting && streamingStage === null) {
      // Select the latest completed/active stage
      const lastDone = [...run.stages].reverse().findIndex((s) => s.status === 'done' || s.status === 'running' || s.status === 'error');
      if (lastDone >= 0) setSelectedStageIdx(run.stages.length - 1 - lastDone);
    }
  }, [run?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Scroll to top when switching tabs
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = 0;
  }, [selectedStageIdx]);

  // Load squad / run
  useEffect(() => {
    const init = async () => {
      setLoading(true);
      try {
        if (initialRunId) {
          const r = await fetch(`/api/squads/runs/${initialRunId}`).then((res) => res.json());
          setRun(r);
          const sq = await fetch(`/api/squads/${r.squadId}`).then((res) => res.json());
          setSquad(sq);
          // Auto-load previously saved slides from disk
          if (r.status === 'done') {
            try {
              const savedRes = await fetch(`/api/squads/runs/${initialRunId}/saved-slides`).then((x) => x.json());
              if (savedRes.slides?.length > 0) {
                const loadedSlides = savedRes.slides.map((s: { id: number; filename: string; localUrl: string }) => ({
                  id: s.id,
                  filename: s.filename,
                  dataUrl: s.localUrl, // use localUrl for display
                }));
                setSlides(loadedSlides);
                setApprovedSlides(new Set(loadedSlides.map((s: { id: number }) => s.id)));
                setSavedSlideUrls(savedRes.slides.map((s: { url: string }) => s.url));
              }
            } catch { /* no saved slides — user can re-render */ }
          }
        } else if (squadId) {
          const sq = await fetch(`/api/squads/${squadId}`).then((res) => res.json());
          setSquad(sq);
        }
      } finally {
        setLoading(false);
      }
    };
    void init();
  }, [squadId, initialRunId]);

  const executeStage = async (runId: string, stageIndex: number, feedback?: string) => {
    setIsExecuting(true);
    setStreamingStage(stageIndex);
    setStreamingText('');
    setError(null);
    setSelectedStageIdx(stageIndex);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const res = await fetch(`/api/squads/runs/${runId}/stages/${stageIndex}/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userFeedback: feedback ?? '' }),
        signal: controller.signal,
      });

      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || 'Erro na execução.');
      }

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        const events = parseSseChunk(buffer);
        buffer = '';

        for (const { event, data } of events) {
          if (event === 'token') {
            const text = (data as { text?: string }).text ?? '';
            setStreamingText((prev) => prev + text);
          }
          if (event === 'done') {
            // Re-fetch updated run
            const updated = await fetch(`/api/squads/runs/${runId}`).then((r) => r.json());
            setRun(updated);
            setStreamingStage(null);
            setIsExecuting(false);
          }
          if (event === 'error') {
            throw new Error((data as { message?: string }).message || 'Erro na execução.');
          }
        }
      }
    } catch (err) {
      if ((err as Error).name === 'AbortError') return;
      setError(err instanceof Error ? err.message : 'Erro desconhecido.');
      setIsExecuting(false);
      setStreamingStage(null);
    }
  };

  const handleStart = async () => {
    if (!squad || !task.trim()) return;
    setError(null);
    const res = await fetch(`/api/squads/${squad.id}/runs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ task }),
    });
    const newRun: SquadRun = await res.json();
    setRun(newRun);
    setSelectedStageIdx(0);
    await executeStage(newRun.id, 0);
  };

  const handleAdvance = async () => {
    if (!run) return;
    const nextIdx = run.currentStageIndex + 1;
    if (nextIdx >= run.stages.length) return;
    await executeStage(run.id, nextIdx, userInput);
    setUserInput('');
  };

  const handleRetry = async () => {
    if (!run) return;
    await executeStage(run.id, run.currentStageIndex, userInput);
    setUserInput('');
  };

  const handleAbort = () => {
    abortRef.current?.abort();
    setIsExecuting(false);
    setStreamingStage(null);
  };

  const handleNewRun = () => {
    setRun(null);
    setTask('');
    setUserInput('');
    setError(null);
    setSlides(null);
    setSavedSlideUrls(null);
    setApprovedSlides(new Set());
    setCaption('');
    setRenderError(null);
    setPublishResult(null);
    setPublishError(null);
    setSelectedStageIdx(0);
  };

  const handleRenderSlides = async () => {
    if (!run) return;
    setIsRendering(true);
    setRenderError(null);
    setSlides(null);
    setSavedSlideUrls(null);
    setApprovedSlides(new Set());
    setRenderProgress({ current: 0, total: 0 });
    try {
      const startRes = await fetch(`/api/squads/runs/${run.id}/render-slides`, { method: 'POST' });
      const startText = await startRes.text();
      let startData: { jobId?: string; error?: string };
      try { startData = JSON.parse(startText); }
      catch { throw new Error(`Erro ao iniciar: ${startText.slice(0, 120)}`); }
      if (!startRes.ok || !startData.jobId) throw new Error(startData.error || 'Falha ao iniciar renderização.');

      // Poll for completion
      const jobId = startData.jobId;
      while (true) {
        await new Promise((r) => setTimeout(r, 2000));
        const poll = await fetch(`/api/squads/runs/${run.id}/render-slides/status/${jobId}`).then((r) => r.json()) as {
          status: string; progress: number; total: number;
          slides: Array<{ id: number; filename: string; dataUrl: string }>;
          error?: string;
        };
        setRenderProgress({ current: poll.progress, total: poll.total });
        if (poll.status === 'done') {
          setSlides(poll.slides);
          setApprovedSlides(new Set(poll.slides.map((s) => s.id)));
          break;
        }
        if (poll.status === 'error') throw new Error(poll.error || 'Erro na renderização.');
      }
    } catch (e) {
      setRenderError(e instanceof Error ? e.message : 'Erro ao renderizar slides.');
    } finally {
      setIsRendering(false);
      setRenderProgress({ current: 0, total: 0 });
    }
  };

  const handleSaveAndApprove = async () => {
    if (!run || !slides) return;
    setIsSaving(true);
    setPublishError(null);
    try {
      const approved = slides.filter((s) => approvedSlides.has(s.id));
      const res = await fetch(`/api/squads/runs/${run.id}/save-slides`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slides: approved }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao salvar.');
      setSavedSlideUrls(data.saved.map((s: { url: string }) => s.url));
    } catch (e) {
      setPublishError(e instanceof Error ? e.message : 'Erro ao salvar slides.');
    } finally {
      setIsSaving(false);
    }
  };

  const handlePublishInstagram = async () => {
    if (!run || !savedSlideUrls || !caption.trim()) return;
    setIsPublishing(true);
    setPublishError(null);
    try {
      const res = await fetch(`/api/squads/runs/${run.id}/publish-instagram`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slideUrls: savedSlideUrls, caption }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao publicar.');
      setPublishResult('Publicado no Instagram com sucesso!');
    } catch (e) {
      setPublishError(e instanceof Error ? e.message : 'Erro ao publicar no Instagram.');
    } finally {
      setIsPublishing(false);
    }
  };

  const handleExportZip = async (slideList: Array<{ id: number; filename: string; dataUrl: string }>) => {
    if (slideList.length === 0) return;
    setIsExporting(true);
    setExportError(null);
    try {
      const res = await fetch('/api/carousel/export-zip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slides: slideList.map((s) => ({ filename: s.filename, dataUrl: s.dataUrl })) }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error((d as { error?: string }).error || 'Erro ao gerar ZIP.');
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'entrelacos-carrossel.zip';
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      setExportError(e instanceof Error ? e.message : 'Erro ao exportar ZIP.');
    } finally {
      setIsExporting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 text-cyan-400 animate-spin" />
      </div>
    );
  }

  const activeStageIdx = streamingStage !== null ? streamingStage : (run?.currentStageIndex ?? 0);
  const currentStageIdx = run?.currentStageIndex ?? 0;
  const currentStage = run?.stages[activeStageIdx];
  const isWaiting = run?.status === 'waiting_input' && !isExecuting;
  const isDone = run?.status === 'done';
  const hasError = run?.status === 'error' || !!error;
  const canAdvance = isWaiting && currentStageIdx < (run?.stages.length ?? 0) - 1;
  const canRetry = (hasError || isWaiting) && !isExecuting;

  // Get the selected stage content
  const selectedStage = run?.stages[selectedStageIdx];
  const isSelectedStreaming = streamingStage === selectedStageIdx;
  const selectedOutput = isSelectedStreaming ? streamingText : selectedStage?.output;
  // Show slides panel whenever the run is done, regardless of which agent tab is selected
  const showSlidesPanel = isDone;

  return (
    <div className="flex h-[calc(100vh-128px)] gap-0 -m-8 mt-0">
      {/* Left — pipeline sidebar */}
      <div className="w-64 flex-shrink-0 bg-[#0d0d0d] border-r border-[#1a1a1a] flex flex-col">
        <button
          onClick={() => onNavigate(View.SQUAD_MANAGER)}
          className="flex items-center gap-2 px-4 py-3 text-xs text-gray-500 hover:text-gray-300 transition-colors border-b border-[#1a1a1a]"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Voltar
        </button>

        {squad && (
          <div className="px-4 py-4 border-b border-[#1a1a1a]">
            <p className="text-xs font-bold text-white truncate">{squad.name}</p>
            <p className="text-[10px] text-gray-600 mt-0.5 line-clamp-2">{squad.description}</p>
          </div>
        )}

        {/* Pipeline stages — clickable for tab navigation */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {run
            ? run.stages.map((stage, i) => {
                const isSelected = i === selectedStageIdx;
                const isStreaming = streamingStage === i;
                const hasOutput = stage.status === 'done' || stage.status === 'error' || isStreaming;
                // Truncated preview of output (first ~60 chars)
                const preview = stage.output?.replace(/[#*_\n]/g, ' ').trim().slice(0, 60);
                return (
                  <button
                    key={i}
                    onClick={() => hasOutput && setSelectedStageIdx(i)}
                    disabled={!hasOutput}
                    className={`w-full text-left rounded-lg p-3 transition-all ${
                      isSelected
                        ? 'bg-cyan-500/15 border-2 border-cyan-500/40 shadow-lg shadow-cyan-500/5'
                        : stage.status === 'done'
                          ? 'bg-emerald-500/5 border border-emerald-500/10 hover:bg-emerald-500/10 cursor-pointer'
                          : stage.status === 'error'
                            ? 'bg-red-500/5 border border-red-500/10 hover:bg-red-500/10 cursor-pointer'
                            : 'bg-white/3 border border-[#1a1a1a] opacity-50 cursor-default'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className="w-4 h-4 rounded-full flex-shrink-0"
                        style={{ background: stage.agentColor || '#06b6d4' }}
                      />
                      <span className={`text-xs font-medium truncate ${isSelected ? 'text-cyan-300' : 'text-white'}`}>
                        {stage.agentName}
                      </span>
                      {isStreaming && <Loader2 className="w-3 h-3 text-cyan-400 animate-spin ml-auto flex-shrink-0" />}
                      {stage.status === 'done' && !isStreaming && <CheckCircle className="w-3 h-3 text-emerald-400 ml-auto flex-shrink-0" />}
                      {stage.status === 'error' && <AlertCircle className="w-3 h-3 text-red-400 ml-auto flex-shrink-0" />}
                      {isSelected && hasOutput && <Eye className="w-3 h-3 text-cyan-400 ml-auto flex-shrink-0" />}
                    </div>
                    <p className="text-[10px] text-gray-600 mt-0.5">{stage.agentRole}</p>
                    {/* Output preview — only for non-selected stages with content */}
                    {!isSelected && preview && (
                      <p className="text-[10px] text-gray-700 mt-1 truncate italic">{preview}…</p>
                    )}
                    {/* Status for pending/active */}
                    {!hasOutput && (
                      <p className="text-[10px] text-gray-700 mt-1">{STAGE_STATUS_LABEL[stage.status]}</p>
                    )}
                  </button>
                );
              })
            : squad?.agents.map((agent, i) => (
                <div key={i} className="rounded-lg p-3 bg-white/3 border border-[#1a1a1a]">
                  <div className="flex items-center gap-2">
                    <span className="w-4 h-4 rounded-full" style={{ background: agent.color }} />
                    <span className="text-xs text-gray-400 truncate">{agent.name}</span>
                  </div>
                  <p className="text-[10px] text-gray-600 mt-0.5">{agent.role}</p>
                </div>
              ))
          }
        </div>

        {run && (
          <div className="p-4 border-t border-[#1a1a1a]">
            <button
              onClick={handleNewRun}
              className="w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 text-xs transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Nova execução
            </button>
          </div>
        )}
      </div>

      {/* Main — output for SELECTED stage only */}
      <div className="flex-1 flex flex-col bg-[#080808]">
        {/* Scrollable output */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6 font-mono text-sm">
          {!run ? (
            /* Task input */
            <div className="flex flex-col items-center justify-center h-full gap-6 max-w-lg mx-auto">
              <div className="text-center">
                <h2 className="text-white font-semibold text-base mb-1">
                  {squad?.name ?? 'Squad'}
                </h2>
                <p className="text-gray-500 text-sm">Descreva a tarefa que o squad vai executar</p>
              </div>
              <div className="w-full space-y-3">
                <textarea
                  value={task}
                  onChange={(e) => setTask(e.target.value)}
                  placeholder="Ex: Crie uma estratégia de conteúdo para Instagram focada em saúde mental..."
                  rows={4}
                  className="w-full bg-[#111] border border-[#222] rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-cyan-500/50 resize-none"
                  onKeyDown={(e) => { if (e.key === 'Enter' && e.metaKey) void handleStart(); }}
                />
                <button
                  onClick={handleStart}
                  disabled={!task.trim() || isExecuting}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 text-white font-medium transition-colors"
                >
                  <Play className="w-4 h-4" />
                  Iniciar Squad
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Task header — always visible */}
              <div className="border border-[#1a1a1a] rounded-xl p-4 bg-[#0d0d0d]">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] text-gray-600 uppercase tracking-wider mb-1">Tarefa</p>
                    <p className="text-white text-sm">{run.task}</p>
                  </div>
                  {run.stages.length > 1 && (
                    <div className="flex items-center gap-1 ml-4 flex-shrink-0">
                      {run.stages.map((s, i) => (
                        <div
                          key={i}
                          className={`w-2 h-2 rounded-full transition-all ${
                            i === selectedStageIdx
                              ? 'bg-cyan-400 scale-125'
                              : s.status === 'done'
                                ? 'bg-emerald-400/50'
                                : s.status === 'error'
                                  ? 'bg-red-400/50'
                                  : 'bg-gray-700'
                          }`}
                          title={s.agentName}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Selected stage output — single stage view */}
              {selectedStage && (selectedOutput || isSelectedStreaming) && (
                <div className="space-y-3">
                  {/* Agent header bar */}
                  <div className="flex items-center gap-3 px-1">
                    <span
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ background: selectedStage.agentColor || '#06b6d4' }}
                    />
                    <span className="text-sm font-semibold" style={{ color: selectedStage.agentColor || '#06b6d4' }}>
                      {selectedStage.agentName}
                    </span>
                    <span className="text-[10px] text-gray-600">· {selectedStage.agentRole}</span>
                    {isSelectedStreaming && (
                      <span className="text-[10px] text-cyan-500 animate-pulse ml-auto">transmitindo...</span>
                    )}
                    {selectedStage.status === 'done' && !isSelectedStreaming && (
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-500 ml-auto" />
                    )}
                    {/* Stage navigation arrows */}
                    <div className="flex items-center gap-1 ml-2">
                      <button
                        disabled={selectedStageIdx === 0}
                        onClick={() => setSelectedStageIdx((p) => Math.max(0, p - 1))}
                        className="p-1 rounded hover:bg-white/5 text-gray-500 hover:text-gray-300 disabled:opacity-20 disabled:cursor-default transition-colors"
                        title="Agente anterior"
                      >
                        <ChevronRight className="w-3.5 h-3.5 rotate-180" />
                      </button>
                      <span className="text-[10px] text-gray-600 tabular-nums">
                        {selectedStageIdx + 1}/{run.stages.length}
                      </span>
                      <button
                        disabled={selectedStageIdx >= run.stages.length - 1 || !run.stages[selectedStageIdx + 1]?.output}
                        onClick={() => setSelectedStageIdx((p) => Math.min(run.stages.length - 1, p + 1))}
                        className="p-1 rounded hover:bg-white/5 text-gray-500 hover:text-gray-300 disabled:opacity-20 disabled:cursor-default transition-colors"
                        title="Próximo agente"
                      >
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* User feedback if provided */}
                  {selectedStage.userFeedback && (
                    <div className="ml-4 text-xs text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2">
                      <span className="text-[10px] text-amber-500/70 block mb-0.5">Direção:</span>
                      {selectedStage.userFeedback}
                    </div>
                  )}

                  {/* Output content */}
                  <div className="bg-[#0d0d0d] border border-[#1a1a1a] rounded-xl p-5 text-gray-200 text-sm leading-relaxed whitespace-pre-wrap max-h-[calc(100vh-420px)] overflow-y-auto">
                    {selectedOutput}
                    {isSelectedStreaming && (
                      <span className="inline-block w-2 h-4 bg-cyan-400 animate-pulse ml-0.5 align-text-bottom" />
                    )}
                  </div>
                </div>
              )}

              {/* Pending stage message */}
              {selectedStage && !selectedOutput && !isSelectedStreaming && selectedStage.status === 'pending' && (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center bg-white/5 mb-4">
                    <span
                      className="w-5 h-5 rounded-full"
                      style={{ background: selectedStage.agentColor || '#06b6d4' }}
                    />
                  </div>
                  <p className="text-gray-500 text-sm">{selectedStage.agentName}</p>
                  <p className="text-gray-700 text-xs mt-1">Aguardando etapas anteriores</p>
                </div>
              )}

              {/* ── Done state: slides panel (only on last stage tab) ── */}
              {showSlidesPanel && (
                <div className="space-y-5">
                  {/* Status bar */}
                  <div className="flex items-center gap-3 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                    <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-emerald-400 text-sm font-medium">Squad concluído</p>
                      <p className="text-gray-500 text-xs">Todas as etapas executadas com sucesso.</p>
                    </div>
                    <div className="flex gap-2">
                      {slides && (
                        <button
                          onClick={() => void handleRenderSlides()}
                          disabled={isRendering}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#2a2a2a] hover:border-[#3a3a3a] text-gray-400 hover:text-gray-200 text-xs transition-colors"
                        >
                          {isRendering ? <Loader2 className="w-3 h-3 animate-spin" /> : <RotateCcw className="w-3 h-3" />}
                          Refazer
                        </button>
                      )}
                      {!slides && (
                        <button
                          onClick={() => void handleRenderSlides()}
                          disabled={isRendering}
                          className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white text-xs font-medium transition-colors"
                        >
                          {isRendering ? <><Loader2 className="w-3 h-3 animate-spin" />Renderizando...</> : <><Images className="w-3 h-3" />Gerar Slides</>}
                        </button>
                      )}
                    </div>
                  </div>

                  {isRendering && (
                    <div className="flex flex-col gap-3 p-4 bg-purple-500/10 border border-purple-500/20 rounded-xl">
                      <div className="flex items-center gap-3">
                        <Loader2 className="w-4 h-4 text-purple-400 animate-spin flex-shrink-0" />
                        <div>
                          <p className="text-purple-300 text-sm font-medium">
                            {renderProgress.total === 0
                              ? 'Analisando conteúdo e estruturando slides...'
                              : `Gerando slide ${renderProgress.current} de ${renderProgress.total} com IA...`}
                          </p>
                          <p className="text-gray-500 text-xs">GPT-image-1 gera cada slide como arte completa. Leva ~2-3 min.</p>
                        </div>
                      </div>
                      {renderProgress.total > 0 && (
                        <div className="w-full bg-[#1a1a1a] rounded-full h-1.5">
                          <div
                            className="bg-gradient-to-r from-purple-600 to-purple-400 h-1.5 rounded-full transition-all duration-500"
                            style={{ width: `${(renderProgress.current / renderProgress.total) * 100}%` }}
                          />
                        </div>
                      )}
                    </div>
                  )}

                  {renderError && (
                    <p className="text-red-400 text-xs bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{renderError}</p>
                  )}

                  {/* Slide approval grid */}
                  {slides && slides.length > 0 && !savedSlideUrls && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">
                          Carrossel · {slides.length} slides · selecione os que aprovar
                        </p>
                        <div className="flex gap-2 text-xs text-gray-500">
                          <button onClick={() => setApprovedSlides(new Set(slides.map((s) => s.id)))} className="hover:text-gray-200 transition-colors">Selecionar todos</button>
                          <span>·</span>
                          <button onClick={() => setApprovedSlides(new Set())} className="hover:text-gray-200 transition-colors">Limpar</button>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        {slides.map((slide) => {
                          const approved = approvedSlides.has(slide.id);
                          return (
                            <div
                              key={slide.id}
                              onClick={() => setApprovedSlides((prev) => {
                                const next = new Set(prev);
                                if (next.has(slide.id)) next.delete(slide.id); else next.add(slide.id);
                                return next;
                              })}
                              className={`relative cursor-pointer rounded-xl border-2 overflow-hidden transition-all ${approved ? 'border-purple-500 shadow-lg shadow-purple-500/20' : 'border-[#1a1a1a] opacity-60'}`}
                            >
                              <img src={slide.dataUrl} alt={slide.filename} className="w-full block" />
                              <div className={`absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center transition-all ${approved ? 'bg-purple-500' : 'bg-[#1a1a1a] border border-[#333]'}`}>
                                {approved && <CheckCircle className="w-4 h-4 text-white" />}
                              </div>
                              <a
                                href={slide.dataUrl}
                                download={slide.filename}
                                onClick={(e) => e.stopPropagation()}
                                className="absolute bottom-2 left-2 px-2 py-1 rounded bg-black/60 text-[10px] text-gray-300 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                ↓
                              </a>
                            </div>
                          );
                        })}
                      </div>

                      <div className="flex items-center justify-between pt-2 gap-3 flex-wrap">
                        <p className="text-xs text-gray-600">{approvedSlides.size} de {slides.length} slides selecionados</p>
                        <div className="flex gap-2">
                          <button
                            onClick={() => void handleExportZip(slides.filter((s) => approvedSlides.size > 0 ? approvedSlides.has(s.id) : true))}
                            disabled={isExporting || slides.length === 0}
                            title="Baixar slides como ZIP sem publicar"
                            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-[#2a2a2a] text-gray-300 hover:text-white hover:border-[#444] disabled:opacity-40 text-xs font-medium transition-colors"
                          >
                            {isExporting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                            {isExporting ? 'Exportando...' : 'Exportar ZIP'}
                          </button>
                          <button
                            onClick={() => void handleSaveAndApprove()}
                            disabled={isSaving || approvedSlides.size === 0}
                            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-white text-xs font-medium transition-colors"
                          >
                            {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />}
                            {isSaving ? 'Salvando...' : 'Aprovar e preparar publicação'}
                          </button>
                        </div>
                      </div>
                      {exportError && (
                        <p className="text-red-400 text-xs bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{exportError}</p>
                      )}
                    </div>
                  )}

                  {/* Publish panel */}
                  {savedSlideUrls && !publishResult && (
                    <div className="space-y-4 p-4 bg-[#0d0d0d] border border-[#1a1a1a] rounded-xl">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-emerald-400" />
                        <p className="text-emerald-400 text-sm font-medium">{savedSlideUrls.length} slides aprovados e prontos para publicação</p>
                      </div>

                      <div>
                        <label className="text-[10px] text-gray-500 uppercase tracking-wider font-mono block mb-2">Legenda do post</label>
                        <textarea
                          value={caption}
                          onChange={(e) => setCaption(e.target.value)}
                          placeholder="Escreva a legenda do post no Instagram... (emojis, hashtags, CTA)"
                          rows={4}
                          className="w-full bg-[#111] border border-[#222] rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-purple-500/50 resize-none"
                        />
                      </div>

                      {publishError && (
                        <p className="text-red-400 text-xs bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{publishError}</p>
                      )}

                      <div className="flex gap-3 flex-wrap">
                        <button
                          onClick={() => setSavedSlideUrls(null)}
                          className="px-4 py-2 rounded-lg border border-[#2a2a2a] text-gray-400 hover:text-gray-200 text-xs transition-colors"
                        >
                          ← Voltar aos slides
                        </button>
                        <button
                          onClick={() => void handleExportZip(
                            (slides ?? []).filter((s) => savedSlideUrls?.some((u) => u.includes(s.filename.replace('.png', ''))))
                          )}
                          disabled={isExporting || !savedSlideUrls}
                          title="Baixar slides aprovados como ZIP sem publicar"
                          className="flex items-center gap-2 px-4 py-2 rounded-lg border border-[#2a2a2a] text-gray-300 hover:text-white hover:border-[#444] disabled:opacity-40 text-xs font-medium transition-colors"
                        >
                          {isExporting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                          {isExporting ? 'Exportando...' : 'Baixar ZIP'}
                        </button>
                        <button
                          onClick={() => void handlePublishInstagram()}
                          disabled={isPublishing || !caption.trim()}
                          className="flex items-center gap-2 px-5 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 disabled:opacity-40 text-white text-xs font-medium transition-all flex-1 justify-center"
                        >
                          {isPublishing ? <><Loader2 className="w-3.5 h-3.5 animate-spin" />Publicando...</> : <>Publicar no Instagram →</>}
                        </button>
                      </div>
                    </div>
                  )}

                  {publishResult && (
                    <div className="flex items-center gap-3 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                      <CheckCircle className="w-5 h-5 text-emerald-400" />
                      <p className="text-emerald-400 text-sm font-medium">{publishResult}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Error state */}
              {error && (
                <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
                  <AlertCircle className="w-5 h-5 text-red-400" />
                  <p className="text-red-400 text-sm">{error}</p>
                </div>
              )}
            </>
          )}
        </div>

        {/* Bottom input bar — only shown when run is active and waiting */}
        {run && !isDone && (
          <div className="border-t border-[#1a1a1a] p-4 bg-[#0d0d0d]">
            {isExecuting ? (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 text-xs text-gray-400">
                  <Loader2 className="w-4 h-4 text-cyan-400 animate-spin" />
                  <span>
                    {currentStage?.agentName ?? 'Agente'} está processando...
                  </span>
                </div>
                <button
                  onClick={handleAbort}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs transition-colors"
                >
                  <StopCircle className="w-3.5 h-3.5" />
                  Interromper
                </button>
              </div>
            ) : isWaiting ? (
              <div className="space-y-3">
                <div className="text-xs text-gray-500">
                  <span className="text-amber-400 font-medium">{run.stages[activeStageIdx + 1]?.agentName ?? 'Próximo agente'}</span>
                  {' '}está aguardando. Forneça uma direção ou continue.
                </div>
                <div className="flex gap-2">
                  <input
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                    placeholder="Direção opcional (deixe vazio para continuar normalmente)..."
                    className="flex-1 bg-[#111] border border-[#222] rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-cyan-500/50"
                    onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); void handleAdvance(); } }}
                  />
                  {canRetry && (
                    <button
                      onClick={handleRetry}
                      className="px-3 py-2.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 text-xs transition-colors flex-shrink-0"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>
                  )}
                  {canAdvance && (
                    <button
                      onClick={handleAdvance}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-sm font-medium transition-colors flex-shrink-0"
                    >
                      <Send className="w-4 h-4" />
                      {userInput.trim() ? 'Direcionar' : 'Continuar'}
                    </button>
                  )}
                </div>
              </div>
            ) : hasError && canRetry ? (
              <div className="flex items-center gap-3">
                <p className="text-xs text-gray-500 flex-1">Erro na execução. Tente novamente.</p>
                <button
                  onClick={handleRetry}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-medium transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Tentar novamente
                </button>
              </div>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
};

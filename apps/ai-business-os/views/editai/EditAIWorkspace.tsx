import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Bot,
  Captions,
  Check,
  Clock,
  Download,
  Film,
  Layers,
  Loader2,
  Play,
  RefreshCw,
  Scissors,
  Search,
  SlidersHorizontal,
  Sparkles,
  SplitSquareHorizontal,
  X,
} from 'lucide-react';
import type { EditAICutReport, EditAIEditPreset, EditAIScene, EditAIVideoProject, EditAIWord } from '../../types';
import { View } from '../../types';

interface Props {
  projectId: string;
  onNavigate: (view: View, projectId?: string) => void;
}

type WorkspaceTab = 'transcript' | 'cuts' | 'scenes' | 'automation';
type SelectedItem =
  | { type: 'cut'; item: EditAICutReport }
  | { type: 'word'; item: EditAIWord }
  | { type: 'scene'; item: EditAIScene }
  | null;

interface TimelinePayload {
  sourceDuration: number;
  cutDuration: number | null;
  outputDuration: number | null;
  removedDuration: number;
  keptDuration: number;
  removalRatio: number;
  mediaAvailable: Record<string, boolean>;
  media: { normalized: string | null; cut: string | null; output: string | null };
  cuts: EditAICutReport[];
  words: EditAIWord[];
  scenes: EditAIScene[];
  keptSegments: Array<{ start: number; end: number; outputStart: number; outputEnd: number }>;
}

const STATUS_LABELS: Record<EditAIVideoProject['status'], string> = {
  uploading: 'Enviando',
  normalizing: 'Normalizando',
  transcribing: 'Transcrevendo',
  cutting: 'Processando cortes',
  awaiting_approval: 'Revisar cortes',
  planning: 'Gerando plano',
  awaiting_plan: 'Revisar plano',
  analyzing: 'Gerando cenas',
  ready: 'Pronto para render',
  rendering: 'Renderizando',
  done: 'Concluido',
  error: 'Erro',
};

const CUT_COLORS: Record<EditAICutReport['tipo'], string> = {
  silencio: '#14B8A6',
  gaguejo: '#F97316',
  refazimento: '#EF4444',
};

const EDIT_PRESETS: Array<{ id: EditAIEditPreset; label: string; description: string }> = [
  { id: 'auto', label: 'Auto', description: 'Equilibra ritmo, cortes, legendas e overlays conforme o conteúdo.' },
  { id: 'clean', label: 'Clean', description: 'Edição discreta para aula, institucional e YouTube longo.' },
  { id: 'kinetic', label: 'Kinetic', description: 'Mais zoom, movimento, cortes rápidos e captions fortes para Reels/Shorts.' },
  { id: 'cinematic', label: 'Cinematic', description: 'Contraste, atmosfera, ritmo mais respirado e transições suaves.' },
];

const shell = {
  page: 'bg-[#0A0A0F] text-[#F8FAFC]',
  panel: 'bg-white/[0.045] border border-white/[0.08] shadow-[0_18px_60px_rgba(0,0,0,0.35)] backdrop-blur-xl',
  panelSoft: 'bg-[#0F0F1A]/90 border border-white/[0.07]',
  line: 'border-white/[0.08]',
  muted: 'text-[#CBD5E1]/70',
  text: 'text-[#F8FAFC]',
  cta: 'bg-gradient-to-r from-[#6B46C1] via-[#8B5CF6] to-[#F97316] text-white shadow-[0_10px_36px_rgba(107,70,193,0.35)]',
  ghost: 'bg-white/[0.055] hover:bg-white/[0.09] border border-white/[0.08] text-[#E2E8F0]',
};

const formatTime = (seconds: number) => {
  if (!Number.isFinite(seconds)) return '0:00.0';
  const mins = Math.floor(seconds / 60);
  const secs = seconds - mins * 60;
  return `${mins}:${secs.toFixed(1).padStart(4, '0')}`;
};

const getCutStatus = (cut: EditAICutReport): NonNullable<EditAICutReport['status']> =>
  cut.status ?? (cut.aprovado ? 'approved' : 'pending');

export const EditAIWorkspace: React.FC<Props> = ({ projectId, onNavigate }) => {
  const [project, setProject] = useState<EditAIVideoProject | null>(null);
  const [timeline, setTimeline] = useState<TimelinePayload | null>(null);
  const [tab, setTab] = useState<WorkspaceTab>('cuts');
  const [selected, setSelected] = useState<SelectedItem>(null);
  const [query, setQuery] = useState('');
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [currentTime, setCurrentTime] = useState(0);
  const [wordSelection, setWordSelection] = useState<{ startIndex: number; endIndex: number } | null>(null);
  const [manualRange, setManualRange] = useState<{ start: number | null; end: number | null }>({ start: null, end: null });
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const timelineRef = useRef<HTMLDivElement | null>(null);

  const load = async () => {
    const [projectRes, timelineRes] = await Promise.all([
      fetch(`/api/editai/project/${projectId}`),
      fetch(`/api/editai/project/${projectId}/timeline`),
    ]);
    if (!projectRes.ok) throw new Error('Projeto EditAI nao encontrado.');
    const nextProject: EditAIVideoProject = await projectRes.json();
    const nextTimeline: TimelinePayload | null = timelineRes.ok ? await timelineRes.json() : null;
    setProject(nextProject);
    setTimeline(nextTimeline);
    setError(nextProject.error || '');
  };

  useEffect(() => {
    let disposed = false;
    const tick = async () => {
      try {
        if (!disposed) await load();
      } catch (err) {
        if (!disposed) setError(err instanceof Error ? err.message : 'Falha ao carregar projeto.');
      }
    };
    tick();
    const interval = setInterval(tick, 2500);
    return () => {
      disposed = true;
      clearInterval(interval);
    };
  }, [projectId]);

  const duration = timeline?.sourceDuration || timeline?.cutDuration || timeline?.outputDuration || 1;
  const cuts = timeline?.cuts ?? project?.cutReport ?? [];
  const words = timeline?.words ?? project?.words ?? [];
  const scenes = timeline?.scenes ?? project?.scenes ?? [];
  const isCutReview = project?.status === 'awaiting_approval' || project?.status === 'cutting';
  const activeMedia = isCutReview
    ? (timeline?.media.normalized || timeline?.media.cut || timeline?.media.output || '')
    : (timeline?.media.output || timeline?.media.cut || timeline?.media.normalized || '');
  const approvedCount = cuts.filter((cut) => getCutStatus(cut) === 'approved').length;
  const pendingCount = cuts.filter((cut) => getCutStatus(cut) === 'pending').length;
  const riskCount = cuts.filter((cut) => cut.riskLevel === 'high').length;
  const timelineTicks = useMemo(() => {
    const tickStep = duration <= 90 ? 1 : duration <= 240 ? 5 : 10;
    const labelStep = duration <= 90 ? 5 : duration <= 240 ? 10 : 30;
    const total = Math.max(0, Math.ceil(duration));
    const ticks: Array<{ second: number; left: number; label: boolean; major: boolean }> = [];
    for (let second = 0; second <= total; second += tickStep) {
      ticks.push({
        second,
        left: Math.min(100, Math.max(0, (second / duration) * 100)),
        label: second === 0 || second === total || second % labelStep === 0,
        major: second % labelStep === 0,
      });
    }
    return ticks;
  }, [duration]);
  const focusMoments = useMemo(() => {
    const moments = [
      { label: '20s', second: 20, tone: '#EF4444' },
      { label: '25s', second: 25, tone: '#EF4444' },
      { label: 'final', second: Math.max(0, duration - 3), tone: '#F97316' },
    ];
    const used = new Set<number>();
    return moments.filter((moment) => {
      const rounded = Math.round(moment.second);
      if (moment.second > duration || used.has(rounded)) return false;
      used.add(rounded);
      return true;
    });
  }, [duration]);

  const filteredWords = useMemo(() => {
    if (!query.trim()) return words;
    const needle = query.trim().toLowerCase();
    return words.filter((word) => word.word.toLowerCase().includes(needle));
  }, [words, query]);

  const seekTo = (seconds: number) => {
    const video = videoRef.current;
    if (video) {
      video.currentTime = Math.max(0, seconds);
      setCurrentTime(video.currentTime);
    }
  };

  const playRange = (start: number, end: number) => {
    const video = videoRef.current;
    if (!video) return;
    const safeStart = Math.max(0, start);
    const safeEnd = Math.max(safeStart + 0.3, end);
    video.currentTime = safeStart;
    void video.play();
    const stop = () => {
      if (video.currentTime >= safeEnd) {
        video.pause();
        video.removeEventListener('timeupdate', stop);
      }
    };
    video.addEventListener('timeupdate', stop);
  };

  const updateCuts = async (updates: Array<Partial<EditAICutReport> & { id: string }>) => {
    setBusyAction('saving');
    try {
      const res = await fetch(`/api/editai/project/${projectId}/cuts`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cuts: updates }),
      });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(payload.error || 'Falha ao salvar cortes.');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao salvar cortes.');
    } finally {
      setBusyAction(null);
    }
  };

  const setCutStatus = (cut: EditAICutReport, status: NonNullable<EditAICutReport['status']>) => {
    if (!cut.id) return;
    updateCuts([{ id: cut.id, status }]);
  };

  const toggleWordSelection = (word: EditAIWord) => {
    setSelected({ type: 'word', item: word });
    seekTo(word.start);
    setWordSelection((current) => {
      if (!current) return { startIndex: word.index, endIndex: word.index };
      const startIndex = Math.min(current.startIndex, word.index);
      const endIndex = Math.max(current.startIndex, word.index);
      if (current.startIndex === word.index && current.endIndex === word.index) return null;
      return { startIndex, endIndex };
    });
  };

  const selectedWords = useMemo(() => {
    if (!wordSelection) return [];
    return words.filter((word) => word.index >= wordSelection.startIndex && word.index <= wordSelection.endIndex);
  }, [words, wordSelection]);

  const manualCutWindow = useMemo(() => {
    if (manualRange.start === null || manualRange.end === null) return null;
    const start = Math.min(manualRange.start, manualRange.end);
    const end = Math.max(manualRange.start, manualRange.end);
    return end - start >= 0.15 ? { start, end } : null;
  }, [manualRange]);

  const manualRangeWords = useMemo(() => {
    if (!manualCutWindow) return [];
    return words.filter((word) => word.end > manualCutWindow.start && word.start < manualCutWindow.end);
  }, [manualCutWindow, words]);

  const seekFromTimeline = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!timelineRef.current) return;
    const rect = timelineRef.current.getBoundingClientRect();
    const innerLeft = rect.left + 64;
    const innerWidth = Math.max(1, rect.width - 128);
    const ratio = Math.min(1, Math.max(0, (event.clientX - innerLeft) / innerWidth));
    seekTo(ratio * duration);
  };

  const markManualPoint = (point: 'start' | 'end') => {
    setManualRange((current) => ({ ...current, [point]: currentTime }));
  };

  const clearManualRange = () => {
    setManualRange({ start: null, end: null });
  };

  const createManualTimelineCut = async () => {
    if (!manualCutWindow) return;
    const preview = manualRangeWords.length > 0
      ? manualRangeWords.map((word) => word.word).join(' ')
      : `${formatTime(manualCutWindow.start)} - ${formatTime(manualCutWindow.end)}`;
    await updateCuts([{
      id: `manual-${Date.now()}`,
      tipo: 'refazimento',
      inicio: manualCutWindow.start,
      fim: manualCutWindow.end,
      duracao: manualCutWindow.end - manualCutWindow.start,
      preview,
      aprovado: true,
      status: 'approved',
      confidence: 1,
      reason: 'Corte manual criado pela linha do tempo.',
      source: 'manual',
      riskLevel: manualCutWindow.end - manualCutWindow.start > 2.5 ? 'high' : manualCutWindow.end - manualCutWindow.start > 1.2 ? 'medium' : 'low',
    }]);
    clearManualRange();
    setTab('cuts');
  };

  const createManualCut = async () => {
    if (selectedWords.length === 0) return;
    const start = selectedWords[0].start;
    const end = selectedWords[selectedWords.length - 1].end;
    const preview = selectedWords.map((word) => word.word).join(' ');
    await updateCuts([{
      id: `manual-${Date.now()}`,
      tipo: 'refazimento',
      inicio: start,
      fim: end,
      duracao: Math.max(0, end - start),
      preview,
      aprovado: true,
      status: 'approved',
      confidence: 1,
      reason: 'Corte manual criado por seleção de palavras.',
      source: 'manual',
      riskLevel: end - start > 2.5 ? 'high' : end - start > 1.2 ? 'medium' : 'low',
    }]);
    setWordSelection(null);
    setTab('cuts');
  };

  const applyCuts = async () => {
    setBusyAction('apply');
    try {
      const res = await fetch(`/api/editai/project/${projectId}/apply-cuts`, { method: 'POST' });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(payload.error || 'Falha ao aplicar cortes.');
      await load();
      setTab('automation');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao aplicar cortes.');
    } finally {
      setBusyAction(null);
    }
  };

  const reanalyzeCuts = async () => {
    setBusyAction('reanalyze');
    try {
      const res = await fetch(`/api/editai/project/${projectId}/cuts/reanalyze`, { method: 'POST' });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(payload.error || 'Falha ao reanalisar cortes.');
      await load();
      setTab('cuts');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao reanalisar cortes.');
    } finally {
      setBusyAction(null);
    }
  };

  const generateScenes = async () => {
    setBusyAction('scenes');
    try {
      const res = await fetch(`/api/editai/project/${projectId}/generate-scenes`, { method: 'POST' });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(payload.error || 'Falha ao gerar cenas.');
      await load();
      setTab('scenes');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao gerar cenas.');
    } finally {
      setBusyAction(null);
    }
  };

  const renderVideo = async () => {
    setBusyAction('render');
    try {
      const res = await fetch(`/api/editai/project/${projectId}/render`, { method: 'POST' });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(payload.error || 'Falha ao renderizar.');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao renderizar.');
    } finally {
      setBusyAction(null);
    }
  };

  const updateEditPreset = async (editPreset: EditAIEditPreset) => {
    if (project.editPreset === editPreset) return;
    setBusyAction('preset');
    try {
      const res = await fetch(`/api/editai/project/${projectId}/settings`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ editPreset }),
      });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(payload.error || 'Falha ao salvar preset.');
      setProject(payload.project ?? null);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao salvar preset.');
    } finally {
      setBusyAction(null);
    }
  };

  if (!project || !timeline) {
    return (
      <div className={`min-h-screen ${shell.page} flex items-center justify-center`}>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgba(107,70,193,0.24),transparent_62%)]" />
        <Loader2 className="animate-spin text-[#8B5CF6] relative" size={28} />
      </div>
    );
  }

  const renderLeftPanel = () => {
    if (tab === 'transcript') {
      return (
        <div className="flex flex-col h-full">
          <div className={`p-4 border-b ${shell.line}`}>
            <div className="flex items-center gap-2 bg-[#0A0A0F]/70 border border-white/[0.09] rounded-xl px-3 py-2 focus-within:border-[#8B5CF6]/70 transition-colors">
              <Search size={14} className="text-[#14B8A6]" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Buscar palavra"
                className="bg-transparent outline-none text-sm text-[#F8FAFC] w-full placeholder:text-[#64748B]"
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-1">
            {filteredWords.map((word) => (
              <button
                key={word.index}
                onClick={() => toggleWordSelection(word)}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm flex justify-between gap-3 transition-colors ${
                  wordSelection && word.index >= wordSelection.startIndex && word.index <= wordSelection.endIndex
                    ? 'bg-[#8B5CF6]/20 text-[#F8FAFC] ring-1 ring-[#8B5CF6]/45'
                    : 'hover:bg-white/[0.07] text-[#E2E8F0]'
                }`}
              >
                <span>{word.word}</span>
                <span className="font-mono text-[11px] text-[#CBD5E1]/60">{formatTime(word.start)}</span>
              </button>
            ))}
          </div>
          {selectedWords.length > 0 && (
            <div className={`p-3 border-t ${shell.line} bg-[#0A0A0F]/75`}>
              <div className="text-xs text-[#CBD5E1]/70 mb-2">
                {selectedWords.length} palavra(s) selecionada(s): {formatTime(selectedWords[0].start)} - {formatTime(selectedWords[selectedWords.length - 1].end)}
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => playRange(selectedWords[0].start, selectedWords[selectedWords.length - 1].end)}
                  className={`rounded-full py-2 text-xs font-semibold flex items-center justify-center gap-1 ${shell.ghost}`}
                >
                  <Play size={13} /> Ouvir
                </button>
                <button
                  onClick={createManualCut}
                  className={`rounded-full py-2 text-xs font-bold flex items-center justify-center gap-1 ${shell.cta}`}
                >
                  <Scissors size={13} /> Criar corte aprovado
                </button>
              </div>
            </div>
          )}
        </div>
      );
    }

    if (tab === 'scenes') {
      return (
        <div className="overflow-y-auto p-3 space-y-2">
          {scenes.length === 0 && <p className={`text-sm ${shell.muted} p-3`}>Nenhuma cena gerada ainda.</p>}
          {scenes.map((scene) => (
            <button
              key={scene.id}
              onClick={() => {
                setSelected({ type: 'scene', item: scene });
                seekTo(scene.frame_inicio / project.fps);
              }}
              className={`w-full text-left rounded-xl ${shell.panelSoft} hover:border-[#8B5CF6]/70 p-3 transition-colors`}
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-[11px] text-[#FB923C]">{scene.tipo}</span>
                <span className="font-mono text-[11px] text-[#CBD5E1]/60">
                  {formatTime(scene.frame_inicio / project.fps)}
                </span>
              </div>
              <p className="mt-2 text-sm text-[#F8FAFC] truncate">{String(Object.values(scene.conteudo)[0] ?? '')}</p>
            </button>
          ))}
        </div>
      );
    }

    if (tab === 'automation') {
      return (
        <div className="p-4 space-y-3 text-sm">
          <div className={`rounded-xl ${shell.panel} p-4`}>
            <p className="text-[#F8FAFC] font-semibold">Motor de edição</p>
            <p className={`mt-1 ${shell.muted}`}>{STATUS_LABELS[project.status]}</p>
            <div className="mt-3 h-1.5 rounded-full bg-white/[0.08] overflow-hidden">
              <div className="h-full rounded-full bg-gradient-to-r from-[#14B8A6] via-[#8B5CF6] to-[#F97316]" style={{ width: `${Math.min(100, Math.max(8, project.renderProgress || (project.status === 'done' ? 100 : 28)))}%` }} />
            </div>
          </div>
          <div className={`rounded-xl ${shell.panelSoft} p-3`}>
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[#F8FAFC] font-semibold flex items-center gap-2">
                  <SlidersHorizontal size={15} className="text-[#14B8A6]" />
                  Preset dinâmico
                </p>
                <p className={`mt-1 text-xs ${shell.muted}`}>Define pacing, overlays, transições e intensidade visual.</p>
              </div>
              {busyAction === 'preset' && <Loader2 className="animate-spin text-[#8B5CF6]" size={16} />}
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2">
              {EDIT_PRESETS.map((preset) => {
                const active = (project.editPreset ?? 'auto') === preset.id;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    disabled={busyAction === 'preset'}
                    onClick={() => updateEditPreset(preset.id)}
                    className={`rounded-lg border px-3 py-2 text-left transition-colors ${
                      active
                        ? 'border-[#14B8A6]/70 bg-[#14B8A6]/12 text-[#F8FAFC]'
                        : 'border-white/[0.08] bg-white/[0.04] text-[#CBD5E1] hover:border-[#8B5CF6]/60'
                    }`}
                    title={preset.description}
                  >
                    <span className="block text-xs font-bold">{preset.label}</span>
                    <span className="mt-1 block text-[10px] leading-4 text-[#CBD5E1]/65">{preset.description}</span>
                  </button>
                );
              })}
            </div>
          </div>
          <button
            disabled={project.status !== 'awaiting_approval' || busyAction === 'apply'}
            onClick={applyCuts}
            className={`w-full rounded-full disabled:bg-white/[0.06] disabled:text-[#64748B] ${shell.cta} font-bold py-3 flex items-center justify-center gap-2 transition-transform hover:scale-[1.01]`}
          >
            {busyAction === 'apply' ? <Loader2 className="animate-spin" size={16} /> : <Scissors size={16} />}
            Aplicar cortes aprovados
          </button>
          <button
            disabled={project.status !== 'awaiting_plan' || busyAction === 'scenes'}
            onClick={generateScenes}
            className={`w-full rounded-full disabled:text-[#64748B] ${shell.ghost} font-semibold py-3 flex items-center justify-center gap-2`}
          >
            {busyAction === 'scenes' ? <Loader2 className="animate-spin" size={16} /> : <Sparkles size={16} />}
            Gerar cenas aprovadas
          </button>
          <button
            disabled={!['ready', 'done'].includes(project.status) || busyAction === 'render'}
            onClick={renderVideo}
            className={`w-full rounded-full disabled:text-[#64748B] ${shell.ghost} font-semibold py-3 flex items-center justify-center gap-2`}
          >
            {busyAction === 'render' ? <Loader2 className="animate-spin" size={16} /> : <Film size={16} />}
            Renderizar video final
          </button>
          <p className="text-xs leading-5 text-[#CBD5E1]/70">
            IA sugere. Você aprova. Só cortes aprovados mexem no vídeo.
          </p>
        </div>
      );
    }

    return (
      <div className="overflow-y-auto p-3 space-y-2">
        {cuts.map((cut) => {
          const status = getCutStatus(cut);
          const selectedCut = selected?.type === 'cut' && selected.item.id === cut.id;
          return (
            <button
              key={cut.id}
              onClick={() => {
                setSelected({ type: 'cut', item: cut });
                seekTo(Math.max(0, cut.inicio - 0.4));
              }}
              className={`w-full text-left rounded-xl border p-3 transition-all ${
                selectedCut ? 'border-[#F97316] bg-[#F97316]/10 shadow-[0_0_30px_rgba(249,115,22,0.18)]' : 'border-white/[0.08] bg-white/[0.045]'
              } hover:border-[#F97316]/60`}
            >
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full" style={{ background: CUT_COLORS[cut.tipo] }} />
                <span className="text-xs uppercase font-mono text-[#E2E8F0]">{cut.tipo}</span>
                <span className={`ml-auto text-[10px] font-mono px-2 py-1 rounded ${
                  status === 'approved' ? 'bg-green-500/15 text-green-300'
                    : status === 'rejected' ? 'bg-red-500/15 text-red-300'
                      : 'bg-yellow-500/15 text-yellow-300'
                }`}>
                  {status}
                </span>
              </div>
              <p className="mt-2 text-sm text-[#F8FAFC] truncate">{cut.preview}</p>
              <div className="mt-2 flex items-center justify-between text-[11px] font-mono text-[#CBD5E1]/60">
                <span>{formatTime(cut.inicio)} - {formatTime(cut.fim)}</span>
                <span>{cut.duracao.toFixed(1)}s</span>
              </div>
            </button>
          );
        })}
      </div>
    );
  };

  const renderInspector = () => {
    if (!selected) {
      return (
        <div className={`p-4 text-sm ${shell.muted}`}>
          Selecione uma palavra, corte ou cena para ver detalhes e controles.
        </div>
      );
    }

    if (selected.type === 'cut') {
      const cut = selected.item;
      const status = getCutStatus(cut);
      return (
        <div className="p-4 space-y-4">
          <div>
            <p className="text-xs font-mono uppercase text-[#CBD5E1]/60">Corte selecionado</p>
            <h3 className="text-[#F8FAFC] font-semibold mt-1">{cut.tipo}</h3>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className={`${shell.panelSoft} rounded-xl p-3`}>
              <p className="text-[#CBD5E1]/60">Início</p>
              <p className="text-[#F8FAFC] font-mono mt-1">{formatTime(cut.inicio)}</p>
            </div>
            <div className={`${shell.panelSoft} rounded-xl p-3`}>
              <p className="text-[#CBD5E1]/60">Duração</p>
              <p className="text-[#F8FAFC] font-mono mt-1">{cut.duracao.toFixed(2)}s</p>
            </div>
          </div>
          <div className="text-sm text-[#E2E8F0] leading-5">
            <p className="text-[#CBD5E1]/60 text-xs uppercase font-mono mb-1">Motivo</p>
            {cut.reason || 'Sugestao automatica.'}
          </div>
          <div className="text-xs text-[#CBD5E1]/65">
            Confiança: {Math.round((cut.confidence ?? 0) * 100)}% · Risco: {cut.riskLevel ?? 'low'} · Estado: {status}
          </div>
          <div className="grid grid-cols-3 gap-2">
            <button onClick={() => setCutStatus(cut, 'approved')} className="rounded-full bg-[#10B981]/15 text-green-300 py-2 flex items-center justify-center gap-1 text-xs font-semibold">
              <Check size={13} /> Aprovar
            </button>
            <button onClick={() => setCutStatus(cut, 'pending')} className="rounded-full bg-[#F59E0B]/15 text-yellow-300 py-2 flex items-center justify-center gap-1 text-xs font-semibold">
              <Clock size={13} /> Pendente
            </button>
            <button onClick={() => setCutStatus(cut, 'rejected')} className="rounded-full bg-[#EF4444]/15 text-red-300 py-2 flex items-center justify-center gap-1 text-xs font-semibold">
              <X size={13} /> Rejeitar
            </button>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => playRange(Math.max(0, cut.inicio - 2), cut.inicio)}
              className={`rounded-full py-2 flex items-center justify-center gap-1 text-xs font-semibold ${shell.ghost}`}
            >
              <Play size={13} /> Antes
            </button>
            <button
              onClick={() => playRange(cut.inicio, cut.fim)}
              className={`rounded-full py-2 flex items-center justify-center gap-1 text-xs font-semibold ${shell.ghost}`}
            >
              <Scissors size={13} /> Corte
            </button>
            <button
              onClick={() => playRange(cut.fim, cut.fim + 2)}
              className={`rounded-full py-2 flex items-center justify-center gap-1 text-xs font-semibold ${shell.ghost}`}
            >
              <Play size={13} /> Depois
            </button>
          </div>
        </div>
      );
    }

    if (selected.type === 'scene') {
      const scene = selected.item;
      return (
        <div className="p-4 space-y-3 text-sm">
          <p className="text-xs font-mono uppercase text-[#CBD5E1]/60">Cena {scene.id}</p>
          <p className="text-[#FB923C] font-mono">{scene.tipo}</p>
          <p className="text-[#E2E8F0]">{String(Object.values(scene.conteudo)[0] ?? '')}</p>
          <p className="text-xs text-[#CBD5E1]/65">
            {formatTime(scene.frame_inicio / project.fps)} - {formatTime(scene.frame_fim / project.fps)}
          </p>
        </div>
      );
    }

    return (
      <div className="p-4 space-y-3 text-sm">
        <p className="text-xs font-mono uppercase text-[#CBD5E1]/60">Palavra</p>
        <p className="text-[#F8FAFC] text-lg font-semibold">{selected.item.word}</p>
        <p className="text-xs text-[#CBD5E1]/65">
          {formatTime(selected.item.start)} - {formatTime(selected.item.end)}
        </p>
      </div>
    );
  };

  return (
    <div className={`h-screen min-h-[720px] ${shell.page} flex flex-col overflow-hidden relative`}>
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_20%_0%,rgba(107,70,193,0.22),transparent_42%),radial-gradient(ellipse_at_85%_18%,rgba(249,115,22,0.12),transparent_32%)]" />
      <header className={`relative h-16 border-b ${shell.line} bg-[#0F0F1A]/92 backdrop-blur-xl flex items-center px-4 gap-3 flex-shrink-0`}>
        <button onClick={() => onNavigate(View.EDIT_AI_DASHBOARD)} className="text-[#CBD5E1]/70 hover:text-[#F8FAFC]">
          <SplitSquareHorizontal size={18} />
        </button>
        <div className="min-w-0">
          <p className="text-[11px] font-mono uppercase tracking-[0.18em] text-[#14B8A6]">EditAI Studio</p>
          <p className="text-sm font-semibold truncate max-w-[420px]">{project.title || project.sourceFileName}</p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <span className="rounded-full bg-white/[0.06] border border-white/[0.08] px-3 py-1.5 text-xs font-mono text-[#CBD5E1]">{STATUS_LABELS[project.status]}</span>
          <span className="text-xs font-mono text-[#CBD5E1]/70">{formatTime(currentTime)} / {formatTime(duration)}</span>
          {project.status === 'rendering' && <span className="text-xs text-[#FFB800]">{project.renderProgress}%</span>}
          <button onClick={load} className={`rounded-full px-3 py-2 text-xs font-semibold flex items-center gap-2 ${shell.ghost}`}>
            <RefreshCw size={14} /> Atualizar
          </button>
          {timeline.media.output && (
            <a href={timeline.media.output} download={`${project.title}.mp4`} className={`rounded-full px-4 py-2 text-xs font-bold flex items-center gap-2 ${shell.cta}`}>
              <Download size={14} /> Exportar
            </a>
          )}
        </div>
      </header>

      {error && (
        <div className="relative bg-red-500/15 border-b border-red-500/30 text-red-200 px-4 py-2 text-sm">
          {error}
        </div>
      )}

      <main className="relative flex-1 min-h-0 grid grid-cols-[340px_1fr_320px] gap-3 p-3">
        <aside className={`min-h-0 flex flex-col rounded-2xl overflow-hidden ${shell.panel}`}>
          <nav className={`grid grid-cols-4 border-b ${shell.line}`}>
            {([
              ['transcript', Captions],
              ['cuts', Scissors],
              ['scenes', Layers],
              ['automation', Bot],
            ] as const).map(([id, Icon]) => (
              <button
                key={id}
                onClick={() => setTab(id)}
                className={`h-12 flex items-center justify-center transition-colors ${tab === id ? 'text-[#FB923C] bg-white/[0.08]' : 'text-[#CBD5E1]/60 hover:text-[#F8FAFC]'}`}
                title={id}
              >
                <Icon size={17} />
              </button>
            ))}
          </nav>
          {renderLeftPanel()}
        </aside>

        <section className={`min-w-0 min-h-0 flex flex-col rounded-2xl overflow-hidden ${shell.panel}`}>
          <div className="flex-1 min-h-0 flex items-center justify-center p-5 bg-[#050507]/65">
            {activeMedia ? (
              <video
                ref={videoRef}
                src={activeMedia}
                controls
                onTimeUpdate={(event) => setCurrentTime(event.currentTarget.currentTime)}
                className="max-h-full max-w-full bg-black shadow-[0_25px_80px_rgba(0,0,0,0.65)] rounded-xl border border-white/[0.08]"
                style={{ aspectRatio: project.formatoDestino === 'youtube' ? '16/9' : '9/16' }}
              />
            ) : (
              <div className="text-[#CBD5E1]/70 text-sm flex items-center gap-2">
                <Loader2 className="animate-spin text-[#8B5CF6]" size={18} /> Preparando mídia para você...
              </div>
            )}
          </div>

          <div className={`h-80 border-t ${shell.line} bg-[#0A0A0F]/70 p-4 flex flex-col gap-3`}>
            <div className="grid grid-cols-4 gap-3 text-xs">
              <div className="rounded-xl bg-white/[0.045] border border-white/[0.07] p-3"><span className="text-[#CBD5E1]/60">Original</span><p className="font-mono text-[#F8FAFC]">{formatTime(timeline.sourceDuration)}</p></div>
              <div className="rounded-xl bg-white/[0.045] border border-white/[0.07] p-3"><span className="text-[#CBD5E1]/60">Final estimado</span><p className="font-mono text-[#14B8A6]">{formatTime(timeline.keptDuration)}</p></div>
              <div className="rounded-xl bg-white/[0.045] border border-white/[0.07] p-3"><span className="text-[#CBD5E1]/60">Removido</span><p className="font-mono text-[#FB923C]">{formatTime(timeline.removedDuration)}</p></div>
              <div className="rounded-xl bg-white/[0.045] border border-white/[0.07] p-3"><span className="text-[#CBD5E1]/60">Aprovados</span><p className="font-mono text-[#8B5CF6]">{approvedCount}/{cuts.length}</p></div>
            </div>

            <div className="grid grid-cols-[1fr_auto] gap-3 items-center">
              <div className="flex items-center gap-2 text-xs min-w-0">
                <span className="font-mono text-[#CBD5E1]/60">cursor {formatTime(currentTime)}</span>
                <span className="font-mono text-[#14B8A6]">in {manualRange.start === null ? '--' : formatTime(manualRange.start)}</span>
                <span className="font-mono text-[#FB923C]">out {manualRange.end === null ? '--' : formatTime(manualRange.end)}</span>
                {manualCutWindow && <span className="truncate text-[#E2E8F0]/75">remover {formatTime(manualCutWindow.end - manualCutWindow.start)} · {manualRangeWords.length} palavras</span>}
              </div>
              <div className="flex items-center gap-2">
                {focusMoments.map((moment) => (
                  <button
                    key={moment.label}
                    onClick={() => seekTo(moment.second)}
                    className="px-3 py-2 rounded-full text-xs font-bold border border-[#EF4444]/35 bg-[#EF4444]/10 text-[#FECACA] hover:bg-[#EF4444]/18"
                  >
                    {moment.label}
                  </button>
                ))}
                <button onClick={() => markManualPoint('start')} className={`px-3 py-2 rounded-full text-xs font-semibold ${shell.ghost}`}>Marcar início</button>
                <button onClick={() => markManualPoint('end')} className={`px-3 py-2 rounded-full text-xs font-semibold ${shell.ghost}`}>Marcar fim</button>
                <button onClick={createManualTimelineCut} disabled={!manualCutWindow || busyAction === 'saving'} className={`px-3 py-2 rounded-full text-xs font-bold disabled:opacity-40 ${shell.cta}`}><Scissors size={13} className="inline mr-1" />Cortar aprovado</button>
                <button onClick={reanalyzeCuts} disabled={busyAction === 'reanalyze'} className={`px-3 py-2 rounded-full text-xs font-semibold disabled:opacity-40 ${shell.ghost}`}>
                  {busyAction === 'reanalyze' ? <Loader2 size={13} className="inline mr-1 animate-spin" /> : <RefreshCw size={13} className="inline mr-1" />}Reanalisar
                </button>
                <button onClick={clearManualRange} className={`px-3 py-2 rounded-full text-xs font-semibold ${shell.ghost}`}>Limpar</button>
              </div>
            </div>

            <div
              ref={timelineRef}
              onPointerDown={seekFromTimeline}
              className="relative flex-1 rounded-xl bg-[#0F0F1A] border border-white/[0.08] overflow-hidden shadow-inner cursor-crosshair"
            >
              <div className="absolute left-3 top-4 text-[10px] font-mono text-[#CBD5E1]/45">tempo</div>
              <div className="absolute left-3 top-[58px] text-[10px] font-mono text-[#CBD5E1]/45">cortes</div>
              <div className="absolute left-3 top-[112px] text-[10px] font-mono text-[#CBD5E1]/45">palavras</div>
              <div className="absolute left-3 top-[156px] text-[10px] font-mono text-[#CBD5E1]/45">cenas</div>
              <div className="absolute inset-x-16 top-8 h-px bg-white/[0.16]" />
              <div className="absolute inset-x-16 top-[58px] h-8 rounded-md bg-white/[0.055]" />
              <div className="absolute inset-x-16 top-28 h-6 rounded-md bg-white/[0.035]" />
              <div className="absolute inset-x-16 top-40 h-6 rounded-md bg-white/[0.035]" />
              {timelineTicks.map((tick) => (
                <span
                  key={tick.second}
                  className={`absolute top-4 ${tick.major ? 'h-8 bg-white/45' : 'h-5 bg-white/20'} w-px`}
                  style={{ left: `${tick.left}%` }}
                >
                  {tick.label && (
                    <span className="absolute -translate-x-1/2 top-9 font-mono text-[10px] text-[#E2E8F0]/75 whitespace-nowrap">
                      {tick.second}s
                    </span>
                  )}
                </span>
              ))}
              {focusMoments.map((moment) => (
                <button
                  key={`marker-${moment.label}`}
                  onClick={(event) => {
                    event.stopPropagation();
                    seekTo(moment.second);
                  }}
                  className="absolute top-1 bottom-1 w-px"
                  style={{ left: `${Math.min(100, Math.max(0, (moment.second / duration) * 100))}%`, background: moment.tone }}
                  title={`${moment.label}: ${formatTime(moment.second)}`}
                >
                  <span
                    className="absolute left-1 top-1 rounded-full px-2 py-0.5 text-[10px] font-bold text-white shadow-lg"
                    style={{ background: moment.tone }}
                  >
                    {moment.label}
                  </span>
                </button>
              ))}
              {manualRange.start !== null && (
                <span
                  className="absolute top-2 bottom-2 w-px bg-[#14B8A6] shadow-[0_0_18px_rgba(20,184,166,0.8)]"
                  style={{ left: `${Math.min(100, Math.max(0, (manualRange.start / duration) * 100))}%` }}
                />
              )}
              {manualRange.end !== null && (
                <span
                  className="absolute top-2 bottom-2 w-px bg-[#FB923C] shadow-[0_0_18px_rgba(251,146,60,0.8)]"
                  style={{ left: `${Math.min(100, Math.max(0, (manualRange.end / duration) * 100))}%` }}
                />
              )}
              {manualCutWindow && (
                <button
                  onClick={(event) => {
                    event.stopPropagation();
                    playRange(manualCutWindow.start, manualCutWindow.end);
                  }}
                  className="absolute top-14 bottom-4 rounded-md border border-[#FB923C]/70 bg-[#FB923C]/18"
                  style={{
                    left: `${Math.max(0, (manualCutWindow.start / duration) * 100)}%`,
                    width: `${Math.max(0.4, ((manualCutWindow.end - manualCutWindow.start) / duration) * 100)}%`,
                  }}
                  title={`Corte manual: ${formatTime(manualCutWindow.start)} - ${formatTime(manualCutWindow.end)}`}
                />
              )}
              {cuts.map((cut) => {
                const left = Math.max(0, (cut.inicio / duration) * 100);
                const width = Math.max(0.3, (cut.duracao / duration) * 100);
                const status = getCutStatus(cut);
                return (
                  <button
                    key={cut.id}
                    onClick={(event) => {
                      event.stopPropagation();
                      setSelected({ type: 'cut', item: cut });
                      setTab('cuts');
                      seekTo(Math.max(0, cut.inicio - 0.4));
                    }}
                    className="absolute top-[58px] h-10 rounded-md border border-black/40 shadow-[0_0_18px_rgba(0,0,0,0.28)]"
                    style={{
                      left: `${left}%`,
                      width: `${width}%`,
                      background: CUT_COLORS[cut.tipo],
                      opacity: status === 'rejected' ? 0.25 : status === 'pending' ? 0.55 : 0.9,
                    }}
                    title={`${cut.tipo}: ${formatTime(cut.inicio)} - ${formatTime(cut.fim)}`}
                  />
                );
              })}
              {words.map((word) => {
                const left = Math.max(0, (word.start / duration) * 100);
                const width = Math.max(0.15, ((word.end - word.start) / duration) * 100);
                const isSelected = Boolean(wordSelection && word.index >= wordSelection.startIndex && word.index <= wordSelection.endIndex);
                return (
                  <button
                    key={word.index}
                    onClick={(event) => {
                      event.stopPropagation();
                      setTab('transcript');
                      toggleWordSelection(word);
                    }}
                    className={`absolute top-28 h-6 rounded-sm ${isSelected ? 'bg-[#FB923C]/85' : 'bg-[#EDE9FE]/22 hover:bg-[#8B5CF6]/55'}`}
                    style={{ left: `${left}%`, width: `${width}%` }}
                    title={`${word.word} · ${formatTime(word.start)}`}
                  />
                );
              })}
              {scenes.map((scene) => {
                const start = scene.frame_inicio / project.fps;
                const end = scene.frame_fim / project.fps;
                const left = Math.max(0, (start / duration) * 100);
                const width = Math.max(0.5, ((end - start) / duration) * 100);
                return <span key={scene.id} className="absolute top-40 h-6 rounded-md bg-gradient-to-r from-[#6B46C1] to-[#F97316] border border-white/[0.18]" style={{ left: `${left}%`, width: `${width}%` }} />;
              })}
              <div className="absolute top-0 bottom-0 w-px bg-[#FB923C] shadow-[0_0_18px_rgba(249,115,22,0.8)]" style={{ left: `${Math.min(100, (currentTime / duration) * 100)}%` }} />
            </div>
          </div>
        </section>

        <aside className={`min-h-0 overflow-y-auto rounded-2xl ${shell.panel}`}>
          <div className={`p-4 border-b ${shell.line}`}>
            <p className="text-xs font-mono uppercase tracking-[0.14em] text-[#14B8A6]">Inspector</p>
            <div className="mt-3 grid grid-cols-3 gap-2 text-center text-[11px]">
              <div className="bg-white/[0.045] border border-white/[0.07] rounded-xl p-2"><p className="text-[#F8FAFC] font-mono">{pendingCount}</p><p className="text-[#CBD5E1]/60">pend.</p></div>
              <div className="bg-white/[0.045] border border-white/[0.07] rounded-xl p-2"><p className="text-[#F8FAFC] font-mono">{riskCount}</p><p className="text-[#CBD5E1]/60">risco</p></div>
              <div className="bg-white/[0.045] border border-white/[0.07] rounded-xl p-2"><p className="text-[#F8FAFC] font-mono">{scenes.length}</p><p className="text-[#CBD5E1]/60">cenas</p></div>
            </div>
          </div>
          {renderInspector()}
        </aside>
      </main>
    </div>
  );
};

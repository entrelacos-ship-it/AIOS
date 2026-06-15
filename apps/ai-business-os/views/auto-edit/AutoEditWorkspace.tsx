import React, { useEffect, useRef, useState } from 'react';
import {
  ArrowLeft, Play, CheckCircle2, Loader2, AlertCircle,
  Clock, Download, Film, Scissors, FileText, Tag, Copy,
} from 'lucide-react';
import type { AutoEditProject, AutoEditSegment, AutoEditMetadata } from '../../types';
import { View } from '../../types';

interface Props {
  projectId: string;
  onNavigate: (view: View) => void;
}

interface LogEntry {
  text: string;
  ts: number;
}

const PIPELINE_STAGES = [
  { key: 'normalizing', label: 'Normalização' },
  { key: 'transcribing', label: 'Transcrição' },
  { key: 'planning', label: 'Plano de Cortes' },
  { key: 'cutting', label: 'Execução FFmpeg' },
  { key: 'captioning', label: 'Legendas SRT' },
  { key: 'metadata', label: 'Metadados SEO' },
  { key: 'shorts', label: 'Shorts 9:16' },
];

function parseSseBlocks(raw: string): Array<{ event: string; data: unknown }> {
  const out: Array<{ event: string; data: unknown }> = [];
  for (const block of raw.split('\n\n')) {
    if (!block.trim()) continue;
    let event = 'message';
    let dataStr = '';
    for (const line of block.split('\n')) {
      if (line.startsWith('event: ')) event = line.slice(7).trim();
      else if (line.startsWith('data: ')) dataStr = line.slice(6).trim();
    }
    if (dataStr) {
      try { out.push({ event, data: JSON.parse(dataStr) }); } catch { /* skip */ }
    }
  }
  return out;
}

export const AutoEditWorkspace: React.FC<Props> = ({ projectId, onNavigate }) => {
  const [project, setProject] = useState<AutoEditProject | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [running, setRunning] = useState(false);
  const [currentStage, setCurrentStage] = useState<string>('');
  const [segments, setSegments] = useState<AutoEditSegment[]>([]);
  const [metadata, setMetadata] = useState<AutoEditMetadata | null>(null);
  const [captionCount, setCaptionCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState<string | null>(null);
  const logsRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (logsRef.current) logsRef.current.scrollTop = logsRef.current.scrollHeight;
  }, [logs]);

  const loadProject = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/auto-edit/${projectId}`);
      if (!res.ok) return;
      const p = await res.json() as AutoEditProject;
      setProject(p);
      if (p.segments?.length) setSegments(p.segments);
      if (p.metadata) setMetadata(p.metadata);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void loadProject(); }, [projectId]);

  const handleRun = async () => {
    if (running) return;
    setRunning(true);
    setLogs([]);
    setCurrentStage('');

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const res = await fetch(`/api/auto-edit/${projectId}/run`, { signal: controller.signal });
      if (!res.ok || !res.body) {
        setRunning(false);
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        for (const { event, data } of parseSseBlocks(buffer)) {
          buffer = '';
          const d = data as Record<string, unknown>;
          if (event === 'stage') setCurrentStage(String(d.name ?? ''));
          if (event === 'log') setLogs((prev) => [...prev, { text: String(d.text ?? ''), ts: Date.now() }]);
          if (event === 'plan') {
            const segs = (d.segments ?? []) as AutoEditSegment[];
            setSegments(segs);
          }
          if (event === 'metadata') setMetadata(d as AutoEditMetadata);
          if (event === 'captions') setCaptionCount(Number(d.lineCount ?? 0));
          if (event === 'done' || event === 'error') {
            setRunning(false);
            void loadProject();
          }
        }
      }
    } catch (e) {
      if ((e as Error).name !== 'AbortError') setRunning(false);
    } finally {
      setRunning(false);
      abortRef.current = null;
    }
  };

  const copyText = (text: string, key: string) => {
    void navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 1500);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 text-rose-400 animate-spin" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">Projeto não encontrado.</p>
      </div>
    );
  }

  const isDone = project.stage === 'done';
  const isError = project.stage === 'error';
  const canRun = !running && project.stage !== 'done';

  const getStageStatus = (key: string) => {
    if (isDone) return 'done';
    if (isError && currentStage === key) return 'error';
    if (currentStage === key && running) return 'running';
    const stageOrder = PIPELINE_STAGES.map((s) => s.key);
    const currentIdx = stageOrder.indexOf(currentStage);
    const thisIdx = stageOrder.indexOf(key);
    if (currentIdx > thisIdx) return 'done';
    return 'pending';
  };

  return (
    <div className="flex h-[calc(100vh-128px)] gap-0 -m-8 mt-0">
      {/* Left: pipeline stages */}
      <div className="w-56 flex-shrink-0 bg-[#0d0d0d] border-r border-[#1a1a1a] flex flex-col">
        <button
          onClick={() => onNavigate(View.AUTO_EDIT)}
          className="flex items-center gap-2 px-4 py-3 text-xs text-gray-500 hover:text-gray-300 transition-colors border-b border-[#1a1a1a]"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Projetos
        </button>

        <div className="px-4 py-4 border-b border-[#1a1a1a]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-rose-500/20 flex items-center justify-center">
              <Film className="w-4 h-4 text-rose-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-white truncate">{project.title}</p>
              <p className="text-[10px] text-gray-600 truncate">{project.sourceFileName}</p>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-1">
          {PIPELINE_STAGES.map((stage) => {
            const status = getStageStatus(stage.key);
            return (
              <div key={stage.key} className="flex items-center gap-2.5 px-2 py-2 rounded-lg">
                {status === 'done' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />}
                {status === 'running' && <Loader2 className="w-3.5 h-3.5 text-rose-400 animate-spin flex-shrink-0" />}
                {status === 'error' && <AlertCircle className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />}
                {status === 'pending' && <Clock className="w-3.5 h-3.5 text-gray-700 flex-shrink-0" />}
                <span className={`text-xs ${
                  status === 'done' ? 'text-emerald-400' :
                  status === 'running' ? 'text-rose-300' :
                  status === 'error' ? 'text-red-400' :
                  'text-gray-600'
                }`}>{stage.label}</span>
              </div>
            );
          })}
        </div>

        <div className="p-3 border-t border-[#1a1a1a]">
          <button
            onClick={handleRun}
            disabled={!canRun}
            className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg bg-rose-600 hover:bg-rose-500 disabled:opacity-40 text-white text-xs font-medium transition-colors"
          >
            {running
              ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Executando...</>
              : isDone
              ? <><CheckCircle2 className="w-3.5 h-3.5" /> Concluído</>
              : <><Play className="w-3.5 h-3.5" /> Executar Pipeline</>
            }
          </button>
        </div>
      </div>

      {/* Center: live log + results */}
      <div className="flex-1 flex flex-col bg-[#080808] overflow-hidden">
        {/* Log stream */}
        <div className="flex-1 overflow-y-auto p-5 space-y-1 font-mono text-xs" ref={logsRef}>
          {logs.length === 0 && !running && !isDone && (
            <div className="flex flex-col items-center justify-center h-full gap-3 text-center text-gray-600">
              <Scissors className="w-8 h-8 text-rose-500/30" />
              <p>Clique em <span className="text-rose-400 font-semibold">Executar Pipeline</span> para iniciar</p>
            </div>
          )}
          {logs.map((l, i) => (
            <div key={i} className="text-gray-400">
              <span className="text-gray-700 mr-2">[{new Date(l.ts).toLocaleTimeString()}]</span>
              {l.text}
            </div>
          ))}
          {isError && project.error && (
            <div className="text-red-400 mt-2">
              <span className="text-red-700 mr-2">[ERRO]</span>
              {project.error}
            </div>
          )}
        </div>

        {/* Results panel (when done) */}
        {isDone && (
          <div className="border-t border-[#1a1a1a] bg-[#0d0d0d] p-5 space-y-4 max-h-[55%] overflow-y-auto">

            {/* Video output */}
            <div>
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                <Film className="w-3.5 h-3.5" />
                Vídeo Editado
              </h3>
              <div className="rounded-xl overflow-hidden bg-black aspect-video max-w-2xl">
                <video
                  src={`/api/auto-edit/${projectId}/video`}
                  controls
                  className="w-full h-full"
                  preload="metadata"
                />
              </div>
              <div className="flex items-center gap-3 mt-3">
                <a
                  href={`/api/auto-edit/${projectId}/video`}
                  download
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 text-xs transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  Baixar MP4
                </a>
                <a
                  href={`/api/auto-edit/${projectId}/captions`}
                  download
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 text-xs transition-colors"
                >
                  <FileText className="w-3.5 h-3.5" />
                  Baixar SRT ({captionCount || '...'})
                </a>
                {project.includeShorts && (
                  <a
                    href={`/api/auto-edit/${projectId}/shorts`}
                    download
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Baixar Shorts 9:16
                  </a>
                )}
              </div>
            </div>

            {/* Cut plan summary */}
            {segments.length > 0 && (
              <div>
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                  <Scissors className="w-3.5 h-3.5" />
                  Plano de Cortes ({segments.filter(s => s.keep).length} mantidos · {segments.filter(s => !s.keep).length} cortados)
                </h3>
                <div className="flex flex-wrap gap-1">
                  {segments.map((seg, i) => (
                    <span
                      key={i}
                      title={seg.reason}
                      className={`text-[10px] px-2 py-0.5 rounded ${
                        seg.keep ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
                      }`}
                    >
                      {seg.start.toFixed(1)}–{seg.end.toFixed(1)}s
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Metadata */}
            {metadata && (
              <div>
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                  <Tag className="w-3.5 h-3.5" />
                  Metadados SEO
                </h3>
                <div className="space-y-3">
                  <div className="bg-[#111] border border-[#1a1a1a] rounded-lg p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] text-gray-600 mb-1">Título</p>
                        <p className="text-sm text-white">{metadata.title}</p>
                      </div>
                      <button onClick={() => copyText(metadata.title, 'title')} className="text-gray-600 hover:text-gray-400">
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    {copied === 'title' && <p className="text-[10px] text-emerald-400 mt-1">Copiado!</p>}
                  </div>

                  <div className="bg-[#111] border border-[#1a1a1a] rounded-lg p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] text-gray-600 mb-1">Descrição</p>
                        <p className="text-xs text-gray-300 leading-relaxed">{metadata.description}</p>
                      </div>
                      <button onClick={() => copyText(metadata.description, 'desc')} className="text-gray-600 hover:text-gray-400">
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    {copied === 'desc' && <p className="text-[10px] text-emerald-400 mt-1">Copiado!</p>}
                  </div>

                  {metadata.hashtags?.length > 0 && (
                    <div className="bg-[#111] border border-[#1a1a1a] rounded-lg p-3">
                      <p className="text-[10px] text-gray-600 mb-2">Hashtags</p>
                      <div className="flex flex-wrap gap-1.5">
                        {metadata.hashtags.map((tag) => (
                          <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400">
                            #{tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {(metadata.shortsTitle || metadata.shortsDescription) && (
                    <div className="bg-rose-500/5 border border-rose-500/20 rounded-lg p-3 space-y-2">
                      <p className="text-[10px] text-rose-400 font-bold uppercase tracking-wider">Shorts / Reels</p>
                      {metadata.shortsTitle && <p className="text-sm text-white">{metadata.shortsTitle}</p>}
                      {metadata.shortsDescription && <p className="text-xs text-gray-400">{metadata.shortsDescription}</p>}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

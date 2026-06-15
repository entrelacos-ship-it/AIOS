import React, { useRef, useState, useEffect } from 'react';
import {
  Download,
  Copy,
  RefreshCw,
  Star,
  ArrowLeft,
  Smartphone,
  Monitor,
  Square,
  AlertTriangle,
  Loader2,
  Check,
  FileImage,
  FileText,
  Film,
} from 'lucide-react';
import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer } from 'recharts';
import type { DesignArtifact } from '../../types';
import {
  generateDesignCritique,
  generateDesignArtifact,
  PHILOSOPHY_META,
  OUTPUT_TYPE_META,
} from '../../services/designStudioService';

const DS_HISTORY_KEY = 'ds:history';

interface Props {
  artifact: DesignArtifact;
  onArtifactUpdate: (artifact: DesignArtifact) => void;
  onCritiqueReady: (artifact: DesignArtifact) => void;
  onNewBrief: () => void;
}

export const DesignStudioWorkspace: React.FC<Props> = ({
  artifact,
  onArtifactUpdate,
  onCritiqueReady,
  onNewBrief,
}) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [panelSize, setPanelSize] = useState({ width: 800, height: 600 });

  const [isCritiquing, setIsCritiquing] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [confirmRegenerate, setConfirmRegenerate] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [exportingPng, setExportingPng] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);
  const [exportingPptx, setExportingPptx] = useState(false);
  const [capturingFrames, setCapturingFrames] = useState(false);
  const [framesCount, setFramesCount] = useState<number | null>(null);

  const { brief, htmlContent, critiqueScore } = artifact;
  const philosophyMeta = PHILOSOPHY_META[brief.philosophySchool];
  const outputMeta = OUTPUT_TYPE_META[brief.outputType];

  // HTML safety checks
  const isHtmlTooShort = htmlContent.length < 200;
  const isTruncated = !htmlContent.includes('</html>');

  // Track panel size for device frame scaling
  useEffect(() => {
    const el = panelRef.current;
    if (!el) return;
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) {
        setPanelSize({
          width: entry.contentRect.width,
          height: entry.contentRect.height,
        });
      }
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Persist artifact update to localStorage history
  const persistUpdate = (updated: DesignArtifact) => {
    try {
      const raw = localStorage.getItem(DS_HISTORY_KEY);
      const history: DesignArtifact[] = raw ? JSON.parse(raw) : [];
      const idx = history.findIndex((a) => a.id === updated.id);
      if (idx !== -1) history[idx] = updated;
      else history.unshift(updated);
      localStorage.setItem(DS_HISTORY_KEY, JSON.stringify(history.slice(0, 20)));
    } catch {
      // ignore
    }
  };

  const handleRunCritique = async () => {
    setError(null);
    setIsCritiquing(true);
    try {
      const critiqueScore = await generateDesignCritique(brief, htmlContent);
      const updated = { ...artifact, critiqueScore };
      persistUpdate(updated);
      onArtifactUpdate(updated);
      onCritiqueReady(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao gerar crítica.');
    } finally {
      setIsCritiquing(false);
    }
  };

  const handleRegenerate = async () => {
    if (!confirmRegenerate) {
      setConfirmRegenerate(true);
      setTimeout(() => setConfirmRegenerate(false), 3000);
      return;
    }
    setConfirmRegenerate(false);
    setError(null);
    setIsRegenerating(true);
    try {
      const newHtml = await generateDesignArtifact(brief);
      const updated: DesignArtifact = {
        ...artifact,
        htmlContent: newHtml,
        critiqueScore: undefined,
      };
      persistUpdate(updated);
      onArtifactUpdate(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao regenerar.');
    } finally {
      setIsRegenerating(false);
    }
  };

  const handleExport = () => {
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${brief.title.replace(/\s+/g, '-').toLowerCase()}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(htmlContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadBinaryFromApi = async (
    endpoint: string,
    body: Record<string, unknown>,
    filename: string,
    mimeType: string,
  ) => {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`Export falhou: ${res.status}`);
    const blob = await res.blob();
    const url = URL.createObjectURL(new Blob([blob], { type: mimeType }));
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const safeSlug = brief.title.replace(/[^a-z0-9]/gi, '_').toLowerCase();

  const handleExportPng = async () => {
    setError(null);
    setExportingPng(true);
    try {
      const w = brief.outputType === 'infographic' ? 1080 : brief.deviceFrame === 'iphone_15' ? 390 : 1200;
      const h = brief.outputType === 'infographic' ? 1920 : brief.deviceFrame === 'iphone_15' ? 844 : 800;
      await downloadBinaryFromApi(
        '/api/design-studio/export-png',
        { html: htmlContent, width: w, height: h },
        `${safeSlug}.png`,
        'image/png',
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao exportar PNG.');
    } finally {
      setExportingPng(false);
    }
  };

  const handleExportPdf = async () => {
    setError(null);
    setExportingPdf(true);
    try {
      const isPresentation = brief.outputType === 'presentation';
      const w = brief.outputType === 'infographic' ? 1080 : 1200;
      const h = brief.outputType === 'infographic' ? 1920 : 800;
      await downloadBinaryFromApi(
        '/api/design-studio/export-pdf',
        { html: htmlContent, width: w, height: h, isPresentation },
        `${safeSlug}.pdf`,
        'application/pdf',
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao exportar PDF.');
    } finally {
      setExportingPdf(false);
    }
  };

  const handleExportPptx = async () => {
    setError(null);
    setExportingPptx(true);
    try {
      await downloadBinaryFromApi(
        '/api/design-studio/export-pptx',
        { html: htmlContent, title: brief.title },
        `${safeSlug}.pptx`,
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao exportar PPTX.');
    } finally {
      setExportingPptx(false);
    }
  };

  const handleCaptureFrames = async () => {
    setError(null);
    setCapturingFrames(true);
    setFramesCount(null);
    try {
      const res = await fetch('/api/design-studio/motion-frames', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ html: htmlContent, width: 960, height: 540, durationMs: 3000, fps: 10 }),
      });
      if (!res.ok) throw new Error(`Captura falhou: ${res.status}`);
      const data = await res.json() as { frames: string[] };
      setFramesCount(data.frames.length);
      // Download each frame as individual PNG
      data.frames.forEach((frame, i) => {
        const a = document.createElement('a');
        a.href = frame;
        a.download = `${safeSlug}_frame_${String(i + 1).padStart(3, '0')}.png`;
        a.click();
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao capturar frames.');
    } finally {
      setCapturingFrames(false);
    }
  };

  // Device frame configuration
  const frameConfig = getFrameConfig(brief.deviceFrame, panelSize);

  // Mini radar data
  const radarData = critiqueScore
    ? [
        { subject: 'Filosofia', value: critiqueScore.philosophy },
        { subject: 'Hierarquia', value: critiqueScore.hierarchy },
        { subject: 'Craft', value: critiqueScore.craft },
        { subject: 'Função', value: critiqueScore.functionality },
        { subject: 'Orig.', value: critiqueScore.originality },
      ]
    : [];

  const avgScore = critiqueScore
    ? Math.round(
        (critiqueScore.philosophy +
          critiqueScore.hierarchy +
          critiqueScore.craft +
          critiqueScore.functionality +
          critiqueScore.originality) /
          5,
      )
    : null;

  return (
    <div className="flex h-[calc(100vh-128px)] gap-0 -m-8 mt-0">
      {/* ── Left Panel ───────────────────────────────────── */}
      <div className="w-72 flex-shrink-0 bg-[#0d0d0d] border-r border-[#1a1a1a] flex flex-col overflow-y-auto">
        {/* Back */}
        <button
          onClick={onNewBrief}
          className="flex items-center gap-2 px-4 py-3 text-xs text-gray-500 hover:text-gray-300 transition-colors border-b border-[#1a1a1a]"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Novo brief
        </button>

        {/* Artifact info */}
        <div className="px-4 py-4 border-b border-[#1a1a1a]">
          <h2 className="text-sm font-semibold text-white leading-tight mb-2">{brief.title}</h2>
          <div className="flex flex-wrap gap-1.5">
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-300">
              {outputMeta.label}
            </span>
            <span
              className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-gray-400"
              style={{ fontFamily: philosophyMeta.fontFamily }}
            >
              {philosophyMeta.label}
            </span>
          </div>
          <p className="text-[11px] text-gray-600 mt-2 leading-relaxed line-clamp-3">
            {brief.description}
          </p>
        </div>

        {/* Actions */}
        <div className="px-4 py-4 space-y-2 border-b border-[#1a1a1a]">
          <button
            onClick={handleRunCritique}
            disabled={isCritiquing || isRegenerating}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-violet-600/90 hover:bg-violet-600 disabled:opacity-40 text-white text-xs font-medium transition-all"
          >
            {isCritiquing ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Analisando...
              </>
            ) : (
              <>
                <Star className="w-3.5 h-3.5" />
                Executar crítica
              </>
            )}
          </button>

          <button
            onClick={handleRegenerate}
            disabled={isRegenerating || isCritiquing}
            className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-medium transition-all ${
              confirmRegenerate
                ? 'bg-amber-600/90 hover:bg-amber-600 text-white'
                : 'bg-white/5 hover:bg-white/10 text-gray-300'
            } disabled:opacity-40`}
          >
            {isRegenerating ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Regenerando...
              </>
            ) : confirmRegenerate ? (
              <>
                <RefreshCw className="w-3.5 h-3.5" />
                Confirmar?
              </>
            ) : (
              <>
                <RefreshCw className="w-3.5 h-3.5" />
                Regenerar
              </>
            )}
          </button>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={handleExport}
              className="flex items-center justify-center gap-1.5 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 text-xs transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              Exportar
            </button>
            <button
              onClick={handleCopy}
              className="flex items-center justify-center gap-1.5 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 text-xs transition-colors"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Copiado</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  Copiar HTML
                </>
              )}
            </button>
          </div>

          {/* Server-side exports */}
          <div className="pt-1">
            <div className="text-[10px] text-gray-600 mb-2 uppercase tracking-wider">
              Exportar via servidor
            </div>
            <div className="space-y-1.5">
              <button
                onClick={handleExportPng}
                disabled={exportingPng}
                className="w-full flex items-center gap-2 py-2 px-3 rounded-lg bg-white/5 hover:bg-white/8 text-gray-400 text-xs transition-colors disabled:opacity-40"
              >
                {exportingPng ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <FileImage className="w-3.5 h-3.5" />
                )}
                {exportingPng ? 'Renderizando...' : 'Exportar PNG'}
              </button>

              <button
                onClick={handleExportPdf}
                disabled={exportingPdf}
                className="w-full flex items-center gap-2 py-2 px-3 rounded-lg bg-white/5 hover:bg-white/8 text-gray-400 text-xs transition-colors disabled:opacity-40"
              >
                {exportingPdf ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <FileText className="w-3.5 h-3.5" />
                )}
                {exportingPdf ? 'Gerando PDF...' : 'Exportar PDF'}
              </button>

              {brief.outputType === 'presentation' && (
                <button
                  onClick={handleExportPptx}
                  disabled={exportingPptx}
                  className="w-full flex items-center gap-2 py-2 px-3 rounded-lg bg-white/5 hover:bg-white/8 text-gray-400 text-xs transition-colors disabled:opacity-40"
                >
                  {exportingPptx ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Download className="w-3.5 h-3.5" />
                  )}
                  {exportingPptx ? 'Gerando PPTX...' : 'Exportar PPTX'}
                </button>
              )}

              {brief.outputType === 'motion_design' && (
                <button
                  onClick={handleCaptureFrames}
                  disabled={capturingFrames}
                  className="w-full flex items-center gap-2 py-2 px-3 rounded-lg bg-white/5 hover:bg-white/8 text-gray-400 text-xs transition-colors disabled:opacity-40"
                >
                  {capturingFrames ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Film className="w-3.5 h-3.5" />
                  )}
                  {capturingFrames
                    ? 'Capturando frames...'
                    : framesCount !== null
                      ? `${framesCount} frames capturados`
                      : 'Capturar frames PNG'}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mx-4 mt-3 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2.5 text-xs text-red-400">
            {error}
          </div>
        )}

        {/* Mini Radar */}
        {critiqueScore && (
          <div className="px-4 py-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-gray-500">Pontuação crítica</span>
              <span
                className={`text-sm font-bold ${
                  avgScore! >= 70
                    ? 'text-emerald-400'
                    : avgScore! >= 40
                      ? 'text-amber-400'
                      : 'text-red-400'
                }`}
              >
                {avgScore}/100
              </span>
            </div>
            <ResponsiveContainer width="100%" height={140}>
              <RadarChart data={radarData} margin={{ top: 0, right: 10, bottom: 0, left: 10 }}>
                <PolarGrid stroke="#222" />
                <PolarAngleAxis dataKey="subject" tick={{ fontSize: 9, fill: '#666' }} />
                <Radar
                  name="Score"
                  dataKey="value"
                  stroke="#8b5cf6"
                  fill="#8b5cf6"
                  fillOpacity={0.25}
                  strokeWidth={1.5}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* HTML stats */}
        <div className="px-4 py-3 mt-auto border-t border-[#1a1a1a]">
          <div className="text-[10px] text-gray-700 space-y-1">
            <div>
              {htmlContent.length.toLocaleString()} caracteres gerados
            </div>
            <div>{new Date(artifact.createdAt).toLocaleString('pt-BR')}</div>
          </div>
        </div>
      </div>

      {/* ── Right Panel — iframe preview ─────────────────── */}
      <div
        ref={panelRef}
        className="flex-1 bg-[#060606] flex items-center justify-center overflow-hidden relative"
      >
        {isHtmlTooShort ? (
          <div className="text-center p-8">
            <AlertTriangle className="w-8 h-8 text-amber-400 mx-auto mb-3" />
            <div className="text-white font-medium mb-1">Saída inválida</div>
            <div className="text-gray-500 text-sm mb-4">
              O artefato gerado é muito curto ou está malformado.
            </div>
            <button
              onClick={handleRegenerate}
              className="flex items-center gap-2 mx-auto px-4 py-2 rounded-lg bg-violet-600 text-white text-sm"
            >
              <RefreshCw className="w-4 h-4" />
              Regenerar
            </button>
          </div>
        ) : (
          <DeviceFrame
            deviceFrame={brief.deviceFrame}
            frameConfig={frameConfig}
          >
            <iframe
              ref={iframeRef}
              sandbox="allow-scripts allow-same-origin"
              srcDoc={htmlContent}
              title="Design Studio Preview"
              style={{
                width: frameConfig.contentWidth,
                height: frameConfig.contentHeight,
                border: 'none',
                display: 'block',
                background: '#fff',
              }}
            />
          </DeviceFrame>
        )}

        {/* Truncation warning */}
        {!isHtmlTooShort && isTruncated && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-amber-500/90 text-black text-xs px-3 py-1.5 rounded-full">
            <AlertTriangle className="w-3.5 h-3.5" />
            Saída truncada — tente um brief mais simples
          </div>
        )}

        {/* Device frame indicator */}
        <div className="absolute top-3 right-3 flex items-center gap-1.5 bg-black/60 backdrop-blur-sm px-2.5 py-1.5 rounded-lg">
          <DeviceIcon device={brief.deviceFrame} />
          <span className="text-[10px] text-gray-400">
            {brief.deviceFrame === 'iphone_15'
              ? 'iPhone 15 Pro'
              : brief.deviceFrame === 'browser'
                ? 'Browser 1920×1080'
                : 'Sem frame'}
          </span>
        </div>
      </div>
    </div>
  );
};

// ─── Device Frame Component ───────────────────────────────────────────────────

interface FrameConfig {
  contentWidth: number;
  contentHeight: number;
  scale: number;
}

function getFrameConfig(
  device: string,
  panel: { width: number; height: number },
): FrameConfig {
  const padding = 64;
  const availW = panel.width - padding * 2;
  const availH = panel.height - padding * 2;

  if (device === 'iphone_15') {
    const contentW = 390;
    const contentH = 844;
    const scaleW = availW / (contentW + 32); // +32 for chassis padding
    const scaleH = availH / (contentH + 80);
    const scale = Math.min(scaleW, scaleH, 1);
    return { contentWidth: contentW, contentHeight: contentH, scale };
  }

  if (device === 'browser') {
    const contentW = Math.min(availW, 1200);
    const contentH = Math.round(contentW * (9 / 16));
    const scale = availW < contentW ? availW / contentW : 1;
    return { contentWidth: contentW, contentHeight: Math.min(contentH, availH), scale };
  }

  // none
  return {
    contentWidth: Math.min(availW, 1400),
    contentHeight: availH,
    scale: 1,
  };
}

const DeviceFrame: React.FC<{
  deviceFrame: string;
  frameConfig: FrameConfig;
  children: React.ReactNode;
}> = ({ deviceFrame, frameConfig, children }) => {
  const { scale, contentWidth, contentHeight } = frameConfig;

  if (deviceFrame === 'iphone_15') {
    return (
      <div style={{ transform: `scale(${scale})`, transformOrigin: 'center center' }}>
        <div
          style={{
            width: contentWidth + 24,
            height: contentHeight + 72,
            background: '#1a1a1a',
            borderRadius: 52,
            border: '2px solid #333',
            boxShadow: '0 0 0 1px #111, 0 40px 80px rgba(0,0,0,0.8)',
            position: 'relative',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* Dynamic Island */}
          <div
            style={{
              height: 36,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <div
              style={{
                width: 120,
                height: 34,
                background: '#000',
                borderRadius: 20,
              }}
            />
          </div>
          {/* Screen */}
          <div style={{ flex: 1, overflow: 'hidden', borderRadius: '0 0 50px 50px' }}>
            {children}
          </div>
        </div>
      </div>
    );
  }

  if (deviceFrame === 'browser') {
    return (
      <div style={{ transform: `scale(${scale})`, transformOrigin: 'center center' }}>
        <div
          style={{
            width: contentWidth,
            background: '#1e1e1e',
            borderRadius: 8,
            border: '1px solid #333',
            boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
            overflow: 'hidden',
          }}
        >
          {/* Browser chrome */}
          <div
            style={{
              height: 36,
              background: '#2a2a2a',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              paddingLeft: 12,
              paddingRight: 12,
              borderBottom: '1px solid #333',
            }}
          >
            {/* Traffic lights */}
            {['#ff5f57', '#febc2e', '#28c840'].map((color, i) => (
              <div
                key={i}
                style={{ width: 12, height: 12, borderRadius: '50%', background: color }}
              />
            ))}
            {/* URL bar */}
            <div
              style={{
                flex: 1,
                marginLeft: 8,
                height: 20,
                background: '#1a1a1a',
                borderRadius: 4,
                border: '1px solid #333',
                display: 'flex',
                alignItems: 'center',
                paddingLeft: 8,
              }}
            >
              <span style={{ fontSize: 10, color: '#666' }}>localhost:3010/preview</span>
            </div>
          </div>
          {/* Page content */}
          <div style={{ height: contentHeight, overflow: 'hidden' }}>{children}</div>
        </div>
      </div>
    );
  }

  // no frame
  return (
    <div
      style={{
        width: contentWidth,
        height: contentHeight,
        overflow: 'hidden',
        borderRadius: 4,
        border: '1px solid #1a1a1a',
      }}
    >
      {children}
    </div>
  );
};

const DeviceIcon: React.FC<{ device: string }> = ({ device }) => {
  if (device === 'iphone_15') return <Smartphone className="w-3 h-3 text-gray-400" />;
  if (device === 'browser') return <Monitor className="w-3 h-3 text-gray-400" />;
  return <Square className="w-3 h-3 text-gray-400" />;
};

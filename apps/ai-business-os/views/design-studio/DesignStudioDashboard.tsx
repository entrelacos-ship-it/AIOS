import React, { useState, useEffect } from 'react';
import {
  Smartphone,
  Monitor,
  Square,
  BarChart3,
  Presentation,
  Radar,
  Wand2,
  ChevronDown,
  ChevronUp,
  Loader2,
  Play,
  Columns3,
  Compass,
} from 'lucide-react';
import type {
  DesignArtifact,
  DesignBrief,
  DesignDeviceFrame,
  DesignOutputType,
  DesignPhilosophySchool,
  DesignVariationsResult,
  DesignDirection,
} from '../../types';
import {
  generateDesignArtifact,
  generateDesignVariations,
  generateDirectionAdvice,
  PHILOSOPHY_META,
  OUTPUT_TYPE_META,
} from '../../services/designStudioService';

const LOADING_MESSAGES = [
  'Interpretando o brief...',
  'Aplicando grade suíça...',
  'Removendo o supérfluo...',
  'Testando hierarquia visual...',
  'Calibrando espaço negativo...',
  'Revisando contraste WCAG...',
  'Afinando tipografia...',
  'Validando ritmo visual...',
  'Limpando ruído cognitivo...',
  'Finalizando artefato...',
];

const DS_HISTORY_KEY = 'ds:history';
const MAX_HISTORY = 20;

const OUTPUT_ICONS: Record<DesignOutputType, React.ElementType> = {
  html_prototype: Smartphone,
  presentation: Presentation,
  infographic: BarChart3,
  critique: Radar,
  motion_design: Play,
  design_variations: Columns3,
  direction_advisor: Compass,
};

const DEVICE_FRAME_OPTIONS: { id: DesignDeviceFrame; label: string; icon: React.ElementType }[] = [
  { id: 'iphone_15', label: 'iPhone 15 Pro', icon: Smartphone },
  { id: 'browser', label: 'Browser Desktop', icon: Monitor },
  { id: 'none', label: 'Sem frame', icon: Square },
];

interface Props {
  onArtifactGenerated: (artifact: DesignArtifact) => void;
  onVariationsGenerated: (result: DesignVariationsResult) => void;
  onDirectionsGenerated: (directions: DesignDirection[], brief: DesignBrief) => void;
}

export const DesignStudioDashboard: React.FC<Props> = ({
  onArtifactGenerated,
  onVariationsGenerated,
  onDirectionsGenerated,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [outputType, setOutputType] = useState<DesignOutputType>('html_prototype');
  const [philosophySchool, setPhilosophySchool] = useState<DesignPhilosophySchool>('kenya_hara');
  const [deviceFrame, setDeviceFrame] = useState<DesignDeviceFrame>('iphone_15');
  const [colorHints, setColorHints] = useState('');
  const [contentNotes, setContentNotes] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);

  const [isGenerating, setIsGenerating] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState(LOADING_MESSAGES[0]);
  const [error, setError] = useState<string | null>(null);

  const [hoveredSchool, setHoveredSchool] = useState<DesignPhilosophySchool | null>(null);
  const previewSchool = hoveredSchool ?? philosophySchool;
  const previewMeta = PHILOSOPHY_META[previewSchool];

  // Auto-adjust deviceFrame when outputType changes
  useEffect(() => {
    if (outputType === 'presentation' || outputType === 'infographic' || outputType === 'motion_design') {
      setDeviceFrame('none');
    } else if (outputType === 'html_prototype') {
      setDeviceFrame('iphone_15');
    } else {
      setDeviceFrame('browser');
    }
  }, [outputType]);

  // Cycle loading messages
  useEffect(() => {
    if (!isGenerating) return;
    let idx = 0;
    const interval = setInterval(() => {
      idx = (idx + 1) % LOADING_MESSAGES.length;
      setLoadingMsg(LOADING_MESSAGES[idx]);
    }, 1800);
    return () => clearInterval(interval);
  }, [isGenerating]);

  const persistToHistory = (artifact: DesignArtifact) => {
    try {
      const raw = localStorage.getItem(DS_HISTORY_KEY);
      const history: DesignArtifact[] = raw ? JSON.parse(raw) : [];
      const updated = [artifact, ...history].slice(0, MAX_HISTORY);
      localStorage.setItem(DS_HISTORY_KEY, JSON.stringify(updated));
    } catch {
      // localStorage may be unavailable — silently skip
    }
  };

  const handleGenerate = async () => {
    if (!title.trim() || !description.trim()) {
      setError('Preencha título e descrição antes de gerar.');
      return;
    }
    setError(null);
    setIsGenerating(true);
    setLoadingMsg(LOADING_MESSAGES[0]);

    const brief: DesignBrief = {
      title: title.trim(),
      description: description.trim(),
      outputType,
      philosophySchool,
      deviceFrame,
      colorHints: colorHints.trim() || undefined,
      contentNotes: contentNotes.trim() || undefined,
    };

    try {
      if (outputType === 'design_variations') {
        const result = await generateDesignVariations(brief);
        onVariationsGenerated(result);
      } else if (outputType === 'direction_advisor') {
        const directions = await generateDirectionAdvice(brief);
        onDirectionsGenerated(directions, brief);
      } else {
        const htmlContent = await generateDesignArtifact(brief);
        const artifact: DesignArtifact = {
          id: `ds-${Date.now()}`,
          brief,
          htmlContent,
          createdAt: new Date().toISOString(),
        };
        persistToHistory(artifact);
        onArtifactGenerated(artifact);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido ao gerar artefato.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen text-[#EDEDED]">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-8 h-8 rounded-lg bg-violet-500/20 flex items-center justify-center">
            <Wand2 className="w-4 h-4 text-violet-400" />
          </div>
          <h1 className="text-2xl font-semibold text-white">Design Studio</h1>
        </div>
        <p className="text-gray-500 text-sm">
          Gera artefatos de design completos via IA com filosofias de escola curadas.
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_380px] gap-8">
        {/* Left — Form */}
        <div className="space-y-6">
          {/* Title + Description */}
          <div className="bg-[#111] border border-[#222] rounded-xl p-6 space-y-4">
            <h2 className="text-sm font-medium text-gray-400 uppercase tracking-wider">
              Brief
            </h2>
            <div>
              <label className="block text-sm text-gray-400 mb-1.5">Título do projeto</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="App de meditação — 4 telas, iOS"
                className="w-full bg-[#0A0A0A] border border-[#333] rounded-lg px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-violet-500 transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1.5">Descrição detalhada</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Descreva o propósito, o público-alvo, as funcionalidades principais, o tom desejado e qualquer restrição de conteúdo..."
                rows={5}
                className="w-full bg-[#0A0A0A] border border-[#333] rounded-lg px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-violet-500 transition-colors resize-none"
              />
            </div>
          </div>

          {/* Output Type */}
          <div className="bg-[#111] border border-[#222] rounded-xl p-6">
            <h2 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-4">
              Tipo de artefato
            </h2>
            <div className="grid grid-cols-2 gap-3">
              {(Object.keys(OUTPUT_TYPE_META) as DesignOutputType[]).map((type) => {
                const meta = OUTPUT_TYPE_META[type];
                const Icon = OUTPUT_ICONS[type];
                const isSelected = outputType === type;
                return (
                  <button
                    key={type}
                    onClick={() => setOutputType(type)}
                    className={`flex items-start gap-3 p-4 rounded-lg border text-left transition-all ${
                      isSelected
                        ? 'border-violet-500 bg-violet-500/10'
                        : 'border-[#333] hover:border-[#555] bg-[#0A0A0A]'
                    }`}
                  >
                    <Icon
                      className={`w-5 h-5 mt-0.5 flex-shrink-0 ${isSelected ? 'text-violet-400' : 'text-gray-500'}`}
                    />
                    <div>
                      <div className={`text-sm font-medium ${isSelected ? 'text-white' : 'text-gray-300'}`}>
                        {meta.label}
                      </div>
                      <div className="text-xs text-gray-500 mt-0.5 leading-relaxed">
                        {meta.description}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Philosophy School */}
          <div className="bg-[#111] border border-[#222] rounded-xl p-6">
            <h2 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-4">
              Escola de design
            </h2>
            <div className="space-y-2">
              {(Object.keys(PHILOSOPHY_META) as DesignPhilosophySchool[]).map((school) => {
                const meta = PHILOSOPHY_META[school];
                const isSelected = philosophySchool === school;
                return (
                  <button
                    key={school}
                    onClick={() => setPhilosophySchool(school)}
                    onMouseEnter={() => setHoveredSchool(school)}
                    onMouseLeave={() => setHoveredSchool(null)}
                    className={`w-full flex items-start gap-4 p-4 rounded-lg border text-left transition-all ${
                      isSelected
                        ? 'border-violet-500 bg-violet-500/10'
                        : 'border-[#333] hover:border-[#444] bg-[#0A0A0A]'
                    }`}
                  >
                    {/* Color dot */}
                    <div
                      className="w-4 h-4 rounded-full flex-shrink-0 mt-0.5 border border-white/10"
                      style={{ backgroundColor: meta.accent }}
                    />
                    <div className="flex-1 min-w-0">
                      <div
                        className={`text-sm font-medium ${isSelected ? 'text-white' : 'text-gray-300'}`}
                        style={{ fontFamily: meta.fontFamily }}
                      >
                        {meta.label}
                      </div>
                      <div className="text-xs text-gray-500 mt-0.5">{meta.tagline}</div>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {meta.keywords.map((kw) => (
                          <span
                            key={kw}
                            className="text-[10px] px-1.5 py-0.5 bg-white/5 text-gray-500 rounded"
                          >
                            {kw}
                          </span>
                        ))}
                      </div>
                    </div>
                    {isSelected && (
                      <div className="w-1.5 h-1.5 rounded-full bg-violet-400 flex-shrink-0 mt-1.5" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Device Frame — only for html_prototype */}
          {outputType === 'html_prototype' && (
            <div className="bg-[#111] border border-[#222] rounded-xl p-6">
              <h2 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-4">
                Frame de dispositivo
              </h2>
              <div className="grid grid-cols-3 gap-3">
                {DEVICE_FRAME_OPTIONS.map(({ id, label, icon: Icon }) => {
                  const isSelected = deviceFrame === id;
                  return (
                    <button
                      key={id}
                      onClick={() => setDeviceFrame(id)}
                      className={`flex flex-col items-center gap-2 p-4 rounded-lg border transition-all ${
                        isSelected
                          ? 'border-violet-500 bg-violet-500/10'
                          : 'border-[#333] hover:border-[#555] bg-[#0A0A0A]'
                      }`}
                    >
                      <Icon
                        className={`w-6 h-6 ${isSelected ? 'text-violet-400' : 'text-gray-500'}`}
                      />
                      <span
                        className={`text-xs ${isSelected ? 'text-white' : 'text-gray-400'}`}
                      >
                        {label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Advanced Options */}
          <div className="bg-[#111] border border-[#222] rounded-xl overflow-hidden">
            <button
              onClick={() => setShowAdvanced((v) => !v)}
              className="w-full flex items-center justify-between px-6 py-4 text-sm text-gray-400 hover:text-white transition-colors"
            >
              <span>Opções avançadas</span>
              {showAdvanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            {showAdvanced && (
              <div className="px-6 pb-6 space-y-4 border-t border-[#222]">
                <div className="pt-4">
                  <label className="block text-sm text-gray-400 mb-1.5">
                    Direção de cor{' '}
                    <span className="text-gray-600">(opcional — ex: "tons terrosos, sem azul")</span>
                  </label>
                  <input
                    type="text"
                    value={colorHints}
                    onChange={(e) => setColorHints(e.target.value)}
                    placeholder="Tons frios, quase monocromático..."
                    className="w-full bg-[#0A0A0A] border border-[#333] rounded-lg px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-violet-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1.5">
                    Notas de conteúdo{' '}
                    <span className="text-gray-600">(opcional)</span>
                  </label>
                  <textarea
                    value={contentNotes}
                    onChange={(e) => setContentNotes(e.target.value)}
                    placeholder="Dados específicos a incluir, restrições de conteúdo, referências..."
                    rows={3}
                    className="w-full bg-[#0A0A0A] border border-[#333] rounded-lg px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-violet-500 transition-colors resize-none"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3 text-sm text-red-400">
              {error}
            </div>
          )}

          {/* Generate Button */}
          <button
            onClick={handleGenerate}
            disabled={isGenerating || !title.trim() || !description.trim()}
            className="w-full flex items-center justify-center gap-3 py-4 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:bg-[#222] disabled:text-gray-600 text-white font-medium transition-all text-sm"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>{loadingMsg}</span>
              </>
            ) : (
              <>
                <Wand2 className="w-4 h-4" />
                <span>
                  {outputType === 'design_variations'
                    ? 'Gerar 3 variações'
                    : outputType === 'direction_advisor'
                      ? 'Consultar direções'
                      : 'Gerar artefato'}
                </span>
              </>
            )}
          </button>
        </div>

        {/* Right — Philosophy Preview */}
        <div className="xl:sticky xl:top-24 xl:self-start space-y-4">
          <div className="bg-[#111] border border-[#222] rounded-xl p-6">
            <h2 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-4">
              Prévia da filosofia
            </h2>

            {/* Philosophy visual mockup */}
            <PhilosophyPreview school={previewSchool} />

            <div className="mt-4 pt-4 border-t border-[#222]">
              <div className="text-xs font-medium text-gray-300 mb-1">{previewMeta.label}</div>
              <div className="text-xs text-gray-500 leading-relaxed">{previewMeta.tagline}</div>
            </div>
          </div>

          {/* Output format summary */}
          <div className="bg-[#111] border border-[#222] rounded-xl p-4 space-y-3">
            <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider">Resumo</h3>
            <div className="space-y-2">
              <SummaryRow label="Artefato" value={OUTPUT_TYPE_META[outputType].label} />
              <SummaryRow label="Escola" value={PHILOSOPHY_META[philosophySchool].label} />
              {outputType === 'html_prototype' && (
                <SummaryRow
                  label="Frame"
                  value={DEVICE_FRAME_OPTIONS.find((d) => d.id === deviceFrame)?.label ?? deviceFrame}
                />
              )}
              {colorHints && <SummaryRow label="Cor" value={colorHints} />}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Philosophy Preview Card ──────────────────────────────────────────────────

const PhilosophyPreview: React.FC<{ school: DesignPhilosophySchool }> = ({ school }) => {
  const meta = PHILOSOPHY_META[school];

  const previews: Record<DesignPhilosophySchool, React.ReactNode> = {
    pentagram: (
      <div
        className="h-48 bg-black flex flex-col justify-between p-5 overflow-hidden"
        style={{ fontFamily: 'Helvetica Neue, Helvetica, system-ui, sans-serif' }}
      >
        <div className="text-white text-4xl font-black leading-none tracking-tighter">
          WORK.
        </div>
        <div className="space-y-1">
          <div className="h-px bg-white" />
          <div className="h-px bg-white/30" />
        </div>
        <div className="flex justify-between items-end">
          <div className="text-white/60 text-[10px] uppercase tracking-[0.2em]">
            Pentagram
          </div>
          <div
            className="w-6 h-6 rounded-full"
            style={{ backgroundColor: meta.accent === '#000000' ? '#ff3300' : meta.accent }}
          />
        </div>
      </div>
    ),

    ia_typography: (
      <div
        className="h-48 bg-[#fafafa] flex flex-col justify-center px-6 py-5 overflow-hidden"
        style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}
      >
        <div className="text-[#111] text-xs font-normal leading-relaxed max-w-[40ch]">
          Content is the interface. The design dissolves when it works correctly.
        </div>
        <div className="mt-4 h-px bg-[#e0e0e0]" />
        <div className="mt-3 text-[#999] text-[9px] tracking-wide">
          iA — Information Architects
        </div>
      </div>
    ),

    kenya_hara: (
      <div
        className="h-48 bg-[#faf9f7] flex items-center justify-center overflow-hidden"
        style={{ fontFamily: 'Georgia, serif' }}
      >
        <div className="text-center px-8">
          <div className="text-[#1a1a18] text-2xl font-light tracking-widest mb-4">
            間
          </div>
          <div className="text-[#888] text-[9px] tracking-[0.4em] uppercase">
            negative space
          </div>
        </div>
      </div>
    ),

    field_generative: (
      <div
        className="h-48 bg-[#050505] relative overflow-hidden"
        style={{ fontFamily: '"JetBrains Mono", "Courier New", monospace' }}
      >
        {/* Generative grid mockup */}
        <svg viewBox="0 0 200 120" className="absolute inset-0 w-full h-full opacity-60">
          {Array.from({ length: 8 }).map((_, i) =>
            Array.from({ length: 5 }).map((_, j) => (
              <circle
                key={`${i}-${j}`}
                cx={i * 28 + 10}
                cy={j * 24 + 10}
                r={Math.abs(Math.sin(i * 0.8 + j * 1.2)) * 8 + 1}
                fill="none"
                stroke={`oklch(${55 + i * 5}% 0.3 ${160 + j * 20})`}
                strokeWidth="0.5"
              />
            )),
          )}
        </svg>
        <div className="absolute bottom-4 left-4 text-[#00ff88] text-[9px] tracking-wider">
          FIELD.IO_GENERATIVE
        </div>
      </div>
    ),

    stamen: (
      <div
        className="h-48 bg-[#f4ede0] relative overflow-hidden"
        style={{ fontFamily: 'Georgia, serif' }}
      >
        {/* Cartographic lines mockup */}
        <svg viewBox="0 0 200 120" className="absolute inset-0 w-full h-full">
          {[20, 40, 60, 80, 95].map((y, i) => (
            <path
              key={y}
              d={`M0,${y} Q50,${y - 10 + i * 3} 100,${y + 5} T200,${y - 3}`}
              fill="none"
              stroke="#8b6f47"
              strokeWidth="0.8"
              opacity={0.3 + i * 0.1}
            />
          ))}
        </svg>
        <div className="absolute bottom-4 left-4">
          <div className="text-[#5c3d11] text-[9px] uppercase tracking-[0.3em]">
            Stamen — Data Cartography
          </div>
        </div>
      </div>
    ),
  };

  return (
    <div className="rounded-lg overflow-hidden border border-[#333] transition-all duration-300">
      {previews[school]}
    </div>
  );
};

const SummaryRow: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="flex items-center justify-between gap-2">
    <span className="text-xs text-gray-600">{label}</span>
    <span className="text-xs text-gray-300 text-right truncate max-w-[60%]">{value}</span>
  </div>
);

import React, { useState, useEffect, useRef } from 'react';
import {
  Presentation,
  FileText,
  Mic,
  AlignLeft,
  Lightbulb,
  Download,
  RefreshCw,
  ChevronRight,
  ChevronLeft,
  Monitor,
  FileDown,
  ExternalLink,
} from 'lucide-react';
import { Card } from '../components/ui/Card';
import { View } from '../types';
import { SlidesDashboard } from './slides-studio/SlidesDashboard';
import { SlidesViewer } from './slides-studio/SlidesViewer';

interface Props {
  view: string;
  onViewChange: (v: View) => void;
}

type Format = 'videoaula' | 'palestra' | 'webinar' | 'masterclass' | 'micro-aula' | 'corporativo';
type InputMode = 'A' | 'B' | 'C' | 'D';
type OutputType = 'html' | 'pptx' | 'html+pptx' | 'canva';
type Step = 'format' | 'input-mode' | 'output-type' | 'design' | 'content' | 'generating' | 'preview';

interface DsBrand {
  id: string;
  name: string;
  type: string;
  palette?: string[];
  description?: string;
}

interface GenerateParams {
  format: Format;
  inputMode: InputMode;
  outputType: OutputType;
  topic: string;
  topics: string;
  copy: string;
  transcript: string;
  slideCount?: number;
  dsBrand: string;
}

const FORMAT_LABELS: Record<Format, string> = {
  videoaula: 'Videoaula',
  palestra: 'Palestra',
  webinar: 'Webinar',
  masterclass: 'Masterclass',
  'micro-aula': 'Micro-aula',
  corporativo: 'Corporativo',
};

const FORMAT_DESCRIPTIONS: Record<Format, string> = {
  videoaula: '15–30 slides · aula gravada para curso ou academia',
  palestra: '20–35 slides · evento ao vivo, manifesto, TED-style',
  webinar: '30–50 slides · transmissão com pitch de oferta',
  masterclass: '25–35 slides · conteúdo profundo + aplicação',
  'micro-aula': '7–10 slides · conceito único, comunidade',
  corporativo: '22–40 slides · NR-1, ELOS, apresentação B2B',
};

const FORMAT_ICONS: Record<Format, React.ReactNode> = {
  videoaula: <Monitor size={20} />,
  palestra: <Presentation size={20} />,
  webinar: <ExternalLink size={20} />,
  masterclass: <Lightbulb size={20} />,
  'micro-aula': <Mic size={20} />,
  corporativo: <FileText size={20} />,
};

export function SlidesStudio({ view, onViewChange }: Props) {
  const [selectedSlideId, setSelectedSlideId] = useState<string | null>(null);

  // Route: Dashboard (library)
  if (view === View.SLIDES_STUDIO_DASHBOARD || view === View.SLIDES_STUDIO) {
    if (selectedSlideId) {
      return (
        <SlidesViewer
          slideId={selectedSlideId}
          onBack={() => setSelectedSlideId(null)}
        />
      );
    }
    return (
      <SlidesDashboard
        onViewChange={onViewChange}
        onSelectSlide={(id) => setSelectedSlideId(id)}
        onNewSlide={() => onViewChange(View.SLIDES_STUDIO_NEW)}
      />
    );
  }

  // Route: Viewer (specific slide)
  if (view === View.SLIDES_STUDIO_VIEWER && selectedSlideId) {
    return (
      <SlidesViewer
        slideId={selectedSlideId}
        onBack={() => onViewChange(View.SLIDES_STUDIO_DASHBOARD)}
      />
    );
  }

  // Route: New / Creator (fall through to existing step-based UI)
  return <SlidesCreator onDone={(id) => { setSelectedSlideId(id); onViewChange(View.SLIDES_STUDIO_DASHBOARD); }} />;
}

function SlidesCreator({ onDone }: { onDone: (id: string | null) => void }) {
  const [step, setStep] = useState<Step>('format');
  const [format, setFormat] = useState<Format>('videoaula');
  const [inputMode, setInputMode] = useState<InputMode>('A');
  const [outputType, setOutputType] = useState<OutputType>('html');
  const [dsBrand, setDsBrand] = useState('entrelacOS');
  const [brands, setBrands] = useState<DsBrand[]>([]);
  const [topic, setTopic] = useState('');
  const [topics, setTopics] = useState('');
  const [copy, setCopy] = useState('');
  const [transcript, setTranscript] = useState('');
  const [statusMsg, setStatusMsg] = useState('');
  const [previewHtml, setPreviewHtml] = useState('');
  const [pptxUrl, setPptxUrl] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [slideCount, setSlideCount] = useState<number | undefined>(undefined);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    return () => abortRef.current?.abort();
  }, []);

  useEffect(() => {
    if (step === 'design' && brands.length === 0) {
      fetch('/api/slides/ds-brands')
        .then(r => r.json())
        .then(d => setBrands(d.brands ?? []))
        .catch(() => {});
    }
  }, [step, brands.length]);

  async function generate() {
    setError('');
    setStatusMsg('Iniciando geração...');
    setStep('generating');

    abortRef.current = new AbortController();

    const params: GenerateParams = {
      format, inputMode, outputType, topic, topics, copy, transcript, slideCount, dsBrand,
    };

    try {
      const res = await fetch('/api/slides/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
        signal: abortRef.current.signal,
      });

      if (!res.body) throw new Error('Sem resposta do servidor');

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split('\n\n');
        buffer = parts.pop() ?? '';

        for (const part of parts) {
          const lines = part.split('\n');
          let event = '';
          let data = '';
          for (const line of lines) {
            if (line.startsWith('event: ')) event = line.slice(7).trim();
            if (line.startsWith('data: ')) data = line.slice(6).trim();
          }
          if (!event || !data) continue;
          try {
            const payload = JSON.parse(data);
            if (event === 'status') setStatusMsg(payload.message ?? '');
            if (event === 'done') {
              if (payload.html) setPreviewHtml(payload.html);
              if (payload.pptxUrl) setPptxUrl(payload.pptxUrl);
              setStep('preview');
              if (payload.savedId) onDone(payload.savedId);
            }
            if (event === 'error') {
              setError(payload.message ?? 'Erro desconhecido');
              setStep('content');
            }
          } catch {
            // malformed SSE chunk — skip
          }
        }
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.name !== 'AbortError') {
        setError(err.message);
        setStep('content');
      }
    }
  }

  function downloadHtml() {
    if (!previewHtml) return;
    const blob = new Blob([previewHtml], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `slides-${topic || format}-${Date.now()}.html`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function restart() {
    setStep('format');
    setPreviewHtml('');
    setPptxUrl(null);
    setError('');
    setStatusMsg('');
  }

  // ── Step: Format ─────────────────────────────────────────────────────────────
  if (step === 'format') return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-white">Slides Studio</h1>
        <p className="text-gray-500 mt-1">Qual é o formato da apresentação?</p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {(Object.keys(FORMAT_LABELS) as Format[]).map(f => (
          <button
            key={f}
            onClick={() => setFormat(f)}
            className={`text-left p-4 rounded-xl border transition-all ${
              format === f
                ? 'border-violet-500 bg-violet-500/10 text-violet-300'
                : 'border-[#222] bg-[#111] text-gray-400 hover:border-[#333] hover:text-gray-200'
            }`}
          >
            <div className="flex items-center gap-3 mb-2">
              <span className={format === f ? 'text-violet-400' : 'text-gray-600'}>
                {FORMAT_ICONS[f]}
              </span>
              <span className="font-medium text-sm">{FORMAT_LABELS[f]}</span>
            </div>
            <p className="text-xs text-gray-600">{FORMAT_DESCRIPTIONS[f]}</p>
          </button>
        ))}
      </div>
      <div className="flex justify-end">
        <button
          onClick={() => setStep('input-mode')}
          className="flex items-center gap-2 px-5 py-2.5 bg-violet-600 hover:bg-violet-500 text-white rounded-lg text-sm font-medium transition-colors"
        >
          Continuar <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );

  // ── Step: Input Mode ──────────────────────────────────────────────────────────
  if (step === 'input-mode') {
    const modes: { id: InputMode; icon: React.ReactNode; label: string; desc: string }[] = [
      { id: 'A', icon: <Lightbulb size={18} />, label: 'Tema', desc: 'Você informa o tema e a IA cria do zero' },
      { id: 'B', icon: <AlignLeft size={18} />, label: 'Tópicos', desc: 'Tema + lista de tópicos principais' },
      { id: 'C', icon: <FileText size={18} />, label: 'Copy pronto', desc: 'Cole um roteiro ou copy já escrito' },
      { id: 'D', icon: <Mic size={18} />, label: 'Transcrição', desc: 'Transcrição de aula gravada ou rascunho falado' },
    ];
    return (
      <div className="max-w-2xl mx-auto space-y-8">
        <div>
          <button onClick={() => setStep('format')} className="flex items-center gap-1 text-xs text-gray-600 hover:text-gray-400 mb-4">
            <ChevronLeft size={14} /> Voltar
          </button>
          <h1 className="text-2xl font-semibold text-white">Como você vai fornecer o conteúdo?</h1>
        </div>
        <div className="space-y-2">
          {modes.map(m => (
            <button
              key={m.id}
              onClick={() => setInputMode(m.id)}
              className={`w-full text-left p-4 rounded-xl border transition-all flex items-start gap-3 ${
                inputMode === m.id
                  ? 'border-violet-500 bg-violet-500/10 text-violet-300'
                  : 'border-[#222] bg-[#111] text-gray-400 hover:border-[#333] hover:text-gray-200'
              }`}
            >
              <span className={`mt-0.5 ${inputMode === m.id ? 'text-violet-400' : 'text-gray-600'}`}>{m.icon}</span>
              <div>
                <p className="font-medium text-sm">{m.label}</p>
                <p className="text-xs text-gray-600 mt-0.5">{m.desc}</p>
              </div>
            </button>
          ))}
        </div>
        <div className="flex justify-end">
          <button
            onClick={() => setStep('output-type')}
            className="flex items-center gap-2 px-5 py-2.5 bg-violet-600 hover:bg-violet-500 text-white rounded-lg text-sm font-medium transition-colors"
          >
            Continuar <ChevronRight size={16} />
          </button>
        </div>
      </div>
    );
  }

  // ── Step: Output Type ─────────────────────────────────────────────────────────
  if (step === 'output-type') {

    const outputs: { id: OutputType; icon: React.ReactNode; label: string; desc: string }[] = [
      { id: 'html', icon: <Monitor size={18} />, label: 'HTML editorial', desc: 'Apresentação interativa premium, exporta como PDF pelo browser' },
      { id: 'pptx', icon: <FileDown size={18} />, label: 'PowerPoint (PPTX)', desc: 'Arquivo .pptx editável, importável no Google Slides' },
      { id: 'html+pptx', icon: <Download size={18} />, label: 'HTML + PPTX', desc: 'Ambos os formatos gerados simultaneamente' },
      { id: 'canva', icon: <ExternalLink size={18} />, label: 'Canva (manual)', desc: 'Gera estrutura + instruções para importar no Canva via MCP' },
    ];
    return (
      <div className="max-w-2xl mx-auto space-y-8">
        <div>
          <button onClick={() => setStep('input-mode')} className="flex items-center gap-1 text-xs text-gray-600 hover:text-gray-400 mb-4">
            <ChevronLeft size={14} /> Voltar
          </button>
          <h1 className="text-2xl font-semibold text-white">Qual formato de saída?</h1>
        </div>
        <div className="space-y-2">
          {outputs.map(o => (
            <button
              key={o.id}
              onClick={() => setOutputType(o.id)}
              className={`w-full text-left p-4 rounded-xl border transition-all flex items-start gap-3 ${
                outputType === o.id
                  ? 'border-violet-500 bg-violet-500/10 text-violet-300'
                  : 'border-[#222] bg-[#111] text-gray-400 hover:border-[#333] hover:text-gray-200'
              }`}
            >
              <span className={`mt-0.5 ${outputType === o.id ? 'text-violet-400' : 'text-gray-600'}`}>{o.icon}</span>
              <div>
                <p className="font-medium text-sm">{o.label}</p>
                <p className="text-xs text-gray-600 mt-0.5">{o.desc}</p>
              </div>
            </button>
          ))}
        </div>
        <div className="flex justify-end">
          <button
            onClick={() => setStep('design')}
            className="flex items-center gap-2 px-5 py-2.5 bg-violet-600 hover:bg-violet-500 text-white rounded-lg text-sm font-medium transition-colors"
          >
            Continuar <ChevronRight size={16} />
          </button>
        </div>
      </div>
    );
  }

  // ── Step: Design ──────────────────────────────────────────────────────────────
  if (step === 'design') {
    const ownBrands = brands.filter(b => b.type === 'own');
    const displayBrands = ownBrands.length > 0 ? ownBrands : [
      { id: 'entrelacOS', name: 'Entrelaços DS', palette: ['#7C3AED', '#FF7A1A', '#2DD4BF'], description: 'DS oficial — roxo/laranja/turquesa' },
      { id: 'tatiRibeiro', name: 'Tati Ribeiro DS', palette: ['#EC4899', '#C8963C', '#5EEAD4'], description: 'DS pessoal — rosa/dourado/sage' },
    ];
    return (
      <div className="max-w-2xl mx-auto space-y-8">
        <div>
          <button onClick={() => setStep('output-type')} className="flex items-center gap-1 text-xs text-gray-600 hover:text-gray-400 mb-4">
            <ChevronLeft size={14} /> Voltar
          </button>
          <h1 className="text-2xl font-semibold text-white">Design System</h1>
          <p className="text-gray-500 text-sm mt-1">Qual identidade visual aplicar nos slides?</p>
        </div>
        <div className="space-y-2">
          {displayBrands.map(b => (
            <button
              key={b.id}
              onClick={() => setDsBrand(b.id)}
              className={`w-full text-left p-4 rounded-xl border transition-all flex items-center gap-4 ${
                dsBrand === b.id
                  ? 'border-violet-500 bg-violet-500/10 text-violet-300'
                  : 'border-[#222] bg-[#111] text-gray-400 hover:border-[#333] hover:text-gray-200'
              }`}
            >
              <div className="flex gap-1.5 shrink-0">
                {(b.palette ?? []).slice(0, 3).map((color, i) => (
                  <span key={i} className="w-5 h-5 rounded-full border border-white/10" style={{ background: color }} />
                ))}
              </div>
              <div>
                <p className="font-medium text-sm">{b.name}</p>
                {b.description && <p className="text-xs text-gray-600 mt-0.5">{b.description}</p>}
              </div>
            </button>
          ))}
        </div>
        <div className="flex justify-end">
          <button
            onClick={() => setStep('content')}
            className="flex items-center gap-2 px-5 py-2.5 bg-violet-600 hover:bg-violet-500 text-white rounded-lg text-sm font-medium transition-colors"
          >
            Continuar <ChevronRight size={16} />
          </button>
        </div>
      </div>
    );
  }

  // ── Step: Content Input ────────────────────────────────────────────────────────
  if (step === 'content') {
    const canSubmit = inputMode === 'A' ? topic.trim().length > 3
      : inputMode === 'B' ? topic.trim().length > 3 && topics.trim().length > 3
      : inputMode === 'C' ? copy.trim().length > 20
      : transcript.trim().length > 20;

    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <button onClick={() => setStep('design')} className="flex items-center gap-1 text-xs text-gray-600 hover:text-gray-400 mb-4">
            <ChevronLeft size={14} /> Voltar
          </button>
          <h1 className="text-2xl font-semibold text-white">Conteúdo</h1>
          <p className="text-gray-500 text-sm mt-1">
            {FORMAT_LABELS[format]} · {inputMode === 'A' ? 'Tema' : inputMode === 'B' ? 'Tópicos' : inputMode === 'C' ? 'Copy' : 'Transcrição'} · {outputType.toUpperCase()} · {dsBrand}
          </p>
        </div>

        {(inputMode === 'A' || inputMode === 'B') && (
          <div>
            <label className="block text-xs text-gray-500 mb-1.5">Tema da aula</label>
            <input
              value={topic}
              onChange={e => setTopic(e.target.value)}
              placeholder="Ex: Apego ansioso em adultos — causas e intervenções clínicas"
              className="w-full bg-[#111] border border-[#222] rounded-lg px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-violet-500 transition-colors"
            />
          </div>
        )}

        {inputMode === 'B' && (
          <div>
            <label className="block text-xs text-gray-500 mb-1.5">Tópicos principais (1 por linha)</label>
            <textarea
              value={topics}
              onChange={e => setTopics(e.target.value)}
              rows={6}
              placeholder={"O que é apego ansioso\nSinais no consultório\nDiferença de apego evitativo\nProtocolo de intervenção\nAutoconhecimento como ferramenta"}
              className="w-full bg-[#111] border border-[#222] rounded-lg px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-violet-500 transition-colors resize-none"
            />
          </div>
        )}

        {inputMode === 'C' && (
          <div>
            <label className="block text-xs text-gray-500 mb-1.5">Copy / roteiro pronto</label>
            <textarea
              value={copy}
              onChange={e => setCopy(e.target.value)}
              rows={10}
              placeholder="Cole o roteiro, copy ou texto completo da aula..."
              className="w-full bg-[#111] border border-[#222] rounded-lg px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-violet-500 transition-colors resize-none"
            />
          </div>
        )}

        {inputMode === 'D' && (
          <div>
            <label className="block text-xs text-gray-500 mb-1.5">Transcrição da aula</label>
            <textarea
              value={transcript}
              onChange={e => setTranscript(e.target.value)}
              rows={10}
              placeholder="Cole a transcrição completa..."
              className="w-full bg-[#111] border border-[#222] rounded-lg px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-violet-500 transition-colors resize-none"
            />
          </div>
        )}

        <div>
          <label className="block text-xs text-gray-500 mb-1.5">
            Número de slides <span className="text-gray-700">(opcional — usa padrão do formato se vazio)</span>
          </label>
          <input
            type="number"
            value={slideCount ?? ''}
            onChange={e => setSlideCount(e.target.value ? parseInt(e.target.value) : undefined)}
            min={5}
            max={60}
            placeholder="Automático"
            className="w-32 bg-[#111] border border-[#222] rounded-lg px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-violet-500 transition-colors"
          />
        </div>

        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
            {error}
          </div>
        )}

        <div className="flex justify-end">
          <button
            onClick={generate}
            disabled={!canSubmit}
            className="flex items-center gap-2 px-6 py-2.5 bg-violet-600 hover:bg-violet-500 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium transition-colors"
          >
            <Presentation size={16} /> Gerar Slides
          </button>
        </div>
      </div>
    );
  }

  // ── Step: Generating ──────────────────────────────────────────────────────────
  if (step === 'generating') return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Card className="p-10 text-center max-w-sm w-full">
        <div className="mx-auto mb-5 h-12 w-12 rounded-full border-2 border-violet-500/30 border-t-violet-500 animate-spin" />
        <p className="text-white font-medium mb-1">Gerando slides</p>
        <p className="text-gray-500 text-sm">{statusMsg || 'Aguarde...'}</p>
      </Card>
    </div>
  );

  // ── Step: Preview ─────────────────────────────────────────────────────────────
  if (step === 'preview') {
    const isCanvaMode = outputType === 'canva';
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-400 font-medium">
            {FORMAT_LABELS[format]} · {outputType.toUpperCase()}
          </span>
          <div className="flex items-center gap-2">
            {previewHtml && (
              <button
                onClick={downloadHtml}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1A1A1A] border border-[#2A2A2A] hover:border-[#3A3A3A] rounded-lg text-xs text-gray-400 hover:text-white transition-colors"
              >
                <Download size={13} /> Baixar HTML
              </button>
            )}
            {pptxUrl && (
              <a
                href={pptxUrl}
                download
                className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1A1A1A] border border-[#2A2A2A] hover:border-violet-500 rounded-lg text-xs text-gray-400 hover:text-violet-400 transition-colors"
              >
                <FileDown size={13} /> Baixar PPTX
              </a>
            )}
            <button
              onClick={restart}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1A1A1A] border border-[#2A2A2A] hover:border-[#3A3A3A] rounded-lg text-xs text-gray-400 hover:text-white transition-colors"
            >
              <RefreshCw size={13} /> Refazer
            </button>
          </div>
        </div>

        {isCanvaMode ? (
          <Card className="p-6 space-y-4">
            <h2 className="text-white font-semibold">Importar no Canva via MCP</h2>
            <p className="text-gray-400 text-sm leading-relaxed">
              O Canva MCP só pode ser acionado pelo Claude Code (terminal), não pelo servidor web. Para usar:
            </p>
            <ol className="text-sm text-gray-400 space-y-2 list-decimal list-inside">
              <li>Baixe o HTML com o JSON incorporado abaixo</li>
              <li>No Claude Code (terminal), peça: <span className="text-violet-400 font-mono text-xs">use the Canva MCP to create a presentation from this JSON</span></li>
              <li>Cole o JSON do arquivo no prompt</li>
            </ol>
            {previewHtml && (
              <button
                onClick={downloadHtml}
                className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-lg text-sm transition-colors"
              >
                <Download size={14} /> Baixar HTML com JSON
              </button>
            )}
          </Card>
        ) : previewHtml ? (
          <div className="rounded-xl overflow-hidden border border-[#1A1A1A]" style={{ height: 'calc(100vh - 180px)' }}>
            <iframe
              srcDoc={previewHtml}
              sandbox="allow-scripts allow-same-origin"
              className="w-full h-full"
              title="Preview dos Slides"
            />
          </div>
        ) : pptxUrl ? (
          <Card className="p-8 text-center space-y-4">
            <FileDown size={40} className="text-violet-400 mx-auto" />
            <p className="text-white font-medium">PPTX gerado com sucesso</p>
            <a
              href={pptxUrl}
              download
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-violet-600 hover:bg-violet-500 text-white rounded-lg text-sm font-medium transition-colors"
            >
              <Download size={16} /> Baixar PowerPoint
            </a>
          </Card>
        ) : null}
      </div>
    );
  }

  return null;
}

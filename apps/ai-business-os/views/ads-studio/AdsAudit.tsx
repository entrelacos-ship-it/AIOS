import React, { useRef, useState } from 'react';
import {
  ArrowLeft, Target, Loader2, AlertCircle, CheckCircle2,
  ChevronRight, TrendingUp, Zap, Clock,
} from 'lucide-react';
import type {
  AdsPlatform, AdsIndustry, AdsCampaignGoal,
  AdsAuditRecord, AdsCategoryScore, AdsQuickWin,
} from '../../types';
import { View } from '../../types';

interface Props {
  onNavigate: (view: View) => void;
}

const PLATFORMS: Array<{ id: AdsPlatform; label: string; emoji: string }> = [
  { id: 'google', label: 'Google Ads', emoji: '🔍' },
  { id: 'meta', label: 'Meta Ads', emoji: '📘' },
  { id: 'youtube', label: 'YouTube', emoji: '▶️' },
  { id: 'linkedin', label: 'LinkedIn', emoji: '💼' },
  { id: 'tiktok', label: 'TikTok', emoji: '🎵' },
  { id: 'microsoft', label: 'Microsoft', emoji: '🪟' },
  { id: 'apple', label: 'Apple Search', emoji: '🍎' },
];

const INDUSTRIES: Array<{ id: AdsIndustry; label: string }> = [
  { id: 'saas', label: 'SaaS / Software' },
  { id: 'ecommerce', label: 'E-commerce' },
  { id: 'b2b', label: 'B2B / Serviços' },
  { id: 'healthcare', label: 'Saúde' },
  { id: 'finance', label: 'Financeiro' },
  { id: 'local_services', label: 'Serviços Locais' },
  { id: 'education', label: 'Educação' },
  { id: 'other', label: 'Outro' },
];

const GOALS: Array<{ id: AdsCampaignGoal; label: string }> = [
  { id: 'sales', label: 'Vendas / Conversões' },
  { id: 'leads', label: 'Geração de Leads' },
  { id: 'installs', label: 'Instalações de App' },
  { id: 'awareness', label: 'Brand Awareness' },
  { id: 'traffic', label: 'Tráfego' },
];

const GRADE_BG: Record<string, string> = {
  A: 'from-emerald-500/20 to-emerald-500/5 border-emerald-500/30',
  B: 'from-teal-500/20 to-teal-500/5 border-teal-500/30',
  C: 'from-yellow-500/20 to-yellow-500/5 border-yellow-500/30',
  D: 'from-orange-500/20 to-orange-500/5 border-orange-500/30',
  F: 'from-red-500/20 to-red-500/5 border-red-500/30',
};

const SEVERITY_COLOR: Record<string, string> = {
  critical: 'bg-red-500/10 text-red-400 border-red-500/20',
  high: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  medium: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
};

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

export const AdsAudit: React.FC<Props> = ({ onNavigate }) => {
  const [step, setStep] = useState<1 | 2>(1);
  const [platform, setPlatform] = useState<AdsPlatform>('google');
  const [industry, setIndustry] = useState<AdsIndustry>('saas');
  const [goal, setGoal] = useState<AdsCampaignGoal>('sales');
  const [monthlySpend, setMonthlySpend] = useState('');
  const [metrics, setMetrics] = useState('');
  const [running, setRunning] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [rawJson, setRawJson] = useState('');
  const [result, setResult] = useState<AdsAuditRecord | null>(null);
  const [error, setError] = useState<string | null>(null);
  const logsRef = useRef<HTMLDivElement>(null);

  const handleRun = async () => {
    if (!metrics.trim()) { setError('Preencha as métricas / dados da conta.'); return; }
    setError(null);
    setRunning(true);
    setLogs([]);
    setRawJson('');
    setResult(null);

    try {
      const res = await fetch('/api/ads/audit/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ platform, industry, monthlySpend: Number(monthlySpend) || 0, goal, metricsRaw: metrics }),
      });

      if (!res.ok || !res.body) {
        const err = await res.json() as { error: string };
        throw new Error(err.error ?? 'Erro na requisição.');
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
          if (event === 'log') setLogs((prev) => [...prev, String(d.text ?? '')]);
          if (event === 'token') setRawJson((prev) => prev + String(d.text ?? ''));
          if (event === 'result') setResult(data as AdsAuditRecord);
          if (event === 'error') { setError(String(d.message ?? 'Erro.')); setRunning(false); }
          if (event === 'done') setRunning(false);
        }
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro.');
    } finally {
      setRunning(false);
    }
  };

  const METRICS_PLACEHOLDER = `Cole aqui as métricas da conta. Exemplos:

CTR médio: 2.3%
CPC médio: R$ 1.80
Taxa de conversão: 3.1%
ROAS: 4.2x
Spend mensal: R$ 12.000
Impressões: 850.000
Cliques: 19.550
Conversões: 606
CPA: R$ 19,80
Quality Score médio: 6.2
Campanhas ativas: 8
Ad Groups: 45
Keywords: 320 (180 ativas, 140 pausadas)
Negative keywords: 45
Extensions: Sitelinks, Callouts, Structured Snippets
Conversion tracking: Google Tag Manager
...`;

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => onNavigate(View.ADS_STUDIO)} className="text-gray-500 hover:text-gray-300 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-white">Auditoria de Ads</h1>
          <p className="text-gray-500 text-sm">250+ verificações com health score A-F</p>
        </div>
      </div>

      {!result ? (
        <>
          {/* Step 1: Context */}
          <div className="bg-[#0d0d0d] border border-[#1a1a1a] rounded-xl p-6 space-y-5">
            <h2 className="text-xs font-bold text-gray-600 uppercase tracking-widest">1. Plataforma & Contexto</h2>

            {/* Platform picker */}
            <div>
              <label className="text-xs font-medium text-gray-400 block mb-2">Plataforma</label>
              <div className="flex flex-wrap gap-2">
                {PLATFORMS.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setPlatform(p.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                      platform === p.id
                        ? 'bg-teal-500/20 text-teal-400 border-teal-500/40'
                        : 'bg-[#111] text-gray-400 border-[#222] hover:border-[#333]'
                    }`}
                  >
                    <span>{p.emoji}</span>
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-medium text-gray-400 block mb-1.5">Indústria</label>
                <select
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value as AdsIndustry)}
                  className="w-full bg-[#111] border border-[#222] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-teal-500/50"
                >
                  {INDUSTRIES.map((i) => <option key={i.id} value={i.id}>{i.label}</option>)}
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-gray-400 block mb-1.5">Objetivo Principal</label>
                <select
                  value={goal}
                  onChange={(e) => setGoal(e.target.value as AdsCampaignGoal)}
                  className="w-full bg-[#111] border border-[#222] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-teal-500/50"
                >
                  {GOALS.map((g) => <option key={g.id} value={g.id}>{g.label}</option>)}
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-gray-400 block mb-1.5">Gasto Mensal (USD)</label>
                <input
                  type="number"
                  value={monthlySpend}
                  onChange={(e) => setMonthlySpend(e.target.value)}
                  placeholder="5000"
                  className="w-full bg-[#111] border border-[#222] rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-teal-500/50"
                />
              </div>
            </div>
          </div>

          {/* Step 2: Metrics */}
          <div className="bg-[#0d0d0d] border border-[#1a1a1a] rounded-xl p-6 space-y-3">
            <h2 className="text-xs font-bold text-gray-600 uppercase tracking-widest">
              2. Dados da Conta / Métricas
            </h2>
            <p className="text-[10px] text-gray-600">
              Cole exports, métricas do dashboard, ou descreva a situação da conta em texto livre. Quanto mais detalhes, mais precisa a auditoria.
            </p>
            <textarea
              value={metrics}
              onChange={(e) => setMetrics(e.target.value)}
              placeholder={METRICS_PLACEHOLDER}
              rows={14}
              className="w-full bg-[#111] border border-[#222] rounded-lg px-4 py-3 text-xs text-white placeholder-gray-700 focus:outline-none focus:border-teal-500/50 resize-none font-mono leading-relaxed"
            />
          </div>

          {/* Running log */}
          {running && (
            <div className="bg-[#080808] border border-[#1a1a1a] rounded-xl p-4">
              <div ref={logsRef} className="space-y-1 max-h-32 overflow-y-auto font-mono text-xs">
                {logs.map((l, i) => (
                  <div key={i} className="text-gray-400">
                    <span className="text-gray-700 mr-2">›</span>{l}
                  </div>
                ))}
              </div>
              {rawJson && (
                <div className="mt-2 text-[10px] text-teal-400/60 font-mono truncate">
                  {rawJson.slice(-120)}
                </div>
              )}
            </div>
          )}

          {error && (
            <div className="text-red-400 text-xs bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3">
              {error}
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={() => onNavigate(View.ADS_STUDIO)}
              className="px-4 py-2.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 text-sm transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleRun}
              disabled={running}
              className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-teal-600 hover:bg-teal-500 disabled:opacity-40 text-white text-sm font-medium transition-colors"
            >
              {running
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Auditando...</>
                : <><Target className="w-4 h-4" /> Executar Auditoria</>
              }
            </button>
          </div>
        </>
      ) : (
        /* Results */
        <div className="space-y-6">
          {/* Health Score header */}
          <div className={`bg-gradient-to-br ${GRADE_BG[result.grade] ?? 'from-gray-500/10 to-gray-500/5 border-gray-500/20'} border rounded-2xl p-6`}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Health Score</p>
                <div className="flex items-end gap-3">
                  <span className="text-6xl font-bold text-white">{result.healthScore}</span>
                  <span className="text-4xl font-bold text-white/40 mb-1">/100</span>
                  <span className={`text-3xl font-bold mb-1 ${
                    result.grade === 'A' ? 'text-emerald-400' :
                    result.grade === 'B' ? 'text-teal-400' :
                    result.grade === 'C' ? 'text-yellow-400' :
                    result.grade === 'D' ? 'text-orange-400' :
                    'text-red-400'
                  }`}>{result.grade}</span>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-white">
                  {PLATFORMS.find(p => p.id === result.platform)?.emoji} {PLATFORMS.find(p => p.id === result.platform)?.label}
                </p>
                <p className="text-xs text-gray-500 mt-0.5 capitalize">{result.industry} · {result.goal}</p>
              </div>
            </div>
            <p className="text-sm text-gray-300 leading-relaxed">{result.summary}</p>
          </div>

          {/* Categories */}
          <div className="bg-[#0d0d0d] border border-[#1a1a1a] rounded-xl p-5 space-y-4">
            <h3 className="text-xs font-bold text-gray-600 uppercase tracking-widest">Categorias</h3>
            <div className="space-y-3">
              {result.categories.map((cat) => (
                <div key={cat.name}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-gray-300">{cat.name}</span>
                      <span className="text-[10px] text-gray-600">{cat.weight}%</span>
                    </div>
                    <div className="flex items-center gap-3 text-[10px]">
                      <span className="text-emerald-400">{cat.passed} ✓</span>
                      {cat.warnings > 0 && <span className="text-yellow-400">{cat.warnings} ⚠</span>}
                      {cat.failures > 0 && <span className="text-red-400">{cat.failures} ✗</span>}
                      <span className="text-white font-semibold w-8 text-right">{cat.score}</span>
                    </div>
                  </div>
                  <div className="h-1.5 bg-[#1a1a1a] rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        cat.score >= 80 ? 'bg-emerald-500' :
                        cat.score >= 60 ? 'bg-teal-500' :
                        cat.score >= 40 ? 'bg-yellow-500' :
                        'bg-red-500'
                      }`}
                      style={{ width: `${cat.score}%` }}
                    />
                  </div>
                  {cat.notes && (
                    <p className="text-[10px] text-gray-600 mt-1">{cat.notes}</p>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Quick Wins */}
          {result.quickWins.length > 0 && (
            <div className="bg-[#0d0d0d] border border-[#1a1a1a] rounded-xl p-5 space-y-3">
              <h3 className="text-xs font-bold text-gray-600 uppercase tracking-widest flex items-center gap-2">
                <Zap className="w-3.5 h-3.5 text-yellow-400" />
                Quick Wins ({result.quickWins.length})
              </h3>
              <div className="space-y-2">
                {result.quickWins.map((win, i) => (
                  <div
                    key={i}
                    className={`border rounded-lg p-3 ${SEVERITY_COLOR[win.severity] ?? ''}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium">{win.issue}</p>
                        <div className="flex items-center gap-1.5 mt-1">
                          <ChevronRight className="w-3 h-3 opacity-60 flex-shrink-0" />
                          <p className="text-[11px] opacity-80">{win.action}</p>
                        </div>
                      </div>
                      <span className="flex items-center gap-1 text-[10px] opacity-70 flex-shrink-0">
                        <Clock className="w-2.5 h-2.5" />
                        {win.estimatedTime}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={() => { setResult(null); setMetrics(''); setLogs([]); setRawJson(''); }}
              className="px-4 py-2.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 text-sm transition-colors"
            >
              Nova Auditoria
            </button>
            <button
              onClick={() => onNavigate(View.ADS_STUDIO)}
              className="px-4 py-2.5 rounded-lg bg-teal-600/20 hover:bg-teal-600/30 text-teal-400 text-sm transition-colors"
            >
              Voltar ao Dashboard
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

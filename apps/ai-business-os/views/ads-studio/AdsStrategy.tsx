import React, { useState } from 'react';
import { ArrowLeft, Lightbulb, Loader2, ChevronRight } from 'lucide-react';
import type { AdsPlatform, AdsCampaignGoal, AdsCampaignConcept, AdsStrategyRecord } from '../../types';
import { View } from '../../types';

interface Props {
  onNavigate: (view: View) => void;
}

const PLATFORMS: Array<{ id: AdsPlatform; label: string; emoji: string }> = [
  { id: 'google', label: 'Google', emoji: '🔍' },
  { id: 'meta', label: 'Meta', emoji: '📘' },
  { id: 'youtube', label: 'YouTube', emoji: '▶️' },
  { id: 'linkedin', label: 'LinkedIn', emoji: '💼' },
  { id: 'tiktok', label: 'TikTok', emoji: '🎵' },
  { id: 'microsoft', label: 'Microsoft', emoji: '🪟' },
  { id: 'apple', label: 'Apple', emoji: '🍎' },
];

const GOALS: Array<{ id: AdsCampaignGoal; label: string }> = [
  { id: 'sales', label: 'Vendas' },
  { id: 'leads', label: 'Leads' },
  { id: 'installs', label: 'Instalações' },
  { id: 'awareness', label: 'Awareness' },
  { id: 'traffic', label: 'Tráfego' },
];

const FRAMEWORK_COLORS: Record<string, string> = {
  AIDA: 'bg-violet-500/10 text-violet-400',
  PAS: 'bg-rose-500/10 text-rose-400',
  BAB: 'bg-amber-500/10 text-amber-400',
  '4P': 'bg-blue-500/10 text-blue-400',
  FAB: 'bg-emerald-500/10 text-emerald-400',
  'Star-Story-Solution': 'bg-orange-500/10 text-orange-400',
};

function ConceptCard({ concept, index }: { concept: AdsCampaignConcept; index: number }) {
  const [expanded, setExpanded] = useState(index === 0);

  return (
    <div className="bg-[#0d0d0d] border border-[#1a1a1a] rounded-xl overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-white/5 transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="text-teal-400 font-bold text-sm w-6">{index + 1}</span>
          <p className="text-white font-semibold text-sm">{concept.title}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${FRAMEWORK_COLORS[concept.copyFramework] ?? 'bg-gray-500/10 text-gray-400'}`}>
            {concept.copyFramework}
          </span>
          {expanded ? <ChevronRight className="w-3.5 h-3.5 text-gray-600 rotate-90" /> : <ChevronRight className="w-3.5 h-3.5 text-gray-600" />}
        </div>
      </button>

      {expanded && (
        <div className="px-5 pb-5 space-y-4 border-t border-[#1a1a1a]">
          <div className="pt-4 grid grid-cols-1 gap-3">
            <div className="bg-[#0a0a0a] border border-[#181818] rounded-lg p-3">
              <p className="text-[10px] text-gray-600 mb-1">Hipótese</p>
              <p className="text-xs text-gray-300 italic leading-relaxed">{concept.hypothesis}</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-[#0a0a0a] border border-[#181818] rounded-lg p-3">
                <p className="text-[10px] text-gray-600 mb-1">Pilar de Mensagem</p>
                <p className="text-xs text-gray-300 leading-relaxed">{concept.messagingPillar}</p>
              </div>
              <div className="bg-[#0a0a0a] border border-[#181818] rounded-lg p-3">
                <p className="text-[10px] text-gray-600 mb-1">Audiência-Alvo</p>
                <p className="text-xs text-gray-300 leading-relaxed">{concept.targetAudience}</p>
              </div>
            </div>

            <div className="bg-[#0a0a0a] border border-[#181818] rounded-lg p-3">
              <p className="text-[10px] text-gray-600 mb-1">Direção Visual</p>
              <p className="text-xs text-gray-300 leading-relaxed">{concept.visualDirection}</p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-[10px] text-gray-600">Plataformas:</p>
              {concept.platforms.map((p) => {
                const pl = PLATFORMS.find(pl => pl.id === p);
                return pl ? (
                  <span key={p} className="text-[10px] text-gray-400 bg-[#141414] border border-[#222] px-2 py-0.5 rounded">
                    {pl.emoji} {pl.label}
                  </span>
                ) : null;
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export const AdsStrategy: React.FC<Props> = ({ onNavigate }) => {
  const [brandDescription, setBrandDescription] = useState('');
  const [goal, setGoal] = useState<AdsCampaignGoal>('leads');
  const [monthlyBudget, setMonthlyBudget] = useState('');
  const [activePlatforms, setActivePlatforms] = useState<AdsPlatform[]>(['google', 'meta']);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AdsStrategyRecord | null>(null);
  const [error, setError] = useState<string | null>(null);

  const togglePlatform = (p: AdsPlatform) => {
    setActivePlatforms((prev) =>
      prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p],
    );
  };

  const handleGenerate = async () => {
    if (!brandDescription.trim()) { setError('Descreva a marca/produto.'); return; }
    if (activePlatforms.length === 0) { setError('Selecione ao menos uma plataforma.'); return; }
    setError(null);
    setLoading(true);
    setResult(null);

    try {
      const res = await fetch('/api/ads/strategy/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brandDescription,
          goal,
          monthlyBudget: Number(monthlyBudget) || 0,
          activePlatforms,
        }),
      });
      if (!res.ok) {
        const d = await res.json() as { error: string };
        throw new Error(d.error ?? 'Erro ao gerar estratégia.');
      }
      const data = await res.json() as { record: AdsStrategyRecord };
      setResult(data.record);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => onNavigate(View.ADS_STUDIO)} className="text-gray-500 hover:text-gray-300 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-white">Estratégia de Campanha</h1>
          <p className="text-gray-500 text-sm">3-5 conceitos com hipóteses + regra 70/20/10 de budget</p>
        </div>
      </div>

      {!result ? (
        <>
          <div className="bg-[#0d0d0d] border border-[#1a1a1a] rounded-xl p-6 space-y-5">
            <h2 className="text-xs font-bold text-gray-600 uppercase tracking-widest">Contexto da Marca</h2>

            <div>
              <label className="text-xs font-medium text-gray-400 block mb-1.5">Marca / Produto / Serviço</label>
              <textarea
                value={brandDescription}
                onChange={(e) => setBrandDescription(e.target.value)}
                placeholder="Ex: Plataforma de cursos online focada em profissionais de saúde que querem se especializar. Ticket médio R$1.200. Principal diferencial: professores são praticantes ativos na área."
                rows={4}
                className="w-full bg-[#111] border border-[#222] rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-teal-500/50 resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-gray-400 block mb-1.5">Objetivo Principal</label>
                <div className="flex flex-wrap gap-1.5">
                  {GOALS.map((g) => (
                    <button
                      key={g.id}
                      onClick={() => setGoal(g.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                        goal === g.id
                          ? 'bg-teal-500/20 text-teal-400 border-teal-500/40'
                          : 'bg-[#111] text-gray-500 border-[#222] hover:border-[#333]'
                      }`}
                    >
                      {g.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-gray-400 block mb-1.5">Budget Mensal (USD)</label>
                <input
                  type="number"
                  value={monthlyBudget}
                  onChange={(e) => setMonthlyBudget(e.target.value)}
                  placeholder="10000"
                  className="w-full bg-[#111] border border-[#222] rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-teal-500/50"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-gray-400 block mb-1.5">Plataformas Ativas</label>
              <div className="flex flex-wrap gap-2">
                {PLATFORMS.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => togglePlatform(p.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                      activePlatforms.includes(p.id)
                        ? 'bg-teal-500/20 text-teal-400 border-teal-500/40'
                        : 'bg-[#111] text-gray-500 border-[#222] hover:border-[#333]'
                    }`}
                  >
                    <span>{p.emoji}</span>
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

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
              onClick={handleGenerate}
              disabled={loading}
              className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-teal-600 hover:bg-teal-500 disabled:opacity-40 text-white text-sm font-medium transition-colors"
            >
              {loading
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Gerando estratégia...</>
                : <><Lightbulb className="w-4 h-4" /> Gerar Estratégia</>
              }
            </button>
          </div>
        </>
      ) : (
        /* Results */
        <div className="space-y-5">
          {/* Budget recommendation */}
          <div className="bg-teal-500/5 border border-teal-500/20 rounded-xl p-5">
            <p className="text-xs font-bold text-teal-400 uppercase tracking-widest mb-2">Recomendação de Budget (70/20/10)</p>
            <p className="text-sm text-gray-300 leading-relaxed">{result.budgetRecommendation}</p>
          </div>

          {/* Concepts */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-gray-600 uppercase tracking-widest">
              {result.concepts.length} Conceitos de Campanha
            </h3>
            {result.concepts.map((concept, i) => (
              <ConceptCard key={i} concept={concept} index={i} />
            ))}
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => { setResult(null); setBrandDescription(''); }}
              className="px-4 py-2.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 text-sm transition-colors"
            >
              Nova Estratégia
            </button>
            <button
              onClick={() => onNavigate(View.ADS_STUDIO_COPY)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-teal-600/20 hover:bg-teal-600/30 text-teal-400 text-sm transition-colors"
            >
              Gerar Copy para estes conceitos
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

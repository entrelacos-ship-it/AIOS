import React, { useState } from 'react';
import { ArrowLeft, Wand2, Loader2, Copy, Trash2, ChevronDown, ChevronRight } from 'lucide-react';
import type { AdsPlatform, AdsCopyFramework, AdsCopyRecord, AdsCopyVariant } from '../../types';
import { View } from '../../types';

interface Props {
  onNavigate: (view: View) => void;
}

const PLATFORMS: Array<{ id: AdsPlatform; label: string }> = [
  { id: 'google', label: 'Google Ads' },
  { id: 'meta', label: 'Meta Ads' },
  { id: 'youtube', label: 'YouTube' },
  { id: 'linkedin', label: 'LinkedIn' },
  { id: 'tiktok', label: 'TikTok' },
  { id: 'microsoft', label: 'Microsoft' },
  { id: 'apple', label: 'Apple Search' },
];

const FRAMEWORKS: Array<{ id: AdsCopyFramework; label: string; desc: string }> = [
  { id: 'AIDA', label: 'AIDA', desc: 'Attention → Interest → Desire → Action' },
  { id: 'PAS', label: 'PAS', desc: 'Problem → Agitate → Solution' },
  { id: 'BAB', label: 'BAB', desc: 'Before → After → Bridge' },
  { id: '4P', label: '4P', desc: 'Promise → Picture → Proof → Push' },
  { id: 'FAB', label: 'FAB', desc: 'Feature → Advantage → Benefit' },
  { id: 'Star-Story-Solution', label: 'Star-Story', desc: 'Star → Story → Solution' },
];

function CopyCard({ variant, index }: { variant: AdsCopyVariant; index: number }) {
  const [copied, setCopied] = useState<string | null>(null);

  const copy = (text: string, key: string) => {
    void navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 1500);
  };

  const fullCopy = `${variant.headline}\n\n${variant.primaryText}\n\n${variant.description}\n\n${variant.cta}`;

  return (
    <div className="bg-[#0d0d0d] border border-[#1a1a1a] rounded-xl p-5 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-bold text-teal-400 uppercase tracking-wider">Variante {index + 1}</span>
        <button
          onClick={() => copy(fullCopy, `all-${index}`)}
          className="flex items-center gap-1.5 text-[10px] text-gray-500 hover:text-gray-300 transition-colors"
        >
          <Copy className="w-3 h-3" />
          {copied === `all-${index}` ? 'Copiado!' : 'Copiar tudo'}
        </button>
      </div>

      {[
        { key: 'headline', label: 'Headline', value: variant.headline },
        { key: 'primaryText', label: 'Primary Text', value: variant.primaryText },
        { key: 'description', label: 'Description', value: variant.description },
        { key: 'cta', label: 'CTA', value: variant.cta },
      ].map(({ key, label, value }) => (
        value ? (
          <div key={key} className="bg-[#0a0a0a] border border-[#181818] rounded-lg p-3">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <p className="text-[10px] text-gray-600 mb-1">{label}</p>
                <p className="text-xs text-gray-200 leading-relaxed">{value}</p>
              </div>
              <button
                onClick={() => copy(value, `${key}-${index}`)}
                className="text-gray-700 hover:text-gray-400 flex-shrink-0"
              >
                <Copy className="w-3 h-3" />
              </button>
            </div>
            {copied === `${key}-${index}` && (
              <p className="text-[10px] text-teal-400 mt-1">Copiado!</p>
            )}
          </div>
        ) : null
      ))}
    </div>
  );
}

export const AdsCopy: React.FC<Props> = ({ onNavigate }) => {
  const [platform, setPlatform] = useState<AdsPlatform>('meta');
  const [framework, setFramework] = useState<AdsCopyFramework>('AIDA');
  const [productDescription, setProductDescription] = useState('');
  const [targetAudience, setTargetAudience] = useState('');
  const [goal, setGoal] = useState('');
  const [loading, setLoading] = useState(false);
  const [variants, setVariants] = useState<AdsCopyVariant[] | null>(null);
  const [history, setHistory] = useState<AdsCopyRecord[]>([]);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!productDescription.trim() || !targetAudience.trim()) {
      setError('Preencha a descrição do produto e a audiência.');
      return;
    }
    setError(null);
    setLoading(true);
    setVariants(null);

    try {
      const res = await fetch('/api/ads/copy/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ platform, framework, productDescription, targetAudience, goal }),
      });
      if (!res.ok) {
        const d = await res.json() as { error: string };
        throw new Error(d.error ?? 'Erro ao gerar copy.');
      }
      const data = await res.json() as { variants: AdsCopyVariant[]; record: AdsCopyRecord };
      setVariants(data.variants);
      setHistory((prev) => [data.record, ...prev]);
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
          <h1 className="text-2xl font-bold text-white">Copy Generator</h1>
          <p className="text-gray-500 text-sm">6 frameworks × 7 plataformas → 3 variantes por geração</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Form */}
        <div className="space-y-5">
          <div className="bg-[#0d0d0d] border border-[#1a1a1a] rounded-xl p-5 space-y-4">
            <h2 className="text-xs font-bold text-gray-600 uppercase tracking-widest">Configuração</h2>

            <div>
              <label className="text-xs font-medium text-gray-400 block mb-1.5">Plataforma</label>
              <div className="flex flex-wrap gap-1.5">
                {PLATFORMS.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setPlatform(p.id)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-all ${
                      platform === p.id
                        ? 'bg-teal-500/20 text-teal-400 border-teal-500/40'
                        : 'bg-[#111] text-gray-500 border-[#222] hover:border-[#333]'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-gray-400 block mb-1.5">Framework de Copy</label>
              <div className="grid grid-cols-2 gap-1.5">
                {FRAMEWORKS.map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setFramework(f.id)}
                    className={`text-left px-3 py-2 rounded-lg border text-xs transition-all ${
                      framework === f.id
                        ? 'bg-teal-500/20 text-teal-400 border-teal-500/40'
                        : 'bg-[#111] text-gray-500 border-[#222] hover:border-[#333]'
                    }`}
                  >
                    <span className="font-semibold block">{f.label}</span>
                    <span className="text-[10px] opacity-70">{f.desc}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-[#0d0d0d] border border-[#1a1a1a] rounded-xl p-5 space-y-4">
            <h2 className="text-xs font-bold text-gray-600 uppercase tracking-widest">Contexto</h2>

            <div>
              <label className="text-xs font-medium text-gray-400 block mb-1.5">Produto / Serviço</label>
              <textarea
                value={productDescription}
                onChange={(e) => setProductDescription(e.target.value)}
                placeholder="Ex: Software de gestão financeira para MEI. Automatiza notas fiscais, fluxo de caixa e declaração de IR. Plano R$ 49/mês."
                rows={3}
                className="w-full bg-[#111] border border-[#222] rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-teal-500/50 resize-none"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-gray-400 block mb-1.5">Audiência-Alvo</label>
              <textarea
                value={targetAudience}
                onChange={(e) => setTargetAudience(e.target.value)}
                placeholder="Ex: MEIs e pequenos empresários, 25-45 anos, que perdem tempo com burocracia fiscal e têm medo de multas."
                rows={2}
                className="w-full bg-[#111] border border-[#222] rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-teal-500/50 resize-none"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-gray-400 block mb-1.5">Objetivo do Anúncio</label>
              <input
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                placeholder="Ex: Gerar trials gratuitos, gerar leads qualificados..."
                className="w-full bg-[#111] border border-[#222] rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-teal-500/50"
              />
            </div>
          </div>

          {error && (
            <div className="text-red-400 text-xs bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3">
              {error}
            </div>
          )}

          <button
            onClick={handleGenerate}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-teal-600 hover:bg-teal-500 disabled:opacity-40 text-white font-medium transition-colors"
          >
            {loading
              ? <><Loader2 className="w-4 h-4 animate-spin" /> Gerando 3 variantes...</>
              : <><Wand2 className="w-4 h-4" /> Gerar Copy</>
            }
          </button>
        </div>

        {/* Results */}
        <div className="space-y-4">
          {loading && (
            <div className="flex flex-col items-center justify-center h-40 gap-3 bg-[#0d0d0d] border border-[#1a1a1a] rounded-xl">
              <Loader2 className="w-6 h-6 text-teal-400 animate-spin" />
              <p className="text-gray-500 text-xs">Claude escrevendo variantes com framework {framework}...</p>
            </div>
          )}

          {variants && !loading && variants.map((v, i) => (
            <CopyCard key={i} variant={v} index={i} />
          ))}

          {!variants && !loading && (
            <div className="flex flex-col items-center justify-center h-40 gap-2 bg-[#0d0d0d] border border-dashed border-[#1a1a1a] rounded-xl text-center">
              <Wand2 className="w-7 h-7 text-teal-500/20" />
              <p className="text-gray-600 text-xs">As 3 variantes aparecerão aqui</p>
            </div>
          )}

          {/* History */}
          {history.length > 0 && (
            <div className="bg-[#0d0d0d] border border-[#1a1a1a] rounded-xl overflow-hidden">
              <button
                onClick={() => setHistoryOpen(!historyOpen)}
                className="w-full flex items-center justify-between px-4 py-3 text-xs font-bold text-gray-600 uppercase tracking-widest hover:bg-white/5 transition-colors"
              >
                <span>Histórico desta sessão ({history.length})</span>
                {historyOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
              </button>
              {historyOpen && (
                <div className="px-4 pb-4 space-y-2">
                  {history.map((h, i) => (
                    <button
                      key={h.id}
                      onClick={() => setVariants(h.variants)}
                      className="w-full text-left p-3 bg-[#0a0a0a] border border-[#181818] rounded-lg hover:border-[#2a2a2a] transition-colors"
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] text-teal-400 font-medium">{h.framework}</span>
                        <span className="text-[10px] text-gray-600">{PLATFORMS.find(p => p.id === h.platform)?.label}</span>
                      </div>
                      <p className="text-[10px] text-gray-500 truncate">{h.variants[0]?.headline}</p>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

import React, { useEffect, useState } from 'react';
import {
  TrendingUp, Wand2, Lightbulb, Target,
  CheckCircle2, AlertCircle, Clock,
} from 'lucide-react';
import type { AdsAuditRecord, AdsCopyRecord } from '../../types';
import { View } from '../../types';

interface Props {
  onNavigate: (view: View) => void;
}

const GRADE_COLOR: Record<string, string> = {
  A: 'text-emerald-400 bg-emerald-500/10',
  B: 'text-teal-400 bg-teal-500/10',
  C: 'text-yellow-400 bg-yellow-500/10',
  D: 'text-orange-400 bg-orange-500/10',
  F: 'text-red-400 bg-red-500/10',
};

const PLATFORM_LABELS: Record<string, string> = {
  google: 'Google Ads',
  meta: 'Meta Ads',
  youtube: 'YouTube',
  linkedin: 'LinkedIn',
  tiktok: 'TikTok',
  microsoft: 'Microsoft',
  apple: 'Apple Search',
};

export const AdsStudioDashboard: React.FC<Props> = ({ onNavigate }) => {
  const [audits, setAudits] = useState<AdsAuditRecord[]>([]);
  const [copy, setCopy] = useState<AdsCopyRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      setLoading(true);
      try {
        const [a, c] = await Promise.all([
          fetch('/api/ads/audits').then((r) => r.json()) as Promise<{ audits: AdsAuditRecord[] }>,
          fetch('/api/ads/copy').then((r) => r.json()) as Promise<{ copy: AdsCopyRecord[] }>,
        ]);
        setAudits(a.audits ?? []);
        setCopy(c.copy ?? []);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const actions = [
    {
      icon: Target,
      label: 'Nova Auditoria',
      desc: 'Analise performance com 250+ verificações',
      view: View.ADS_STUDIO_AUDIT,
      color: 'text-teal-400 bg-teal-500/10 hover:bg-teal-500/20',
    },
    {
      icon: Wand2,
      label: 'Gerar Copy',
      desc: '6 frameworks de copywriting por plataforma',
      view: View.ADS_STUDIO_COPY,
      color: 'text-violet-400 bg-violet-500/10 hover:bg-violet-500/20',
    },
    {
      icon: Lightbulb,
      label: 'Estratégia de Campanha',
      desc: '3-5 conceitos com regra 70/20/10',
      view: View.ADS_STUDIO_STRATEGY,
      color: 'text-amber-400 bg-amber-500/10 hover:bg-amber-500/20',
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Ads Studio</h1>
        <p className="text-gray-500 text-sm mt-0.5">
          Auditoria de campanhas, copy generator e estratégia — baseado em claude-ads
        </p>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {actions.map((a) => (
          <button
            key={a.view}
            onClick={() => onNavigate(a.view)}
            className={`p-5 rounded-xl border border-[#1a1a1a] bg-[#0d0d0d] text-left transition-all hover:border-[#2a2a2a] group`}
          >
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 transition-colors ${a.color}`}>
              <a.icon className="w-5 h-5" />
            </div>
            <p className="text-white font-semibold text-sm">{a.label}</p>
            <p className="text-gray-500 text-xs mt-1">{a.desc}</p>
          </button>
        ))}
      </div>

      {/* Recent audits */}
      {!loading && audits.length > 0 && (
        <div>
          <h2 className="text-xs font-bold text-gray-600 uppercase tracking-widest mb-3">
            Últimas Auditorias
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {audits.slice(0, 6).map((a) => (
              <div
                key={a.id}
                className="bg-[#0d0d0d] border border-[#1a1a1a] rounded-xl p-4"
              >
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-semibold text-gray-400">
                    {PLATFORM_LABELS[a.platform] ?? a.platform}
                  </p>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${GRADE_COLOR[a.grade] ?? ''}`}>
                    {a.grade} · {a.healthScore}
                  </span>
                </div>
                <p className="text-[10px] text-gray-600 line-clamp-2">{a.summary}</p>
                <div className="flex gap-2 mt-3">
                  {a.quickWins.filter((w) => w.severity === 'critical').length > 0 && (
                    <span className="flex items-center gap-1 text-[10px] text-red-400 bg-red-500/10 px-2 py-0.5 rounded-full">
                      <AlertCircle className="w-2.5 h-2.5" />
                      {a.quickWins.filter((w) => w.severity === 'critical').length} críticos
                    </span>
                  )}
                  <span className="flex items-center gap-1 text-[10px] text-gray-600">
                    <Clock className="w-2.5 h-2.5" />
                    {new Date(a.createdAt).toLocaleDateString('pt-BR')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent copy */}
      {!loading && copy.length > 0 && (
        <div>
          <h2 className="text-xs font-bold text-gray-600 uppercase tracking-widest mb-3">
            Copy Gerada Recentemente
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {copy.slice(0, 4).map((c) => (
              <div key={c.id} className="bg-[#0d0d0d] border border-[#1a1a1a] rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[10px] text-teal-400 bg-teal-500/10 px-2 py-0.5 rounded-full font-medium">
                    {c.framework}
                  </span>
                  <span className="text-[10px] text-gray-600">
                    {PLATFORM_LABELS[c.platform] ?? c.platform}
                  </span>
                </div>
                <p className="text-xs text-white font-medium truncate">{c.variants[0]?.headline}</p>
                <p className="text-[10px] text-gray-600 mt-1 line-clamp-2">{c.variants[0]?.primaryText}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

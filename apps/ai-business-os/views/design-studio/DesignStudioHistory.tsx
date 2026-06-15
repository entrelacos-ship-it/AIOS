import React, { useEffect, useState } from 'react';
import { History, Wand2, Trash2, Upload, AlertTriangle } from 'lucide-react';
import type { DesignArtifact } from '../../types';
import { PHILOSOPHY_META, OUTPUT_TYPE_META } from '../../services/designStudioService';

const DS_HISTORY_KEY = 'ds:history';

interface Props {
  onSelectArtifact: (artifact: DesignArtifact) => void;
  onNewBrief: () => void;
}

export const DesignStudioHistory: React.FC<Props> = ({ onSelectArtifact, onNewBrief }) => {
  const [history, setHistory] = useState<DesignArtifact[]>([]);
  const [confirmClear, setConfirmClear] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(DS_HISTORY_KEY);
      if (raw) setHistory(JSON.parse(raw));
    } catch {
      setHistory([]);
    }
  }, []);

  const handleClear = () => {
    if (!confirmClear) {
      setConfirmClear(true);
      setTimeout(() => setConfirmClear(false), 3000);
      return;
    }
    localStorage.removeItem(DS_HISTORY_KEY);
    setHistory([]);
    setConfirmClear(false);
  };

  return (
    <div className="text-[#EDEDED]">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-violet-500/20 flex items-center justify-center">
            <History className="w-4 h-4 text-violet-400" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-white">Histórico</h1>
            <p className="text-xs text-gray-500">{history.length} artefatos salvos localmente</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {history.length > 0 && (
            <button
              onClick={handleClear}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs transition-all ${
                confirmClear
                  ? 'bg-red-500/20 border border-red-500/30 text-red-400'
                  : 'bg-white/5 text-gray-500 hover:text-gray-300'
              }`}
            >
              {confirmClear ? (
                <>
                  <AlertTriangle className="w-3.5 h-3.5" />
                  Confirmar limpeza?
                </>
              ) : (
                <>
                  <Trash2 className="w-3.5 h-3.5" />
                  Limpar histórico
                </>
              )}
            </button>
          )}
          <button
            onClick={onNewBrief}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-xs transition-all"
          >
            <Wand2 className="w-3.5 h-3.5" />
            Novo artefato
          </button>
        </div>
      </div>

      {history.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-16 h-16 rounded-2xl bg-[#111] border border-[#222] flex items-center justify-center mb-4">
            <History className="w-7 h-7 text-gray-600" />
          </div>
          <h2 className="text-lg font-medium text-gray-400 mb-2">Sem histórico</h2>
          <p className="text-sm text-gray-600 mb-6 max-w-xs">
            Artefatos gerados aparecem aqui. Até 20 entradas são salvas no navegador.
          </p>
          <button
            onClick={onNewBrief}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-sm transition-all"
          >
            <Wand2 className="w-4 h-4" />
            Criar primeiro artefato
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {history.map((artifact) => (
            <ArtifactCard
              key={artifact.id}
              artifact={artifact}
              onLoad={() => onSelectArtifact(artifact)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// ─── Artifact Card ────────────────────────────────────────────────────────────

const ArtifactCard: React.FC<{
  artifact: DesignArtifact;
  onLoad: () => void;
}> = ({ artifact, onLoad }) => {
  const { brief, critiqueScore, createdAt } = artifact;
  const philosophyMeta = PHILOSOPHY_META[brief.philosophySchool];
  const outputMeta = OUTPUT_TYPE_META[brief.outputType];

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

  const scoreColor =
    avgScore === null
      ? 'text-gray-600'
      : avgScore >= 70
        ? 'text-emerald-400'
        : avgScore >= 40
          ? 'text-amber-400'
          : 'text-red-400';

  return (
    <div className="bg-[#111] border border-[#222] hover:border-violet-500/40 rounded-xl p-5 transition-all flex flex-col gap-4">
      {/* Title + Badges */}
      <div>
        <h3 className="text-sm font-semibold text-white leading-tight mb-2">{brief.title}</h3>
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
          {brief.deviceFrame !== 'none' && (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-gray-500">
              {brief.deviceFrame === 'iphone_15' ? 'iPhone 15' : 'Browser'}
            </span>
          )}
        </div>
      </div>

      {/* Description */}
      <p className="text-xs text-gray-600 leading-relaxed line-clamp-2 flex-1">
        {brief.description}
      </p>

      {/* Footer */}
      <div className="flex items-center justify-between pt-2 border-t border-[#1a1a1a]">
        <div className="flex items-center gap-3">
          {avgScore !== null ? (
            <div className="flex items-baseline gap-0.5">
              <span className={`text-sm font-bold ${scoreColor}`}>{avgScore}</span>
              <span className="text-[10px] text-gray-600">/100</span>
            </div>
          ) : (
            <span className="text-[10px] text-gray-700">Sem crítica</span>
          )}
          <span className="text-[10px] text-gray-700">
            {new Date(createdAt).toLocaleDateString('pt-BR')}
          </span>
        </div>
        <button
          onClick={onLoad}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-violet-600/80 hover:bg-violet-600 text-white text-xs transition-all"
        >
          <Upload className="w-3 h-3" />
          Carregar
        </button>
      </div>
    </div>
  );
};

import React from 'react';
import { ArrowLeft, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import type { DesignArtifact, DesignCritiqueScore } from '../../types';
import { PHILOSOPHY_META, OUTPUT_TYPE_META } from '../../services/designStudioService';

interface Props {
  artifact: DesignArtifact;
  onBack: () => void;
}

const DIMENSIONS: { key: keyof Omit<DesignCritiqueScore, 'summary' | 'recommendations'>; label: string; description: string }[] = [
  {
    key: 'philosophy',
    label: 'Filosofia',
    description: 'Fidelidade às regras não-negociáveis da escola de design declarada',
  },
  {
    key: 'hierarchy',
    label: 'Hierarquia',
    description: 'O olho viaja corretamente do elemento mais importante ao menos importante',
  },
  {
    key: 'craft',
    label: 'Craft',
    description: 'Precisão de CSS, consistência tipográfica, sistema de espaçamento',
  },
  {
    key: 'functionality',
    label: 'Funcionalidade',
    description: 'Usabilidade, alvos de toque, clareza de navegação, visibilidade de estado',
  },
  {
    key: 'originality',
    label: 'Originalidade',
    description: 'Diferenciação criativa — ausência de padrões AI-slop proibidos',
  },
];

const scoreColor = (score: number): string => {
  if (score >= 70) return 'text-emerald-400';
  if (score >= 40) return 'text-amber-400';
  return 'text-red-400';
};

const scoreBg = (score: number): string => {
  if (score >= 70) return 'bg-emerald-500/10 border-emerald-500/30';
  if (score >= 40) return 'bg-amber-500/10 border-amber-500/30';
  return 'bg-red-500/10 border-red-500/30';
};

const ScoreBar: React.FC<{ score: number }> = ({ score }) => {
  const color =
    score >= 70
      ? 'bg-emerald-500'
      : score >= 40
        ? 'bg-amber-500'
        : 'bg-red-500';
  return (
    <div className="h-1.5 bg-white/5 rounded-full overflow-hidden mt-2">
      <div
        className={`h-full ${color} rounded-full transition-all duration-700`}
        style={{ width: `${score}%` }}
      />
    </div>
  );
};

const getPriorityStyle = (rec: string): { label: string; style: string } => {
  if (rec.startsWith('P1') || rec.toLowerCase().startsWith('p1')) {
    return { label: 'P1', style: 'bg-red-500/20 text-red-400 border-red-500/30' };
  }
  if (rec.startsWith('P2') || rec.toLowerCase().startsWith('p2')) {
    return { label: 'P2', style: 'bg-amber-500/20 text-amber-400 border-amber-500/30' };
  }
  return { label: 'P3', style: 'bg-blue-500/20 text-blue-400 border-blue-500/30' };
};

export const DesignStudioCritique: React.FC<Props> = ({ artifact, onBack }) => {
  const { brief, critiqueScore } = artifact;
  if (!critiqueScore) return null;

  const philosophyMeta = PHILOSOPHY_META[brief.philosophySchool];
  const outputMeta = OUTPUT_TYPE_META[brief.outputType];

  const avgScore = Math.round(
    (critiqueScore.philosophy +
      critiqueScore.hierarchy +
      critiqueScore.craft +
      critiqueScore.functionality +
      critiqueScore.originality) /
      5,
  );

  const radarData = DIMENSIONS.map((d) => ({
    subject: d.label,
    value: critiqueScore[d.key],
    fullMark: 100,
  }));

  const AvgIcon =
    avgScore >= 70 ? TrendingUp : avgScore >= 40 ? Minus : TrendingDown;

  return (
    <div className="text-[#EDEDED]">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-300 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar ao workspace
        </button>
        <div className="h-4 w-px bg-[#333]" />
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">{brief.title}</span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-300">
            {outputMeta.label}
          </span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-white/5 text-gray-400">
            {philosophyMeta.label}
          </span>
        </div>
      </div>

      {/* Overall score banner */}
      <div className={`rounded-xl border p-5 mb-6 flex items-center gap-5 ${scoreBg(avgScore)}`}>
        <div className="flex items-baseline gap-2">
          <span className={`text-5xl font-black ${scoreColor(avgScore)}`}>{avgScore}</span>
          <span className="text-gray-500 text-sm">/100</span>
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <AvgIcon className={`w-4 h-4 ${scoreColor(avgScore)}`} />
            <span className="text-sm font-medium text-white">Pontuação média</span>
          </div>
          <p className="text-sm text-gray-400 leading-relaxed">{critiqueScore.summary}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_400px] gap-6">
        {/* Left — Dimension cards */}
        <div className="space-y-3">
          {DIMENSIONS.map(({ key, label, description }) => {
            const score = critiqueScore[key];
            return (
              <div
                key={key}
                className="bg-[#111] border border-[#222] rounded-xl p-5 flex items-start gap-5"
              >
                <div className="w-16 flex-shrink-0 text-center">
                  <div className={`text-3xl font-black ${scoreColor(score)}`}>{score}</div>
                  <div className="text-[10px] text-gray-600 mt-0.5">/100</div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline justify-between gap-2 mb-0.5">
                    <span className="text-sm font-semibold text-white">{label}</span>
                    <span className="text-xs text-gray-600">
                      {score >= 70 ? 'Forte' : score >= 40 ? 'Adequado' : 'Crítico'}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 leading-relaxed">{description}</p>
                  <ScoreBar score={score} />
                </div>
              </div>
            );
          })}
        </div>

        {/* Right — Radar + Recommendations */}
        <div className="space-y-5">
          {/* Radar */}
          <div className="bg-[#111] border border-[#222] rounded-xl p-5">
            <h3 className="text-sm font-medium text-gray-400 mb-4">Radar de qualidade</h3>
            <ResponsiveContainer width="100%" height={260}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="#222" />
                <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11, fill: '#666' }} />
                <PolarRadiusAxis
                  angle={90}
                  domain={[0, 100]}
                  tick={{ fontSize: 9, fill: '#444' }}
                  tickCount={5}
                />
                <Radar
                  name="Score"
                  dataKey="value"
                  stroke="#8b5cf6"
                  fill="#8b5cf6"
                  fillOpacity={0.2}
                  strokeWidth={2}
                />
                <Tooltip
                  contentStyle={{
                    background: '#111',
                    border: '1px solid #333',
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                  formatter={(value: number) => [`${value}/100`, 'Score']}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          {/* Recommendations */}
          <div className="bg-[#111] border border-[#222] rounded-xl p-5">
            <h3 className="text-sm font-medium text-gray-400 mb-4">
              Recomendações ({critiqueScore.recommendations.length})
            </h3>
            {critiqueScore.recommendations.length === 0 ? (
              <p className="text-xs text-gray-600">Nenhuma recomendação gerada.</p>
            ) : (
              <div className="space-y-3">
                {critiqueScore.recommendations.map((rec, i) => {
                  const { label, style } = getPriorityStyle(rec);
                  return (
                    <div
                      key={i}
                      className="flex items-start gap-3 p-3 bg-white/[0.02] rounded-lg border border-white/5"
                    >
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.5 rounded border flex-shrink-0 mt-0.5 ${style}`}
                      >
                        {label}
                      </span>
                      <span className="text-xs text-gray-400 leading-relaxed">{rec}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

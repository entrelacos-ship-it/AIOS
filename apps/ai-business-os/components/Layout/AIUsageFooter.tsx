import React, { useEffect, useMemo, useState } from 'react';

type AIUsageEvent = {
  providerId: string;
  model: string;
  capability: string;
  requestedAt: string;
  totalTokens: number | null;
};

type AIUsageSummary = {
  totalRequests: number;
  totalTokens: number;
  lastEvent: AIUsageEvent | null;
  currentModelUsagePercent: number;
  currentProviderUsagePercent: number;
  modelBreakdown: Array<{ model: string; requests: number; percent: number }>;
  providerBreakdown: Array<{ providerId: string; requests: number; percent: number }>;
};

type ProviderStatusSummary = {
  groqConfigured: boolean;
  geminiConfigured: boolean;
  textAiConfigured: boolean;
  imageAiConfigured: boolean;
  videoAiConfigured: boolean;
  textPrimaryProvider: string | null;
  groqModel: string | null;
};

type FooterState = {
  usage: AIUsageSummary | null;
  providerStatus: ProviderStatusSummary | null;
};

const formatCompactNumber = (value: number) => {
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(1)}M`;
  }

  if (value >= 1_000) {
    return `${(value / 1_000).toFixed(1)}k`;
  }

  return String(value);
};

const formatLastSeen = (value?: string | null) => {
  if (!value) return 'sem histórico';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'sem histórico';

  return date.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  });
};

const statusTone = (active: boolean) => (
  active
    ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
    : 'border-[#2A2A2A] bg-[#111111] text-gray-500'
);

export const AIUsageFooter: React.FC = () => {
  const [state, setState] = useState<FooterState>({
    usage: null,
    providerStatus: null,
  });
  const [error, setError] = useState(false);

  useEffect(() => {
    let active = true;

    const loadFooter = async () => {
      try {
        const [usageResponse, providerStatusResponse] = await Promise.all([
          fetch('/api/ai/usage'),
          fetch('/api/ai/providers/status'),
        ]);

        const [usagePayload, providerStatusPayload] = await Promise.all([
          usageResponse.json().catch(() => ({})),
          providerStatusResponse.json().catch(() => ({})),
        ]);

        if (!usageResponse.ok) {
          throw new Error(usagePayload.error || 'Failed to load AI usage.');
        }

        if (!providerStatusResponse.ok) {
          throw new Error(providerStatusPayload.error || 'Failed to load AI provider status.');
        }

        if (active) {
          setState({
            usage: usagePayload.usage || null,
            providerStatus: providerStatusPayload || null,
          });
          setError(false);
        }
      } catch {
        if (active) {
          setError(true);
        }
      }
    };

    void loadFooter();
    const interval = window.setInterval(() => {
      void loadFooter();
    }, 15000);

    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, []);

  const usage = state.usage;
  const providerStatus = state.providerStatus;
  const lastEvent = usage?.lastEvent || null;

  const primaryPercent = useMemo(() => {
    if (!usage) return 0;
    return Math.max(usage.currentModelUsagePercent, usage.currentProviderUsagePercent);
  }, [usage]);

  const dominantModel = usage?.modelBreakdown?.[0] || null;
  const dominantProvider = usage?.providerBreakdown?.[0] || null;

  return (
    <div className="fixed bottom-0 left-64 right-0 z-40 border-t border-[#1d1d1d] bg-[#080808]/96 backdrop-blur-xl">
      <div className="flex min-h-[72px] items-center justify-between gap-6 px-8 py-3">
        <div className="flex min-w-0 items-center gap-4">
          <div className="flex items-center gap-3 rounded-2xl border border-[#202020] bg-[#0E0E0E] px-4 py-3 shadow-[0_0_0_1px_rgba(255,255,255,0.02)]">
            <span className="text-lg font-black tracking-tight text-emerald-300">
              {primaryPercent}%
            </span>
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold text-white">
                Entrelaç[OS]
              </div>
              <div className="text-[11px] uppercase tracking-[0.18em] text-gray-500">
                uso atual da llm
              </div>
            </div>
          </div>

          <div className="grid min-w-0 grid-cols-2 gap-x-6 gap-y-1 text-xs xl:grid-cols-4">
            <div className="min-w-0">
              <div className="uppercase tracking-[0.18em] text-gray-500">Modelo ativo</div>
              <div className="truncate font-semibold text-white">
                {lastEvent?.model || 'sem uso ainda'}
              </div>
            </div>
            <div className="min-w-0">
              <div className="uppercase tracking-[0.18em] text-gray-500">Provider ativo</div>
              <div className="truncate font-semibold text-gray-200">
                {lastEvent?.providerId || 'n/d'}
              </div>
            </div>
            <div className="min-w-0">
              <div className="uppercase tracking-[0.18em] text-gray-500">Roteador texto</div>
              <div className="truncate font-semibold text-gray-200">
                {providerStatus?.textPrimaryProvider || dominantProvider?.providerId || 'n/d'}
              </div>
            </div>
            <div className="min-w-0">
              <div className="uppercase tracking-[0.18em] text-gray-500">Última chamada</div>
              <div className="truncate font-semibold text-gray-200">
                {formatLastSeen(lastEvent?.requestedAt)}
              </div>
            </div>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-3">
          <div className="rounded-2xl border border-[#202020] bg-[#0E0E0E] px-4 py-3 text-xs">
            <div className="uppercase tracking-[0.18em] text-gray-500">Operação</div>
            <div className="mt-1 flex items-center gap-4">
              <span className="font-semibold text-white">
                {usage?.totalRequests ?? 0} req
              </span>
              <span className="font-semibold text-white">
                {formatCompactNumber(usage?.totalTokens ?? 0)} tok
              </span>
              <span className="font-semibold text-sky-300">
                {usage?.currentProviderUsagePercent ?? 0}% provider
              </span>
              <span className="font-semibold text-emerald-300">
                {usage?.currentModelUsagePercent ?? 0}% modelo
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className={`rounded-full border px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.16em] ${statusTone(Boolean(providerStatus?.textAiConfigured))}`}>
              texto
            </span>
            <span className={`rounded-full border px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.16em] ${statusTone(Boolean(providerStatus?.imageAiConfigured))}`}>
              imagem
            </span>
            <span className={`rounded-full border px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.16em] ${statusTone(Boolean(providerStatus?.videoAiConfigured))}`}>
              vídeo
            </span>
          </div>

          <div className="min-w-[148px] rounded-2xl border border-[#202020] bg-[#0E0E0E] px-4 py-3 text-xs">
            <div className="uppercase tracking-[0.18em] text-gray-500">Dominante</div>
            <div className="mt-1 truncate font-semibold text-white">
              {dominantModel?.model || 'sem histórico'}
            </div>
            <div className={`mt-1 text-[11px] font-medium ${error ? 'text-amber-400' : 'text-gray-500'}`}>
              {error ? 'telemetria indisponível' : 'painel administrativo do projeto'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

import React, { useEffect, useState } from 'react';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import type {
  AICapability,
  AIProviderHealth,
  AIProviderId,
  AIProviderRecord,
  AIPromptTemplate,
  AIRoutingPolicy,
} from '../types';
import { Activity, Bot, Cable, KeyRound, RefreshCw, Route, ShieldCheck, Sparkles } from 'lucide-react';

const capabilityLabels: Record<AICapability, string> = {
  text_generation: 'Texto livre',
  structured_text: 'Texto estruturado',
  image_generation: 'Geração de imagem',
  image_editing: 'Edição de imagem',
  video_generation: 'Geração de vídeo',
  search_grounded_text: 'Texto com grounding',
};

const healthBadgeColor = (state: AIProviderHealth['state']) => {
  if (state === 'healthy') return 'success';
  if (state === 'error') return 'danger';
  if (state === 'missing_credentials') return 'warning';
  if (state === 'disabled') return 'neutral';
  return 'neutral';
};

const credentialBadgeColor = (state: AIProviderRecord['config']['credentialStatus']) => {
  if (state === 'configured') return 'success';
  if (state === 'invalid') return 'danger';
  return 'warning';
};

const promptGroupLabels: Record<AIPromptTemplate['group'], string> = {
  manifesto: 'Agente de manifesto',
  editorial: 'Linhas editoriais',
  calendar: 'Calendário de conteúdo',
  format_prompt: 'Prompts por formato',
  content_generation: 'Geração de conteúdo',
};

const emptyHealth: AIProviderHealth = {
  providerId: 'groq',
  state: 'unknown',
  message: 'Not tested yet.',
  checkedAt: null,
};

export const AIControlCenter: React.FC = () => {
  const [providers, setProviders] = useState<AIProviderRecord[]>([]);
  const [routing, setRouting] = useState<AIRoutingPolicy[]>([]);
  const [health, setHealth] = useState<AIProviderHealth[]>([]);
  const [promptTemplates, setPromptTemplates] = useState<AIPromptTemplate[]>([]);
  const [promptInputs, setPromptInputs] = useState<Record<string, string>>({});
  const [credentialInputs, setCredentialInputs] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string>('');
  const [error, setError] = useState<string>('');

  const loadData = async () => {
    setIsLoading(true);
    setError('');

    try {
      const [providersResponse, healthResponse, promptsResponse] = await Promise.all([
        fetch('/api/ai/providers'),
        fetch('/api/ai/health'),
        fetch('/api/ai/prompts'),
      ]);

      const providersPayload = await providersResponse.json();
      const healthPayload = await healthResponse.json();
      const promptsPayload = await promptsResponse.json();

      if (!providersResponse.ok) {
        throw new Error(providersPayload?.error || 'Falha ao carregar providers.');
      }

      if (!healthResponse.ok) {
        throw new Error(healthPayload?.error || 'Falha ao carregar health checks.');
      }

      if (!promptsResponse.ok) {
        throw new Error(promptsPayload?.error || 'Falha ao carregar templates de prompt.');
      }

      setProviders(Array.isArray(providersPayload?.providers) ? providersPayload.providers : []);
      setRouting(Array.isArray(providersPayload?.routing) ? providersPayload.routing : []);
      setHealth(Array.isArray(healthPayload?.health) ? healthPayload.health : []);
      setPromptTemplates(Array.isArray(promptsPayload?.prompts) ? promptsPayload.prompts : []);
      setPromptInputs({});
      setCredentialInputs({});
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Falha ao carregar AI Control Center.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const setProviderConfig = (providerId: AIProviderId, updater: (record: AIProviderRecord) => AIProviderRecord) => {
    setProviders((current) => current.map((record) => (
      record.config.id === providerId ? updater(record) : record
    )));
  };

  const saveProviderConfig = async (providerId: AIProviderId, nextProvider?: AIProviderRecord) => {
    const provider = nextProvider || providers.find((record) => record.config.id === providerId);
    if (!provider) return;

    setBusyKey(`provider:${providerId}`);
    setError('');
    setFeedback('');

    try {
      const response = await fetch(`/api/ai/providers/${providerId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          enabled: provider.config.enabled,
          baseUrl: provider.config.baseUrl || '',
          capabilities: provider.config.capabilities,
          modelDefaults: provider.config.modelDefaults,
        }),
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.error || 'Falha ao salvar provider.');
      }

      setProviderConfig(providerId, () => payload);
      setFeedback(`${provider.config.label} atualizado com sucesso.`);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Falha ao salvar provider.');
    } finally {
      setBusyKey(null);
    }
  };

  const saveCredentials = async (providerId: AIProviderId) => {
    const apiKey = credentialInputs[providerId]?.trim();
    if (!apiKey) {
      setError('Informe uma chave antes de salvar.');
      return;
    }

    setBusyKey(`credential:${providerId}`);
    setError('');
    setFeedback('');

    try {
      const response = await fetch(`/api/ai/providers/${providerId}/credentials`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey }),
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.error || 'Falha ao salvar credencial.');
      }

      setProviderConfig(providerId, () => payload);
      setCredentialInputs((current) => ({ ...current, [providerId]: '' }));
      setFeedback(`Credencial de ${payload.config.label} salva com sucesso.`);
    } catch (credentialError) {
      setError(credentialError instanceof Error ? credentialError.message : 'Falha ao salvar credencial.');
    } finally {
      setBusyKey(null);
    }
  };

  const clearCredentials = async (providerId: AIProviderId) => {
    setBusyKey(`credential:${providerId}`);
    setError('');
    setFeedback('');

    try {
      const response = await fetch(`/api/ai/providers/${providerId}/credentials`, {
        method: 'DELETE',
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.error || 'Falha ao remover credencial.');
      }

      setProviderConfig(providerId, () => payload);
      setFeedback(`Credencial de ${payload.config.label} removida.`);
    } catch (credentialError) {
      setError(credentialError instanceof Error ? credentialError.message : 'Falha ao remover credencial.');
    } finally {
      setBusyKey(null);
    }
  };

  const runHealthCheck = async (providerId: AIProviderId) => {
    setBusyKey(`test:${providerId}`);
    setError('');
    setFeedback('');

    try {
      const response = await fetch(`/api/ai/providers/${providerId}/test`, {
        method: 'POST',
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.error || 'Falha ao testar provider.');
      }

      setHealth((current) => {
        const next = current.filter((item) => item.providerId !== providerId);
        return [...next, payload];
      });
      setFeedback(`Teste de conexão concluído para ${providerId}.`);
    } catch (testError) {
      setError(testError instanceof Error ? testError.message : 'Falha ao testar provider.');
    } finally {
      setBusyKey(null);
    }
  };

  const updateRouting = async (capability: AICapability, nextPolicy: AIRoutingPolicy) => {
    setBusyKey(`routing:${capability}`);
    setError('');
    setFeedback('');

    try {
      const response = await fetch(`/api/ai/routing/${capability}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          primaryProvider: nextPolicy.primaryProvider,
          fallbackOrder: nextPolicy.fallbackOrder,
        }),
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.error || 'Falha ao salvar roteamento.');
      }

      setRouting((current) => current.map((policy) => policy.capability === capability ? payload : policy));
      setFeedback(`Roteamento de ${capabilityLabels[capability]} atualizado.`);
    } catch (routingError) {
      setError(routingError instanceof Error ? routingError.message : 'Falha ao salvar roteamento.');
    } finally {
      setBusyKey(null);
    }
  };

  const savePromptTemplate = async (promptId: AIPromptTemplate['id']) => {
    const prompt = promptInputs[promptId]?.trim() ?? promptTemplates.find((template) => template.id === promptId)?.prompt ?? '';
    if (!prompt) {
      setError('Informe um prompt antes de salvar.');
      return;
    }

    setBusyKey(`prompt:${promptId}`);
    setError('');
    setFeedback('');

    try {
      const response = await fetch(`/api/ai/prompts/${promptId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.error || 'Falha ao salvar template de prompt.');
      }

      setPromptTemplates((current) => current.map((template) => template.id === promptId ? payload : template));
      setPromptInputs((current) => ({ ...current, [promptId]: payload.prompt }));
      setFeedback(`${payload.label} salvo com sucesso.`);
    } catch (promptError) {
      setError(promptError instanceof Error ? promptError.message : 'Falha ao salvar template de prompt.');
    } finally {
      setBusyKey(null);
    }
  };

  const healthByProvider = (providerId: AIProviderId) =>
    health.find((item) => item.providerId === providerId) || { ...emptyHealth, providerId };

  const enabledProviders = providers.filter((provider) => provider.config.enabled);
  const healthyProviders = health.filter((item) => item.state === 'healthy').length;
  const promptGroups = Object.entries(
    promptTemplates.reduce<Record<AIPromptTemplate['group'], AIPromptTemplate[]>>((groups, template) => {
      groups[template.group] = [...(groups[template.group] || []), template];
      return groups;
    }, {
      editorial: [],
      calendar: [],
      format_prompt: [],
      content_generation: [],
    }),
  ) as Array<[AIPromptTemplate['group'], AIPromptTemplate[]]>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white mb-1">AI Control Center</h2>
          <p className="text-gray-500 text-sm font-serif">Configure provedores, credenciais, capacidades e fallback do roteador de IA.</p>
        </div>
        <div className="flex gap-3">
          <Button variant="secondary" onClick={loadData} isLoading={isLoading}>
            <RefreshCw size={16} /> Recarregar
          </Button>
        </div>
      </div>

      {(feedback || error) && (
        <div className={`rounded-2xl border px-4 py-3 text-sm ${error ? 'border-red-500/20 bg-red-500/10 text-red-100' : 'border-emerald-500/20 bg-emerald-500/10 text-emerald-100'}`}>
          {error || feedback}
        </div>
      )}

      <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
        Fase 2: texto, imagem, edição de imagem, vídeo e grounding já podem ser governados pelo roteador central e pelas credenciais salvas neste painel.
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="border-border bg-[#0A0A0A]">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-primary/10 text-primary"><Cable size={18} /></div>
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-gray-500 font-bold">Providers</p>
              <p className="text-2xl text-white font-bold">{providers.length}</p>
            </div>
          </div>
        </Card>
        <Card className="border-border bg-[#0A0A0A]">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-400"><ShieldCheck size={18} /></div>
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-gray-500 font-bold">Habilitados</p>
              <p className="text-2xl text-white font-bold">{enabledProviders.length}</p>
            </div>
          </div>
        </Card>
        <Card className="border-border bg-[#0A0A0A]">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-blue-500/10 text-blue-400"><Activity size={18} /></div>
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-gray-500 font-bold">Saudáveis</p>
              <p className="text-2xl text-white font-bold">{healthyProviders}</p>
            </div>
          </div>
        </Card>
        <Card className="border-border bg-[#0A0A0A]">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-orange-500/10 text-orange-400"><Route size={18} /></div>
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-gray-500 font-bold">Rotas</p>
              <p className="text-2xl text-white font-bold">{routing.length}</p>
            </div>
          </div>
        </Card>
      </div>

      <Card className="border-border bg-[#0A0A0A]">
        <div className="flex items-center gap-3 mb-6">
          <Bot size={18} className="text-primary" />
          <div>
            <h3 className="text-lg text-white font-bold">Providers</h3>
            <p className="text-sm text-gray-500">Cada card controla credencial, modelo padrão, capacidades e status operacional.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {providers.map((provider) => {
            const providerHealth = healthByProvider(provider.config.id);
            const supportedCapabilities = Object.entries(provider.config.capabilities)
              .filter(([, enabled]) => enabled)
              .map(([capability]) => capability as AICapability);

            return (
              <div key={provider.config.id} className="rounded-2xl border border-[#222] bg-[#111] p-5 space-y-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h4 className="text-lg font-bold text-white">{provider.config.label}</h4>
                    <p className="text-xs text-gray-500 mt-1 uppercase tracking-[0.2em]">{provider.config.id}</p>
                  </div>
                  <div className="flex flex-wrap gap-2 justify-end">
                    <Badge color={provider.config.enabled ? 'success' : 'neutral'} variant="soft">
                      {provider.config.enabled ? 'Ativo' : 'Desligado'}
                    </Badge>
                    <Badge color={credentialBadgeColor(provider.config.credentialStatus)} variant="soft">
                      {provider.config.credentialStatus}
                    </Badge>
                    <Badge color={healthBadgeColor(providerHealth.state)} variant="soft">
                      {providerHealth.state}
                    </Badge>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-[0.2em] text-gray-500 mb-2">Base URL</label>
                    <input
                      value={provider.config.baseUrl || ''}
                      onChange={(event) => setProviderConfig(provider.config.id, (record) => ({
                        ...record,
                        config: { ...record.config, baseUrl: event.target.value },
                      }))}
                      placeholder="Opcional"
                      className="w-full bg-[#141414] border border-[#222] rounded-xl p-3 text-sm text-gray-200 focus:border-primary focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-[0.2em] text-gray-500 mb-2">Credencial</label>
                    <div className="flex items-center gap-2 rounded-xl border border-[#222] bg-[#141414] px-3">
                      <KeyRound size={15} className="text-gray-500" />
                      <input
                        type="password"
                        value={credentialInputs[provider.config.id] || ''}
                        onChange={(event) => setCredentialInputs((current) => ({ ...current, [provider.config.id]: event.target.value }))}
                        placeholder={provider.secret.hasKey ? provider.secret.maskedKey : 'Cole a API key'}
                        className="w-full bg-transparent py-3 text-sm text-gray-200 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-gray-500 mb-3">Capacidades</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {Object.entries(provider.config.capabilities).map(([capability, enabled]) => (
                      <label key={capability} className="flex items-center gap-3 rounded-xl border border-[#222] bg-[#141414] px-3 py-2 text-sm text-gray-300">
                        <input
                          type="checkbox"
                          checked={enabled}
                          onChange={(event) => setProviderConfig(provider.config.id, (record) => ({
                            ...record,
                            config: {
                              ...record.config,
                              capabilities: {
                                ...record.config.capabilities,
                                [capability]: event.target.checked,
                              },
                            },
                          }))}
                          className="accent-primary"
                        />
                        <span>{capabilityLabels[capability as AICapability]}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-gray-500 mb-3">Modelos padrão</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {supportedCapabilities.map((capability) => (
                      <div key={capability}>
                        <label className="block text-[11px] text-gray-500 mb-2">{capabilityLabels[capability]}</label>
                        <input
                          value={provider.config.modelDefaults[capability] || ''}
                          onChange={(event) => setProviderConfig(provider.config.id, (record) => ({
                            ...record,
                            config: {
                              ...record.config,
                              modelDefaults: {
                                ...record.config.modelDefaults,
                                [capability]: event.target.value,
                              },
                            },
                          }))}
                          placeholder="Nome do modelo"
                          className="w-full bg-[#141414] border border-[#222] rounded-xl p-3 text-sm text-gray-200 focus:border-primary focus:outline-none"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex flex-wrap gap-3">
                  <Button
                    variant={provider.config.enabled ? 'secondary' : 'primary'}
                    onClick={async () => {
                      const nextProvider = {
                        ...provider,
                        config: { ...provider.config, enabled: !provider.config.enabled },
                      };
                      setProviderConfig(provider.config.id, () => nextProvider);
                      await saveProviderConfig(provider.config.id, nextProvider);
                    }}
                    isLoading={busyKey === `provider:${provider.config.id}`}
                  >
                    {provider.config.enabled ? 'Desabilitar' : 'Habilitar'}
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => saveProviderConfig(provider.config.id)}
                    isLoading={busyKey === `provider:${provider.config.id}`}
                  >
                    Salvar configuração
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => saveCredentials(provider.config.id)}
                    isLoading={busyKey === `credential:${provider.config.id}`}
                  >
                    Salvar chave
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => clearCredentials(provider.config.id)}
                    isLoading={busyKey === `credential:${provider.config.id}`}
                    disabled={!provider.secret.hasKey}
                  >
                    Remover chave
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => runHealthCheck(provider.config.id)}
                    isLoading={busyKey === `test:${provider.config.id}`}
                  >
                    Testar conexão
                  </Button>
                </div>

                <div className="rounded-xl border border-[#1d1d1d] bg-black/20 px-4 py-3 text-xs text-gray-400">
                  {providerHealth.message}
                  {providerHealth.checkedAt && (
                    <span className="block mt-2 text-[10px] text-gray-600">Último teste: {providerHealth.checkedAt}</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      <Card className="border-border bg-[#0A0A0A]">
        <div className="flex items-center gap-3 mb-6">
          <Sparkles size={18} className="text-primary" />
          <div>
            <h3 className="text-lg text-white font-bold">Prompts dos Agentes</h3>
            <p className="text-sm text-gray-500">Salve os prompts que governam linhas editoriais, calendário e criação de conteúdo por formato.</p>
          </div>
        </div>

        <div className="space-y-6">
          {promptGroups.map(([group, templates]) => (
            <div key={group} className="rounded-2xl border border-[#222] bg-[#111] p-5">
              <div className="mb-4">
                <h4 className="text-white font-semibold">{promptGroupLabels[group]}</h4>
                <p className="text-xs text-gray-500 mt-1 uppercase tracking-[0.2em]">{group}</p>
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                {templates.map((template) => (
                  <div key={template.id} className="rounded-xl border border-[#222] bg-[#141414] p-4 space-y-3">
                    <div>
                      <h5 className="text-sm font-semibold text-white">{template.label}</h5>
                      <p className="text-xs text-gray-500 mt-1 leading-relaxed">{template.description}</p>
                    </div>
                    <textarea
                      value={promptInputs[template.id] ?? template.prompt}
                      onChange={(event) => setPromptInputs((current) => ({ ...current, [template.id]: event.target.value }))}
                      className="w-full min-h-[180px] bg-[#101010] border border-[#222] rounded-xl p-3 text-sm text-gray-200 focus:border-primary focus:outline-none resize-y"
                    />
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-[10px] text-gray-600 uppercase tracking-[0.2em]">Atualizado em {template.updatedAt}</span>
                      <Button
                        variant="secondary"
                        onClick={() => savePromptTemplate(template.id)}
                        isLoading={busyKey === `prompt:${template.id}`}
                      >
                        Salvar prompt
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card className="border-border bg-[#0A0A0A]">
        <div className="flex items-center gap-3 mb-6">
          <Sparkles size={18} className="text-orange-400" />
          <div>
            <h3 className="text-lg text-white font-bold">Roteamento por Capacidade</h3>
            <p className="text-sm text-gray-500">Defina o provider primário e a cadeia de fallback para cada tipo de tarefa.</p>
          </div>
        </div>

        <div className="space-y-4">
          {routing.map((policy) => {
            const eligibleProviders = providers.filter((provider) => provider.config.capabilities[policy.capability]);

            return (
              <div key={policy.capability} className="rounded-2xl border border-[#222] bg-[#111] p-5">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  <div>
                    <h4 className="text-white font-semibold">{capabilityLabels[policy.capability]}</h4>
                    <p className="text-xs text-gray-500 mt-1 uppercase tracking-[0.2em]">{policy.capability}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {policy.fallbackOrder.map((providerId) => (
                      <Badge key={providerId} color="neutral" variant="soft">{providerId}</Badge>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr_auto] gap-4 mt-5">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-[0.2em] text-gray-500 mb-2">Primário</label>
                    <select
                      value={policy.primaryProvider || ''}
                      onChange={(event) => setRouting((current) => current.map((item) => item.capability === policy.capability ? {
                        ...item,
                        primaryProvider: (event.target.value || null) as AIProviderId | null,
                        fallbackOrder: item.fallbackOrder.filter((providerId) => providerId !== event.target.value),
                      } : item))}
                      className="w-full bg-[#141414] border border-[#222] rounded-xl p-3 text-sm text-gray-200 focus:border-primary focus:outline-none"
                    >
                      <option value="">Sem provider</option>
                      {eligibleProviders.map((provider) => (
                        <option key={provider.config.id} value={provider.config.id}>{provider.config.label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-[0.2em] text-gray-500 mb-2">Fallback</label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {eligibleProviders
                        .filter((provider) => provider.config.id !== policy.primaryProvider)
                        .map((provider) => (
                          <label key={provider.config.id} className="flex items-center gap-3 rounded-xl border border-[#222] bg-[#141414] px-3 py-2 text-sm text-gray-300">
                            <input
                              type="checkbox"
                              checked={policy.fallbackOrder.includes(provider.config.id)}
                              onChange={(event) => setRouting((current) => current.map((item) => {
                                if (item.capability !== policy.capability) return item;

                                const nextFallback = event.target.checked
                                  ? [...item.fallbackOrder, provider.config.id]
                                  : item.fallbackOrder.filter((providerId) => providerId !== provider.config.id);

                                return { ...item, fallbackOrder: nextFallback };
                              }))}
                              className="accent-primary"
                            />
                            <span>{provider.config.label}</span>
                          </label>
                        ))}
                    </div>
                  </div>

                  <div className="flex items-end">
                    <Button
                      variant="primary"
                      onClick={() => updateRouting(policy.capability, policy)}
                      isLoading={busyKey === `routing:${policy.capability}`}
                    >
                      Salvar rota
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {isLoading && (
        <div className="rounded-2xl border border-[#222] bg-[#111] px-4 py-3 text-sm text-gray-400">
          Carregando configuração de provedores...
        </div>
      )}

      {!isLoading && providers.length === 0 && (
        <div className="rounded-2xl border border-[#222] bg-[#111] px-4 py-3 text-sm text-gray-400">
          Nenhum provider configurado ainda.
        </div>
      )}
    </div>
  );
};

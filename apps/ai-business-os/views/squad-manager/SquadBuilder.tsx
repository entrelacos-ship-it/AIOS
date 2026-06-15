import React, { useEffect, useState } from 'react';
import { ArrowLeft, Plus, Trash2, ChevronUp, ChevronDown, Loader2, Save, Sparkles } from 'lucide-react';
import type { SquadAgent } from '../../types';
import { View } from '../../types';

interface Props {
  squadId?: string;
  onNavigate: (view: View) => void;
}

type AgentForm = Omit<SquadAgent, 'id'>;

const AGENT_COLORS = ['#06b6d4', '#8b5cf6', '#10b981', '#f59e0b', '#ec4899', '#f97316', '#6366f1'];
const MODEL_OPTIONS = [
  { value: 'claude-sonnet-4-6', label: 'Claude Sonnet 4.6' },
  { value: 'claude-opus-4-7', label: 'Claude Opus 4.7' },
  { value: 'claude-haiku-4-5-20251001', label: 'Claude Haiku 4.5' },
];

const CAPABILITY_OPTIONS = [
  { value: 'structured_text', label: 'Texto Estruturado' },
  { value: 'creative_text', label: 'Texto Criativo' },
  { value: 'analysis', label: 'Análise' },
  { value: 'coding', label: 'Código' },
];

const ROLE_PRESETS = [
  { name: 'Pesquisador', role: 'Pesquisador', systemPrompt: 'Você é um pesquisador especializado. Sua função é coletar, organizar e sintetizar informações relevantes sobre o tema dado. Seja preciso, cite fatos verificáveis e organize o conteúdo em seções claras.', color: '#06b6d4', capability: 'analysis' },
  { name: 'Estrategista', role: 'Estrategista', systemPrompt: 'Você é um estrategista sênior. Analise as informações fornecidas e desenvolva uma estratégia clara com objetivos, táticas e indicadores de sucesso. Seja direto e prático.', color: '#8b5cf6', capability: 'structured_text' },
  { name: 'Copywriter', role: 'Copywriter', systemPrompt: 'Você é um copywriter experiente. Crie textos persuasivos, envolventes e alinhados ao objetivo dado. Adapte o tom de voz ao contexto e ao público-alvo.', color: '#10b981', capability: 'creative_text' },
  { name: 'Revisor', role: 'Revisor', systemPrompt: 'Você é um editor e revisor crítico. Analise o conteúdo produzido nas etapas anteriores, identifique inconsistências, erros e oportunidades de melhoria. Dê feedback específico e construtivo.', color: '#f59e0b', capability: 'analysis' },
  { name: 'Designer de Conteúdo', role: 'Designer de Conteúdo', systemPrompt: 'Você é um designer de conteúdo. Transforme as informações em formatos visuais, estruture o conteúdo para publicação, defina hierarquia visual e sugira formatos ideais para cada plataforma.', color: '#ec4899', capability: 'creative_text' },
];

const emptyAgent = (idx: number): AgentForm => ({
  name: '',
  role: '',
  systemPrompt: '',
  model: 'claude-sonnet-4-6',
  capability: 'structured_text',
  color: AGENT_COLORS[idx % AGENT_COLORS.length]!,
});

export const SquadBuilder: React.FC<Props> = ({ squadId, onNavigate }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [agents, setAgents] = useState<AgentForm[]>([emptyAgent(0), emptyAgent(1)]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!squadId) return;
    setLoading(true);
    fetch(`/api/squads/${squadId}`)
      .then((r) => r.json())
      .then((squad) => {
        setName(squad.name ?? '');
        setDescription(squad.description ?? '');
        setAgents(squad.agents?.map((a: SquadAgent) => ({
          name: a.name, role: a.role, systemPrompt: a.systemPrompt,
          model: a.model, capability: a.capability, color: a.color,
        })) ?? []);
      })
      .finally(() => setLoading(false));
  }, [squadId]);

  const addAgent = () => setAgents((prev) => [...prev, emptyAgent(prev.length)]);

  const removeAgent = (i: number) =>
    setAgents((prev) => prev.filter((_, idx) => idx !== i));

  const moveAgent = (i: number, dir: -1 | 1) => {
    setAgents((prev) => {
      const next = [...prev];
      const j = i + dir;
      if (j < 0 || j >= next.length) return prev;
      [next[i], next[j]] = [next[j]!, next[i]!];
      return next;
    });
  };

  const updateAgent = (i: number, patch: Partial<AgentForm>) =>
    setAgents((prev) => prev.map((a, idx) => idx === i ? { ...a, ...patch } : a));

  const applyPreset = (i: number, preset: typeof ROLE_PRESETS[0]) => {
    updateAgent(i, {
      name: preset.name,
      role: preset.role,
      systemPrompt: preset.systemPrompt,
      color: preset.color,
      capability: preset.capability as AgentForm['capability'],
    });
  };

  const handleSave = async () => {
    setError(null);
    if (!name.trim()) { setError('Nome do squad é obrigatório.'); return; }
    if (agents.length === 0) { setError('Adicione pelo menos um agente.'); return; }
    for (const a of agents) {
      if (!a.name.trim() || !a.role.trim() || !a.systemPrompt.trim()) {
        setError('Preencha nome, papel e prompt de todos os agentes.'); return;
      }
    }
    setSaving(true);
    try {
      const url = squadId ? `/api/squads/${squadId}` : '/api/squads';
      const method = squadId ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description, agents }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || 'Erro ao salvar.');
      }
      onNavigate(View.SQUAD_MANAGER);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao salvar.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 text-cyan-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl space-y-8">
      <div className="flex items-center gap-4">
        <button onClick={() => onNavigate(View.SQUAD_MANAGER)} className="text-gray-500 hover:text-gray-300 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-2xl font-bold text-white">{squadId ? 'Editar Squad' : 'Novo Squad'}</h1>
        {!squadId && (
          <button
            onClick={() => onNavigate(View.SQUAD_MANAGER_AI_WIZARD)}
            className="ml-auto flex items-center gap-2 px-4 py-2 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 text-sm font-medium transition-colors"
          >
            <Sparkles size={15} />
            Criar com IA
          </button>
        )}
      </div>

      {/* Name + description */}
      <div className="bg-[#0d0d0d] border border-[#1a1a1a] rounded-xl p-6 space-y-4">
        <div>
          <label className="text-xs font-medium text-gray-400 block mb-1.5">Nome do Squad</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex: Squad de Conteúdo de Redes Sociais"
            className="w-full bg-[#111] border border-[#222] rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-cyan-500/50 transition-colors"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-gray-400 block mb-1.5">Descrição</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Descreva o objetivo e o fluxo deste squad..."
            rows={2}
            className="w-full bg-[#111] border border-[#222] rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-cyan-500/50 transition-colors resize-none"
          />
        </div>
      </div>

      {/* Agents */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold text-gray-600 uppercase tracking-widest">
            Agentes — Pipeline sequencial ({agents.length})
          </h2>
          <button
            onClick={addAgent}
            className="flex items-center gap-1.5 text-xs text-cyan-400 hover:text-cyan-300 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Adicionar agente
          </button>
        </div>

        {agents.map((agent, i) => (
          <div
            key={i}
            className="bg-[#0d0d0d] border border-[#1a1a1a] rounded-xl p-5 space-y-4"
            style={{ borderLeftColor: agent.color, borderLeftWidth: 3 }}
          >
            {/* Agent header */}
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-bold text-gray-600 uppercase tracking-wider w-6 text-center">{i + 1}</span>
              <div className="flex-1 grid grid-cols-2 gap-3">
                <input
                  value={agent.name}
                  onChange={(e) => updateAgent(i, { name: e.target.value })}
                  placeholder="Nome (ex: Pesquisador)"
                  className="bg-[#111] border border-[#222] rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-cyan-500/50"
                />
                <input
                  value={agent.role}
                  onChange={(e) => updateAgent(i, { role: e.target.value })}
                  placeholder="Papel (ex: Analista de dados)"
                  className="bg-[#111] border border-[#222] rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-cyan-500/50"
                />
              </div>
              <div className="flex gap-1">
                <button onClick={() => moveAgent(i, -1)} disabled={i === 0} className="p-1 text-gray-600 hover:text-gray-300 disabled:opacity-20 transition-colors">
                  <ChevronUp className="w-4 h-4" />
                </button>
                <button onClick={() => moveAgent(i, 1)} disabled={i === agents.length - 1} className="p-1 text-gray-600 hover:text-gray-300 disabled:opacity-20 transition-colors">
                  <ChevronDown className="w-4 h-4" />
                </button>
                <button onClick={() => removeAgent(i)} disabled={agents.length === 1} className="p-1 text-gray-600 hover:text-red-400 disabled:opacity-20 transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Presets */}
            <div className="flex flex-wrap gap-1.5">
              {ROLE_PRESETS.map((p) => (
                <button
                  key={p.name}
                  onClick={() => applyPreset(i, p)}
                  className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 hover:bg-white/10 text-gray-400 hover:text-gray-200 transition-colors border border-[#222]"
                >
                  {p.name}
                </button>
              ))}
            </div>

            {/* System prompt */}
            <div>
              <label className="text-[10px] font-medium text-gray-500 block mb-1">System Prompt</label>
              <textarea
                value={agent.systemPrompt}
                onChange={(e) => updateAgent(i, { systemPrompt: e.target.value })}
                placeholder="Defina o comportamento, expertise e responsabilidades deste agente..."
                rows={4}
                className="w-full bg-[#111] border border-[#222] rounded-lg px-3 py-2.5 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-cyan-500/50 resize-none font-mono leading-relaxed"
              />
            </div>

            {/* Model + capability */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-medium text-gray-500 block mb-1">Modelo</label>
                <select
                  value={agent.model}
                  onChange={(e) => updateAgent(i, { model: e.target.value })}
                  className="w-full bg-[#111] border border-[#222] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500/50"
                >
                  {MODEL_OPTIONS.map((m) => (
                    <option key={m.value} value={m.value}>{m.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[10px] font-medium text-gray-500 block mb-1">Cor</label>
                <div className="flex gap-2 items-center h-9">
                  {AGENT_COLORS.map((c) => (
                    <button
                      key={c}
                      onClick={() => updateAgent(i, { color: c })}
                      className={`w-5 h-5 rounded-full transition-transform ${agent.color === c ? 'scale-125 ring-2 ring-white/30' : 'opacity-50 hover:opacity-100'}`}
                      style={{ background: c }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Error */}
      {error && (
        <div className="text-red-400 text-xs bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3">
          {error}
        </div>
      )}

      {/* Save */}
      <div className="flex gap-3">
        <button
          onClick={() => onNavigate(View.SQUAD_MANAGER)}
          className="px-4 py-2.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 text-sm transition-colors"
        >
          Cancelar
        </button>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 text-white text-sm font-medium transition-colors"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {saving ? 'Salvando...' : 'Salvar Squad'}
        </button>
      </div>
    </div>
  );
};

import React, { useEffect, useRef, useState } from 'react';
import {
  ArrowLeft,
  Bot,
  ChevronDown,
  ChevronUp,
  Loader2,
  RefreshCw,
  Save,
  Send,
  Sparkles,
  User,
} from 'lucide-react';
import type { SquadAgent } from '../../types';

function renderMarkdown(text: string): React.ReactNode[] {
  const lines = text.split('\n');
  const nodes: React.ReactNode[] = [];
  let listItems: string[] = [];
  let key = 0;

  const flushList = () => {
    if (listItems.length === 0) return;
    nodes.push(
      <ul key={key++} className="list-none space-y-1 my-1">
        {listItems.map((item, i) => (
          <li key={i} className="flex items-start gap-2 text-sm">
            <span className="text-cyan-400 mt-0.5 flex-shrink-0">•</span>
            <span>{applyInline(item)}</span>
          </li>
        ))}
      </ul>,
    );
    listItems = [];
  };

  const applyInline = (raw: string): React.ReactNode[] => {
    const parts = raw.split(/(\*\*[^*]+\*\*)/g);
    return parts.map((p, i) =>
      p.startsWith('**') && p.endsWith('**')
        ? <strong key={i} className="font-semibold text-white">{p.slice(2, -2)}</strong>
        : <span key={i}>{p}</span>,
    );
  };

  for (const line of lines) {
    const bulletMatch = line.match(/^[\-\*]\s+(.+)/);
    const numberedMatch = line.match(/^\d+\.\s+(.+)/);

    if (bulletMatch || numberedMatch) {
      listItems.push((bulletMatch ?? numberedMatch)![1]!);
      continue;
    }

    flushList();

    if (line.trim() === '') {
      nodes.push(<div key={key++} className="h-1" />);
    } else {
      nodes.push(
        <p key={key++} className="text-sm leading-relaxed">{applyInline(line)}</p>,
      );
    }
  }

  flushList();
  return nodes;
}

interface Props {
  onSquadCreated: () => void;
  onBack: () => void;
}

type WizardPhase = 'intro' | 'conversation' | 'generating' | 'review';

interface Message {
  role: 'assistant' | 'user';
  content: string;
}

interface GeneratedSquad {
  name: string;
  description: string;
  agents: SquadAgent[];
}

const READY_MARKER = '[PRONTO]';

const CONVERSATION_SYSTEM = `Você é um Arquiteto de Squads de IA — especialista em montar equipes de agentes para automação de processos de negócio. Seu estilo: direto, estruturado, uma pergunta por vez.

## Fluxo de discovery (máx. 4 perguntas)

**Passo 1 — Objetivo (sempre primeiro)**
Pergunte o que o squad deve produzir ou resolver. Aguarde a resposta.

**Passo 2 — Sugestão imediata de agentes**
Com base no objetivo, sugira imediatamente uma estrutura de agentes usando o pipeline mais adequado ao domínio. Use arquétipos reconhecidos do mercado, adaptados ao contexto:

Exemplos de pipelines por domínio:
- Conteúdo Instagram: Pesquisador de Tendências → Idealizador de Pautas → Redator/Roteirista → Designer de Slides → Revisor → Publicador
- Conteúdo YouTube: Pesquisador → Roteirista → Editor de Script → Revisor → Thumbnail Creator
- Conteúdo LinkedIn: Pesquisador de Mercado → Estrategista → Copywriter → Revisor
- E-mail marketing: Estrategista → Copywriter → Revisor de Conversão → QA
- Análise de dados: Coletor de Dados → Analista → Gerador de Relatório → Revisor
- Atendimento: Triador → Especialista → Escalador → QA de Qualidade

Apresente a sugestão como: "Para [objetivo], recomendo este pipeline:
1. [Agente] — [função em uma frase]
2. [Agente] — [função em uma frase]
...
Posso ajustar, adicionar ou remover agentes. O que você quer mudar?"

**Passo 3 — Contexto de especialização (se necessário)**
Pergunte sobre: nicho/tema, tom de voz, plataforma específica, público-alvo. Só o que for essencial para especializar os system prompts.

**Passo 4 — Confirmação e geração**
Quando o usuário confirmar a estrutura (ou após 3-4 trocas), resuma o que foi acordado e encerre com exatamente: ${READY_MARKER}

## Regras
- Nunca faça mais de uma pergunta por mensagem
- Não mencione o marcador [PRONTO] antes de realmente usá-lo
- Sempre sugira agentes específicos ao domínio — nunca genéricos
- Todo pipeline deve ter pelo menos um agente Revisor`;

const GENERATION_SYSTEM = `Você é um Arquiteto de Squads de IA. Gere um squad completo em JSON puro (sem markdown fences, sem texto extra) com esta estrutura:
{
  "name": "string — nome curto e descritivo do squad",
  "description": "string — 1-2 frases sobre o propósito e pipeline do squad",
  "agents": [
    {
      "id": "string — snake_case único, ex: pesquisador_tendencias",
      "name": "string — nome próprio do agente com papel, ex: 'Pedro Pesquisa — Pesquisador de Tendências'",
      "role": "string — papel em uma frase curta, ex: 'Identifica o que está em alta e entrega um briefing estruturado'",
      "systemPrompt": "string — system prompt completo em português do Brasil com esta estrutura:\n## Persona\nQuem você é, sua especialidade e identidade profissional (2-3 frases)\n\n## Missão neste pipeline\nO que você recebe como input (output do agente anterior ou tarefa inicial), o que deve produzir, e o formato exato de entrega\n\n## Princípios\n3-5 regras que guiam seu trabalho neste contexto específico\n\n## Vocabulário\nPalavras/expressões que você SEMPRE usa e que NUNCA usa\n\n## Anti-patterns\nO que você jamais faz neste papel",
      "model": "claude-sonnet-4-6",
      "capability": "text_generation",
      "color": "#06b6d4"
    }
  ]
}

Regras de qualidade:
- 3 a 6 agentes cobrindo o pipeline completo (pesquisa → criação → revisão → entrega)
- Todo squad DEVE ter um agente Revisor como penúltimo ou último agente
- Cada agente deve saber explicitamente o que recebe do agente anterior e o que entrega ao próximo
- system prompts com 200-500 palavras — específicos ao nicho, plataforma e tom de voz acordados
- Nomes de agentes com persona própria (ex: "Marina Estratégia", "Carlos Criativo") — não nomes genéricos

Regras técnicas:
- model: "claude-haiku-4-5-20251001" para pesquisa/revisão simples, "claude-sonnet-4-6" para criação e análise
- capability: "text_generation" para texto livre, "structured_text" para roteiros/listas, "analysis" para análise, "creative_text" para copywriting, "coding" para código
- color: varie entre #06b6d4, #8b5cf6, #10b981, #f59e0b, #ec4899, #f97316, #6366f1 (sem repetir cor em agentes adjacentes)
- Responda APENAS com o JSON válido, sem nenhum texto antes ou depois`;

const GENERATING_MESSAGES = [
  'Definindo papéis e responsabilidades...',
  'Escrevendo system prompts especializados...',
  'Ajustando modelos e capacidades...',
  'Finalizando estrutura do squad...',
];

async function chatWithAI(
  messages: { role: string; content: string }[],
  _opts?: { maxTokens?: number; temperature?: number },
): Promise<string> {
  // Extrai system message (Claude CLI aceita system separado)
  const systemMsg = messages.find((m) => m.role === 'system')?.content;
  const conversation = messages.filter((m) => m.role !== 'system');

  const res = await fetch('/api/ai/claude-cli/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      system: systemMsg,
      messages: conversation,
    }),
  });
  if (!res.ok) throw new Error(`Claude CLI error: ${res.status}`);
  const data = (await res.json()) as { content?: string; error?: string };
  if (data.error) throw new Error(data.error);
  if (!data.content) throw new Error('Claude CLI returned empty response');
  return data.content;
}

async function generateSquadFromHistory(history: Message[]): Promise<GeneratedSquad> {
  const content = await chatWithAI(
    [
      { role: 'system', content: GENERATION_SYSTEM },
      ...history,
      { role: 'user', content: 'Gere o squad agora em JSON puro.' },
    ],
    { maxTokens: 3500, temperature: 0.7 },
  );

  const json = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  const parsed = JSON.parse(json) as GeneratedSquad;
  parsed.agents = parsed.agents.map((a, i) => ({ ...a, id: a.id || `agent_${i}_${Date.now()}` }));
  return parsed;
}

export const SquadAIWizard: React.FC<Props> = ({ onSquadCreated, onBack }) => {
  const [phase, setPhase] = useState<WizardPhase>('intro');
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isAiTyping, setIsAiTyping] = useState(false);
  const [generatingMsg, setGeneratingMsg] = useState(GENERATING_MESSAGES[0]!);
  const [squad, setSquad] = useState<GeneratedSquad | null>(null);
  const [expandedAgent, setExpandedAgent] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isAiTyping]);

  useEffect(() => {
    if (phase !== 'generating') return;
    let idx = 0;
    const interval = setInterval(() => {
      idx = (idx + 1) % GENERATING_MESSAGES.length;
      setGeneratingMsg(GENERATING_MESSAGES[idx]!);
    }, 1800);
    return () => clearInterval(interval);
  }, [phase]);

  const startConversation = async () => {
    setPhase('conversation');
    setIsAiTyping(true);
    try {
      const opening = await chatWithAI([
        { role: 'system', content: CONVERSATION_SYSTEM },
        { role: 'user', content: 'Olá, quero criar um novo squad.' },
      ]);
      setMessages([{ role: 'assistant', content: opening }]);
    } catch {
      setMessages([{ role: 'assistant', content: 'Qual é o objetivo principal deste squad? O que ele deve produzir ou resolver?' }]);
    } finally {
      setIsAiTyping(false);
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || isAiTyping) return;
    const userText = input.trim();
    setInput('');

    const updatedHistory: Message[] = [...messages, { role: 'user', content: userText }];
    setMessages(updatedHistory);
    setIsAiTyping(true);
    setError(null);

    try {
      const aiResponse = await chatWithAI([
        { role: 'system', content: CONVERSATION_SYSTEM },
        ...updatedHistory,
      ]);

      const hasReady = aiResponse.includes(READY_MARKER);
      const cleanResponse = aiResponse.replace(READY_MARKER, '').trim();

      const finalHistory: Message[] = [...updatedHistory, { role: 'assistant', content: cleanResponse }];
      setMessages(finalHistory);
      setIsAiTyping(false);

      if (hasReady) {
        setTimeout(() => runGeneration(finalHistory), 700);
      }
    } catch (e) {
      setIsAiTyping(false);
      setError(e instanceof Error ? e.message : 'Erro ao comunicar com a IA.');
    }
  };

  const runGeneration = async (history: Message[]) => {
    setPhase('generating');
    setError(null);
    try {
      const generated = await generateSquadFromHistory(history);
      setSquad(generated);
      setPhase('review');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao gerar squad.');
      setPhase('conversation');
    }
  };

  const handleRegenerate = () => {
    const convoHistory = messages.filter(
      (m) => !(m.role === 'assistant' && m.content.startsWith('Entendido!')),
    );
    void runGeneration(convoHistory);
  };

  const handleSave = async () => {
    if (!squad) return;
    setIsSaving(true);
    setSaveError(null);
    try {
      const res = await fetch('/api/squads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(squad),
      });
      if (!res.ok) {
        const d = (await res.json()) as { error?: string };
        throw new Error(d.error ?? 'Erro ao salvar squad.');
      }
      onSquadCreated();
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : 'Erro ao salvar.');
    } finally {
      setIsSaving(false);
    }
  };

  // ── Intro ──────────────────────────────────────────────────────────────────
  if (phase === 'intro') {
    return (
      <div className="max-w-2xl mx-auto flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <div className="w-16 h-16 rounded-2xl bg-cyan-500/15 border border-cyan-500/20 flex items-center justify-center mb-6">
          <Sparkles className="w-8 h-8 text-cyan-400" />
        </div>
        <h1 className="text-2xl font-bold text-white mb-3">Criar Squad com IA</h1>
        <p className="text-gray-400 text-sm mb-2 leading-relaxed max-w-md">
          Converse com a IA e ela monta o squad para você — fazendo as perguntas certas até ter tudo que precisa.
        </p>
        <p className="text-gray-600 text-xs mb-10">A IA guia a conversa. Você só responde.</p>
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="px-4 py-2.5 rounded-lg border border-[#222] text-gray-400 hover:text-gray-200 text-sm transition-colors"
          >
            Criar manualmente
          </button>
          <button
            onClick={() => void startConversation()}
            className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-medium text-sm transition-colors"
          >
            <Sparkles size={15} />
            Começar conversa
          </button>
        </div>
      </div>
    );
  }

  // ── Generating ─────────────────────────────────────────────────────────────
  if (phase === 'generating') {
    return (
      <div className="max-w-2xl mx-auto flex flex-col items-center justify-center min-h-[60vh] text-center gap-5">
        <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
          <Loader2 className="w-7 h-7 text-cyan-400 animate-spin" />
        </div>
        <div>
          <p className="text-white font-medium mb-1.5">{generatingMsg}</p>
          <p className="text-gray-600 text-xs">A IA está construindo seu squad...</p>
        </div>
        {error && (
          <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-2.5">
            {error}
          </p>
        )}
      </div>
    );
  }

  // ── Review ─────────────────────────────────────────────────────────────────
  if (phase === 'review' && squad) {
    return (
      <div className="max-w-3xl space-y-6">
        <div className="flex items-center gap-4">
          <button onClick={() => setPhase('conversation')} className="text-gray-500 hover:text-gray-300 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl font-bold text-white">Revisar Squad Gerado</h1>
          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={handleRegenerate}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-[#222] text-gray-400 hover:text-gray-200 text-xs transition-colors"
            >
              <RefreshCw size={13} />
              Regenerar
            </button>
            <button
              onClick={() => void handleSave()}
              disabled={isSaving}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-medium transition-colors disabled:opacity-50"
            >
              {isSaving ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
              Salvar Squad
            </button>
          </div>
        </div>

        {saveError && (
          <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-2.5">
            {saveError}
          </p>
        )}

        <div className="bg-[#0d0d0d] border border-[#1a1a1a] rounded-xl p-5 space-y-4">
          <div>
            <label className="text-[10px] font-medium text-gray-500 uppercase tracking-wider block mb-1.5">Nome</label>
            <input
              value={squad.name}
              onChange={(e) => setSquad({ ...squad, name: e.target.value })}
              className="w-full bg-transparent border-b border-[#2a2a2a] focus:border-cyan-500/60 py-1.5 text-white text-lg font-semibold focus:outline-none transition-colors"
            />
          </div>
          <div>
            <label className="text-[10px] font-medium text-gray-500 uppercase tracking-wider block mb-1.5">Descrição</label>
            <textarea
              value={squad.description}
              onChange={(e) => setSquad({ ...squad, description: e.target.value })}
              rows={2}
              className="w-full bg-[#111] border border-[#222] rounded-lg px-3 py-2 text-sm text-gray-300 focus:outline-none focus:border-cyan-500/40 resize-none transition-colors"
            />
          </div>
        </div>

        <div className="space-y-3">
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Agentes ({squad.agents.length})
          </h2>
          {squad.agents.map((agent, i) => (
            <div key={agent.id} className="bg-[#0d0d0d] border border-[#1a1a1a] rounded-xl overflow-hidden">
              <button
                onClick={() => setExpandedAgent(expandedAgent === i ? null : i)}
                className="w-full flex items-center gap-3 p-4 text-left hover:bg-white/[0.02] transition-colors"
              >
                <div
                  className="w-8 h-8 rounded-lg flex-shrink-0 flex items-center justify-center text-xs font-bold text-white"
                  style={{ backgroundColor: agent.color + '33', border: `1px solid ${agent.color}40` }}
                >
                  <span style={{ color: agent.color }}>{agent.name.charAt(0).toUpperCase()}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-white">{agent.name}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#1a1a1a] text-gray-500">{agent.role}</span>
                  </div>
                  <p className="text-xs text-gray-600 mt-0.5">{agent.model}</p>
                </div>
                {expandedAgent === i
                  ? <ChevronUp size={14} className="text-gray-600 flex-shrink-0" />
                  : <ChevronDown size={14} className="text-gray-600 flex-shrink-0" />
                }
              </button>

              {expandedAgent === i && (
                <div className="px-4 pb-4 pt-0 space-y-3 border-t border-[#1a1a1a]">
                  <div className="pt-3">
                    <label className="text-[10px] font-medium text-gray-600 uppercase tracking-wider block mb-1.5">System Prompt</label>
                    <textarea
                      value={agent.systemPrompt}
                      onChange={(e) => {
                        const updated = squad.agents.map((a, idx) =>
                          idx === i ? { ...a, systemPrompt: e.target.value } : a,
                        );
                        setSquad({ ...squad, agents: updated });
                      }}
                      rows={6}
                      className="w-full bg-[#111] border border-[#222] rounded-lg px-3 py-2.5 text-xs text-gray-300 focus:outline-none focus:border-cyan-500/40 resize-none font-mono leading-relaxed transition-colors"
                    />
                  </div>
                  <div className="flex gap-3">
                    <div className="flex-1">
                      <label className="text-[10px] font-medium text-gray-600 uppercase tracking-wider block mb-1.5">Modelo</label>
                      <select
                        value={agent.model}
                        onChange={(e) => {
                          const updated = squad.agents.map((a, idx) =>
                            idx === i ? { ...a, model: e.target.value } : a,
                          );
                          setSquad({ ...squad, agents: updated });
                        }}
                        className="w-full bg-[#111] border border-[#222] rounded-lg px-3 py-2 text-xs text-gray-300 focus:outline-none focus:border-cyan-500/40 transition-colors"
                      >
                        <option value="claude-sonnet-4-6">Claude Sonnet 4.6</option>
                        <option value="claude-haiku-4-5-20251001">Claude Haiku 4.5</option>
                        <option value="claude-opus-4-6">Claude Opus 4.6</option>
                      </select>
                    </div>
                    <div className="flex-1">
                      <label className="text-[10px] font-medium text-gray-600 uppercase tracking-wider block mb-1.5">Capacidade</label>
                      <select
                        value={agent.capability}
                        onChange={(e) => {
                          const updated = squad.agents.map((a, idx) =>
                            idx === i ? { ...a, capability: e.target.value as SquadAgent['capability'] } : a,
                          );
                          setSquad({ ...squad, agents: updated });
                        }}
                        className="w-full bg-[#111] border border-[#222] rounded-lg px-3 py-2 text-xs text-gray-300 focus:outline-none focus:border-cyan-500/40 transition-colors"
                      >
                        <option value="text_generation">Geração de Texto</option>
                        <option value="structured_text">Texto Estruturado</option>
                        <option value="analysis">Análise</option>
                        <option value="creative_text">Texto Criativo</option>
                        <option value="coding">Código</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ── Conversation ───────────────────────────────────────────────────────────
  const exchangeCount = messages.filter((m) => m.role === 'user').length;

  return (
    <div className="max-w-2xl mx-auto flex flex-col h-[calc(100vh-180px)]">
      <div className="flex items-center gap-3 mb-4 flex-shrink-0">
        <button onClick={onBack} className="text-gray-500 hover:text-gray-300 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2">
          <Sparkles size={16} className="text-cyan-400" />
          <span className="text-sm font-medium text-white">Criar Squad com IA</span>
        </div>
        <div className="ml-auto flex items-center gap-2 text-xs text-gray-600">
          {exchangeCount > 0 && (
            <span>{exchangeCount} resposta{exchangeCount !== 1 ? 's' : ''}</span>
          )}
          <div className="flex items-center gap-1">
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className={`w-1.5 h-1.5 rounded-full transition-colors ${
                  i < Math.min(exchangeCount, 4) ? 'bg-cyan-400' : 'bg-[#2a2a2a]'
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-3 flex-shrink-0 text-red-400 text-xs bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
          {error}
        </div>
      )}

      <div className="flex-1 overflow-y-auto space-y-4 pb-4 pr-1">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex items-start gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
          >
            <div
              className={`w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center ${
                msg.role === 'assistant'
                  ? 'bg-cyan-500/20 border border-cyan-500/30'
                  : 'bg-[#1a1a1a] border border-[#2a2a2a]'
              }`}
            >
              {msg.role === 'assistant'
                ? <Bot size={14} className="text-cyan-400" />
                : <User size={14} className="text-gray-400" />
              }
            </div>
            <div
              className={`max-w-[80%] px-4 py-3 rounded-2xl ${
                msg.role === 'assistant'
                  ? 'bg-[#0d0d0d] border border-[#1a1a1a] text-gray-300 rounded-tl-sm'
                  : 'bg-cyan-600/20 border border-cyan-500/20 text-cyan-100 rounded-tr-sm text-sm leading-relaxed'
              }`}
            >
              {msg.role === 'assistant' ? renderMarkdown(msg.content) : msg.content}
            </div>
          </div>
        ))}

        {isAiTyping && (
          <div className="flex items-start gap-3">
            <div className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center bg-cyan-500/20 border border-cyan-500/30">
              <Bot size={14} className="text-cyan-400" />
            </div>
            <div className="bg-[#0d0d0d] border border-[#1a1a1a] rounded-2xl rounded-tl-sm px-4 py-3">
              <div className="flex gap-1 items-center h-4">
                <span className="w-1.5 h-1.5 bg-gray-600 rounded-full animate-bounce [animation-delay:0ms]" />
                <span className="w-1.5 h-1.5 bg-gray-600 rounded-full animate-bounce [animation-delay:150ms]" />
                <span className="w-1.5 h-1.5 bg-gray-600 rounded-full animate-bounce [animation-delay:300ms]" />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="flex-shrink-0 pt-3 border-t border-[#1a1a1a]">
        <div className="flex items-end gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                void sendMessage();
              }
            }}
            placeholder="Digite sua resposta..."
            rows={2}
            disabled={isAiTyping}
            className="flex-1 bg-[#0d0d0d] border border-[#1a1a1a] focus:border-cyan-500/40 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none resize-none transition-colors disabled:opacity-40"
          />
          <button
            onClick={() => void sendMessage()}
            disabled={!input.trim() || isAiTyping}
            className="flex-shrink-0 w-10 h-10 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white flex items-center justify-center transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Send size={16} />
          </button>
        </div>
        <p className="text-[10px] text-gray-700 mt-1.5 ml-1">Enter para enviar · Shift+Enter para nova linha</p>
      </div>
    </div>
  );
};

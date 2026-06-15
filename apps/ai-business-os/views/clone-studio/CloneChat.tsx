import React, { useEffect, useRef, useState } from 'react';
import {
  ArrowLeft, Send, Plus, Trash2, MessageCircle,
  Loader2, Brain, ChevronRight,
} from 'lucide-react';
import type { CloneRecord, CloneConversation, CloneMessage } from '../../types';
import { View } from '../../types';

interface Props {
  cloneId: string;
  onNavigate: (view: View) => void;
}

function parseSse(raw: string): Array<{ event: string; data: unknown }> {
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
      try { out.push({ event, data: JSON.parse(dataStr) }); }
      catch { /* skip */ }
    }
  }
  return out;
}

export const CloneChat: React.FC<Props> = ({ cloneId, onNavigate }) => {
  const [clone, setClone] = useState<CloneRecord | null>(null);
  const [conversations, setConversations] = useState<CloneConversation[]>([]);
  const [activeConv, setActiveConv] = useState<CloneConversation | null>(null);
  const [streamingText, setStreamingText] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [activeConv?.messages, streamingText]);

  const load = async () => {
    setLoading(true);
    try {
      const [cl, convs] = await Promise.all([
        fetch(`/api/clones/${cloneId}`).then((r) => r.json()),
        fetch(`/api/clones/${cloneId}/conversations`).then((r) => r.json()),
      ]);
      setClone(cl);
      const list: CloneConversation[] = convs.conversations ?? [];
      setConversations(list);
      if (list.length > 0 && !activeConv) {
        setActiveConv(list[0]!);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, [cloneId]);

  const handleNewConversation = async () => {
    const conv: CloneConversation = await fetch(`/api/clones/${cloneId}/conversations`, {
      method: 'POST',
    }).then((r) => r.json());
    setConversations((prev) => [conv, ...prev]);
    setActiveConv(conv);
  };

  const handleDeleteConv = async (id: string) => {
    await fetch(`/api/clones/conversations/${id}`, { method: 'DELETE' });
    setConversations((prev) => prev.filter((c) => c.id !== id));
    if (activeConv?.id === id) {
      const remaining = conversations.filter((c) => c.id !== id);
      setActiveConv(remaining[0] ?? null);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || !activeConv || isStreaming) return;
    const message = input.trim();
    setInput('');
    setIsStreaming(true);
    setStreamingText('');

    // Optimistically add user message
    const userMsg: CloneMessage = { role: 'user', content: message, timestamp: new Date().toISOString() };
    setActiveConv((prev) => prev ? { ...prev, messages: [...prev.messages, userMsg] } : prev);
    setConversations((prev) =>
      prev.map((c) => c.id === activeConv.id ? { ...c, messages: [...c.messages, userMsg] } : c),
    );

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const res = await fetch(`/api/clones/conversations/${activeConv.id}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message }),
        signal: controller.signal,
      });

      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error ?? 'Erro na requisição.');
      }

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let fullText = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        for (const { event, data } of parseSse(buffer)) {
          buffer = '';
          const d = data as Record<string, unknown>;
          if (event === 'token') {
            fullText += d.text as string;
            setStreamingText(fullText);
          } else if (event === 'done') {
            const assistantMsg: CloneMessage = {
              role: 'assistant',
              content: fullText,
              timestamp: new Date().toISOString(),
            };
            setStreamingText('');
            setActiveConv((prev) =>
              prev ? { ...prev, messages: [...prev.messages, assistantMsg] } : prev,
            );
            setConversations((prev) =>
              prev.map((c) =>
                c.id === activeConv.id ? { ...c, messages: [...c.messages, assistantMsg] } : c,
              ),
            );
          }
        }
      }
    } catch (e) {
      if ((e as Error).name !== 'AbortError') {
        const errMsg: CloneMessage = {
          role: 'assistant',
          content: `[Erro: ${e instanceof Error ? e.message : 'Falha na conexão.'}]`,
          timestamp: new Date().toISOString(),
        };
        setActiveConv((prev) => prev ? { ...prev, messages: [...prev.messages, errMsg] } : prev);
      }
    } finally {
      setIsStreaming(false);
      setStreamingText('');
      abortRef.current = null;
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 text-amber-400 animate-spin" />
      </div>
    );
  }

  const messages = activeConv?.messages ?? [];
  const displayMessages: Array<CloneMessage & { isStreaming?: boolean }> = streamingText
    ? [...messages, { role: 'assistant', content: streamingText, timestamp: '', isStreaming: true }]
    : messages;

  return (
    <div className="flex h-[calc(100vh-128px)] gap-0 -m-8 mt-0">
      {/* Left sidebar — conversations */}
      <div className="w-64 flex-shrink-0 bg-[#0d0d0d] border-r border-[#1a1a1a] flex flex-col">
        <button
          onClick={() => onNavigate(View.CLONE_STUDIO)}
          className="flex items-center gap-2 px-4 py-3 text-xs text-gray-500 hover:text-gray-300 transition-colors border-b border-[#1a1a1a]"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Biblioteca
        </button>

        {/* Clone info */}
        {clone && (
          <div className="px-4 py-4 border-b border-[#1a1a1a]">
            <div className="flex items-center gap-2.5 mb-1">
              <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center">
                <Brain className="w-4 h-4 text-amber-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-white truncate">{clone.name}</p>
                {clone.validationScore && (
                  <p className="text-[10px] text-amber-500/70">{clone.validationScore}/100 · {clone.validationTier}</p>
                )}
              </div>
            </div>
            <p className="text-[10px] text-gray-600 line-clamp-2 mt-2">{clone.description}</p>
          </div>
        )}

        {/* Conversations list */}
        <div className="flex-1 overflow-y-auto">
          <div className="flex items-center justify-between px-4 py-2">
            <span className="text-[10px] font-bold text-gray-600 uppercase tracking-wider">Conversas</span>
            <button
              onClick={handleNewConversation}
              className="p-1 text-gray-600 hover:text-amber-400 transition-colors"
              title="Nova conversa"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="space-y-0.5 px-2">
            {conversations.length === 0 ? (
              <button
                onClick={handleNewConversation}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-gray-500 hover:text-gray-300 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                Iniciar conversa
              </button>
            ) : conversations.map((conv) => {
              const preview = conv.messages[conv.messages.length - 1]?.content?.slice(0, 50) ?? 'Conversa vazia';
              const isActive = activeConv?.id === conv.id;
              return (
                <div key={conv.id} className={`group flex items-center rounded-lg transition-colors ${isActive ? 'bg-amber-500/10' : 'hover:bg-white/5'}`}>
                  <button
                    onClick={() => setActiveConv(conv)}
                    className="flex-1 text-left px-3 py-2 min-w-0"
                  >
                    <p className={`text-xs truncate ${isActive ? 'text-amber-400' : 'text-gray-400'}`}>
                      {preview}
                    </p>
                    <p className="text-[10px] text-gray-600 mt-0.5">
                      {conv.messages.length} msg
                    </p>
                  </button>
                  <button
                    onClick={() => handleDeleteConv(conv.id)}
                    className="p-1.5 mr-1 opacity-0 group-hover:opacity-100 text-gray-600 hover:text-red-400 transition-all"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main chat area */}
      <div className="flex-1 flex flex-col bg-[#080808]">
        {!activeConv ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-4">
            <div className="w-16 h-16 rounded-full bg-amber-500/20 flex items-center justify-center">
              <Brain className="w-8 h-8 text-amber-400" />
            </div>
            <div className="text-center">
              <h3 className="text-white font-semibold">{clone?.name}</h3>
              <p className="text-gray-500 text-sm mt-1">Inicie uma conversa para começar</p>
            </div>
            <button
              onClick={handleNewConversation}
              className="flex items-center gap-2 px-5 py-3 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-medium transition-colors"
            >
              <MessageCircle className="w-4 h-4" />
              Nova Conversa
            </button>
          </div>
        ) : (
          <>
            {/* Messages */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6">
              {displayMessages.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full gap-3 text-center">
                  <Brain className="w-10 h-10 text-amber-500/40" />
                  <p className="text-gray-600 text-sm">
                    Faça uma pergunta para {clone?.name}
                  </p>
                  {/* Suggested prompts */}
                  <div className="flex flex-col gap-2 mt-2 max-w-sm w-full">
                    {[
                      'Como você pensa sobre criação de riqueza?',
                      'Qual é o maior erro que iniciantes cometem?',
                      'Como você abordaria este problema: ...',
                    ].map((p) => (
                      <button
                        key={p}
                        onClick={() => setInput(p)}
                        className="flex items-center gap-2 px-4 py-2 bg-[#0d0d0d] border border-[#1a1a1a] rounded-lg text-left text-xs text-gray-400 hover:text-white hover:border-[#2a2a2a] transition-colors"
                      >
                        <ChevronRight className="w-3 h-3 flex-shrink-0 text-amber-500/60" />
                        {p}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {displayMessages.map((msg, i) => (
                <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                  {msg.role === 'assistant' && (
                    <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center flex-shrink-0 mt-1">
                      <Brain className="w-4 h-4 text-amber-400" />
                    </div>
                  )}
                  <div className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-amber-600/20 text-white rounded-tr-sm'
                      : 'bg-[#111] border border-[#1a1a1a] text-gray-200 rounded-tl-sm whitespace-pre-wrap'
                  }`}>
                    {msg.content}
                    {msg.isStreaming && (
                      <span className="inline-block w-2 h-4 bg-amber-400 animate-pulse ml-0.5 align-text-bottom" />
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Input */}
            <div className="border-t border-[#1a1a1a] p-4 bg-[#0d0d0d]">
              <div className="flex gap-3 items-end">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      void handleSend();
                    }
                  }}
                  placeholder={`Pergunta para ${clone?.name ?? 'o clone'}... (Enter para enviar)`}
                  rows={1}
                  disabled={isStreaming}
                  className="flex-1 bg-[#111] border border-[#222] rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-amber-500/50 resize-none disabled:opacity-50"
                  style={{ minHeight: '44px', maxHeight: '120px' }}
                />
                <button
                  onClick={handleSend}
                  disabled={!input.trim() || isStreaming}
                  className="w-10 h-10 rounded-xl bg-amber-600 hover:bg-amber-500 disabled:opacity-40 flex items-center justify-center transition-colors flex-shrink-0"
                >
                  {isStreaming
                    ? <Loader2 className="w-4 h-4 text-white animate-spin" />
                    : <Send className="w-4 h-4 text-white" />
                  }
                </button>
              </div>
              <p className="text-[10px] text-gray-700 mt-2 text-center">
                Shift+Enter para nova linha · Clone baseado em Stark Mansion
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

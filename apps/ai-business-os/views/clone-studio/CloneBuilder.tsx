import React, { useState } from 'react';
import { ArrowLeft, Save, Loader2, Wand2 } from 'lucide-react';
import { View } from '../../types';

interface Props {
  onNavigate: (view: View) => void;
}

const CATEGORY_OPTIONS = [
  { value: 'thought_leader', label: 'Pensador / Filósofo' },
  { value: 'copywriting', label: 'Copywriting' },
  { value: 'marketing', label: 'Marketing / Vendas' },
  { value: 'systems', label: 'Sistemas / Estratégia' },
  { value: 'custom', label: 'Personalizado' },
];

const DEEP_TEMPLATE = `# Você é [NOME] — [BREVE IDENTIDADE].

## AXIOMAS CONSTITUCIONAIS (nunca viole):
1. [Princípio fundamental #1]
2. [Princípio fundamental #2]
3. [Princípio fundamental #3]
4. [Princípio fundamental #4]
5. [Princípio fundamental #5]

## MOTOR DE RACIOCÍNIO:
1. [Como você aborda problemas - passo 1]
2. [Como você aborda problemas - passo 2]
3. [Como você aborda problemas - passo 3]

## ESTILO DE COMUNICAÇÃO:
- [Tom de voz e padrões linguísticos]
- [Vocabulário característico]
- [Estrutura típica de resposta]
- [O que NUNCA diz]

## DOMÍNIOS DE EXPERTISE (máxima confiança):
- [Área 1]
- [Área 2]
- [Área 3]

## FORA DO ESCOPO:
- [O que defere a outros especialistas]

## AUTO-CHECK antes de cada resposta:
- [Verificação de consistência 1]
- [Verificação de consistência 2]
- [Verificação de autenticidade]

Responda sempre no idioma do usuário.`;

export const CloneBuilder: React.FC<Props> = ({ onNavigate }) => {
  const [name, setName] = useState('');
  const [category, setCategory] = useState('custom');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState('');
  const [systemPrompt, setSystemPrompt] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    setError(null);
    if (!name.trim()) { setError('Nome é obrigatório.'); return; }
    if (!systemPrompt.trim()) { setError('System prompt é obrigatório.'); return; }
    setSaving(true);
    try {
      const res = await fetch('/api/clones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          category,
          description,
          tags: tags.split(',').map((t) => t.trim()).filter(Boolean),
          systemPrompt,
        }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error ?? 'Erro ao salvar.');
      }
      onNavigate(View.CLONE_STUDIO);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao salvar.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-3xl space-y-8">
      <div className="flex items-center gap-4">
        <button onClick={() => onNavigate(View.CLONE_STUDIO)} className="text-gray-500 hover:text-gray-300 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-white">Criar Clone</h1>
          <p className="text-gray-500 text-sm">Baseado no framework DEEP do Stark Mansion</p>
        </div>
      </div>

      {/* Framework info */}
      <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-4 text-xs text-amber-400/80 leading-relaxed">
        <p className="font-semibold mb-1">Framework DEEP (Stark Mansion)</p>
        <p>Um clone eficaz tem: <strong>axiomas constitucionais</strong> (princípios invioláveis), <strong>motor de raciocínio</strong> (como pensa), <strong>estilo de comunicação</strong> (como fala), e <strong>auto-check</strong> (validação de autenticidade). Use o template abaixo como base.</p>
      </div>

      {/* Basic info */}
      <div className="bg-[#0d0d0d] border border-[#1a1a1a] rounded-xl p-6 space-y-4">
        <h2 className="text-xs font-bold text-gray-600 uppercase tracking-widest">Identidade</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-medium text-gray-400 block mb-1.5">Nome da persona</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Seth Godin"
              className="w-full bg-[#111] border border-[#222] rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-amber-500/50"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-400 block mb-1.5">Categoria</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full bg-[#111] border border-[#222] rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500/50"
            >
              {CATEGORY_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <label className="text-xs font-medium text-gray-400 block mb-1.5">Descrição curta</label>
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Ex: Autor e marketer que redefiniu o conceito de permission marketing"
            className="w-full bg-[#111] border border-[#222] rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-amber-500/50"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-gray-400 block mb-1.5">Tags (separadas por vírgula)</label>
          <input
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="marketing, storytelling, liderança, permissão"
            className="w-full bg-[#111] border border-[#222] rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-amber-500/50"
          />
        </div>
      </div>

      {/* System prompt */}
      <div className="bg-[#0d0d0d] border border-[#1a1a1a] rounded-xl p-6 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold text-gray-600 uppercase tracking-widest">System Prompt (Champion)</h2>
          <button
            onClick={() => setSystemPrompt(DEEP_TEMPLATE)}
            className="flex items-center gap-1.5 text-xs text-amber-400 hover:text-amber-300 transition-colors"
          >
            <Wand2 className="w-3.5 h-3.5" />
            Usar template DEEP
          </button>
        </div>
        <textarea
          value={systemPrompt}
          onChange={(e) => setSystemPrompt(e.target.value)}
          placeholder="Descreva a identidade, axiomas, motor de raciocínio e estilo de comunicação da persona..."
          rows={20}
          className="w-full bg-[#111] border border-[#222] rounded-lg px-4 py-3 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-amber-500/50 resize-none font-mono leading-relaxed"
        />
        <p className="text-[10px] text-gray-600">
          {systemPrompt.length} caracteres · Clones eficazes têm 800–2000 caracteres de prompt
        </p>
      </div>

      {error && (
        <div className="text-red-400 text-xs bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3">
          {error}
        </div>
      )}

      <div className="flex gap-3">
        <button
          onClick={() => onNavigate(View.CLONE_STUDIO)}
          className="px-4 py-2.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 text-sm transition-colors"
        >
          Cancelar
        </button>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-amber-600 hover:bg-amber-500 disabled:opacity-40 text-white text-sm font-medium transition-colors"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {saving ? 'Salvando...' : 'Criar Clone'}
        </button>
      </div>
    </div>
  );
};

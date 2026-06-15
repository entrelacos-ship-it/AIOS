import React, { useEffect, useState } from 'react';
import { Plus, MessageCircle, Trash2, Star, Loader2, Brain, Pen, TrendingUp, Cpu, Search } from 'lucide-react';
import type { CloneRecord } from '../../types';
import { View } from '../../types';

interface Props {
  onNavigate: (view: View, meta?: { cloneId?: string }) => void;
}

const CATEGORY_META: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  thought_leader: { label: 'Pensador', color: 'text-violet-400 bg-violet-500/10', icon: <Brain className="w-3 h-3" /> },
  copywriting:    { label: 'Copywriting', color: 'text-amber-400 bg-amber-500/10', icon: <Pen className="w-3 h-3" /> },
  marketing:      { label: 'Marketing', color: 'text-emerald-400 bg-emerald-500/10', icon: <TrendingUp className="w-3 h-3" /> },
  systems:        { label: 'Sistemas', color: 'text-cyan-400 bg-cyan-500/10', icon: <Cpu className="w-3 h-3" /> },
  custom:         { label: 'Personalizado', color: 'text-gray-400 bg-gray-500/10', icon: <Star className="w-3 h-3" /> },
};

const TIER_COLORS: Record<string, string> = {
  'S-Tier': 'text-amber-400',
  'A-Tier': 'text-emerald-400',
  'B-Tier': 'text-blue-400',
};

export const CloneLibrary: React.FC<Props> = ({ onNavigate }) => {
  const [clones, setClones] = useState<CloneRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<string>('all');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const d = await fetch('/api/clones').then((r) => r.json());
      setClones(d.clones ?? []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, []);

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await fetch(`/api/clones/${id}`, { method: 'DELETE' });
      await load();
    } finally {
      setDeletingId(null);
    }
  };

  const filtered = clones.filter((c) => {
    const matchSearch = !search || c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.description.toLowerCase().includes(search.toLowerCase()) ||
      c.tags.some((t) => t.toLowerCase().includes(search.toLowerCase()));
    const matchFilter = filter === 'all' || c.category === filter;
    return matchSearch && matchFilter;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 text-amber-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Clone Studio</h1>
          <p className="text-gray-500 text-sm mt-1">
            Biblioteca de personas cognitivas — pense com os melhores
          </p>
        </div>
        <button
          onClick={() => onNavigate(View.CLONE_STUDIO_BUILDER)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-sm font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          Criar Clone
        </button>
      </div>

      {/* Search + filter */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nome, área ou tag..."
            className="w-full bg-[#0d0d0d] border border-[#1a1a1a] rounded-lg pl-9 pr-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-amber-500/50"
          />
        </div>
        <div className="flex gap-1.5">
          {['all', 'thought_leader', 'copywriting', 'marketing', 'systems', 'custom'].map((cat) => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                filter === cat
                  ? 'bg-amber-600 text-white'
                  : 'bg-[#0d0d0d] border border-[#1a1a1a] text-gray-400 hover:text-white hover:border-[#2a2a2a]'
              }`}
            >
              {cat === 'all' ? 'Todos' : CATEGORY_META[cat]?.label ?? cat}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="border border-dashed border-[#222] rounded-xl p-12 text-center">
          <Brain className="w-10 h-10 text-gray-700 mx-auto mb-4" />
          <p className="text-gray-500 text-sm">
            {search ? 'Nenhum clone encontrado.' : 'Nenhum clone na biblioteca.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((clone) => {
            const cat = CATEGORY_META[clone.category];
            return (
              <div
                key={clone.id}
                className="bg-[#0d0d0d] border border-[#1a1a1a] rounded-xl p-5 hover:border-[#2a2a2a] transition-colors group flex flex-col"
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-white font-semibold text-sm truncate">{clone.name}</h3>
                      {clone.isPrebuilt && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 font-medium flex-shrink-0">
                          Stark
                        </span>
                      )}
                    </div>
                    {cat && (
                      <span className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full ${cat.color}`}>
                        {cat.icon}
                        {cat.label}
                      </span>
                    )}
                  </div>
                  {!clone.isPrebuilt && (
                    <button
                      onClick={() => handleDelete(clone.id)}
                      disabled={deletingId === clone.id}
                      className="p-1.5 rounded-md opacity-0 group-hover:opacity-100 hover:bg-red-500/10 text-gray-600 hover:text-red-400 transition-all disabled:opacity-40"
                    >
                      {deletingId === clone.id
                        ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        : <Trash2 className="w-3.5 h-3.5" />}
                    </button>
                  )}
                </div>

                <p className="text-gray-500 text-xs leading-relaxed line-clamp-2 mb-3 flex-1">
                  {clone.description}
                </p>

                {/* Tags */}
                <div className="flex flex-wrap gap-1 mb-4">
                  {clone.tags.slice(0, 4).map((tag) => (
                    <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-gray-500">
                      {tag}
                    </span>
                  ))}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between">
                  {clone.validationScore ? (
                    <div className="flex items-center gap-1.5 text-[10px]">
                      <Star className="w-3 h-3 text-amber-500" />
                      <span className={TIER_COLORS[clone.validationTier ?? ''] ?? 'text-gray-500'}>
                        {clone.validationScore}/100 · {clone.validationTier}
                      </span>
                    </div>
                  ) : (
                    <div />
                  )}
                  <button
                    onClick={() => onNavigate(View.CLONE_STUDIO_CHAT, { cloneId: clone.id })}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-600/20 hover:bg-amber-600/30 text-amber-400 text-xs font-medium transition-colors"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    Conversar
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

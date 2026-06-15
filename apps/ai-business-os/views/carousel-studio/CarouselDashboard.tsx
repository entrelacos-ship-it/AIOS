import React, { useEffect, useState } from 'react';
import {
  Layers, Trash2, Eye, Loader2, Plus, Edit3, Check, X,
} from 'lucide-react';
import { View } from '../../types';

interface SlideRecord {
  id: number;
  title: string;
  body: string;
  backgroundColor: string;
  accentColor: string;
  textColor: string;
  templateId: string;
}

interface BrandProfile {
  brandName: string;
  brandHandle: string;
  studioLabel: string;
  profileImageUrl: string;
}

interface CarouselDraft {
  id: string;
  name: string;
  manifestoId: string | null;
  slides: SlideRecord[];
  brandProfile: BrandProfile;
  createdAt: string;
  updatedAt: string;
}

interface Props {
  onNavigate: (view: View, meta?: { draftId?: string }) => void;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
  });
}

export const CarouselDashboard: React.FC<Props> = ({ onNavigate }) => {
  const [drafts, setDrafts] = useState<CarouselDraft[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/branding/carousel-drafts');
      const data = await res.json();
      setDrafts(Array.isArray(data?.drafts) ? data.drafts : []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, []);

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await fetch(`/api/branding/carousel-drafts/${id}`, { method: 'DELETE' });
      setDrafts((prev) => prev.filter((d) => d.id !== id));
      setConfirmDeleteId(null);
    } finally {
      setDeletingId(null);
    }
  };

  const handleRename = async (draft: CarouselDraft) => {
    const trimmed = renameValue.trim();
    if (!trimmed || trimmed === draft.name) {
      setRenamingId(null);
      return;
    }
    try {
      await fetch(`/api/branding/carousel-drafts/${draft.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: trimmed, slides: draft.slides }),
      });
      setDrafts((prev) =>
        prev.map((d) => (d.id === draft.id ? { ...d, name: trimmed } : d)),
      );
    } finally {
      setRenamingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 text-fuchsia-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Carousel Studio</h1>
          <p className="text-sm text-gray-500 mt-1">
            Gerencie, visualize e exporte seus carrosséis
          </p>
        </div>
        <button
          type="button"
          onClick={() => onNavigate(View.BRANDING_OS_VISUAL)}
          className="flex items-center gap-2 bg-fuchsia-600 hover:bg-fuchsia-500 text-white text-xs font-bold uppercase tracking-widest px-5 py-3 rounded-2xl transition-colors"
        >
          <Plus size={14} />
          Criar no BrandingOS
        </button>
      </div>

      {/* Empty state */}
      {drafts.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 border-2 border-dashed border-[#222] rounded-3xl">
          <div className="h-16 w-16 rounded-2xl bg-fuchsia-500/10 border border-fuchsia-500/20 flex items-center justify-center mb-4">
            <Layers size={28} className="text-fuchsia-400" />
          </div>
          <p className="text-white font-semibold mb-1">Nenhum carrossel salvo</p>
          <p className="text-sm text-gray-500 mb-6">
            Crie um carrossel no BrandingOS e salve como draft para vê-lo aqui.
          </p>
          <button
            type="button"
            onClick={() => onNavigate(View.BRANDING_OS_VISUAL)}
            className="text-xs font-bold text-fuchsia-400 hover:text-fuchsia-300 uppercase tracking-widest transition-colors"
          >
            Ir para BrandingOS →
          </button>
        </div>
      )}

      {/* Grid */}
      {drafts.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {drafts.map((draft) => (
            <div
              key={draft.id}
              className="group rounded-2xl border border-[#1F1F1F] bg-[#141414] p-5 hover:border-fuchsia-500/30 transition-all cursor-pointer"
              onClick={() =>
                onNavigate(View.CAROUSEL_STUDIO_VIEWER, { draftId: draft.id })
              }
            >
              {/* Slide thumbnail strip */}
              <div className="flex gap-1.5 mb-4">
                {draft.slides.slice(0, 5).map((slide, i) => (
                  <div
                    key={slide.id ?? i}
                    className="relative rounded-lg overflow-hidden"
                    style={{
                      width: '52px',
                      height: '65px',
                      backgroundColor: slide.backgroundColor || '#0a0a0a',
                    }}
                  >
                    <p
                      className="absolute inset-x-1 top-1 text-[6px] font-bold leading-tight line-clamp-3"
                      style={{ color: slide.textColor || '#f5f5f5' }}
                    >
                      {slide.title}
                    </p>
                    <div
                      className="absolute bottom-0 left-0 right-0 h-1"
                      style={{ backgroundColor: slide.accentColor || '#9900ff' }}
                    />
                  </div>
                ))}
                {draft.slides.length > 5 && (
                  <div className="rounded-lg bg-[#0A0A0A] border border-[#222] flex items-center justify-center text-[10px] text-gray-500 font-bold" style={{ width: '52px', height: '65px' }}>
                    +{draft.slides.length - 5}
                  </div>
                )}
              </div>

              {/* Name */}
              <div className="mb-2">
                {renamingId === draft.id ? (
                  <div
                    className="flex items-center gap-1"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <input
                      type="text"
                      className="flex-1 bg-[#0A0A0A] border border-fuchsia-500/40 rounded-lg px-2 py-1 text-sm text-white focus:outline-none"
                      value={renameValue}
                      onChange={(e) => setRenameValue(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleRename(draft);
                        if (e.key === 'Escape') setRenamingId(null);
                      }}
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={() => handleRename(draft)}
                      className="text-emerald-400 hover:text-emerald-300"
                    >
                      <Check size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setRenamingId(null)}
                      className="text-gray-500 hover:text-gray-300"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <h3 className="text-sm font-semibold text-white truncate">
                    {draft.name}
                  </h3>
                )}
              </div>

              {/* Meta */}
              <div className="flex items-center gap-3 text-[10px] text-gray-500 mb-4">
                <span className="bg-fuchsia-500/10 text-fuchsia-300 border border-fuchsia-500/20 rounded-full px-2 py-0.5 font-bold">
                  {draft.slides.length} slide{draft.slides.length !== 1 ? 's' : ''}
                </span>
                <span>{formatDate(draft.updatedAt)}</span>
                {draft.brandProfile?.brandName && (
                  <span className="truncate max-w-[100px]">{draft.brandProfile.brandName}</span>
                )}
              </div>

              {/* Actions */}
              <div
                className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  type="button"
                  onClick={() =>
                    onNavigate(View.CAROUSEL_STUDIO_VIEWER, { draftId: draft.id })
                  }
                  className="flex items-center gap-1 text-[10px] text-gray-400 hover:text-fuchsia-300 transition-colors"
                >
                  <Eye size={12} /> Ver
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setRenamingId(draft.id);
                    setRenameValue(draft.name);
                  }}
                  className="flex items-center gap-1 text-[10px] text-gray-400 hover:text-white transition-colors"
                >
                  <Edit3 size={12} /> Renomear
                </button>
                {confirmDeleteId === draft.id ? (
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleDelete(draft.id)}
                      disabled={deletingId === draft.id}
                      className="text-[10px] text-red-400 hover:text-red-300 font-bold transition-colors"
                    >
                      {deletingId === draft.id ? 'Excluindo...' : 'Confirmar'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmDeleteId(null)}
                      className="text-[10px] text-gray-500 hover:text-gray-300 transition-colors"
                    >
                      Cancelar
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirmDeleteId(draft.id)}
                    className="flex items-center gap-1 text-[10px] text-gray-400 hover:text-red-400 transition-colors"
                  >
                    <Trash2 size={12} /> Excluir
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

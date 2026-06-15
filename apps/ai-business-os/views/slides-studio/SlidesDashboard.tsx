import React, { useState, useEffect } from 'react';
import {
  Presentation,
  Trash2,
  Eye,
  Plus,
  Clock,
  FileDown,
  Monitor,
  Pencil,
  Check,
  X,
} from 'lucide-react';
import { Card } from '../../components/ui/Card';
import type { View } from '../../types';

interface SlidesRecord {
  id: string;
  title: string;
  format: string;
  inputMode: string;
  outputType: string;
  dsBrand: string;
  slideCount: number;
  html: string | null;
  pptxFilename: string | null;
  createdAt: string;
  updatedAt: string;
}

interface Props {
  onViewChange: (v: View) => void;
  onSelectSlide: (id: string) => void;
  onNewSlide: () => void;
}

const FORMAT_LABELS: Record<string, string> = {
  videoaula: 'Videoaula',
  palestra: 'Palestra',
  webinar: 'Webinar',
  masterclass: 'Masterclass',
  'micro-aula': 'Micro-aula',
  corporativo: 'Corporativo',
};

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'agora';
  if (mins < 60) return `${mins}min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d`;
}

export function SlidesDashboard({ onSelectSlide, onNewSlide }: Props) {
  const [slides, setSlides] = useState<SlidesRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [renaming, setRenaming] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');

  const fetchSlides = () => {
    setLoading(true);
    fetch('/api/slides/saved')
      .then((r) => r.json())
      .then((d) => setSlides(d.slides ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchSlides(); }, []);

  const handleDelete = async (id: string) => {
    setDeleting(id);
    await fetch(`/api/slides/saved/${id}`, { method: 'DELETE' });
    setSlides((prev) => prev.filter((s) => s.id !== id));
    setDeleting(null);
  };

  const startRename = (s: SlidesRecord) => {
    setRenaming(s.id);
    setRenameValue(s.title);
  };

  const confirmRename = async (id: string) => {
    if (!renameValue.trim()) return;
    await fetch(`/api/slides/saved/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: renameValue.trim() }),
    });
    setSlides((prev) =>
      prev.map((s) => (s.id === id ? { ...s, title: renameValue.trim() } : s)),
    );
    setRenaming(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-violet-500/30 border-t-violet-500" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white">Slides Studio</h1>
          <p className="text-gray-500 text-sm mt-1">
            {slides.length} apresentaç{slides.length === 1 ? 'ão salva' : 'ões salvas'}
          </p>
        </div>
        <button
          onClick={onNewSlide}
          className="flex items-center gap-2 px-4 py-2.5 bg-violet-600 hover:bg-violet-500 text-white rounded-lg text-sm font-medium transition-colors"
        >
          <Plus size={16} /> Nova Apresentação
        </button>
      </div>

      {slides.length === 0 ? (
        <Card className="p-12 text-center">
          <Presentation size={40} className="text-violet-400/40 mx-auto mb-4" />
          <h2 className="text-lg text-white mb-2">Nenhuma apresentação salva</h2>
          <p className="text-gray-500 text-sm mb-6">
            Crie sua primeira apresentação e ela aparecerá aqui automaticamente.
          </p>
          <button
            onClick={onNewSlide}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-violet-600 hover:bg-violet-500 text-white rounded-lg text-sm font-medium transition-colors"
          >
            <Plus size={16} /> Criar Apresentação
          </button>
        </Card>
      ) : (
        <div className="grid gap-3">
          {slides.map((s) => (
            <Card
              key={s.id}
              className="p-4 hover:border-violet-500/30 transition-all cursor-pointer group"
              onClick={() => onSelectSlide(s.id)}
            >
              <div className="flex items-center gap-4">
                {/* Icon */}
                <div className="w-10 h-10 rounded-lg bg-violet-500/10 flex items-center justify-center flex-shrink-0">
                  {s.html ? (
                    <Monitor size={18} className="text-violet-400" />
                  ) : (
                    <FileDown size={18} className="text-violet-400" />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  {renaming === s.id ? (
                    <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                      <input
                        value={renameValue}
                        onChange={(e) => setRenameValue(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') confirmRename(s.id);
                          if (e.key === 'Escape') setRenaming(null);
                        }}
                        autoFocus
                        className="bg-[#111] border border-violet-500 rounded px-2 py-1 text-sm text-white flex-1 focus:outline-none"
                      />
                      <button
                        onClick={() => confirmRename(s.id)}
                        className="p-1 text-emerald-400 hover:text-emerald-300"
                      >
                        <Check size={14} />
                      </button>
                      <button
                        onClick={() => setRenaming(null)}
                        className="p-1 text-gray-500 hover:text-gray-300"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ) : (
                    <h3 className="text-white text-sm font-medium truncate">{s.title}</h3>
                  )}
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-violet-500/15 text-violet-400 font-medium">
                      {FORMAT_LABELS[s.format] || s.format}
                    </span>
                    <span className="text-xs text-gray-600">{s.slideCount} slides</span>
                    <span className="text-xs text-gray-600">{s.dsBrand}</span>
                    <span className="flex items-center gap-1 text-xs text-gray-600">
                      <Clock size={10} /> {timeAgo(s.createdAt)}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div
                  className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    onClick={() => onSelectSlide(s.id)}
                    className="p-2 rounded-lg hover:bg-white/5 text-gray-500 hover:text-violet-400 transition-colors"
                    title="Visualizar"
                  >
                    <Eye size={15} />
                  </button>
                  <button
                    onClick={() => startRename(s)}
                    className="p-2 rounded-lg hover:bg-white/5 text-gray-500 hover:text-white transition-colors"
                    title="Renomear"
                  >
                    <Pencil size={15} />
                  </button>
                  <button
                    onClick={() => handleDelete(s.id)}
                    disabled={deleting === s.id}
                    className="p-2 rounded-lg hover:bg-red-500/10 text-gray-500 hover:text-red-400 transition-colors disabled:opacity-40"
                    title="Excluir"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import {
  ChevronLeft,
  Download,
  FileDown,
  Trash2,
  Pencil,
  Check,
  X,
  RefreshCw,
} from 'lucide-react';
import { Card } from '../../components/ui/Card';

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

const FORMAT_LABELS: Record<string, string> = {
  videoaula: 'Videoaula',
  palestra: 'Palestra',
  webinar: 'Webinar',
  masterclass: 'Masterclass',
  'micro-aula': 'Micro-aula',
  corporativo: 'Corporativo',
};

interface Props {
  slideId: string;
  onBack: () => void;
}

export function SlidesViewer({ slideId, onBack }: Props) {
  const [record, setRecord] = useState<SlidesRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [renaming, setRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    setLoading(true);
    setError('');
    fetch(`/api/slides/saved/${slideId}`)
      .then((r) => {
        if (!r.ok) throw new Error('Apresentação não encontrada');
        return r.json();
      })
      .then((data) => setRecord(data))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [slideId]);

  const handleRename = async () => {
    if (!renameValue.trim() || !record) return;
    const res = await fetch(`/api/slides/saved/${record.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: renameValue.trim() }),
    });
    if (res.ok) {
      const updated = await res.json();
      setRecord(updated);
    }
    setRenaming(false);
  };

  const handleDelete = async () => {
    if (!record) return;
    await fetch(`/api/slides/saved/${record.id}`, { method: 'DELETE' });
    onBack();
  };

  const downloadHtml = () => {
    if (!record?.html) return;
    const blob = new Blob([record.html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${record.title.replace(/[^a-zA-Z0-9À-ÿ\s-]/g, '').replace(/\s+/g, '-')}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-violet-500/30 border-t-violet-500" />
      </div>
    );
  }

  if (error || !record) {
    return (
      <div className="max-w-2xl mx-auto space-y-4">
        <button onClick={onBack} className="flex items-center gap-1 text-xs text-gray-600 hover:text-gray-400">
          <ChevronLeft size={14} /> Voltar
        </button>
        <Card className="p-8 text-center">
          <p className="text-red-400">{error || 'Apresentação não encontrada'}</p>
          <button onClick={onBack} className="mt-4 text-sm text-violet-400 hover:text-violet-300">
            Voltar à biblioteca
          </button>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Top bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="flex items-center gap-1 text-xs text-gray-600 hover:text-gray-400">
            <ChevronLeft size={14} /> Biblioteca
          </button>
          <span className="text-gray-700">|</span>
          {renaming ? (
            <div className="flex items-center gap-2">
              <input
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleRename();
                  if (e.key === 'Escape') setRenaming(false);
                }}
                autoFocus
                className="bg-[#111] border border-violet-500 rounded px-2 py-1 text-sm text-white focus:outline-none"
              />
              <button onClick={handleRename} className="p-1 text-emerald-400 hover:text-emerald-300">
                <Check size={14} />
              </button>
              <button onClick={() => setRenaming(false)} className="p-1 text-gray-500 hover:text-gray-300">
                <X size={14} />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-sm text-white font-medium">{record.title}</span>
              <button
                onClick={() => { setRenaming(true); setRenameValue(record.title); }}
                className="p-1 text-gray-600 hover:text-white transition-colors"
              >
                <Pencil size={12} />
              </button>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-violet-500/15 text-violet-400 font-medium">
            {FORMAT_LABELS[record.format] || record.format}
          </span>
          <span className="text-xs text-gray-600">{record.slideCount} slides</span>

          {record.html && (
            <button
              onClick={downloadHtml}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1A1A1A] border border-[#2A2A2A] hover:border-[#3A3A3A] rounded-lg text-xs text-gray-400 hover:text-white transition-colors"
            >
              <Download size={13} /> HTML
            </button>
          )}

          {record.pptxFilename && (
            <a
              href={`/api/slides/pptx/${record.pptxFilename}`}
              download
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1A1A1A] border border-[#2A2A2A] hover:border-violet-500 rounded-lg text-xs text-gray-400 hover:text-violet-400 transition-colors"
            >
              <FileDown size={13} /> PPTX
            </a>
          )}

          {confirmDelete ? (
            <div className="flex items-center gap-1">
              <span className="text-xs text-red-400">Excluir?</span>
              <button onClick={handleDelete} className="px-2 py-1 text-xs text-red-400 hover:text-red-300 bg-red-500/10 rounded">
                Sim
              </button>
              <button onClick={() => setConfirmDelete(false)} className="px-2 py-1 text-xs text-gray-500 hover:text-gray-300 rounded">
                Não
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmDelete(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1A1A1A] border border-[#2A2A2A] hover:border-red-500/50 rounded-lg text-xs text-gray-400 hover:text-red-400 transition-colors"
            >
              <Trash2 size={13} /> Excluir
            </button>
          )}
        </div>
      </div>

      {/* Preview */}
      {record.html ? (
        <div className="rounded-xl overflow-hidden border border-[#1A1A1A]" style={{ height: 'calc(100vh - 180px)' }}>
          <iframe
            srcDoc={record.html}
            sandbox="allow-scripts allow-same-origin"
            className="w-full h-full"
            title="Preview dos Slides"
          />
        </div>
      ) : record.pptxFilename ? (
        <Card className="p-8 text-center space-y-4">
          <FileDown size={40} className="text-violet-400 mx-auto" />
          <p className="text-white font-medium">Apresentação em formato PPTX</p>
          <p className="text-gray-500 text-sm">Preview disponível apenas para formato HTML. Baixe o PPTX para visualizar.</p>
          <a
            href={`/api/slides/pptx/${record.pptxFilename}`}
            download
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-violet-600 hover:bg-violet-500 text-white rounded-lg text-sm font-medium transition-colors"
          >
            <Download size={16} /> Baixar PowerPoint
          </a>
        </Card>
      ) : (
        <Card className="p-8 text-center">
          <RefreshCw size={40} className="text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400">Nenhum conteúdo disponível para preview.</p>
        </Card>
      )}
    </div>
  );
}

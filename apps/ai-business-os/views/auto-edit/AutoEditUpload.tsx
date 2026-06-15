import React, { useRef, useState } from 'react';
import { ArrowLeft, Upload, Film, Loader2, ToggleLeft, ToggleRight } from 'lucide-react';
import { View } from '../../types';

interface Props {
  onNavigate: (view: View, meta?: { projectId?: string }) => void;
}

export const AutoEditUpload: React.FC<Props> = ({ onNavigate }) => {
  const fileRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [includeShorts, setIncludeShorts] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);

  const handleFile = (f: File) => {
    if (!f.type.startsWith('video/')) {
      setError('Selecione um arquivo de vídeo (MP4, MOV, WebM, etc.)');
      return;
    }
    setFile(f);
    setError(null);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  };

  const handleSubmit = async () => {
    if (!file) return;
    setError(null);
    setUploading(true);
    setProgress(0);

    const form = new FormData();
    form.append('video', file);
    form.append('includeShorts', String(includeShorts));

    try {
      const xhr = new XMLHttpRequest();
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) setProgress(Math.round((e.loaded / e.total) * 100));
      };

      const result = await new Promise<{ projectId: string }>((resolve, reject) => {
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve(JSON.parse(xhr.responseText) as { projectId: string });
          } else {
            reject(new Error((() => { try { return (JSON.parse(xhr.responseText) as { error: string }).error; } catch { return `HTTP ${xhr.status}`; } })()));
          }
        };
        xhr.onerror = () => reject(new Error('Falha no upload.'));
        xhr.open('POST', '/api/auto-edit/upload');
        xhr.send(form);
      });

      onNavigate(View.AUTO_EDIT_WORKSPACE, { projectId: result.projectId });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro no upload.');
      setUploading(false);
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes > 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="max-w-2xl space-y-8">
      <div className="flex items-center gap-4">
        <button onClick={() => onNavigate(View.AUTO_EDIT)} className="text-gray-500 hover:text-gray-300 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-white">Novo Projeto AutoEdit</h1>
          <p className="text-gray-500 text-sm">Envie um vídeo e o pipeline de IA fará o resto</p>
        </div>
      </div>

      {/* Info banner */}
      <div className="bg-rose-500/5 border border-rose-500/20 rounded-xl p-4 text-xs text-rose-400/80 leading-relaxed">
        <p className="font-semibold mb-1">Pipeline AutoEdit</p>
        <p>Normalização → Transcrição (Whisper) → Plano de Cortes (Claude) → Corte FFmpeg → Legendas SRT → Metadados SEO{includeShorts ? ' → Shorts 9:16' : ''}</p>
      </div>

      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => !file && fileRef.current?.click()}
        className={`border-2 border-dashed rounded-2xl p-12 flex flex-col items-center justify-center gap-4 text-center transition-all cursor-pointer ${
          dragging ? 'border-rose-500/60 bg-rose-500/5' :
          file ? 'border-rose-500/30 bg-rose-500/5 cursor-default' :
          'border-[#1a1a1a] hover:border-[#2a2a2a]'
        }`}
      >
        <input
          ref={fileRef}
          type="file"
          accept="video/*"
          className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
        />
        {file ? (
          <>
            <div className="w-14 h-14 rounded-full bg-rose-500/20 flex items-center justify-center">
              <Film className="w-7 h-7 text-rose-400" />
            </div>
            <div>
              <p className="text-white font-medium">{file.name}</p>
              <p className="text-gray-500 text-sm mt-0.5">{formatSize(file.size)}</p>
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); setFile(null); fileRef.current && (fileRef.current.value = ''); }}
              className="text-xs text-gray-600 hover:text-gray-400 transition-colors"
            >
              Trocar arquivo
            </button>
          </>
        ) : (
          <>
            <div className="w-14 h-14 rounded-full bg-white/5 flex items-center justify-center">
              <Upload className="w-7 h-7 text-gray-500" />
            </div>
            <div>
              <p className="text-gray-300 font-medium">Arraste ou clique para selecionar</p>
              <p className="text-gray-600 text-sm mt-1">MP4, MOV, WebM, AVI — até 500 MB</p>
            </div>
          </>
        )}
      </div>

      {/* Options */}
      <div className="bg-[#0d0d0d] border border-[#1a1a1a] rounded-xl p-5 space-y-4">
        <h2 className="text-xs font-bold text-gray-600 uppercase tracking-widest">Opções</h2>

        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-300 font-medium">Gerar versão Shorts 9:16</p>
            <p className="text-xs text-gray-600 mt-0.5">Recorta o vídeo editado para formato vertical</p>
          </div>
          <button
            onClick={() => setIncludeShorts(!includeShorts)}
            className={`transition-colors ${includeShorts ? 'text-rose-400' : 'text-gray-600 hover:text-gray-400'}`}
          >
            {includeShorts ? <ToggleRight className="w-8 h-8" /> : <ToggleLeft className="w-8 h-8" />}
          </button>
        </div>
      </div>

      {uploading && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>Enviando vídeo...</span>
            <span>{progress}%</span>
          </div>
          <div className="h-1.5 bg-[#1a1a1a] rounded-full overflow-hidden">
            <div
              className="h-full bg-rose-500 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {error && (
        <div className="text-red-400 text-xs bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3">
          {error}
        </div>
      )}

      <div className="flex gap-3">
        <button
          onClick={() => onNavigate(View.AUTO_EDIT)}
          className="px-4 py-2.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 text-sm transition-colors"
        >
          Cancelar
        </button>
        <button
          onClick={handleSubmit}
          disabled={!file || uploading}
          className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-rose-600 hover:bg-rose-500 disabled:opacity-40 text-white text-sm font-medium transition-colors"
        >
          {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Film className="w-4 h-4" />}
          {uploading ? 'Enviando...' : 'Iniciar Pipeline'}
        </button>
      </div>
    </div>
  );
};

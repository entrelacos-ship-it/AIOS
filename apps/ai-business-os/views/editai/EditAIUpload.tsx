import React, { useCallback, useRef, useState } from 'react';
import { UploadCloud, Film, X, Youtube, Smartphone } from 'lucide-react';
import { View, type EditAIFormatoDestino } from '../../types';

interface Props {
  onNavigate: (view: View, projectId?: string) => void;
}

export const EditAIUpload: React.FC<Props> = ({ onNavigate }) => {
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [formatoDestino, setFormatoDestino] = useState<EditAIFormatoDestino>('reels');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = (f: File) => {
    if (!f.type.startsWith('video/')) {
      setError('Arquivo deve ser um vídeo (mp4, mov, etc).');
      return;
    }
    setError('');
    setFile(f);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  }, []);

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('video', file);
      formData.append('formatoDestino', formatoDestino);

      const res = await fetch('/api/editai/upload', { method: 'POST', body: formData });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Upload falhou.');
      onNavigate(View.EDIT_AI_TRANSCRIBE, data.projectId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro no upload.');
      setUploading(false);
    }
  };

  return (
    <div className="relative overflow-hidden" style={{ background: '#0A0A0F', minHeight: '100vh', padding: 48, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 32 }}>
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgba(107,70,193,0.28),transparent_58%),radial-gradient(ellipse_at_85%_80%,rgba(20,184,166,0.12),transparent_34%)]" />
      <div className="relative w-full max-w-[720px] rounded-3xl border border-white/[0.08] bg-white/[0.045] backdrop-blur-xl shadow-[0_18px_70px_rgba(0,0,0,0.38)] p-8">
        <p className="text-[11px] font-mono uppercase tracking-[0.18em] text-[#14B8A6] mb-3">/// NOVO PROJETO</p>
        <h2 style={{ fontFamily: 'Syne, DM Sans, sans-serif', color: '#F8FAFC', fontSize: 30, fontWeight: 800, margin: '0 0 8px' }}>
          Novo Projeto EditAI
        </h2>
        <p style={{ color: '#CBD5E1', fontFamily: 'DM Sans, sans-serif', fontSize: 14, margin: '0 0 32px' }}>
          Envie o bruto. A IA prepara cortes, transcrição, cenas e render para você revisar com dignidade.
        </p>

        {/* Formato destino selector */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
          {([
            { id: 'reels' as const, label: 'Reels / TikTok / Shorts', sub: 'até 90s · 9:16', icon: Smartphone },
            { id: 'youtube' as const, label: 'YouTube', sub: 'até 20min · 16:9', icon: Youtube },
          ] as const).map(({ id, label, sub, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setFormatoDestino(id)}
              style={{
                flex: 1,
                padding: '16px 20px',
                background: formatoDestino === id ? 'rgba(107,70,193,0.20)' : 'rgba(255,255,255,0.045)',
                border: `1px solid ${formatoDestino === id ? '#8B5CF6' : 'rgba(255,255,255,0.08)'}`,
                borderRadius: 16,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                transition: 'all 0.15s',
              }}
            >
              <Icon size={22} style={{ color: formatoDestino === id ? '#FB923C' : '#CBD5E1', flexShrink: 0 }} />
              <div style={{ textAlign: 'left' }}>
                <p style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 700, fontSize: 14, color: formatoDestino === id ? '#F8FAFC' : '#CBD5E1', margin: 0 }}>
                  {label}
                </p>
                <p style={{ fontFamily: 'DM Mono, monospace', fontSize: 11, color: '#CBD5E1', margin: '2px 0 0' }}>
                  {sub}
                </p>
              </div>
            </button>
          ))}
        </div>

        {/* Drop zone */}
        <div
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          style={{
            border: `1px dashed ${dragging ? '#FB923C' : file ? '#14B8A6' : 'rgba(255,255,255,0.14)'}`,
            borderRadius: 20,
            padding: 48,
            cursor: 'pointer',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 16,
            background: dragging ? 'rgba(249,115,22,0.10)' : 'rgba(10,10,15,0.62)',
            transition: 'all 0.15s',
            minHeight: 200,
          }}
        >
          <input
            ref={inputRef}
            type="file"
            accept="video/*"
            style={{ display: 'none' }}
            onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
          />

          {file ? (
            <>
              <Film size={40} style={{ color: '#14B8A6' }} />
              <p style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 700, color: '#F8FAFC', margin: 0, textAlign: 'center' }}>
                {file.name}
              </p>
              <p style={{ fontFamily: 'DM Mono, monospace', fontSize: 12, color: '#CBD5E1', margin: 0 }}>
                {(file.size / 1024 / 1024).toFixed(1)} MB
              </p>
              <button
                onClick={(e) => { e.stopPropagation(); setFile(null); }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#8888AA', display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, fontFamily: 'DM Sans, sans-serif' }}
              >
                <X size={14} /> Remover
              </button>
            </>
          ) : (
            <>
              <UploadCloud size={42} style={{ color: '#8B5CF6', opacity: 0.9 }} />
              <p style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 700, color: '#F8FAFC', margin: 0 }}>
                Arraste seu vídeo aqui
              </p>
              <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 13, color: '#CBD5E1', margin: 0 }}>
                ou clique para selecionar · MP4, MOV, HEVC até 500 MB
              </p>
            </>
          )}
        </div>

        {error ? (
          <p style={{ color: '#EF4444', fontFamily: 'DM Sans, sans-serif', fontSize: 13, marginTop: 12 }}>{error}</p>
        ) : null}

        <button
          disabled={!file || uploading}
          onClick={handleUpload}
          style={{
            marginTop: 24,
            width: '100%',
            padding: '16px 0',
            background: file && !uploading ? 'linear-gradient(135deg, #6B46C1, #F97316)' : 'rgba(255,255,255,0.06)',
            color: file && !uploading ? '#FFFFFF' : '#64748B',
            border: 'none',
            borderRadius: 999,
            fontFamily: 'DM Sans, sans-serif',
            fontWeight: 700,
            fontSize: 16,
            cursor: file && !uploading ? 'pointer' : 'not-allowed',
            transition: 'all 0.15s',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 10,
            boxShadow: file && !uploading ? '0 12px 36px rgba(107,70,193,0.35)' : 'none',
          }}
        >
          {uploading ? (
            <>
              <span style={{ display: 'inline-block', width: 18, height: 18, border: '2px solid #8888AA', borderTopColor: '#F0F0F0', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
              Enviando...
            </>
          ) : (
            <>
              <UploadCloud size={18} />
              Começar transformação
            </>
          )}
        </button>
      </div>
    </div>
  );
};

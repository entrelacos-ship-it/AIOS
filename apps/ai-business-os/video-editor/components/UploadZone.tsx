'use client';

import { useState, useCallback } from 'react';
import type { EloCutProject } from '@/lib/types';

interface Props {
  onUpload: (project: EloCutProject) => void;
}

export default function UploadZone({ onUpload }: Props) {
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [prompt, setPrompt] = useState('');

  const handleFile = useCallback(async (file: File) => {
    if (!file.type.startsWith('video/')) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('video', file);
      if (prompt) fd.append('prompt', prompt);
      const res = await fetch('/api/upload', { method: 'POST', body: fd });
      const data = await res.json();
      if (data.project) onUpload(data.project);
    } finally {
      setUploading(false);
    }
  }, [prompt, onUpload]);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '80vh', gap: 32 }}>
      <div style={{ textAlign: 'center', maxWidth: 920 }}>
        <div style={{ display: 'inline-flex', padding: '8px 14px', borderRadius: 999, background: 'rgba(255,184,0,0.10)', color: '#FFCC4D', fontSize: 12, fontWeight: 700, marginBottom: 18 }}>
          Whisper + Claude + Remotion
        </div>
        <h1 style={{ fontSize: 60, fontWeight: 800, letterSpacing: '-2.5px', color: '#F0F0F8', lineHeight: 1.04 }}>
          Corte vertical premium<br /><span style={{ color: '#FFB800' }}>a partir do bruto</span>
        </h1>
        <p style={{ fontSize: 18, color: '#8C8B99', marginTop: 14, lineHeight: 1.6 }}>
          Faça upload do material bruto, acrescente direção editorial opcional e deixe o EloCut montar análise, cenas, legendas e render final em 9:16.
        </p>
      </div>

      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => document.getElementById('elocut-file')?.click()}
        style={{
          width: 560, height: 310, borderRadius: 28, cursor: 'pointer',
          background: dragging
            ? 'radial-gradient(circle at top, rgba(255,184,0,0.16), rgba(255,255,255,0.03))'
            : 'linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.02))',
          border: `1px dashed ${dragging ? '#FFB800' : 'rgba(255,255,255,0.10)'}`,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16,
          transition: 'all 0.2s',
          boxShadow: dragging ? '0 0 50px rgba(255,184,0,0.14)' : '0 30px 80px rgba(0,0,0,0.28)',
        }}
      >
        <input id="elocut-file" type="file" accept="video/*" style={{ display: 'none' }}
          onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
        <div style={{ width: 64, height: 64, borderRadius: 16, background: 'linear-gradient(135deg, #FFB800, #FF8C00)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {uploading
            ? <svg style={{ animation: 'spin 1s linear infinite' }} width="28" height="28" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="white" strokeWidth="3" strokeDasharray="60" strokeDashoffset="20"/></svg>
            : <svg width="28" height="28" viewBox="0 0 24 24" fill="none"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          }
        </div>
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontWeight: 700, fontSize: 16, color: '#F0F0F8' }}>{uploading ? 'Enviando...' : 'Arraste ou clique para enviar'}</p>
          <p style={{ fontSize: 13, color: '#8C8B99', marginTop: 6 }}>MP4, MOV, HEVC — até 500MB</p>
        </div>
      </div>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>

      <textarea
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder="Instruções para a IA (opcional) — ex: 'foco nas partes mais engraçadas'..."
        rows={4}
        style={{
          width: 560, borderRadius: 18, padding: '16px 18px', fontSize: 14, resize: 'none',
          background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', color: '#F0F0F8', outline: 'none', fontFamily: 'inherit',
          boxShadow: '0 16px 48px rgba(0,0,0,0.22)',
        }}
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 14, width: 960 }}>
        {[
          ['Upload', 'Recebe o bruto e registra direção editorial opcional.'],
          ['Whisper', 'Transcreve para legendas com timestamps.'],
          ['Claude', 'Quebra a narrativa em cenas e paleta visual.'],
          ['Remotion', 'Renderiza a composição final em MP4 vertical.'],
        ].map(([title, copy]) => (
          <div
            key={title}
            style={{
              borderRadius: 20,
              padding: 16,
              background: 'linear-gradient(180deg, rgba(22,22,30,0.95), rgba(12,12,18,0.95))',
              border: '1px solid rgba(255,255,255,0.06)',
            }}
          >
            <p style={{ color: '#F7F2EA', fontWeight: 700, fontSize: 14 }}>{title}</p>
            <p style={{ color: '#8C8B99', fontSize: 13, lineHeight: 1.6, marginTop: 8 }}>{copy}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

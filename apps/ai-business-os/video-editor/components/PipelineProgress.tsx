'use client';

import { useEffect, useRef } from 'react';
import type { EloCutProject, PipelineStep } from '@/lib/types';

interface Props {
  project: EloCutProject;
  step: PipelineStep;
  onStepComplete: (next: PipelineStep, updated?: EloCutProject) => void;
}

const STEPS = [
  { key: 'normalizing' as PipelineStep, label: 'Normalização', desc: 'Convertendo para H.264 30fps...' },
  { key: 'transcribing' as PipelineStep, label: 'Transcrição', desc: 'Groq Whisper transcrevendo áudio...' },
  { key: 'analyzing' as PipelineStep, label: 'Análise IA', desc: 'LLM identificando cenas e paleta...' },
];

const NEXT: Partial<Record<PipelineStep, PipelineStep>> = {
  normalizing: 'transcribing',
  transcribing: 'analyzing',
  analyzing: 'editing',
};

const API: Partial<Record<PipelineStep, string>> = {
  normalizing: '/api/normalize',
  transcribing: '/api/transcribe',
  analyzing: '/api/analyze',
};

export default function PipelineProgress({ project, step, onStepComplete }: Props) {
  const ran = useRef<PipelineStep | null>(null);

  useEffect(() => {
    if (ran.current === step) return;
    const api = API[step];
    if (!api) return;
    ran.current = step;

    fetch(api, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ project }),
    })
      .then(r => r.json())
      .then(data => {
        if (data.error) { onStepComplete('error'); return; }
        onStepComplete(NEXT[step] as PipelineStep, data.project);
      })
      .catch(() => onStepComplete('error'));
  }, [onStepComplete, project, step]);

  const currentIdx = STEPS.findIndex(s => s.key === step);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '80vh', gap: 40 }}>
      <div style={{ textAlign: 'center' }}>
        <h2 style={{ fontSize: 34, fontWeight: 800, color: '#F0F0F8' }}>Processando vídeo</h2>
        <p style={{ color: '#8C8B99', marginTop: 8 }}>O pipeline está normalizando, transcrevendo e montando a estrutura narrativa.</p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: 460 }}>
        {STEPS.map((s, i) => {
          const done = i < currentIdx;
          const active = i === currentIdx;
          return (
            <div key={s.key} style={{
              display: 'flex', alignItems: 'center', gap: 16,
              borderRadius: 18, padding: '18px 20px',
              background: active
                ? 'linear-gradient(180deg, rgba(255,184,0,0.08), rgba(19,19,26,0.96))'
                : 'linear-gradient(180deg, rgba(22,22,30,0.95), rgba(12,12,18,0.95))',
              border: `1px solid ${active ? '#FFB80055' : 'rgba(255,255,255,0.06)'}`,
              transition: 'all 0.3s',
              boxShadow: active ? '0 20px 40px rgba(255,184,0,0.08)' : '0 16px 32px rgba(0,0,0,0.20)',
            }}>
              <div style={{
                width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
                background: done ? '#FFB800' : active ? 'rgba(255,184,0,0.15)' : '#1E1E2E',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {done
                  ? <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 7l4 4 6-6" stroke="#050508" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  : active
                    ? <svg style={{ animation: 'spin 1s linear infinite' }} width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="7" r="5" stroke="#FFB800" strokeWidth="2" strokeDasharray="25" strokeDashoffset="8"/></svg>
                    : <span style={{ fontSize: 12, fontWeight: 700, color: '#6B6B8A' }}>{i + 1}</span>
                }
              </div>
              <div>
                <p style={{ fontWeight: 700, fontSize: 14, color: active ? '#FFB800' : done ? '#F0F0F8' : '#8C8B99' }}>{s.label}</p>
                {active && <p style={{ fontSize: 12, color: '#8C8B99', marginTop: 3 }}>{s.desc}</p>}
              </div>
            </div>
          );
        })}
      </div>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

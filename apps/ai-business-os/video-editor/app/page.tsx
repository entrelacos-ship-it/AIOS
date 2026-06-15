'use client';

import { useState } from 'react';
import UploadZone from '@/components/UploadZone';
import PipelineProgress from '@/components/PipelineProgress';
import EloCutEditor from '@/components/EloCutEditor';
import type { EloCutProject, PipelineStep } from '@/lib/types';

export default function Home() {
  const [project, setProject] = useState<EloCutProject | null>(null);
  const [step, setStep] = useState<PipelineStep>('idle');

  return (
    <main className="min-h-screen" style={{ background: 'radial-gradient(circle at top, rgba(255,184,0,0.08), transparent 26%), #050508' }}>
      <header style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', backdropFilter: 'blur(18px)' }}>
        <div style={{ maxWidth: 1600, margin: '0 auto', padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 36, height: 36, borderRadius: 12, background: 'linear-gradient(135deg, #FFB800, #FF8C00)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 10px 24px rgba(255,184,0,0.26)' }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M3 2L13 8L3 14V2Z" fill="white"/>
            </svg>
          </div>
            <div>
              <span style={{ fontWeight: 800, fontSize: 20, letterSpacing: '-0.5px', color: '#F0F0F8' }}>
                Elo<span style={{ color: '#FFB800' }}>Cut</span>
              </span>
              <p style={{ fontSize: 12, color: '#8C8B99', marginTop: 2 }}>Automatic editorial engine for vertical video</p>
            </div>
          </div>
          <span style={{ fontSize: 11, padding: '5px 10px', borderRadius: 999, background: '#FFB80018', color: '#FFB800', border: '1px solid #FFB80033', fontWeight: 700 }}>
            dev on :3333
          </span>
        </div>
      </header>

      <div style={{ maxWidth: 1600, margin: '0 auto', padding: '32px 24px' }}>
        {step === 'idle' && (
          <UploadZone onUpload={(p) => { setProject(p); setStep('normalizing'); }} />
        )}
        {step !== 'idle' && step !== 'editing' && step !== 'done' && project && (
          <PipelineProgress
            project={project}
            step={step}
            onStepComplete={(nextStep, updatedProject) => {
              setStep(nextStep);
              if (updatedProject) setProject(updatedProject);
            }}
          />
        )}
        {step === 'editing' && project && (
          <EloCutEditor project={project} onUpdate={setProject} />
        )}
        {step === 'error' && (
          <div style={{
            maxWidth: 720,
            margin: '100px auto 0',
            borderRadius: 24,
            padding: 28,
            background: 'linear-gradient(180deg, rgba(40,14,18,0.96), rgba(18,10,14,0.98))',
            border: '1px solid rgba(239,68,68,0.24)',
            color: '#F7F2EA',
          }}>
            <p style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#FCA5A5', fontWeight: 700 }}>Pipeline error</p>
            <p style={{ fontSize: 24, fontWeight: 800, marginTop: 10 }}>O processamento falhou.</p>
            <p style={{ fontSize: 14, color: '#D4B2B8', lineHeight: 1.7, marginTop: 10 }}>
              Verifique se `ffmpeg` está disponível no ambiente e se as chaves `GROQ_API_KEY` e `OPENROUTER_API_KEY` foram configuradas.
            </p>
            <button
              onClick={() => {
                setProject(null);
                setStep('idle');
              }}
              style={{
                marginTop: 18,
                border: 'none',
                borderRadius: 14,
                padding: '12px 16px',
                fontWeight: 700,
                fontSize: 14,
                cursor: 'pointer',
                background: 'linear-gradient(135deg, #FFB800 0%, #FF7A00 100%)',
                color: '#0B0905',
              }}
            >
              Voltar ao upload
            </button>
          </div>
        )}
      </div>
    </main>
  );
}

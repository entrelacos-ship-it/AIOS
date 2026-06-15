import React, { useEffect, useState } from 'react';
import { Scissors, CheckCircle2, XCircle, Clock, Loader2 } from 'lucide-react';
import type { EditAIVideoProject, EditAICutReport } from '../../types';
import { View } from '../../types';

interface Props {
  projectId: string;
  onNavigate: (view: View, projectId?: string) => void;
}

const TYPE_LABELS: Record<EditAICutReport['tipo'], string> = {
  silencio: 'Silêncio',
  gaguejo: 'Gaguejo',
  refazimento: 'Refazimento',
};

const TYPE_COLORS: Record<EditAICutReport['tipo'], string> = {
  silencio: '#8888AA',
  gaguejo: '#FFB800',
  refazimento: '#F44336',
};

export const EditAICutReportView: React.FC<Props> = ({ projectId, onNavigate }) => {
  const [project, setProject] = useState<EditAIVideoProject | null>(null);
  const [cuts, setCuts] = useState<EditAICutReport[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetch(`/api/editai/project/${projectId}`)
      .then((r) => r.json())
      .then((data: EditAIVideoProject) => {
        setProject(data);
        setCuts(data.cutReport ?? []);
      });
  }, [projectId]);

  const toggleCut = (index: number) => {
    setCuts((prev) => prev.map((c, i) => i === index ? { ...c, aprovado: !c.aprovado } : c));
  };

  const approvedCount = cuts.filter((c) => c.aprovado).length;
  const totalSaved = cuts.filter((c) => c.aprovado).reduce((sum, c) => sum + c.duracao, 0);

  const handleApply = async () => {
    setSubmitting(true);
    try {
      await fetch(`/api/editai/project/${projectId}/cuts/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cuts }),
      });
      onNavigate(View.EDIT_AI_PLAN_APPROVAL, projectId);
    } catch {
      setSubmitting(false);
    }
  };

  if (!project) {
    return (
      <div style={{ background: '#050508', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Loader2 size={24} style={{ color: '#FFB800', animation: 'spin 0.8s linear infinite' }} />
      </div>
    );
  }

  return (
    <div style={{ background: '#050508', minHeight: '100vh', padding: 48 }}>
      <div style={{ maxWidth: 800, margin: '0 auto' }}>
        <div style={{ marginBottom: 32 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
            <Scissors size={22} style={{ color: '#FFB800' }} />
            <h2 style={{ fontFamily: 'DM Sans, sans-serif', color: '#F0F0F0', fontSize: 22, fontWeight: 700, margin: 0 }}>
              Revisão de Cortes — Etapa 3
            </h2>
          </div>
          <p style={{ color: '#8888AA', fontFamily: 'DM Sans, sans-serif', fontSize: 14, margin: 0 }}>
            Revise e confirme cada corte detectado. Desative os que não quiser aplicar.
          </p>
        </div>

        {/* Summary bar */}
        <div style={{
          display: 'flex',
          gap: 24,
          background: '#0D0D14',
          border: '1px solid #1A1A2E',
          borderRadius: 12,
          padding: '16px 24px',
          marginBottom: 24,
          flexWrap: 'wrap',
        }}>
          <div>
            <p style={{ fontFamily: 'DM Mono, monospace', fontSize: 11, color: '#8888AA', margin: '0 0 4px', textTransform: 'uppercase', letterSpacing: 1 }}>Total detectado</p>
            <p style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 700, fontSize: 20, color: '#F0F0F0', margin: 0 }}>{cuts.length}</p>
          </div>
          <div>
            <p style={{ fontFamily: 'DM Mono, monospace', fontSize: 11, color: '#8888AA', margin: '0 0 4px', textTransform: 'uppercase', letterSpacing: 1 }}>Aprovados</p>
            <p style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 700, fontSize: 20, color: '#4CAF50', margin: 0 }}>{approvedCount}</p>
          </div>
          <div>
            <p style={{ fontFamily: 'DM Mono, monospace', fontSize: 11, color: '#8888AA', margin: '0 0 4px', textTransform: 'uppercase', letterSpacing: 1 }}>Tempo economizado</p>
            <p style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 700, fontSize: 20, color: '#FFB800', margin: 0 }}>{totalSaved.toFixed(1)}s</p>
          </div>
        </div>

        {/* Cut list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 32 }}>
          {cuts.length === 0 ? (
            <p style={{ color: '#8888AA', fontFamily: 'DM Sans, sans-serif', textAlign: 'center', padding: 32 }}>
              Nenhum corte detectado. O vídeo está limpo!
            </p>
          ) : cuts.map((cut, i) => (
            <div
              key={i}
              onClick={() => toggleCut(i)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 16,
                padding: '14px 20px',
                background: '#0D0D14',
                border: `1px solid ${cut.aprovado ? TYPE_COLORS[cut.tipo] + '55' : '#1A1A2E'}`,
                borderRadius: 10,
                cursor: 'pointer',
                opacity: cut.aprovado ? 1 : 0.5,
                transition: 'all 0.15s',
              }}
            >
              {cut.aprovado ? (
                <CheckCircle2 size={18} style={{ color: '#4CAF50', flexShrink: 0 }} />
              ) : (
                <XCircle size={18} style={{ color: '#8888AA', flexShrink: 0 }} />
              )}

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <span style={{
                    fontFamily: 'DM Mono, monospace',
                    fontSize: 11,
                    color: TYPE_COLORS[cut.tipo],
                    background: TYPE_COLORS[cut.tipo] + '22',
                    padding: '2px 8px',
                    borderRadius: 4,
                    textTransform: 'uppercase',
                    letterSpacing: 0.5,
                  }}>
                    {TYPE_LABELS[cut.tipo]}
                  </span>
                  <span style={{ fontFamily: 'DM Mono, monospace', fontSize: 11, color: '#8888AA' }}>
                    {cut.inicio.toFixed(2)}s → {cut.fim.toFixed(2)}s · {cut.duracao.toFixed(2)}s
                  </span>
                </div>
                <p style={{
                  fontFamily: 'DM Sans, sans-serif',
                  fontSize: 13,
                  color: '#8888AA',
                  margin: 0,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  fontStyle: 'italic',
                }}>
                  "...{cut.preview}..."
                </p>
              </div>

              <Clock size={14} style={{ color: '#8888AA', flexShrink: 0 }} />
            </div>
          ))}
        </div>

        <button
          disabled={submitting}
          onClick={handleApply}
          style={{
            width: '100%',
            padding: '16px 0',
            background: submitting ? '#1A1A2E' : '#FFB800',
            color: submitting ? '#8888AA' : '#050508',
            border: 'none',
            borderRadius: 12,
            fontFamily: 'DM Sans, sans-serif',
            fontWeight: 700,
            fontSize: 16,
            cursor: submitting ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 10,
          }}
        >
          {submitting ? (
            <><Loader2 size={18} style={{ animation: 'spin 0.8s linear infinite' }} /> Aplicando cortes...</>
          ) : (
            <><Scissors size={18} /> Aplicar {approvedCount} corte{approvedCount !== 1 ? 's' : ''} e gerar plano visual</>
          )}
        </button>
      </div>
    </div>
  );
};

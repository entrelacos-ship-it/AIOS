'use client';

import type { CSSProperties } from 'react';
import type { EloCutScene, SceneType, SentimentColor, VisualStyle } from '@/lib/types';

interface Props {
  scene: EloCutScene | null;
  maxSubtitleIndex: number;
  generating: boolean;
  onChange: (scene: EloCutScene) => void;
  onGenerateIllustration: () => void;
}

const panelStyle: CSSProperties = {
  borderRadius: 24,
  background: 'linear-gradient(180deg, rgba(20,20,28,0.94), rgba(9,9,14,0.94))',
  border: '1px solid rgba(255,255,255,0.08)',
  boxShadow: '0 24px 80px rgba(0,0,0,0.35)',
  padding: 20,
  display: 'flex',
  flexDirection: 'column',
  gap: 16,
};

const labelStyle: CSSProperties = {
  fontSize: 11,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  color: '#8C8B99',
  fontWeight: 700,
  marginBottom: 8,
};

const inputStyle: CSSProperties = {
  width: '100%',
  borderRadius: 14,
  border: '1px solid rgba(255,255,255,0.08)',
  background: 'rgba(255,255,255,0.03)',
  color: '#F8F5EF',
  padding: '12px 14px',
  fontFamily: 'inherit',
  fontSize: 14,
  outline: 'none',
};

const selectStyle: CSSProperties = {
  ...inputStyle,
  appearance: 'none',
};

const sceneTypes: SceneType[] = ['hook', 'talking_head', 'text_reveal', 'outro'];
const visualStyles: VisualStyle[] = ['energetic', 'kinetic', 'minimal', 'dramatic'];
const sentiments: SentimentColor[] = ['neutral', 'positive', 'negative', 'excited', 'calm'];

function clampNumber(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

export default function SceneInspector({
  scene,
  maxSubtitleIndex,
  generating,
  onChange,
  onGenerateIllustration,
}: Props) {
  if (!scene) {
    return (
      <div style={panelStyle}>
        <p style={{ ...labelStyle, marginBottom: 0 }}>Cena</p>
        <p style={{ color: '#F8F5EF', fontSize: 16, fontWeight: 700 }}>Nenhuma cena selecionada</p>
        <p style={{ color: '#8C8B99', fontSize: 14, lineHeight: 1.6 }}>
          Escolha uma cena na coluna da esquerda para editar texto, timing, prompt visual e ilustração.
        </p>
      </div>
    );
  }

  return (
    <div style={panelStyle}>
      <div>
        <p style={{ ...labelStyle, marginBottom: 6 }}>Cena selecionada</p>
        <p style={{ color: '#F8F5EF', fontSize: 20, fontWeight: 700 }}>{scene.title}</p>
        <p style={{ color: '#8C8B99', fontSize: 13, marginTop: 6 }}>
          Ajuste estrutura, copy e prompt visual antes do render final.
        </p>
      </div>

      <div>
        <p style={labelStyle}>Título</p>
        <input
          value={scene.title}
          onChange={(event) => onChange({ ...scene, title: event.target.value })}
          style={inputStyle}
        />
      </div>

      <div>
        <p style={labelStyle}>Descrição</p>
        <textarea
          value={scene.description}
          onChange={(event) => onChange({ ...scene, description: event.target.value })}
          rows={4}
          style={{ ...inputStyle, resize: 'vertical', minHeight: 110 }}
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div>
          <p style={labelStyle}>Tipo</p>
          <select
            value={scene.type}
            onChange={(event) => onChange({ ...scene, type: event.target.value as SceneType })}
            style={selectStyle}
          >
            {sceneTypes.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </div>
        <div>
          <p style={labelStyle}>Estilo</p>
          <select
            value={scene.visualStyle}
            onChange={(event) => onChange({ ...scene, visualStyle: event.target.value as VisualStyle })}
            style={selectStyle}
          >
            {visualStyles.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
        <div>
          <p style={labelStyle}>Início</p>
          <input
            type="number"
            min={0}
            max={maxSubtitleIndex}
            value={scene.startLeg}
            onChange={(event) =>
              onChange({
                ...scene,
                startLeg: clampNumber(Number(event.target.value || 0), 0, maxSubtitleIndex),
                endLeg: Math.max(scene.endLeg, Number(event.target.value || 0)),
              })
            }
            style={inputStyle}
          />
        </div>
        <div>
          <p style={labelStyle}>Fim</p>
          <input
            type="number"
            min={0}
            max={maxSubtitleIndex}
            value={scene.endLeg}
            onChange={(event) =>
              onChange({
                ...scene,
                endLeg: clampNumber(Number(event.target.value || 0), scene.startLeg, maxSubtitleIndex),
              })
            }
            style={inputStyle}
          />
        </div>
        <div>
          <p style={labelStyle}>Sentimento</p>
          <select
            value={scene.sentiment}
            onChange={(event) => onChange({ ...scene, sentiment: event.target.value as SentimentColor })}
            style={selectStyle}
          >
            {sentiments.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div>
          <p style={labelStyle}>Cor base</p>
          <input
            value={scene.backgroundColor}
            onChange={(event) => onChange({ ...scene, backgroundColor: event.target.value })}
            style={inputStyle}
          />
        </div>
        <div>
          <p style={labelStyle}>Acento</p>
          <input
            value={scene.accentColor}
            onChange={(event) => onChange({ ...scene, accentColor: event.target.value })}
            style={inputStyle}
          />
        </div>
      </div>

      <div>
        <p style={labelStyle}>Keywords</p>
        <input
          value={scene.keywords.join(', ')}
          onChange={(event) =>
            onChange({
              ...scene,
              keywords: event.target.value
                .split(',')
                .map((item) => item.trim())
                .filter(Boolean),
            })
          }
          style={inputStyle}
        />
      </div>

      <div>
        <p style={labelStyle}>Prompt de ilustração</p>
        <textarea
          value={scene.illustrationPrompt ?? ''}
          onChange={(event) => onChange({ ...scene, illustrationPrompt: event.target.value })}
          rows={5}
          style={{ ...inputStyle, resize: 'vertical', minHeight: 130 }}
        />
      </div>

      <div>
        <p style={labelStyle}>Ilustração</p>
        {scene.illustrationUrl ? (
          <div
            style={{
              overflow: 'hidden',
              borderRadius: 18,
              border: '1px solid rgba(255,255,255,0.08)',
              background: '#09090E',
            }}
          >
            <img
              src={scene.illustrationUrl}
              alt={scene.title}
              style={{ display: 'block', width: '100%', aspectRatio: '1 / 1', objectFit: 'cover' }}
            />
          </div>
        ) : (
          <div
            style={{
              borderRadius: 18,
              padding: 18,
              border: '1px dashed rgba(255,255,255,0.14)',
              color: '#8C8B99',
              fontSize: 13,
              textAlign: 'center',
              background: 'rgba(255,255,255,0.02)',
            }}
          >
            Nenhuma ilustração gerada ainda para esta cena.
          </div>
        )}
      </div>

      <button
        onClick={onGenerateIllustration}
        disabled={generating || !(scene.illustrationPrompt || scene.title)}
        style={{
          border: 'none',
          borderRadius: 16,
          padding: '14px 18px',
          fontWeight: 700,
          fontSize: 14,
          cursor: generating ? 'wait' : 'pointer',
          background: generating
            ? 'rgba(255,184,0,0.18)'
            : 'linear-gradient(135deg, #FFB800 0%, #FF7A00 100%)',
          color: generating ? '#FFE08A' : '#0B0A06',
          boxShadow: generating ? 'none' : '0 16px 32px rgba(255,184,0,0.22)',
        }}
      >
        {generating ? 'Gerando ilustração...' : 'Gerar ilustração IA'}
      </button>
    </div>
  );
}

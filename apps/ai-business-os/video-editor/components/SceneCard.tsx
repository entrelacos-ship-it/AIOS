'use client';

import type { EloCutScene } from '@/lib/types';

interface Props {
  scene: EloCutScene;
  index: number;
  selected: boolean;
  onClick: () => void;
  onUpdate: (scene: EloCutScene) => void;
}

const TYPE_LABELS: Record<string, string> = {
  hook: 'Hook',
  talking_head: 'Talking Head',
  text_reveal: 'Text Reveal',
  outro: 'Outro',
};

const SENTIMENT_COLORS: Record<string, string> = {
  neutral: '#6B6B8A', positive: '#22C55E', negative: '#EF4444',
  excited: '#FFB800', calm: '#60A5FA',
};

export default function SceneCard({ scene, index, selected, onClick }: Props) {
  return (
    <div onClick={onClick} style={{
      borderRadius: 20,
      padding: 16,
      cursor: 'pointer',
      background: selected
        ? 'linear-gradient(180deg, rgba(255,184,0,0.10), rgba(20,20,26,0.96))'
        : 'linear-gradient(180deg, rgba(22,22,30,0.95), rgba(12,12,18,0.95))',
      border: `1px solid ${selected ? 'rgba(255,184,0,0.38)' : 'rgba(255,255,255,0.06)'}`,
      boxShadow: selected ? '0 20px 40px rgba(255,184,0,0.10)' : '0 12px 24px rgba(0,0,0,0.18)',
      transition: 'all 0.2s ease',
    }}>
      <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
        <div style={{
          width: 42, height: 42, borderRadius: 14, flexShrink: 0,
          background: `linear-gradient(135deg, ${scene.backgroundColor}, ${scene.accentColor})`,
          boxShadow: `0 10px 24px ${scene.accentColor}22`,
        }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 11, padding: '3px 8px', borderRadius: 999, background: 'rgba(255,255,255,0.06)', color: '#A5A3B5' }}>
              {TYPE_LABELS[scene.type] ?? scene.type}
            </span>
            <span
              style={{
                fontSize: 11,
                padding: '3px 8px',
                borderRadius: 999,
                background: `${scene.accentColor}18`,
                color: scene.accentColor,
              }}
            >
              {scene.visualStyle}
            </span>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: SENTIMENT_COLORS[scene.sentiment] ?? '#6B6B8A', flexShrink: 0 }} />
          </div>
          <p style={{ fontWeight: 700, fontSize: 14, color: '#F7F2EA', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {index + 1}. {scene.title}
          </p>
          <p style={{ fontSize: 12, color: '#8C8B99', marginTop: 5, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', lineHeight: 1.5 }}>
            {scene.description}
          </p>
          <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
            {scene.keywords.slice(0, 3).map((kw) => (
              <span key={kw} style={{ fontSize: 11, padding: '3px 8px', borderRadius: 8, background: `${scene.accentColor}14`, color: scene.accentColor, border: `1px solid ${scene.accentColor}33` }}>
                {kw}
              </span>
            ))}
          </div>
        </div>
        <div style={{ fontSize: 11, fontFamily: 'monospace', color: '#8C8B99', flexShrink: 0 }}>
          {scene.startLeg}–{scene.endLeg}
        </div>
      </div>
    </div>
  );
}

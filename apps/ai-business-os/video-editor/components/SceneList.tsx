'use client';

import SceneCard from './SceneCard';
import type { EloCutProject, EloCutScene } from '@/lib/types';

interface Props {
  project: EloCutProject;
  selectedId: string | null;
  onSelect: (id: string) => void;
  onUpdate: (scenes: EloCutScene[]) => void;
}

export default function SceneList({ project, selectedId, onSelect, onUpdate }: Props) {
  const scenes = project.analysis?.scenes ?? [];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, overflowY: 'auto', maxHeight: 'calc(100vh - 260px)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
        <div>
          <p style={{ fontSize: 13, fontWeight: 700, color: '#F7F2EA' }}>{scenes.length} cenas</p>
          <p style={{ fontSize: 12, color: '#8C8B99', marginTop: 2 }}>Revisão estrutural do corte</p>
        </div>
        <p style={{ fontSize: 12, color: '#8C8B99' }}>{project.subtitles.length} legendas</p>
      </div>
      {scenes.map((scene, i) => (
        <SceneCard
          key={scene.id}
          scene={scene}
          index={i}
          selected={selectedId === scene.id}
          onClick={() => onSelect(scene.id)}
          onUpdate={(updated) => onUpdate(scenes.map(s => s.id === updated.id ? updated : s))}
        />
      ))}
    </div>
  );
}

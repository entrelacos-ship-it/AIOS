import React, { useRef, useState } from 'react';
import { DesignDirection, DesignBrief, DesignArtifact, View } from '../../types';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';

interface Props {
  directions: DesignDirection[];
  brief: DesignBrief;
  onSelectDirection: (artifact: DesignArtifact) => void;
  onViewChange: (view: View) => void;
}

const SCHOOL_LABELS: Record<string, string> = {
  pentagram: 'Pentagram',
  ia_typography: 'IA Typography',
  kenya_hara: 'Kenya Hara',
  field_generative: 'Field Generative',
  stamen: 'Stamen',
};

const PreviewPane: React.FC<{ html: string; title: string }> = ({ html, title }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.28);

  React.useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const obs = new ResizeObserver((entries) => {
      const w = entries[0].contentRect.width;
      setScale(w / 1200);
    });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const isValid = html.length >= 200 && html.includes('</html>');

  return (
    <div
      ref={containerRef}
      className="relative w-full bg-[#0d0d0d] rounded-lg border border-border overflow-hidden"
      style={{ aspectRatio: '4/3' }}
    >
      {!isValid ? (
        <div className="absolute inset-0 flex items-center justify-center text-gray-500 text-xs text-center px-4">
          Preview indisponível
        </div>
      ) : (
        <iframe
          srcDoc={html}
          title={title}
          sandbox="allow-scripts allow-same-origin"
          style={{
            width: '1200px',
            height: '900px',
            border: 'none',
            transformOrigin: 'top left',
            transform: `scale(${scale})`,
            pointerEvents: 'none',
          }}
        />
      )}
    </div>
  );
};

const DirectionCard: React.FC<{
  direction: DesignDirection;
  brief: DesignBrief;
  onSelect: (artifact: DesignArtifact) => void;
  onViewChange: (view: View) => void;
}> = ({ direction, brief, onSelect, onViewChange }) => {
  const handleDevelop = () => {
    const artifact: DesignArtifact = {
      id: `dir-${Date.now()}-${direction.id}`,
      brief: {
        ...brief,
        title: `${brief.title} — ${direction.title}`,
        philosophySchool: direction.school,
      },
      htmlContent: direction.htmlPreview,
      createdAt: new Date().toISOString(),
    };
    onSelect(artifact);
    onViewChange(View.DESIGN_STUDIO_WORKSPACE);
  };

  return (
    <div className="flex flex-col gap-4 flex-1 min-w-0 bg-[#111] border border-border rounded-xl p-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <span className="text-xs text-gray-500 font-medium uppercase tracking-wider">
            Direção {direction.id}
          </span>
          <h3 className="text-white font-semibold text-base leading-tight mt-0.5">{direction.title}</h3>
        </div>
        <Badge variant="default" className="shrink-0 text-violet-300 bg-violet-500/20 border-violet-500/30">
          {SCHOOL_LABELS[direction.school] ?? direction.school}
        </Badge>
      </div>

      <PreviewPane html={direction.htmlPreview} title={direction.title} />

      <p className="text-sm text-gray-400 leading-relaxed">{direction.rationale}</p>

      {direction.keyDecisions.length > 0 && (
        <ul className="space-y-1">
          {direction.keyDecisions.map((d, i) => (
            <li key={i} className="flex items-start gap-2 text-xs text-gray-500">
              <span className="text-violet-400 mt-0.5 shrink-0">→</span>
              <span>{d}</span>
            </li>
          ))}
        </ul>
      )}

      <div className="flex flex-wrap gap-2">
        {direction.colorPalette.map((c, i) => (
          <div key={i} className="flex items-center gap-1.5 text-xs text-gray-400">
            <span
              className="w-3 h-3 rounded-full border border-border shrink-0"
              style={{ background: c }}
            />
            <code className="font-mono text-[10px]">{c}</code>
          </div>
        ))}
      </div>

      <p className="text-xs text-gray-500 italic">{direction.typographyNote}</p>

      <Button size="sm" variant="default" className="self-end mt-auto" onClick={handleDevelop}>
        Desenvolver esta direção →
      </Button>
    </div>
  );
};

export const DesignStudioAdvisor: React.FC<Props> = ({ directions, brief, onSelectDirection, onViewChange }) => {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-xl font-semibold text-white">Diretor de Conceito</h2>
        <p className="text-sm text-gray-500 mt-1">
          3 direções estratégicas para <span className="text-gray-300">"{brief.title}"</span>. Escolha uma para desenvolver.
        </p>
      </div>

      <div className="flex gap-4 items-start">
        {directions.map((dir) => (
          <DirectionCard
            key={dir.id}
            direction={dir}
            brief={brief}
            onSelect={onSelectDirection}
            onViewChange={onViewChange}
          />
        ))}
      </div>
    </div>
  );
};

import React, { useRef, useState } from 'react';
import { DesignVariationsResult, DesignBrief } from '../../types';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { generateDesignArtifact } from '../../services/designStudioService';
import { DesignArtifact } from '../../types';
import { View } from '../../types';

const VARIATION_LABELS: Record<string, { label: string; color: string }> = {
  conservadora: { label: 'Conservadora', color: 'bg-blue-500/20 text-blue-300 border-blue-500/30' },
  experimental: { label: 'Experimental', color: 'bg-violet-500/20 text-violet-300 border-violet-500/30' },
  síntese: { label: 'Síntese', color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' },
};

interface Props {
  result: DesignVariationsResult;
  onSelectVariation: (artifact: DesignArtifact) => void;
  onViewChange: (view: View) => void;
}

const VariationPane: React.FC<{
  html: string;
  hint: string;
  brief: DesignBrief;
  onSelect: (artifact: DesignArtifact) => void;
  onViewChange: (view: View) => void;
}> = ({ html, hint, brief, onSelect, onViewChange }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.33);

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

  const meta = VARIATION_LABELS[hint] ?? { label: hint, color: 'bg-gray-500/20 text-gray-300 border-gray-500/30' };

  const handleOpen = () => {
    const artifact: DesignArtifact = {
      id: `var-${Date.now()}-${hint}`,
      brief: { ...brief, title: `${brief.title} — ${meta.label}` },
      htmlContent: html,
      createdAt: new Date().toISOString(),
    };
    onSelect(artifact);
    onViewChange(View.DESIGN_STUDIO_WORKSPACE);
  };

  const isValid = html.length >= 200 && html.includes('</html>');

  return (
    <div className="flex flex-col gap-3 flex-1 min-w-0">
      <div className="flex items-center justify-between">
        <span className={`text-xs px-2 py-0.5 rounded border font-medium ${meta.color}`}>
          {meta.label}
        </span>
        <Button size="sm" variant="ghost" onClick={handleOpen} disabled={!isValid}>
          Abrir no Workspace →
        </Button>
      </div>

      <div
        ref={containerRef}
        className="relative w-full bg-[#111] rounded-lg border border-border overflow-hidden"
        style={{ aspectRatio: '16/9' }}
      >
        {!isValid ? (
          <div className="absolute inset-0 flex items-center justify-center text-red-400 text-sm text-center px-4">
            {html.length < 200 ? 'Saída inválida — Regenerar' : 'Saída truncada'}
          </div>
        ) : (
          <iframe
            srcDoc={html}
            title={`Variação ${meta.label}`}
            sandbox="allow-scripts allow-same-origin"
            style={{
              width: '1200px',
              height: `${1200 / (16 / 9)}px`,
              border: 'none',
              transformOrigin: 'top left',
              transform: `scale(${scale})`,
              pointerEvents: 'none',
            }}
          />
        )}
      </div>
    </div>
  );
};

export const DesignStudioVariations: React.FC<Props> = ({ result, onSelectVariation, onViewChange }) => {
  const [regenerating, setRegenerating] = useState<string | null>(null);
  const [localVariations, setLocalVariations] = useState(result.variations);

  const handleRegenerate = async (hint: string) => {
    setRegenerating(hint);
    try {
      const html = await generateDesignArtifact({ ...result.brief });
      setLocalVariations((prev) =>
        prev.map((v) => (v.hint === hint ? { ...v, htmlContent: html } : v)),
      );
    } finally {
      setRegenerating(null);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-white">{result.brief.title}</h2>
          <p className="text-sm text-gray-500 mt-1">
            3 variações — {result.brief.philosophySchool} · {result.brief.outputType}
          </p>
        </div>
        <Badge variant="default">{new Date(result.createdAt).toLocaleDateString('pt-BR')}</Badge>
      </div>

      <div className="flex gap-4 items-start">
        {localVariations.map((v) => (
          <div key={v.hint} className="flex flex-col flex-1 min-w-0 gap-2">
            <VariationPane
              html={v.htmlContent}
              hint={v.hint}
              brief={result.brief}
              onSelect={onSelectVariation}
              onViewChange={onViewChange}
            />
            <Button
              size="sm"
              variant="ghost"
              className="self-start text-xs text-gray-500"
              onClick={() => handleRegenerate(v.hint)}
              disabled={!!regenerating}
            >
              {regenerating === v.hint ? 'Gerando...' : 'Regenerar esta variação'}
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
};

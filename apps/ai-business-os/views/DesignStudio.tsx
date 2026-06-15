import React, { useState } from 'react';
import { View } from '../types';
import type { DesignArtifact, DesignVariationsResult, DesignDirection, DesignBrief } from '../types';
import { DesignStudioDashboard } from './design-studio/DesignStudioDashboard';
import { DesignStudioWorkspace } from './design-studio/DesignStudioWorkspace';
import { DesignStudioCritique } from './design-studio/DesignStudioCritique';
import { DesignStudioHistory } from './design-studio/DesignStudioHistory';
import { DesignStudioVariations } from './design-studio/DesignStudioVariations';
import { DesignStudioAdvisor } from './design-studio/DesignStudioAdvisor';

interface DesignStudioProps {
  view: string;
  onViewChange?: (view: View) => void;
}

export const DesignStudio: React.FC<DesignStudioProps> = ({ view, onViewChange }) => {
  const [activeArtifact, setActiveArtifact] = useState<DesignArtifact | null>(null);
  const [activeVariations, setActiveVariations] = useState<DesignVariationsResult | null>(null);
  const [activeDirections, setActiveDirections] = useState<{ directions: DesignDirection[]; brief: DesignBrief } | null>(null);

  const navigateTo = (v: View) => {
    if (onViewChange) onViewChange(v);
  };

  const handleArtifactGenerated = (artifact: DesignArtifact) => {
    setActiveArtifact(artifact);
    navigateTo(View.DESIGN_STUDIO_WORKSPACE);
  };

  const handleVariationsGenerated = (result: DesignVariationsResult) => {
    setActiveVariations(result);
    navigateTo(View.DESIGN_STUDIO_VARIATIONS);
  };

  const handleDirectionsGenerated = (directions: DesignDirection[], brief: DesignBrief) => {
    setActiveDirections({ directions, brief });
    navigateTo(View.DESIGN_STUDIO_ADVISOR);
  };

  const handleCritiqueReady = (artifact: DesignArtifact) => {
    setActiveArtifact(artifact);
    navigateTo(View.DESIGN_STUDIO_CRITIQUE);
  };

  const handleSelectFromHistory = (artifact: DesignArtifact) => {
    setActiveArtifact(artifact);
    navigateTo(View.DESIGN_STUDIO_WORKSPACE);
  };

  if (view === View.DESIGN_STUDIO_WORKSPACE && activeArtifact) {
    return (
      <DesignStudioWorkspace
        artifact={activeArtifact}
        onArtifactUpdate={setActiveArtifact}
        onCritiqueReady={handleCritiqueReady}
        onNewBrief={() => navigateTo(View.DESIGN_STUDIO_DASHBOARD)}
      />
    );
  }

  if (view === View.DESIGN_STUDIO_CRITIQUE && activeArtifact?.critiqueScore) {
    return (
      <DesignStudioCritique
        artifact={activeArtifact}
        onBack={() => navigateTo(View.DESIGN_STUDIO_WORKSPACE)}
      />
    );
  }

  if (view === View.DESIGN_STUDIO_HISTORY) {
    return (
      <DesignStudioHistory
        onSelectArtifact={handleSelectFromHistory}
        onNewBrief={() => navigateTo(View.DESIGN_STUDIO_DASHBOARD)}
      />
    );
  }

  if (view === View.DESIGN_STUDIO_VARIATIONS && activeVariations) {
    return (
      <DesignStudioVariations
        result={activeVariations}
        onSelectVariation={setActiveArtifact}
        onViewChange={navigateTo}
      />
    );
  }

  if (view === View.DESIGN_STUDIO_ADVISOR && activeDirections) {
    return (
      <DesignStudioAdvisor
        directions={activeDirections.directions}
        brief={activeDirections.brief}
        onSelectDirection={setActiveArtifact}
        onViewChange={navigateTo}
      />
    );
  }

  return (
    <DesignStudioDashboard
      onArtifactGenerated={handleArtifactGenerated}
      onVariationsGenerated={handleVariationsGenerated}
      onDirectionsGenerated={handleDirectionsGenerated}
    />
  );
};

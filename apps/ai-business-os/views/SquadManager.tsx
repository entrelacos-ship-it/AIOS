import React, { useState } from 'react';
import { View } from '../types';
import { SquadDashboard } from './squad-manager/SquadDashboard';
import { SquadBuilder } from './squad-manager/SquadBuilder';
import { SquadRunner } from './squad-manager/SquadRunner';
import { SquadAIWizard } from './squad-manager/SquadAIWizard';

interface Props {
  view: View;
  onViewChange: (view: View) => void;
}

interface NavMeta {
  squadId?: string;
  runId?: string;
}

export const SquadManager: React.FC<Props> = ({ view, onViewChange }) => {
  const [meta, setMeta] = useState<NavMeta>({});

  const handleNavigate = (target: View, m?: NavMeta) => {
    if (m) setMeta(m);
    onViewChange(target);
  };

  if (view === View.SQUAD_MANAGER_AI_WIZARD) {
    return (
      <SquadAIWizard
        onSquadCreated={() => onViewChange(View.SQUAD_MANAGER)}
        onBack={() => onViewChange(View.SQUAD_MANAGER)}
      />
    );
  }

  if (view === View.SQUAD_MANAGER_BUILDER) {
    return (
      <SquadBuilder
        squadId={meta.squadId}
        onNavigate={(v) => handleNavigate(v)}
      />
    );
  }

  if (view === View.SQUAD_MANAGER_RUN) {
    return (
      <SquadRunner
        squadId={meta.squadId}
        runId={meta.runId}
        onNavigate={(v) => handleNavigate(v)}
      />
    );
  }

  return (
    <SquadDashboard onNavigate={handleNavigate} />
  );
};

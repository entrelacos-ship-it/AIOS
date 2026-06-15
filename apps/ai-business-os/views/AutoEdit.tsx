import React, { useState } from 'react';
import { View } from '../types';
import { AutoEditDashboard } from './auto-edit/AutoEditDashboard';
import { AutoEditUpload } from './auto-edit/AutoEditUpload';
import { AutoEditWorkspace } from './auto-edit/AutoEditWorkspace';

interface Props {
  view: View;
  onViewChange: (view: View) => void;
}

interface NavMeta {
  projectId?: string;
}

export const AutoEdit: React.FC<Props> = ({ view, onViewChange }) => {
  const [meta, setMeta] = useState<NavMeta>({});

  const handleNavigate = (target: View, m?: NavMeta) => {
    if (m) setMeta((prev) => ({ ...prev, ...m }));
    onViewChange(target);
  };

  if (view === View.AUTO_EDIT_UPLOAD) {
    return <AutoEditUpload onNavigate={handleNavigate} />;
  }

  if (view === View.AUTO_EDIT_WORKSPACE && meta.projectId) {
    return (
      <AutoEditWorkspace
        projectId={meta.projectId}
        onNavigate={(v) => handleNavigate(v)}
      />
    );
  }

  return <AutoEditDashboard onNavigate={handleNavigate} />;
};

import React, { useCallback, useState } from 'react';
import { View } from '../types';
import { EditAIDashboard } from './editai/EditAIDashboard';
import { EditAIUpload } from './editai/EditAIUpload';
import { EditAIWorkspace } from './editai/EditAIWorkspace';

interface EditAIViewProps {
  view: View;
  onViewChange?: (view: View) => void;
}

export const EditAIView: React.FC<EditAIViewProps> = ({ view, onViewChange }) => {
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);

  const navigate = useCallback(
    (nextView: View, projectId?: string) => {
      if (projectId) setActiveProjectId(projectId);
      onViewChange?.(nextView);
    },
    [onViewChange],
  );

  // Views that don't require an active project
  if (view === View.EDIT_AI || view === View.EDIT_AI_DASHBOARD) {
    return <EditAIDashboard onNavigate={navigate} />;
  }

  if (view === View.EDIT_AI_UPLOAD) {
    return <EditAIUpload onNavigate={navigate} />;
  }

  // All other views require an active project
  if (!activeProjectId) {
    return <EditAIDashboard onNavigate={navigate} />;
  }

  switch (view) {
    case View.EDIT_AI_TRANSCRIBE:
    case View.EDIT_AI_CUT_REPORT:
    case View.EDIT_AI_PLAN_APPROVAL:
    case View.EDIT_AI_RENDER:
    case View.EDIT_AI_REVIEW:
      return <EditAIWorkspace projectId={activeProjectId} onNavigate={navigate} />;
    default:
      return <EditAIDashboard onNavigate={navigate} />;
  }
};

import React, { useState } from 'react';
import { View } from '../types';
import { CloneLibrary } from './clone-studio/CloneLibrary';
import { CloneChat } from './clone-studio/CloneChat';
import { CloneBuilder } from './clone-studio/CloneBuilder';

interface Props {
  view: View;
  onViewChange: (view: View) => void;
}

interface NavMeta {
  cloneId?: string;
}

export const CloneStudio: React.FC<Props> = ({ view, onViewChange }) => {
  const [meta, setMeta] = useState<NavMeta>({});

  const handleNavigate = (target: View, m?: NavMeta) => {
    if (m) setMeta(m);
    onViewChange(target);
  };

  if (view === View.CLONE_STUDIO_CHAT && meta.cloneId) {
    return <CloneChat cloneId={meta.cloneId} onNavigate={(v) => handleNavigate(v)} />;
  }

  if (view === View.CLONE_STUDIO_BUILDER) {
    return <CloneBuilder onNavigate={(v) => handleNavigate(v)} />;
  }

  return <CloneLibrary onNavigate={handleNavigate} />;
};

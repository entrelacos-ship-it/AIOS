import React, { useState } from 'react';
import { View } from '../types';
import { CarouselDashboard } from './carousel-studio/CarouselDashboard';
import { CarouselViewer } from './carousel-studio/CarouselViewer';

interface Props {
  view: View;
  onViewChange: (view: View) => void;
}

interface NavMeta {
  draftId?: string;
}

export const CarouselStudio: React.FC<Props> = ({ view, onViewChange }) => {
  const [meta, setMeta] = useState<NavMeta>({});

  const handleNavigate = (target: View, m?: NavMeta) => {
    if (m) setMeta(m);
    onViewChange(target);
  };

  if (view === View.CAROUSEL_STUDIO_VIEWER && meta.draftId) {
    return (
      <CarouselViewer
        draftId={meta.draftId}
        onNavigate={handleNavigate}
      />
    );
  }

  return (
    <CarouselDashboard onNavigate={handleNavigate} />
  );
};

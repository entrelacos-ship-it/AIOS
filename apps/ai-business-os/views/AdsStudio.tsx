import React from 'react';
import { View } from '../types';
import { AdsStudioDashboard } from './ads-studio/AdsStudioDashboard';
import { AdsAudit } from './ads-studio/AdsAudit';
import { AdsCopy } from './ads-studio/AdsCopy';
import { AdsStrategy } from './ads-studio/AdsStrategy';

interface Props {
  view: View;
  onViewChange: (view: View) => void;
}

export const AdsStudio: React.FC<Props> = ({ view, onViewChange }) => {
  if (view === View.ADS_STUDIO_AUDIT) return <AdsAudit onNavigate={onViewChange} />;
  if (view === View.ADS_STUDIO_COPY) return <AdsCopy onNavigate={onViewChange} />;
  if (view === View.ADS_STUDIO_STRATEGY) return <AdsStrategy onNavigate={onViewChange} />;
  return <AdsStudioDashboard onNavigate={onViewChange} />;
};

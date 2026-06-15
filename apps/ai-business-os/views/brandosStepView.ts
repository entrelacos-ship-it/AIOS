import { View } from '../types';

export const BRANDING_OS_STEP_TO_VIEW: Record<number, View> = {
  0: View.BRANDING_OS_MANIFESTO,
  1: View.BRANDING_OS_EDITORIAL_LINES,
  2: View.BRANDING_OS_CALENDAR,
  3: View.BRANDING_OS_ASSET,
  4: View.BRANDING_OS_CONTEXT,
  5: View.BRANDING_OS_OBJECTIVE,
  6: View.BRANDING_OS_CONTENT,
  7: View.BRANDING_OS_VISUAL,
  8: View.BRANDING_OS_EXPORT,
};

export const BRANDING_OS_VIEW_TO_STEP: Partial<Record<View, number>> = {
  [View.BRANDING_OS]: 0,
  [View.BRANDING_OS_MANIFESTO]: 0,
  [View.BRANDING_OS_EDITORIAL_LINES]: 1,
  [View.BRANDING_OS_CALENDAR]: 2,
  [View.BRANDING_OS_ASSET]: 3,
  [View.BRANDING_OS_CONTEXT]: 4,
  [View.BRANDING_OS_OBJECTIVE]: 5,
  [View.BRANDING_OS_CONTENT]: 6,
  [View.BRANDING_OS_VISUAL]: 7,
  [View.BRANDING_OS_EXPORT]: 8,
};

export const resolveBrandingStepFromView = (view?: View) => {
  if (!view) {
    return 0;
  }

  return BRANDING_OS_VIEW_TO_STEP[view] ?? 0;
};

export const resolveBrandingViewFromStep = (step: number) => {
  return BRANDING_OS_STEP_TO_VIEW[step] ?? View.BRANDING_OS_MANIFESTO;
};

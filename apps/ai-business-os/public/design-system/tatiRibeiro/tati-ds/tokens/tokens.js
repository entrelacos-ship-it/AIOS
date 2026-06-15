/**
 * Tati Ribeiro · Design System
 * tokens.js — exporta tokens em JS para uso em React/Vue/Angular ou JSS
 */

export const colors = {
  // Heritage
  purple:        '#6B46C1',
  purpleLight:   '#8B5CF6',
  purpleDeep:    '#2E1065',
  purpleGlow:    '#A78BFA',
  purpleCircuit: '#4C1D95',

  // Mono scale
  void:      '#050505',
  black:     '#0A0A0A',
  onyx:      '#0F0F14',
  charcoal:  '#14141A',
  graphite:  '#1C1C25',
  stone:     '#262631',
  iron:      '#33333F',
  ash:       '#45454F',
  fog:       '#6B6B7A',
  mist:      '#8E8E9A',
  paper:     '#C4C4CC',
  bone:      '#E0E0E5',
  warmWhite: '#F5F4F0',
  ivory:     '#FAFAF7',
  pearl:     '#FFFFFE',

  // Accent (semantic)
  accent:       '#6B46C1',
  accentLight:  '#8B5CF6',
  accentGlow:   '#A78BFA',
  accentDeep:   '#4C1D95',
  accentBg:     'rgba(139, 92, 246, 0.06)',
  accentBorder: 'rgba(139, 92, 246, 0.18)',
};

export const gradients = {
  mono:   'linear-gradient(180deg, #050505 0%, #14141A 100%)',
  accent: 'linear-gradient(135deg, #4C1D95 0%, #6B46C1 50%, #8B5CF6 100%)',
  text:   'linear-gradient(135deg, #2E1065 0%, #6B46C1 35%, #8B5CF6 70%, #A78BFA 100%)',
  glow:   'radial-gradient(ellipse at center, rgba(107,70,193,0.18) 0%, transparent 60%)',
};

export const fonts = {
  display: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
  serif:   "'Source Serif 4', Georgia, serif",
  body:    "'Inter', -apple-system, sans-serif",
  mono:    "'JetBrains Mono', 'SF Mono', Menlo, monospace",
};

export const fontWeights = {
  ultralight: 200,
  light:      300,
  regular:    400,
  medium:     500,
  semibold:   600,
  bold:       700,
};

export const fontSizes = {
  xs:    '11px',
  sm:    '13px',
  base:  '15px',
  md:    '17px',
  lg:    '21px',
  xl:    '26px',
  '2xl': '32px',
  '3xl': '40px',
  '4xl': '52px',
  '5xl': '76px',
  display: 'clamp(64px, 10.5vw, 152px)',
};

export const tracking = {
  tighter: '-0.05em',
  tight:   '-0.03em',
  normal:  '0',
  wide:    '0.1em',
  wider:   '0.2em',
  widest:  '0.3em',
};

export const leading = {
  none:    1,
  tight:   1.1,
  snug:    1.3,
  normal:  1.5,
  relaxed: 1.65,
  loose:   1.7,
};

export const space = {
  '2xs': '2px',
  xs:    '4px',
  sm:    '8px',
  md:    '16px',
  lg:    '24px',
  xl:    '32px',
  '2xl': '48px',
  '3xl': '64px',
  '4xl': '96px',
  '5xl': '128px',
  '6xl': '192px',
};

export const radius = {
  xs:   '2px',
  sm:   '4px',
  md:   '8px',
  lg:   '12px',
  xl:   '16px',
  '2xl':'24px',
  full: '9999px',
};

export const shadows = {
  sm:     '0 1px 2px rgba(0,0,0,0.08)',
  md:     '0 4px 12px rgba(0,0,0,0.15)',
  lg:     '0 12px 32px rgba(0,0,0,0.2)',
  purple: '0 12px 40px rgba(107,70,193,0.3)',
  glow:   '0 0 24px rgba(167,139,250,0.4)',
};

export const easing = {
  default: 'cubic-bezier(0.4, 0, 0.2, 1)',
  out:     'cubic-bezier(0.16, 1, 0.3, 1)',
  precise: 'cubic-bezier(0.83, 0, 0.17, 1)',
  spring:  'cubic-bezier(0.34, 1.56, 0.64, 1)',
};

export const duration = {
  instant: '150ms',
  fast:    '250ms',
  base:    '400ms',
  slow:    '600ms',
  slower:  '1000ms',
};

export const zIndex = {
  base:     1,
  raised:   10,
  dropdown: 100,
  sticky:   200,
  modal:    1000,
  toast:    2000,
};

export const breakpoints = {
  sm:  '640px',
  md:  '768px',
  lg:  '1024px',
  xl:  '1280px',
  '2xl':'1536px',
};

// Semantic theme tokens
export const themes = {
  dark: {
    bg:         colors.void,
    bg1:        colors.onyx,
    bg2:        colors.charcoal,
    bg3:        colors.graphite,
    surface:    'rgba(255,255,255,0.02)',
    surface2:   'rgba(255,255,255,0.04)',
    border:     'rgba(255,255,255,0.06)',
    border2:    'rgba(255,255,255,0.10)',
    text:       colors.bone,
    text2:      colors.paper,
    textMute:   colors.fog,
    textStrong: colors.pearl,
  },
  light: {
    bg:         colors.warmWhite,
    bg1:        colors.ivory,
    bg2:        colors.pearl,
    bg3:        colors.bone,
    surface:    'rgba(0,0,0,0.015)',
    surface2:   'rgba(0,0,0,0.03)',
    border:     'rgba(0,0,0,0.06)',
    border2:    'rgba(0,0,0,0.10)',
    text:       colors.graphite,
    text2:      colors.iron,
    textMute:   colors.ash,
    textStrong: colors.black,
  },
};

// Default export — todo o sistema agregado
export const tokens = {
  colors,
  gradients,
  fonts,
  fontWeights,
  fontSizes,
  tracking,
  leading,
  space,
  radius,
  shadows,
  easing,
  duration,
  zIndex,
  breakpoints,
  themes,
};

export default tokens;

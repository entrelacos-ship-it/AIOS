/**
 * Tati Ribeiro · Design System
 * tailwind.config.js — preset Tailwind para projetos novos
 *
 * Uso:
 *   const tatiPreset = require('./tati-ds/tokens/tailwind.config.js');
 *   module.exports = { presets: [tatiPreset], content: ['./src/**\/*.{html,js,jsx,ts,tsx}'] };
 */

module.exports = {
  theme: {
    extend: {
      colors: {
        // Heritage
        purple: {
          DEFAULT: '#6B46C1',
          light:   '#8B5CF6',
          deep:    '#2E1065',
          glow:    '#A78BFA',
          circuit: '#4C1D95',
        },
        // Mono scale
        void:      '#050505',
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
        'warm-white': '#F5F4F0',
        ivory:     '#FAFAF7',
        pearl:     '#FFFFFE',
        // Accent
        accent: {
          DEFAULT: '#6B46C1',
          light:   '#8B5CF6',
          glow:    '#A78BFA',
          deep:    '#4C1D95',
        },
      },
      fontFamily: {
        display: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        serif:   ['Source Serif 4', 'Georgia', 'serif'],
        body:    ['Inter', '-apple-system', 'sans-serif'],
        mono:    ['JetBrains Mono', 'SF Mono', 'Menlo', 'monospace'],
      },
      fontSize: {
        'display': ['clamp(64px, 10.5vw, 152px)', { lineHeight: '0.94', letterSpacing: '-0.05em' }],
      },
      letterSpacing: {
        'tighter': '-0.05em',
        'widest':  '0.3em',
      },
      spacing: {
        '2xs': '2px',
        '4.5': '18px',
        '13':  '52px',
        '15':  '60px',
      },
      borderRadius: {
        '2xl': '24px',
      },
      boxShadow: {
        purple: '0 12px 40px rgba(107,70,193,0.3)',
        glow:   '0 0 24px rgba(167,139,250,0.4)',
      },
      backgroundImage: {
        'grad-mono':   'linear-gradient(180deg, #050505 0%, #14141A 100%)',
        'grad-accent': 'linear-gradient(135deg, #4C1D95 0%, #6B46C1 50%, #8B5CF6 100%)',
        'grad-text':   'linear-gradient(135deg, #2E1065 0%, #6B46C1 35%, #8B5CF6 70%, #A78BFA 100%)',
        'grad-glow':   'radial-gradient(ellipse at center, rgba(107,70,193,0.18) 0%, transparent 60%)',
      },
      transitionTimingFunction: {
        'tati':         'cubic-bezier(0.4, 0, 0.2, 1)',
        'tati-out':     'cubic-bezier(0.16, 1, 0.3, 1)',
        'tati-precise': 'cubic-bezier(0.83, 0, 0.17, 1)',
        'tati-spring':  'cubic-bezier(0.34, 1.56, 0.64, 1)',
      },
      transitionDuration: {
        '400': '400ms',
        '600': '600ms',
      },
    },
  },
  plugins: [],
};

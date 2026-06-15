import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        gold: {
          DEFAULT: '#FFB800',
          light: '#FFD166',
          dark: '#CC9200',
        },
        surface: {
          DEFAULT: '#0D0D14',
          elevated: '#12121C',
          card: '#16161F',
          border: '#1E1E2E',
        },
      },
      fontFamily: {
        sora: ['Sora', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;

import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    const port = Number(env.PORT) || 3010;
    const hmrPort = Number(env.VITE_HMR_PORT);
    return {
      server: {
        port,
        host: '0.0.0.0',
        hmr: Number.isFinite(hmrPort)
          ? {
              port: hmrPort,
              clientPort: hmrPort,
            }
          : false,
        ws: Number.isFinite(hmrPort) ? undefined : false,
        watch: {
          ignored: [
            '**/.aiox-core/**',
            '**/.antigravity/**',
            '**/.claude/**',
            '**/.codex/**',
            '**/.cursor/**',
            '**/.gemini/**',
            '**/.github/agents/**',
          ],
        },
      },
      plugins: [react()],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      },
      build: {
        rollupOptions: {
          output: {
            manualChunks(id) {
              const normalizedId = id.replace(/\\/g, '/');

              if (!normalizedId.includes('node_modules')) {
                return undefined;
              }

              if (
                normalizedId.includes('/node_modules/react/') ||
                normalizedId.includes('/node_modules/react-dom/') ||
                normalizedId.includes('/node_modules/scheduler/')
              ) {
                return 'react-core';
              }

              if (normalizedId.includes('/node_modules/lucide-react/')) {
                return 'icons';
              }

              if (
                normalizedId.includes('/node_modules/recharts/') ||
                normalizedId.includes('/node_modules/d3-') ||
                normalizedId.includes('/node_modules/victory-vendor/') ||
                normalizedId.includes('/node_modules/clsx/')
              ) {
                return 'charts';
              }

              if (normalizedId.includes('/node_modules/pdfjs-dist/')) {
                return 'pdf-import';
              }

              if (normalizedId.includes('/node_modules/mammoth/')) {
                return 'docx-import';
              }

              if (normalizedId.includes('/node_modules/@google/genai/')) {
                return 'ai-client';
              }

              if (
                normalizedId.includes('/node_modules/xmlbuilder/') ||
                normalizedId.includes('/node_modules/jszip/') ||
                normalizedId.includes('/node_modules/pako/')
              ) {
                return 'document-utils';
              }

              return 'vendor-core';
            },
          },
        },
      }
    };
});

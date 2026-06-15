import type { Metadata } from 'next';
import './globals.css';

// Next.js requires metadata to be exported from the layout module.
// eslint-disable-next-line react-refresh/only-export-components
export const metadata: Metadata = {
  title: 'EloCut — AI Video Editor',
  description: 'Automated AI-powered video editing with Remotion',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}

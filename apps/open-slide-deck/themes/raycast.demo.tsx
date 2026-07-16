import { type Page, useSlidePageNumber } from '@open-slide/core';

const Title = ({ children }: { children: React.ReactNode }) => (
  <h1
    style={{
      fontSize: 140,
      fontWeight: 600,
      lineHeight: 1.05,
      letterSpacing: '0px',
      margin: 0,
      color: '#f9f9f9',
      fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif',
    }}
  >
    {children}
  </h1>
);

const Footer = () => {
  const { current, total } = useSlidePageNumber();
  return (
    <div
      style={{
        position: 'absolute',
        left: 130,
        right: 130,
        bottom: 56,
        display: 'flex',
        justifyContent: 'space-between',
        fontSize: 20,
        letterSpacing: '0.4px',
        fontFamily: 'GeistMono, ui-monospace, monospace',
        color: '#9c9c9d',
      }}
    >
      <span>RAYCAST</span>
      <span>{String(current).padStart(2, '0')} / {String(total).padStart(2, '0')}</span>
    </div>
  );
};

const Eyebrow = ({ children }: { children: React.ReactNode }) => (
  <div
    style={{
      fontSize: 20,
      fontWeight: 600,
      letterSpacing: '0.08em',
      textTransform: 'uppercase',
      fontFamily: 'GeistMono, ui-monospace, monospace',
      color: '#9c9c9d',
    }}
  >
    {children}
  </div>
);

const PillButton = ({ children }: { children: React.ReactNode }) => (
  <span
    style={{
      display: 'inline-flex',
      alignItems: 'center',
      fontSize: 24,
      fontWeight: 600,
      letterSpacing: '0.5px',
      padding: '16px 30px',
      borderRadius: 100,
      background: 'transparent',
      color: '#f9f9f9',
      boxShadow:
        'rgba(255,255,255,0.05) 0px 1px 0px 0px inset, rgba(255,255,255,0.25) 0px 0px 0px 1px, rgba(0,0,0,0.2) 0px -1px 0px 0px inset',
    }}
  >
    {children}
  </span>
);

const Card = ({ children }: { children: React.ReactNode }) => (
  <div
    style={{
      background: '#101111',
      borderRadius: 16,
      padding: 32,
      boxShadow: 'rgb(27,28,30) 0px 0px 0px 1px, rgb(7,8,10) 0px 0px 0px 1px inset',
    }}
  >
    {children}
  </div>
);

const KeyCap = ({ children }: { children: React.ReactNode }) => (
  <span
    style={{
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      minWidth: 44,
      height: 44,
      padding: '0 12px',
      borderRadius: 6,
      background: 'linear-gradient(180deg, #121212, #0d0d0d)',
      color: '#f9f9f9',
      fontFamily: 'GeistMono, ui-monospace, monospace',
      fontSize: 20,
      boxShadow: 'rgba(0,0,0,0.4) 0px 1.5px 0.5px 2.5px',
    }}
  >
    {children}
  </span>
);

const fill = { width: '100%', height: '100%', position: 'relative' as const };

const Cover: Page = () => (
  <div style={{ ...fill, background: '#07080a', color: '#f9f9f9', padding: 130, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
    <Eyebrow>LAUNCHER</Eyebrow>
    <div style={{ marginTop: 24 }}>
      <Title>Your shortcut to everything.</Title>
    </div>
    <p style={{ fontSize: 32, color: '#9c9c9d', maxWidth: 1200, marginTop: 32, letterSpacing: '0.4px' }}>
      A blazingly fast, totally extendable launcher for your Mac.
    </p>
    <div style={{ marginTop: 40 }}>
      <PillButton>Download for Mac</PillButton>
    </div>
    <Footer />
  </div>
);

const ShortcutSlide: Page = () => (
  <div style={{ ...fill, background: '#07080a', color: '#f9f9f9', padding: 130, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 40 }}>
    <Eyebrow>SHORTCUTS</Eyebrow>
    <Card>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <KeyCap>⌘</KeyCap>
        <KeyCap>Space</KeyCap>
        <span style={{ fontSize: 28, color: '#9c9c9d', marginLeft: 12, letterSpacing: '0.4px' }}>
          Open Raycast from anywhere.
        </span>
      </div>
    </Card>
    <Footer />
  </div>
);

const Closer: Page = () => (
  <div style={{ ...fill, background: '#07080a', color: '#f9f9f9', padding: 130, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
    <Title>Get started free.</Title>
    <p style={{ fontSize: 32, color: '#55b3ff', marginTop: 32, letterSpacing: '0.4px' }}>raycast.com →</p>
    <Footer />
  </div>
);

export default [Cover, ShortcutSlide, Closer];

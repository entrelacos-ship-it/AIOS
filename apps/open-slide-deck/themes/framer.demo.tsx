import { type Page, useSlidePageNumber } from '@open-slide/core';

const Title = ({ children }: { children: React.ReactNode }) => (
  <h1
    style={{
      fontSize: 150,
      fontWeight: 500,
      lineHeight: 0.85,
      letterSpacing: '-7.5px',
      margin: 0,
      color: '#ffffff',
      fontFamily: '"GT Walsheim Medium Placeholder", "Mona Sans", -apple-system, sans-serif',
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
        left: 140,
        right: 140,
        bottom: 56,
        display: 'flex',
        justifyContent: 'space-between',
        fontSize: 20,
        letterSpacing: '0.14em',
        textTransform: 'uppercase',
        fontFamily: '"Berkeley Mono", ui-monospace, monospace',
        color: '#999999',
      }}
    >
      <span>FRAMER</span>
      <span>{String(current).padStart(2, '0')} / {String(total).padStart(2, '0')}</span>
    </div>
  );
};

const Eyebrow = ({ children }: { children: React.ReactNode }) => (
  <div
    style={{
      fontSize: 20,
      fontWeight: 500,
      letterSpacing: '0.14em',
      textTransform: 'uppercase',
      fontFamily: '"Berkeley Mono", ui-monospace, monospace',
      color: '#0099ff',
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
      fontWeight: 500,
      padding: '18px 30px',
      borderRadius: 100,
      background: '#ffffff',
      color: '#0a0a0b',
    }}
  >
    {children}
  </span>
);

const SpotlightCard = ({
  variant = 'violet',
  children,
}: {
  variant?: 'violet' | 'magenta' | 'orange' | 'coral';
  children: React.ReactNode;
}) => {
  const gradients = {
    violet: 'linear-gradient(135deg, #7b5cff, #2a1a5e)',
    magenta: 'linear-gradient(135deg, #ff5cd6, #5e1a4a)',
    orange: 'linear-gradient(135deg, #ff8a3d, #5e2a1a)',
    coral: 'linear-gradient(135deg, #ff7a7a, #5e1a2a)',
  };
  return (
    <div
      style={{
        background: gradients[variant],
        borderRadius: 30,
        padding: 40,
        color: '#ffffff',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-end',
      }}
    >
      {children}
    </div>
  );
};

const fill = { width: '100%', height: '100%', position: 'relative' as const };

const Cover: Page = () => (
  <div style={{ ...fill, background: '#0a0a0b', padding: 140, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
    <Eyebrow>PRODUCT</Eyebrow>
    <div style={{ marginTop: 24 }}>
      <Title>Build sites that build themselves.</Title>
    </div>
    <p style={{ fontSize: 34, color: '#999999', maxWidth: 1200, marginTop: 40, letterSpacing: '-0.2px', lineHeight: 1.3 }}>
      The web builder for modern teams — visual, fast, and production-ready.
    </p>
    <div style={{ marginTop: 48 }}>
      <PillButton>Get started for free</PillButton>
    </div>
    <Footer />
  </div>
);

const Showcase: Page = () => (
  <div style={{ ...fill, background: '#0a0a0b', padding: 140, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 40 }}>
    <Eyebrow>MADE WITH FRAMER</Eyebrow>
    <h2
      style={{
        fontSize: 100,
        fontWeight: 500,
        lineHeight: 0.95,
        letterSpacing: '-5px',
        margin: 0,
        color: '#ffffff',
        fontFamily: '"GT Walsheim Medium Placeholder", "Mona Sans", -apple-system, sans-serif',
        maxWidth: 1400,
      }}
    >
      One or two spotlights. Never a moodboard.
    </h2>
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 30, marginTop: 20 }}>
      <SpotlightCard variant="violet">
        <div style={{ fontSize: 34, fontWeight: 400, letterSpacing: '-0.2px' }}>Design freely</div>
      </SpotlightCard>
      <SpotlightCard variant="orange">
        <div style={{ fontSize: 34, fontWeight: 400, letterSpacing: '-0.2px' }}>Ship instantly</div>
      </SpotlightCard>
    </div>
    <Footer />
  </div>
);

const Closer: Page = () => (
  <div style={{ ...fill, background: '#0a0a0b', padding: 140, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
    <Title>Start on canvas.</Title>
    <div style={{ marginTop: 48 }}>
      <PillButton>framer.com</PillButton>
    </div>
    <Footer />
  </div>
);

export default [Cover, Showcase, Closer];

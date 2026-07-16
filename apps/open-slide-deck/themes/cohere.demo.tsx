import { type Page } from '@open-slide/core';

const Title = ({ children }: { children: React.ReactNode }) => (
  <h1
    style={{
      fontSize: 160,
      fontWeight: 400,
      lineHeight: 1.0,
      letterSpacing: '-3.2px',
      margin: 0,
      color: '#212121',
      fontFamily: 'CohereText, "Space Grotesk", Inter, ui-sans-serif, system-ui',
    }}
  >
    {children}
  </h1>
);

const Footer = ({ page }: { page: string }) => {
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
        letterSpacing: '0.28em',
        textTransform: 'uppercase',
        fontFamily: 'CohereMono, Arial, ui-sans-serif, system-ui',
        color: '#93939f',
      }}
    >
      <span>COHERE</span>
      <span>{page}</span>
    </div>
  );
};

const Eyebrow = ({ children }: { children: React.ReactNode }) => (
  <div
    style={{
      fontSize: 20,
      fontWeight: 400,
      letterSpacing: '0.28em',
      textTransform: 'uppercase',
      fontFamily: 'CohereMono, Arial, ui-sans-serif, system-ui',
      color: '#93939f',
    }}
  >
    {children}
  </div>
);

const DarkBand = ({
  tone = 'green',
  children,
}: {
  tone?: 'green' | 'navy';
  children: React.ReactNode;
}) => (
  <div
    style={{
      width: '100%',
      height: '100%',
      background: tone === 'green' ? '#003c33' : '#071829',
      color: '#ffffff',
    }}
  >
    {children}
  </div>
);

const Chip = ({ children, active = false }: { children: React.ReactNode; active?: boolean }) => (
  <span
    style={{
      display: 'inline-flex',
      alignItems: 'center',
      fontFamily: '"Unica77 Cohere Web", Inter, sans-serif',
      fontSize: 20,
      fontWeight: 400,
      padding: '10px 22px',
      borderRadius: 30,
      background: active ? '#ff7759' : 'transparent',
      color: active ? '#17171c' : '#ff7759',
      border: '1.5px solid #ff7759',
    }}
  >
    {children}
  </span>
);

const fill = { width: '100%', height: '100%', position: 'relative' as const };

const Cover: Page = () => (
  <div style={{ ...fill, background: '#ffffff', color: '#212121', padding: 130, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
    <Eyebrow>PLATFORM</Eyebrow>
    <div style={{ marginTop: 28 }}>
      <Title>Command your models.</Title>
    </div>
    <p style={{ fontSize: 28, color: '#93939f', maxWidth: 1200, marginTop: 32, lineHeight: 1.5 }}>
      Enterprise AI infrastructure built for control, not speculation.
    </p>
    <div style={{ marginTop: 40, display: 'flex', gap: 16 }}>
      <Chip active>Research</Chip>
      <Chip>Product</Chip>
      <Chip>Security</Chip>
    </div>
    <Footer page="01 / 03" />
  </div>
);

const FeatureBand: Page = () => (
  <DarkBand tone="green">
    <div style={{ ...fill, padding: 130, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
      <Eyebrow>SECURITY</Eyebrow>
      <h2
        style={{
          fontSize: 100,
          fontWeight: 400,
          lineHeight: 1.0,
          letterSpacing: '-2px',
          margin: '28px 0 0',
          color: '#ffffff',
          fontFamily: 'CohereText, "Space Grotesk", Inter, ui-sans-serif, system-ui',
          maxWidth: 1500,
        }}
      >
        Deployed where your data already lives.
      </h2>
      <Footer page="02 / 03" />
    </div>
  </DarkBand>
);

const Closer: Page = () => (
  <div style={{ ...fill, background: '#ffffff', color: '#212121', padding: 130, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
    <Title>Talk to us.</Title>
    <p style={{ fontSize: 28, color: '#1863dc', marginTop: 32 }}>cohere.com →</p>
    <Footer page="03 / 03" />
  </div>
);

export default [Cover, FeatureBand, Closer];

import { type Page } from '@open-slide/core';

const Title = ({ children }: { children: React.ReactNode }) => (
  <h1
    style={{
      fontSize: 150,
      fontWeight: 600,
      lineHeight: 1.0,
      letterSpacing: '-0.04em',
      margin: 0,
      color: '#1c1c1c',
      fontFamily: '"Camera Plain Variable", ui-sans-serif, system-ui, sans-serif',
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
        fontFamily: 'ui-monospace, monospace',
        color: '#5f5f5d',
      }}
    >
      <span>LOVABLE</span>
      <span>{page}</span>
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
      fontFamily: 'ui-monospace, monospace',
      color: '#5f5f5d',
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
      fontWeight: 400,
      padding: '18px 30px',
      borderRadius: 10,
      background: '#1c1c1c',
      color: '#fcfbf8',
      boxShadow:
        'rgba(255,255,255,0.2) 0px 0.5px 0px 0px inset, rgba(0,0,0,0.2) 0px 0px 0px 0.5px inset, rgba(0,0,0,0.05) 0px 1px 2px 0px',
    }}
  >
    {children}
  </span>
);

const Card = ({ label, value }: { label: string; value: string }) => (
  <div
    style={{
      background: '#f7f4ed',
      border: '1px solid #eceae4',
      borderRadius: 12,
      padding: '32px 36px',
    }}
  >
    <div style={{ fontSize: 56, fontWeight: 600, color: '#1c1c1c', letterSpacing: '-0.03em' }}>{value}</div>
    <div style={{ fontSize: 22, color: '#5f5f5d', marginTop: 8 }}>{label}</div>
  </div>
);

const fill = { width: '100%', height: '100%', position: 'relative' as const };

const Cover: Page = () => (
  <div style={{ ...fill, background: '#f7f4ed', color: '#1c1c1c', padding: 130, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
    <Eyebrow>PRODUCT</Eyebrow>
    <div style={{ marginTop: 24 }}>
      <Title>Build something lovable.</Title>
    </div>
    <p style={{ fontSize: 34, color: '#5f5f5d', maxWidth: 1200, marginTop: 32 }}>
      Go from idea to app in minutes, with natural language.
    </p>
    <div style={{ marginTop: 40 }}>
      <PillButton>Start building</PillButton>
    </div>
    <Footer page="01 / 03" />
  </div>
);

const Stats: Page = () => (
  <div style={{ ...fill, background: '#f7f4ed', color: '#1c1c1c', padding: 130, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 40 }}>
    <Eyebrow>BY THE NUMBERS</Eyebrow>
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 30 }}>
      <Card label="Apps shipped" value="10M+" />
      <Card label="Prompts to launch" value="3" />
      <Card label="Builders" value="2M+" />
    </div>
    <Footer page="02 / 03" />
  </div>
);

const Closer: Page = () => (
  <div style={{ ...fill, background: '#f7f4ed', color: '#1c1c1c', padding: 130, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
    <Title>Start free.</Title>
    <div style={{ marginTop: 40 }}>
      <PillButton>lovable.dev</PillButton>
    </div>
    <Footer page="03 / 03" />
  </div>
);

export default [Cover, Stats, Closer];

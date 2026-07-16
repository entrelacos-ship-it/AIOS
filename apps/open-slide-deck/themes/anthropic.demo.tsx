import { type Page } from '@open-slide/core';

const Title = ({ children }: { children: React.ReactNode }) => (
  <h1
    style={{
      fontSize: 130,
      fontWeight: 400,
      lineHeight: 1.1,
      letterSpacing: '-0.02em',
      margin: 0,
      color: '#141413',
      fontFamily: '"Anthropic Serif", Georgia, serif',
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
        fontFamily: 'Anthropic Sans, Arial, sans-serif',
        color: '#5e5d59',
      }}
    >
      <span>ANTHROPIC</span>
      <span>{page}</span>
    </div>
  );
};

const Eyebrow = ({ children }: { children: React.ReactNode }) => (
  <div
    style={{
      fontSize: 20,
      fontWeight: 500,
      letterSpacing: '-0.005em',
      textTransform: 'uppercase',
      fontFamily: 'Anthropic Sans, Arial, sans-serif',
      color: '#5e5d59',
    }}
  >
    {children}
  </div>
);

const Button = ({ children }: { children: React.ReactNode }) => (
  <span
    style={{
      display: 'inline-flex',
      alignItems: 'center',
      fontSize: 24,
      fontWeight: 500,
      padding: '18px 30px',
      borderRadius: 4,
      background: '#141413',
      color: '#faf9f5',
      fontFamily: 'Anthropic Sans, Arial, sans-serif',
      boxShadow: 'inset 0 6px 12px rgba(255,255,255,0.12), inset 0 1px 1px rgba(255,255,255,0.19)',
    }}
  >
    {children}
  </span>
);

const Card = ({ title, body }: { title: string; body: string }) => (
  <div
    style={{
      background: '#ffffff',
      border: '1px solid rgba(20,20,19,0.10)',
      borderRadius: 8,
      padding: 32,
      boxShadow: '0 1px 6px rgba(0,0,0,0.10)',
    }}
  >
    <div style={{ fontSize: 30, fontWeight: 700, fontFamily: 'Anthropic Sans, Arial, sans-serif', color: '#141413' }}>{title}</div>
    <div style={{ fontSize: 22, color: '#5e5d59', marginTop: 12, fontFamily: '"Anthropic Serif", Georgia, serif' }}>{body}</div>
  </div>
);

const fill = { width: '100%', height: '100%', position: 'relative' as const };

const Cover: Page = () => (
  <div style={{ ...fill, background: '#faf9f5', color: '#141413', padding: 130, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
    <Eyebrow>AI SAFETY</Eyebrow>
    <div style={{ marginTop: 28 }}>
      <Title>AI research at the frontier.</Title>
    </div>
    <p style={{ fontFamily: '"Anthropic Serif", Georgia, serif', fontSize: 34, color: '#5e5d59', maxWidth: 1200, marginTop: 32 }}>
      Reliable, interpretable, and steerable AI systems — careful work, calmly done.
    </p>
    <div style={{ marginTop: 40 }}>
      <Button>Talk to Claude</Button>
    </div>
    <Footer page="01 / 03" />
  </div>
);

const Cards: Page = () => (
  <div style={{ ...fill, background: '#faf9f5', color: '#141413', padding: 130, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 40 }}>
    <Eyebrow>RESEARCH</Eyebrow>
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 30 }}>
      <Card title="Interpretability" body="Understanding what models compute, and why." />
      <Card title="Alignment" body="Steering capable systems toward human intent." />
      <Card title="Policy" body="Shaping safe deployment at the frontier." />
    </div>
    <Footer page="02 / 03" />
  </div>
);

const Closer: Page = () => (
  <div style={{ ...fill, background: '#141413', color: '#faf9f5', padding: 130, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
    <h1
      style={{
        fontSize: 130,
        fontWeight: 400,
        lineHeight: 1.1,
        letterSpacing: '-0.02em',
        margin: 0,
        color: '#faf9f5',
        fontFamily: '"Anthropic Serif", Georgia, serif',
      }}
    >
      Read the research.
    </h1>
    <p style={{ fontFamily: '"Anthropic Serif", Georgia, serif', fontSize: 34, color: '#d97757', marginTop: 32 }}>anthropic.com →</p>
    <Footer page="03 / 03" />
  </div>
);

export default [Cover, Cards, Closer];

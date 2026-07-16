import { type Page } from '@open-slide/core';

const Title = ({ children }: { children: React.ReactNode }) => (
  <h1
    style={{
      fontSize: 140,
      fontWeight: 400,
      fontStyle: 'italic',
      lineHeight: 1.0,
      letterSpacing: '-0.02em',
      margin: 0,
      color: '#edebe6',
      fontFamily: '"Instrument Serif", "Times New Roman", serif',
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
        fontSize: 18,
        letterSpacing: '0.05em',
        textTransform: 'uppercase',
        fontFamily: '"Inter Tight", -apple-system, sans-serif',
        fontWeight: 500,
        color: '#8d7556',
      }}
    >
      <span>ACADEMIA LENDÁRIA</span>
      <span>{page}</span>
    </div>
  );
};

const Eyebrow = ({ children }: { children: React.ReactNode }) => (
  <div
    style={{
      fontSize: 18,
      fontWeight: 500,
      letterSpacing: '0.05em',
      textTransform: 'uppercase',
      fontFamily: '"Inter Tight", -apple-system, sans-serif',
      color: '#c9b298',
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
      fontFamily: '"Inter Tight", -apple-system, sans-serif',
      fontSize: 22,
      fontWeight: 500,
      padding: '18px 32px',
      borderRadius: 9999,
      background: 'transparent',
      color: '#edebe6',
      boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.15), 0 10px 40px rgba(201,178,152,0.25)',
    }}
  >
    {children}
  </span>
);

const Stat = ({ value, label }: { value: string; label: string }) => (
  <div style={{ textAlign: 'center' }}>
    <span style={{ fontFamily: '"JetBrains Mono", monospace', fontWeight: 500, fontSize: 56, letterSpacing: '-0.02em', color: '#c9b298', display: 'block' }}>
      {value}
    </span>
    <span style={{ fontFamily: '"Inter Tight", sans-serif', fontSize: 16, letterSpacing: '0.22em', textTransform: 'uppercase', color: '#8d7556', marginTop: 8, display: 'block' }}>
      {label}
    </span>
  </div>
);

const fill = { width: '100%', height: '100%', position: 'relative' as const };

const Cover: Page = () => (
  <div style={{ ...fill, background: '#070709', color: '#edebe6', padding: 130, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
    <Eyebrow>ACADEMIA LENDÁRIA</Eyebrow>
    <div style={{ marginTop: 28 }}>
      <Title>O futuro pertence a quem constrói.</Title>
    </div>
    <p style={{ fontFamily: '"Inter Tight", sans-serif', fontSize: 32, color: '#8d7556', maxWidth: 1200, marginTop: 32 }}>
      Um programa pra quem decidiu deixar de esperar permissão.
    </p>
    <div style={{ marginTop: 40 }}>
      <PillButton>Entrar na jornada</PillButton>
    </div>
    <Footer page="01 / 03" />
  </div>
);

const StatsSlide: Page = () => (
  <div style={{ ...fill, background: '#070709', color: '#edebe6', padding: 130, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 48 }}>
    <Eyebrow>RESULTADOS</Eyebrow>
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 40 }}>
      <Stat value="R$200M+" label="Gerados por alunos" />
      <Stat value="15K+" label="Formados" />
      <Stat value="4.9" label="Avaliação média" />
    </div>
    <Footer page="02 / 03" />
  </div>
);

const Closer: Page = () => (
  <div style={{ ...fill, background: '#070709', color: '#edebe6', padding: 130, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
    <Title>Torne-se lendário.</Title>
    <div style={{ marginTop: 40 }}>
      <PillButton>academialendaria.com</PillButton>
    </div>
    <Footer page="03 / 03" />
  </div>
);

export default [Cover, StatsSlide, Closer];

import { type Page, useSlidePageNumber } from '@open-slide/core';

const Title = ({ children, highlight }: { children: React.ReactNode; highlight?: string }) => (
  <h1
    style={{
      fontSize: 150,
      fontWeight: 500,
      lineHeight: 0.98,
      letterSpacing: '-0.045em',
      margin: 0,
      color: '#F0EAF8',
      fontFamily: '"Inter Tight", -apple-system, sans-serif',
    }}
  >
    {children}
    {highlight && (
      <span style={{ fontFamily: '"Instrument Serif", serif', fontStyle: 'italic', fontWeight: 400, color: '#FF8A1F', letterSpacing: '-0.01em' }}>
        {' '}{highlight}
      </span>
    )}
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
        fontSize: 18,
        letterSpacing: '0.20em',
        textTransform: 'uppercase',
        fontFamily: '"JetBrains Mono", ui-monospace, monospace',
        color: 'rgba(240,234,248,0.42)',
      }}
    >
      <span>ENTRELAÇOS</span>
      <span>{String(current).padStart(2, '0')} / {String(total).padStart(2, '0')}</span>
    </div>
  );
};

const Eyebrow = ({ children }: { children: React.ReactNode }) => (
  <div
    style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 8,
      padding: '8px 14px',
      borderRadius: 9999,
      border: '1px solid rgba(180,140,255,0.10)',
      background: 'rgba(180,140,255,0.04)',
      fontFamily: '"JetBrains Mono", ui-monospace, monospace',
      fontSize: 18,
      letterSpacing: '0.20em',
      textTransform: 'uppercase',
      color: 'rgba(240,234,248,0.42)',
    }}
  >
    <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#7427D4', boxShadow: '0 0 10px #7427D4' }} />
    {children}
  </div>
);

const Button = ({ children }: { children: React.ReactNode }) => (
  <span
    style={{
      display: 'inline-flex',
      alignItems: 'center',
      fontFamily: '"JetBrains Mono", ui-monospace, monospace',
      fontSize: 22,
      fontWeight: 500,
      padding: '18px 32px',
      borderRadius: 9999,
      background: '#5C18B8',
      color: '#ffffff',
      boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.15), 0 10px 40px rgba(116,39,212,0.30)',
    }}
  >
    {children}
  </span>
);

const Stat = ({ value, label }: { value: string; label: string }) => (
  <div style={{ textAlign: 'center' }}>
    <span style={{ fontFamily: '"JetBrains Mono", ui-monospace, monospace', fontWeight: 500, fontSize: 56, letterSpacing: '-0.02em', color: '#F0EAF8', display: 'block' }}>
      {value}
    </span>
    <span style={{ fontFamily: '"JetBrains Mono", ui-monospace, monospace', fontSize: 16, letterSpacing: '0.22em', textTransform: 'uppercase', color: 'rgba(240,234,248,0.42)', marginTop: 8, display: 'block' }}>
      {label}
    </span>
  </div>
);

const fill = { width: '100%', height: '100%', position: 'relative' as const };

const Cover: Page = () => (
  <div style={{ ...fill, background: '#0A0612', color: '#F0EAF8', padding: 130, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
    <Eyebrow>ENTRELAÇOS PSICOLOGIA</Eyebrow>
    <div style={{ marginTop: 28 }}>
      <Title highlight="constrói">O futuro pertence a quem</Title>
    </div>
    <p style={{ fontSize: 34, color: 'rgba(240,234,248,0.68)', maxWidth: 1200, marginTop: 32 }}>
      Autonomia construída com estrutura, sem ferir a ética.
    </p>
    <div style={{ marginTop: 40 }}>
      <Button>Começar agora</Button>
    </div>
    <Footer />
  </div>
);

const StatsSlide: Page = () => (
  <div style={{ ...fill, background: '#0A0612', color: '#F0EAF8', padding: 130, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 48 }}>
    <Eyebrow>RESULTADOS</Eyebrow>
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 40 }}>
      <Stat value="200+" label="Pacientes" />
      <Stat value="98%" label="Satisfação" />
      <Stat value="12" label="Programas" />
      <Stat value="5x" label="Crescimento" />
    </div>
    <Footer />
  </div>
);

const Closer: Page = () => (
  <div style={{ ...fill, background: '#0A0612', color: '#F0EAF8', padding: 130, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
    <Title highlight="reposicionamento">Convite pro</Title>
    <div style={{ marginTop: 40 }}>
      <Button>entrelacospsicologia.com.br</Button>
    </div>
    <Footer />
  </div>
);

export default [Cover, StatsSlide, Closer];

import { type Page } from '@open-slide/core';

const Title = ({ children }: { children: React.ReactNode }) => (
  <h1
    style={{
      fontSize: 130,
      fontWeight: 300,
      lineHeight: 1.0,
      letterSpacing: '-0.02em',
      margin: 0,
      color: '#061b31',
      fontFamily: '"sohne-var", "SF Pro Display", "Helvetica Neue", Arial, sans-serif',
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
        fontFamily: '"sohne-var", Arial, sans-serif',
        color: '#64748d',
      }}
    >
      <span>STRIPE</span>
      <span>{page}</span>
    </div>
  );
};

const Eyebrow = ({ children }: { children: React.ReactNode }) => (
  <div
    style={{
      fontSize: 20,
      fontWeight: 500,
      letterSpacing: '0.05em',
      textTransform: 'uppercase',
      fontFamily: '"sohne-var", Arial, sans-serif',
      color: '#533afd',
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
      fontWeight: 400,
      padding: '16px 28px',
      borderRadius: 6,
      background: '#533afd',
      color: '#ffffff',
      boxShadow: '0 2px 6px rgba(50,50,93,0.2)',
    }}
  >
    {children}
  </span>
);

const GradientPanel = ({ children }: { children: React.ReactNode }) => (
  <div
    style={{
      background: 'linear-gradient(135deg, #7232f1, #fb76fa)',
      borderRadius: 16,
      padding: 40,
      color: '#ffffff',
    }}
  >
    {children}
  </div>
);

const fill = { width: '100%', height: '100%', position: 'relative' as const };

const Cover: Page = () => (
  <div style={{ ...fill, background: '#ffffff', color: '#061b31', padding: 130, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
    <Eyebrow>PAYMENTS</Eyebrow>
    <div style={{ marginTop: 24 }}>
      <Title>Infraestrutura financeira para crescer.</Title>
    </div>
    <p style={{ fontSize: 34, color: '#64748d', maxWidth: 1200, marginTop: 32, fontFamily: '"sohne-var", Arial, sans-serif' }}>
      Ferramentas de pagamento e faturamento, individuais ou em conjunto.
    </p>
    <div style={{ marginTop: 40 }}>
      <Button>Comece já</Button>
    </div>
    <Footer page="01 / 03" />
  </div>
);

const PanelSlide: Page = () => (
  <div style={{ ...fill, background: '#ffffff', color: '#061b31', padding: 130, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 36 }}>
    <Eyebrow>BILLING</Eyebrow>
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 30 }}>
      <GradientPanel>
        <div style={{ fontSize: 40, fontWeight: 300, fontFamily: '"sohne-var", Arial, sans-serif' }}>
          Qualquer modelo de faturamento.
        </div>
      </GradientPanel>
      <div style={{ background: '#f8fafd', border: '1px solid #e5edf5', borderRadius: 16, padding: 40, display: 'flex', alignItems: 'center' }}>
        <div style={{ fontSize: 34, color: '#061b31', fontFamily: '"sohne-var", Arial, sans-serif', fontWeight: 300 }}>
          Assinaturas, uso, híbrido — sem código extra.
        </div>
      </div>
    </div>
    <Footer page="02 / 03" />
  </div>
);

const Closer: Page = () => (
  <div style={{ ...fill, background: '#ffffff', color: '#061b31', padding: 130, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
    <Title>Fale com a gente.</Title>
    <p style={{ fontSize: 34, color: '#533afd', marginTop: 32, fontFamily: '"sohne-var", Arial, sans-serif' }}>stripe.com →</p>
    <Footer page="03 / 03" />
  </div>
);

export default [Cover, PanelSlide, Closer];

import { type Page } from '@open-slide/core';

const Title = ({ children }: { children: React.ReactNode }) => (
  <h1
    style={{
      fontSize: 150,
      fontWeight: 700,
      lineHeight: 0.95,
      letterSpacing: '-0.03em',
      margin: 0,
      color: '#000000',
      fontFamily: 'var(--font-abc-favorit, "ABC Favorit"), ui-sans-serif, system-ui, sans-serif',
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
        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
        color: '#666666',
      }}
    >
      <span>RESEND</span>
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
      fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
      color: '#ff801f',
    }}
  >
    {children}
  </div>
);

const CodeBlock = ({ children }: { children: React.ReactNode }) => (
  <pre
    style={{
      background: '#18181b',
      color: '#fafafa',
      border: '1px solid #f0f0f0',
      borderRadius: 4,
      padding: '28px 32px',
      fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
      fontSize: 24,
      lineHeight: 1.5,
      margin: 0,
      overflow: 'hidden',
    }}
  >
    {children}
  </pre>
);

const fill = { width: '100%', height: '100%', position: 'relative' as const };

const Cover: Page = () => (
  <div style={{ ...fill, background: '#fdfdfd', color: '#000000', padding: 130, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
    <Eyebrow>EMAIL API</Eyebrow>
    <div style={{ marginTop: 24 }}>
      <Title>Email for developers.</Title>
    </div>
    <p style={{ fontSize: 34, color: '#666666', maxWidth: 1200, marginTop: 32 }}>
      The best way to reach humans instead of spam folders.
    </p>
    <Footer page="01 / 03" />
  </div>
);

const CodeSlide: Page = () => (
  <div style={{ ...fill, background: '#fdfdfd', color: '#000000', padding: 130, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 36 }}>
    <Eyebrow>QUICKSTART</Eyebrow>
    <h2
      style={{
        fontSize: 88,
        fontWeight: 600,
        lineHeight: 1.0,
        letterSpacing: '-0.02em',
        margin: 0,
        color: '#000000',
        fontFamily: 'var(--font-abc-favorit, "ABC Favorit"), ui-sans-serif, system-ui, sans-serif',
      }}
    >
      Three lines to send.
    </h2>
    <CodeBlock>
      {'await resend.emails.send({\n  from: "you@example.com",\n  to: "user@example.com",\n});'}
    </CodeBlock>
    <Footer page="02 / 03" />
  </div>
);

const Closer: Page = () => (
  <div style={{ ...fill, background: '#fdfdfd', color: '#000000', padding: 130, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
    <Title>Start sending.</Title>
    <p style={{ fontSize: 34, color: '#ff801f', marginTop: 32 }}>resend.com →</p>
    <Footer page="03 / 03" />
  </div>
);

export default [Cover, CodeSlide, Closer];

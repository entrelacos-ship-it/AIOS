import { type Page, useSlidePageNumber } from '@open-slide/core';

const Title = ({ children }: { children: React.ReactNode }) => (
  <h1
    style={{
      fontSize: 130,
      fontWeight: 500,
      lineHeight: 1.0,
      letterSpacing: '-0.01em',
      margin: 0,
      color: '#1F1F1F',
      fontFamily: '"Google Sans", Roboto, ui-sans-serif, system-ui',
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
        left: 120,
        right: 120,
        bottom: 52,
        display: 'flex',
        justifyContent: 'space-between',
        fontSize: 20,
        fontFamily: 'Roboto, ui-sans-serif, system-ui',
        color: '#444746',
      }}
    >
      <span>GMAIL</span>
      <span>{current} / {total}</span>
    </div>
  );
};

const Eyebrow = ({ children }: { children: React.ReactNode }) => (
  <div
    style={{
      fontSize: 20,
      fontWeight: 500,
      letterSpacing: '0.08em',
      textTransform: 'uppercase',
      fontFamily: 'Roboto, ui-sans-serif, system-ui',
      color: '#444746',
    }}
  >
    {children}
  </div>
);

const ComposePill = ({ children }: { children: React.ReactNode }) => (
  <span
    style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 12,
      fontFamily: 'Roboto, ui-sans-serif, system-ui',
      fontSize: 22,
      fontWeight: 500,
      padding: '16px 26px',
      borderRadius: 9999,
      background: '#C2E7FF',
      color: '#001D35',
      boxShadow: '0 1px 2px rgba(0,0,0,0.3), 0 1px 3px 1px rgba(0,0,0,0.15)',
    }}
  >
    {children}
  </span>
);

const InboxRow = ({
  sender,
  subject,
  date,
  unread = false,
  selected = false,
}: {
  sender: string;
  subject: string;
  date: string;
  unread?: boolean;
  selected?: boolean;
}) => (
  <div
    style={{
      display: 'flex',
      alignItems: 'center',
      gap: 24,
      height: 60,
      padding: '0 24px',
      background: selected ? '#D3E3FD' : '#FFFFFF',
      fontFamily: 'Roboto, ui-sans-serif, system-ui',
    }}
  >
    <span style={{ width: 220, fontSize: 24, fontWeight: unread ? 700 : 400, color: '#1F1F1F' }}>{sender}</span>
    <span style={{ flex: 1, fontSize: 24, fontWeight: unread ? 700 : 400, color: unread ? '#1F1F1F' : '#444746' }}>
      {subject}
    </span>
    <span style={{ fontSize: 20, color: '#444746' }}>{date}</span>
  </div>
);

const fill = { width: '100%', height: '100%', position: 'relative' as const };

const Cover: Page = () => (
  <div style={{ ...fill, background: '#F6F8FC', color: '#1F1F1F', padding: 120, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
    <Eyebrow>WORKSPACE</Eyebrow>
    <div style={{ marginTop: 24 }}>
      <Title>Inbox, productivity in Google Blue.</Title>
    </div>
    <p style={{ fontSize: 30, color: '#444746', maxWidth: 1300, marginTop: 28 }}>
      A four-pane productivity surface where action is blue and density is 40 pixels per row.
    </p>
    <div style={{ marginTop: 36 }}>
      <ComposePill>✎ Compose</ComposePill>
    </div>
    <Footer />
  </div>
);

const InboxSlide: Page = () => (
  <div style={{ ...fill, background: '#F6F8FC', color: '#1F1F1F', padding: 120, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 36 }}>
    <Eyebrow>INBOX</Eyebrow>
    <div
      style={{
        background: '#FFFFFF',
        borderRadius: 16,
        overflow: 'hidden',
        border: '1px solid #C4C7C5',
      }}
    >
      <InboxRow sender="Roger Nelson" subject="New comments on MCR draft" date="2:35 PM" unread />
      <InboxRow sender="Design Team" subject="Weekly sync notes" date="1:12 PM" selected />
      <InboxRow sender="Notifications" subject="Your export is ready" date="11:04 AM" />
    </div>
    <Footer />
  </div>
);

const Closer: Page = () => (
  <div style={{ ...fill, background: '#F6F8FC', color: '#1F1F1F', padding: 120, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
    <Title>Start mailing.</Title>
    <p style={{ fontSize: 30, color: '#0B57D0', marginTop: 32 }}>gmail.com →</p>
    <Footer />
  </div>
);

export default [Cover, InboxSlide, Closer];

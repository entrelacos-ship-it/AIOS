import type { DesignSystem, Page, SlideMeta } from '@open-slide/core';

// ─── Linear design tokens (light) ─────────────────────────────────────────────
export const design: DesignSystem = {
  palette: { bg: '#fafafa', text: '#111111', accent: '#5e6ad2' },
  fonts: {
    display:
      '"Inter Variable", "SF Pro Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    body: '"Inter Variable", "SF Pro Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  typeScale: { hero: 140, body: 32 },
  radius: 12,
};

// Tokens outside the DesignSystem shape (full Linear light palette).
const t = {
  background: '#fafafa',
  foreground: '#111111',
  card: '#ffffff',
  cardForeground: '#111111',
  primary: '#5e6ad2',
  primaryForeground: '#ffffff',
  secondary: '#f4f4f5',
  secondaryForeground: '#111111',
  muted: '#f4f4f5',
  mutedForeground: '#52525b',
  accentYellow: '#f2c94c',
  accentForeground: '#ffffff',
  border: '#e4e4e7',
  ring: '#5e6ad2',
  surfaceContainer: '#f8fafc',
  surfaceContainerHigh: '#ffffff',
};

const mono = '"Berkeley Mono", ui-monospace, "SF Mono", Menlo, monospace';

const radius = { card: 12, input: 8, pill: 9999 };

const fill = {
  width: '100%',
  height: '100%',
  fontFamily: 'var(--osd-font-body)',
} as const;

// ─── Small primitives (each is its own component — no map over data) ─────────

const Eyebrow = ({ children }: { children: React.ReactNode }) => (
  <div
    style={{
      fontFamily: mono,
      fontSize: 18,
      letterSpacing: '0.14em',
      textTransform: 'uppercase',
      color: t.mutedForeground,
    }}
  >
    {children}
  </div>
);

const SwatchLabel = ({ children }: { children: React.ReactNode }) => (
  <div
    style={{
      fontFamily: mono,
      fontSize: 15,
      letterSpacing: '0.08em',
      textTransform: 'uppercase',
      color: t.mutedForeground,
      marginBottom: 14,
    }}
  >
    {children}
  </div>
);

const Swatch = ({
  label,
  children,
  justify = 'center',
}: {
  label: string;
  children: React.ReactNode;
  justify?: 'center' | 'flex-start';
}) => (
  <div
    style={{
      background: t.card,
      border: `1px solid ${t.border}`,
      borderRadius: radius.card,
      padding: '22px 24px',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: justify,
      minHeight: 0,
    }}
  >
    <SwatchLabel>{label}</SwatchLabel>
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
      {children}
    </div>
  </div>
);

const PillButton = ({
  children,
  variant = 'primary',
}: {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary';
}) => (
  <span
    style={{
      display: 'inline-flex',
      alignItems: 'center',
      fontFamily: 'var(--osd-font-body)',
      fontSize: 20,
      fontWeight: 500,
      padding: '12px 26px',
      borderRadius: radius.pill,
      background: variant === 'primary' ? t.primary : t.secondary,
      color: variant === 'primary' ? t.primaryForeground : t.secondaryForeground,
      border: variant === 'secondary' ? `1px solid ${t.border}` : 'none',
    }}
  >
    {children}
  </span>
);

const Badge = ({ children, tone = 'primary' }: { children: React.ReactNode; tone?: 'primary' | 'yellow' | 'muted' }) => {
  const bg = tone === 'primary' ? `${t.primary}1a` : tone === 'yellow' ? `${t.accentYellow}33` : t.muted;
  const fg = tone === 'primary' ? t.primary : tone === 'yellow' ? '#8a6d1a' : t.mutedForeground;
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        fontFamily: mono,
        fontSize: 15,
        fontWeight: 500,
        padding: '5px 14px',
        borderRadius: radius.pill,
        background: bg,
        color: fg,
      }}
    >
      {children}
    </span>
  );
};

const Avatar = ({ initials, color }: { initials: string; color: string }) => (
  <div
    style={{
      width: 44,
      height: 44,
      borderRadius: '50%',
      background: color,
      color: t.primaryForeground,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: 16,
      fontWeight: 600,
      border: `2px solid ${t.card}`,
    }}
  >
    {initials}
  </div>
);

// ─── Header / branding bar ─────────────────────────────────────────────────
const NavLink = ({ children, active = false }: { children: React.ReactNode; active?: boolean }) => (
  <span
    style={{
      fontSize: 20,
      fontWeight: 500,
      color: active ? t.foreground : t.mutedForeground,
    }}
  >
    {children}
  </span>
);

// ─── Page: Linear brand + component showcase ──────────────────────────────
const Cover: Page = () => (
  <div style={{ ...fill, background: 'var(--osd-bg)', color: 'var(--osd-text)' }}>
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        padding: '48px 100px 80px',
        gap: 36,
      }}
    >
      {/* Nav / branding bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingBottom: 24,
          borderBottom: `1px solid ${t.border}`,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 44 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                width: 30,
                height: 30,
                borderRadius: 8,
                background: t.primary,
              }}
            />
            <span
              style={{
                fontFamily: 'var(--osd-font-display)',
                fontSize: 26,
                fontWeight: 700,
                letterSpacing: '-0.02em',
              }}
            >
              Linear
            </span>
          </div>
          <NavLink active>Issues</NavLink>
          <NavLink>Projects</NavLink>
          <NavLink>Roadmap</NavLink>
          <NavLink>Cycles</NavLink>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '10px 16px',
              borderRadius: radius.input,
              background: t.secondary,
              color: t.mutedForeground,
              fontFamily: mono,
              fontSize: 16,
              minWidth: 200,
            }}
          >
            <span>⌕</span>
            <span>Search…</span>
          </div>
          <Avatar initials="TK" color={t.primary} />
        </div>
      </div>

      {/* Body: brand statement + component grid */}
      <div
        style={{
          flex: 1,
          display: 'grid',
          gridTemplateColumns: '620px 1fr',
          gap: 64,
          minHeight: 0,
        }}
      >
        {/* Left — brand statement */}
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 28 }}>
          <Eyebrow>Design system</Eyebrow>
          <h1
            style={{
              fontFamily: 'var(--osd-font-display)',
              fontSize: 128,
              fontWeight: 700,
              margin: 0,
              lineHeight: 1.0,
              letterSpacing: '-0.04em',
            }}
          >
            Linear
          </h1>
          <p
            style={{
              fontSize: 30,
              lineHeight: 1.45,
              color: t.mutedForeground,
              margin: 0,
              maxWidth: 560,
            }}
          >
            Product development system for issues, projects, roadmaps, and agent workflows.
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 28, marginTop: 8 }}>
            <PillButton variant="primary">Get started</PillButton>
            <span
              style={{
                fontSize: 20,
                fontWeight: 500,
                color: t.primary,
                textDecoration: 'underline',
                textUnderlineOffset: 4,
              }}
            >
              Read the docs →
            </span>
          </div>
        </div>

        {/* Right — component swatch grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gridTemplateRows: 'repeat(3, 1fr)',
            gap: 20,
            minHeight: 0,
          }}
        >
          <Swatch label="Card">
            <div
              style={{
                border: `1px solid ${t.border}`,
                borderRadius: radius.card,
                padding: 16,
                display: 'flex',
                alignItems: 'center',
                gap: 12,
              }}
            >
              <Avatar initials="AC" color="#8a6d1a" />
              <div>
                <div style={{ fontSize: 17, fontWeight: 600 }}>Onboarding flow</div>
                <div style={{ fontSize: 14, color: t.mutedForeground }}>Design · 3 issues</div>
              </div>
            </div>
          </Swatch>

          <Swatch label="Input">
            <div
              style={{
                border: `1px solid ${t.ring}`,
                boxShadow: `0 0 0 3px ${t.ring}22`,
                borderRadius: radius.input,
                padding: '12px 14px',
                fontSize: 17,
                color: t.foreground,
                background: t.card,
              }}
            >
              Search issues…
            </div>
          </Swatch>

          <Swatch label="Badge">
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <Badge tone="primary">In Progress</Badge>
              <Badge tone="yellow">Priority</Badge>
              <Badge tone="muted">Backlog</Badge>
            </div>
          </Swatch>

          <Swatch label="Tabs">
            <div style={{ display: 'flex', gap: 28, borderBottom: `1px solid ${t.border}` }}>
              <div
                style={{
                  fontSize: 17,
                  fontWeight: 600,
                  color: t.foreground,
                  paddingBottom: 10,
                  borderBottom: `2px solid ${t.primary}`,
                }}
              >
                Active
              </div>
              <div style={{ fontSize: 17, color: t.mutedForeground, paddingBottom: 10 }}>
                Backlog
              </div>
              <div style={{ fontSize: 17, color: t.mutedForeground, paddingBottom: 10 }}>
                Done
              </div>
            </div>
          </Swatch>

          <Swatch label="Alert">
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 12,
                padding: '14px 16px',
                borderRadius: radius.input,
                background: `${t.accentYellow}22`,
                border: `1px solid ${t.accentYellow}88`,
              }}
            >
              <span style={{ fontSize: 18 }}>⚠</span>
              <div style={{ fontSize: 15, lineHeight: 1.4, color: '#6b5410' }}>
                Cycle ends in 2 days
              </div>
            </div>
          </Swatch>

          <Swatch label="Table">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0, fontSize: 15 }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '8px 0',
                  borderBottom: `1px solid ${t.border}`,
                  color: t.mutedForeground,
                  fontFamily: mono,
                  fontSize: 13,
                }}
              >
                <span>ISSUE</span>
                <span>STATUS</span>
              </div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '10px 0',
                  borderBottom: `1px solid ${t.border}`,
                }}
              >
                <span>ENG-142</span>
                <Badge tone="primary">Active</Badge>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0' }}>
                <span>ENG-118</span>
                <Badge tone="muted">Done</Badge>
              </div>
            </div>
          </Swatch>

          <Swatch label="Tooltip">
            <div
              style={{
                position: 'relative',
                display: 'flex',
                justifyContent: 'center',
              }}
            >
              <PillButton variant="secondary">Hover me</PillButton>
              <div
                style={{
                  position: 'absolute',
                  top: -46,
                  fontFamily: mono,
                  fontSize: 13,
                  color: t.card,
                  background: t.foreground,
                  padding: '6px 12px',
                  borderRadius: 6,
                }}
              >
                Assign to cycle
              </div>
            </div>
          </Swatch>

          <Swatch label="Modal">
            <div
              style={{
                border: `1px solid ${t.border}`,
                borderRadius: radius.card,
                background: t.card,
                boxShadow: '0 20px 40px -16px rgba(0,0,0,0.18)',
                padding: 18,
              }}
            >
              <div style={{ fontSize: 17, fontWeight: 600, marginBottom: 8 }}>Delete issue?</div>
              <div style={{ fontSize: 14, color: t.mutedForeground, marginBottom: 16 }}>
                This can&rsquo;t be undone.
              </div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <PillButton variant="secondary">Cancel</PillButton>
                <PillButton variant="primary">Delete</PillButton>
              </div>
            </div>
          </Swatch>

          <Swatch label="Avatar">
            <div style={{ display: 'flex' }}>
              <div style={{ marginRight: -12 }}>
                <Avatar initials="TK" color={t.primary} />
              </div>
              <div style={{ marginRight: -12 }}>
                <Avatar initials="RS" color="#8a6d1a" />
              </div>
              <Avatar initials="+3" color={t.mutedForeground} />
            </div>
          </Swatch>
        </div>
      </div>
    </div>
  </div>
);

export const meta: SlideMeta = {
  title: 'Linear',
  createdAt: '2026-07-16T16:55:42.556Z',
};
export default [Cover] satisfies Page[];

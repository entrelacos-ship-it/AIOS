---
name: Gmail
description: Material 3 productivity system — cool-white surfaces, Google Blue 700 action color, pale-blue Compose pill, dense 40px rows.
---

# Gmail

## Palette

| Role         | Value       | Notes                                    |
| ------------ | ----------- | ------------------------------------------ |
| bg            | `#F6F8FC`  | cool-white canvas — sidebar/rail surface   |
| text          | `#1F1F1F`  | on-surface — unread sender/subject, body   |
| accent        | `#0B57D0`  | Google Blue 700 — primary action/focus/link|
| muted         | `#444746`  | on-surface-variant — read state, meta      |
| card (bright) | `#FFFFFF`  | message list / conversation surface        |
| compose-pill  | `#C2E7FF`  | Compose pill + active nav-rail item        |
| selected-row  | `#D3E3FD`  | M3 primary-container — selected row tint   |
| border        | `#C4C7C5`  | M3 outline gray                            |
| status-green  | `#34A853`  | online/active status dot                   |
| star-yellow   | `#FBBC04`  | filled star only                           |

## Typography

- Display font: `"Google Sans", Roboto, ui-sans-serif, system-ui` — wordmark and page titles ONLY, weight 500.
- Body font: `Roboto, ui-sans-serif, system-ui` — weight 400, all UI/list/sidebar text. Never substitute Google Sans for body.
- Mono: `"Roboto Mono", ui-monospace, monospace`.
- Type-scale overrides (M3 productivity density — smaller and denser than a typical slide deck):
  - Hero title (for a title slide, not real Gmail UI): 130px, weight 500, line-height 1.0, letter-spacing -0.01em
  - Page title: 56px, Google Sans, weight 500
  - List row / body: 30px, Roboto, weight 400 (700 for "unread" emphasis)
  - Caption/meta: 22px, Roboto, weight 400, color muted

## Layout

- Content padding: 120px from canvas edges.
- Alignment: left-aligned, dense functional rows rather than airy marketing blocks — this theme is for product/UI-style slides, not poster slides.
- Grid notes: four-pane chrome (56px app rail + 256px sidebar + content + 56px addon rail) is the signature layout to reference when mocking Gmail UI on a slide.

## Fixed components

### Title

```tsx
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
```

### Footer

Pull the page number from `useSlidePageNumber()` — never hardcode `pageNum` / `total` props.

```tsx
import { useSlidePageNumber } from '@open-slide/core';

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
```

### Eyebrow

```tsx
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
```

### Compose pill (signature element)

```tsx
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
```

### Inbox row

```tsx
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
```

## Motion

- Philosophy: **static** — Gmail's own chrome carries almost no marketing motion; hierarchy comes from density and weight, not animation.

## Aesthetic

**Material 3 productivity, dense and functional.** A cool-white canvas hosts Google Blue 700 as the single interactive-action color, with a paler compose-blue reserved for the signature Compose pill and active states. Everything else is grayscale (`#1F1F1F` unread / `#444746` read) — hierarchy is binary contrast, not color. Rows are 40–60px tall, borderless, separated by weight and whitespace rather than rules. Icons swap between outline and filled to signal state. This theme suits slides that *mock product UI* (dashboards, inbox-style screens) rather than poster/marketing decks. Avoid: warm colors, drop shadows on list rows, Google Sans at body sizes.

## Example usage

```tsx
const Cover: Page = () => (
  <div style={{ width: '100%', height: '100%', background: '#F6F8FC', color: '#1F1F1F', padding: 120, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
    <Eyebrow>WORKSPACE</Eyebrow>
    <div style={{ marginTop: 24 }}>
      <Title>The Big Idea</Title>
    </div>
    <p style={{ fontSize: 30, color: '#444746', maxWidth: 1200, marginTop: 28 }}>
      A short subtitle that explains what this slide is about.
    </p>
    <div style={{ marginTop: 36 }}>
      <ComposePill>Compose</ComposePill>
    </div>
    <Footer />
  </div>
);
```

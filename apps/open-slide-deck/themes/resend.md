---
name: Resend
description: Crisp black-on-white developer-tool editorial — pure black type, orange focus ring, tight radii.
---

# Resend

## Palette

| Role      | Value       | Notes                                  |
| --------- | ----------- | ---------------------------------------- |
| bg         | `#fdfdfd`  | canvas — near-white, not pure white      |
| text       | `#000000`  | foreground, headlines, body              |
| accent     | `#ff801f`  | ring/orange — focus states, key CTAs     |
| muted      | `#666666`  | muted-foreground, secondary copy         |
| card       | `#ffffff`  | card surface                              |
| secondary  | `#f4f4f5`  | secondary surface, chips                 |
| border     | `#f0f0f0`  | hairline borders                          |
| inverse    | `#18181b`  | dark card variant                         |

## Typography

- Display font: `var(--font-abc-favorit), ui-sans-serif, system-ui, sans-serif` — weight 600–700, tight and confident.
- Body font: `Inter, ui-sans-serif, system-ui, sans-serif` — weight 400.
- Mono: `var(--font-commit-mono), ui-monospace, SFMono-Regular, Menlo, monospace` — for API/code snippets, the developer-tool signature.
- Type-scale overrides:
  - Hero title: 150px, weight 700, line-height 0.95, letter-spacing -0.03em
  - Section heading: 88px, weight 600, line-height 1.0, letter-spacing -0.02em
  - Body: 34px, weight 400, line-height 1.4
  - Mono label: 22px, weight 500, line-height 1.3 — code/API references

## Layout

- Content padding: 130px from canvas edges.
- Alignment: left-aligned, single column, generous whitespace — developer-doc calm rather than marketing bombast.
- Grid notes: code/API examples sit in a bordered mono block; keep at most one per page.

## Fixed components

### Title

```tsx
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
      <span>{String(current).padStart(2, '0')} / {String(total).padStart(2, '0')}</span>
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
      letterSpacing: '0.05em',
      textTransform: 'uppercase',
      fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
      color: '#ff801f',
    }}
  >
    {children}
  </div>
);
```

### Code block

```tsx
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
```

## Motion

- Philosophy: **subtle** — quick entrance fades, no looping decoration. Developer docs move fast, not theatrically.

```css
@keyframes resendFadeUp {
  from { opacity: 0; transform: translateY(16px); }
  to   { opacity: 1; transform: translateY(0); }
}
.resend-fadeUp { opacity: 0; animation: resendFadeUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
```

## Aesthetic

**Crisp black-on-white developer editorial.** Near-white canvas, pure-black type, a single warm-orange accent reserved for focus rings and key CTAs — everything else is monochrome. Radii stay tight (4px inputs/buttons, 12px cards) — nothing pill-shaped except badges. Feels like a well-typeset API reference: confident headlines, calm body copy, code blocks as the visual anchor. Avoid: gradients, heavy shadows, more than one accent color.

## Example usage

```tsx
const Cover: Page = () => (
  <div style={{ width: '100%', height: '100%', background: '#fdfdfd', color: '#000000', padding: 130, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
    <Eyebrow>EMAIL API</Eyebrow>
    <div style={{ marginTop: 24 }}>
      <Title>The Big Idea</Title>
    </div>
    <p style={{ fontSize: 34, color: '#666666', maxWidth: 1200, marginTop: 32 }}>
      A short subtitle that explains what this slide is about.
    </p>
    <Footer />
  </div>
);
```

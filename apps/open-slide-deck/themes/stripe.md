---
name: Stripe
description: Fintech marketing-gradient editorial — violet primary, ivory-white surfaces, restrained shadow ladder, sohne display.
---

# Stripe

## Palette

| Role      | Value       | Notes                                    |
| --------- | ----------- | ------------------------------------------ |
| bg         | `#ffffff`  | canvas / surface                           |
| text       | `#061b31`  | ink — headlines, body                      |
| accent     | `#533afd`  | primary — CTAs, links, info                |
| muted      | `#64748d`  | muted-foreground, secondary copy           |
| tertiary   | `#ff6118`  | warm secondary accent — use sparingly      |
| success    | `#00b261`  | positive semantic                          |
| border     | `#e5edf5`  | hairline                                   |
| surface    | `#f8fafd`  | muted surface / input bg                   |
| gradient   | `linear-gradient(135deg, #7232f1, #fb76fa)` | rare gradient panel accent |

## Typography

- Display/body font: `"sohne-var", "SF Pro Display", "Helvetica Neue", Arial, sans-serif` — weight 300 throughout (unusually light for display).
- Mono: `SourceCodePro, "SFMono-Regular", monospace`.
- Type-scale overrides (light-weight display is the signature — never bump to bold):
  - Hero title: 130px, weight 300, line-height 1.0, letter-spacing -0.02em
  - Section heading: 90px, weight 300, line-height 1.03, letter-spacing -0.02em
  - Body: 34px, weight 300, line-height 1.4

## Layout

- Content padding: 130px from canvas edges.
- Alignment: left-aligned, editorial calm — Stripe's marketing pages read like a finance publication, not a SaaS pitch deck.
- Grid notes: gradient panels (violet→pink) are rare accent blocks, not backgrounds — use at most once per page.

## Fixed components

### Title

```tsx
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
        fontFamily: '"sohne-var", Arial, sans-serif',
        color: '#64748d',
      }}
    >
      <span>STRIPE</span>
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
      fontFamily: '"sohne-var", Arial, sans-serif',
      color: '#533afd',
    }}
  >
    {children}
  </div>
);
```

### Primary button

```tsx
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
```

### Gradient panel

```tsx
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
```

## Motion

- Philosophy: **subtle** — quick, restrained entrance fades, no bounce or overshoot.

```css
@keyframes stripeFadeUp {
  from { opacity: 0; transform: translateY(16px); }
  to   { opacity: 1; transform: translateY(0); }
}
.stripe-fadeUp { opacity: 0; animation: stripeFadeUp 0.6s ease forwards; }
```

## Aesthetic

**Fintech editorial calm.** A pure-white canvas holds light-weight (300) display type in violet-adjacent ink — nothing bold, nothing shouting. The violet primary (`#533afd`) carries every CTA and link; a warm orange tertiary and rare violet→pink gradient panels punctuate sparingly. Depth comes from a soft, layered shadow ladder (never harsh), and 6px radii keep everything crisp and precise — this is a payments company, precision is the brand. Avoid: bold/black type weights, saturated full-bleed gradients, playful illustration.

## Example usage

```tsx
const Cover: Page = () => (
  <div style={{ width: '100%', height: '100%', background: '#ffffff', color: '#061b31', padding: 130, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
    <Eyebrow>PAYMENTS</Eyebrow>
    <div style={{ marginTop: 24 }}>
      <Title>The Big Idea</Title>
    </div>
    <p style={{ fontSize: 34, color: '#64748d', maxWidth: 1200, marginTop: 32 }}>
      A short subtitle that explains what this slide is about.
    </p>
    <div style={{ marginTop: 40 }}>
      <Button>Comece já</Button>
    </div>
    <Footer />
  </div>
);
```

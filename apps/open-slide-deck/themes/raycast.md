---
name: Raycast
description: macOS-native precision-instrument dark — blue-tinted near-black, multi-layer inset shadows, Raycast Red as rare punctuation.
---

# Raycast

## Palette

| Role       | Value       | Notes                                       |
| ---------- | ----------- | --------------------------------------------- |
| bg          | `#07080a`  | near-black, blue-cold tint — not pure black    |
| text        | `#f9f9f9`  | primary heading/body text                       |
| accent      | `#55b3ff`  | Raycast Blue — links, focus, selected           |
| muted       | `#9c9c9d`  | secondary text, nav links                       |
| red         | `#ff6363`  | Raycast Red — rare punctuation, danger only     |
| green       | `#5fc992`  | success states                                  |
| card        | `#101111`  | surface-100 — elevated card background          |
| border      | `rgba(255,255,255,0.06)` | card containment hairline         |

## Typography

- Display/body font: `Inter, ui-sans-serif, system-ui, sans-serif` — used everywhere, weight 500 baseline (not 400) for dark-mode legibility.
- Mono: `GeistMono, ui-monospace, SFMono-Regular, Menlo, monospace` — code, keyboard shortcuts.
- Type-scale overrides (note the unusual **positive** letter-spacing on body — the brand signature):
  - Hero title: 140px, weight 600, line-height 1.05, letter-spacing 0
  - Section heading: 88px, weight 400, line-height 1.1, letter-spacing 0.5px
  - Body: 32px, weight 500, line-height 1.5, letter-spacing 0.4px (positive!)
  - Caption/label: 20px, weight 500, letter-spacing 0.4px

## Layout

- Content padding: 130px from canvas edges.
- Alignment: left-aligned, dramatic negative space — content floats in a dark void.
- Grid notes: product screenshots/mockups get macOS window chrome (rounded 12px, heavy layered shadow) when referenced on a slide.

## Fixed components

### Title

```tsx
const Title = ({ children }: { children: React.ReactNode }) => (
  <h1
    style={{
      fontSize: 140,
      fontWeight: 600,
      lineHeight: 1.05,
      letterSpacing: '0px',
      margin: 0,
      color: '#f9f9f9',
      fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif',
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
        letterSpacing: '0.4px',
        fontFamily: 'GeistMono, ui-monospace, monospace',
        color: '#9c9c9d',
      }}
    >
      <span>RAYCAST</span>
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
      fontWeight: 600,
      letterSpacing: '0.08em',
      textTransform: 'uppercase',
      fontFamily: 'GeistMono, ui-monospace, monospace',
      color: '#9c9c9d',
    }}
  >
    {children}
  </div>
);
```

### Pill button (macOS-native shadow)

```tsx
const PillButton = ({ children }: { children: React.ReactNode }) => (
  <span
    style={{
      display: 'inline-flex',
      alignItems: 'center',
      fontSize: 24,
      fontWeight: 600,
      letterSpacing: '0.5px',
      padding: '16px 30px',
      borderRadius: 100,
      background: 'transparent',
      color: '#f9f9f9',
      boxShadow:
        'rgba(255,255,255,0.05) 0px 1px 0px 0px inset, rgba(255,255,255,0.25) 0px 0px 0px 1px, rgba(0,0,0,0.2) 0px -1px 0px 0px inset',
    }}
  >
    {children}
  </span>
);
```

### Card (double-ring shadow)

```tsx
const Card = ({ children }: { children: React.ReactNode }) => (
  <div
    style={{
      background: '#101111',
      borderRadius: 16,
      padding: 32,
      boxShadow: 'rgb(27,28,30) 0px 0px 0px 1px, rgb(7,8,10) 0px 0px 0px 1px inset',
    }}
  >
    {children}
  </div>
);
```

### Keyboard key cap

```tsx
const KeyCap = ({ children }: { children: React.ReactNode }) => (
  <span
    style={{
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      minWidth: 44,
      height: 44,
      padding: '0 12px',
      borderRadius: 6,
      background: 'linear-gradient(180deg, #121212, #0d0d0d)',
      color: '#f9f9f9',
      fontFamily: 'GeistMono, ui-monospace, monospace',
      fontSize: 20,
      boxShadow: 'rgba(0,0,0,0.4) 0px 1.5px 0.5px 2.5px',
    }}
  >
    {children}
  </span>
);
```

## Motion

- Philosophy: **subtle** — opacity-only hover transitions (0.6 on interactive elements), no bounce/scale. Restrained, tool-like.

## Aesthetic

**Precision-instrument dark.** A blue-cold near-black canvas (never pure black) holds Inter with unusually *positive* letter-spacing — an airy counterpoint to the dense dark surfaces. Depth comes from macOS-native multi-layer shadows: outer rings for containment, inset highlights simulating a light source from above. Raycast Red is a punctuation color, appearing only in hero moments and danger states — the everyday interactive accent is blue. Feels like the inside of a Swiss watch case: fast, minimal, trustworthy. Avoid: pure black, negative letter-spacing on body, single-layer flat shadows, red as a pervasive accent.

## Example usage

```tsx
const Cover: Page = () => (
  <div style={{ width: '100%', height: '100%', background: '#07080a', color: '#f9f9f9', padding: 130, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
    <Eyebrow>LAUNCHER</Eyebrow>
    <div style={{ marginTop: 24 }}>
      <Title>The Big Idea</Title>
    </div>
    <p style={{ fontSize: 32, color: '#9c9c9d', maxWidth: 1200, marginTop: 32, letterSpacing: '0.4px' }}>
      A short subtitle that explains what this slide is about.
    </p>
    <div style={{ marginTop: 40 }}>
      <PillButton>Download for Mac</PillButton>
    </div>
    <Footer />
  </div>
);
```

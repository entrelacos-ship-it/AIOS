---
name: Anthropic
description: Warm slate-on-ivory research editorial — serif body/display, sans headings, clay accent, inset-highlight slate buttons.
---

# Anthropic

## Palette

| Role      | Value       | Notes                                    |
| --------- | ----------- | ------------------------------------------ |
| bg         | `#faf9f5`  | ivory-light — page canvas                  |
| text       | `#141413`  | slate-dark — headings, body                 |
| accent     | `#d97757`  | clay — brand accent, focus, links only     |
| muted      | `#5e5d59`  | slate-light — secondary text                |
| card       | `#ffffff`  | white — card surface (not ivory)           |
| surface-2  | `#f0eee6`  | ivory-medium — secondary surface           |
| border     | `rgba(20,20,19,0.10)` | alpha slate hairline           |
| inverse    | `#141413`  | dark closing-section background            |

## Typography

- Display/body font: `"Anthropic Serif", Georgia, serif` — weight 400 for BOTH large display headlines and body prose. This is the brand's most distinctive move: serif at hero scale.
- Heading/UI font: `"Anthropic Sans", Arial, sans-serif` — weight 500–700, for h2-and-below, labels, nav, buttons.
- Mono: `"Anthropic Mono", "JetBrains Mono", ui-monospace, monospace`.
- Type-scale overrides:
  - Hero title (Serif): 130px, weight 400, line-height 1.1, letter-spacing -0.02em
  - Section heading (Sans): 88px, weight 700, line-height 1.1, letter-spacing -0.02em
  - Body (Serif): 34px, weight 400, line-height 1.5
  - Label (Sans): 22px, weight 500, letter-spacing -0.005em

## Layout

- Content padding: 130px from canvas edges.
- Alignment: left-aligned, generous — reading column feels like a considered publication, not a pitch deck.
- Grid notes: cards are white on ivory (not ivory-on-ivory) with alpha borders — never solid `#e8e6dc`.

## Fixed components

### Title

```tsx
const Title = ({ children }: { children: React.ReactNode }) => (
  <h1
    style={{
      fontSize: 130,
      fontWeight: 400,
      lineHeight: 1.1,
      letterSpacing: '-0.02em',
      margin: 0,
      color: '#141413',
      fontFamily: '"Anthropic Serif", Georgia, serif',
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
        fontFamily: 'Anthropic Sans, Arial, sans-serif',
        color: '#5e5d59',
      }}
    >
      <span>ANTHROPIC</span>
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
      letterSpacing: '-0.005em',
      textTransform: 'uppercase',
      fontFamily: 'Anthropic Sans, Arial, sans-serif',
      color: '#5e5d59',
    }}
  >
    {children}
  </div>
);
```

### Primary button (signature inset highlight)

```tsx
const Button = ({ children }: { children: React.ReactNode }) => (
  <span
    style={{
      display: 'inline-flex',
      alignItems: 'center',
      fontSize: 24,
      fontWeight: 500,
      padding: '18px 30px',
      borderRadius: 4,
      background: '#141413',
      color: '#faf9f5',
      fontFamily: 'Anthropic Sans, Arial, sans-serif',
      boxShadow:
        'inset 0 6px 12px rgba(255,255,255,0.12), inset 0 1px 1px rgba(255,255,255,0.19)',
    }}
  >
    {children}
  </span>
);
```

## Motion

- Philosophy: **static** — no press-scale transforms, calm color/shadow transitions only, matching the brand's careful, unhurried tone.

## Aesthetic

**Calm research-lab editorial.** A warm ivory canvas (never pure white) holds serif type at every scale — this is the brand's core signature, serif isn't reserved for body copy, it carries the hero headline too. Slate-dark is the action color; a single clay accent marks focus, links, and the brand mark only. Cards are white, bordered with a soft alpha-slate hairline, never shadow-heavy — the one distinctive depth cue is the inset-highlight glow on dark buttons, giving them a glass-like tactile quality. Avoid: pure white backgrounds, bold sans for body, heavy drop shadows, clay as a button fill.

## Example usage

```tsx
const Cover: Page = () => (
  <div style={{ width: '100%', height: '100%', background: '#faf9f5', color: '#141413', padding: 130, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
    <Eyebrow>AI SAFETY</Eyebrow>
    <div style={{ marginTop: 28 }}>
      <Title>The Big Idea</Title>
    </div>
    <p style={{ fontFamily: '"Anthropic Serif", Georgia, serif', fontSize: 34, color: '#5e5d59', maxWidth: 1200, marginTop: 32 }}>
      A short subtitle that explains what this slide is about.
    </p>
    <div style={{ marginTop: 40 }}>
      <Button>Talk to Claude</Button>
    </div>
    <Footer />
  </div>
);
```

---
name: Framer
description: Near-black marketing poster system — oversized negative-tracked display type, white pill CTAs, and rare gradient spotlight cards.
---

# Framer

## Palette

| Role             | Value                          | Notes                                          |
| ---------------- | ------------------------------- | ----------------------------------------------- |
| bg (canvas)       | `#0a0a0b`                      | near-black, faint warmth — the only page ground |
| text (ink)        | `#ffffff`                      | headlines, emphasized body                      |
| accent            | `#0099ff`                      | sky blue — links, focus rings, selection only   |
| muted (ink-muted) | `#999999`                      | secondary copy, meta, deselected states         |
| surface-1         | `#18181b`                      | pricing cards, secondary buttons, mockup tiles  |
| surface-2         | `#242428`                      | featured card, hero pill backdrop, selected tab |
| hairline          | `rgba(255,255,255,0.10)`       | input borders, table dividers                   |
| hairline-soft     | `rgba(255,255,255,0.06)`       | FAQ row / footer column rules                   |
| inverse-canvas    | `#ffffff`                      | light-on-dark pill surface, light thumbnails    |
| success           | `#2ecc71`                      | comparison-table checkmarks (glyph only)        |
| gradient-violet   | `linear-gradient(135deg, #7b5cff, #2a1a5e)` | spotlight card — most common       |
| gradient-magenta  | `linear-gradient(135deg, #ff5cd6, #5e1a4a)` | spotlight card                     |
| gradient-orange   | `linear-gradient(135deg, #ff8a3d, #5e2a1a)` | spotlight card — sunset wash       |
| gradient-coral    | `linear-gradient(135deg, #ff7a7a, #5e1a2a)` | spotlight card                     |

## Typography

- Display font: `"GT Walsheim Medium Placeholder", "Mona Sans", "Geist", -apple-system, sans-serif` — weight 500 only, never heavier.
- Body font: `"Inter Variable", "Inter", -apple-system, sans-serif` — weight 400, with `font-feature-settings: 'cv01','cv05','cv09','cv11','ss03','ss07','dlig'` applied wherever body type appears.
- Type-scale overrides (differ hard from `slide-authoring` defaults — letter-spacing is the brand signature):
  - Hero title (display-xxl): **150px**, weight 500, line-height 0.85, letter-spacing **-7.5px** (scaled up from the site's 110px/-5.5px at the same 5% ratio for the 1920 canvas)
  - Section heading (display-xl): 100px, weight 500, line-height 0.95, letter-spacing -5px
  - Body text (body-lg): 34px, weight 400, line-height 1.3, letter-spacing -0.2px
  - Caption/eyebrow: 20px, weight 500, line-height 1.2, letter-spacing 0.14em (mono, uppercase — the one place tracking goes *positive*, for eyebrows only)

## Layout

- Content padding: 140px from canvas edges (1920 × 1080) — Framer's dark canvas needs more air than a light deck.
- Alignment: left-aligned, single column. Ceremony comes from scale, not centering.
- Grid notes: gradient spotlight cards sit in a 2 or 3-up row, 30px radius, never more than 2 on screen at once (per the Do's/Don'ts — 3+ reads as a moodboard).

## Fixed components

These are paste-ready. Copy them verbatim into a slide that uses this theme.

### Title

```tsx
const Title = ({ children }: { children: React.ReactNode }) => (
  <h1
    style={{
      fontSize: 150,
      fontWeight: 500,
      lineHeight: 0.85,
      letterSpacing: '-7.5px',
      margin: 0,
      color: '#ffffff',
      fontFamily: '"GT Walsheim Medium Placeholder", "Mona Sans", -apple-system, sans-serif',
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
        left: 140,
        right: 140,
        bottom: 56,
        display: 'flex',
        justifyContent: 'space-between',
        fontSize: 20,
        letterSpacing: '0.14em',
        textTransform: 'uppercase',
        fontFamily: '"Berkeley Mono", ui-monospace, monospace',
        color: '#999999',
      }}
    >
      <span>FRAMER</span>
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
      letterSpacing: '0.14em',
      textTransform: 'uppercase',
      fontFamily: '"Berkeley Mono", ui-monospace, monospace',
      color: '#0099ff',
    }}
  >
    {children}
  </div>
);
```

### Primary pill button

```tsx
const PillButton = ({ children }: { children: React.ReactNode }) => (
  <span
    style={{
      display: 'inline-flex',
      alignItems: 'center',
      fontSize: 24,
      fontWeight: 500,
      padding: '18px 30px',
      borderRadius: 100,
      background: '#ffffff',
      color: '#0a0a0b',
    }}
  >
    {children}
  </span>
);
```

### Gradient spotlight card

```tsx
const SpotlightCard = ({
  variant = 'violet',
  children,
}: {
  variant?: 'violet' | 'magenta' | 'orange' | 'coral';
  children: React.ReactNode;
}) => {
  const gradients = {
    violet: 'linear-gradient(135deg, #7b5cff, #2a1a5e)',
    magenta: 'linear-gradient(135deg, #ff5cd6, #5e1a4a)',
    orange: 'linear-gradient(135deg, #ff8a3d, #5e2a1a)',
    coral: 'linear-gradient(135deg, #ff7a7a, #5e1a2a)',
  };
  return (
    <div
      style={{
        background: gradients[variant],
        borderRadius: 30,
        padding: 40,
        color: '#ffffff',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-end',
      }}
    >
      {children}
    </div>
  );
};
```

## Motion

- Philosophy: **subtle** — entrance fades only, matching the poster-cut editorial pacing of the source site. No looping decoration.
- Reusable keyframes (paste-ready):

```css
@keyframes framerFadeUp {
  from { opacity: 0; transform: translateY(20px); }
  to   { opacity: 1; transform: translateY(0); }
}
.framer-fadeUp { opacity: 0; animation: framerFadeUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
```

## Aesthetic

**Poster-grade dark editorial.** A near-black canvas holds one assertive, massively-tracked-negative headline per page — the composition reads like a gallery wall, not a slide deck. Chrome stays monochrome (white pills, charcoal cards, gray secondary text); the only chromatic move is a sparing sky-blue accent on links/focus, and the occasional oversized gradient spotlight card that punches a single vivid color field into an otherwise black-and-white grid. Never light-mode. Never more than one or two spotlight cards in view at once. Avoid heavy shadows — depth comes from surface lift (canvas → surface-1 → surface-2), not drop shadows.

## Example usage

```tsx
const Cover: Page = () => (
  <div style={{ width: '100%', height: '100%', background: '#0a0a0b', color: '#ffffff', padding: 140, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
    <Eyebrow>PRODUCT</Eyebrow>
    <Title>The Big Idea</Title>
    <p style={{ fontSize: 34, color: '#999999', maxWidth: 1200, marginTop: 32, letterSpacing: '-0.2px' }}>
      A short subtitle that explains what this slide is about.
    </p>
    <div style={{ marginTop: 48 }}>
      <PillButton>Get started</PillButton>
    </div>
    <Footer />
  </div>
);
```

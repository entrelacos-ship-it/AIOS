---
name: Lovable
description: Warm parchment editorial — opacity-derived neutrals, humanist Camera Plain display type, inset-shadow dark buttons.
---

# Lovable

## Palette

| Role      | Value                      | Notes                                     |
| --------- | --------------------------- | ------------------------------------------ |
| bg         | `#f7f4ed`                  | warm cream — page + card surface, not white |
| text       | `#1c1c1c`                  | charcoal — headings, body                   |
| accent     | `#3b82f6`                  | single blue accent — links, focus ring      |
| muted      | `#5f5f5d`                  | secondary copy, captions                    |
| off-white  | `#fcfbf8`                  | button text on dark surface                 |
| border     | `#eceae4`                  | passive card/divider border                 |
| border-int | `rgba(28,28,28,0.4)`       | interactive/outline border                  |
| charcoal-4 | `rgba(28,28,28,0.04)`      | subtle hover tint                           |

## Typography

- Display font: `"Camera Plain Variable", ui-sans-serif, system-ui, sans-serif` — humanist warmth, rounded terminals. Weight 600 for headings, weight 480 for lighter display moments.
- Body font: same family, weight 400 — narrow weight band (400/600 only, never 700+).
- Mono: `ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace`.
- Type-scale overrides (compressed at display, comfortable at body — opposite of most decks):
  - Hero title: 150px, weight 600, line-height 1.0, letter-spacing -0.04em
  - Section heading: 90px, weight 600, line-height 1.05, letter-spacing -0.03em
  - Body: 34px, weight 400, line-height 1.5, letter-spacing 0

## Layout

- Content padding: 130px from canvas edges.
- Alignment: left-aligned, single column, editorial generosity — wide gaps between sections (equivalent of the site's 80–208px scaled up).
- Grid notes: cards use warm cream fill (same as bg) with a `#eceae4` border — never a shadow-lifted white card.

## Fixed components

### Title

```tsx
const Title = ({ children }: { children: React.ReactNode }) => (
  <h1
    style={{
      fontSize: 150,
      fontWeight: 600,
      lineHeight: 1.0,
      letterSpacing: '-0.04em',
      margin: 0,
      color: '#1c1c1c',
      fontFamily: '"Camera Plain Variable", ui-sans-serif, system-ui, sans-serif',
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
        fontFamily: 'ui-monospace, monospace',
        color: '#5f5f5d',
      }}
    >
      <span>LOVABLE</span>
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
      fontFamily: 'ui-monospace, monospace',
      color: '#5f5f5d',
    }}
  >
    {children}
  </div>
);
```

### Primary button (signature inset shadow)

```tsx
const PillButton = ({ children }: { children: React.ReactNode }) => (
  <span
    style={{
      display: 'inline-flex',
      alignItems: 'center',
      fontSize: 24,
      fontWeight: 400,
      padding: '18px 30px',
      borderRadius: 10,
      background: '#1c1c1c',
      color: '#fcfbf8',
      boxShadow:
        'rgba(255,255,255,0.2) 0px 0.5px 0px 0px inset, rgba(0,0,0,0.2) 0px 0px 0px 0.5px inset, rgba(0,0,0,0.05) 0px 1px 2px 0px',
    }}
  >
    {children}
  </span>
);
```

## Motion

- Philosophy: **subtle** — gentle entrance fades, no dramatic movement. Warm and unhurried.

```css
@keyframes lovableFadeUp {
  from { opacity: 0; transform: translateY(18px); }
  to   { opacity: 1; transform: translateY(0); }
}
.lovable-fadeUp { opacity: 0; animation: lovableFadeUp 0.8s ease forwards; }
```

## Aesthetic

**Warm parchment editorial.** A creamy off-white canvas (never pure white) holds humanist, slightly-rounded display type in tight negative tracking — confident but never cold. All grays derive from a single charcoal hue at varying opacity, giving the page unified tonal warmth. Cards are borders, not shadows; the one exception is the signature inset-highlight shadow on dark buttons, which gives them a tactile, pressed-into-paper feel. One blue accent, used sparingly. Avoid: pure white backgrounds, heavy drop shadows, bold (700+) type weights.

## Example usage

```tsx
const Cover: Page = () => (
  <div style={{ width: '100%', height: '100%', background: '#f7f4ed', color: '#1c1c1c', padding: 130, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
    <Eyebrow>PRODUCT</Eyebrow>
    <div style={{ marginTop: 24 }}>
      <Title>The Big Idea</Title>
    </div>
    <p style={{ fontSize: 34, color: '#5f5f5d', maxWidth: 1200, marginTop: 32 }}>
      A short subtitle that explains what this slide is about.
    </p>
    <div style={{ marginTop: 40 }}>
      <PillButton>Start building</PillButton>
    </div>
    <Footer />
  </div>
);
```

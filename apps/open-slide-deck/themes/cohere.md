---
name: Cohere
description: Enterprise AI command-center editorial — white canvas, monumental tight-tracked headlines, and deep green/navy product bands.
---

# Cohere

## Palette

| Role           | Value       | Notes                                          |
| -------------- | ----------- | ----------------------------------------------- |
| bg (canvas)     | `#ffffff`  | dominant page ground — editorial white          |
| text (ink)      | `#212121`  | default body / headline text                    |
| accent          | `#1863dc`  | action blue — links, pagination only            |
| muted           | `#93939f`  | footer links, dates, de-emphasized labels        |
| black           | `#000000`  | announcement bar, highest-contrast text          |
| near-black      | `#17171c`  | primary CTA fill, footer, deep UI cards          |
| deep-green      | `#003c33`  | dark product hero band (North / Command style)   |
| dark-navy       | `#071829`  | financial-services / security solution band      |
| coral           | `#ff7759`  | blog taxonomy chips, warm markers                |
| soft-coral      | `#ffad9b` | pale chip borders                                |
| stone           | `#eeece7` | product cards, testimonial surface               |
| hairline        | `#d9d9dd` | list rules, dividers                             |
| focus-blue      | `#4c6ee6` | keyboard focus ring                              |

## Typography

- Display font: `CohereText, "Space Grotesk", Inter, ui-sans-serif, system-ui` — weight 400 only, huge and tight.
- Body font: `"Unica77 Cohere Web", Inter, Arial, ui-sans-serif, system-ui` — weight 400, never bold.
- Mono/technical labels: `CohereMono, Arial, ui-sans-serif, system-ui` — uppercase, for category/system markers.
- Type-scale overrides (differ hard from `slide-authoring` defaults — line-height 1.0 and tight negative tracking are the signature):
  - Hero title (display-xxl): **160px**, weight 400, line-height 1.0, letter-spacing **-3.2px** (scaled from the site's 96px/-1.92px at the same 2% ratio)
  - Section heading: 100px, weight 400, line-height 1.0, letter-spacing -2px
  - Card heading: 40px, weight 400, line-height 1.2, letter-spacing -0.4px
  - Body: 28px, weight 400, line-height 1.5, letter-spacing 0
  - Mono label: 20px, weight 400, line-height 1.4, letter-spacing 0.28em, uppercase

## Layout

- Content padding: 130px from canvas edges (1920 × 1080).
- Alignment: left-aligned on product/content pages; centered only for hero declaration pages.
- Grid notes: one oversized headline per page, then settle into restrained body copy — never stack two big type moments on one page. Trust-logo-style rows use very wide horizontal spacing, no cards, no borders.

## Fixed components

These are paste-ready. Copy them verbatim into a slide that uses this theme.

### Title

```tsx
const Title = ({ children }: { children: React.ReactNode }) => (
  <h1
    style={{
      fontSize: 160,
      fontWeight: 400,
      lineHeight: 1.0,
      letterSpacing: '-3.2px',
      margin: 0,
      color: '#212121',
      fontFamily: 'CohereText, "Space Grotesk", Inter, ui-sans-serif, system-ui',
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
        letterSpacing: '0.28em',
        textTransform: 'uppercase',
        fontFamily: 'CohereMono, Arial, ui-sans-serif, system-ui',
        color: '#93939f',
      }}
    >
      <span>COHERE</span>
      <span>{String(current).padStart(2, '0')} / {String(total).padStart(2, '0')}</span>
    </div>
  );
};
```

### Eyebrow (mono label)

```tsx
const Eyebrow = ({ children }: { children: React.ReactNode }) => (
  <div
    style={{
      fontSize: 20,
      fontWeight: 400,
      letterSpacing: '0.28em',
      textTransform: 'uppercase',
      fontFamily: 'CohereMono, Arial, ui-sans-serif, system-ui',
      color: '#93939f',
    }}
  >
    {children}
  </div>
);
```

### Dark feature band wrapper

Use for deep-green or navy full-bleed pages — text flips to white inside.

```tsx
const DarkBand = ({
  tone = 'green',
  children,
}: {
  tone?: 'green' | 'navy';
  children: React.ReactNode;
}) => (
  <div
    style={{
      width: '100%',
      height: '100%',
      background: tone === 'green' ? '#003c33' : '#071829',
      color: '#ffffff',
    }}
  >
    {children}
  </div>
);
```

### Coral taxonomy chip

```tsx
const Chip = ({ children, active = false }: { children: React.ReactNode; active?: boolean }) => (
  <span
    style={{
      display: 'inline-flex',
      alignItems: 'center',
      fontFamily: '"Unica77 Cohere Web", Inter, sans-serif',
      fontSize: 20,
      fontWeight: 400,
      padding: '10px 22px',
      borderRadius: 30,
      background: active ? '#ff7759' : 'transparent',
      color: active ? '#17171c' : '#ff7759',
      border: `1.5px solid #ff7759`,
    }}
  >
    {children}
  </span>
);
```

## Motion

- Philosophy: **static** — the source system carries almost no interface motion; hierarchy comes from scale and whitespace, not animation. Keep pages snap-cut.

## Aesthetic

**Sober enterprise research-lab editorial.** A white, almost clinical canvas holds one monumental, tightly-tracked headline per page — restrained UI, austere black-and-white chrome, zero decorative color. Color only ever arrives through deliberate blocks: a full-bleed deep-green or navy product band, a coral taxonomy chip, a blue link. Cards are rounded (8–22px) but never playful — no drop shadows, no gradients as UI fill; depth comes from surface alternation and thin hairline rules. Avoid: bold weights, saturated gradients, decorative chrome, more than one accent color per page.

## Example usage

```tsx
const Cover: Page = () => (
  <div style={{ width: '100%', height: '100%', background: '#ffffff', color: '#212121', padding: 130, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
    <Eyebrow>PLATFORM</Eyebrow>
    <div style={{ marginTop: 28 }}>
      <Title>The Big Idea</Title>
    </div>
    <p style={{ fontSize: 28, color: '#93939f', maxWidth: 1200, marginTop: 32 }}>
      A short subtitle that explains what this slide is about.
    </p>
    <Footer />
  </div>
);
```

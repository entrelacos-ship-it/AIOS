---
name: Academia Lendária
description: Luxo dark-glass — preto profundo, tipografia cream, acento dourado único com glow, serif itálico como voz de destaque.
---

# Academia Lendária

## Palette

| Role      | Value       | Notes                                       |
| --------- | ----------- | ---------------------------------------------- |
| bg         | `#070709`  | surface — canvas dark                          |
| bg-deep    | `#000000`  | preto absoluto — bandas mais profundas          |
| card       | `#111115`  | neutral — superfície de card elevada            |
| text       | `#edebe6`  | cream — texto principal                         |
| text-muted | `#8d7556`  | gold-deep — texto secundário                    |
| gold       | `#c9b298`  | primary — identidade, CTA, glow, estatísticas   |
| gold-bright| `#e4d8ca`  | hover de texto/título em dourado                |
| border     | `rgba(255,255,255,0.07)` | hairline translúcido (7% branco)  |

## Typography

- Display font: `"Instrument Serif", "Times New Roman", serif` — weight 400, itálico disponível. Usado em TODO headline — o itálico carrega a ênfase ("O futuro pertence a quem *constrói*").
- Body/UI font: `"Inter Tight", -apple-system, sans-serif` — weight 400–600, nunca bold no serif.
- Mono: `"JetBrains Mono", "SF Mono", Consolas, monospace` — weight 500, só pra números/estatísticas.
- Type-scale overrides (compacto pro padrão do slide-authoring, mantendo a proporção do site):
  - Hero title (Serif italic): 140px, weight 400, line-height 1.0, letter-spacing -0.02em
  - Section heading (Serif): 90px, weight 400, line-height 1.1, letter-spacing -0.01em
  - Body (Sans): 32px, weight 400, line-height 1.55
  - Label (Sans): 18px, weight 500, letter-spacing 0.05em, uppercase

## Layout

- Content padding: 130px from canvas edges.
- Alignment: centrado pra hero, esquerda pra conteúdo denso.
- Grid notes: cards com radius 20px (mais arredondado que o padrão), botões sempre pill (9999px), inputs sempre quadrados (0px) — a geometria comunica a função.

## Fixed components

### Title

```tsx
const Title = ({ children }: { children: React.ReactNode }) => (
  <h1
    style={{
      fontSize: 140,
      fontWeight: 400,
      fontStyle: 'italic',
      lineHeight: 1.0,
      letterSpacing: '-0.02em',
      margin: 0,
      color: '#edebe6',
      fontFamily: '"Instrument Serif", "Times New Roman", serif',
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
        fontSize: 18,
        letterSpacing: '0.05em',
        textTransform: 'uppercase',
        fontFamily: '"Inter Tight", -apple-system, sans-serif',
        fontWeight: 500,
        color: '#8d7556',
      }}
    >
      <span>ACADEMIA LENDÁRIA</span>
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
      fontSize: 18,
      fontWeight: 500,
      letterSpacing: '0.05em',
      textTransform: 'uppercase',
      fontFamily: '"Inter Tight", -apple-system, sans-serif',
      color: '#c9b298',
    }}
  >
    {children}
  </div>
);
```

### Primary button (gold glow — signature)

```tsx
const PillButton = ({ children }: { children: React.ReactNode }) => (
  <span
    style={{
      display: 'inline-flex',
      alignItems: 'center',
      fontFamily: '"Inter Tight", -apple-system, sans-serif',
      fontSize: 22,
      fontWeight: 500,
      padding: '18px 32px',
      borderRadius: 9999,
      background: 'transparent',
      color: '#edebe6',
      boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.15), 0 10px 40px rgba(201,178,152,0.25)',
    }}
  >
    {children}
  </span>
);
```

### Gold stat

```tsx
const Stat = ({ value, label }: { value: string; label: string }) => (
  <div style={{ textAlign: 'center' }}>
    <span style={{ fontFamily: '"JetBrains Mono", monospace', fontWeight: 500, fontSize: 56, letterSpacing: '-0.02em', color: '#c9b298', display: 'block' }}>
      {value}
    </span>
    <span style={{ fontFamily: '"Inter Tight", sans-serif', fontSize: 16, letterSpacing: '0.22em', textTransform: 'uppercase', color: '#8d7556', marginTop: 8, display: 'block' }}>
      {label}
    </span>
  </div>
);
```

## Motion

- Philosophy: **subtle** — hover lifts (-2px), glow intensifica no hover, easing lento `cubic-bezier(0.22, 1, 0.36, 1)` em 300–400ms. Nunca bounce — luxo é lento.

```css
@keyframes lendariaFadeUp {
  from { opacity: 0; transform: translateY(24px); }
  to   { opacity: 1; transform: translateY(0); }
}
.lendaria-fadeUp { opacity: 0; animation: lendariaFadeUp 0.8s cubic-bezier(0.22, 1, 0.36, 1) forwards; }
```

## Aesthetic

**Luxo dark-glass aspiracional.** Canvas preto profundo (`#070709`, nunca cinza) sustenta tipografia cream com ênfase em Instrument Serif itálico — a "voz lendária". Um único acento dourado (`#c9b298`) carrega toda a identidade: não como preenchimento sólido, mas como *glow* — sombra dourada suave em CTAs e cards, nunca cor de fundo sólida. Geometria comunica função: pills pra ação, quadrados pra input, 20px pra cards. Movimento é lento e deliberado, nunca bounce. Evitar: cor saturada além do dourado, sombras neutras/pretas (profundidade é sempre dourado-tingida), bold no serif, itálico no sans.

## Example usage

```tsx
const Cover: Page = () => (
  <div style={{ width: '100%', height: '100%', background: '#070709', color: '#edebe6', padding: 130, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
    <Eyebrow>ACADEMIA LENDÁRIA</Eyebrow>
    <div style={{ marginTop: 28 }}>
      <Title>O futuro pertence a quem constrói.</Title>
    </div>
    <p style={{ fontFamily: '"Inter Tight", sans-serif', fontSize: 32, color: '#8d7556', maxWidth: 1200, marginTop: 32 }}>
      Um subtítulo curto que explica do que se trata este slide.
    </p>
    <div style={{ marginTop: 40 }}>
      <PillButton>Entrar na jornada</PillButton>
    </div>
    <Footer />
  </div>
);
```

---
name: Entrelaços Psicologia
description: Roxo denso profundo com acento laranja pontual — cream sofisticado, glass header, Instrument Serif italic para a "voz protagonista".
---

# Entrelaços Psicologia

## Palette

| Role         | Value                       | Notes                                          |
| ------------ | ---------------------------- | ------------------------------------------------ |
| bg (dark)     | `#0A0612`                   | fundo padrão dark — hero, corpo                   |
| bg-elev       | `#14092B`                   | elevações, painéis                                |
| text (dark)   | `#F0EAF8`                   | texto principal em dark                           |
| text-muted    | `rgba(240,234,248,0.68)`    | texto secundário em dark                          |
| purple-500    | `#7427D4`                   | roxo denso — identidade, gradientes                |
| purple-600    | `#5C18B8`                   | primário — CTAs                                    |
| purple-700    | `#470F94`                   | itálico em headlines light-mode                    |
| orange        | `#FF8A1F`                   | acento — usar no MÁXIMO 3x por página/dobra        |
| orange-light  | `#C75317`                   | terracota — versão queimada pro tema light         |
| bg (light)     | `#F4ECE0`                   | cream quente — hero/LP no modo light               |
| bg-app (light) | `#F8F4FB`                  | off-white violáceo — apps/dashboards               |
| text (light)   | `#11022B`                  | quase-preto com alma roxa                          |
| border (dark)  | `rgba(180,140,255,0.10)`   | hairline roxo translúcido                          |
| border (light) | `rgba(74,32,138,0.10)`     | hairline roxo translúcido claro                    |

## Typography

- Display/heading font: `"Inter Tight", -apple-system, BlinkMacSystemFont, sans-serif` — weight 500, tracking bem negativo.
- Emphasis (itálico serif — a "voz protagonista" da marca): `"Instrument Serif", "Times New Roman", serif` — itálico, weight 400. Usado dentro de headlines pra destacar a palavra-âncora, ex: "constrói" em "*O futuro pertence a quem constrói*".
- Mono (eyebrows, labels, stats): `"JetBrains Mono", ui-monospace, "SF Mono", Consolas, monospace`.
- Type-scale overrides:
  - Hero title (h-display): 150px, weight 500, line-height 0.98, letter-spacing -0.045em — palavra de destaque em Instrument Serif itálico (pode ganhar cor laranja se for a palavra-protagonista)
  - Section heading (h-section): 90px, weight 500, line-height 1.05, letter-spacing -0.035em
  - Body (lead): 34px, weight 400, line-height 1.55
  - Eyebrow/label: 18px, mono, letter-spacing 0.20em, uppercase

## Layout

- Content padding: 130px from canvas edges.
- Alignment: centrado pra hero/manifesto, esquerda pra conteúdo denso — segue o padrão `section-title-block` (centralizado, gap 16px) do site real.
- Grid notes: stats em grid de 4 colunas (`e-stats`); cards em grid 3-up. Regra de ouro: acento laranja aparece no máximo 3x por dobra — nunca vira cor de fundo.

## Fixed components

### Title

```tsx
const Title = ({ children, highlight }: { children: React.ReactNode; highlight?: string }) => (
  <h1
    style={{
      fontSize: 150,
      fontWeight: 500,
      lineHeight: 0.98,
      letterSpacing: '-0.045em',
      margin: 0,
      color: '#F0EAF8',
      fontFamily: '"Inter Tight", -apple-system, sans-serif',
    }}
  >
    {children}
    {highlight && (
      <span style={{ fontFamily: '"Instrument Serif", serif', fontStyle: 'italic', fontWeight: 400, color: '#FF8A1F', letterSpacing: '-0.01em' }}>
        {' '}{highlight}
      </span>
    )}
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
        letterSpacing: '0.20em',
        textTransform: 'uppercase',
        fontFamily: '"JetBrains Mono", ui-monospace, monospace',
        color: 'rgba(240,234,248,0.42)',
      }}
    >
      <span>ENTRELAÇOS</span>
      <span>{String(current).padStart(2, '0')} / {String(total).padStart(2, '0')}</span>
    </div>
  );
};
```

### Eyebrow (chip, como no header real)

```tsx
const Eyebrow = ({ children }: { children: React.ReactNode }) => (
  <div
    style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 8,
      padding: '8px 14px',
      borderRadius: 9999,
      border: '1px solid rgba(180,140,255,0.10)',
      background: 'rgba(180,140,255,0.04)',
      fontFamily: '"JetBrains Mono", ui-monospace, monospace',
      fontSize: 18,
      letterSpacing: '0.20em',
      textTransform: 'uppercase',
      color: 'rgba(240,234,248,0.42)',
    }}
  >
    <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#7427D4', boxShadow: '0 0 10px #7427D4' }} />
    {children}
  </div>
);
```

### Primary button (CTA glow)

```tsx
const Button = ({ children }: { children: React.ReactNode }) => (
  <span
    style={{
      display: 'inline-flex',
      alignItems: 'center',
      fontFamily: '"JetBrains Mono", ui-monospace, monospace',
      fontSize: 22,
      fontWeight: 500,
      padding: '18px 32px',
      borderRadius: 9999,
      background: '#5C18B8',
      color: '#ffffff',
      boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.15), 0 10px 40px rgba(116,39,212,0.30)',
    }}
  >
    {children}
  </span>
);
```

### Stat block

```tsx
const Stat = ({ value, label }: { value: string; label: string }) => (
  <div style={{ textAlign: 'center' }}>
    <span style={{ fontFamily: '"JetBrains Mono", ui-monospace, monospace', fontWeight: 500, fontSize: 56, letterSpacing: '-0.02em', color: '#F0EAF8', display: 'block' }}>
      {value}
    </span>
    <span style={{ fontFamily: '"JetBrains Mono", ui-monospace, monospace', fontSize: 16, letterSpacing: '0.22em', textTransform: 'uppercase', color: 'rgba(240,234,248,0.42)', marginTop: 8, display: 'block' }}>
      {label}
    </span>
  </div>
);
```

## Motion

- Philosophy: **subtle** — reveal-on-scroll com fade+translateY(24px), easing `cubic-bezier(0.22, 1, 0.36, 1)`, duração 800ms. Badge laranja tem pulse contínuo sutil.

```css
@keyframes entrelacosReveal {
  from { opacity: 0; transform: translateY(24px); }
  to   { opacity: 1; transform: translateY(0); }
}
.entrelacos-reveal { opacity: 0; animation: entrelacosReveal 0.8s cubic-bezier(0.22, 1, 0.36, 1) forwards; }

@keyframes entrelacosPulse {
  50% { opacity: 0.4; }
}
.entrelacos-pulse { animation: entrelacosPulse 1.6s ease-in-out infinite; }
```

## Aesthetic

**Roxo denso com pontuação laranja.** Um fundo quase-preto com alma roxa (`#0A0612`, nunca preto puro) sustenta tipografia sans confiante (Inter Tight) pontuada por uma "voz protagonista" em Instrument Serif itálico — a palavra que carrega o sentido da frase ganha esse tratamento, às vezes em laranja. O laranja (`#FF8A1F`) é usado com extremo rigor: no máximo 3 vezes por dobra (badge, uma palavra, um número) — nunca como preenchimento de fundo ou cor dominante. CTAs são pills roxas com glow suave; cards têm bordas roxo-translúcidas, nunca pretas sólidas. Existe uma variante light (`#F4ECE0`, cream quente) pra LPs comerciais, com o mesmo roxo como CTA e o laranja "queimado" (`#C75317`) pra manter a regra de contraste. Evitar: laranja como cor de fundo, preto puro, sombras pretas sólidas (profundidade é sempre roxo-tingida).

## Example usage

```tsx
const Cover: Page = () => (
  <div style={{ width: '100%', height: '100%', background: '#0A0612', color: '#F0EAF8', padding: 130, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
    <Eyebrow>ENTRELAÇOS PSICOLOGIA</Eyebrow>
    <div style={{ marginTop: 28 }}>
      <Title highlight="constrói">O futuro pertence a quem</Title>
    </div>
    <p style={{ fontSize: 34, color: 'rgba(240,234,248,0.68)', maxWidth: 1200, marginTop: 32 }}>
      Um subtítulo curto que explica do que se trata este slide.
    </p>
    <div style={{ marginTop: 40 }}>
      <Button>Começar agora</Button>
    </div>
    <Footer />
  </div>
);
```

# ENTRELACOS DESIGN SYSTEM

EDS v2.1 - Operational Foundation

- Version: 2.1
- Date: 2026-03-07
- Status: RC1 - approved conceptually, pending technical validation of contrast, logo assets and font rollout
- Owner: Branding and Product Squad - Entrelacos Psicologia

## 1. Purpose

The Entrelacos Design System (EDS) is the visual operating system for the brand. It exists to keep every interface, campaign asset and institutional material recognizable as premium, clear, sophisticated and strategically consistent.

This document is the implementation-oriented version of the brand foundation. It is written to be usable by designers, developers and AI agents.

## 2. Product Vision

EDS is the single source of visual truth for:

- systems and dashboards
- landing pages and institutional pages
- events and premium experiences
- social media and presentations
- member area and future digital products
- institutional and B2B materials

## 3. Brand Core

### 3.1 Brand Personality

Entrelacos is:

- human in essence
- strategic in construction
- revolutionary in impact

Manifest line:

> We are a human, strategic and revolutionary brand because caring for lives requires depth, building a career requires method, and transforming the profession requires courage.

### 3.2 Reference Equation

- Notion: clarity, mental organization, intelligent system
- Apple: perceived value, refinement, authority
- Linear: precision, contemporary digital contrast

Reference outcome:

- Entrelacos = silent sophistication + premium technology + editorial clarity + psychological depth + strategic energy

### 3.3 Anti-Requirements

EDS must never feel:

- cute
- generic psychology branding
- noisy infoproduct marketing
- soulless startup tech
- rigid corporate design
- neon or cyberpunk
- over-instagrammed

## 4. Expression Modes

EDS has one identity and two expression modes.

### 4.1 Strategic Care

Use for:

- onboarding
- community
- educational content
- guidance flows
- long-form reading
- forms

Feel:

- more breathing room
- more explanatory copy
- lighter components
- softer contrast
- controlled violet and teal
- clarity, order and intelligence

Implicit message:

> I understand you, I organize this with you, and I show you the path.

### 4.2 Positioning and Elevation

Use for:

- institutional branding
- sales pages
- manifestos
- launches
- B2B
- NR-1
- AI and ecosystem pages
- premium landing pages

Feel:

- stronger contrast
- firmer headlines
- more memorable calls
- orange as energy and action
- marked and decisive blocks
- authority, value and movement

Implicit message:

> Value yourself, structure yourself, position yourself - the profession needs another standard.

## 5. Governance Principles

1. Neutrals sustain luxury.
2. Color gives direction, not decoration.
3. Typography is the first premium signal.
4. One focus at a time.
5. Premium means discipline.
6. Mobile at 22h is a quality gate, not an afterthought.

## 6. Accent Budget Rule

### 6.1 Core Rule

Accent color must occupy at most 8 percent of perceived visual area in any interface or asset.

Recommended default budget:

- 92 percent neutrals
- 5 to 6 percent violet
- 1 to 2 percent orange
- 0 to 2 percent teal

Constraint:

- violet + orange + teal must never exceed 8 percent combined

### 6.2 Approved Use

Violet:

- active states
- focus
- structural highlights
- tags
- brand signature

Orange:

- primary CTA
- conversion points
- critical action emphasis

Teal:

- system intelligence
- status
- success
- product feedback
- charts and indicators

### 6.3 Automatic Rejection

Reject any proposal with:

- large violet backgrounds
- multiple orange CTAs at once
- mass colored cards
- decorative color bands
- teal used as emotional brand lead

## 7. Token Architecture

EDS uses three token layers:

1. Primitive tokens
   Raw values such as hex, spacing, duration and radius.
2. Semantic tokens
   System meaning such as action, feedback, surface and text.
3. Component tokens
   Component-level decisions such as button height or modal radius.

Rules:

- code must consume semantic or component tokens, not raw hex
- dark and light themes must use theme aliases, not duplicated hardcoded values
- every new component must map back to the three token layers

## 8. Primitive Color Tokens

### 8.1 Brand Colors

- `color.brand.violet.core`: `#4A1FD1`
- `color.brand.violet.deep`: `#2B0B7A`
- `color.brand.violet.electric`: `#6A4BFF`
- `color.brand.orange.signal`: `#FF5A1F`
- `color.brand.orange.burn`: `#D94711`
- `color.brand.orange.soft`: `#FF8D63`
- `color.brand.teal.core`: `#00B4C6`
- `color.brand.teal.deep`: `#007A8A`
- `color.brand.teal.soft`: `#4DD6E3`

### 8.2 Neutral Tokens - Dark

- `color.neutral.ink-black`: `#0A0A0F`
- `color.neutral.graphite-01`: `#12121A`
- `color.neutral.graphite-02`: `#1A1A24`
- `color.neutral.slate-01`: `#2A2A36`
- `color.neutral.slate-02`: `#444456`
- `color.neutral.mist-01`: `#D9DAE3`
- `color.neutral.pearl-soft`: `#F5F5F8`

### 8.3 Neutral Tokens - Light

- `color.neutral.ivory-white`: `#FAFAFC`
- `color.neutral.cloud-01`: `#F1F2F7`
- `color.neutral.cloud-02`: `#E8E9F0`
- `color.neutral.stone-01`: `#D6D8E2`
- `color.neutral.text-primary`: `#12121A`
- `color.neutral.text-secondary`: `#515366`

## 9. Semantic Color Tokens

### 9.1 Actions

- `color.action.primary`: `color.brand.orange.signal`
- `color.action.primary.hover`: `color.brand.orange.burn`
- `color.action.secondary`: `color.brand.violet.core`
- `color.action.secondary.hover`: `color.brand.violet.electric`

### 9.2 Feedback

- `color.feedback.success`: `color.brand.teal.core`
- `color.feedback.warning`: `color.brand.orange.soft`
- `color.feedback.error`: `#E53935`
- `color.feedback.info`: `color.brand.violet.electric`

### 9.3 Focus

- `color.focus.ring`: `color.brand.violet.core`
- `color.focus.offset.dark`: `color.neutral.ink-black`
- `color.focus.offset.light`: `color.neutral.ivory-white`

### 9.4 Theme Aliases - Dark

- `color.theme.dark.surface.base`: `color.neutral.ink-black`
- `color.theme.dark.surface.elevated`: `color.neutral.graphite-01`
- `color.theme.dark.surface.card`: `color.neutral.graphite-02`
- `color.theme.dark.surface.overlay`: `color.neutral.slate-01`
- `color.theme.dark.text.primary`: `color.neutral.pearl-soft`
- `color.theme.dark.text.secondary`: `color.neutral.mist-01`
- `color.theme.dark.border.subtle`: `rgba(255,255,255,0.06)`
- `color.theme.dark.border.strong`: `rgba(255,255,255,0.12)`

### 9.5 Theme Aliases - Light

- `color.theme.light.surface.base`: `color.neutral.ivory-white`
- `color.theme.light.surface.elevated`: `color.neutral.cloud-01`
- `color.theme.light.surface.card`: `color.neutral.cloud-02`
- `color.theme.light.surface.overlay`: `#FFFFFF`
- `color.theme.light.text.primary`: `color.neutral.text-primary`
- `color.theme.light.text.secondary`: `color.neutral.text-secondary`
- `color.theme.light.border.subtle`: `rgba(0,0,0,0.08)`
- `color.theme.light.border.strong`: `rgba(0,0,0,0.14)`

## 10. Typography

### 10.1 Font Families

- Display and headings: `Geist`
- Body and UI: `Inter`
- Fallbacks: `DM Sans`, `ui-sans-serif`, `system-ui`

### 10.2 Font Weights

- `400`: regular
- `500`: medium
- `600`: semibold
- `700`: bold

### 10.3 Type Scale

| Role | Size | Weight | Line Height | Letter Spacing |
|------|------|--------|-------------|----------------|
| Display | 64px | 700 | 1.05 | -0.02em |
| H1 | 48px | 700 | 1.1 | -0.01em |
| H2 | 36px | 600 | 1.15 | -0.005em |
| H3 | 28px | 600 | 1.2 | 0 |
| H4 | 20px | 600 | 1.25 | 0 |
| Body Large | 18px | 400 | 1.6 | 0 |
| Body | 16px | 400 | 1.6 | 0 |
| Body Small | 14px | 400 | 1.55 | 0 |
| Caption | 12px | 500 | 1.4 | 0.01em |
| Overline | 11px | 600 | 1.35 | 0.08em |

Rules:

- no decorative fonts
- no arbitrary weights
- Display and H1 use negative tracking
- Body copy must favor readability over visual compression

## 11. Spacing and Grid

### 11.1 Spacing Scale

| Token | Value |
|-------|-------|
| `space.01` | 4px |
| `space.02` | 8px |
| `space.03` | 12px |
| `space.04` | 16px |
| `space.05` | 24px |
| `space.06` | 32px |
| `space.07` | 48px |
| `space.08` | 64px |
| `space.09` | 96px |
| `space.10` | 128px |

### 11.2 Layout Grid

| Device | Columns | Gutter | Margin |
|--------|---------|--------|--------|
| Desktop 1440 | 12 | 24px | 80px |
| Laptop 1280 | 12 | 20px | 48px |
| Tablet 768 | 8 | 16px | 32px |
| Mobile 375 | 4 | 16px | 20px |

### 11.3 Channel Matrix

| Channel | Preferred Theme | Expression Mode |
|---------|------------------|-----------------|
| Dashboard | Dark | Positioning and Elevation |
| Member Area | Dark | Strategic Care |
| Institutional Long-form | Light | Strategic Care |
| Educational LP | Light | Strategic Care |
| Premium Sales LP | Dark or hybrid | Positioning and Elevation |
| Events and Keynotes | Dark | Positioning and Elevation |
| Social Educational | Light | Strategic Care |
| Social Positioning | Dark | Positioning and Elevation |

## 12. Radius, Borders and Elevation

### 12.1 Radius Tokens

| Token | Value | Use |
|-------|-------|-----|
| `radius.xs` | 6px | small internal tags |
| `radius.sm` | 12px | inputs and buttons |
| `radius.md` | 16px | cards and modals |
| `radius.lg` | 24px | drawers and larger panels |
| `radius.xl` | 32px | containers and hero surfaces |
| `radius.full` | 9999px | pills and avatars |

### 12.2 Border Rules

- dark subtle border: `1px solid rgba(255,255,255,0.06)`
- light subtle border: `1px solid rgba(0,0,0,0.08)`
- focus border: `2px solid #4A1FD1`

### 12.3 Elevation Rules

| Level | Method | Use |
|-------|--------|-----|
| Level 0 | no elevation | base background |
| Level 1 | surface contrast only | standard cards |
| Level 2 | micro shadow plus subtle border | dropdowns, elevated cards |
| Level 3 | subtle blur plus border | modals and premium toasts |
| Level 4 | stronger blur plus refined highlight | rare premium overlays |

Never use:

- heavy shadows
- artificial glow
- decorative gradients as main elevation device

## 13. Motion and Accessibility

### 13.1 Duration Tokens

| Token | Value |
|-------|-------|
| `duration.instant` | 80ms |
| `duration.fast` | 120ms |
| `duration.base` | 200ms |
| `duration.slow` | 350ms |
| `duration.xslow` | 500ms |

### 13.2 Easing Tokens

| Token | Value |
|-------|-------|
| `easing.default` | `cubic-bezier(0.4, 0, 0.2, 1)` |
| `easing.entrance` | `cubic-bezier(0, 0, 0.2, 1)` |
| `easing.exit` | `cubic-bezier(0.4, 0, 1, 1)` |
| `easing.spring` | `cubic-bezier(0.34, 1.56, 0.64, 1)` |

### 13.3 Motion Rules

- card and modal entry: fade plus translateY from 8px
- hover scaling only when subtle: max `scale(1.01)`
- loading must use silent skeletons, not aggressive pulsing
- toast enters from bottom-right with fade and auto-dismiss around 4s

### 13.4 Accessibility Rules

- minimum text contrast: WCAG AA
- small text should target AAA whenever possible
- minimum interactive target: 44px by 44px
- visible keyboard focus is mandatory
- honor reduced motion preferences
- error state must never depend on color alone

## 14. Logo System

### 14.1 Required Assets

- full horizontal logo for dark background
- full horizontal logo for light background
- flat isolated symbol in dark and light versions
- monochrome white version
- monochrome black version
- favicon or app icon
- compact symbol-only version

### 14.2 Logo Usage Rules

- protected area: at least the height of the `E` in the wordmark on all sides
- minimum size full logo: 120px width
- minimum size symbol: 24px

Never:

- distort proportions
- place on non-approved colored backgrounds
- add effects to the logo
- recreate the wordmark in another font

## 15. Priority Components

### 15.1 Phase 1 Core

- Button
- Input
- Select
- Textarea
- Tag or Badge
- Card
- Toast
- Modal

### 15.2 Phase 2 Interface

- Topbar
- Sidebar
- Tabs
- Table
- Metric Card
- Drawer
- Empty State
- Date Picker

### 15.3 Phase 3 Institutional

- Hero
- Section Header
- Benefit Card
- Proof Block
- Testimonial
- FAQ
- CTA Section
- Footer
- Event Card
- Slide Cover

## 16. Component Rules

### 16.1 Button

- primary background: `color.action.primary`
- primary hover: `color.action.primary.hover`
- primary text: `#FFFFFF`
- radius: `radius.sm`
- height: 40px default, 32px small, 48px large
- padding: 12px 24px
- weight: 600
- one primary CTA per main context

States:

- default
- hover
- pressed
- focus
- loading
- disabled

### 16.2 Card

- dark background: `color.theme.dark.surface.card`
- light background: `color.theme.light.surface.elevated`
- radius: `radius.md`
- padding: 24px
- use Level 1 elevation by default
- no mass colored cards

### 16.3 Input, Textarea and Select

- radius: `radius.sm`
- min height: 44px
- padding: 12px 16px
- focus ring: `color.focus.ring`
- error border: `color.feedback.error`
- never use orange for error

### 16.4 Badge

- default category color: violet
- semantic variants: success, warning, error, neutral
- size: compact
- radius: `radius.full` or `radius.sm`

### 16.5 Modal

- padding: 32px
- radius: `radius.lg`
- width: 480px to 640px on desktop
- one primary CTA plus one secondary action
- animation: fade plus translateY using `duration.slow`

## 17. Quality Gate Persona

Internal name:

- the psychologist in exodus from precarious work

Operational reading:

- the product must be cognitively light at 22h
- the premium signal must be felt before the click
- mobile dark mode is a first-class quality scenario

## 18. Codex Visual Review

Approve only if the answer to all questions is acceptable:

1. Is there one clear focus?
2. Is color working, not decorating?
3. Does this look like Entrelacos, not a generic template?
4. Can the 22h persona understand it without cognitive strain?
5. Is it neither cute, cold nor noisy?
6. Is the 8 percent rule respected?
7. Is spacing generous enough?
8. Is typography clear and hierarchical?

## 19. Release Gates

EDS can only be marked fully approved when:

- dark and light themes are consistent
- the 8 percent rule is documented and testable
- primitive and semantic color tokens are frozen
- typography scale is implemented
- spacing scale is implemented
- motion tokens are implemented
- priority components have visual rules and states
- logo assets are produced
- contrast matrix passes WCAG AA

## 20. Remaining Blockers

1. Validate teal hex values in real surfaces and charts.
2. Produce missing logo assets for light, monochrome and favicon use.
3. Test Geist and Inter in the actual React environment.
4. Run contrast audit across dark and light combinations.
5. Convert this spec into CSS variables, Figma variables and component tokens.

# Button Spec v2.1

- Component: Button
- System: Entrelacos Design System
- Version: 2.1
- Status: Ready for implementation

## 1. Purpose

The Button is the primary action trigger of the EDS. It must communicate clarity, priority and premium control without visual noise.

Operational rule:

- one primary button per main context
- secondary and ghost buttons support, never compete

## 2. Variants

### 2.1 Primary

Use for:

- conversion
- submit
- continue
- confirm

Visual contract:

- background: `--eds-color-action-primary`
- hover background: `--eds-color-action-primary-hover`
- text: `#ffffff`
- radius: `--eds-button-radius`
- weight: `600`

### 2.2 Secondary

Use for:

- support action
- alternative path
- non-destructive utility

Visual contract:

- background: transparent
- text: `--eds-color-text-primary`
- border: `1px solid --eds-color-border-subtle`
- hover background:
  - dark: `rgba(255,255,255,0.04)`
  - light: `rgba(0,0,0,0.04)`

### 2.3 Ghost

Use for:

- tertiary action
- inline support action
- low emphasis utility

Visual contract:

- background: transparent
- border: transparent
- text: `--eds-color-text-primary`
- hover: underline or subtle text emphasis only

## 3. Sizes

| Size | Height | Padding Inline | Use |
|------|--------|----------------|-----|
| Small | 32px | `--eds-button-padding-inline-sm` | dense surfaces, tables, utility actions |
| Medium | 40px | `--eds-button-padding-inline-md` | default |
| Large | 48px | `--eds-button-padding-inline-lg` | hero, onboarding, high-priority CTA |

Rules:

- minimum touch-safe size in mobile contexts: `44px`
- use `Large` when touch comfort matters more than density

## 4. Typography

- family: `--eds-font-body`
- size:
  - small: `14px`
  - medium: `16px`
  - large: `16px`
- weight: `600`
- line-height: `1`

## 5. States

### 5.1 Default

- clear contrast
- stable silhouette
- no decorative effects

### 5.2 Hover

- subtle visual reinforcement only
- no bounce, glow or dramatic scale
- transition: `background-color var(--eds-duration-fast) var(--eds-easing-default)`

### 5.3 Pressed

- slightly deeper tone
- optional transform: `translateY(1px)`

### 5.4 Focus Visible

- mandatory for keyboard navigation
- ring: `2px solid var(--eds-color-focus-ring)`
- offset: `2px`
- outer color: `var(--eds-color-focus-offset)`

### 5.5 Loading

- button stays same width when possible
- spinner aligned before or replacing label
- label may switch to progress text only if explicit
- interaction disabled while loading

### 5.6 Disabled

- lowered contrast
- no shadow
- no pointer interactions
- maintain legibility

## 6. Content Rules

- label should usually be 1 to 3 words
- avoid generic labels like `Clique aqui`
- CTA text should describe outcome, not only action

Good examples:

- `Entrar agora`
- `Continuar`
- `Salvar alteracoes`
- `Agendar diagnostico`

## 7. Layout Rules

- icon-only buttons are a separate component pattern and should not replace labeled CTAs
- primary and secondary button groups must preserve clear hierarchy
- avoid more than 3 actions in the same cluster
- avoid two primary-colored buttons competing in the same viewport block

## 8. Accessibility

- minimum contrast must meet WCAG AA
- focus-visible support is mandatory
- touch target must be at least `44x44` where relevant
- loading and disabled states cannot rely on color alone
- button must expose accessible name

## 9. CSS Reference

```css
.eds-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--eds-space-02);
  min-height: var(--eds-button-height-md);
  padding-inline: var(--eds-button-padding-inline-md);
  border-radius: var(--eds-button-radius);
  border: 1px solid transparent;
  font-family: var(--eds-font-body);
  font-size: var(--eds-font-size-body);
  font-weight: 600;
  line-height: 1;
  transition:
    background-color var(--eds-duration-fast) var(--eds-easing-default),
    border-color var(--eds-duration-fast) var(--eds-easing-default),
    color var(--eds-duration-fast) var(--eds-easing-default),
    transform var(--eds-duration-instant) var(--eds-easing-default);
}

.eds-button--primary {
  background: var(--eds-color-action-primary);
  color: #fff;
}

.eds-button--primary:hover {
  background: var(--eds-color-action-primary-hover);
}

.eds-button:focus-visible {
  outline: 2px solid var(--eds-color-focus-ring);
  outline-offset: 2px;
}
```

## 10. QA Checklist

- Is there only one main primary button in the core context?
- Does the button hierarchy remain obvious in dark and light themes?
- Is focus clearly visible?
- Does loading preserve layout stability?
- Is the label specific and outcome-oriented?
- Does the component feel premium without relying on excessive color?

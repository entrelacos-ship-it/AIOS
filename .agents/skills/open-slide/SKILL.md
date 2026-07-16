---
name: open-slide
description: 'Start creating a new Open Slide presentation for Entrelaç[OS]. Use when the user invokes /open-slide, or says things like "cria uma apresentação", "novo deck de slides", "quero um slide novo". Asks which theme and topic, then authors the slide in apps/open-slide-deck.'
---

Kick off a new Open Slide presentation.

## Step 1 — Ask theme + topic (skip if already given)

If the user's invocation already names both a theme and a topic, skip straight to Step 2.

Otherwise call `AskUserQuestion`:

- **Theme**: Framer, Cohere, Resend, Lovable, Gmail, Stripe, Anthropic, Raycast, Entrelaços Psicologia, Academia Lendária — or "sem tema, do zero".
- **Topic**: free text — what the deck is about (only needed if not already stated).

## Step 2 — Delegate to the real authoring workflow

Once theme + topic are known, work **inside `apps/open-slide-deck/`** (that's the actual open-slide workspace — not the repo root) and invoke the `create-slide` skill there with the theme name and topic as arguments. `create-slide` in turn reads `slide-authoring` and, if a theme was picked, `themes/<theme-id>.md` — follow its workflow exactly (page count, density, motion questions, etc.), just treat the theme choice from Step 1 as already answered.

Theme id mapping (kebab-case folder names under `apps/open-slide-deck/themes/`):

| Display name | id |
|---|---|
| Framer | `framer` |
| Cohere | `cohere` |
| Resend | `resend` |
| Lovable | `lovable` |
| Gmail | `gmail` |
| Stripe | `stripe` |
| Anthropic | `anthropic` |
| Raycast | `raycast` |
| Entrelaços Psicologia | `entrelacos` |
| Academia Lendária | `academia-lendaria` |

## Step 3 — Deploy reminder

After the slide file is written and passes typecheck, remind the user (don't do it yourself unless asked): the Contabo `open-slide-dev` service needs a `docker compose build` + recreate to pick up new files — same as every previous slide/theme deploy this session. Offer to run it if they confirm.

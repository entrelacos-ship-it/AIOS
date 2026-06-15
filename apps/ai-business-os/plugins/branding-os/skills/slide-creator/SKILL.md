---
name: slide-creator
description: Create branded slide decks, carousels, and social slide images for BrandingOS by writing self-contained HTML/CSS, rendering with Playwright, and exporting verified PNGs. Use when Codex needs to produce slide-based visuals for BrandingOS, especially carousel packs, presentation slides, social graphics, or any request that must become production-ready images from HTML/CSS instead of editable app UI code.
---

# Slide Creator

Create slide visuals as HTML first, image second. Keep layouts deterministic, portable, and easy to re-render.

## Use This Workflow

Use this skill when task is to create or update slide assets, not when task is to change product UI behavior inside EntrelacOS.

If request is about BrandingOS renderer or editor behavior in this repo, inspect and update:
- `renderers/brandingPngRenderer.ts`
- `views/BrandingOS.tsx`

If request is about generating slide deliverables, proceed with standalone HTML/CSS rendering workflow below.

## Core Workflow

1. Define output format and viewport.
   If user does not specify format, default to:
   - `1080 x 1440` for multi-slide carousel
   - `1080 x 1080` for single social post

2. Create one complete HTML file per slide.
   Save files in output folder such as `output/slides/slide-01.html`.

3. Keep each HTML file self-contained.
   Inline CSS. No external JS. Only use web-safe fonts or Google Fonts. Use absolute image paths or base64 data URIs when needed.

4. Render with Playwright.
   Open slide in browser, resize viewport to exact target dimensions, capture PNG screenshot.

5. Verify first render before batch.
   Check legibility, overflow, spacing, contrast, and image crops. Fix HTML, then continue remaining slides.

6. Preserve rerenderability.
   Keep HTML files next to exported PNGs so slides can be regenerated without rebuilding design from scratch.

## Hard Rules

- Match `body` width and height exactly to viewport.
- Set `margin: 0`, `padding: 0`, and `overflow: hidden` on `body`.
- Use explicit `px` font sizes for readable text.
- Never rely on animation for meaning. Output is static screenshot.
- Name batch outputs with zero-padded numbers: `slide-01.png`, `slide-02.png`.
- Keep all slides in batch at same viewport dimensions.
- Preserve source language unless user explicitly asks for translation.

## Read Reference

Read `references/rendering-guidelines.md` when you need:
- viewport presets
- local HTTP server commands
- typography minimums
- HTML template rules
- batch rendering rules
- verification checklist

## Output Contract

For each completed slide set, return:
- generated HTML file path(s)
- generated PNG file path(s)
- viewport used
- any notable constraints or manual follow-up needed

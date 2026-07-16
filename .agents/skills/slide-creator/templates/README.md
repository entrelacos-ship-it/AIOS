# Slide Creator Template System

This folder turns `slide-creator` into a self-contained deck system. Templates are not decorative examples. They are decision contracts that tell the skill when to use a narrative structure, slide function, visual pattern, research route, import pipeline, runtime mode, theme, rendered evaluation, and QA gate.

## Operating Principle

Do not invent a slide from scratch when an absorbed benchmark pattern fits the job.

Use this order:

1. Select a deck template from `deck/`.
2. Map every slide to a slide-function template from `slide/`.
3. Select visual families from `visual/`.
4. Apply theme and density rules from `theme/`.
5. Choose research/source behavior from `research/`.
6. Choose document extraction behavior from `import/`.
7. Choose runtime behavior from `runtime/`.
8. Run rendered evaluation from `eval/` when key slides or exports exist.
9. Run regression fixtures and QA gates from `qa/`.

## Provenance

Every template must preserve `absorbed_from` and `bench_patterns` so future contributors know why the template exists.

Primary sources absorbed:

- Presenton: template families, React layout schema, preview, custom import, prompt-to-edit.
- ppt-master: design spec, spec lock, chart/layout index, strict selection grammar.
- PPTAgent and PresentAgent-2: template induction, element schema, layout selector, media fit, induced template packs, rendered multimodal evaluation, manuscript-first pipeline, HTML-to-PPTX conversion, structured document extraction.
- presentation-ai: slide DSL, edit tools, themes, scenario/audience/tone, serialized template examples, outline-level template overrides.
- PresentAgent-2 DeepResearch: HTML source retrieval, direct motion-media retrieval, scholar/benchmark routing, file parsing, deep-research evaluation.
- deepH: typed handoffs, traceable runtime flows, multiverse synthesis, process regression fixtures, focused working-set principle.
- banana-slides: job presets, reference files, batch generation, prompt-to-edit workflow, reverse editable-PPTX extraction.
- powerpoint-skill: PPTX constraints, overlap checks, visual QA.
- slide-deck-ai: narrative prompt markers, tables, process markers, icon slides, verbosity.

## File Roles

- `index.yaml`: top-level registry and routing.
- `schemas/`: shape of every contract.
- `deck/`: complete presentation roteiro templates.
- `slide/`: reusable slide-function templates.
- `visual/`: charts, diagrams, layout families, media policies.
- `theme/`: visual system and token rules.
- `research/`: route source gathering by evidence type and maintain evidence ledgers.
- `import/`: structured document extraction, captions, metadata, claims, evidence, and induced layout packs.
- `runtime/`: generation/edit/import/manuscript/render/export/trace job modes.
- `eval/`: rendered slide evaluation after screenshots or export.
- `qa/`: gates and regression fixtures that block weak narrative, visual, research, render, template, or export decisions.
- `wireframes/`: simple HTML references for visual shape, not final design.

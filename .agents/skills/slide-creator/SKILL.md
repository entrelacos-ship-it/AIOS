---
name: slide-creator
description: "Self-contained narrative-first presentation deck creation skill. Use when Codex needs to create, improve, critique, or rewrite slide decks from a briefing, outline, document, webinar script, workshop, pitch, sales narrative, board update, course, or rough notes. Produces a complete deck package with narrative arc, slide-function map, design direction, slide-by-slide spec, speaker notes, QA report, and optional HTML-ready slide content without requiring the SINKRA monorepo or external squad files."
version: "1.0.0"
owner_squad: slides-creator
user-invocable: true
---

# Slide Creator

Create presentation decks as directed narrative experiences, not outline dumps. Optimize first for story, audience belief shift, editorial design, proof, and clarity. Export format is secondary.

This skill is self-contained. Do not require `squads/slides-creator`, external agents, SINKRA tasks, or private repo files. Use bundled templates and references only when needed.

## Operating Rule

Never render or draft slides directly from an outline. First produce:

`briefing -> thesis -> story arc -> slide-function map -> design direction -> deck spec -> critique -> revision -> QA`

If a user asks for quick slides, compress the workflow, but keep the narrative and design gates.

If the user provides a bad prior deck, process log, benchmark, or says a previous slide process was weak, create a regression/forward-test before generating a new full deck. The goal is to prevent the exact failure from recurring.

## Quick Workflow

1. **Normalize briefing**
   Extract audience, objective, context, constraints, source material, required CTA, tone, format, and unknowns.

2. **Define belief shift**
   State what the audience currently believes, what they must believe by the end, and what proof will move them.

3. **Build story arc**
   Use a narrative structure suited to the deck type. Default for persuasive decks:
   `reframe -> tension -> stakes -> mechanism -> proof -> plan -> CTA`.

4. **Create slide-function map**
   Each slide must have one primary function such as hook, diagnosis, contrast, proof, mechanism, demo setup, offer, objection handling, decision, or appendix. Merge slides with duplicate function unless repetition is intentional.

5. **Select canonical templates**
   Load `templates/index.yaml` first. Select a deck template, slide-function templates, visual templates, theme profile, research route, import pipeline, runtime job, rendered-eval contract, and QA gates before drafting content. Use `references/template-selection-guide.md`, `references/roteiro-template-library.md`, and `references/slide-structure-library.md` only as explanatory backup.

6. **Apply bench-derived capabilities**
   Load `templates/index.yaml`, then the relevant files under `templates/research/`, `templates/import/`, `templates/runtime/`, `templates/visual/`, `templates/eval/`, and `templates/qa/` when the user asks for PPTX, API, MCP, local models, prompt-to-edit, diagrams, research, sharing, import/export, rendered QA, or product/runtime design. Use `references/bench-absorption-map.md` for rationale.

7. **Define design direction**
   Choose visual thesis, grid, type scale, density limits, motifs, layout variety, chart style, and anti-patterns before writing slide content.

8. **Draft deck spec**
   Produce one spec per slide with action title, function, key message, layout, visible copy, visual treatment, speaker notes, evidence, and QA checklist.

9. **Run key-slide gate**
   For important decks, draft and critique the 5 decisive slides before full production: cover, reframe, mechanism, proof/demo, and CTA. If these fail, revise the deck spec before rendering the rest.

10. **Critique before delivery**
   Run narrative, design, proof, clarity, CTA, and technical checks. Revise once before showing final output.

11. **Package**
   Deliver a deck package: `briefing-normalized`, `story-arc`, `slide-function-map`, `design-direction`, `deck-spec`, `speaker-notes`, `qa-report`, and optional HTML-ready slides.

12. **Use deterministic helpers when writing files**
   When producing reusable artifacts, prefer bundled scripts over hand-built repetitive output:
   `scripts/build_template_examples.py`, `scripts/build_evidence_ledger.py`, `scripts/run_regression_fixtures.py`, `scripts/validate_rendered_eval.py`, `scripts/validate_deck_package.py`, `scripts/check_pptx_placeholders.py`, and `scripts/validate_chart_data.py`.

## Decision Tree

- If the user provides only a topic, ask up to 3 missing questions unless they requested speed. Minimum needed: audience, desired outcome, slide count/time.
- If the user provides a long document, load `templates/import/document-extraction.yaml`, then extract sections, metadata, claims, evidence, tables, and media; do not preserve document order by default.
- If the user provides a bad deck, diagnose against `references/rubrics.md`, then produce a revised slide-function map before rewriting.
- If the user asks for design improvement, load `references/design-system.md`.
- If the user asks for a full deck artifact, load `references/output-contracts.md`, plus `templates/runtime/export-contract.yaml` when a real file export is expected.
- If the deck is sales/webinar/pitch, load `references/narrative-patterns.md`.
- If selecting deck sequence, load `references/roteiro-template-library.md`.
- If selecting per-slide structure, load `references/slide-structure-library.md`.
- If choosing among many templates or avoiding repetition, load `references/template-selection-guide.md`.
- If the user asks for a full deck, benchmark deck, sales deck, webinar, VSL, offer deck, board update, financial deck, product strategy deck, or deck rewrite, load `templates/index.yaml`.
- If the deck depends on factual research, source selection, motion media, scholar evidence, or local files, load `templates/research/source-routing.yaml`.
- If factual claims, benchmarks, market statements, financial numbers, case studies, or technical comparisons appear, load `templates/research/evidence-ledger.yaml`.
- If importing or deriving behavior from existing PPTX/template families, load `templates/import/induced-layout-packs.yaml`.
- If importing a concrete PPTX template or brand deck, load `templates/import/pptx-template-manifest.yaml` and produce a template import report before promising fidelity.
- If user asks for local models, BYOK, Ollama, LM Studio, OpenAI-compatible APIs, image providers, or privacy-preserving generation, load `templates/runtime/provider-routing.yaml`.
- If the deck is research-heavy, technical, strategic, educational, or the prior process failed from outline-to-slide literalism, load `templates/runtime/manuscript-pipeline.yaml`.
- If slide templates must guide the model directly, load `templates/runtime/template-example-routing.yaml`.
- If selected slide templates must be injected into a prompt, run `scripts/build_template_examples.py` where practical.
- If editing an existing deck or producing prompt-to-edit output, load `templates/runtime/edit-history.yaml`.
- If the slide process must be audited, shared, debugged, or improved across runs, load `templates/runtime/trace-handoff.yaml`.
- If the deck needs generated images, hero scenes, visual concepts, or internal image composition, load `templates/visual/ai-image-type-routing.yaml` and separate image type from slide layout.
- If the deck includes chart datasets or a chart editor contract, load `templates/visual/chart-data-contracts.yaml`; run `scripts/validate_chart_data.py` where practical.
- If the deck needs architecture diagrams, sequence diagrams, mathematical figures, sourced paper figures, or technical visual rendering, load `templates/runtime/diagram-rendering.yaml`.
- If authoring in HTML/CSS before PPTX/PDF, load `templates/runtime/html-to-pptx.yaml`.
- If exporting PPTX/PDF/screenshots/thumbnails, load `templates/runtime/export-contract.yaml`.
- If generating or validating PPTX, load `templates/qa/pptx-technical-gates.yaml`; run `scripts/check_pptx_placeholders.py` when a PPTX file exists and placeholder safety matters.
- If key slides are rendered or the user complains the deck looks bad, load `templates/eval/rendered-eval.yaml`.
- If `rendered-eval.yaml` exists, run `scripts/validate_rendered_eval.py` or rely on `scripts/validate_deck_package.py` to enforce rendered score thresholds.
- If a prior failure mode is known, load `templates/qa/regression-fixtures.yaml`.
- If a forward test or previous failure mode exists, run `scripts/run_regression_fixtures.py` before final delivery.
- If writing a machine-readable deck package, run `scripts/build_evidence_ledger.py` after `deck-spec.yaml` exists and `scripts/validate_deck_package.py` before final delivery.
- If selecting deck sequence, load `templates/deck/route-map.yaml` and `templates/deck/copy-derived.yaml` before using legacy reference libraries.
- If selecting per-slide structures, load `templates/slide/function-library.yaml`.
- If choosing visual layouts, diagrams, charts, media, or matrix behavior, load the relevant files in `templates/visual/`.
- If choosing style, load `templates/theme/theme-tokens.yaml`.
- If the user asks "how should this work as product/runtime" or mentions PPTX/API/MCP/editor/prompt-to-edit/local models, load `templates/runtime/` and `references/bench-absorption-map.md`.
- If the user asks for QA/review, load `references/rubrics.md`.
- If the user asks to improve a weak process/deck or mentions a prior bad run, load `references/regression-test-protocol.md`.

## Required Outputs

For full deck creation, produce these sections or files:

1. `briefing-normalized`
2. `audience-belief-shift`
3. `story-arc`
4. `slide-function-map`
5. `roteiro-template-selection`
6. `slide-structure-selection`
7. `visual-template-selection`
8. `theme-profile-selection`
9. `runtime-job-selection`
10. `research-route-selection`
11. `import-pipeline-selection`
12. `rendered-eval-selection`
13. `bench-capability-selection`
14. `design-direction`
15. `deck-spec`
16. `speaker-notes`
17. `qa-report`
18. `revision-notes`
19. `forward-test` when improving a known weak process
20. `source-ledger` when the deck contains factual or comparison claims
21. `package-validation-report` when files are created

Use Markdown by default. Use JSON/YAML only when the user asks for machine-readable output or when generating assets for code.

## Non-Negotiable Gates

- **Narrative compression:** slides are moments, not topics.
- **Slide function:** every slide has a job in the audience journey.
- **Action title:** every title makes a claim; no generic topic labels.
- **Density:** default max 45 visible words per slide, except tables/appendices.
- **Layout variety:** no more than 2 consecutive slides with the same structure.
- **Template selection:** every slide must declare one structure template and why that template fits the slide function.
- **Template registry first:** use `templates/` contracts before drafting full decks. Do not rely only on free-form Markdown references.
- **Provenance:** when a template is selected, keep its absorbed source visible in the reasoning when useful.
- **Visual grammar:** charts and diagrams must match data shape, not aesthetic preference.
- **Bench absorption:** when solving a known capability, reuse the mapped benchmark pattern rather than inventing a new one.
- **Research routing:** HTML sources, motion media, scholar evidence, and local files use different routes.
- **Evidence ledger:** high-stakes factual or comparison claims must be mapped to sources, confidence, freshness, and slide use.
- **Induced pack selection:** imported templates are selected by deck job, media behavior, and audience, not by aesthetics alone.
- **Provider routing:** local/privacy/provider requirements must be explicit before selecting model, image, vision, or research capability.
- **Manuscript-first:** research-heavy or failed-process decks must create a manuscript before slide copy.
- **Edit history:** prompt edits must produce scoped diffs and rerun local QA for changed slides.
- **Traceable handoffs:** reusable processes must keep compact stage traces and revision decisions.
- **Regression fixtures:** known failure modes become forward tests before the process is called improved.
- **Rendered evaluation:** important final decks must evaluate rendered key slides, not only source text.
- **Verified export:** never claim PPTX/PDF export success before output-path verification.
- **PPTX technical safety:** no residual placeholders, unsafe math, overlap, clipping, theme-mismatched diagrams, or unverified text fit.
- **Image type routing:** AI image prompts must declare internal composition, container size, text policy, and whether the visual is decorative, explanatory, evidentiary, or product-representational.
- **Chart data validation:** chart data shape must match the selected chart mode before visual styling.
- **Diagram engine routing:** technical diagrams must declare Graphviz, Mermaid, TikZ, native shapes, or extracted-figure policy before rendering.
- **Template import honesty:** imported PPTX templates produce metadata/manifests first; fidelity claims require render comparison.
- **Executable helpers:** when a bundled script exists for a repeated artifact, use it instead of recreating the artifact by hand.
- **Proof:** factual claims need source, artifact, example, demo, or explicit assumption label.
- **Design direction:** visual system must exist before draft.
- **Key-slide gate:** important decks must validate cover, reframe, mechanism, proof/demo, and CTA before full render.
- **Regression gate:** if a prior process failed, map old failure modes to new blockers before rerendering.
- **Critique loop:** final answer must include what was improved after critique.

## Quality Bar

Score the deck with this weighting:

| Dimension | Weight |
|---|---:|
| Narrative | 30 |
| Editorial design | 25 |
| Proof and credibility | 15 |
| Didactic clarity | 10 |
| CTA/conversion | 10 |
| Technical deliverability | 10 |

If the weighted score is below 85, revise. If below 75, do not present it as final; present it as a diagnostic draft.

## Bundled References

- `scripts/build_template_examples.py`: converts selected slide-function templates into compact Markdown/XML prompt examples.
- `scripts/build_evidence_ledger.py`: extracts slide evidence from `deck-spec.yaml` into `source-ledger.yaml`.
- `scripts/validate_deck_package.py`: validates required package files, basic slide shape, repeated structures, and sourced evidence.
- `scripts/run_regression_fixtures.py`: runs forward-test fixtures for narrative, design, research, render, and template-selection failure modes.
- `scripts/validate_rendered_eval.py`: validates rendered slide scores, blockers, descriptions, revision actions, and referenced image paths.
- `scripts/check_pptx_placeholders.py`: checks PPTX slide XML for residual placeholders such as `{{MATH:`.
- `scripts/validate_chart_data.py`: validates chart datasets against label-value, xy, multi-series, range, waterfall, OHLC, box-plot, hierarchical, flow, funnel, heatmap, histogram, and gauge modes.
- `templates/index.yaml`: canonical template registry and routing order.
- `templates/deck/route-map.yaml`: deck roteiro templates for benchmarks, webinars, finance, sales, board, product strategy, and discovery.
- `templates/deck/copy-derived.yaml`: offer, VSL, cohort launch, and investor pitch templates absorbed from SINKRA copy and pitch squads.
- `templates/slide/function-library.yaml`: slide-function templates with slots, constraints, and QA.
- `templates/visual/`: chart, chart-data, AI-image, diagram, layout family, and media-fit rules absorbed from benchmark projects.
- `templates/visual/chart-data-contracts.yaml`: chart dataset modes, required fields, editor-mode mapping, and validation blockers.
- `templates/visual/ai-image-type-routing.yaml`: AI image composition types, purpose routing, text policy, and container-size rules.
- `templates/visual/aiox-brandbook-deep-patterns.yaml`: AIOX editorial spreads, proof walls, pitch components, category creation, roadmap, offer and problem sections.
- `templates/visual/redpine-deep-patterns.yaml`: Redpine report grid, palette stack, component/a11y manifest cards, status rows, decision panels, tabs, and briefing fields.
- `templates/theme/theme-tokens.yaml`: theme profiles separated from slide structure.
- `templates/theme/brand-systems.yaml`: Redpine and AIOX Brandbook theme profiles extracted from local design-system sources.
- `templates/runtime/`: generation, edit, batch, import, and prompt-to-edit job contracts.
- `templates/runtime/manuscript-pipeline.yaml`: planner, research manuscript, claim/evidence, and renderer handoff pipeline.
- `templates/runtime/html-to-pptx.yaml`: browser-rendered HTML to PPTX/PDF conversion, placeholder extraction, overflow, and rasterization rules.
- `templates/runtime/export-contract.yaml`: reproducible export task, worker response, output verification, and preview contract.
- `templates/runtime/template-example-routing.yaml`: selected template examples and per-outline template override routing.
- `templates/runtime/trace-handoff.yaml`: traceable stage flow, typed handoffs, review universes, and synthesis report.
- `templates/runtime/provider-routing.yaml`: provider, local model, image, vision, research, and fallback capability routing.
- `templates/runtime/edit-history.yaml`: undo/redo-inspired edit snapshots, diff summaries, and local QA reruns.
- `templates/runtime/diagram-rendering.yaml`: Graphviz, Mermaid, TikZ, native-shape, and PDF-figure extraction routing.
- `templates/research/source-routing.yaml`: separate routes for HTML sources, motion media, scholar/benchmark evidence, and local files.
- `templates/research/evidence-ledger.yaml`: slide-level claim/source/confidence/freshness ledger.
- `templates/import/document-extraction.yaml`: structured document extraction, captions, metadata, claim/evidence inventory.
- `templates/import/induced-layout-packs.yaml`: PPTAgent-derived pack selection for academic, technical, institutional, and UI decks.
- `templates/import/pptx-template-manifest.yaml`: PPTX template manifest extraction, placeholder geometry, theme metadata, assets, and import report.
- `templates/eval/rendered-eval.yaml`: multimodal rendered slide scoring for vision, content, logic, and technical integrity.
- `templates/qa/regression-fixtures.yaml`: forward tests for narrative, design, research, render, and template-selection failures.
- `templates/qa/pptx-technical-gates.yaml`: PPTX overlap, clipping, text-fit, math, diagram, density, and scoring gates.
- `templates/qa/`: narrative, visual, template-selection, and copy gates.
- `templates/wireframes/`: simple HTML visual references for matrix, mechanism, proof, and webinar flow.
- `references/narrative-patterns.md`: deck types, story arcs, slide functions.
- `references/template-selection-guide.md`: template routing by deck job and slide function.
- `references/roteiro-template-library.md`: 45 complete deck roteiro templates by use case.
- `references/slide-structure-library.md`: 240+ slide structure templates with use/avoid rules.
- `references/bench-absorption-map.md`: what to absorb from Presenton, Gamma, ppt-master, PPTAgent, presentation-ai, banana-slides, powerpoint-skill, slide-deck-ai, and PresentAgent-2.
- `references/design-system.md`: visual direction, layout patterns, density rules.
- `references/rubrics.md`: QA scoring and critique protocol.
- `references/output-contracts.md`: reusable artifact schemas and final package format.
- `references/anti-patterns.md`: known failure modes, especially outline-to-deck literalism.
- `references/regression-test-protocol.md`: forward-test format for preventing known deck/process failures from recurring.

Load only the reference needed for the current task.

## Default Final Response

When returning work to the user, keep it concise:

- State the recommended deck thesis.
- Show slide list with function + action title.
- Mention design direction.
- Mention QA score and the main remaining risk.
- Provide the generated artifact or file path when files were created.

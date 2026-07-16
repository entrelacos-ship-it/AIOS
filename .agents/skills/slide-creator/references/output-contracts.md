# Output Contracts

Use these contracts when the user asks for a complete deck package, machine-readable outputs, or reusable artifacts.

## Full Package Structure

```text
slide-creator-output/
  briefing-normalized.yaml
  audience-belief-shift.yaml
  story-arc.yaml
  slide-function-map.yaml
  roteiro-template-selection.yaml
  slide-structure-selection.yaml
  visual-template-selection.yaml
  theme-profile-selection.yaml
  runtime-job-selection.yaml
  research-route-selection.yaml
  import-pipeline-selection.yaml
  template-import-report.yaml
  rendered-eval-selection.yaml
  bench-capability-selection.yaml
  design-direction.yaml
  deck-spec.yaml
  chart-datasets/
  diagrams/
  diagram-manifest.yaml
  image-resource-list.yaml
  source-ledger.yaml
  planning-reflection.jsonl
  key-slide-gate.yaml
  speaker-notes.md
  qa-report.yaml
  rendered-eval.yaml
  package-validation-report.json
  editability-report.yaml
  revision-notes.md
  forward-test.yaml
```

If writing files, place them in a user-specified directory. If no directory is specified in this repository, use `outputs/slide-creator/{deck-slug}/`.

When writing machine-readable files, prefer YAML for core deck artifacts and JSON for validation reports. Before final delivery, run:

```bash
python scripts/build_evidence_ledger.py slide-creator-output/deck-spec.yaml --output slide-creator-output/source-ledger.yaml
python scripts/run_regression_fixtures.py slide-creator-output --json > slide-creator-output/regression-fixture-report.json
python scripts/validate_rendered_eval.py slide-creator-output/rendered-eval.yaml --package-root slide-creator-output --json > slide-creator-output/rendered-eval.validation.json
python scripts/validate_deck_package.py slide-creator-output --json > slide-creator-output/package-validation-report.json
```

`validate_deck_package.py` uses `--profile full` by default. Use `--profile minimal` only for smoke tests or partial drafts that are not being delivered as a complete skill package.

Use paths relative to the skill folder when running bundled scripts directly, or pass absolute paths when running from another working directory.

## Briefing Normalized

```yaml
briefing_normalized:
  title: ""
  deck_type: "sales | webinar | board | pitch | course | workshop | report | other"
  audience: ""
  objective: ""
  desired_action: ""
  duration_minutes: null
  slide_count_target: null
  tone: ""
  source_material:
    - ""
  constraints:
    - ""
  unknowns:
    - ""
```

## Story Arc

```yaml
story_arc:
  governing_thought: ""
  audience_belief_shift:
    from: ""
    to: ""
  arc:
    - stage: "hook"
      purpose: ""
      key_claim: ""
      proof: ""
    - stage: "reframe"
      purpose: ""
      key_claim: ""
      proof: ""
    - stage: "mechanism"
      purpose: ""
      key_claim: ""
      proof: ""
    - stage: "cta"
      purpose: ""
      key_claim: ""
      proof: ""
```

## Slide Function Map

```yaml
slide_function_map:
  slide_count: 0
  slides:
    - slide: 1
      function: "hook"
      audience_question: ""
      action_title: ""
      key_message: ""
      proof_or_asset: ""
      notes: ""
```

## Roteiro Template Selection

```yaml
roteiro_template_selection:
  primary_template: ""
  secondary_template: ""
  reason: ""
  modules_added:
    - ""
  modules_removed:
    - ""
  target_slide_count: 0
```

## Slide Structure Selection

Every slide must declare one structure from `references/slide-structure-library.md`.

```yaml
slide_structure_selection:
  slides:
    - slide: 1
      function: ""
      structure_id: "H01"
      structure_name: "Big claim hero"
      why_this_structure: ""
      avoid_risk: ""
```

## Deck Spec

Use this for each slide:

```yaml
slides:
  - number: 1
    function: ""
    structure_id: ""
    structure_name: ""
    action_title: ""
    visible_copy:
      headline: ""
      subhead: ""
      blocks:
        - label: ""
          text: ""
    visual:
      layout_pattern: ""
      primary_asset: ""
      chart_or_diagram: ""
      design_notes: ""
    speaker_notes: ""
    evidence:
      - claim: ""
        source: ""
        status: "sourced | assumption | validate"
        freshness: "unknown"
    qa:
      visible_word_count: 0
      passes_density: true
      has_action_title: true
      has_clear_function: true
```

## Source Ledger

Generate after `deck-spec.yaml` exists.

```yaml
evidence_ledger:
  source: "deck-spec.yaml"
  claim_count: 0
  claims:
    - claim_id: "s01-c1"
      slide_id: "s01"
      claim: ""
      evidence_type: "official_source | benchmark_result | academic_paper | product_documentation | user_provided_document | screenshot_or_media | internal_artifact | explicit_assumption"
      source: ""
      confidence: "high | medium | low"
      visible_or_speaker_notes: "visible | speaker_notes"
      risk: "none | needs_source"
      freshness: "unknown"
  blockers: []
```

## Package Validation Report

Generate before final delivery when files were created.

```json
{
  "package": "slide-creator-output",
  "slide_count": 0,
  "status": "pass",
  "errors": [],
  "warnings": []
}
```

## Key-Slide Gate

Use before full visual production for important decks.

```yaml
key_slide_gate:
  required: true
  slides:
    - role: "cover"
      slide: 1
      pass_condition: "promise is understood in under 5 seconds"
      status: "pass | revise | fail"
    - role: "reframe"
      slide: 2
      pass_condition: "old belief and new belief are visually obvious"
      status: "pass | revise | fail"
    - role: "mechanism"
      slide: 0
      pass_condition: "method is memorable without long explanation"
      status: "pass | revise | fail"
    - role: "proof_or_demo"
      slide: 0
      pass_condition: "audience can see proof or expected artifact"
      status: "pass | revise | fail"
    - role: "cta"
      slide: 0
      pass_condition: "next action is concrete and low-friction"
      status: "pass | revise | fail"
  blockers:
    - ""
```

## Bench Capability Selection

Use when the user asks for runtime, export, editor, API, MCP, prompt-to-edit, research, or local operation.

```yaml
bench_capability_selection:
  capabilities:
    - capability: "native_editable_pptx"
      source_pattern: "ppt-master"
      reason: ""
      artifacts_required:
        - "native-slide-ir.yaml"
        - "editability-report.yaml"
    - capability: "api_mcp_runtime"
      source_pattern: "Presenton"
      reason: ""
      artifacts_required:
        - "workspace"
        - "provider-registry"
```

## Template Import Report

Use when a concrete PPTX/template deck is imported.

```yaml
template_import_report:
  source_file: ""
  status: "pass | partial | fail"
  manifest_file: "manifest.json"
  summary_file: "summary.md"
  asset_dir: "assets"
  slide_size: ""
  theme_fonts_detected: []
  theme_colors_detected: []
  reusable_layouts: 0
  reusable_assets: 0
  partial_layouts: []
  unsupported_features: []
  fidelity_checks:
    rendered_reference_compared: false
    notes: []
```

## Chart Dataset

Use for every chart before visual styling or export.

```yaml
chart_dataset:
  id: "chart-s01-01"
  slide_id: "s01"
  mode: "label-value | xy | xyz | multi-series | range | waterfall | ohlc | box-plot | hierarchical | flow | funnel | heatmap | histogram | gauge"
  title: ""
  source: ""
  unit: ""
  rows:
    - label: ""
      value: 0
  validation_report: "chart-s01-01.validation.json"
```

Validate with:

```bash
python scripts/validate_chart_data.py slide-creator-output/chart-datasets/chart-s01-01.yaml --json > slide-creator-output/chart-datasets/chart-s01-01.validation.json
```

## Diagram Manifest

Use for architecture, sequence, mathematical, or sourced figure diagrams.

```yaml
diagram_manifest:
  output_dir: "diagrams"
  diagrams:
    - diagram_id: "d01"
      slide_id: "s01"
      engine: "graphviz | mermaid | tikz | native_shapes | pdf_figure_extraction"
      source_file: ""
      output_file: ""
      editable_level: "native | source_editable | raster_only"
      attributed: false
      qa:
        rendered: false
        fits_container: false
        legible_at_thumbnail: false
        issues: []
  blockers: []
```

## Image Resource List

Use when AI/stock/generated visuals are part of the deck.

```yaml
image_resource_list:
  images:
    - image_id: "img-s01-01"
      slide_id: "s01"
      image_type: "hero | background | portrait | typography | infographic | flowchart | framework | matrix | cycle | funnel | pyramid | comparison | timeline | map | scene"
      role: "decorative | explanatory | evidentiary | product_representational"
      container: "hero_large | evidence_panel | icon_or_support | full_canvas"
      text_policy: "none | embedded"
      prompt: ""
      output_file: ""
      qa:
        no_critical_embedded_text: true
        fits_container: false
        source_or_generation_model: ""
```

## Forward Test

Use when improving a known weak deck/process.

```yaml
forward_test:
  case_id: ""
  source_inputs:
    - ""
  old_failure_modes:
    - failure: ""
      evidence: ""
      blocked_by_gate: ""
  expected_outputs:
    - "briefing-normalized"
    - "story-arc"
    - "slide-function-map"
    - "slide-structure-selection"
    - "design-direction"
    - "deck-spec"
    - "key-slide-gate"
    - "qa-report"
  pass_thresholds:
    weighted_score_minimum: 90
  current_gap: ""
```

## Planning Reflection

```jsonl
{"phase":"narrative","slide":"s03","issue":"action title is generic","decision":"rewrite as claim","expected_delta":"narrative"}
{"phase":"design","slide":"s05","issue":"layout repeats previous two slides","decision":"switch to mechanism diagram","expected_delta":"editorial_design"}
```

## Editability Report

Use when PPTX is required.

```yaml
editability_report:
  overall_editability_score: 0.0
  native_object_count: 0
  raster_object_count: 0
  editable_text_count: 0
  killer_items:
    - ""
```

## Final Answer Format

For a full deck in chat, use:

```markdown
## Deck Thesis

...

## Design Direction

...

## Slide Plan

| # | Function | Action Title | Visual |
|---:|---|---|---|

## Deck Spec

### Slide 1
...

## QA

...
```

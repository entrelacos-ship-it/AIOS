# Brand[OS] Test Scenarios and Validation Matrix

## Scope

This document consolidates a joint QA + UX review of the `Brand[OS]` module, centered on:

- [BrandingOS.tsx](C:/Users/tatik/.codex/Projetos/EntrelacOS/views/BrandingOS.tsx:466)
- [server.ts](C:/Users/tatik/.codex/Projetos/EntrelacOS/server.ts:248)
- [brandManifestoRegistry.ts](C:/Users/tatik/.codex/Projetos/EntrelacOS/services/brandManifestoRegistry.ts:29)
- [brandEditorialRegistry.ts](C:/Users/tatik/.codex/Projetos/EntrelacOS/services/brandEditorialRegistry.ts:42)
- [brandVisualIdentityRegistry.ts](C:/Users/tatik/.codex/Projetos/EntrelacOS/services/brandVisualIdentityRegistry.ts:54)
- [brandCarouselDraftRegistry.ts](C:/Users/tatik/.codex/Projetos/EntrelacOS/services/brandCarouselDraftRegistry.ts:86)

The goal is to cover functionality, regression risk, and UX validation across the full Brand[OS] flow:

1. Brand foundation
2. Editorial lines
3. Calendar
4. Content Studio
5. Packaging / carousel editor
6. Delivery / export

## Validation Status

### Executed locally

The following API validations were executed against the local app at `http://localhost:3010`:

- Manifesto create/list/update/delete
- Visual identity put/get
- Editorial lines put/get
- Carousel draft create/get/update/delete
- Delete cascade from manifesto to editorial lines and visual identity
- Negative cases returning `400` and `404`

### Executed result

All API checks passed for:

- `manifesto_create`
- `manifesto_list`
- `manifesto_update`
- `visual_identity_put`
- `visual_identity_get`
- `editorial_lines_put`
- `editorial_lines_get`
- `carousel_draft_create`
- `carousel_draft_get`
- `carousel_draft_update`
- `carousel_draft_delete`
- `manifesto_delete_cascade_editorial`
- `manifesto_delete_cascade_identity`
- `manifesto_invalid_400`
- `visual_identity_missing_manifesto_400`
- `carousel_draft_invalid_400`

### Not fully executed end-to-end

The following areas still require browser-driven validation or real external integration:

- PDF and DOCX upload UX end-to-end
- Calendar drag-and-drop interaction
- Full Content Studio generation with live AI providers
- Instagram OAuth and publishing lifecycle
- Packaging UX interactions and final export UX
- Accessibility and keyboard navigation

## Functional Map

### 1. Brand Foundation

- Create manifesto manually
- Generate manifesto with AI
- Import manifesto from PDF or DOCX
- Save and update manifesto
- Load saved manifestos
- Delete manifesto with cascade cleanup
- Define and persist brand visual identity
- Seed visual identity from Instagram metadata

### 2. Editorial Lines

- Switch between `manifesto` and `blank` source modes
- Generate editorial lines with AI
- Edit, remove, and select lines manually
- Persist editorial lines by scope
- Reload editorial workspace by manifesto scope

### 3. Calendar

- Generate calendar from selected editorial lines
- Create cards manually
- Create cards with AI suggestions
- Edit card metadata, schedule, image URL, and approval
- Approve cards for production
- Move cards across dates
- Persist calendar in browser storage
- Sync publication status with Instagram

### 4. Content Studio

- Build context from planned posts, title, or knowledge ingestion
- Select format and creative objective
- Generate structured content
- Run critique on generated content

### 5. Packaging / Carousel Editor

- Edit content and style per slide
- Add, duplicate, remove, and reorder slides
- Apply brand identity and style presets
- Upload or generate slide imagery
- Save, load, update, and delete carousel drafts

### 6. Delivery

- Export current slide as PNG
- Export full PNG pack
- Final delivery area exists, but PDF/Drive/Notion actions are not fully implemented

## Joint QA + UX Findings

### Critical risks

- Draft hydration risk: `hydrateCarouselDraft` updates `selectedManifestoId` but does not reload `manifestoName` and `manifestoContent`, which can leave stale brand context in the editor.
- Delivery trust gap: the final step presents success-like language even where actions are placeholders, especially for PDF and publication-related actions.
- Navigation mismatch: sidebar/global view and internal stepper do not form a single navigation contract, which creates orientation problems.

### High risks

- Store corruption fallback: JSON parse/read failures silently reset stores to empty arrays.
- Calendar persistence exists only in `localStorage`, so planning is browser-local and non-portable.
- `blank` scope is global and can mix work between unsaved brands.
- Instagram publication requires a public image URL, while internal creation flows often produce local/data URLs.

### UX friction

- Base screen is too dense for first-time users.
- Calendar combines too many controls in one workspace.
- Format selection advances too quickly and reduces comparison.
- Terminology mixes Portuguese and English inconsistently.
- Some feedback still relies on `alert()` instead of consistent inline/toast messaging.
- Accessibility coverage is weak for keyboard, ARIA, and focus semantics.

## Test Scenarios

### P0: Core Functional Scenarios

#### BOS-P0-01: Create manual manifesto

- Given the user is on `Base da Marca`
- When the user fills manifesto content manually and saves
- Then the manifesto must be persisted and visible in the saved manifesto list
- And the active manifesto state must reflect the saved record

#### BOS-P0-02: Generate manifesto with AI

- Given the brand briefing fields are filled and text AI is configured
- When the user clicks manifesto generation
- Then generated text must populate the manifesto editor
- And the source type must be set to AI
- And the user must be instructed to review and save the manifesto

#### BOS-P0-03: Import manifesto from PDF

- Given the user selects a valid PDF file
- When the file is uploaded
- Then text content must be extracted and loaded into the manifesto editor
- And the imported manifesto must be savable and reusable

#### BOS-P0-04: Import manifesto from DOCX

- Given the user selects a valid DOCX file
- When the file is uploaded
- Then text content must be extracted and loaded into the manifesto editor
- And the imported manifesto must be savable and reusable

#### BOS-P0-05: Save visual identity for manifesto scope

- Given a saved manifesto is active
- When the user edits brand identity fields and saves
- Then the identity must persist under that manifesto scope
- And reloading the same manifesto must restore the saved identity

#### BOS-P0-06: Generate editorial lines for manifesto scope

- Given a manifesto is active and text AI is configured
- When the user generates editorial lines
- Then a non-empty editable list of lines must be created
- And selected lines must remain distinguishable from unselected ones

#### BOS-P0-07: Generate editorial lines for blank scope

- Given the user is in `blank` mode with briefing content filled
- When the user generates editorial lines
- Then editorial lines must be generated without a manifesto
- And the blank workspace must persist independently from manifesto scope

#### BOS-P0-08: Save and reload editorial workspace

- Given the user edited editorial lines manually
- When the user saves the editorial workspace and reloads the screen
- Then the same lines and selected states must be restored for the same scope

#### BOS-P0-09: Generate calendar from editorial lines

- Given at least one editorial line is selected and the date range is valid
- When the user generates the calendar
- Then calendar cards must be created with `Draft`, `Needs Review`, and default scheduling metadata
- And the flow must advance to the calendar step

#### BOS-P0-10: Manual calendar card creation

- Given the user is on the calendar step
- When the user creates a card manually
- Then the card must be added to the calendar
- And default publication metadata must be assigned consistently

#### BOS-P0-11: AI-assisted calendar card creation

- Given the user opens AI card creation and text AI is configured
- When the suggestion is generated
- Then theme, format, and description must be filled without losing editable control

#### BOS-P0-12: Approve calendar cards for production

- Given one or more cards exist in the calendar
- When the user approves them
- Then approval status must become `Approved`
- And the cards must be added to the production queue

#### BOS-P0-13: Move calendar card to another date

- Given a calendar card exists
- When the user drags or moves the card to another date
- Then the day label and scheduled date must update together

#### BOS-P0-14: Generate content from planned posts

- Given approved posts exist and the user chooses planned content mode
- When the user runs the content engine
- Then structured slide content must be generated using manifesto, editorial lines, and brand identity context

#### BOS-P0-15: Generate content from title or knowledge mode

- Given the user provides a title or ingested knowledge context
- When the content engine runs
- Then the context used by AI must match the chosen source mode
- And the generated slides must reflect that input source

#### BOS-P0-16: Run critique on generated slides

- Given structured content already exists
- When the user runs critique
- Then critique output must be generated without erasing the current slides

#### BOS-P0-17: Save carousel draft

- Given generated slides exist
- When the user saves a draft
- Then the draft must persist with the current slides, brand profile, selected asset, and editor state

#### BOS-P0-18: Load saved carousel draft

- Given a saved draft exists
- When the user loads it
- Then the editor must restore slide content, selected slide, visual preset, and brand profile
- And the active manifesto context must also stay consistent with the draft

#### BOS-P0-19: Delete carousel draft

- Given a saved draft exists
- When the user deletes it
- Then it must be removed from the draft list
- And reopening it must return `404` from the API

#### BOS-P0-20: Export PNG

- Given at least one slide exists in the packaging step
- When the user exports the current slide or the full pack
- Then PNG output must be generated without corrupting the editor state

### P1: Error, Regression, and UX Guardrail Scenarios

#### BOS-P1-01: Reject empty manifesto

- Given the manifesto content is empty
- When the user tries to save
- Then save must be blocked with a clear inline error

#### BOS-P1-02: Reject invalid upload type

- Given the user uploads a file that is not PDF or DOCX
- When upload is attempted
- Then the module must reject it and communicate supported formats clearly

#### BOS-P1-03: Missing manifesto scope ID

- Given the client requests manifesto-scoped visual identity or editorial lines without `manifestoId`
- When the API is called
- Then the response must be `400`

#### BOS-P1-04: Reject invalid calendar date range

- Given the end date is earlier than the start date
- When the user generates the calendar
- Then generation must be blocked with a clear corrective message

#### BOS-P1-05: Instagram scheduling without image URL

- Given the user is connected to Instagram
- When a post lacks a public image URL and the user tries to schedule it
- Then scheduling must be blocked with a clear requirement message

#### BOS-P1-06: Instagram scheduling without datetime

- Given the user is connected to Instagram
- When a post lacks `scheduledAt` and scheduling is attempted
- Then the module must block publication and explain the missing field

#### BOS-P1-07: Switching editorial source with unsaved changes

- Given the user has unsaved editorial changes
- When the source mode is changed between `manifesto` and `blank`
- Then the module should confirm discard or preserve the draft explicitly

#### BOS-P1-08: Draft load with manifesto mismatch

- Given a saved draft references a different manifesto than the current active one
- When the draft is loaded
- Then the manifesto name, content, and downstream context must be refreshed together
- And stale manifesto state must not remain active

#### BOS-P1-09: Corrupted store file

- Given one of the `.aiox` JSON stores is corrupted
- When the module loads
- Then the failure must be surfaced as recoverable error information
- And the system must not silently behave as if no data existed

#### BOS-P1-10: Placeholder delivery actions

- Given the user reaches the delivery step
- When they trigger PDF or external-delivery actions
- Then labels and user feedback must match real implementation status
- And placeholder actions must not look like successful delivery

### P2: Volume, Resilience, and Accessibility

#### BOS-P2-01: Large calendar workload

- Given a long date range and many editorial lines
- When the calendar is generated
- Then the UI must remain usable and state changes must stay coherent

#### BOS-P2-02: Heavy carousel pack

- Given a carousel with many slides and large images
- When the user edits and exports the pack
- Then the editor must remain stable and exports must complete or fail clearly

#### BOS-P2-03: Browser storage stress

- Given many calendar items exist in local storage
- When the page reloads
- Then hydration must restore valid data without breaking the workspace

#### BOS-P2-04: Keyboard and focus navigation

- Given a keyboard-only user
- When they navigate Brand[OS]
- Then all actionable controls must be reachable, focus-visible, and operable without mouse dependency

## UX Acceptance Criteria

### Navigation

- Sidebar, header, stepper, and content must always indicate the same active stage.
- Advancing without saving must be explicit, not implicit.
- Unsaved changes must be surfaced before leaving a step.

### Brand Foundation

- The minimal happy path must be obvious for first-time users.
- The UI must distinguish `draft`, `saved`, and `active base`.
- Errors must be inline and actionable.

### Editorial Lines

- Source mode switching must not silently discard work.
- Selected vs unselected lines must remain obvious at all times.
- Empty states must point to the next valid action.

### Calendar

- Publication statuses must be understandable without internal jargon.
- Batch actions must show which cards were affected.
- Instagram prerequisites must be visible before failure.

### Content Studio

- Source selection and format selection must be comparable and reversible.
- The user must be able to inspect what context is being sent to AI.
- Disabled actions must explain why they are disabled.

### Packaging

- It must always be clear which draft and which slide are active.
- Destructive actions should confirm or support undo.
- Media and style changes must preserve user trust and editor stability.

### Delivery

- Success messages must only appear after a real successful action.
- Placeholder actions must be visually and textually marked as unavailable.

### Accessibility

- All interactive elements must be keyboard accessible.
- Controls need semantic roles and labels.
- Color alone must not encode state.

## Recommended Automation

- Unit tests for all `brand*Registry` services.
- Integration tests for `/api/branding/*` endpoints with temporary `.aiox` storage.
- Component tests for `BrandingOS.tsx` with mocked `fetch`, `localStorage`, `FileReader`, `pdfjs`, `mammoth`, and AI services.
- Playwright E2E for:
  - manifesto -> editorial lines -> calendar
  - calendar -> production -> content studio
  - draft save/load/delete
  - PNG export

## Recommended Next Actions

1. Fix the manifesto hydration issue when loading carousel drafts.
2. Replace silent JSON-store fallbacks with recoverable error reporting.
3. Define a single navigation contract between global view and internal stepper.
4. Persist calendar data on the backend if cross-device continuity is required.
5. Hide or relabel placeholder delivery actions until implemented.

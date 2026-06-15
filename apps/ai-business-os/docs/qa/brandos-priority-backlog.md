# Brand[OS] Priority Backlog

## Objective

This backlog translates the Brand[OS] QA + UX review into implementation-ready priorities.

## Critical

### BOS-001: Fix stale manifesto state when loading carousel drafts

- Priority: `Critical`
- Area: `Packaging / Draft hydration`
- Problem: loading a draft can update `selectedManifestoId` without refreshing the actual manifesto content and metadata used downstream.
- Expected outcome: whenever a draft is loaded, the active manifesto context must be rehydrated consistently or explicitly reset if unavailable.
- Validation:
- Load a draft linked to a different manifesto.
- Confirm manifesto name, content, and editorial context reflect the draft.

### BOS-002: Unify Brand[OS] navigation state

- Priority: `Critical`
- Area: `Navigation`
- Problem: global view and internal stepper diverge, so sidebar/header can show one stage while the screen is on another.
- Expected outcome: `currentView`, stepper, and rendered content stay synchronized in both directions.
- Validation:
- Advance internally through the flow.
- Confirm sidebar and header reflect the same step.
- Navigate from sidebar and confirm the internal step updates correctly.

### BOS-003: Remove misleading delivery messaging and placeholder trust gaps

- Priority: `Critical`
- Area: `Delivery`
- Problem: the final step suggests successful rendering/publication for actions that are still placeholders.
- Expected outcome: placeholder actions must be labeled as unavailable, disabled, or explicitly marked as future work.
- Validation:
- Reach the delivery step.
- Confirm only real actions look actionable and success language is limited to implemented flows.

## High

### BOS-004: Surface corrupted registry store failures

- Priority: `High`
- Area: `Persistence`
- Problem: corrupted JSON stores silently fall back to empty state.
- Expected outcome: corrupted stores should surface recoverable errors, not appear as valid empty data.

### BOS-005: Move calendar persistence to backend

- Priority: `High`
- Area: `Calendar`
- Problem: calendar planning is browser-local only.
- Expected outcome: calendar data can survive browser changes and support shared continuity.

### BOS-006: Clarify Instagram publication requirements

- Priority: `High`
- Area: `Calendar / Publishing`
- Problem: publication expects a public image URL, but internal creation does not naturally produce one.
- Expected outcome: the workflow must either generate a valid public asset URL or clearly separate export from publish.

### BOS-007: Protect blank scope from cross-brand contamination

- Priority: `High`
- Area: `Editorial / Identity`
- Problem: blank scope is global and can mix different unsaved brand contexts.
- Expected outcome: blank workspaces should be isolated or explicitly scoped.

## Medium

### BOS-008: Reduce first-screen cognitive overload

- Priority: `Medium`
- Area: `Brand foundation UX`
- Expected outcome: the minimal path should be clearer for first-time users.

### BOS-009: Replace alert-based feedback with consistent inline/toast feedback

- Priority: `Medium`
- Area: `Feedback UX`
- Expected outcome: async flows use one feedback model across the module.

### BOS-010: Improve keyboard and ARIA accessibility

- Priority: `Medium`
- Area: `Accessibility`
- Expected outcome: stepper, cards, and primary actions must be keyboard operable and semantically labeled.

## Automation

### BOS-011: Add registry unit tests

- Priority: `High`
- Area: `Quality`
- Expected outcome: manifesto, editorial, visual identity, and carousel draft registries are covered with automated tests.

### BOS-012: Add Brand[OS] navigation and helper tests

- Priority: `Medium`
- Area: `Quality`
- Expected outcome: view-step synchronization rules are covered by automated tests.

### BOS-013: Add API integration tests for branding routes

- Priority: `Medium`
- Area: `Quality`
- Expected outcome: branding endpoints are validated for success and error contracts.

# Deliverables

## D1: Single Catalog Source
**Outcome**:
A typed HUD catalog manifest records every small component family, API surface, status, source file, examples, and migration notes.
**Demo**:
`npm run start:client` and open `/hud-kit.html`
**Acceptance Checks**:
- [x] Catalog metadata exists in one source file or tightly scoped module group.
- [x] Existing stable primitives are listed before new elements are added.
- [x] Manifest entries include category, status, props/attributes, slots, events, CSS variables, examples, and source path.
**Dependencies**:
None.
**Notes**:
This is the spine for all later waves.

## D2: Foundations And Atoms
**Outcome**:
Foundational tokens, icon registry entries, label/number/icon atoms, and status metadata are complete enough for downstream controls and surfaces.
**Demo**:
`hud-kit.html` shows foundation and atom catalog sections.
**Acceptance Checks**:
- [x] Icon assets have named catalog entries with usage guidance.
- [x] Atom examples include sizes, tones, disabled/active states where applicable.
- [x] Existing atoms remain backward-compatible.
**Dependencies**:
D1.
**Notes**:
This wave should not change live HUD composites.

## D3: Control Elements
**Outcome**:
Buttons, icon buttons, action groups, toolbars, fields, selects, sliders, dual sliders, blend controls, tabs/segmented controls, and command controls are represented as small catalog elements.
**Demo**:
`hud-kit.html` control sections exercise keyboard, disabled, active, danger, compact, and mobile-density states.
**Acceptance Checks**:
- [x] Controls expose events and value APIs consistently.
- [x] New controls are documented in the catalog manifest.
- [x] Existing controls retain current public behavior.
**Dependencies**:
D1, D2.
**Notes**:
Controls must stay reusable and not bake in game-specific state.

## D4: Indicators And Row Elements
**Outcome**:
Meters, pills, stats, tables, list rows, feed rows, command rows, and player identity rows are cataloged as reusable small elements.
**Demo**:
`hud-kit.html` shows dense rows and data display examples without mounting finished composites.
**Acceptance Checks**:
- [x] Dense row primitives define truncation and action-slot behavior.
- [x] Indicator examples cover semantic tones and compact variants.
- [x] Table/list primitives are usable without leaderboard-specific data.
**Dependencies**:
D1, D2.
**Notes**:
Rows are allowed to mirror existing HUD layer needs but should not import game-layer types.

## D5: Surfaces, Overlays, And Feedback
**Outcome**:
Panel, modal, popover, toast, alert, empty, loading, confirm, and responsive layout helpers are cataloged as small elements.
**Demo**:
`hud-kit.html` shows shell examples and state variants with inert sample content.
**Acceptance Checks**:
- [x] Overlay shells define slots and focus/escape behavior expectations.
- [x] Feedback elements cover success, warning, danger, info, neutral, and compact variants.
- [x] Layout helpers document safe-area and density constraints.
**Dependencies**:
D1, D3.
**Notes**:
This deliverable creates building blocks for later modal/chat/player-panel work, not the finished modals.

## D6: Recipes And Guardrails
**Outcome**:
The catalog includes small composition recipes and validation that keeps the component registry and manifest coherent.
**Demo**:
`npx vitest run tests/client/hud` and visual review of `/hud-kit.html`
**Acceptance Checks**:
- [x] Recipes use only cataloged elements.
- [x] Tests verify catalog custom elements register once.
- [x] Catalog completeness checks fail for missing status, source path, or examples.
**Dependencies**:
D1-D5.
**Notes**:
Recipes should demonstrate composition without becoming live composites.

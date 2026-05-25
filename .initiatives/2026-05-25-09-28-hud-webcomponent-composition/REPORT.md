# Analysis Report: HUD Webcomponent Composition

## Executive Summary

- The old `HUD_*` token API is gone, but repeated raw Tailwind structures now sit directly in live HUD templates and the kit catalog.
- The highest-value missing components are table, form, toolbar, stat, and event-row primitives because those account for most copied HUD UI structure.
- Shadow DOM conversion should be selective: reusable HUD kit elements should encapsulate styling, while outer layer positioning can stay local.
- The catalog currently demonstrates some raw layout internals, which undermines its role as the source of truth for building future panels.

## Findings

### 1. Reusable table structure is still copied across panels

- Evidence:
  - `src/client/hud/layers/Leaderboard.ts` contains repeated `table`, `th`, and `td` class strings for compact leaderboard rows.
  - `src/client/hud/layers/TeamStats.ts` repeats the same compact table/header/cell structure.
  - `src/client/hud/layers/PlayerInfoOverlay.ts` repeats compact table rows for player and unit detail rows.
  - `src/client/hud/demo/HudPanelWorkbench.ts` still shows raw compact-table markup in the catalog.
- Impact:
  - New panels still need to copy exact table class strings.
  - Table spacing and alignment can drift between panels.
  - The absence of a table component is the largest remaining gap in the reusable HUD kit.
- Recommendation:
  - Add minimal table components or a single row-driven table component that standardizes compact HUD table density.
- Risk:
  - Medium visual regression risk around row height, truncation, and text alignment.

### 2. Form controls remain ad hoc despite slider work

- Evidence:
  - `src/client/hud/demo/HudPanelWorkbench.ts` uses raw grid rows, labels, `input`, `select`, and range classes in the form atom section.
  - `src/client/hud/layers/ControlPanel.ts` still uses a raw native range input for attack ratio.
  - `hud-dual-range` and `hud-blend-slider` exist, but there is no canonical `hud-form-row`, `hud-input`, `hud-select`, or single-range control.
- Impact:
  - Future HUD panels will recreate form rows and native control styling manually.
  - Single and dual range sliders can visually drift.
- Recommendation:
  - Add canonical form components for field rows, labels, text inputs, selects, and a single range slider.
- Risk:
  - Low to medium. Native input styling varies by browser and needs visual verification.

### 3. Toolbar and icon-button groups are still rebuilt by hand

- Evidence:
  - `src/client/hud/layers/GameRightSidebar.ts` now uses `hud-icon-button`, but the toolbar container and timer label are still raw classes.
  - `src/client/hud/layers/GameLeftSidebar.ts` keeps a raw surface and button strip around leaderboard toggles.
  - `src/client/hud/demo/HudPanelWorkbench.ts` demonstrates toolbar structure using raw layout classes.
- Impact:
  - Toolbars remain harder to compose and scan than they should be.
  - Timer label sizing and toolbar spacing can drift.
- Recommendation:
  - Add `hud-toolbar` and `hud-timer-label` components, then migrate sidebars and catalog examples.
- Risk:
  - Low. These are compact wrappers with straightforward slots.

### 4. Event rows and action groups are still local markup

- Evidence:
  - `src/client/hud/layers/EventsDisplay.ts` contains raw classes for event filter buttons, event table cells, action groups, and event action buttons.
  - `src/client/hud/demo/HudPanelWorkbench.ts` has an event molecule example built from raw div/span/button layout.
  - `hud-attack-row` exists, but general event rows do not.
- Impact:
  - Event UI remains one of the most class-heavy live surfaces.
  - Filter icon groups and event action buttons are likely to diverge from the HUD kit.
- Recommendation:
  - Add `hud-action-group`, `hud-event-row`, and a compact icon segment option where useful.
- Risk:
  - Medium. `EventsDisplay` has conditional event actions and message-specific coloring.

### 5. Stat/resource rows are repeated instead of represented as molecules

- Evidence:
  - `src/client/hud/layers/Leaderboard.ts` economy view uses repeated stat-grid markup and resource meter rows.
  - `src/client/hud/demo/HudPanelWorkbench.ts` repeats stat label/value and economy row examples with raw classes.
- Impact:
  - Resource/economy panels will keep duplicating stat-grid and resource-row markup.
  - Color and spacing drift is likely as more resource HUD panels are added.
- Recommendation:
  - Add `hud-stat-grid`, `hud-stat`, and optionally `hud-resource-row` if it removes concrete duplication.
- Risk:
  - Low. These are display-only components.

### 6. Light DOM is still widespread in HUD layers

- Evidence:
  - Many HUD layers implement `createRenderRoot() { return this; }`, including `ControlPanel`, `EventsDisplay`, `Leaderboard`, `TeamStats`, `PlayerInfoOverlay`, `GameLeftSidebar`, `GameRightSidebar`, `ReplayPanel`, `UnitDisplay`, and demos.
  - Reusable kit components in `src/client/hud/ui/HudComponents.ts` use scoped styles, but layers still rely on page-level Tailwind.
- Impact:
  - Reusable components are now cleaner, but live layers still depend on global CSS.
  - Moving an entire layer to Shadow DOM can break placement and Tailwind utility styling unless done carefully.
- Recommendation:
  - Treat Shadow DOM conversion as a per-panel decision after reusable structure is migrated. Do not force every layer into Shadow DOM in the first pass.
- Risk:
  - High if attempted as a blanket conversion; low if limited to new reusable HUD components.

## Quick Wins

- Add `hud-toolbar` and `hud-timer-label`.
- Add `hud-form-row`, `hud-field-label`, `hud-input`, `hud-select`, and `hud-range`.
- Replace raw form and toolbar examples in `HudPanelWorkbench.ts`.

## Medium Changes

- Add compact table components and migrate `Leaderboard`, `TeamStats`, and `PlayerInfoOverlay`.
- Add stat/resource display molecules and migrate economy sections.
- Add event row/action-group components and migrate `EventsDisplay`.

## High-Risk Decisions

- Whether to move live HUD layers from light DOM to Shadow DOM.
- Whether to support table components as semantic `<table>` children or as a row-driven component API.
- How much Tailwind placement is allowed at panel boundaries.

## Guardrails

- Keep new components narrow and directly tied to repeated HUD structures.
- Do not add a broad design-token framework.
- Preserve existing render behavior and event contracts.
- Use CSS custom properties, parts, slots, and semantic properties instead of class escape hatches.
- Leave layer placement and responsive positioning local unless it becomes repeated HUD structure.

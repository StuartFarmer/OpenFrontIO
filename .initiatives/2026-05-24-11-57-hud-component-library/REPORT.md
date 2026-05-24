# Analysis Report: HUD Component Library

## Executive Summary
- The control panel is the largest remaining source of repeated HUD UI structure, especially the metric segmented bar, resource blend slider, rate pills, and metric meter internals.
- `HudTheme.ts` already contains useful primitives, but it mixes atoms, molecules, semantic variants, and one-off component fragments in one flat namespace.
- Several live HUD layers still recreate panel shells, headers, tables, meters, tooltips, toolbar rows, and icon sizing directly with Tailwind classes.
- `/hud-kit` is useful as a catalog, but it still contains page-local classes for reusable-looking atoms and molecules, which weakens it as the source of truth.
- Legacy demo pages appear to overlap the new HUD kit and should be explicitly retired or isolated from the source-of-truth path.

## Findings

### 1. Control panel molecules are still inline
- Evidence:
  - `src/client/hud/layers/ControlPanel.ts` defines metric semantic classes in `MetricView` fields such as `barClass`, `borderClass`, and `textClass`.
  - `renderMetricBar()` composes the meter text layout, separator, capacity width, icon spacing, and drop shadows inline.
  - `renderRatePill()` composes width, positive/negative colors, icon, and value inline.
  - `renderBlendDualRange()` composes a full dual range slider, colored resource regions, labels, and handle styles inside the control panel.
- Impact:
  - New panels that need metric tabs, meters, rate pills, or resource blend sliders must copy control-panel-specific markup.
- Recommendation:
  - Promote these repeated structures into HUD UI molecules under `src/client/hud/ui`, then make the control panel consume them.
- Risk:
  - Medium. This component has active state and user input, so extraction should preserve existing handlers and values exactly.

### 2. `HudTheme.ts` is useful but not yet a clean library boundary
- Evidence:
  - `src/client/hud/ui/HudTheme.ts` exports atoms such as `HUD_ICON_ATOM`, labels, inputs, and buttons.
  - The same file also exports higher-level fragments such as `HUD_ATTACK_ROW`, `HUD_BLEND_BAR`, `HUD_ATTACK_RATIO_PILL`, `HUD_BUILD_ITEM`, and `HUD_TOOLBAR`.
- Impact:
  - Consumers cannot tell which exports are primitives, which are molecules, and which are component-specific shortcuts.
- Recommendation:
  - Keep Tailwind encapsulation in HUD UI exports, but organize the library around clear primitives, molecules, and composite helpers.
- Risk:
  - Low to medium. Renaming everything would create churn; a lean path should add clearer exports and migrate high-value consumers first.

### 3. Live HUD layers still define reusable layout directly
- Evidence:
  - `PlayerInfoOverlay.ts` builds the mini troop meter from raw divs and raw fill classes.
  - `UnitDisplay.ts` still defines strip layout and tooltip UI locally.
  - `EventsDisplay.ts` still defines panel positioning, header layout, notification pill behavior, and event action spacing locally.
  - `Leaderboard.ts` and `TeamStats.ts` still define table shells, scroll containers, row states, and popover layout locally.
  - `GameLeftSidebar.ts` and `GameRightSidebar.ts` still define panel and toolbar shell layout directly around shared atoms.
- Impact:
  - HUD panels drift visually even when they use some shared constants.
- Recommendation:
  - Standardize the shared panel shell, header, toolbar, table shell, row state, tooltip, meter, and popover molecules before broad migration.
- Risk:
  - Medium. Layout wrappers can change dimensions or scroll behavior if extracted too aggressively.

### 4. `/hud-kit` demonstrates components but still owns reusable-looking styling
- Evidence:
  - `src/client/hud/demo/HudPanelWorkbench.ts` includes local classes such as `atom-row`, `atom-caption`, `atom-icon`, `actual-icon-grid`, `surface-sample`, `button-sample`, `attack-row-sample`, `stage`, and `frame`.
  - The catalog renders atoms, forms, meters, tables, and complete HUD panels in one place.
- Impact:
  - The catalog is partly documentation and partly an alternate styling source.
- Recommendation:
  - Keep catalog-only layout wrappers in the demo file, but move reusable atom and molecule styling into HUD UI exports and render helpers.
- Risk:
  - Low. This is mostly documentation hygiene unless demo-only classes are consumed elsewhere.

### 5. Legacy demo files overlap the new source of truth
- Evidence:
  - `src/client/hud/demo/HudUiKitCatalog.ts` and `src/client/hud/demo/HudStyleDemo.ts` define older standalone UI classes and demos.
  - Current discussion treats `HudPanelWorkbench` and `/hud-kit` as the source of truth.
- Impact:
  - Future contributors may update the wrong catalog or copy obsolete styles.
- Recommendation:
  - Mark legacy demos clearly or remove their routes/usages after confirming they are no longer needed.
- Risk:
  - Low. The main risk is deleting a page that still has a hidden route or manual workflow.

## Quick Wins
- Extract the control panel metric bar into a dedicated HUD molecule.
- Extract the resource blend dual slider into a reusable HUD molecule used by both `/hud-kit` and the control panel.
- Add panel/header/body/table/toolbar shell helpers around existing `HudTheme.ts` tokens.
- Move catalog atom display classes that represent reusable UI into HUD UI exports.

## Medium Changes
- Split HUD UI exports into clearer files for primitives, molecules, and complete/composite helpers.
- Migrate `PlayerInfoOverlay`, `UnitDisplay`, `EventsDisplay`, sidebars, leaderboard, and team stats to the shared HUD library in small passes.
- Reconcile old demo pages with the new `/hud-kit` source of truth.

## High-Risk Decisions
- Whether to use only class constants or introduce Lit render helper functions/components for molecules.
- Whether modals should be included in the HUD component library now or handled as a separate initiative.
- Whether to rename existing `HUD_*` exports or preserve them and layer clearer exports on top.

## Guardrails
- Preserve existing gameplay behavior and event handlers.
- Prefer migrating one live component at a time.
- Keep Tailwind inside reusable HUD exports where possible.
- Keep catalog scaffolding separate from reusable component styling.
- Validate with TypeScript, ESLint, and a `/hud-kit` visual pass.

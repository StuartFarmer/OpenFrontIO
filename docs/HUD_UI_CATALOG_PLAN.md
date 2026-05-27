# HUD UI Catalog And Bootstrap-Style Plan

## Source Notes

`docs/BOOTSTRAP_DOCS.md` is the Bootstrap 3 components page. Its useful model is not the exact widgets, but the catalog structure:

- Iconography and primitive tokens.
- Dropdowns, button groups, input groups, navs, and navbars.
- Small metadata components such as labels and badges.
- Feedback components such as alerts and progress bars.
- Repeated content structures such as media objects, list groups, tables, and panels.
- Large composed surfaces such as panels, wells, modals, and responsive embeds.

The HUD already has the beginning of this shape in `src/client/hud/ui/HudComponents.ts` and the visual workbench at `hud-kit.html` / `src/client/hud/demo/HudPanelWorkbench.ts`.

## Shared App UI Boundary

The app-wide primitive layer now lives in `src/client/components/ui`.

Use `ui-*` components for generic application UI:

- surfaces: `ui-surface`, `ui-surface-header`, `ui-surface-body`, `ui-surface-footer`
- modal structure: `ui-modal-shell`, `ui-modal-header`, `ui-modal-body`, `ui-modal-footer`
- controls: `ui-button`, `ui-icon-button`, `ui-action-group`, `ui-input`, `ui-textarea`, `ui-select`, `ui-range`, `ui-toggle`, `ui-checkbox`
- display: `ui-label`, `ui-pill`, `ui-alert`, `ui-stat-grid`, `ui-stat`, `ui-table`, `ui-table-row`, `ui-table-cell`, `ui-list-row`, `ui-empty-state`, `ui-loading-state`
- layout and menus: `ui-row`, `ui-stack`, `ui-grid`, `ui-menu`, `ui-menu-item`

Keep `hud-*` components for gameplay-HUD specific concerns:

- fixed-density bottom/control panels
- game event rows, attack rows, unit buttons, HUD meters, blend sliders, segmented controls, and other compact gameplay-specific compositions
- pointer-event and safe-area behavior unique to in-game overlays

The migration rule is simple: app screens and normal modals should not import from `src/client/hud/ui`; HUD composites should use `hud-*` when they need gameplay density or semantics, and `ui-*` when they only need a generic button, modal shell, form control, stat, or table.

## Existing HUD Catalog

### Foundations

| Element                          | Source                                               | Role                                                    |
| -------------------------------- | ---------------------------------------------------- | ------------------------------------------------------- |
| `HudScopedElement`, `HudElement` | `src/client/hud/ui/HudComponents.ts`                 | Shared Lit base classes and scoped HUD styling.         |
| `HudColors.ts`                   | `src/client/hud/ui/HudColors.ts`                     | Shared semantic tone types for pills and resource bars. |
| `formatHudQuantity`              | `src/client/hud/ui/HudComponents.ts`                 | Compact HUD number formatting.                          |
| `renderLucideIcon`               | `src/client/hud/ui/LucideIcon.ts`                    | Lucide icon renderer used by catalog/demo controls.     |
| `UIElement`, `TextIndicator`     | `src/client/hud/ui/UIElement.ts`, `TextIndicator.ts` | Canvas-era HUD primitive interface and text indicator.  |

### Catalog And Demo Shell

| Element                                                                                                                                                                                                      | Role                                                                                                |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------- |
| `hud-kit.html`                                                                                                                                                                                               | Entry point for the HUD catalog page.                                                               |
| `hud-panel-workbench`                                                                                                                                                                                        | Main Bootstrap-like catalog page, currently grouped into atoms, molecules, and complete components. |
| `hud-live-demo.html` / `hud-live-components-demo`                                                                                                                                                            | Full live HUD scaffold with mocked game data.                                                       |
| `hud-demo.html` / `hud-panels.html`                                                                                                                                                                          | Additional HUD demo entry points.                                                                   |
| `hud-kit-page`, `hud-kit-topbar`, `hud-kit-catalog`, `hud-kit-heading`, `hud-kit-section`, `hud-kit-stage`, `hud-kit-row`, `hud-kit-caption`, `hud-kit-frame`, `hud-kit-icon-gallery`, `hud-kit-icon-sample` | Catalog-only layout primitives for documenting examples.                                            |

### Atoms

| Element            | Bootstrap Analogy         | Current Use                                                     |
| ------------------ | ------------------------- | --------------------------------------------------------------- |
| `hud-icon`         | Glyphicons                | Image icon with size and semantic tone.                         |
| `hud-mask-icon`    | Glyphicons / utility icon | Masked monochrome icon for recolorable asset icons.             |
| `hud-label`        | Labels                    | Compact text label with semantic tone.                          |
| `hud-number`       | Label / badge text        | Numeric text with optional compact formatting.                  |
| `hud-color-swatch` | Utility sample            | Tiny color/tone preview for catalog and settings-like surfaces. |
| `hud-timer-label`  | Navbar text / badge       | Timer display used in the right toolbar.                        |
| `relation-smiley`  | Icon state                | SVG relation face for player popovers.                          |

### Controls

| Element                 | Bootstrap Analogy                  | Current Use                                                 |
| ----------------------- | ---------------------------------- | ----------------------------------------------------------- |
| `hud-button`            | Button                             | General compact text button.                                |
| `hud-icon-button`       | Button with icon                   | Toolbar and compact command buttons.                        |
| `hud-action-group`      | Button group / toolbar             | Groups compact controls inside headers and rows.            |
| `hud-toolbar`           | Button toolbar / navbar            | Horizontal control strip, currently used by sidebars.       |
| `hud-input`             | Input group input                  | Compact HUD text input.                                     |
| `hud-select`            | Select / input group               | Compact HUD select.                                         |
| `hud-range`             | Input range                        | Single-value slider.                                        |
| `hud-dual-range`        | Input group / range pair           | Two-handle percentage range.                                |
| `hud-blend-slider`      | Stacked progress + input           | Resource blend control with two handles and three segments. |
| `hud-segmented-control` | Nav pills / justified button group | Metric selector in the control panel.                       |

### Indicators And Data Display

| Element                                        | Bootstrap Analogy        | Current Use                                             |
| ---------------------------------------------- | ------------------------ | ------------------------------------------------------- |
| `hud-pill`                                     | Label / badge            | Semantic chip for status, counts, rates, and resources. |
| `hud-meter`                                    | Progress bar             | Single, stacked, and mini meters.                       |
| `hud-range-readout`                            | Tooltip / label overlay  | Readout overlay for range handles.                      |
| `hud-table`, `hud-table-row`, `hud-table-cell` | Table / list group       | Compact aligned rows for leaderboard and popovers.      |
| `hud-stat-grid`, `hud-stat`                    | List group / panel stats | Dense economy and metric summaries.                     |
| `hud-tooltip`                                  | Tooltip                  | Compact tooltip wrapper for unit/build controls.        |

### Surfaces And Layout

| Element              | Bootstrap Analogy                   | Current Use                                  |
| -------------------- | ----------------------------------- | -------------------------------------------- |
| `hud-surface`        | Panel / well                        | Standard panel shell.                        |
| `hud-surface-header` | Panel heading                       | Header slot for title/actions.               |
| `hud-surface-body`   | Panel body                          | Padded body slot.                            |
| `hud-control-panel`  | Panel body wrapper                  | Control-panel-specific compact layout shell. |
| `hud-unit-display`   | Button toolbar / list group wrapper | Unit strip layout wrapper.                   |

### Reusable Molecules

| Element                           | Bootstrap Analogy              | Current Use                                                                      |
| --------------------------------- | ------------------------------ | -------------------------------------------------------------------------------- |
| `hud-player-identity`             | Media object                   | Player avatar/name/team identity block.                                          |
| `hud-form-row`, `hud-field-label` | Horizontal form / input group  | Label + control rows.                                                            |
| `hud-unit-button`                 | Button group item              | Build/unit command button with icon, count, disabled state, and tooltip support. |
| `hud-event-row`                   | Alert / media object           | Event feed row with tone and actions slot.                                       |
| `hud-attack-row`                  | List group item / media object | Attack list row with icons, amount, target label, and action slot.               |

### Complete HUD Components

| Element                                                                                                            | Category                    | Notes                                                                                       |
| ------------------------------------------------------------------------------------------------------------------ | --------------------------- | ------------------------------------------------------------------------------------------- |
| `control-panel`                                                                                                    | Bottom HUD panel            | Uses many reusable atoms/molecules: segmented control, meters, pills, ranges, blend slider. |
| `unit-display`                                                                                                     | Bottom HUD command strip    | Uses `hud-unit-display`, `hud-unit-button`, `hud-tooltip`.                                  |
| `attacks-display`                                                                                                  | Bottom HUD list panel       | Uses `hud-attack-row` and action controls.                                                  |
| `events-display`                                                                                                   | Event feed panel            | Uses surface/header/body, icon buttons, event rows, pills, action groups.                   |
| `leader-board`                                                                                                     | Table panel                 | Uses HUD table components and economy view.                                                 |
| `team-stats`                                                                                                       | Team table panel            | Similar table/list surface.                                                                 |
| `game-left-sidebar`                                                                                                | Toolbar + composite sidebar | Wraps leaderboard and team stats with toolbar buttons.                                      |
| `game-right-sidebar`                                                                                               | Toolbar                     | Settings, replay, exit, fullscreen, and timer controls.                                     |
| `replay-panel`                                                                                                     | Floating control panel      | Replay speed and transport controls.                                                        |
| `player-info-overlay`                                                                                              | Popover / media object      | Player facts, troop meter, relations, action/status pills.                                  |
| `spawn-timer`, `immunity-timer`                                                                                    | Progress/alert strips       | Time-limited top HUD bars.                                                                  |
| `chat-display`, `chat-modal`, `emoji-table`                                                                        | Chat surfaces               | Mostly older styling; not yet normalized to HUD atoms.                                      |
| `build-menu`, `main-radial-menu`, `radial-menu` classes                                                            | Radial command UI           | Specialized interaction surface, partly canvas/WebGL-backed.                                |
| `player-panel`, `player-moderation-modal`, `send-resource-modal`, `settings-modal`, `multi-tab-modal`, `win-modal` | Modal/dialog surfaces       | Mixed styling; good candidates for modal-shell primitives.                                  |
| `alert-frame`, `heads-up-message`, `in-game-promo`, `performance-overlay`                                          | Feedback/overlay surfaces   | Mostly standalone; should be classified and normalized.                                     |

## Gaps Compared With A Bootstrap-Style Catalog

- The catalog page exists, but it is mostly visual. It does not yet define a stable API table for each component: attributes, properties, slots, events, CSS variables, states, and examples.
- Current reusable HUD primitives cover panels, buttons, icons, labels, pills, meters, tables, sliders, segmented controls, unit buttons, event rows, and attack rows. Missing reusable primitives include modal shells, popovers, toast/alert variants, menu/dropdown, tabs, empty states, confirmation actions, and responsive layout helpers.
- Several complete HUD components still carry local Tailwind-heavy markup that could be converted into shared atoms or molecules: `chat-display`, modal components, `alert-frame`, `heads-up-message`, and parts of `player-panel`.
- There are now two intentional component families: generic `ui-*` primitives in `src/client/components/ui/` and gameplay-specific `hud-*` primitives in `src/client/hud/ui/`. Older layer-specific DOM/Tailwind patterns are migration candidates.
- Icon assets are visible in the workbench, but there is not yet a named icon registry with intended usage, tone compatibility, or replacement guidance.

## Proposed Bootstrap-Style Catalog Structure

Use Bootstrap's component taxonomy as the documentation model, but name sections for OpenFront HUD needs:

1. Foundations
   - Colors, typography, spacing, radius, shadows, z-index, safe-area layout, numeric formatting.
   - Icon asset registry and Lucide usage rules.

2. Atoms
   - Icon, mask icon, label, number, pill, color swatch, timer label.
   - Each entry documents props, slots, tones, sizes, states, and accessibility requirements.

3. Controls
   - Button, icon button, action group, toolbar, input, select, range, dual range, blend slider, segmented control.
   - Include default, active, danger, disabled, focused, compact, mobile, and keyboard states.

4. Indicators
   - Meter, mini meter, stacked meter, stat, stat grid, range readout, tooltip, badges/rate chips.

5. Data And Rows
   - Table, table row/cell, event row, attack row, player identity, unit button, form row.
   - Define canonical row density, truncation behavior, icon slots, and action slots.

6. Surfaces
   - Surface, header, body, control panel shell, unit display shell.
   - Add missing surface variants: modal, popover, toast/alert, side panel, menu/dropdown.

7. Composite Components
   - Control panel, unit display, attacks display, events display, leaderboard, team stats, sidebars, replay panel, player info overlay, timers, chat, modals, radial menus.
   - Each composite should include dependencies, state inputs, events, responsive constraints, and a live example.

8. Recipes
   - "Build a resource control row", "Build a compact toolbar", "Build a player list", "Build a modal action footer", "Build a feed row with actions".
   - Recipes are the Bootstrap equivalent of showing nested panels, list groups, button groups, and input groups together.

## Implementation Plan

### Phase 1: Make The Existing Catalog Authoritative

- Rename the workbench framing from internal demo language to catalog language where appropriate, keeping `hud-kit.html` as the visual entry point.
- Add a data-backed catalog manifest beside the workbench, for example `src/client/hud/ui/HudCatalog.ts`, that lists component name, category, source file, status, props, slots, events, states, examples, and migration notes.
- Render the catalog from the manifest instead of hard-coded section order where practical. Start with the existing atoms and molecules so the first pass stays low-risk.
- Add documentation for the already-supported components: `hud-surface`, `hud-button`, `hud-icon-button`, `hud-pill`, `hud-meter`, `hud-table`, `hud-range`, `hud-blend-slider`, `hud-segmented-control`, `hud-event-row`, `hud-attack-row`, `hud-unit-button`.

### Phase 2: Normalize Missing Bootstrap Equivalents

- Use `ui-modal-shell`, `ui-modal-header`, `ui-modal-body`, and `ui-modal-footer` for generic app/modal structure. Keep `hud-modal-*` only where a modal requires HUD-specific density or gameplay overlay constraints.
- Add `hud-popover` for `player-info-overlay` and future contextual overlays.
- Add `hud-alert` / `hud-toast` for `alert-frame`, `heads-up-message`, capacity warnings, and feedback messages.
- Add `hud-menu` / `hud-menu-item` for dropdown-like command lists where radial UI is not appropriate.
- Add `hud-tabs` or formalize `hud-segmented-control` as the canonical tab/pill primitive for panel switching.

### Phase 3: Convert Composite Components To Recipes

- For each complete HUD component, identify its reusable rows and layout pieces, then expose the smallest useful molecule:
  - `control-panel`: metric selector, metric meter row, attack ratio row, resource blend row.
  - `unit-display`: build command item, command strip, disabled/locked tooltip.
  - `events-display`: filter toolbar, event row, event feed body.
  - `leader-board` / `team-stats`: ranked table row, economy stat row.
  - `player-info-overlay`: player identity header, relation pill row, troop meter row, action row.
  - `chat-display`: chat feed row and compact toggle.
- Add recipe examples to `hud-panel-workbench` using only cataloged primitives. This gives future composite work a copyable pattern without copying full game-layer state.

### Phase 4: Add Guardrails

- Add a small test that imports/registers every cataloged custom element and asserts no duplicate custom element definitions.
- Add screenshot coverage for `hud-kit.html` at desktop and mobile widths once the current Playwright setup can render it reliably.
- Add a lint or test helper that flags new `src/client/hud/layers/*` components that do not import from `src/client/hud/ui/` when they render controls, surfaces, rows, or indicators.
- Track migration status in the manifest: `stable`, `draft`, `legacy`, `needs-catalog`, `deprecated`.

### Phase 5: Migration Order

1. Document and stabilize the components already used by `control-panel`, `events-display`, `leader-board`, and `player-info-overlay`.
2. Normalize feedback surfaces: `heads-up-message`, `alert-frame`, timer bars.
3. Normalize modal shells and action footers.
4. Normalize chat display and chat modal.
5. Treat radial/build menus separately, because their interaction model is specialized and should not be forced into generic panel primitives too early.

## Definition Of Done

- `hud-kit.html` is the visual source of truth for HUD primitives, molecules, surfaces, composites, and recipes.
- Each cataloged component has documented props, slots, events, states, CSS variables, and at least one live example.
- New composite HUD work can be assembled from documented primitives without copying CSS from an existing layer component.
- Legacy HUD surfaces are either migrated to catalog primitives or explicitly marked as migration candidates.

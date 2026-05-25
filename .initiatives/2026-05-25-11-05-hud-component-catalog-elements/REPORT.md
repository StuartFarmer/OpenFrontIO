# Analysis Report: HUD Component Catalog Elements

## Executive Summary
- The highest-impact gap is that the HUD catalog exists visually but is not yet a structured source of truth; without a manifest, new component work will keep scattering across demo code and layer code.
- The next highest-impact gap is missing Bootstrap-equivalent element families: modal shells, popovers, alerts/toasts, menus, tabs, empty states, confirmation actions, and responsive layout helpers.
- Existing HUD layer code gives clear evidence for reusable molecules, but the initiative should build catalog elements first and avoid finished composites.
- The main risk is expanding `HudComponents.ts` without API documentation, examples, or registration tests.

## Findings

### 1. The Catalog Page Is Visual, Not Yet Authoritative
- Evidence: `hud-kit.html` mounts `hud-panel-workbench`, and `src/client/hud/demo/HudPanelWorkbench.ts` hard-codes catalog sections such as atoms, molecules, and complete components.
- Evidence: `docs/HUD_UI_CATALOG_PLAN.md` calls out that the catalog does not yet define stable API tables for attributes, properties, slots, events, CSS variables, states, and examples.
- Impact: Future HUD work can copy screenshots or examples, but cannot reliably discover the intended API or migration status of each element.
- Recommendation: Add a single catalog manifest, likely `src/client/hud/ui/HudCatalog.ts`, and make every wave append to that manifest.
- Risk: Medium. The manifest must not become detached documentation; examples should be rendered from it or checked against it.

### 2. Core HUD Primitives Exist, But Missing Element Families Block Composite Reuse
- Evidence: `src/client/hud/ui/HudComponents.ts` already defines surfaces, buttons, icons, labels, numbers, pills, tables, meters, stats, form rows, inputs, selects, ranges, dual ranges, blend sliders, segmented controls, unit buttons, tooltips, event rows, and attack rows.
- Evidence: `docs/HUD_UI_CATALOG_PLAN.md` lists missing reusable primitives: modal shells, popovers, toast/alert variants, menus/dropdowns, tabs, empty states, confirmation actions, and responsive layout helpers.
- Impact: Larger HUD components still need to hand-roll repeated overlay, feedback, menu, and panel patterns.
- Recommendation: Add missing families as catalog elements before migrating live composites.
- Risk: Medium. Overlay and menu elements touch focus, keyboard, and layering behavior; they need tighter API definitions than static atoms.

### 3. Existing Live Layers Show The Needed Molecules But Should Not Be The Target Yet
- Evidence: `control-panel`, `events-display`, `leader-board`, `team-stats`, `player-info-overlay`, `game-left-sidebar`, `game-right-sidebar`, `unit-display`, and `attacks-display` already consume newer HUD UI primitives.
- Evidence: `chat-display`, `settings-modal`, `send-resource-modal`, `win-modal`, `alert-frame`, and `heads-up-message` still carry local Tailwind-heavy structure.
- Impact: There are obvious consumers for catalog elements, but migrating them during element construction would couple library design to one composite at a time.
- Recommendation: Use live layers as reference cases and add recipe examples, while deferring full composite migration.
- Risk: Low to medium. Recipes can drift from live behavior unless validation keeps examples compiling and rendering.

### 4. Iconography Needs A Registry, Not Just A Gallery
- Evidence: `HudPanelWorkbench.ts` contains `hudIconSamples`, a large list of HUD image assets used for the current gallery.
- Evidence: `docs/HUD_UI_CATALOG_PLAN.md` notes that icon assets are visible but not named with intended usage, tone compatibility, or replacement guidance.
- Impact: New elements can choose inconsistent icons or color handling.
- Recommendation: Add catalog metadata for icon names, asset paths, tones, sizes, and intended use.
- Risk: Low. This is mostly metadata, but it should stay close to existing `assetUrl` usage.

### 5. Guardrails Are Needed Before The Catalog Becomes Large
- Evidence: The current HUD UI file registers many custom elements with `@customElement`, and prior initiatives already touched many live HUD files.
- Evidence: `docs/HUD_UI_CATALOG_PLAN.md` proposes registration tests, screenshot coverage, and migration status tracking.
- Impact: A larger catalog increases the chance of duplicate custom element registration, undocumented API drift, and visual regressions.
- Recommendation: Add import/registration tests and catalog completeness checks as soon as the manifest exists.
- Risk: Medium. Visual screenshot automation may need local dev-server setup, so start with registration and manifest checks.

## Quick Wins
- Create `HudCatalog.ts` with categories, statuses, source paths, examples, and API metadata.
- Add manifest entries for existing stable elements before creating new ones.
- Convert `hudIconSamples` into named catalog data.
- Add a custom-element registration test for cataloged elements.

## Medium Changes
- Add modal, popover, alert/toast, menu, tab, empty-state, and confirmation primitives.
- Add recipe-only examples for common composition patterns without building final composites.
- Update `hud-panel-workbench` so every new element family appears in one catalog page.

## High-Risk Decisions
- Whether overlay elements own focus trapping and escape-key behavior immediately or start as styled shells.
- Whether tabs should be a separate `hud-tabs` element or a documented variant of `hud-segmented-control`.
- Whether catalog examples should be fully generated from metadata or hybrid-rendered with typed example functions.

## Guardrails
- Keep a single manifest as the source of catalog metadata.
- Add new elements in small families with examples and tests in the same wave.
- Mark every element as `stable`, `draft`, `legacy`, `needs-catalog`, or `deprecated`.
- Do not migrate final composites during this initiative unless a migration is required to validate a small element.

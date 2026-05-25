# Deliverables

## D1: Missing HUD Primitives

**Outcome**: Add the smallest set of canonical Lit components needed to replace repeated raw Tailwind HUD structure.
**Demo**:
`npx tsc --noEmit`
**Acceptance Checks**:

- [x] `HudComponents.ts` exposes table, form, toolbar, stat, and event/action components with scoped styles.
- [x] New components use semantic properties, slots, parts, and events instead of public class-token APIs.
      **Dependencies**: None
      **Notes**: Keep this lean. Do not introduce a theme framework or new folder hierarchy unless the file becomes unmanageable.

## D2: HUD Kit Catalog Is Component-First

**Outcome**: `HudPanelWorkbench.ts` shows the complete canonical component kit without raw reusable layout examples.
**Demo**:
`npm run start:client` and open `/hud-kit.html`
**Acceptance Checks**:

- [x] Form, table, event, toolbar, stat, and resource examples use canonical HUD elements.
- [x] Catalog remains organized from atom to molecule to complete panels.
      **Dependencies**: D1
      **Notes**: Catalog-only placement and stage framing classes are allowed.

## D3: Live Panels Use Canonical Components For Reusable Structure

**Outcome**: Core HUD panels stop copying table, toolbar, form, stat, and event-row structure.
**Demo**:
`npx tsc --noEmit`
**Acceptance Checks**:

- [x] `ControlPanel`, `Leaderboard`, `TeamStats`, `PlayerInfoOverlay`, `EventsDisplay`, sidebars, and economy sections use HUD components for repeated UI structure.
- [x] Panel placement/responsive classes remain local where they are not reusable HUD structure.
      **Dependencies**: D1, D2
      **Notes**: Preserve behavior and event contracts.

## D4: Shadow DOM Boundary Policy

**Outcome**: Establish and apply a clear policy for where light DOM remains acceptable and where Shadow DOM should be used.
**Demo**:
`rg "createRenderRoot\\(\\)" src/client/hud/layers src/client/hud/demo`
**Acceptance Checks**:

- [x] Reusable HUD kit elements use Shadow DOM scoped styles.
- [x] Remaining light-DOM layer overrides are either removed or documented as placement/global-integration boundaries.
      **Dependencies**: D3
      **Notes**: Do not force blanket layer conversion; migrate only where low-risk.

## D5: Validation And Residual Inventory

**Outcome**: Finish with automated checks and a short inventory of any remaining raw Tailwind usage that is intentionally local.
**Demo**:
`npx tsc --noEmit`
**Acceptance Checks**:

- [x] Targeted `npx eslint` passes for touched HUD files.
- [x] `git diff --check` passes.
- [x] Residual raw class usage is classified as either placement, state coloring, or follow-up debt.
      **Dependencies**: D1, D2, D3, D4
      **Notes**: This closes the loop without pretending all Tailwind classes must disappear.

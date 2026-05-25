# Plan: HUD Component Catalog Elements

**Stack**:
TypeScript, Lit custom elements, Tailwind CSS v4, Vite, npm, Vitest.
**Created**:
2026-05-25 11:05 Europe/Madrid

## Summary
- Deliverables: 6
- Waves: 8
- Tickets: 24

## Execution Order
1. W1: Single Catalog Spine
2. W2: Foundations And Iconography
3. W3: Basic Controls
4. W4: Complex Selection And Range Controls
5. W5: Indicators And Dense Rows
6. W6: Surfaces And Layout Helpers
7. W7: Overlays And Feedback
8. W8: Menus, Recipes, And Guardrails

## Parallelism
- W1 is sequential because the manifest schema and renderer establish the shared write path.
- W2 can split between design-token metadata and icon cataloging after W1.
- W3 and W4 can run as separate control-family tracks once the manifest exists, but both write to the same catalog and should coordinate exports.
- W5 can split row primitives from indicator primitives.
- W6 and W7 can run in parallel after W3 because surfaces and overlays are related but separate element families.
- W8 is a join wave because it validates that all element families land in one catalog.

## Validation Commands
- `npx tsc --noEmit`
- `npx eslint src/client/hud/ui src/client/hud/demo/HudPanelWorkbench.ts`
- `npx vitest run tests/client/hud tests/client/graphics`
- `npm run start:client` then review `/hud-kit.html`
- `git diff --check`

## Links
- `INITIATIVE.md`
- `REPORT.md`
- `deliverables/DELIVERABLES.md`
- `waves/todo/`
- `tasks/todo/`

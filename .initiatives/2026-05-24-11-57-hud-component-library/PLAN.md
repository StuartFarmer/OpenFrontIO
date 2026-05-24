# Plan: HUD Component Library

**Stack**:
TypeScript, Lit custom elements, Tailwind CSS v4, Vite, npm, Vitest.
**Created**:
2026-05-24 11:57 Europe/Madrid

## Summary

- Deliverables: 5
- Waves: 4
- Tickets: 13

## Execution Order

1. W1: Library Boundary
2. W2: Core Molecules
3. W3: Live Layer Migration
4. W4: Catalog And Validation

## Parallelism

- W1 is sequential because it defines shared library boundaries.
- W2 can split after shared icon/label/color normalization into controls and slider/meter tracks.
- W3 can split by live layer group after molecules exist.
- W4 is sequential because it finalizes the source-of-truth catalog and validates the completed migration.

## Validation Commands

- `npx tsc --noEmit`
- `npx eslint src/client/hud/ui src/client/hud/demo/HudPanelWorkbench.ts src/client/hud/layers/ControlPanel.ts src/client/hud/layers/PlayerInfoOverlay.ts src/client/hud/layers/UnitDisplay.ts src/client/hud/layers/EventsDisplay.ts src/client/hud/layers/GameLeftSidebar.ts src/client/hud/layers/GameRightSidebar.ts src/client/hud/layers/Leaderboard.ts src/client/hud/layers/TeamStats.ts`
- `git diff --check`
- `npm run start:client` for `/hud-kit` visual review

## Links

- `INITIATIVE.md`
- `REPORT.md`
- `deliverables/DELIVERABLES.md`
- `waves/todo/`
- `tasks/todo/`

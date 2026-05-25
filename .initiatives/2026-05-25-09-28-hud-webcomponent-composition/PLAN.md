# Plan: HUD Webcomponent Composition

**Stack**: TypeScript, Lit 3, Vite, Tailwind 4, npm, Vitest, ESLint, Prettier
**Created**: 2026-05-25 09:28

## Summary

- Deliverables: 5
- Waves: 4
- Tickets: 12

## Execution Order

1. W1 - Missing HUD Primitives
2. W2 - HUD Kit Catalog Migration
3. W3 - Live Panel Migration
4. W4 - Boundaries And Validation

## Links

- `INITIATIVE.md`
- `REPORT.md`
- `deliverables/DELIVERABLES.md`
- `waves/todo/`
- `tasks/todo/`

## Validation Baseline

- `npx tsc --noEmit`
- `npx eslint src/client/hud/ui src/client/hud/demo/HudPanelWorkbench.ts src/client/hud/layers/ControlPanel.ts src/client/hud/layers/Leaderboard.ts src/client/hud/layers/TeamStats.ts src/client/hud/layers/PlayerInfoOverlay.ts src/client/hud/layers/EventsDisplay.ts src/client/hud/layers/GameLeftSidebar.ts src/client/hud/layers/GameRightSidebar.ts src/client/hud/layers/ReplayPanel.ts`
- `git diff --check`

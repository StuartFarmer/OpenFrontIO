# Plan: HUD UI Migration Completion

**Stack**: TypeScript, Lit, Vite, Vitest, HUD web components
**Created**: 2026-05-28 06:45

## Summary
- Deliverables: 5
- Waves: 4
- Tickets: 14

## Execution Order
1. W1: Leaderboard and Stats Tables
2. W2: Setup and Lobby Controls
3. W3: Clan Workflows
4. W4: Docs, Commerce, and Compatibility Cleanup

## Validation Commands
- `npx prettier --write <changed files>`
- `npx tsc --noEmit`
- `npx vitest run tests/client/hud/ControlPanel.test.ts tests/client/graphics/layers/PlayerPanelKick.test.ts tests/client/hud/SendResourceModal.test.ts tests/client/components/UiComponents.test.ts`
- `npx vite build --mode development`

## Links
- `INITIATIVE.md`
- `REPORT.md`
- `deliverables/DELIVERABLES.md`
- `waves/todo/`
- `tasks/todo/`

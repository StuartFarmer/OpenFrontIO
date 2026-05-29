# Plan: Foundation MVP

**Stack**: TypeScript, npm, Vite, Vitest, Lit, custom WebGL2 renderer.
**Created**: 2026-05-29

## Summary
- Deliverables: 6
- Waves: 4
- Tickets: 14

## Execution Order
1. W1 - Foundation Domain And Map
2. W2 - Foundation Runtime And Updates
3. W3 - Foundation WebGL Client
4. W4 - Route, Debug Panel, And Verification

## Wave Notes
- W1 establishes the module home and semantic-free map/placement core. It can split map and placement work after the skeleton lands.
- W2 is sequential because the runtime, command router, and update envelope are small and tightly coupled.
- W3 splits renderer construction from input mapping, then joins them through runtime integration.
- W4 splits route mount from debug panel, then joins in final verification.

## Dependency Shape
- W1 blocks all implementation because Foundation should not build on OpenFront domain types.
- W2 depends on W1 placement/domain behavior.
- W3 depends on W1 buffers and W2 update shape.
- W4 depends on W3 for a route-visible vertical slice.

## Validation Commands
- `npx vitest run tests/games/foundation/map.test.ts tests/games/foundation/placement.test.ts`
- `npx vitest run tests/games/foundation/runtime.test.ts`
- `npx vitest run tests/games/foundation/webglAdapter.test.ts tests/games/foundation/inputAdapter.test.ts tests/games/foundation/client.test.ts`
- `npx vitest run tests/games/foundation tests/client/games/foundation`
- `npm run build-dev`

## Links
- `INITIATIVE.md`
- `REPORT.md`
- `deliverables/DELIVERABLES.md`
- `waves/todo/`
- `tasks/todo/`

## Related Initiatives
- Parent architecture: `.initiatives/2026-05-29-13-44-engine-sdk-game-modules/`
- Suggested follow-ons: generic protocol/update envelope migration, OpenFront module relocation, custom WebGL renderer modularization, multiplayer compatibility for non-OpenFront modules, Foundation population/food loop.

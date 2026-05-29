# Plan: OpenFront Module Relocation/Wrapping

**Stack**: TypeScript, npm, Vite, Vitest, Lit custom elements, custom WebGL renderer.
**Created**: 2026-05-29

## Summary
- Deliverables: 5
- Waves: 4
- Tickets: 10

## Execution Order
1. W1: Establish module boundary and registry.
2. W2: Wrap OpenFront server runtime.
3. W3: Wrap OpenFront client runtime.
4. W4: Clarify OpenFront-owned protocol/RPC surface and validate.

## Wave Parallelism
W1 is sequential because it defines the shared seam. W2 and W3 can proceed in parallel after W1 because server and client wrappers touch different hotspots. W4 is a join wave after server/client wrapping stabilizes.

## Links
- `INITIATIVE.md`
- `REPORT.md`
- `deliverables/DELIVERABLES.md`
- `waves/todo/`
- `tasks/todo/`

## Validation Commands
- `npx vitest run tests/core/systems/WorkerClientUpdateParity.test.ts tests/core/game/GameImpl.test.ts tests/NationCreation.test.ts`
- `npx vitest run tests/client/view/GameView.test.ts tests/client/LocalServer.test.ts tests/client/controllers/BuildPreviewController.test.ts tests/client/controllers/WarshipSelectionController.test.ts`
- `npx vitest run tests/MessageTypeClasses.test.ts tests/GameUpdateUtils.test.ts tests/core/systems/IntentCommandSurface.test.ts`
- `npm run build-dev`
- `npm test`

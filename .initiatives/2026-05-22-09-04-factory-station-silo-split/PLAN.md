# Plan: Factory Station Silo Split

**Stack**: TypeScript core/client/server, npm, Vite, Vitest, Lit HUD, WebGL renderer, Go map generator out of scope
**Created**: 2026-05-22

## Summary
- Deliverables: 5
- Waves: 4
- Tickets: 13

## Execution Order
1. W1 Core Unit Model
2. W2 Behavior Split
3. W3 Player UI And Rendering
4. W4 AI Validation And Polish

## Wave Dependencies
- W1 is the root dependency for all implementation work.
- W2 can begin after W1 and should complete before AI validation.
- W3 can begin after W1; UI copy should use the W2 behavior decision for train spawning wording.
- W4 joins W2 and W3 and performs final validation.

## Parallelism
- W1 is sequential because it edits shared core model files.
- W2 has two parallel tracks: Silo capacity and Station rail behavior, followed by a test join.
- W3 has three parallel tracks: build UI, input/preview, and renderer/assets, followed by copy/help cleanup.
- W4 has two parallel tracks: AI heuristics and config/help polish, followed by final validation.

## Validation Commands
- `npm run build-dev`
- `npx vitest run tests/core/configuration/ResourceCapacity.test.ts tests/core/game/RailNetwork.test.ts tests/core/game/TrainStation.test.ts`
- `npx vitest run tests/client/graphics/RadialMenuElements.test.ts tests/InputHandler.test.ts tests/client/controllers/BuildPreviewController.test.ts`
- `npx vitest run tests/NationStructureBehavior.test.ts`
- `npm run test`

## Links
- `INITIATIVE.md`
- `REPORT.md`
- `deliverables/DELIVERABLES.md`
- `waves/todo/`
- `tasks/todo/`

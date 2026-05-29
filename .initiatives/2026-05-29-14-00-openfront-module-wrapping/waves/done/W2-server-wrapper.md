# W2: Server Wrapper

**Status**: DONE
**Entry**:
W1 module boundary exists.
**Exit**:
OpenFront server startup and tick runtime are owned by the OpenFront server module while existing behavior remains compatible.
**Parallelization**:
2 parallel tracks after S2.1: Track A = S2.2 worker hookup, Track B = S2.3 compatibility tests.
**Deliverables**:
D2

## Tickets
- S2.1-wrap-openfront-game-runner.md
- S2.2-route-worker-init-through-openfront-module.md
- S2.3-add-server-boundary-tests.md

## Exit Criteria
- [x] Worker init still creates the same OpenFront runner behavior.
- [x] OpenFront startup executions remain installed as before.
- [x] Targeted server/runtime tests pass.

## Working Notes
- Added `src/games/openfront/server/OpenFrontServerModule.ts`.
- Routed worker `init` through `getGameModule().server.createRunner(...)` while preserving OpenFront worker RPCs and update batching.
- Added `tests/games/openfront/OpenFrontServerModule.test.ts`.
- Focused validation passed: `npx vitest run tests/games/openfront/OpenFrontServerModule.test.ts tests/core/systems/WorkerClientUpdateParity.test.ts tests/games/registry.test.ts`.
- Combined typecheck should be rerun after parallel client/protocol Batch 2 lanes finish.

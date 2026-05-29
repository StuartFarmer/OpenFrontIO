# Deliverables

## D1: OpenFront Module Boundary
**Outcome**:
An explicit OpenFront game module exists and is selected through a registry/default lookup without changing current behavior.
**Demo**:
`npm run build-dev`
**Acceptance Checks**:
- [ ] `openfront` is the default module for existing game starts.
- [ ] Module lookup happens at creation/mount boundaries, not through scattered gameplay switches.
- [ ] Existing imports are updated directly when files move; no re-export shims are introduced.
**Dependencies**:
None.
**Notes**:
This deliverable establishes shape before major moves.

## D2: OpenFront Server Wrapper
**Outcome**:
Current `createGameRunner()` behavior is owned by an OpenFront server module or adapter.
**Demo**:
`npx vitest run tests/core/systems/WorkerClientUpdateParity.test.ts tests/core/game/GameImpl.test.ts tests/NationCreation.test.ts`
**Acceptance Checks**:
- [ ] Config construction, map loading, human player creation, nation creation, `createGame()`, and `Executor` construction still behave as before.
- [ ] Spawn timer, random spawn, bots, nation executions, win check, and rail recompute remain installed for OpenFront.
- [ ] Worker initialization still creates the OpenFront runner through the module boundary.
**Dependencies**:
D1.
**Notes**:
Physical moves are optional after wrapper tests pass.

## D3: OpenFront Client Wrapper
**Outcome**:
Current client game creation, HUD mounting, input setup, worker update handling, sound setup, WebGL frame loop, and cleanup are owned by an OpenFront client module or adapter.
**Demo**:
`npx vitest run tests/client/view/GameView.test.ts tests/client/LocalServer.test.ts tests/client/controllers/BuildPreviewController.test.ts tests/client/controllers/WarshipSelectionController.test.ts`
**Acceptance Checks**:
- [ ] Existing lobby join/start flow delegates game mounting to OpenFront module.
- [ ] Current HUD custom elements are still wired for OpenFront.
- [ ] `ClientGameRunner.stop()` cleanup behavior remains intact.
- [ ] Replay and local single-player paths still route through existing behavior.
**Dependencies**:
D1.
**Notes**:
Do not make HUD features optional here; keep composition OpenFront-owned.

## D4: OpenFront-Owned Schemas And RPC Surface
**Outcome**:
Documentation and light adapters clarify that current schemas, intent events, worker RPCs, and update types are OpenFront-owned, not generic engine contracts.
**Demo**:
`npx vitest run tests/MessageTypeClasses.test.ts tests/GameUpdateUtils.test.ts tests/core/systems/IntentCommandSurface.test.ts`
**Acceptance Checks**:
- [ ] Existing OpenFront schema exports remain compatible.
- [ ] OpenFront intent routing still reaches the same execution classes.
- [ ] Worker query RPCs remain available for OpenFront UI.
- [ ] Follow-on protocol-envelope initiative has a clear handoff point.
**Dependencies**:
D1, D2, D3.
**Notes**:
This is not the full generic protocol migration.

## D5: Validation And Migration Notes
**Outcome**:
The module wrapping work has targeted tests, full build/test validation intent, and notes for future moves into `src/games/openfront`.
**Demo**:
`npm test`
**Acceptance Checks**:
- [ ] Targeted module-boundary tests exist.
- [ ] Build and relevant Vitest suites pass.
- [ ] Remaining OpenFront-owned files and future move groups are documented.
- [ ] No unrelated user edits are reverted.
**Dependencies**:
D1, D2, D3, D4.
**Notes**:
Use `npm run build-dev` if full test runtime is too high during development, then run `npm test` before merge.

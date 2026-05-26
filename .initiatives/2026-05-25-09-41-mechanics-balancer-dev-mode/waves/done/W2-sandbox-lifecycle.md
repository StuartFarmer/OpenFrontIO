# W2: Sandbox Lifecycle

**Status**: DONE
**Entry**: W1 complete enough that a `GameConfig` can carry mechanics values into `Config`.
**Exit**: `/sandbox` can create/restart local real-game runs with sandbox metadata and no archive/achievement/stat side effects.
**Parallelization**: 2 tracks after S2.1 starts: Track A = S2.1 -> S2.2 lifecycle/side effects, Track B = S2.3 route shell. Join before W3.
**Deliverables**: D3

## Tickets

- S2.1-solo-start-builder.md
- S2.2-sandbox-run-side-effects.md
- S2.3-sandbox-route-shell.md

## Exit Criteria

- [x] Sandbox launch reuses or factors normal solo `GameStartInfo` assembly instead of duplicating fragile config logic.
- [x] Sandbox runs can be identified and excluded from archive/achievement/stat paths.
- [x] `/sandbox` renders a standalone route shell.
- [x] Restart semantics are clear: new local run, pending mechanics applied at start.

## Working Notes

- 2026-05-25: Started wave execution. S2.1 is in progress first so the lifecycle marker can enter through shared solo game-start construction.
- 2026-05-25: Completed S2.1-S2.3. `/sandbox` renders a HUD-kit shell that can start/restart a real local sandbox run; sandbox runs are marked in `GameConfig` and bypass local stats/archive/ad URL side effects.
- 2026-05-25: Validation passed: `npx vitest run tests/client/LocalServer.test.ts tests/client/JoinLobbyModal.test.ts tests/client/utilities/SinglePlayerGameStart.test.ts tests/client/sandbox/SandboxBalancer.test.ts`; `npx tsc --noEmit`.

# W2: Sandbox Lifecycle

**Status**: TODO
**Entry**: W1 complete enough that a `GameConfig` can carry mechanics values into `Config`.
**Exit**: `/sandbox` can create/restart local real-game runs with sandbox metadata and no archive/achievement/stat side effects.
**Parallelization**: 2 tracks after S2.1 starts: Track A = S2.1 -> S2.2 lifecycle/side effects, Track B = S2.3 route shell. Join before W3.
**Deliverables**: D3

## Tickets
- S2.1-solo-start-builder.md
- S2.2-sandbox-run-side-effects.md
- S2.3-sandbox-route-shell.md

## Exit Criteria
- [ ] Sandbox launch reuses or factors normal solo `GameStartInfo` assembly instead of duplicating fragile config logic.
- [ ] Sandbox runs can be identified and excluded from archive/achievement/stat paths.
- [ ] `/sandbox` renders a standalone route shell.
- [ ] Restart semantics are clear: new local run, pending mechanics applied at start.

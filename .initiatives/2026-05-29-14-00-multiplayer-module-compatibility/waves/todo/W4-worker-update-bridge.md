# W4: Worker Update Bridge

**Status**: TODO
**Entry**: Generic turn envelopes and `GameModuleRuntime` are available.
**Exit**: Worker runtime has a path for generic module updates and queries while OpenFront keeps its current worker query behavior.
**Parallelization**: Sequential (1 owner) because worker protocol changes touch shared message unions and update batching.
**Deliverables**: D4

## Tickets
- S4.1-worker-runtime-envelope.md
- S4.2-openfront-worker-query-adapter.md
- S4.3-generic-update-batch-transfer.md

## Exit Criteria
- [ ] Worker init/turn processing can be module-aware.
- [ ] OpenFront `player_actions`, buildables, profile, border tiles, attack clusters, and transport spawn queries keep working.
- [ ] Foundation has a clear update path that does not fake `GameUpdateViewData`.

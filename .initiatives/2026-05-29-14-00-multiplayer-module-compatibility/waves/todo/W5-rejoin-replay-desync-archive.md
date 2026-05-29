# W5: Rejoin Replay Desync Archive

**Status**: TODO
**Entry**: Server, local, and worker envelopes are module-aware.
**Exit**: Rejoin, replay, hash/desync, winner voting, and archive support are `GameModuleRuntime.services` and OpenFront-compatible.
**Parallelization**: 3 independent tickets, then 1 join ticket: S5.1, S5.2, S5.3 -> S5.4.
**Deliverables**: D5

## Tickets
- S5.1-rejoin-turn-history-contract.md
- S5.2-hash-desync-service.md
- S5.3-winner-archive-records.md
- S5.4-compatibility-regression-suite.md

## Exit Criteria
- [ ] OpenFront rejoin and replay behavior remains intact.
- [ ] Hash/desync reporting uses module-provided deterministic state without opt-in flags.
- [ ] Foundation can provide minimal winner/archive payloads while retaining deterministic local turns.
- [ ] Regression tests cover old OpenFront paths and new generic envelope paths.

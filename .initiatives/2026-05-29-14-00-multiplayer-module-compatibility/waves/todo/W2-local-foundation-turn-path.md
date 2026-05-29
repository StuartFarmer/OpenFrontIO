# W2: Local Foundation Turn Path

**Status**: TODO
**Entry**: W1 envelope scaffold is available.
**Exit**: Foundation can use local start/intent/turn lifecycle semantics aligned with future remote multiplayer while remaining single-player first.
**Parallelization**: Sequential (1 owner) because `LocalServer`, `Transport`, and client start handling are shared write hotspots.
**Deliverables**: D2

## Tickets
- S2.1-local-server-generic-envelope.md
- S2.2-foundation-local-transport-contract.md

## Exit Criteria
- [ ] Foundation local play does not need OpenFront `GameConfig` or `Intent`.
- [ ] Local turn pacing and `turnComplete()` semantics remain covered by tests.
- [ ] The local path mirrors the remote envelope structure closely enough for later multiplayer.

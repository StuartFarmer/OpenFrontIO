# W2: Foundation Runtime And Updates

**Status**: TODO
**Entry**: W1 domain and map primitives are in place.
**Exit**: Foundation has a single-player local runtime with command routing, update envelopes, and no population/food ticking.
**Parallelization**: Sequential (1 owner), because command routing, runtime state, and update shape share the same small write hotspot.
**Deliverables**: D3, D6

## Tickets
- S2.1-command-update-envelopes.md
- S2.2-local-runtime-command-router.md
- S2.3-runtime-tests.md

## Exit Criteria
- [ ] Runtime accepts a click placement command and emits a map update.
- [ ] Updates use a Foundation-native generic-style envelope.
- [ ] Runtime does not import OpenFront `GameRunner`, `Executor`, or `Intent`.
- [ ] Runtime tests pass.

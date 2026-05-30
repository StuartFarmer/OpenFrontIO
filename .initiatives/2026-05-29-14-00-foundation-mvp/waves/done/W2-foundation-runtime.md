# W2: Foundation Runtime And Updates

**Status**: DONE
**Entry**: W1 domain and map primitives are in place.
**Exit**: Foundation has a single-player local runtime with command routing, update envelopes, and no population/food ticking.
**Parallelization**: Sequential (1 owner), because command routing, runtime state, and update shape share the same small write hotspot.
**Deliverables**: D3, D6

## Tickets
- S2.1-command-update-envelopes.md
- S2.2-local-runtime-command-router.md
- S2.3-runtime-tests.md

## Exit Criteria
- [x] Runtime accepts a click placement command and emits a map update.
- [x] Updates use a Foundation-native generic-style envelope.
- [x] Runtime does not import OpenFront `GameRunner`, `Executor`, or `Intent`.
- [x] Runtime tests pass.

## Completion Notes
- Added Foundation-owned command/update envelopes and local runtime/router under `src/games/foundation/runtime`.
- Runtime mutates semantic-free tile state through the W1 placement domain and emits changed tile refs/states for renderer integration.
- Second placement is rejected explicitly with `already_placed`; no population/food ticking is present.
- Verified with `npx vitest run tests/games/foundation/runtime.test.ts`, all Foundation tests, and `npx tsc --noEmit`.

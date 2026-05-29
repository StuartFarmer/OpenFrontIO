# W1: OpenFront Bridge

**Status**: DONE
**Entry**: W0 complete.
**Exit**: OpenFront legacy start, turn, intent, and update shapes can bridge to generic envelopes with tests.
**Parallelization**: 2 parallel tracks: Track A = S1.1 update bridge, Track B = S1.2 start/turn/intent bridge, then S1.3 join tests
**Deliverables**: D2

## Tickets
- S1.1-openfront-update-bridge.md
- S1.2-openfront-start-turn-intent-bridge.md
- S1.3-openfront-bridge-parity-tests.md

## Exit Criteria
- [x] OpenFront update bridge round-trips existing payloads.
- [x] OpenFront start/turn/intent bridge defaults missing `moduleID` to `openfront`.
- [x] Tests pin bridge behavior before worker/client call sites change.

## Working Notes
- 2026-05-29: Completed OpenFront bridge adapters under `src/core/protocol/openfront` with focused bridge and parity tests under `tests/core/protocol/openfront`.
- 2026-05-29: Runtime worker/client/server migration remains out of scope for W1.

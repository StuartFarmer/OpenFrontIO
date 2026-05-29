# W1: OpenFront Bridge

**Status**: TODO
**Entry**: W0 complete.
**Exit**: OpenFront legacy start, turn, intent, and update shapes can bridge to generic envelopes with tests.
**Parallelization**: 2 parallel tracks: Track A = S1.1 update bridge, Track B = S1.2 start/turn/intent bridge, then S1.3 join tests
**Deliverables**: D2

## Tickets
- S1.1-openfront-update-bridge.md
- S1.2-openfront-start-turn-intent-bridge.md
- S1.3-openfront-bridge-parity-tests.md

## Exit Criteria
- [ ] OpenFront update bridge round-trips existing payloads.
- [ ] OpenFront start/turn/intent bridge defaults missing `moduleID` to `openfront`.
- [ ] Tests pin bridge behavior before worker/client call sites change.

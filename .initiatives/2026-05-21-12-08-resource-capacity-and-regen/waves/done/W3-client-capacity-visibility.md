# W3: Client Capacity Visibility

**Status**: DONE
**Entry**: W1 capacity formulas are stable and W2 passive regen behavior is known.
**Exit**: Resource capacity crosses the worker/client boundary and the control panel can show current/max resource values.
**Parallelization**: 2 tracks after schema decision: Track A = S3.1 update/view plumbing, Track B = S3.2 UI display after S3.1 field names are fixed; S3.3 joins with tests.
**Deliverables**: D4

## Tickets
- S3.1-resource-capacity-update-state.md
- S3.2-control-panel-resource-capacity-display.md
- S3.3-client-capacity-tests.md

## Exit Criteria
- [x] Player updates include resource capacity when capacity changes.
- [x] `PlayerView` exposes resource capacity.
- [x] Control panel displays capacity compactly.
- [x] Client update/view/UI tests cover capacity propagation.

## Completion Notes
- `resourceCapacity` now travels through player updates, renderer state, and `PlayerView`.
- The control panel resource strip displays Food/Energy/Materials as `current/capacity`.
- W3 targeted tests and `npx tsc --noEmit` passed.

# W2: Behavior Split

**Status**: TODO
**Entry**: W1 complete.
**Exit**: Rail behavior is owned by Rail Station, capacity behavior is owned by Silo, and Factory no longer provides either first-step benefit.
**Parallelization**: 2 parallel tracks after W1: Track A = S2.1 capacity split, Track B = S2.2 rail split. S2.3 joins both tracks for cross-behavior regression tests.
**Deliverables**: D2

## Tickets
- S2.1-silo-capacity.md
- S2.2-station-rail-behavior.md
- S2.3-core-regression-tests.md

## Exit Criteria
- [ ] Capacity tests prove Silo owns stockpile capacity and Factory does not.
- [ ] Rail tests prove Rail Station owns the station/connection behavior previously provided by Factory.
- [ ] Train spawning ownership is explicit and tested.

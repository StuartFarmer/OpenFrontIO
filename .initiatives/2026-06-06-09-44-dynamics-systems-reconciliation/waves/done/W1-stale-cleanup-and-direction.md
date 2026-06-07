# W1: Stale Cleanup And Direction

**Status**: DONE
**Entry**: Analysis report exists and the user has confirmed the scheduler-plus-dynamics architecture.
**Exit**: Stale deleted-module references are removed or rewritten, and the initiative records the current save/simulate flow as the base.
**Parallelization**: 2 parallel tickets, then 1 join ticket. Track A = S1.1, Track B = S1.2, Join = S1.3.
**Deliverables**: D1

## Tickets

- S1.1-remove-deleted-dynamics-references.md
- S1.2-record-scheduler-dynamics-decision.md
- S1.3-cleanup-verification.md

## Exit Criteria

- [x] The old deleted compiler module is not referenced as an implementation target.
- [x] Current Foundation save/simulate flow is named as the dynamics base.
- [x] Cleanup verification command is recorded.

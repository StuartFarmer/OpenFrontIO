# W1: Stale Cleanup And Direction

**Status**: TODO
**Entry**: Analysis report exists and the user has confirmed the scheduler-plus-dynamics architecture.
**Exit**: Stale deleted-core-dynamics references are removed or rewritten, and the initiative records the current save/simulate flow as the base.
**Parallelization**: 2 parallel tickets, then 1 join ticket. Track A = S1.1, Track B = S1.2, Join = S1.3.
**Deliverables**: D1

## Tickets

- S1.1-remove-deleted-dynamics-references.md
- S1.2-record-scheduler-dynamics-decision.md
- S1.3-cleanup-verification.md

## Exit Criteria

- [ ] The old deleted `src/core/systems/dynamics` module is not referenced as an implementation target.
- [ ] Current Foundation save/simulate flow is named as the dynamics base.
- [ ] Cleanup verification command is recorded.

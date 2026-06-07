# W5: Scheduler Contract And Final Validation

**Status**: TODO
**Entry**: W4 completed with Foundation runtime using compiled dynamics.
**Exit**: The scheduler/dynamics/imperative split is documented, validated, and ready for follow-on system migrations.
**Parallelization**: 2 independent tickets, then 1 final validation ticket.
**Deliverables**: D5

## Tickets

- S5.1-scheduler-dynamics-contract-docs.md
- S5.2-system-boundary-tests.md
- S5.3-final-validation.md

## Exit Criteria

- [ ] Docs explain when to use compiled dynamics graphs versus imperative `GameSystem`s.
- [ ] Tests cover the boundary enough to prevent future single-graph drift.
- [ ] Focused tests and TypeScript pass.

# W2: Scheduler Compatibility Runtime

**Status**: DONE
**Entry**: W1 parity fixtures exist.
**Exit**: A systems scheduler runs inside the canonical tick loop without
changing legacy behavior.
**Parallelization**: Sequential (1 owner) for scheduler contract and
`GameImpl` integration, then S2.4 validation can proceed independently.
**Deliverables**: D2

## Tickets

- S2.1-system-phase-contracts.md
- S2.2-system-context-services.md
- S2.3-legacy-execution-adapter.md
- S2.4-gameimpl-scheduler-integration.md

## Exit Criteria

- [x] Systems have stable ordered phases.
- [x] Legacy executions can run through the compatibility adapter.
- [x] Existing game tick tests and W1 parity fixtures show no behavior drift.

## Completion Notes

- Added native system contracts, context services, and scheduler.
- Added a legacy execution adapter preserving existing tick behavior.
- Integrated the scheduler into `GameImpl.executeNextTick()` without replacing
  legacy mechanics.
- Verified focused systems, GameImpl, PlayerExecution, Attack, and W1 parity
  suites plus `npx tsc --noEmit`.

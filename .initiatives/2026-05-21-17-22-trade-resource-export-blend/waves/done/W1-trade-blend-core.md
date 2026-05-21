# W1: Trade Blend Core

**Status**: DONE
**Entry**: Initiative and analysis are complete.
**Exit**: Shared blend math exists and train trade payouts use it.
**Parallelization**: Sequential (1 owner). The helper should land before train call-site changes to keep tests precise.
**Deliverables**: D1, D2

## Tickets
- S1.1-resource-export-blend-helper.md
- S1.2-train-export-blend-payouts.md

## Exit Criteria
- [x] Resource helper tests pass.
- [x] Train station tests pass with blended payload expectations.
- [x] No trade ship behavior is changed in this wave.

## Working Notes
- Started execution.
- Completed with `npx vitest run tests/core/game/Resources.test.ts tests/core/game/TrainStation.test.ts`.

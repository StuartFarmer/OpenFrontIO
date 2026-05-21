# W1: Resource Math And Config

**Status**: DONE
**Entry**: Analysis is complete and the current resource stockpile model exists.
**Exit**: Pure resource capacity helpers and config-level capacity/regen formulas exist with focused tests.
**Parallelization**: Sequential (1 owner) because `Resources.ts` and `Config.ts` define shared contracts used by later waves.
**Deliverables**: D1, D2

## Tickets
- S1.1-resource-capacity-helpers.md
- S1.2-config-resource-capacity.md
- S1.3-resource-regen-curve-tests.md

## Exit Criteria
- [x] Resource helper tests pass.
- [x] Config capacity formulas count area and completed Factories.
- [x] Regen curve behavior is tested without relying on UI or player execution.

## Completion Notes
- Completed S1.1, S1.2, and S1.3.
- Added resource capacity math, config resource capacity/regen formulas, and focused curve tests.
- Validation passed: `npx vitest run tests/core/game/Resources.test.ts tests/core/configuration/ResourceCapacity.test.ts`.
- Validation passed: `npx tsc --noEmit`.

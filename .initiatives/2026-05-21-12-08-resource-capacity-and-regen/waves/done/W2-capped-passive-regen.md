# W2: Capped Passive Regen

**Status**: DONE
**Entry**: W1 capacity and regen formulas are available.
**Exit**: Passive resource income uses capped resource regen and does not increase gold.
**Parallelization**: Sequential (1 owner) because `PlayerExecution` is the tick integration point and should be changed with its focused tests.
**Deliverables**: D3

## Tickets
- S2.1-player-execution-resource-regen.md
- S2.2-near-cap-and-over-cap-behavior.md
- S2.3-gold-compatibility-regression.md

## Exit Criteria
- [x] Passive income uses `resourceIncreaseRate(...)`.
- [x] Resource deltas are clamped per resource.
- [x] Gold-compatible construction and legacy reward paths remain stable.

## Completion Notes
- Passive resource income now uses `Config.resourceIncreaseRate(...)` and adds resources without updating compatibility gold.
- Near-cap and over-cap behavior is covered in `tests/core/executions/PlayerExecution.test.ts`.
- Compatibility paths were verified with construction, conquest, donation, trade ship, and train station tests.

# W2: Current Economy Parity

**Status**: DONE
**Entry**: W1 runtime foundation exists.
**Exit**: Current population and resource formulas can be evaluated through
stock-flow systems without behavior drift.
**Parallelization**: 2 parallel tracks after S2.1: Track A = S2.2
PopulationSystem, Track B = S2.3 ResourceProductionSystem, then S2.4 join.
**Deliverables**: D2

## Tickets

- S2.1-player-economy-adapter.md
- S2.2-population-system-parity.md
- S2.3-resource-production-system-parity.md
- S2.4-config-compatibility-wrappers.md

## Exit Criteria

- [x] Current logistics population growth parity tests pass.
- [x] Current resource capacity and regeneration parity tests pass.
- [x] Compatibility wrappers preserve current `Config` API behavior.
- [x] No explicit food consumption is active yet.

## Working Notes

- Added `PopulationSystem`, `ResourceProductionSystem`, `PlayerEconomyModel`,
  and `PlayerEconomyAdapter`.
- Current `Config` economy wrappers now delegate through stock-flow-backed
  helpers.
- Verified with `npx vitest run tests/core/systems
tests/core/configuration/ResourceCapacity.test.ts
tests/core/executions/PlayerExecution.test.ts` and `npx tsc --noEmit`.

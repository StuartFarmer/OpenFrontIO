# W4: Foundation Holdover Retirement

**Status**: DONE
**Entry**: W3 completed with canonical graph-backed Foundation economy binding.
**Exit**: Foundation no longer has normal-path fallback graph simulation or
duplicate formula ownership.
**Parallelization**: 2 parallel tracks: Track A = S4.1 editor fallback cleanup,
Track B = S4.2 formula fixture conversion, then S4.3 joins.
**Deliverables**: D4

## Tickets

- S4.1-remove-editor-fallback-simulation.md
- S4.2-convert-formula-parity-to-fixtures.md
- S4.3-foundation-holdover-validation.md

## Exit Criteria

- [x] Editor runtime simulation goes through the canonical compiler/simulator.
- [x] Invalid graphs show diagnostics and do not run through raw fallback
      evaluators.
- [x] Foundation economy tests no longer rely on duplicate formula ownership.

## Completion Notes

- Completed S4.1 through S4.3.
- Removed editor fallback evaluator code.
- Converted Foundation economy parity checks to fixed graph/runtime fixture
  expectations.
- Added source and test guards for fallback/adapter/formula holdovers.
- Wave validation:
  - `npx eslint src/games/foundation/dynamics/FoundationDynamicsModel.ts src/games/foundation/client/FoundationDynamicsPage.ts src/games/foundation/runtime/FoundationEconomyDynamicsSystem.ts src/games/foundation/runtime/FoundationRuntime.ts src/games/foundation/runtime/FoundationCommandRouter.ts tests/games/foundation/dynamics/FoundationDynamicsModel.test.ts tests/games/foundation/dynamics/FoundationEconomyDynamics.test.ts tests/games/foundation/dynamics/FoundationEconomyDynamicsSystem.test.ts tests/games/foundation/dynamics/fixtures/FoundationEconomyFixtures.ts tests/games/foundation/client/FoundationDynamicsPage.test.ts tests/games/foundation/runtime.test.ts`
  - `npx vitest run tests/games/foundation/dynamics/FoundationDynamicsModel.test.ts tests/games/foundation/client/FoundationDynamicsPage.test.ts tests/games/foundation/dynamics/FoundationEconomyDynamics.test.ts tests/games/foundation/dynamics/FoundationEconomyDynamicsSystem.test.ts tests/games/foundation/runtime.test.ts`

# W3: Runtime Binding Standardization

**Status**: DONE
**Entry**: W2 completed with schema-first saved systems and UI projections.
**Exit**: Foundation economy uses a standard graph-backed runtime binding
instead of a one-off exported adapter concept.
**Parallelization**: Sequential (1 owner) because runtime naming, exports, and
Foundation integration touch the same files.
**Deliverables**: D3

## Tickets

- S3.1-graph-runtime-binding-contract.md
- S3.2-foundation-economy-binding.md
- S3.3-runtime-integration-renaming.md

## Exit Criteria

- [x] Generic graph binding contract exists and is tested.
- [x] Foundation economy uses the binding as the reference graph-backed system.
- [x] Runtime metrics and player updates remain behaviorally compatible.

## Completion Notes

- Completed S3.1 through S3.3.
- Added generic dynamics graph binding support under `src/core/systems/dynamics`.
- Introduced `FoundationEconomyDynamicsSystem` as the Foundation reference
  graph-backed runtime system.
- Runtime and command metrics now import economy-system names; the old adapter
  module is only a compatibility wrapper.
- Wave validation:
  - `npx eslint src/core/systems/dynamics/DynamicsGraphBinding.ts src/games/foundation/runtime/FoundationEconomyDynamicsSystem.ts src/games/foundation/runtime/FoundationRuntime.ts src/games/foundation/runtime/FoundationCommandRouter.ts src/games/foundation/runtime/index.ts tests/core/systems/DynamicsGraphBinding.test.ts tests/core/systems/DynamicsGraphSystemBoundary.test.ts tests/games/foundation/dynamics/FoundationEconomyDynamicsSystem.test.ts tests/games/foundation/runtime.test.ts`
  - `npx vitest run tests/core/systems/DynamicsGraphBinding.test.ts tests/core/systems/DynamicsGraphSystemBoundary.test.ts tests/games/foundation/dynamics/FoundationEconomyDynamicsSystem.test.ts tests/games/foundation/runtime.test.ts tests/core/systems/GameSystem.test.ts`

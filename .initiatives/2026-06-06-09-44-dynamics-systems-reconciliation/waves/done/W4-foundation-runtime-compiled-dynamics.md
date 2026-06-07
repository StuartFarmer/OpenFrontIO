# W4: Foundation Runtime Compiled Dynamics

**Status**: DONE
**Entry**: W3 completed; compiled dynamics graphs can simulate current editor systems.
**Exit**: Foundation food/population ticking is backed by compiled dynamics through a tested runtime adapter.
**Parallelization**: Sequential (1 owner) because runtime replacement must preserve parity before activation.
**Deliverables**: D4

## Tickets

- S4.1-foundation-economy-dynamics-definition.md
- S4.2-foundation-runtime-adapter.md
- S4.3-foundation-runtime-integration.md
- S4.4-remove-redundant-foundation-formulas.md

## Exit Criteria

- [x] Foundation dynamics definition matches current food/troop formula behavior.
- [x] Adapter parity tests pass before runtime integration.
- [x] Runtime metrics come from the compiled dynamics path.
- [x] Redundant old formula wrappers are removed or narrowed to compatibility shims.

## Working Notes

- Added the canonical Foundation economy dynamics graph.
- Added the compiled dynamics runtime adapter and parity coverage.
- Integrated `FoundationRuntime` and `FoundationCommandRouter` metrics through the adapter.
- Narrowed retained domain formula helpers to documented compatibility/reference APIs.
- Verification: `npx vitest run tests/games/foundation/runtime.test.ts tests/games/foundation/dynamics/FoundationDynamicsRuntimeAdapter.test.ts tests/games/foundation/dynamics/FoundationEconomyDynamics.test.ts tests/games/foundation/dynamics/FoundationDynamicsCompiler.test.ts tests/games/foundation/dynamics/FoundationDynamicsSimulator.test.ts tests/games/foundation/dynamics/FoundationDynamicsModel.test.ts tests/games/foundation/client/FoundationDynamicsPage.test.ts` passed, 7 files / 53 tests.

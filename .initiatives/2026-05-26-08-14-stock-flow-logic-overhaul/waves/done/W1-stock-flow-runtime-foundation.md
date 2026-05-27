# W1: Stock-Flow Runtime Foundation

**Status**: DONE
**Entry**: Initiative analysis and architecture docs exist.
**Exit**: Core runtime types and tiny model tests pass.
**Parallelization**: Sequential foundation: S1.1 -> S1.2 -> S1.3 -> S1.4.
**Deliverables**: D1

## Tickets

- S1.1-value-address-and-system-contracts.md
- S1.2-runtime-evaluation-and-validation.md
- S1.3-tiny-system-dynamics-examples.md
- S1.4-runtime-diagnostics.md

## Exit Criteria

- [x] Runtime can evaluate one tick of stock-flow systems with addressable
      values.
- [x] Duplicate ownership, duplicate outputs, missing reads, and bad flow
      targets are validated.
- [x] `npx vitest run tests/core/systems` passes.
- [x] `npx tsc --noEmit` passes.

## Working Notes

- Implemented the core stock-flow foundation under `src/core/systems`.
- Added three focused test files covering contracts, runtime validation, and
  tiny system-dynamics examples.

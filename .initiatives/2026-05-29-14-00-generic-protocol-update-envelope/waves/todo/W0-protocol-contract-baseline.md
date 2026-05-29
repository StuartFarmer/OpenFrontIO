# W0: Protocol Contract Baseline

**Status**: DONE
**Entry**: Initiative docs approved and no implementation in progress for this scope.
**Exit**: Generic envelope contracts exist with tests and no runtime call sites changed.
**Parallelization**: Sequential (1 owner)
**Deliverables**: D1

## Tickets

- S0.1-protocol-types.md - DONE
- S0.2-protocol-schema-tests.md - DONE

## Exit Criteria

- [x] Generic protocol files compile.
- [x] Protocol contracts do not import OpenFront game domain types.
- [x] Baseline tests cover envelope shape and transferables.

## Notes

- W0 baseline implemented under `src/core/protocol` with `moduleId` naming and module-owned `unknown` payload boundaries.
- Focused validation passed: `npx vitest run tests/core/protocol`; `npx tsc --noEmit`.

# W1: Shared Canonical Dynamics Core

**Status**: DONE
**Entry**: Analysis complete; Foundation-specific schema/compiler/simulator are
the current runtime-capable graph path.
**Exit**: Generic dynamics schema/compiler/simulator exist under a neutral
module boundary and Foundation consumes them without behavior changes.
**Parallelization**: Sequential (1 owner) because this wave moves shared types
and touches many imports.
**Deliverables**: D1

## Tickets

- S1.1-promote-dynamics-core-module.md
- S1.2-update-foundation-dynamics-imports.md
- S1.3-core-boundary-tests.md

## Exit Criteria

- [x] Generic dynamics core exports schema, compiler, simulator, and runtime
      state types.
- [x] Foundation graph definitions/runtime compile against generic exports.
- [x] Boundary tests prove non-UI runtime code does not import React Flow.

## Working Notes

- Added generic canonical dynamics core under `src/core/systems/dynamics`.
- Converted Foundation graph/runtime consumers to generic imports.
- Foundation-local schema/compiler/simulator files remain only as compatibility
  re-export shims.
- Verification: W1 focused Vitest slice passed, 7 files / 21 tests.

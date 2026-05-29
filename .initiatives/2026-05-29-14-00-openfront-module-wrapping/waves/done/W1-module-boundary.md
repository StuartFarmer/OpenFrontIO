# W1: Module Boundary

**Status**: DONE
**Entry**:
Initiative docs exist and current OpenFront behavior is understood from `GameRunner`, worker, client runner, transport, schemas, and HUD evidence.
**Exit**:
OpenFront can be addressed through an explicit module registry/default without changing behavior.
**Parallelization**:
Sequential (1 owner). The interface shape should land before server/client wrappers diverge.
**Deliverables**:
D1

## Tickets
- S1.1-define-openfront-module-contract.md
- S1.2-add-openfront-registry-default.md

## Exit Criteria
- [x] The module contract names lifecycle hooks rather than OpenFront features.
- [x] `openfront` is the default module.
- [x] No scattered module switches are introduced.

## Working Notes
- Completed by `src/core/modules/GameModuleRuntime.ts`, `src/games/openfront/OpenFrontModule.ts`, `src/games/registry.ts`, and `tests/games/registry.test.ts`.
- Focused validation: `npx vitest run tests/games/registry.test.ts`.
- Full typecheck should be rerun after parallel Foundation W1 files settle.

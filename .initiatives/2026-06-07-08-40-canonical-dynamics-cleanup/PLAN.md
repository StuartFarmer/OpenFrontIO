# Plan: Canonical Dynamics Cleanup

**Stack**: TypeScript, Vite, Lit, React Flow island, npm, Vitest,
`tsc --noEmit`
**Created**: 2026-06-07

## Summary

- Deliverables: 6
- Waves: 6
- Tickets: 20

## Direction

Make the current dynamics JSON/schema/compiler/runtime path the single canonical
stock-flow dynamics system. Keep React Flow as the `/foundation/dynamics` editor
view, not the saved-system or runtime model. Keep `GameSystemScheduler` as the
outer runtime, where graph-backed systems and imperative systems are ordered
together.

## Execution Order

1. W1: Shared Canonical Dynamics Core
2. W2: Schema-First Editor Persistence
3. W3: Runtime Binding Standardization
4. W4: Foundation Holdover Retirement
5. W5: StockFlow Convergence
6. W6: Final Validation Docs

## Parallelism

- W1 is sequential because moving schema/compiler/simulator touches shared types
  and imports.
- W2 splits after storage API stabilization: editor projection and schema-first
  built-ins can proceed separately, then page save/load joins them.
- W3 is sequential because runtime exports, naming, and Foundation integration
  share write hotspots.
- W4 has two independent cleanup tracks: editor fallback simulation and formula
  parity fixtures, then validation joins.
- W5 splits after the StockFlow audit: public-surface decision and parity
  boundary tests can move independently, then documentation joins.
- W6 is a sequential join wave for docs, boundary validation, and final test
  execution.

## Validation Commands

- `npx vitest run tests/games/foundation/dynamics tests/games/foundation/client/FoundationDynamicsPage.test.ts`
- `npx vitest run tests/games/foundation/runtime.test.ts tests/core/systems/DynamicsGraphSystemBoundary.test.ts`
- `npx vitest run tests/core/systems/StockFlowRuntime.test.ts tests/core/systems/PopulationSystem.test.ts tests/core/systems/ResourceProductionSystem.test.ts tests/core/systems/PlayerEconomyAdapter.test.ts`
- `npx tsc --noEmit`

## Links

- `INITIATIVE.md`
- `REPORT.md`
- `deliverables/DELIVERABLES.md`
- `waves/todo/`
- `tasks/todo/`

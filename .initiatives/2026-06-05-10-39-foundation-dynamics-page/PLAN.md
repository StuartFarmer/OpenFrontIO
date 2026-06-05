# Plan: Foundation Dynamics Page

**Stack**: TypeScript, npm, Vite, Vitest, Lit custom elements, React Flow island for graph editing, existing stock-flow runtime.
**Created**: 2026-06-05

## Summary

- Deliverables: 6
- Waves: 4
- Tickets: 14

## Execution Order

1. W1 - Schema And Engine
2. W2 - Persistence And Routing
3. W3 - React Flow Editor
4. W4 - Polish, Validation, And Docs

## Wave Notes

- W1 keeps all graph schema, compilation, and simulation framework-neutral so React Flow remains a view layer.
- W2 can split persistence from routing because localStorage services and route shell touch different files.
- W3 starts sequentially for dependency and bridge setup, then splits canvas rendering from inspector work before joining at simulation controls.
- W4 can parallelize template polish, docs, and validation cleanup after the vertical slice exists.

## Dependency Shape

- W1 blocks meaningful UI work because the page should edit portable system definitions, not React Flow objects.
- W2 depends on W1 schema for persistence but can route a placeholder page in parallel.
- W3 depends on W1 and W2 because the editor needs schema, route shell, and storage controls.
- W4 depends on W3 for final polish and validation.

## Validation Commands

- `npx vitest run tests/core/systems/dynamics`
- `npx vitest run tests/games/foundation/dynamics tests/games/foundation/client/FoundationDynamicsPage.test.ts tests/client/MainFoundationRoutes.test.ts`
- `npx vitest run tests/games/foundation/runtime.test.ts tests/games/foundation/client/FoundationPage.test.ts`
- `npx tsc --noEmit`
- `git diff --check`

## Links

- `INITIATIVE.md`
- `REPORT.md`
- `deliverables/DELIVERABLES.md`
- `waves/todo/`
- `tasks/todo/`

## Related Code

- Stock-flow runtime: `src/core/systems/StockFlowSystem.ts`, `src/core/systems/StockFlowRuntime.ts`
- Current Foundation food model: `src/games/foundation/domain/FoundationFood.ts`
- Foundation route entrypoint: `src/client/Main.ts`
- Foundation page style/context: `src/games/foundation/client/FoundationPage.ts`
- Existing dynamics sandbox reference: `src/client/sandbox/PopulationFoodSystemsSandbox.ts`

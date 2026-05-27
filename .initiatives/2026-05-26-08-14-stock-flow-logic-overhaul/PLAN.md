# Plan: Stock-Flow Logic Overhaul

**Stack**: TypeScript, npm, Vitest, Vite, Lit, Pixi
**Created**: 2026-05-26

## Summary

- Deliverables: 5
- Waves: 5
- Tickets: 19

## Execution Order

1. W1: Stock-flow runtime foundation
2. W2: Current economy parity
3. W3: Player execution integration
4. W4: Explicit food and war pressure
5. W5: Sandbox, HUD, and docs alignment

## Parallelism

- W1 is sequential because all later work depends on the system contract and
  runtime semantics.
- W2 has parallel population/resource tracks after the adapter is available.
- W3 is sequential because it touches `PlayerExecution`, player updates, and
  regression validation.
- W4 has parallel food and war tracks after config fields land, then joins in
  population pressure integration.
- W5 allows sandbox, HUD/dev diagnostics, and docs to move in parallel, then
  joins with full validation.

## Validation Commands

- `npx tsc --noEmit`
- `npx vitest run tests/core/systems`
- `npx vitest run tests/core/configuration/ResourceCapacity.test.ts tests/core/executions/PlayerExecution.test.ts`
- `npx vitest run tests/client/sandbox/SandboxBalancer.test.ts tests/client/hud/ControlPanel.test.ts`
- `npm run docs:build`

## Links

- `INITIATIVE.md`
- `REPORT.md`
- `deliverables/DELIVERABLES.md`
- `waves/todo/`
- `tasks/todo/`

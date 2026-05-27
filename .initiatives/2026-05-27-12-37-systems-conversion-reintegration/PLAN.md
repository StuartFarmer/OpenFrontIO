# Plan: Systems Conversion And 1:1 Reintegration

**Stack**: TypeScript, npm, Vitest, Vite, Lit, Pixi, Node, GitHub Actions
**Created**: 2026-05-27

## Summary

- Deliverables: 6
- Waves: 6
- Tickets: 27

## Execution Order

1. W1: Parity foundation
2. W2: Scheduler compatibility runtime
3. W3: Economy and player upkeep systems
4. W4: Attack, territory, and conquest systems
5. W5: Unit, projectile, and infrastructure systems
6. W6: AI, client updates, and legacy retirement

## Parallelism

- W1 has two tracks: parity harness work and scenario inventory/fixtures.
- W2 is mostly sequential because the scheduler contract, context, adapter, and
  `GameImpl` integration share the same tick-loop hotspot.
- W3 splits economy and non-economy player upkeep after the boundary map.
- W4 is sequential through attack command/state setup, then splits battle
  resolution from territory/conquest application before a parity join.
- W5 splits by behavior family after inventory: structures, mobile units, and
  projectiles can proceed in parallel if they avoid shared scheduler changes.
- W6 splits intent/AI migration from worker-client update parity, then joins for
  legacy retirement and full validation.

## Validation Commands

- `npx tsc --noEmit`
- `npx vitest run tests/core/systems`
- `npx vitest run tests/core/game/GameImpl.test.ts tests/core/executions/PlayerExecution.test.ts`
- `npx vitest run tests/Attack.test.ts tests/Disconnected.test.ts tests/AttackStats.test.ts`
- `npx vitest run tests/Warship.test.ts tests/MissileSilo.test.ts tests/nukes tests/core/executions`
- `npm run test`
- `npm run build-prod`

## Links

- `INITIATIVE.md`
- `REPORT.md`
- `deliverables/DELIVERABLES.md`
- `waves/todo/`
- `tasks/todo/`

# Plan: Dynamics Systems Reconciliation

**Stack**: TypeScript, Vite, Lit, React Flow island, npm, Vitest, `tsc --noEmit`
**Created**: 2026-06-06

## Summary

- Deliverables: 5
- Waves: 5
- Tickets: 16

## Direction

Use the current Foundation dynamics save/simulate flow as the base. Do not restore the deleted historical compiler module. The target architecture is:

```text
GameSystemScheduler
  -> runs ordered game systems
      -> some systems run compiled dynamics graphs
      -> some systems run imperative gameplay code
```

## Execution Order

1. W1: Stale Cleanup And Direction
2. W2: Canonical Current Dynamics Definition
3. W3: Compiled Dynamics Runtime
4. W4: Foundation Runtime Compiled Dynamics
5. W5: Scheduler Contract And Final Validation

## Parallelism

- W1 has two independent cleanup/decision tracks, then verification.
- W2 is sequential because schema, storage, and UI mapping share the same state boundary.
- W3 splits compiler and simulator work after W2, then joins in editor diagnostics.
- W4 is sequential because parity must be proven before replacing runtime formulas.
- W5 can split docs and boundary tests, then join in final validation.

## Validation Commands

- `npx vitest run tests/games/foundation/dynamics tests/games/foundation/client/FoundationDynamicsPage.test.ts`
- `npx vitest run tests/games/foundation/runtime.test.ts tests/core/systems/GameSystem.test.ts`
- `npx tsc --noEmit`

## Links

- `INITIATIVE.md`
- `REPORT.md`
- `deliverables/DELIVERABLES.md`
- `waves/done/`
- `tasks/done/`

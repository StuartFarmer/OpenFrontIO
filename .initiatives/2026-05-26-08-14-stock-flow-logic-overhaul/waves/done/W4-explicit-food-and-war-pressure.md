# W4: Explicit Food And War Pressure

**Status**: DONE
**Entry**: Runtime-backed player economy tick is stable.
**Exit**: Food stock, shortage, and wartime consumption are model outputs and
can affect population flows through mechanics parameters.
**Parallelization**: S4.1 first, then 2 parallel tracks: Track A = S4.2
FoodSystem, Track B = S4.3 WarSystem, then S4.4 join.
**Deliverables**: D4

## Tickets

- S4.1-food-and-war-mechanics-config.md
- S4.2-explicit-food-system.md
- S4.3-war-pressure-system.md
- S4.4-population-food-pressure-integration.md

## Exit Criteria

- [x] Food production, consumption, storage, and shortage are explicit system
      outputs.
- [x] War pressure increases food need without direct cross-system mutation.
- [x] Population growth/death flows can read food shortage.
- [x] Sandbox mechanics JSON can tune new food/war parameters.

## Working Notes

- Added neutral-default explicit food/war mechanics config.
- Added `FoodSystem` and `WarSystem`.
- Integrated food shortage into population growth and food consumption into
  player economy resource deltas.
- Verified with `npx vitest run tests/core/systems
tests/core/configuration/ResourceCapacity.test.ts
tests/core/executions/PlayerExecution.test.ts
tests/client/sandbox/SandboxBalancer.test.ts` and `npx tsc --noEmit`.

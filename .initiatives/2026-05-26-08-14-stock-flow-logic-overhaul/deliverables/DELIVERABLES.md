# Deliverables

## D1: Core Stock-Flow Runtime

**Outcome**: A small deterministic runtime under `src/core/systems` with
addressable values, declared reads, system classes, flow contributions, stock
ownership validation, one-tick evaluation, and diagnostics.
**Demo**:
`npx vitest run tests/core/systems`
**Acceptance Checks**:

- [x] Tiny `Money = INTEG(interest, 100)` and `Workers = INTEG(-attrition, 100)`
      models pass one-tick tests.
- [x] Runtime rejects missing reads, duplicate stock ownership, duplicate output
      addresses, and non-stock flow targets.
- [x] Runtime applies summed stock deltas exactly once per tick.

**Dependencies**: None.
**Notes**: No external system dynamics parser or solver.

## D2: Current Economy Parity Models

**Outcome**: Current population capacity, logistic population growth, resource
capacity, resource regeneration, terrain production split, and bot/nation
multipliers are expressed through stock-flow systems while preserving current
behavior.
**Demo**:
`npx vitest run tests/core/configuration/ResourceCapacity.test.ts tests/core/executions/PlayerExecution.test.ts`
**Acceptance Checks**:

- [x] `Config.maxTroops(...)`, `Config.troopIncreaseRate(...)`,
      `Config.maxResources(...)`, and `Config.resourceIncreaseRate(...)` remain
      valid compatibility wrappers.
- [x] Existing resource and population parity tests pass without balance drift.
- [x] Bigint resource stockpiles remain supported through an adapter.

**Dependencies**: D1.
**Notes**: This deliverable should not activate new food consumption behavior.

## D3: Runtime-Backed Player Economy Tick

**Outcome**: `PlayerExecution.tick()` delegates economy work to the stock-flow
player economy adapter and applies one result, while death cleanup, structure
capture, alliances, embargoes, and cluster cleanup remain in place.
**Demo**:
`npx vitest run tests/core/executions/PlayerExecution.test.ts tests/core/configuration/ResourceCapacity.test.ts`
**Acceptance Checks**:

- [x] Player economy tick produces the same troop/resource results as current
      behavior before food is enabled.
- [x] Player updates continue to diff correctly.
- [x] Existing bot/combat callers of `maxTroops` and troop rate APIs continue to
      compile and run.

**Dependencies**: D1, D2.
**Notes**: Keep compatibility method names during migration.

## D4: Explicit Food And Wartime Consumption Model

**Outcome**: Food becomes an explicit stock-flow mechanic with production,
consumption, leftover storage, shortage ratio, population growth pressure, and
wartime consumption signals.
**Demo**:
`npx vitest run tests/core/systems tests/core/executions/PlayerExecution.test.ts tests/client/sandbox/SandboxBalancer.test.ts`
**Acceptance Checks**:

- [x] Food production, need, consumed amount, stored food, and shortage ratio
      are named model outputs.
- [x] `WarSystem` publishes addressable war pressure such as
      `war.mobilizedPopulation` without mutating food directly.
- [x] `FoodSystem` reads war outputs and increases food need according to
      mechanics parameters.
- [x] `PopulationSystem` can read food shortage and alter birth/death flows.

**Dependencies**: D1, D2, D3.
**Notes**: Activate through additive mechanics config fields and tests.

## D5: Sandbox, HUD, And Documentation Alignment

**Outcome**: Sandbox graphs and diagnostics use stock-flow outputs instead of
duplicated formulas; HUD/dev surfaces can inspect relevant diagnostics; docs
reflect the implemented model.
**Demo**:
`npx vitest run tests/client/sandbox/SandboxBalancer.test.ts tests/client/hud/ControlPanel.test.ts && npm run docs:build`
**Acceptance Checks**:

- [x] Sandbox graphs for population, food, shortage, births, deaths, and wartime
      food pressure are driven from model outputs.
- [x] Current HUD remains stable, with any new diagnostics scoped to sandbox/dev
      surfaces unless intentionally player-facing.
- [x] `docs/Economy.md`, `docs/StockFlowArchitectureAnalysis.md`, and
      `docs/PopulationFoodSystemsReport.md` agree on the implemented model.

**Dependencies**: D1, D2, D3, D4.
**Notes**: Documentation changes should track landed behavior.

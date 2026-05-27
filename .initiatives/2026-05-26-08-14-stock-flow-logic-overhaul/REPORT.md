# Analysis Report: Stock-Flow Logic Overhaul

## Executive Summary

- Highest impact: recurring economy logic is centralized in the game tick but
  formulas are scattered across `Config`, so new stock-flow mechanics would
  currently become another layer of bespoke methods.
- Second highest impact: the desired architecture is already well-defined in
  docs, but the current implementation surface still uses legacy troop/biomass
  names and duplicated sandbox formulas.
- Third highest impact: the existing resource system is a strong bridge because
  it already has stockpile, delta, capacity, and regeneration helpers, but it
  needs an adapter boundary because resources are bigint while stock-flow
  formula work will mostly be numeric.

## Findings

### 1. Economy Tick Is Centralized, But Not Expressed As Systems

- Evidence:
  - `src/core/execution/PlayerExecution.ts` directly calls
    `config.troopIncreaseRate(...)`, mutates troops, calls
    `config.resourceIncreaseRate(...)`, and mutates resources inside
    `PlayerExecution.tick()`.
  - `src/core/configuration/Config.ts` owns `startManpower(...)`,
    `maxTroops(...)`, `maxResources(...)`,
    `biomassSupportedTroopCapacity(...)`, `effectiveTroopCapacity(...)`,
    `troopIncreaseRate(...)`, and `resourceIncreaseRate(...)`.
  - `docs/StockFlowArchitectureAnalysis.md` identifies the same current loop
    and recommends addressable outputs, declared reads, and runtime-owned stock
    mutation.
- Impact:
  - Food consumption during war, starvation, resource pressure, and future
    systems would require threading new modifiers manually through `Config`,
    `PlayerExecution`, updates, HUD, sandbox graphs, and tests.
- Recommendation:
  - Introduce a small deterministic stock-flow runtime under `src/core/systems`
    and migrate player economy behavior through an adapter before changing
    balance.
- Risk:
  - A direct replacement of `PlayerExecution` economy behavior could alter core
    balance. Parity tests must come before new mechanics.

### 2. Resources Are Already Stock-Like, But Population And Resources Are Not Unified

- Evidence:
  - `src/core/game/Resources.ts` defines `ResourceKinds`,
    `ResourceStockpile`, `ResourceDelta`, capacity clamping, and regeneration
    helpers.
  - `src/core/game/PlayerImpl.ts` stores `_resources`, `_gold`, and `_troops`
    separately.
  - `Config.resourceIncreaseRate(...)` uses resource helpers while
    `Config.troopIncreaseRate(...)` uses a separate logistic growth formula.
- Impact:
  - The code has useful primitives but no shared model concept for stock
    identity, ownership, dependency reads, flow contributions, diagnostics, and
    tick ordering.
- Recommendation:
  - Keep `ResourceStockpile` as a compatibility adapter initially, while the new
    runtime supports numeric stock evaluation and named flow results.
- Risk:
  - Bigint/number conversion can create subtle precision or rounding issues if
    resources are migrated too aggressively.

### 3. Current Diagnostics Are Useful, But Tied To Legacy Names And Duplicated Formulas

- Evidence:
  - `src/core/game/PlayerImpl.ts` emits `resourceCapacity`,
    `effectiveTroopCapacity`, `biomassSupportedTroopCapacity`, and
    `troopIncreaseRate` from `toFullUpdate()`.
  - `src/client/sandbox/SandboxBalancer.ts` separately computes growth curves,
    max population, resource capacity, and resource regeneration for the
    mechanics balancer.
  - `src/client/hud/layers/ControlPanel.ts` consumes current troop/resource
    values and rates for display.
- Impact:
  - Sandbox graphs can drift from gameplay formulas, and future UI diagnostics
    will need another manual translation layer unless model outputs become the
    common source.
- Recommendation:
  - Have systems publish named diagnostics such as `food.needed`,
    `food.shortageRatio`, `population.capacity`, `population.births`, and
    `population.deaths`; then feed sandbox and player updates from those
    outputs.
- Risk:
  - Adding too many diagnostics to `PlayerUpdate` could increase payload size.
    Start with fields needed by sandbox/HUD and rely on diffing.

### 4. Compatibility Surface Around Max Troops Is Broad

- Evidence:
  - `rg` shows `maxTroops(...)` call sites in bot AI
    (`src/core/execution/utils/AiAttackBehavior.ts`), nation behavior
    (`src/core/execution/nation/NationAllianceBehavior.ts`), donations,
    nukes, leaderboard, team stats, player info overlays, and tests.
  - `tests/core/configuration/ResourceCapacity.test.ts` asserts current
    `maxTroops`, biomass support, logistic growth, resource capacity, and
    player update behavior.
- Impact:
  - A big-bang rename from troops to population would ripple through combat,
    bots, HUD, and tests before the model itself is proven.
- Recommendation:
  - Preserve `Config.maxTroops(...)`, `Config.troopIncreaseRate(...)`, and
    existing player update fields as compatibility wrappers while the stock-flow
    runtime becomes the implementation underneath.
- Risk:
  - Keeping old names too long can obscure the new model. The compatibility
    layer should be explicit and documented.

### 5. Mechanics Configuration Is Centralized Enough To Evolve, But Needs A Model-Oriented Shape

- Evidence:
  - `src/core/configuration/MechanicsConfig.ts` centralizes current population
    and resource parameters and resolves legacy aliases.
  - Sandbox imports/exports mechanics JSON through
    `src/client/sandbox/SandboxBalancer.ts`.
  - `tests/client/sandbox/SandboxBalancer.test.ts` validates sandbox mechanics
    JSON behavior.
- Impact:
  - This is a good tuning surface, but current `populationResources` mixes
    population, resource capacity, terrain production, bot multipliers, and
    nation multipliers without explicit system ownership.
- Recommendation:
  - Add new parameters incrementally for food production, food consumption,
    famine modifiers, and wartime consumption while keeping existing JSON
    compatibility.
- Risk:
  - Renaming or restructuring config too early can break saved sandbox settings.
    Use additive schema evolution first.

### 6. Documentation Now Points In Two Directions

- Evidence:
  - `docs/StockFlowArchitectureAnalysis.md` says biomass constraints are not the
    immediate framework primitive and recommends stock-flow systems.
  - `docs/PopulationFoodSystemsReport.md` recommends explicit food as a stock
    with produce/feed/leftover/birth/death tick ordering.
  - `docs/Economy.md` still describes biomass carrying capacity as the current
    constraint and says
    `K = min(spatialTroopCapacity, biomassSupportedTroopCapacity)`, while
    `Config.effectiveTroopCapacity(...)` currently returns `maxTroops(player)`.
- Impact:
  - Future implementation work could follow stale docs and reintroduce the
    wrong abstraction.
- Recommendation:
  - Update docs as part of the implementation waves so the stock-flow runtime,
    not legacy biomass carrying capacity, is documented as the source of truth.
- Risk:
  - If docs are updated before behavior lands, they may overstate runtime
    capabilities. Tie doc updates to completed migration stages.

## Quick Wins

- Create `src/core/systems` with typed `ValueAddress`,
  `StockFlowSystem`, model compiler/runtime, and tiny example tests.
- Add parity tests that prove the tiny runtime evaluates `Money = INTEG(...)`
  and `Workers = INTEG(...)` one tick at a time.
- Add an adapter that can read current player state and expose addressable
  values without mutating gameplay yet.
- Mark `docs/Economy.md` as pending migration or update stale biomass language
  once runtime-backed population behavior is active.

## Medium Changes

- Express current population capacity and logistic growth through a
  `PopulationSystem`.
- Express current resource capacity and passive regeneration through resource
  system outputs while preserving `Config` wrappers.
- Replace the economy mutation lines in `PlayerExecution.tick()` with a
  player-economy stock-flow result application.
- Drive sandbox growth/resource graphs from system outputs rather than
  duplicated formulas.

## High-Risk Decisions

- Whether resources should become first-class numeric stocks immediately or
  remain bigint-backed through `ResourceStockpile` adapters.
- When to activate explicit food consumption as gameplay rather than diagnostics
  only.
- Whether food consumption should be based on total population, mobilized
  population, active outgoing attacks, defensive commitment, or a simpler
  at-war multiplier.
- When to rename external troop-facing fields to population-facing fields.

## Guardrails

- Keep one game tick as one model step.
- Keep evaluation synchronous and deterministic.
- Preserve current game balance until parity tests pass.
- Introduce explicit food consumption behind additive mechanics parameters.
- Keep old `Config` method names as compatibility wrappers during migration.
- Do not let systems mutate each other directly; only the runtime applies stock
  deltas.
- Keep sandbox as the first tuning and diagnostics surface for new mechanics.

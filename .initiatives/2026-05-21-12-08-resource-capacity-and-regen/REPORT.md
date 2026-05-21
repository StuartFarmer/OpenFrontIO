# Analysis Report: Resource Capacity And Regen

## Executive Summary
- Highest impact: model resource capacity and regen in `Config` beside `maxTroops(...)` / `troopIncreaseRate(...)`, not inside `PlayerImpl`, so the formula is shared by core, UI, tests, bots, and later balance tuning.
- Biggest correctness risk: passive resource regen must cap each stockpile without accidentally affecting trade, conquest, train rewards, donation transfers, or gold-compatible spending paths.
- Cleanest first implementation: add resource-specific config helpers returning `ResourceStockpile`, then have `PlayerExecution` compute capped passive deltas and call `addResources(..., { updateGold: false })`.
- UI and client state already carry resources, but capacity is not exposed yet; showing capacity is optional for mechanics but useful for playtesting.
- Tests should focus on capacity math, regen curve shape, cap enforcement, Factory-level contribution, and “gold stays unchanged during passive resource income.”

## Findings

### 1. Troop capacity and regen already provide the right architectural template
- Evidence:
  - `src/core/configuration/Config.ts` defines `maxTroops(player)` as a function of `player.numTilesOwned()` plus completed City levels.
  - `src/core/configuration/Config.ts` defines `troopIncreaseRate(player)` using current troops, max troops, and a `(1 - current / max)` slowdown.
  - The exponent in `Math.pow(player.troops(), 0.73)` creates an accelerating curve whose dominant term peaks around `0.73 / 1.73 = 42.2%` of capacity before the cap slowdown dominates.
- Impact:
  - Reusing the same shape gives the exact behavior the mechanic asks for and avoids inventing a second economy curve.
- Recommendation:
  - Add resource analogs in `Config`, for example `maxResources(player): ResourceStockpile` and `resourceIncreaseRate(player): ResourceStockpile`, with a shared curve helper that accepts current amount and max capacity.
  - Keep formulas configurable in one place: area baseline, Factory storage contribution, and player-type/difficulty multipliers.
- Risk:
  - Directly copying `troopIncreaseRate(...)` with `bigint` stockpiles will require careful `number` conversion and flooring back to `bigint`.

### 2. Resource passive income currently flows through `PlayerExecution`, which is the correct integration point
- Evidence:
  - `src/core/execution/PlayerExecution.ts` already runs troop regen each player tick.
  - The current resource income path uses `resourcesFromGoldAmount(goldFromWorkers)` and `player.addResources(..., { updateGold: false })`.
  - Stats still record passive income through `mg.stats().goldWork(...)`.
- Impact:
  - The passive resource model can be introduced without touching construction execution, trade execution, conquest, train rewards, or donations.
- Recommendation:
  - Replace the current `goldAdditionRate(...)` based resource delta in `PlayerExecution` with `config.resourceIncreaseRate(player)`.
  - Clamp the applied delta per resource to available storage before calling `addResources(...)`.
  - Leave `goldWork` stats as a compatibility metric only if product wants old stats to continue; otherwise rename or parallelize stats in a later stats-focused slice.
- Risk:
  - If `resourceIncreaseRate(...)` internally mutates or clamps against stale values, partial overfill bugs can appear when stockpiles are near capacity.

### 3. Factories are already first-class structures and can be counted like Cities
- Evidence:
  - `UnitType.Factory` is defined in `src/core/game/Game.ts`.
  - Factories have construction/execution support in `src/core/execution/ConstructionExecution.ts` and `src/core/execution/FactoryExecution.ts`.
  - `Config.maxTroops(...)` counts `player.units(UnitType.City).filter((u) => !u.isUnderConstruction()).map((city) => city.level())`.
  - Factory-dependent systems already exist in train spawn, ports, cities, rails, and nation structure behavior.
- Impact:
  - A storage-capacity formula can use completed Factory levels with an established pattern.
- Recommendation:
  - Count completed Factory levels for storage capacity.
  - Keep Factory storage independent from Factory production initially; storage is capacity, not income, unless terrain/resource production is later added.
- Risk:
  - Factories already have gameplay uses. Increasing their economic importance may change balance even if costs stay unchanged.

### 4. Capacity should be per-resource even if the first formula is identical
- Evidence:
  - `src/core/game/Resources.ts` defines `ResourceStockpile` with `food`, `energy`, and `materials`.
  - `PlayerImpl.resources()` returns the current stockpile.
  - `ControlPanel` renders each resource independently.
- Impact:
  - Treating capacity as a scalar now would force another migration when terrain-specific production or differentiated storage arrives.
- Recommendation:
  - Introduce `ResourceCapacity` as the same shape as `ResourceStockpile` or reuse `ResourceStockpile` for max values.
  - Use per-resource helpers like `clampResourceDelta(current, delta, capacity)` and `resourceCapacityRatio(current, capacity)`.
- Risk:
  - Current compatibility code rejects non-uniform resource mutations when gold mirroring is active. Passive regen already uses `{ updateGold: false }`, so non-uniform deltas can be allowed there only if `addResources(...)` no longer requires uniform payloads for resource-only calls.

### 5. Player state and UI can show resources but cannot yet show capacity
- Evidence:
  - `PlayerUpdate.resources` exists in `src/core/game/GameUpdates.ts`.
  - `PlayerView.resources()` exists in `src/client/view/PlayerView.ts`.
  - `ControlPanel` reads `player.resources()` and renders Food, Energy, and Materials.
  - Renderer `PlayerState` includes numeric `resources`.
- Impact:
  - Mechanics can work server-side without client capacity state, but playtesting a capped resource system is much harder if the UI only shows current values.
- Recommendation:
  - Decide whether to expose `resourceCapacity` in player updates now.
  - If capacity is visible, add `PlayerUpdate.resourceCapacity`, renderer state, `PlayerView.resourceCapacity()`, and a compact `current / max` display.
  - If capacity is not visible, tests must carry the burden of validating cap behavior.
- Risk:
  - Adding capacity to every player update increases update diff surface. It should use the same structural diff pattern as `resources`.

### 6. Existing tests are close but need new cap and curve coverage
- Evidence:
  - `tests/core/executions/PlayerExecution.test.ts` asserts passive income now changes resources without changing gold.
  - `tests/PlayerImpl.test.ts` covers resource add/remove/can-afford behavior and compatibility gold behavior.
  - `tests/core/game/Resources.test.ts` covers basic stockpile helpers.
  - `tests/GameUpdateUtils.test.ts`, `tests/client/view/PlayerView.test.ts`, and `tests/client/hud/ControlPanel.test.ts` cover update/view/UI propagation.
- Impact:
  - Current tests prove propagation, not capped economic behavior.
- Recommendation:
  - Add tests for:
    - Resource capacity from area only.
    - Factory level contribution to capacity.
    - Under-construction Factory exclusion.
    - Resource regen below cap.
    - Resource regen clamped at cap.
    - Regen shape increasing up to roughly 42% and slowing after.
    - Passive regen does not change gold.
    - Client capacity propagation only if exposed to UI.
- Risk:
  - Floating-point curve assertions can be brittle. Prefer relational assertions and a few explicit rounded values.

### 7. Gold compatibility is the main design constraint for this slice
- Evidence:
  - `PlayerImpl.addGold(...)` still updates gold and mirrors resources.
  - `PlayerImpl.addResources(...)` can still update compatibility gold by default.
  - `removeResources(...)` still derives a compatibility gold amount and decrements `_gold`.
  - Construction tests still verify gold spending in `tests/economy/ConstructionGold.test.ts`.
  - Gold event/stat surfaces still exist in `BonusEvent.gold`, `ConquestEvent.gold`, display messages, stats, leaderboard, and replay fields.
- Impact:
  - Resource caps cannot be treated as a complete economy replacement yet because spending still has gold dependencies.
- Recommendation:
  - Limit this slice to passive resource storage and regen.
  - Do not cap or reinterpret legacy gold reward events until resource spending and resource-specific rewards are planned.
  - Keep `addResources(..., { updateGold: false })` explicit for passive regen.
- Risk:
  - Players may see capped resources while still seeing gold-compatible UI/stats elsewhere. The UI should make the current resource display clear enough for testing.

## Quick Wins
- Add resource curve helpers in `Resources.ts` or `Config.ts` that are pure and easy to unit test.
- Add `Config.maxResources(player)` using the same completed-structure pattern as `maxTroops(...)`, but with `UnitType.Factory`.
- Replace passive `goldAdditionRate(...)` resource gain in `PlayerExecution` with capped `resourceIncreaseRate(...)`.
- Add focused tests around passive resource cap behavior before touching UI capacity display.

## Medium Changes
- Expose resource capacity through `PlayerUpdate`, `PlayerState`, and `PlayerView` if playtesting needs visible caps.
- Update `ControlPanel` to render compact `current / max` values or a saturation indicator for each resource.
- Separate compatibility gold stats from real resource production stats, or add parallel resource stats while keeping old stats untouched.
- Loosen `addResources(...)` uniform-payload restrictions for `{ updateGold: false }` so future non-uniform resource income can be introduced safely.

## High-Risk Decisions
- Whether passive income should be the only capped acquisition path, or whether trade/conquest/train/donation should respect capacity too.
- Whether Factory storage capacity should use Factory count, level sum, tile proximity, or connected rail/logistics concepts.
- Whether all three resources share one capacity formula or each resource gets a distinct storage multiplier.
- Whether resources should decay, overflow, or simply stop accumulating at cap.
- Whether UI must expose capacity before the mechanic ships to playtesters.

## Guardrails
- Keep terrain-based resource production out of this slice.
- Keep resource-specific costs out of this slice.
- Keep gold event/stat/replay fields stable unless a separate compatibility migration is planned.
- Use completed Factory levels only; under-construction Factories should not increase storage.
- Clamp deltas per resource, not after summing resources.
- Preserve deterministic tick behavior; no random or wall-clock-dependent resource regen.
- Validate with targeted Vitest runs and `npx tsc --noEmit`; record full `npm test` separately because of existing localStorage test-environment failures.

## Primary Touchpoints
- `src/core/configuration/Config.ts`: add resource capacity and regen formulas beside troop formulas.
- `src/core/execution/PlayerExecution.ts`: replace passive resource delta calculation and enforce cap before mutation.
- `src/core/game/Resources.ts`: add pure helpers for stockpile capacity math and clamping.
- `src/core/game/Game.ts`: expose any new player/config contracts needed by implementations and tests.
- `src/core/game/PlayerImpl.ts`: keep resource mutation simple; only add storage/cap helpers here if config-based implementation cannot cover a use case.
- `src/core/game/GameUpdates.ts`, `src/core/game/GameUpdateUtils.ts`, `src/client/view/PlayerView.ts`, `src/client/render/types/Renderer.ts`: only needed if resource capacity crosses the client boundary.
- `src/client/hud/layers/ControlPanel.ts`: only needed if current/max display or capacity indicators are shown.
- `tests/core/executions/PlayerExecution.test.ts`, `tests/PlayerImpl.test.ts`, `tests/core/game/Resources.test.ts`, `tests/GameUpdateUtils.test.ts`, `tests/client/view/PlayerView.test.ts`, `tests/client/hud/ControlPanel.test.ts`: focused coverage for mechanic, model, update, view, and UI behavior.

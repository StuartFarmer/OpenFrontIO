# StockFlow Usage Audit

## Summary

`StockFlow*` is still active code, but it is not used by the new Foundation
dynamics/editor/runtime path. Its current production ownership is the older
OpenFront population/resource economy stack plus sandbox/debug tooling.

The canonical dynamics surface after W1-W4 is:

- `src/core/systems/dynamics/*` for schema/compiler/simulator/binding.
- `src/games/foundation/dynamics/*` for Foundation canonical graph definitions.
- `src/games/foundation/runtime/FoundationEconomyDynamicsSystem.ts` for the
  reference graph-backed runtime system.

`StockFlow*` should not remain an ambiguous peer public authoring/runtime model.
The low-risk path is quarantine first, then migrate OpenFront economy models only
behind parity tests.

## Repeatable Search

Primary audit command:

```sh
rg -n "StockFlow|stock flow|stock-flow|stockflow" src tests -g '*.ts' -g '*.tsx'
```

File inventory command:

```sh
rg --files src/core/systems tests/core/systems src/client/sandbox tests/client | rg "StockFlow|PopulationSystem|ResourceProductionSystem|PlayerEconomyAdapter|SystemsSandbox"
```

## Core StockFlow Modules

- `src/core/systems/StockFlowSystem.ts`
  Defines `StockFlowModel`, `StockFlowSystem`, scalar/input/stock/param types,
  phases, parameters, outputs, and flows.
- `src/core/systems/StockFlowCompiler.ts`
  Compiles/validates StockFlow models, system ordering, duplicate producers,
  stock/flow references, and value addresses.
- `src/core/systems/StockFlowRuntime.ts`
  Runs compiled or raw StockFlow models, applies input/stock overrides, evaluates
  expressions, and returns outputs/flows/stocks/diagnostics.
- `src/core/systems/StockFlowDiagnostics.ts`
  Diagnostics shape used by runtime and game update transport.
- `src/core/systems/ValueAddress.ts`
  Generic value-address validation/error naming still references stock-flow.

## Production Consumers

- `src/core/systems/models/PopulationSystem.ts`
  Builds a StockFlow model for troop/population capacity, logistic growth,
  births/deaths, nutrition health, and food satisfaction. `evaluatePopulationSystem`
  calls `runStockFlowStep`.
- `src/core/systems/models/ResourceProductionSystem.ts`
  Builds a StockFlow model for resource capacity, passive regen, terrain-weighted
  production, stock caps, and resource deltas. `evaluateResourceProductionSystem`
  calls `runStockFlowStep`.
- `src/core/systems/models/FoodSystem.ts`
  Builds/evaluates StockFlow food allocation and consumption mechanics.
- `src/core/systems/models/AgricultureSystem.ts`
  Builds/evaluates StockFlow agriculture production mechanics.
- `src/core/systems/models/WarSystem.ts`
  Builds/evaluates StockFlow war/mobilization mechanics.
- `src/core/systems/models/PlayerEconomyModel.ts`
  Composes population/resources/war economy model results.
- `src/core/systems/PlayerEconomyAdapter.ts`
  Main production adapter from `Game`/`Player` state into population/resource
  model inputs and back to OpenFront economy results.

## OpenFront Behavior Dependencies

These are the riskiest dependencies and need parity protection before migration:

- Population capacity/growth:
  - `evaluatePlayerPopulationCapacity`
  - `evaluatePlayerPopulationGrowth`
  - `evaluatePopulationSystem`
  - Config wrappers such as `game.config().maxTroops(...)`,
    `game.config().troopIncreaseRate(...)`, and `playerEconomyTick(...)`.
- Resource capacity/production:
  - `evaluatePlayerResourceCapacity`
  - `evaluatePlayerResourceProduction`
  - `evaluateResourceProductionSystem`
  - Config wrappers such as `game.config().maxResources(...)` and
    `game.config().resourceIncreaseRate(...)`.
- Player economy composition:
  - `evaluatePlayerEconomy`
  - `mechanicsForPlayerFoodAllocation`
  - `terrainResourceProductionSplit`

Focused tests already protecting this behavior:

- `tests/core/systems/PlayerEconomyAdapter.test.ts`
- `tests/core/systems/PopulationSystem.test.ts`
- `tests/core/systems/ResourceProductionSystem.test.ts`
- `tests/core/systems/PlayerEconomyRegression.test.ts`

## Test-Only StockFlow Coverage

- `tests/core/systems/StockFlowSystem.test.ts`
- `tests/core/systems/StockFlowRuntime.test.ts`
- `tests/core/systems/StockFlowExamples.test.ts`

These test the old engine itself. If StockFlow is quarantined, keep these as
compatibility tests under the quarantine boundary. If StockFlow is migrated,
replace them with canonical dynamics equivalents only after the OpenFront economy
parity tests cover the migrated behavior.

## Sandbox And Debug Consumers

- `src/client/sandbox/FoodSystemsSandbox.ts`
- `src/client/sandbox/PopulationFoodSystemsSandbox.ts`
- `src/client/sandbox/WarBattleSystemsSandbox.ts`
- Sandbox tests under `tests/client/sandbox/*SystemsSandbox.test.ts`
- `src/core/game/GameUpdates.ts`
- `src/client/render/types/Renderer.ts`
- `tests/GameUpdateUtils.test.ts`

These surfaces use stock-flow diagnostics/visualization language. They are not
part of Foundation dynamics, but they are user-visible tooling and should either
be renamed to compatibility/legacy language or explicitly documented as StockFlow
sandbox tooling.

## Options

### Option A: Quarantine First

Move or document StockFlow as an internal OpenFront economy compatibility engine.
Keep existing behavior stable and add import-boundary tests preventing new
Foundation/canonical dynamics code from importing `StockFlow*`.

Pros:

- Lowest behavior risk.
- Makes canonical dynamics the only public new system authoring/runtime surface.
- Keeps OpenFront economy behavior protected by existing tests.

Cons:

- Leaves two engines in repo temporarily.
- Requires clear docs/import boundaries to avoid ambiguity.

### Option B: Migrate OpenFront Economy To Canonical Dynamics

Translate Population/Resource/Food/Agriculture/War StockFlow models into
canonical dynamics graphs and bind them through `DynamicsGraphBinding`.

Pros:

- Eventually one engine everywhere.
- Reuses editor/simulation/schema tooling.

Cons:

- Higher risk: OpenFront economy formulas have broad gameplay impact.
- Canonical dynamics currently lacks some StockFlow conveniences, especially
  value-address namespacing, multi-system composition, diagnostics transport,
  and typed stock/resource output helpers.

### Option C: Leave As Peer Public Surface

Do nothing beyond documentation.

This is not recommended. It preserves the ambiguity this initiative is removing:
new systems authors would see both canonical dynamics and StockFlow as plausible
front doors.

## Recommendation

Use Option A for this initiative:

- Treat `src/core/systems/dynamics` as the public canonical dynamics surface.
- Treat `StockFlow*` as internal OpenFront economy compatibility code.
- Add boundary tests in S5.2/S5.3 to prevent Foundation/canonical dynamics from
  depending on StockFlow.
- Keep OpenFront population/resource parity tests as the migration safety net.

Defer Option B until a dedicated OpenFront economy migration initiative can
translate one model at a time with fixture parity.

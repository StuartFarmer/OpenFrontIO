# Analysis Report: Dynamics Systems Reconciliation

## Executive Summary

- Highest impact: the portable core dynamics graph compiler/simulator that should have bridged editor JSON to `StockFlowModel` existed in commit `a02a9365`, but is absent from the current tree after commit `e8b2fbef`; the current editor now runs a Foundation-specific formula graph directly.
- Second highest impact: `src/core/systems` is not one thing. It contains a live gameplay system scheduler for discrete game behavior and a stock-flow runtime for numeric economy mechanics; dynamics should become the canonical authoring layer for the stock-flow side first.
- Third highest impact: the current Foundation dynamics editor has the right UX loop but the wrong canonical data shape: React Flow types, arbitrary JavaScript strings, name-based scopes, and localStorage persistence are acting as the model boundary.
- Fourth highest impact: Foundation gameplay runtime already has hand-written food/troop functions that mirror dynamics examples but are not generated from, loaded from, or validated against saved dynamics systems.
- Fifth highest impact: reconciliation should preserve the editor's simple mental model, but reintroduce a typed portable dynamics definition underneath it so saved JSON can compile into proper runtime structures.

## Findings

### 1. The Missing Portable Dynamics Layer Is The Core Reconciliation Gap

- Evidence:
  - `git ls-tree -r --name-only a02a9365` shows `src/core/systems/dynamics/DynamicsSchema.ts`, `DynamicsCompiler.ts`, `DynamicsSimulator.ts`, `templates/FoodStockTemplate.ts`, and tests under `tests/core/systems/dynamics`.
  - `git show --name-status e8b2fbef -- src/core/systems/dynamics tests/core/systems/dynamics` shows those files deleted.
  - The current tree has no files under `src/core/systems/dynamics`, and `rg` finds no current `compileDynamicsSystem`, `DynamicsSystemDefinition`, or `runDynamicsSimulation` implementation.
  - The deleted schema defined framework-neutral nodes such as `input`, `parameter`, `math`, `activation`, `flow`, `stock`, and `probe`, plus `DynamicsSystemDefinition` and `DynamicsScenario`.
- Impact:
  - The repo currently has a great editor and a stock-flow runtime, but the bridge that makes editor JSON canonical gameplay data is gone.
  - Any game integration from current saved dynamics JSON would need custom translation from Foundation React Flow nodes, which is the hot-mess path the user wants to avoid.
- Recommendation:
  - Treat the deleted core dynamics layer as the architectural direction, but not necessarily as code to restore verbatim. Reintroduce a portable dynamics schema/compiler/simulator in `src/core/systems/dynamics` and make the Foundation editor read/write that shape.
- Risk:
  - Blindly restoring the old compiler would discard improvements in the current simplified editor. The model should be reconciled, not just reverted.

### 2. The Current Foundation Dynamics Editor Is UX-Strong But Model-Weak

- Evidence:
  - `src/games/foundation/dynamics/FoundationDynamicsModel.ts:3` defines only three primitives: `input`, `operator`, and `sink`.
  - `FoundationDynamicsModel.ts:41` defines `SavedDynamicsSystem` as `{ id, name, savedAt, nodes, edges }`, where nodes are `Node<FoundationDynamicsNodeData>` from `@xyflow/react` at `FoundationDynamicsModel.ts:1`.
  - `FoundationDynamicsModel.ts:769` persists a versioned localStorage library, and `FoundationDynamicsPage.ts:1149` saves current systems through that Foundation-specific shape.
  - `FoundationDynamicsModel.ts:1011` evaluates user formulas with `new Function(...)` and `with (scope)`, while `FoundationDynamicsModel.ts:994` builds that scope from incoming source node names.
  - `FoundationDynamicsReactBridge.tsx:77` restricts the UI to one `out` handle and one `in` handle, and `FoundationDynamicsModel.ts:1006` maps values by editable names rather than stable addresses.
- Impact:
  - The editor is easy to use and simulate, but the saved JSON is coupled to React Flow and Foundation UI concerns.
  - Expressions are not portable, inspectable, or safe enough to become general systems code.
  - Renaming a node can change expression binding semantics because formulas use names as variables.
- Recommendation:
  - Keep the simplified UX, but have it edit a core `DynamicsSystemDefinition`. The UI can still present `input/operator/sink` as a friendly mode, but persistence should use stable node ids, typed operations, typed handles, stock/flow semantics, and separate scenarios.
- Risk:
  - Moving from arbitrary JavaScript expressions to typed operations may feel less flexible unless the editor provides a small expression builder or an explicit advanced-expression node with validation.

### 3. Core Systems Already Split Into Discrete Runtime And Numeric Stock-Flow Runtime

- Evidence:
  - `src/core/systems/GameSystem.ts:3` defines scheduler phases: `preTick`, `legacyExecution`, `simulation`, and `postTick`.
  - `GameSystem.ts:20` sorts systems by phase/order and ticks them through `GameSystemContext`.
  - `src/core/systems/LegacyExecutionSystem.ts:37` adapts legacy `Execution` lifecycle into the system scheduler, preserving active execution ticks, queued initialization, spawn-phase gating, and inactive removal.
  - `src/core/systems/StockFlowSystem.ts:61` defines `StockFlowSystem` as stocks, parameters, auxiliaries, outputs, and flows.
  - `src/core/systems/StockFlowRuntime.ts:44` runs one deterministic stock-flow step, evaluates outputs and flows, then applies deltas and clamps stocks.
- Impact:
  - "Systems" cannot be unified as only graph-authored stock-flow models. The live game also needs command validation, entity lifecycles, territory mutation, projectiles, AI decisions, and update emission.
  - Dynamics is an excellent base for continuous stock-flow mechanics and tunable formulas, but should be hosted by the broader game scheduler rather than replacing it.
- Recommendation:
  - Define the hierarchy explicitly: `GameSystemScheduler` owns tick phases; native `GameSystem`s own discrete lifecycle behavior; dynamics-authored `StockFlowModel`s are one kind of payload that systems can compile, run, adapt to game state, and apply.
- Risk:
  - If the reconciliation declares dynamics graphs as the base for every system, discrete gameplay will either become awkward graph abuse or escape through ad hoc code paths.

### 4. Existing Stock-Flow Models Are Proper Runtime Structures, But They Are Code-Authored

- Evidence:
  - `src/core/systems/models/PopulationSystem.ts:27` returns a `StockFlowModel` with stocks such as `population.current` and `population.nutritionHealth`, outputs such as `population.capacity`, `population.births`, and `population.growth`, and flows at `PopulationSystem.ts:161`.
  - `src/core/systems/models/ResourceProductionSystem.ts:28` returns a `StockFlowModel` with resource stocks, capacity outputs, production outputs, and flows at `ResourceProductionSystem.ts:195`.
  - `src/core/systems/models/PlayerEconomyModel.ts:40` composes resource production, war, food, and population evaluations by calling typed model functions in sequence.
  - `src/core/systems/PlayerEconomyAdapter.ts:119` adapts live `Game` and `Player` state into the pure model inputs.
  - `src/core/systems/gameplay/PlayerEconomySystem.ts:4` applies the economy result back to `Player` and `Stats`.
- Impact:
  - The runtime side has a clean adapter/model/application pattern, but models are hand-written TypeScript, not dynamics-authored JSON.
  - A dynamics-authored system can fit here if it compiles into `StockFlowModel` and if adapters define how game state maps to external inputs and stock state.
- Recommendation:
  - Make "proper JS structures" mean compiled `StockFlowModel` plus a typed binding/adapter, not generated arbitrary code. Generated TypeScript can be optional, but runtime compilation from JSON should be first-class.
- Risk:
  - Without a binding contract, each gameplay integration will still hand-map graph nodes to game state differently.

### 5. Foundation Runtime Is Already Duplicating Dynamics-Like Formula Work

- Evidence:
  - `src/games/foundation/runtime/FoundationRuntime.ts:181` advances a tick by calling `tickFoundationFood(...)`, then wilderness exploration, then emits update metrics.
  - `src/games/foundation/domain/FoundationFood.ts:78` mutates food stock and troops through hand-written functions.
  - `FoundationFood.ts:167` computes stock growth and capacity clamping by direct formula, not through dynamics or stock-flow runtime.
  - `src/games/foundation/domain/FoundationTroops.ts:215` computes population growth with a direct logistic formula.
  - `tests/games/foundation/runtime.test.ts:259` names this "the dynamics growth curve", but the implementation is hand-written domain code.
- Impact:
  - Foundation is the perfect proving ground for the reconciliation because it already has a dynamics page and a live runtime using similar concepts.
  - Today, however, editing a dynamics graph does not change or generate the runtime's food/population behavior.
- Recommendation:
  - Reconcile Foundation first by compiling a dynamics definition into a stock-flow runtime model and using a Foundation adapter to feed `tilesOwned`, `troops`, food stock, parameters, and update metrics.
- Risk:
  - Foundation domain functions currently include gameplay-specific choices such as food reserve percentage and stockpile growth curve. The first compiled graph must either represent those choices faithfully or be clearly labeled as an experimental model.

### 6. The Current Editor Persistence Mixes Definition, Scenario, View, And Runtime State

- Evidence:
  - `FoundationDynamicsModel.ts:41` saves React Flow nodes and edges directly.
  - Node data includes UI controls and scenario-like values in the same object: `value`, `sliderMin`, `sliderMax`, `actionAmount`, `actionTicks`, `readSinkId`, `expression`, and `state` at `FoundationDynamicsModel.ts:6`.
  - `FoundationDynamicsPage.ts:1054` starts ramp actions that modify node `value` over ticks.
  - `FoundationDynamicsPage.ts:1085` starts simulation from `initialSimulationState(this.nodes, this.edges)`, so current graph state and current scenario values are intertwined.
  - The deleted portable schema separated `DynamicsSystemDefinition` and `DynamicsScenario`.
- Impact:
  - Saved systems are hard to use as reusable game definitions because editing values, running actions, and graph topology all share one data object.
  - A live game integration needs stable defaults, scenario overrides, current stock state, UI layout, and runtime traces to be separate.
- Recommendation:
  - Split the canonical contract into: system definition, scenario/defaults, view metadata, and runtime state/trace. The editor can still display them together.
- Risk:
  - Migration needs an importer for existing `openfront.foundation.dynamics.systems.v1` localStorage JSON to avoid losing user-created graphs.

### 7. A Binding Layer Is Missing Between Dynamics Addresses And Game State

- Evidence:
  - `StockFlowSystem.ts:74` has `externalInputs`, and `StockFlowRuntime.ts:28` accepts `stocks`, `inputs`, `params`, `tick`, `player`, and `game`.
  - Existing code-authored adapters such as `PlayerEconomyAdapter.ts:130` manually build population/resource/war inputs from `Game` and `Player`.
  - Current dynamics graphs have no declared mapping from a node to a game value such as `player.troops`, `claimedTileCount`, `foodStock`, or `activeExploration.troops`.
  - Current Foundation dynamics `read` inputs only read sink states inside the same graph (`FoundationDynamicsModel.ts:535` and `FoundationDynamicsModel.ts:688`).
- Impact:
  - Even with a portable graph compiler, game integration remains ad hoc unless the system definition or a companion binding declares how graph inputs/stocks connect to real game state.
- Recommendation:
  - Add a system binding concept separate from the graph: external input bindings, stock bindings, output bindings, and application policy. Keep this declarative where possible and allow small typed adapters where game-specific reads/writes are complex.
- Risk:
  - Over-generalizing bindings too early can become an accidental scripting engine. Start with Foundation economy bindings and one OpenFront player economy binding.

### 8. Safety And Determinism Need To Be Raised Before Dynamics Becomes Canonical

- Evidence:
  - Stock-flow runtime expressions are TypeScript functions and throw on missing/non-finite values through `StockFlowRuntime.ts:162`.
  - Stock-flow compiler validates duplicate stock ownership, duplicate producers, missing reads, flow targets, and system order in `StockFlowCompiler.ts:27`.
  - Current Foundation dynamics expression evaluation catches errors and silently falls back to a numeric default at `FoundationDynamicsModel.ts:1011`.
  - The editor evaluator fills unresolved operator cycles or missing dependencies with `0` at `FoundationDynamicsModel.ts:975`.
- Impact:
  - The editor simulation is forgiving, which is good for UI iteration, but canonical game systems need hard validation and deterministic failure modes.
- Recommendation:
  - Keep permissive editor previews if desired, but canonical save/compile should fail with actionable diagnostics before a graph can be used by runtime code.
- Risk:
  - Users may be surprised if a graph previews but cannot compile. The UI should show compile status and diagnostics continuously.

## Quick Wins

- Document the current state explicitly: `src/core/systems/dynamics` does not exist in the current tree, despite prior initiative artifacts claiming it did.
- Recover the deleted portable dynamics schema/compiler/simulator from commit `a02a9365` into a comparison branch or scratch reference before planning.
- Add a compatibility importer from current `SavedDynamicsSystem` JSON to a future portable definition.
- Add a current-tree test that proves no Foundation runtime formula is sourced from dynamics yet, so future work can flip that intentionally.

## Medium Changes

- Reintroduce a portable dynamics core module under `src/core/systems/dynamics`.
- Change the Foundation editor to edit portable dynamics definitions plus view metadata instead of raw React Flow nodes as the saved model.
- Compile dynamics definitions into `StockFlowModel` and run simulation through `runStockFlowStep`.
- Add a Foundation economy binding that maps player/map state to graph inputs and applies compiled stock/output results back to Foundation runtime metrics.
- Add parity tests between hand-written Foundation food/troop functions and the compiled dynamics model before making the compiled model live.

## High-Risk Decisions

- Whether arbitrary JavaScript expressions remain allowed. Recommendation: not as the default canonical model; prefer typed operations or a constrained expression AST.
- Whether dynamics should cover only stock-flow mechanics or all gameplay systems. Recommendation: stock-flow first; host it inside the broader `GameSystemScheduler`.
- Whether to restore the old `a02a9365` dynamics module directly. Recommendation: use it as evidence and a starting point, but reconcile it with the current simplified editor UX.
- Whether Foundation or OpenFront player economy becomes the first live compiled-graph integration. Recommendation: Foundation first because the runtime is smaller and already paired with the editor.

## Guardrails

- Keep React Flow as a view/editor implementation detail, not the saved model.
- Keep saved graph definitions JSON-serializable and schema-versioned.
- Keep stable node ids and handles as the binding surface; editable labels must not determine runtime semantics.
- Keep scenarios separate from system definitions.
- Keep runtime stock state separate from graph defaults and UI state.
- Compile graphs into `StockFlowModel` or other typed runtime structures; do not emit ad hoc game-specific glue per graph.
- Use typed adapters/bindings for game reads and writes.
- Do not force discrete command/entity systems into stock-flow graphs.

## Questions For Stuart

- Should the canonical dynamics model allow arbitrary formula text at all, or should v1 require typed operation nodes with only a small expression escape hatch?
- Should Foundation economy be the first runtime that consumes compiled dynamics definitions, or should OpenFront `PlayerEconomyModel` be reconciled first because it already sits under `src/core/systems`?
- Do you want existing saved localStorage graphs migrated forward, or can the next version reset the saved-system schema?
- Should compiled dynamics systems remain runtime-loaded JSON, or do you also want a generated TypeScript artifact for checked-in game systems?
- Are dynamics-authored systems meant to become designer-authored live balance data, or developer-authored templates that are later committed as code?

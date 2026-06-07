# Analysis Report: Dynamics Systems Reconciliation

## Executive Summary

- Highest impact: the current Foundation dynamics save/simulate flow exists, works, and is the system authoring base to preserve.
- Second highest impact: old references to a deleted core dynamics compiler path are misleading and should be removed from actionable docs.
- Third highest impact: `src/core/systems` is not one thing. It contains a live gameplay system scheduler for discrete game behavior and a stock-flow runtime for numeric economy mechanics.
- Fourth highest impact: the right architecture is `GameSystemScheduler -> ordered systems -> compiled dynamics graphs or imperative gameplay code`.
- Fifth highest impact: Foundation gameplay runtime already has hand-written food/troop functions that mirror dynamics examples, but those formulas are not yet sourced from saved dynamics systems.

## Findings

### 1. The Current Foundation Dynamics Flow Is The Base To Keep

- Evidence:
  - `src/games/foundation/dynamics/FoundationDynamicsModel.ts` defines the active graph model, built-in systems, save/load helpers, and simulation helpers.
  - `src/games/foundation/client/FoundationDynamicsPage.ts` owns the editor page, local save/load/import/export controls, simulation controls, charts, and React Flow bridge.
  - `src/games/foundation/dynamics/react/FoundationDynamicsReactBridge.tsx` isolates React Flow rendering from the Lit page.
- Impact:
  - The editor experience should remain the authoring surface for new systems.
  - The implementation work should adapt this current flow into stronger runtime structures rather than replacing it with the deleted historical design.
- Recommendation:
  - Keep the current `input -> operator -> sink` UX as the source model for this initiative.
- Risk:
  - Changing too much of the graph UX while making the data model stronger could break the part of the feature that already works well.

### 2. Stale Deleted-Core-Dynamics References Are A Real Cleanup Target

- Evidence:
  - Older initiative artifacts referenced a deleted core compiler/simulator path as an implementation target.
  - The current tree no longer contains that old module.
  - The user confirmed those old references should be deleted, not preserved as future direction.
- Impact:
  - Leaving those artifacts in place makes future agents or developers think the work should restore the old module.
- Recommendation:
  - Remove the old initiative artifacts and rewrite this initiative around the current Foundation save/simulate flow.
- Risk:
  - Removing stale planning docs is safe for implementation, but any useful historical lesson must be captured in current notes before deletion.

### 3. GameSystemScheduler Is The Right Outer Runtime

- Evidence:
  - `src/core/systems/GameSystem.ts` defines scheduler phases: `preTick`, `legacyExecution`, `simulation`, and `postTick`.
  - `GameSystemScheduler` sorts systems by phase/order and ticks them through `GameSystemContext`.
  - `src/core/systems/LegacyExecutionSystem.ts` adapts legacy `Execution` lifecycle into the scheduler, preserving active execution ticks, queued initialization, spawn-phase gating, and inactive removal.
- Impact:
  - The game needs ordered phase execution for discrete behavior such as commands, attacks, projectiles, unit lifecycle, AI, and update emission.
  - A single all-purpose graph would force imperative behavior into awkward graph nodes.
- Recommendation:
  - Keep `GameSystemScheduler` as the outer orchestrator. Systems that express stock-flow mechanics should run compiled dynamics graphs; systems that mutate entities, tiles, commands, and updates should stay imperative.
- Risk:
  - If future work collapses everything into one graph, gameplay code will likely become less deterministic and harder to debug.

### 4. The Current Editor Model Needs A Stronger Canonical Data Boundary

- Evidence:
  - `FoundationDynamicsModel.ts` currently saves React Flow node objects directly through `SavedDynamicsSystem`.
  - Node data mixes definition fields, editable scenario values, UI slider/action settings, sink state, and expression text.
  - Simulation evaluates formulas through local expression strings and name-based scopes.
- Impact:
  - The current save/simulate flow is productive, but direct game integration would still be ad hoc unless its data model becomes framework-neutral and compileable.
- Recommendation:
  - Split the saved model into system definition, scenario/defaults, view metadata, and runtime trace state while preserving import/export compatibility.
- Risk:
  - Migrating the saved shape can break local saved systems unless the old v1 format is imported forward.

### 5. Foundation Runtime Is The Right First Integration Target

- Evidence:
  - `src/games/foundation/runtime/FoundationRuntime.ts` advances food and population behavior through Foundation domain functions before emitting metrics.
  - `src/games/foundation/domain/FoundationFood.ts` and `FoundationTroops.ts` contain hand-written formulas for food stock and troop growth.
  - Foundation already owns the `/foundation/dynamics` editing surface and a smaller local runtime than OpenFront core gameplay.
- Impact:
  - Foundation can prove the full pipeline: edit/save a graph, compile it, bind it to runtime state, apply outputs, and emit metrics.
- Recommendation:
  - Integrate compiled current-style dynamics into Foundation food/population ticking first, then use the same pattern for broader systems.
- Risk:
  - Runtime parity must be proven before replacing hand-written formulas, or the game behavior may shift unintentionally.

## Quick Wins

- Delete the stale previous dynamics initiative artifacts that referenced the deleted core module.
- Add an explicit scheduler/dynamics decision note to this initiative.
- Verify the current Foundation dynamics tests still pass after cleanup.

## Medium Changes

- Create a framework-neutral schema for the current Foundation dynamics save/simulate model.
- Add persistence migration from the current v1 saved graph JSON.
- Compile current-style graphs into reusable runtime structures.
- Use a Foundation adapter to map player/map/parameter state into compiled graph inputs and apply outputs to runtime metrics.

## High-Risk Decisions

- Whether arbitrary JavaScript expressions remain allowed in canonical runtime-bound graphs. The current flow can keep expression editing, but compiled runtime needs validation.
- Whether the first integration should be Foundation or OpenFront economy. Recommendation: Foundation first.
- How much old saved localStorage JSON must be migrated. Recommendation: provide importer support for the current v1 shape.

## Guardrails

- Keep React Flow as an editor/view detail, not the runtime model.
- Keep saved graph definitions JSON-serializable and versioned.
- Keep stable node ids as the binding surface; editable labels must not define runtime identity.
- Keep runtime stock/sink state separate from graph defaults and UI state.
- Compile graphs into reusable runtime structures; do not wire each graph into gameplay with bespoke glue.
- Use typed adapters for game reads and writes.
- Do not force attacks, projectiles, AI, or update emission into dynamics graphs.

## Confirmed Direction

```text
GameSystemScheduler
  -> runs ordered game systems
      -> some systems run compiled dynamics graphs
      -> some systems run imperative gameplay code
```

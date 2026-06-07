# StockFlow Convergence

## Decision

The public canonical dynamics surface is `src/core/systems/dynamics`.

`StockFlow*` is quarantined as internal compatibility code for the older
OpenFront economy stack under `src/games/openfront/systems`. It is not the
authoring/runtime surface for new graph-backed systems and does not belong in
`src/core/systems`.

## Canonical Public Surface

Use canonical dynamics for new systems:

- `DynamicsSavedSystem` for schema/view/scenario persistence.
- `compileDynamicsSystem` for graph validation and compilation.
- `initialDynamicsSimulationState` and `stepDynamicsSimulationState` for
  deterministic simulation.
- `DynamicsGraphBinding` and `createDynamicsGraphGameSystem` for scheduled
  runtime integration.

Foundation is the reference implementation:

- `FoundationEconomyDynamics.ts` defines the graph.
- `FoundationEconomyDynamicsSystem.ts` maps game state to graph inputs/sinks,
  runs the graph-backed economy system, and applies outputs.
- `/foundation/dynamics` edits canonical saved systems through React Flow
  projection helpers.

## StockFlow Compatibility Role

StockFlow remains only for OpenFront compatibility:

- `StockFlowSystem.ts`, `StockFlowCompiler.ts`, and `StockFlowRuntime.ts` are
  marked `@internal` compatibility code in `src/games/openfront/systems`.
- Production imports are boundary-tested in
  `tests/core/systems/StockFlowBoundary.test.ts`.
- Allowed production importers are the existing OpenFront economy model layer:
  `PopulationSystem`, `ResourceProductionSystem`, `FoodSystem`,
  `AgricultureSystem`, and `WarSystem`.
- `PlayerEconomyAdapter` remains the OpenFront game-level bridge from
  `Game`/`Player` state into that compatibility model layer.

## Scheduler Split

The runtime split remains:

```text
GameSystemScheduler
  -> ordered GameSystem instances
      -> graph-backed systems via DynamicsGraphBinding
      -> imperative gameplay systems
      -> internal compatibility systems where still needed
```

Do not collapse gameplay into one global graph. Use graph-backed systems for
numeric stock/flow mechanics, and imperative systems for command validation, map
mutation, entity lifecycle, events, AI, combat, and other branching workflows.

## Migration Guidance

Future OpenFront economy migration should happen model by model:

1. Add fixed parity fixtures for the current StockFlow-backed behavior.
2. Translate one model to canonical dynamics.
3. Bind it through `DynamicsGraphBinding`.
4. Keep `PlayerEconomyAdapter` behavior compatible until callers migrate.
5. Remove the corresponding StockFlow import only after parity passes.

Do not delete or rewrite StockFlow broadly without preserving:

- population capacity/growth behavior,
- resource capacity/production behavior,
- player economy wrapper/config parity,
- sandbox/debug diagnostics expectations where still user-visible.

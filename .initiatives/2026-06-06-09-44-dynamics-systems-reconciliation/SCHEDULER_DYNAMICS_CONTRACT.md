# Scheduler / Dynamics Contract

## Architecture

```text
GameSystemScheduler
  -> runs ordered GameSystem instances
      -> some systems run compiled dynamics graphs
      -> some systems run imperative gameplay code
```

`GameSystemScheduler` is the outer runtime contract. It owns phase ordering,
spawn-phase filtering, and deterministic tick sequencing. A dynamics graph is a
runtime payload that a scheduled system may execute; it is not a replacement for
the scheduler.

## Dynamics Graph Systems

Compiled dynamics graphs are the base for stock-flow style mechanics:

- numeric production, demand, capacity, accumulation, decay, and growth curves
- stateful sinks such as food stock, population, pressure, reserves, or morale
- editor-created systems that need canonical JSON save/load and deterministic
  simulation

Runtime code consumes compiled schema definitions, not React Flow state. React
Flow nodes and view metadata stay in the editor boundary; graph-backed runtime
systems use `DynamicsGraphBinding` to map game state into graph inputs/sinks,
step the graph, and apply outputs.

The Foundation economy path is the reference implementation:

- `FoundationEconomyDynamics.ts` defines the canonical graph
- `FoundationEconomyDynamicsSystem.ts` is the graph-backed runtime system that
  maps player/parameter state into graph inputs and maps graph outputs back to
  runtime metrics
- `FoundationRuntime` uses that graph-backed economy system for food stock,
  troop growth, and economy metrics

## Imperative Game Systems

Discrete command, entity, map, combat, AI, and update-emission behavior remains
imperative under scheduled `GameSystem`s. Use imperative systems when behavior
needs:

- command validation or rejection
- entity creation/destruction
- map mutation or territory ownership updates
- event/update emission
- pathing, targeting, combat resolution, AI decisions, or other branching
  workflows

These systems may read graph-produced state or write inputs for a graph-backed
system, but they should not be forced into a single global graph.

## Boundary Rules

- Dynamics JSON is the canonical authoring format for stock-flow mechanics.
- Compiled dynamics structures are the runtime format for graph-backed systems.
- React Flow state is editor view state only.
- `GameSystemScheduler` remains responsible for ordering compiled graph systems
  alongside imperative systems.
- Formula helpers retained in domain modules are compatibility/reference APIs;
  live Foundation economy runtime behavior comes from the graph-backed economy
  system.
- `src/core/systems/dynamics` is the public canonical dynamics surface.
- `StockFlow*` is quarantined under `src/games/openfront/systems` as internal
  OpenFront economy compatibility code; it is not a core or peer public
  authoring/runtime surface for new graph-backed systems.

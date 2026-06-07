# Final Report: Canonical Dynamics Cleanup

## Result

The canonical dynamics surface is now `src/core/systems/dynamics`.

Foundation uses that core for schema, compilation, simulation, editor
persistence, runtime graph binding, and economy execution. React Flow remains the
interactive editor canvas, but it is isolated to `src/games/foundation/dynamics/react`.

`StockFlow*` is no longer treated as a peer public dynamics surface and no
longer lives under core systems. It is OpenFront-local compatibility code with
boundary tests and parity coverage.

OpenFront-specific gameplay systems and command surfaces also live under
`src/games/openfront/systems`. `src/core/systems` is reserved for scheduler,
context, canonical dynamics, and the legacy execution shim.

## Canonical Modules

- `src/core/systems/dynamics/DynamicsSchema.ts`
  Defines `DynamicsSavedSystem`, schema/view/scenario/runtime state types, and
  validation.
- `src/core/systems/dynamics/DynamicsCompiler.ts`
  Compiles canonical graph definitions.
- `src/core/systems/dynamics/DynamicsSimulator.ts`
  Runs deterministic initial/step simulation.
- `src/core/systems/dynamics/DynamicsGraphBinding.ts`
  Provides the standard read/step/apply binding shape for scheduled graph-backed
  runtime systems.

Foundation-specific graph definitions remain under
`src/games/foundation/dynamics`, but they consume the generic core types.

## Editor Boundary

The `/foundation/dynamics` page still uses React Flow for editing. The data
ownership changed:

- saved libraries are canonical `DynamicsSavedSystem` records;
- built-ins are canonical saved systems;
- React Flow state is projected through
  `FoundationDynamicsReactFlowMapping.ts`;
- `FoundationDynamicsModel.ts` uses plain Foundation editor graph types and does
  not import `@xyflow/react`;
- storage load/save/parse/serialize APIs accept and return canonical v2
  systems;
- v1 import remains private migration behavior.

Editor simulation now uses the canonical compiler/simulator path only. Invalid
graphs surface diagnostics and do not run through a raw fallback evaluator.

## Runtime Boundary

`GameSystemScheduler` remains the outer scheduler for ordered game systems.
Graph-backed systems are scheduled systems that use `DynamicsGraphBinding`;
imperative systems remain the right model for commands, map mutation, entity
lifecycle, events, AI, combat, and branching workflows.

Foundation economy is the reference graph-backed runtime system:

- `FoundationEconomyDynamics.ts` defines the canonical graph.
- `FoundationEconomyDynamicsSystem.ts` maps player/parameter state to graph
  inputs and sink states, runs the graph, and applies output metrics/player
  updates.
- `FoundationRuntime` and `FoundationCommandRouter` use the graph-backed economy
  system names.

The old `FoundationDynamicsRuntimeAdapter.ts` alias module has been removed.

## StockFlow Boundary

`StockFlow*` remains active only for OpenFront compatibility under
`src/games/openfront/systems`:

- `StockFlowSystem.ts`, `StockFlowCompiler.ts`, and `StockFlowRuntime.ts` are
  marked `@internal` compatibility code in the OpenFront game folder.
- `tests/core/systems/StockFlowBoundary.test.ts` verifies there are no StockFlow
  implementation files left in `src/core/systems` and constrains imports to the
  OpenFront compatibility economy model layer.
- OpenFront population/resource/player economy behavior remains covered by
  parity tests.

Future migration should translate OpenFront economy models one at a time into
canonical dynamics, protected by fixed fixtures and existing config-wrapper
parity tests.

OpenFront gameplay systems such as attack commands, battle resolution, mobile
units, projectiles, structures, territory conquest, player economy, player
upkeep, and command surfaces are also OpenFront-local implementation files.

## Validation Added

- Core dynamics boundary tests for React Flow and Foundation import separation.
- React Flow projection round-trip and boundary tests.
- v2 storage and v1 migration tests.
- Graph binding scheduler/order tests.
- Foundation economy graph/runtime fixture tests.
- Editor invalid-graph no-fallback tests.
- StockFlow quarantine boundary tests.
- OpenFront population/resource/player economy compatibility tests.

## Remaining Work

The remaining work is migration, not reconciliation:

- migrate OpenFront `StockFlow*` economy models to canonical dynamics if desired;
- optionally move local storage to a v2 key after a user-data migration decision.

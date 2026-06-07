# Deliverables

## D1: Stale Deleted-Dynamics Cleanup

**Outcome**: The repo no longer carries actionable references that tell future work to recreate the deleted historical compiler module, and this initiative records the confirmed direction: use the current Foundation save/simulate flow as the base.
**Demo**:
Run the stale-reference search recorded in S1.3.
**Acceptance Checks**:

- [x] There is no live code under the old deleted core compiler path.
- [x] Old initiative/task references that prescribe recreating the deleted module are removed or rewritten as historical notes.
- [x] This initiative states the agreed scheduler shape: `GameSystemScheduler -> ordered systems -> compiled dynamics graphs or imperative gameplay code`.
      **Dependencies**: None.
      **Notes**: Do not delete the current Foundation save/simulate implementation.

## D2: Canonical Current Dynamics Definition

**Outcome**: The current `input -> operator -> sink` save/simulate model has a framework-neutral JSON schema separate from React Flow view state, scenarios, and runtime trace state.
**Demo**:
`npx vitest run tests/games/foundation/dynamics/FoundationDynamicsSchema.test.ts tests/games/foundation/dynamics/FoundationDynamicsModel.test.ts`
**Acceptance Checks**:

- [x] Saved system definitions do not depend on `@xyflow/react` types.
- [x] Definition, scenario/default values, view layout, and runtime simulation state are separate structures.
- [x] Existing v1 saved Foundation dynamics JSON can be imported or migrated.
- [x] The current editor UX still creates, edits, saves, imports, exports, and simulates graphs.
      **Dependencies**: D1.
      **Notes**: Keep the simple current primitives unless implementation discovers a hard blocker.

## D3: Compiled Dynamics Runtime

**Outcome**: A saved current-style dynamics graph can be validated once, compiled into proper JavaScript runtime structures, and simulated deterministically without rebuilding expression functions every tick.
**Demo**:
`npx vitest run tests/games/foundation/dynamics/FoundationDynamicsCompiler.test.ts tests/games/foundation/dynamics/FoundationDynamicsSimulator.test.ts`
**Acceptance Checks**:

- [x] Compiler validates missing nodes, invalid references, duplicate ids, cycles, missing input names, invalid formulas, and non-finite outputs.
- [x] Simulation uses compiled graph structures rather than raw React Flow nodes.
- [x] Trace frames retain the editor-visible values for operators and sinks.
- [x] Compile diagnostics are actionable enough for the editor UI.
      **Dependencies**: D2.
      **Notes**: This is not a resurrection of the deleted historical module.

## D4: Foundation Runtime Uses Compiled Dynamics

**Outcome**: Foundation food/population ticking can be driven by a compiled dynamics graph through an adapter, with parity against current hand-written Foundation formulas before the compiled path becomes live.
**Demo**:
`npx vitest run tests/games/foundation/runtime.test.ts tests/games/foundation/dynamics/FoundationDynamicsRuntimeAdapter.test.ts`
**Acceptance Checks**:

- [x] A Foundation dynamics system definition represents current food stock, food capacity, food-supported troops, and population growth behavior.
- [x] Runtime adapter maps Foundation player/map/parameter state to graph inputs and sink state.
- [x] Adapter outputs can update food stock, troops, and runtime metrics.
- [x] Parity tests cover current hand-written formula behavior before replacement.
      **Dependencies**: D3.
      **Notes**: Foundation is the first proving ground because it already owns the editor route and a small local runtime.

## D5: Scheduler Integration And Documentation

**Outcome**: The final architecture is documented and tested: `GameSystemScheduler` hosts ordered systems, some systems run compiled dynamics graphs, and discrete gameplay remains imperative.
**Demo**:
`npx vitest run tests/core/systems/GameSystem.test.ts tests/games/foundation/dynamics tests/games/foundation/runtime.test.ts && npx tsc --noEmit`
**Acceptance Checks**:

- [x] Documentation distinguishes compiled dynamics systems from imperative gameplay systems.
- [x] Any remaining Foundation formula wrappers are either removed or documented as compatibility/adapters over compiled dynamics.
- [x] Tests cover the scheduler boundary and Foundation compiled-dynamics runtime path.
- [x] TypeScript passes.
      **Dependencies**: D4.
      **Notes**: Do not force attacks, projectiles, AI, or update emission into a graph.

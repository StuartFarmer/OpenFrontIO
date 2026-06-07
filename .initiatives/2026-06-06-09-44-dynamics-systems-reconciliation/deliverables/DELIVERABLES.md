# Deliverables

## D1: Stale Deleted-Dynamics Cleanup

**Outcome**: The repo no longer carries actionable references that tell future work to recreate the deleted `src/core/systems/dynamics` compiler path, and this initiative records the confirmed direction: use the current Foundation save/simulate flow as the base.
**Demo**:
`rg -n "src/core/systems/dynamics|DynamicsCompiler|DynamicsSimulator|tests/core/systems/dynamics" .initiatives docs src tests`
**Acceptance Checks**:

- [ ] There is no live code under the old deleted `src/core/systems/dynamics` path.
- [ ] Old initiative/task references that prescribe recreating the deleted module are removed or rewritten as historical notes.
- [ ] This initiative states the agreed scheduler shape: `GameSystemScheduler -> ordered systems -> compiled dynamics graphs or imperative gameplay code`.
      **Dependencies**: None.
      **Notes**: Do not delete the current Foundation save/simulate implementation.

## D2: Canonical Current Dynamics Definition

**Outcome**: The current `input -> operator -> sink` save/simulate model has a framework-neutral JSON schema separate from React Flow view state, scenarios, and runtime trace state.
**Demo**:
`npx vitest run tests/games/foundation/dynamics/FoundationDynamicsSchema.test.ts tests/games/foundation/dynamics/FoundationDynamicsModel.test.ts`
**Acceptance Checks**:

- [ ] Saved system definitions do not depend on `@xyflow/react` types.
- [ ] Definition, scenario/default values, view layout, and runtime simulation state are separate structures.
- [ ] Existing v1 saved Foundation dynamics JSON can be imported or migrated.
- [ ] The current editor UX still creates, edits, saves, imports, exports, and simulates graphs.
      **Dependencies**: D1.
      **Notes**: Keep the simple current primitives unless implementation discovers a hard blocker.

## D3: Compiled Dynamics Runtime

**Outcome**: A saved current-style dynamics graph can be validated once, compiled into proper JavaScript runtime structures, and simulated deterministically without rebuilding expression functions every tick.
**Demo**:
`npx vitest run tests/games/foundation/dynamics/FoundationDynamicsCompiler.test.ts tests/games/foundation/dynamics/FoundationDynamicsSimulator.test.ts`
**Acceptance Checks**:

- [ ] Compiler validates missing nodes, invalid references, duplicate ids, cycles, missing input names, invalid formulas, and non-finite outputs.
- [ ] Simulation uses compiled graph structures rather than raw React Flow nodes.
- [ ] Trace frames retain the editor-visible values for operators and sinks.
- [ ] Compile diagnostics are actionable enough for the editor UI.
      **Dependencies**: D2.
      **Notes**: This is not a resurrection of the deleted `src/core/systems/dynamics` module.

## D4: Foundation Runtime Uses Compiled Dynamics

**Outcome**: Foundation food/population ticking can be driven by a compiled dynamics graph through an adapter, with parity against current hand-written Foundation formulas before the compiled path becomes live.
**Demo**:
`npx vitest run tests/games/foundation/runtime.test.ts tests/games/foundation/dynamics/FoundationDynamicsRuntimeAdapter.test.ts`
**Acceptance Checks**:

- [ ] A Foundation dynamics system definition represents current food stock, food capacity, food-supported troops, and population growth behavior.
- [ ] Runtime adapter maps Foundation player/map/parameter state to graph inputs and sink state.
- [ ] Adapter outputs can update food stock, troops, and runtime metrics.
- [ ] Parity tests cover current hand-written formula behavior before replacement.
      **Dependencies**: D3.
      **Notes**: Foundation is the first proving ground because it already owns the editor route and a small local runtime.

## D5: Scheduler Integration And Documentation

**Outcome**: The final architecture is documented and tested: `GameSystemScheduler` hosts ordered systems, some systems run compiled dynamics graphs, and discrete gameplay remains imperative.
**Demo**:
`npx vitest run tests/core/systems/GameSystem.test.ts tests/games/foundation/dynamics tests/games/foundation/runtime.test.ts && npx tsc --noEmit`
**Acceptance Checks**:

- [ ] Documentation distinguishes compiled dynamics systems from imperative gameplay systems.
- [ ] Any remaining Foundation formula wrappers are either removed or documented as compatibility/adapters over compiled dynamics.
- [ ] Tests cover the scheduler boundary and Foundation compiled-dynamics runtime path.
- [ ] TypeScript passes.
      **Dependencies**: D4.
      **Notes**: Do not force attacks, projectiles, AI, or update emission into a graph.

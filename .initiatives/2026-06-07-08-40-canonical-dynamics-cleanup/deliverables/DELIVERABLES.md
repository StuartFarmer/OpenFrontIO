# Deliverables

## D1: Shared Canonical Dynamics Core

**Outcome**:
The schema, compiler, simulator, and runtime state types currently named
`FoundationDynamics*` are promoted to a neutral canonical dynamics module that
Foundation and future systems consume.
**Demo**:
`npx vitest run tests/games/foundation/dynamics/FoundationDynamicsCompiler.test.ts tests/games/foundation/dynamics/FoundationDynamicsSimulator.test.ts tests/core/systems/DynamicsGraphSystemBoundary.test.ts`
**Acceptance Checks**:

- [x] Canonical dynamics schema/compiler/simulator live under a generic module
      boundary.
- [x] Foundation-specific graph definitions import generic dynamics types and
      functions.
- [x] Non-UI dynamics/runtime modules do not import `@xyflow/react`.
      **Dependencies**: None.
      **Notes**: Keep Foundation graph definitions in Foundation; only promote
      the generic dynamics machinery.

## D2: Schema-First Editor And Persistence

**Outcome**:
The `/foundation/dynamics` editor keeps the React Flow UX, but saved systems and
storage are canonical schema/view/scenario objects instead of React Flow
node/edge state.
**Demo**:
`npx vitest run tests/games/foundation/dynamics/FoundationDynamicsSchema.test.ts tests/games/foundation/dynamics/FoundationDynamicsReactFlowMapping.test.ts tests/games/foundation/client/FoundationDynamicsPage.test.ts`
**Acceptance Checks**:

- [x] `SavedDynamicsSystem` is schema-first or removed in favor of the canonical
      saved system type.
- [x] React Flow node/edge state is isolated to a UI projection/mapping layer.
- [x] Storage APIs load/save canonical v2 libraries; v1 import remains private
      migration logic.
- [x] Editor save/load/import/export UX remains behaviorally compatible.
      **Dependencies**: D1.
      **Notes**: This preserves the flow editor and simulator; it only changes
      which data shape is canonical.

## D3: Canonical Graph Runtime Binding

**Outcome**:
Graph-backed gameplay systems use a standard binding shape instead of one-off
runtime adapters, and Foundation economy is renamed/reworked as the reference
graph-backed system.
**Demo**:
`npx vitest run tests/games/foundation/runtime.test.ts tests/games/foundation/dynamics/FoundationEconomyDynamicsSystem.test.ts tests/core/systems/DynamicsGraphSystemBoundary.test.ts`
**Acceptance Checks**:

- [x] A generic graph runtime binding interface exists for reading game state,
      stepping compiled dynamics, and applying outputs.
- [x] Foundation economy uses that binding instead of an exported "adapter"
      concept.
- [x] `FoundationRuntime` and `FoundationCommandRouter` still emit compatible
      metrics and player updates.
      **Dependencies**: D1, D2.
      **Notes**: Do not overgeneralize beyond the binding shape proven by
      Foundation.

## D4: Retired Foundation Compatibility Holdovers

**Outcome**:
Foundation graph execution is the clear source of truth: editor fallback
simulation is removed or made explicitly draft-only, and duplicate food/troop
formula helpers are narrowed or replaced by fixtures.
**Demo**:
`npx vitest run tests/games/foundation/dynamics/FoundationEconomyDynamics.test.ts tests/games/foundation/runtime.test.ts tests/games/foundation/client/FoundationDynamicsPage.test.ts`
**Acceptance Checks**:

- [x] Normal editor simulation uses only the canonical compiler/simulator path.
- [x] Invalid graphs show diagnostics rather than simulating through raw fallback
      evaluators.
- [x] Foundation food/troop formula helpers are removed, narrowed, or clearly
      quarantined outside runtime ownership.
- [x] Parity tests use fixed fixtures or canonical graph expectations rather
      than duplicate formula implementations.
      **Dependencies**: D2, D3.
      **Notes**: Keep parameter normalization helpers if they are still useful.

## D5: StockFlow Convergence Or Quarantine

**Outcome**:
The older core `StockFlow*` model no longer competes as a peer public dynamics
system. It is either migrated behind the canonical dynamics surface or explicitly
quarantined as an internal compatibility implementation with import boundaries.
**Demo**:
`npx vitest run tests/core/systems/StockFlowRuntime.test.ts tests/core/systems/PopulationSystem.test.ts tests/core/systems/ResourceProductionSystem.test.ts tests/core/systems/PlayerEconomyAdapter.test.ts`
**Acceptance Checks**:

- [x] Repo documentation and imports identify one public canonical dynamics
      surface.
- [x] Core `StockFlow*` usage is either migrated or limited to an internal
      compatibility boundary.
- [x] OpenFront population/resource behavior remains covered by parity tests.
      **Dependencies**: D1, D3.
      **Notes**: This is the riskiest cleanup; do not delete working OpenFront
      economy behavior without parity protection.

## D6: Final Canonical Dynamics Validation

**Outcome**:
The cleanup is documented, import boundaries are enforced, focused tests pass,
and TypeScript validates the new canonical dynamics shape.
**Demo**:
`npx vitest run tests/games/foundation/dynamics tests/games/foundation/client/FoundationDynamicsPage.test.ts tests/games/foundation/runtime.test.ts tests/core/systems && npx tsc --noEmit`
**Acceptance Checks**:

- [x] Dynamics/editor/runtime focused tests pass.
- [x] Core systems boundary and StockFlow compatibility tests pass.
- [x] Import-boundary tests prevent React Flow and legacy surfaces from leaking
      into runtime modules.
- [x] `npx tsc --noEmit` passes.
      **Dependencies**: D1, D2, D3, D4, D5.
      **Notes**: Full production build is optional unless focused validation
      reveals build-only integration risk.

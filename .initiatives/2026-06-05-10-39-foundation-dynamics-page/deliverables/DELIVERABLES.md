# Deliverables

## D1: Portable Dynamics Graph Schema

**Outcome**: A versioned, framework-neutral schema for named systems, nodes, edges, scenarios, node configs, and templates.
**Demo**:
`npx vitest run tests/core/systems/dynamics/schema.test.ts`
**Acceptance Checks**:

- [x] Supports named external input, parameter, math, activation, flow, stock, and probe nodes.
- [x] Separates system definitions from scenario values.
- [x] Preserves stable node ids while allowing editable names.
      **Dependencies**: None.
      **Notes**: React Flow objects must not be the persisted source of truth.

## D2: Graph Compiler And Simulator

**Outcome**: Dynamics graphs can compile to executable stock-flow models and produce deterministic tick traces.
**Demo**:
`npx vitest run tests/core/systems/dynamics/compiler.test.ts tests/core/systems/dynamics/simulator.test.ts`
**Acceptance Checks**:

- [x] Simple stock-flow graphs execute as `stock += inflow - outflow`.
- [x] Stock min/max capacity clamps are represented and traced.
- [x] Tick traces include values, stocks, flows, deltas, and overflow.
      **Dependencies**: D1.
      **Notes**: Keep expression support constrained to an operation catalog.

## D3: Save, Load, Import, And Export

**Outcome**: Users can save, load, duplicate, delete, import, and export systems and scenarios locally.
**Demo**:
`npx vitest run tests/games/foundation/dynamics/DynamicsPersistence.test.ts`
**Acceptance Checks**:

- [x] Saved systems survive reload through localStorage.
- [x] Import/export uses versioned JSON.
- [x] Scenarios can override input, parameter, and stock initial values independently of graph topology.
      **Dependencies**: D1.
      **Notes**: Use localStorage first; no server persistence.

## D4: `/foundation/dynamics` Page With React Flow Canvas

**Outcome**: A dedicated Foundation dynamics page mounts a React Flow graph editor inside the existing Vite/Lit app.
**Demo**:
`npx vitest run tests/games/foundation/client/FoundationDynamicsPage.test.ts tests/client/MainFoundationRoutes.test.ts`
**Acceptance Checks**:

- [x] `/foundation/dynamics` renders the dynamics page.
- [x] `/foundation` still renders the Foundation world page.
- [x] React Flow is isolated behind a page/editor boundary.
- [x] Users can select nodes and edit names/config values in an inspector.
      **Dependencies**: D1, D2, D3.
      **Notes**: Requires adding React, React DOM, and React Flow dependencies.

## D5: Food Stock Template And Inspection UI

**Outcome**: The page ships with a "Simple Food Stock" template that recreates the current Layer 1 model from abstract nodes.
**Demo**:
`npx vitest run tests/games/foundation/dynamics/FoodStockTemplate.test.ts tests/games/foundation/client/FoundationDynamicsPage.test.ts`
**Acceptance Checks**:

- [x] Template contains external input nodes for `tilesOwned` and population/troops when modeled externally.
- [x] Template can derive production and demand through generic math nodes.
- [x] Template includes `foodStock`, `foodStockCapacity`, `foodStockDelta`, and `foodStockOverflow` inspection.
- [x] Users can run, pause, reset, step, and view time-series traces.
      **Dependencies**: D1, D2, D4.
      **Notes**: Do not bake food semantics into the engine; keep them in the template.

## D6: Verification And Developer Documentation

**Outcome**: The feature has focused tests, typecheck coverage, and short docs for using and extending dynamics systems.
**Demo**:
`npx tsc --noEmit`
**Acceptance Checks**:

- [x] Focused Vitest suites pass.
- [x] TypeScript passes.
- [x] Docs explain system vs scenario, node ids vs names, and how templates compile.
      **Dependencies**: D1-D5.
      **Notes**: Keep documentation near the dynamics module or Foundation client page, whichever matches implementation structure.

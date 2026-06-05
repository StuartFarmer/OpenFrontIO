# Analysis Report: Foundation Dynamics Page

## Executive Summary

- Highest impact: the existing stock-flow runtime already provides the simulation substrate; the dynamics page should compile visual graphs into that runtime instead of inventing a second evaluator.
- Highest risk: the app is Lit-based and has no React dependency today, so React Flow must be isolated as a canvas island with clear ownership boundaries.
- Routing needs care because `/foundation/dynamics` currently matches the broad `/foundation` route predicate.
- Persistence should distinguish graph definitions from scenarios, because external inputs are named editable nodes whose values change while the simulation runs.
- The current food model is small and clean enough to become the first template for validating the builder.

## Findings

### 1. Existing stock-flow primitives are already close to the needed engine

- Evidence: `src/core/systems/StockFlowSystem.ts` defines stocks with `initial`, `min`, `max`, parameters, outputs, auxiliaries, and flows. `src/core/systems/StockFlowRuntime.ts` evaluates outputs, applies flows, and clamps stock values.
- Impact: A visual dynamics builder can map named nodes to `StockFlowModel` instead of creating a divergent simulation engine.
- Recommendation: Keep the graph schema framework-neutral and add a compiler from dynamics graph nodes/edges to `StockFlowModel`.
- Risk: Some visual nodes such as arbitrary math or activation functions may need a constrained expression representation before they can compile safely.

### 2. React Flow is requested but the current UI stack is Lit

- Evidence: `package.json` includes `lit` and many Lit custom elements, but no `react`, `react-dom`, `@xyflow/react`, or `reactflow`. `src/games/foundation/client/FoundationPage.ts` is a Lit custom element.
- Impact: Adding React Flow directly into Foundation UI without an adapter would blur framework ownership and make testing/lifecycle harder.
- Recommendation: Add React dependencies explicitly and mount the React Flow editor inside a dedicated Foundation dynamics custom element or route wrapper.
- Risk: Build size, CSS isolation, unmount lifecycle, and jsdom test behavior need attention.

### 3. `/foundation/dynamics` will currently route to the Foundation world page

- Evidence: `src/client/Main.ts` has `isFoundationRoute()` matching `window.location.pathname === "/foundation"` or `window.location.search.includes("foundation")`; there is no more specific dynamics route before it.
- Impact: The desired page path will not be reachable as a distinct page without route changes.
- Recommendation: Add `isFoundationDynamicsRoute()` and check it before `isFoundationRoute()`.
- Risk: The search-string fallback can still produce surprising route matches if not ordered and tested.

### 4. Saving/loading needs two concepts: system definition and scenario

- Evidence: Foundation already persists tuning and generated map cache via localStorage in `FoundationTuningSettings.ts` and `FoundationPage.ts`, while existing sandbox controls persist settings independently.
- Impact: A graph definition contains node topology and defaults; a scenario contains current input values, parameter overrides, stock initial values, and run settings. Mixing them makes iteration brittle.
- Recommendation: Model and persist `DynamicsSystemDefinition` separately from `DynamicsScenario`.
- Risk: Import/export compatibility requires explicit schema versions from the start.

### 5. Current food stock model is a strong first template

- Evidence: `src/games/foundation/domain/FoundationFood.ts` defines one `food.stock`, external inputs for production, demand, and capacity, flows for production and consumption, and outputs for raw next stock and overflow.
- Impact: The first template can demonstrate the full primitive loop without population or resource-specific hardcoding.
- Recommendation: Ship a "Food Stock" template composed from input, parameter, math, flow, stock, and probe nodes.
- Risk: The existing Foundation production formula in `FoundationTroops.ts` is more complex than the teaching model; template naming should distinguish "Simple Food Stock" from "Foundation Food Formula".

### 6. Existing sandbox pages show useful testing and UI patterns

- Evidence: `src/client/sandbox/PopulationFoodSystemsSandbox.ts` is a developer-facing Lit simulator with controls, history, charts, and tests under `tests/client/sandbox/PopulationFoodSystemsSandbox.test.ts`.
- Impact: Dynamics page tests can follow established jsdom custom-element patterns, while charts and traces can borrow layout ideas.
- Recommendation: Keep v1 developer-facing with inspectable controls, trace table, and simple charts before over-polishing the graph editor.
- Risk: Existing sandbox code is not graph-based, so reuse should be conceptual rather than copy-paste.

## Quick Wins

- Add the route predicate and a placeholder page shell for `/foundation/dynamics`.
- Define the serializable dynamics graph schema and localStorage keys.
- Add a simple food-stock template fixture and unit tests before building the canvas.

## Medium Changes

- Add a compiler from graph schema to `StockFlowModel`.
- Add a deterministic simulator that records tick traces from saved systems and scenarios.
- Add React Flow as an isolated graph editor island mounted by a Foundation dynamics page.
- Add save/load/import/export controls backed by localStorage.

## High-Risk Decisions

- How much expression power to allow in math nodes. Arbitrary code would be unsafe and hard to serialize; a constrained operation catalog is safer.
- Whether system definitions should live under `src/core/systems/dynamics` immediately or start under `src/games/foundation/dynamics`. The graph engine is abstract, so core placement is likely correct.
- How tightly to couple React Flow handles to the portable graph schema. React Flow ids should be view metadata, not the source of truth.

## Guardrails

- Keep React Flow out of the simulation engine.
- Keep graph definitions JSON-serializable and versioned.
- Use stable node ids for edges; editable names must not break connections.
- Treat external inputs as named editable value nodes, not hardcoded game facts.
- Validate route selection so `/foundation` and `/foundation/dynamics` remain distinct.

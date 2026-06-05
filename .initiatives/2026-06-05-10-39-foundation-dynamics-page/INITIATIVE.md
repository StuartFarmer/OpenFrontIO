# Initiative: Foundation Dynamics Page

## Stack

- Language: TypeScript.
- Package manager: npm.
- Test runner: Vitest.
- Build: Vite plus `tsc --noEmit`.
- UI: Lit custom elements today; requested graph canvas uses React Flow, which requires adding React/React Flow dependencies and a mount bridge.
- CI: No `.github/workflows/` directory is present in this checkout; validation should use local npm scripts.

## Goal

Create a developer-facing `/foundation/dynamics` page for building, saving, loading, inspecting, and simulating abstract stock-flow systems, starting with Layer 1 primitives and a food-stock template equivalent to the current Foundation food model.

## Problem Statement

Foundation now has a simple food stock-flow model: food production and food demand change one persistent food stock, and stock capacity clamps it. The model is small enough to reason about directly, but the game is about to accumulate more resource, population, capacity, and feedback systems. Those systems need a visual builder where named nodes can be assembled, tuned, simulated, inspected, saved, loaded, and iterated without hardcoding every experiment into `FoundationPage`.

The existing codebase already has a generic stock-flow runtime under `src/core/systems`, and Foundation has model-specific code under `src/games/foundation/domain`. The new dynamics page should not fork that logic into a separate toy simulator. It should define a serializable dynamics graph that can compile to the existing stock-flow runtime shape where practical, while using React Flow only for the editing canvas.

## Success Definition

- `/foundation/dynamics` resolves to a dedicated dynamics builder page, not the normal Foundation world page.
- The page supports named external input, parameter, math, activation, flow, stock, and probe nodes.
- Nodes have stable ids and editable names.
- Users can adjust external input and parameter values during simulation.
- Users can save, load, duplicate, delete, import, and export systems.
- The first template recreates the current food stock model from abstract primitives.
- The simulator records a tick trace with stock values, flow values, deltas, and overflow.
- The system graph schema is game-agnostic and does not bake in food, population, oil, metal, tiles, or troops.

## Non-Goals

- Do not replace Foundation's main runtime with the visual builder in the first pass.
- Do not build a multiplayer/shared persistence backend.
- Do not make every existing `src/core/systems/models/*` model editable on day one.
- Do not add population feedback, starvation, combat supply, or resource extraction beyond the initial food-stock template.
- Do not turn the dynamics page into player-facing UI.
- Do not use React Flow as the app framework; confine React to the graph canvas/page bridge.

## Constraints

- Work in a dirty tree without reverting unrelated changes.
- Keep the graph schema independent from React Flow's runtime objects so systems remain portable.
- Use localStorage first for saved systems and scenarios.
- Keep `/foundation` behavior unchanged while adding `/foundation/dynamics`.
- Account for the current broad Foundation route predicate in `src/client/Main.ts`.
- Preserve existing Foundation tuning and map cache localStorage keys.
- Prefer focused unit tests for graph schema, compilation, simulation, persistence, and route selection.

## Assumptions

- Adding `react`, `react-dom`, and `@xyflow/react` is acceptable because the user explicitly requested React Flow.
- The first implementation may mount a React Flow island from a Lit custom element rather than converting Foundation UI to React.
- The first persistence layer can be browser localStorage plus JSON import/export.
- The first visual editor can be developer-grade and does not need multiplayer collaboration, server sync, or polished player onboarding.

## Risk Posture

Medium-high. The stock-flow domain is well-contained, but introducing React/React Flow into a Lit/Vite codebase adds dependency, bundling, testing, and lifecycle risk. The safest path is to isolate React Flow behind a thin custom element and keep all graph schema, compilation, simulation, and persistence logic in framework-neutral TypeScript.

## Next Step

Use `PLAN.md` for execution sequencing. Do not implement until a wave or ticket is selected for execution.

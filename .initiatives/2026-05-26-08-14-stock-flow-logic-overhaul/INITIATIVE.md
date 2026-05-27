# Initiative: Stock-Flow Logic Overhaul

## Stack

- Language: TypeScript
- Package manager: npm
- Test runner: Vitest
- Build: TypeScript `tsc --noEmit` and Vite
- UI: Lit web components, Tailwind, Pixi renderer
- CI: GitHub Actions present under `.github/workflows/`

## Goal

Overhaul the current economy/population/resource logic into a deterministic
stock-flow systems layer where small class-based systems publish addressable
outputs, declare reads, contribute named flows, and let a runtime apply stock
deltas once per game tick.

## Problem Statement

OpenFront already has stock-flow-like behavior, but it is embedded across
`Config`, `PlayerExecution`, player update serialization, HUD logic, sandbox
diagnostics, and tests. Population growth, resource capacity, resource
regeneration, biomass support, and sandbox graphs are not all derived from a
single reusable model. This makes the next mechanics layer, explicit food
stocks, food consumption, wartime food pressure, starvation, and later systems
such as technology or soil, harder to add cleanly.

## Success Definition

The current population/resource behavior is represented through a reusable
stock-flow framework with addressable values and declared dependencies. Runtime
game ticks, tests, player updates, and sandbox diagnostics can use the same
system outputs. The first gameplay migration preserves existing behavior before
introducing explicit food consumption and war-driven demand.

## Non-Goals

- Do not import Vensim, XMILE, LunaSim, or another external simulation runtime.
- Do not add selectable solvers, final time, save periods, or separate
  simulation clocks.
- Do not split civilian population and military troops in the first migration.
- Do not expose player-facing configurable mechanics presets outside sandbox.
- Do not rework combat AI, attack mechanics, or resource trade behavior except
  where required to preserve compatibility with stock-flow outputs.

## Constraints

- One game tick is one model step.
- The runtime must remain deterministic and synchronous.
- Existing combat and AI call sites that depend on `maxTroops`,
  `troopIncreaseRate`, resources, and capacities need compatibility during
  migration.
- Sandbox/dev runs must remain isolated from achievements, archives, and stats.
- Mechanics changes should remain JSON-copy/paste friendly in sandbox.
- The first implementation should be small and typed, not a broad generic
  simulation platform.

## Assumptions

- Current troops remain the backing population stock until a later design pass
  intentionally splits population from military manpower.
- Existing `ResourceStockpile` bigint resources remain supported through an
  adapter while the stock-flow layer is introduced.
- `docs/StockFlowArchitectureAnalysis.md` is the source architecture direction
  for this initiative.
- `docs/PopulationFoodSystemsReport.md` is the design reference for the first
  food/population model.
- `docs/Economy.md` is stale and should be updated when the stock-flow model
  becomes the source of truth.

## Risk Posture

Medium-high. The target is conceptually clean, but the migration touches core
simulation behavior, bot balance, player updates, sandbox tooling, HUD
diagnostics, and tests. The safest path is an adapter-first migration that
proves parity before activating explicit food consumption.

## Next Step

Run planning for this initiative.

# Initiative: Systems Conversion And 1:1 Reintegration

## Stack

- Language: TypeScript
- Package manager: npm
- Test runner: Vitest
- Build: TypeScript `tsc --noEmit` and Vite
- UI: Lit web components, Tailwind, Pixi renderer
- Server/runtime: Node, Express, WebSocket worker/client split
- CI: GitHub Actions in `.github/workflows/ci.yml`

## Goal

Convert the canonical game simulation from the current `Execution`-driven
model to a systems-based runtime while preserving 1:1 gameplay behavior,
network update behavior, determinism, and test coverage. The conversion should
reintegrate existing stock-flow economy work, attack/battle simulation,
territory mutation, unit behavior, AI/nation behavior, and client update
serialization into a coherent system architecture.

## Problem Statement

OpenFront currently has two partially overlapping architecture directions.
The canonical game still runs through `GameImpl.executeNextTick()`, queued
`Execution` objects, direct mutation of `Game`, `Player`, `Attack`, and `Unit`
objects, and formulas spread across `Config`. The newer `src/core/systems`
folder contains a deterministic stock-flow runtime and economy models, but
those systems are mostly used behind compatibility wrappers and do not own the
main simulation loop.

This makes a full systems transition risky unless it is treated as a parity
and reintegration initiative rather than a mechanics redesign. A successful
conversion needs to preserve current behavior first, then let the systems
architecture become the source of truth.

## Success Definition

The canonical simulation can run through a systems scheduler with behavior
matching the pre-conversion execution model. Existing intents, AI behaviors,
attacks, troop/resource changes, territory changes, units, game updates,
hashing, and relevant client-visible state remain functionally equivalent.
Tests validate the equivalence at unit, system, integration, snapshot, and
scenario levels before legacy execution paths are removed.

## Non-Goals

- Do not rebalance combat, economy, AI, units, nukes, boats, trains, or warships
  as part of the conversion.
- Do not rename public gameplay concepts such as troops, attacks, resources, or
  player updates unless a compatibility layer preserves current callers.
- Do not remove `Execution` compatibility before parity coverage exists for the
  migrated behavior.
- Do not turn the stock-flow runtime into a generic external simulation engine.
- Do not change network protocol shape or client update semantics unless the
  change is explicitly proven equivalent or compatibility-preserving.

## Constraints

- One game tick remains the canonical simulation step.
- The simulation must remain synchronous, deterministic, and suitable for
  worker execution.
- Existing `Game`, `Player`, `Unit`, `Attack`, `Config`, and update APIs are a
  broad compatibility surface and cannot be broken casually.
- Current tests directly instantiate many `Execution` classes and call
  `game.addExecution(...)`; compatibility must survive long enough to migrate
  those tests safely.
- Combat and AI depend on current formulas, random ordering, attack state, and
  direct territory mutation patterns.
- Stock-flow systems currently operate on numeric stocks, while resources in
  gameplay are bigint-backed `ResourceStockpile` values.

## Assumptions

- The target architecture is an internal systems scheduler, not a third-party
  ECS or simulation framework.
- The first complete conversion should be behavior-preserving. New mechanics
  such as deeper supply, devastation, or food pressure should be activated only
  after parity is established.
- Existing `src/core/systems` work is the seed for the new architecture, but it
  is not yet sufficient for attacks, territory, units, AI, or updates.
- Legacy `Execution` objects can be adapted into command/event producers during
  the transition.
- Game hash comparisons, update snapshots, and deterministic scenario replay
  will be the strongest regression signal for 1:1 reintegration.

## Risk Posture

High. This initiative crosses the core tick loop, intent handling, attacks,
territory ownership, player economy, units, AI, serialization, and many tests.
The safest posture is an adapter-first, parity-first migration where systems
are introduced behind existing APIs, exercised against legacy behavior, and
only then promoted to the canonical execution path.

## Next Step

Run planning for this initiative.

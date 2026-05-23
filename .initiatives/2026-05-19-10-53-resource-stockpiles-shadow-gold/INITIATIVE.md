# Initiative: Resource Stockpiles Shadow Gold

## Stack
- Language: TypeScript
- Package manager: npm with `package-lock.json`
- Test runner: Vitest via `npm test`
- Build: Vite plus `tsc --noEmit` via `npm run build-dev` / `npm run build-prod`
- UI: Lit custom elements and WebGL renderer types
- CI: GitHub Actions under `.github/workflows/`

## Goal

Analyze the safest way to introduce Food, Energy, and Materials as first-class player stockpiles while preserving current balance exactly. In this first step, current gold-producing call sites should be swapped to pass a multi-resource payload where each resource receives the old gold amount, for example `{ food: 100n, energy: 100n, materials: 100n }`. Existing gameplay should remain mechanically equivalent while acquisition APIs begin moving from scalar `Gold` to `ResourceStockpile` / `ResourceDelta`.

## Problem Statement

Gold is currently a single `bigint` currency embedded through core player state, config economics, build costs, donations, trade, conquest, stats, game updates, renderer state, and UI affordance checks. The requested first step is not the full terrain-based resource economy. It is a compatibility abstraction that replaces scalar acquisition calls such as `owner().addGold(gold, tile)` with resource-payload calls such as `owner().addResources({ food: gold, energy: gold, materials: gold }, tile)`, without changing balance or player decisions yet.

## Success Definition

The codebase can represent each player's Food, Energy, and Materials stockpiles, and current acquisition paths award a full resource payload instead of a scalar gold amount. Existing gameplay remains functionally unchanged because the initial payload maps the old gold amount equally to all three resources. The resulting API shape is ready for later resource-specific income and costs.

## Non-Goals
- Do not add terrain-based resource production.
- Do not change unit/building balance.
- Do not redesign UI layout beyond what is needed to carry mirrored resource state.
- Do not remove gold permanently; keep it only where compatibility requires it or where later design still needs gold.
- Do not change AI strategy yet.
- Do not add market conversion, resource trade rules, or resource-specific costs yet.

## Constraints
- Gold is serialized in player updates, conquest updates, stats, and renderer types today.
- Current tests assert exact gold values across construction, donation, conquest, trade, stats, and update diffs.
- Replays and local single-player depend on deterministic game updates.
- The implementation should avoid touching every call site directly where a central abstraction can preserve behavior.

## Assumptions
- "Same amount of those resources" means a previous 10,000 gold acquisition now passes `{ food: 10000n, energy: 10000n, materials: 10000n }`.
- Acquisition call sites should move from scalar `addGold(gold, tile)` to payload-shaped `addResources(resources, tile)` first.
- `Gold` can remain available as a compatibility value for existing UI, stats, replays, and later design use, but it should no longer be the preferred acquisition payload.
- The safest implementation keeps old gold-facing APIs temporarily as wrappers while introducing resource-aware internals and migrated call sites.

## Risk Posture

Medium. The economic model is simple, but gold touches core deterministic state, rendering, replay serialization, AI affordability checks, and many tests. Migrating acquisition call sites to a resource payload is clearer than hiding everything behind `addGold`, but it has more surface area than a pure internal mirror. The safest path is to add the payload API, migrate the central acquisition paths, and keep scalar wrappers for compatibility while tests enforce equivalence.

## Next Step
Run planning for this initiative.

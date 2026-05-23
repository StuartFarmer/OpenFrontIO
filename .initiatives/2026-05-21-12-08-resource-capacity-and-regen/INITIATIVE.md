# Initiative: Resource Capacity And Regen

## Stack
- Language: TypeScript
- Package manager: npm with `package-lock.json`
- Test runner: Vitest through `npm test` / `npx vitest run`
- Build: Vite plus `tsc --noEmit` through `npm run build-dev` / `npm run build-prod`
- UI: Lit custom elements with renderer/view state mirrored through `PlayerView`
- CI: GitHub Actions under `.github/workflows/`

## Goal

Analyze how to make Food, Energy, and Materials behave more like troops/population: each resource should have a storage capacity derived from controlled area and Factory ownership, and passive resource regeneration should follow the same curve shape as troop regeneration, where growth accelerates until roughly 42% of capacity and then slows as the stockpile approaches capacity.

## Problem Statement

The current resource slice mirrors old gold income into three stockpiles and now supports passive resource gain without accumulating gold. It does not yet cap resources, does not calculate resource capacity, and does not make Factories meaningful as storage. Troops already have a mature capacity and regen model in `Config.maxTroops(...)` and `Config.troopIncreaseRate(...)`; resources need a parallel model without destabilizing gold-compatible construction, donations, trade, conquest, UI updates, and tests.

## Success Definition

The codebase has a clear resource-capacity model and a capped passive resource regeneration path. Resource stockpiles cannot pass their per-resource capacity through passive income, Factories increase capacity, controlled area contributes baseline capacity, and the regen curve shape matches troop growth semantics closely enough to be predictable and testable. The implementation remains compatible with the current staged migration where some gameplay still spends or displays gold.

## Non-Goals
- Do not add terrain-specific resource production in this slice.
- Do not add resource-specific building or unit costs in this slice.
- Do not remove gold from events, stats, replay fields, or construction affordability yet.
- Do not redesign the resource UI beyond showing values and possibly capacity if needed.
- Do not change AI strategy except where existing passive income and capacity calculations require safe behavior.

## Constraints
- Resource stockpiles are `bigint`, while troop regen and capacity are currently `number` based.
- Current `PlayerExecution` is the passive tick path for troops and resources.
- Current `addResources(...)` can still mirror to compatibility gold unless called with `{ updateGold: false }`.
- Construction, donation, conquest, trade, train rewards, stats, and UI still rely on gold-compatible behavior from the previous migration slice.
- Full `npm test` currently has unrelated client `localStorage` environment failures in `InputHandler.test.ts` and `SoundManager.test.ts`; targeted suites are the reliable validation signal unless that global issue is fixed separately.

## Assumptions
- All three resources can initially share the same capacity formula and regen curve.
- Factory contribution should use completed Factory levels only, mirroring how troop capacity ignores under-construction Cities.
- Controlled area means `player.numTilesOwned()`, consistent with `maxTroops(...)`.
- Passive income is the only acquisition path that should be capped by regen in this slice; conquest, trade, train, and donation behavior need separate product decisions before capping or rebalancing.
- “Same regen logic as troops” means the same mathematical shape, not necessarily the same units or literal output type.

## Risk Posture

Medium-high. The model can be implemented cleanly because troop capacity and regen already provide a strong pattern, but resources are `bigint`, are now visible in the UI, and still coexist with gold-compatible systems. The highest bug risk is mixing uncapped reward paths with capped passive regen in a way that creates inconsistent player expectations or silently reintroduces gold accumulation.

## Next Step
Run planning for this initiative.

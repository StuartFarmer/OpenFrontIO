# Initiative: Canonical Dynamics Cleanup

## Stack

- Language: TypeScript, with a separate Go map-generator module
- Package manager: npm
- Test runner: Vitest
- Build: Vite plus `tsc --noEmit`
- UI: Lit custom elements, React Flow mounted through a React island
- CI: GitHub workflows in `.github/workflows/`

## Goal

Analyze where the newly reconciled dynamics system still has cleanup debt,
legacy compatibility surfaces, transitional bridges/adapters, duplicate
stock-flow runtimes, and naming/module boundaries that prevent dynamics from
being the single canonical system for stock-flow mechanics.

## Problem Statement

The previous reconciliation made the current Foundation dynamics graph path
runtime-capable and integrated it into Foundation economy ticking. That solved
the immediate drift between editor graphs and gameplay behavior, but the code now
contains transitional layers: Foundation-prefixed canonical types, React Flow
editor state still acting as an editor save shape, legacy v1 persistence APIs,
fallback graph evaluators, formula parity helpers, a runtime adapter named as an
adapter, and an older `StockFlow*` runtime still powering core system models.

If those surfaces are left as-is, future systems may not know which dynamics
model is canonical, and new work can reintroduce ad hoc bridges instead of
authoring graph definitions directly.

## Success Definition

This analysis succeeds if it identifies:

- which code should become the canonical dynamics system surface;
- which compatibility layers should be deleted, renamed, or quarantined;
- where React Flow/editor state still leaks into model or persistence APIs;
- where older stock-flow code competes with the new dynamics graph runtime;
- which cleanup steps have the most leverage before further system migrations.

## Non-Goals

- Do not implement cleanup.
- Do not create waves, tickets, or acceptance criteria.
- Do not delete compatibility code during analysis.
- Do not change runtime behavior.
- Do not migrate OpenFront core gameplay systems in this analysis.

## Constraints

- The Foundation dynamics editor UX should remain intact.
- Runtime code must not depend on React Flow state.
- `GameSystemScheduler` remains the outer scheduler for graph-backed and
  imperative systems.
- The current Foundation economy runtime path is live and must be preserved until
  cleanup is planned and validated.
- Existing v1 saved dynamics JSON may still exist in users' local storage.

## Assumptions

- "Single canonical system for dynamics" means one canonical schema/compiler/
  runtime for stock-flow style graph systems, not forcing discrete commands,
  combat, AI, map mutation, or update emission into graphs.
- React Flow remains an acceptable UI bridge, but it should not define saved
  system shape or runtime inputs.
- Some older core `StockFlow*` code may remain useful, but only if it is absorbed
  behind the canonical dynamics surface or explicitly scoped as a lower-level
  implementation detail.

## Risk Posture

Medium-high. The highest-risk cleanup is the older core `StockFlow*` path because
it supports OpenFront population/resource models and config wrappers. Foundation
cleanup is lower risk but still important because the current adapter and legacy
storage naming can set the wrong precedent for future graph-backed systems.

## Next Step

Run planning for this initiative.

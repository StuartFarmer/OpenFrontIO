# Analysis Report: Foundation Troop Movement UX

## Executive Summary

- Highest impact: distance-click concentration is embedded in runtime frontier share calculation, so the UX change needs an explicit command-level front mode rather than a client-only pointer tweak.
- High impact: `wildernessDistanceFocus` is already the right maximum concentration sharpness control, while `wildernessFrontCapacity` should stay as the per-front speed saturation cap.
- Medium impact: current canvas drag is reserved for camera panning, so owned-territory attack drag needs careful gesture arbitration.
- Medium impact: preview overlays duplicate the distance weighting logic and will become misleading unless updated with the new broad-vs-focused model.

## Findings

### 1. Distance-click concentration is a runtime behavior, not just UI behavior

- Evidence: `FoundationPage` dispatches `createGrowTerritoryCommand` with only `targetTileRef` and `troopRatio` for post-placement clicks. The protocol only carries `targetTileRef` and `troopRatio` for `foundation.grow_territory`. `startWildernessExploration` then derives the intent from the target tile and `tickWildernessExploration` recomputes front shares from `createDistanceFrontShareMap`.
- Impact: If only pointer handling changes, runtime will still interpret every target tile as a concentration source.
- Recommendation: Add explicit front-control payload fields to `FoundationGrowTerritoryCommand`, such as `frontMode` and normalized `frontFocus`.
- Risk: Command shape changes require updates across protocol, command creation, router, tests, and any downstream assumptions.

### 2. Existing concentration and capacity controls map cleanly to the requested model

- Evidence: `distanceFrontWeight(distance, focus, referenceDistance)` sharpens Gaussian border weighting with `wildernessDistanceFocus`. `wildernessFrontVelocity` caps speed through `frontTroops / wildernessFrontCapacity`.
- Impact: The feature can reuse existing tuning concepts without inventing a parallel concentration system.
- Recommendation: Treat `wildernessDistanceFocus` as maximum concentration sharpness for drag focus. Keep `wildernessFrontCapacity` as movement saturation.
- Risk: The tuning label and mechanic breakdown currently describe click-distance focus, so leaving text unchanged will mislead designers.

### 3. Normal click currently conflicts with the desired OpenFront-style broad push

- Evidence: `createDistanceFrontShareMap` scans all owned border tiles, measures distance to the clicked target, normalizes Gaussian weights, and `distancePriorityPenalty` favors higher-share front tiles.
- Impact: A normal click near any side of the territory necessarily creates a concentrated local front instead of equal pressure from all sides.
- Recommendation: For `frontMode: "uniform"`, assign equal shares over eligible border tiles and keep target tile only as the exploration direction/event target.
- Risk: Broad push may claim more simultaneous tiles than current focused click behavior unless front capacity and troop-share allocation preserve existing velocity limits.

### 4. Camera drag and attack drag share the same pointer path

- Evidence: `handleCanvasPointerDown`, `handleCanvasPointerMove`, and `handleCanvasPointerUp` currently track `dragPointerId` and pan the renderer once movement passes `FOUNDATION_DRAG_THRESHOLD_PX`.
- Impact: Click-drag attack cannot be added as a simple extra listener; it must decide whether the gesture starts inside owned territory and then route to attack-preview/dispatch or camera panning.
- Recommendation: Add a drag mode state, for example `"pan"` vs `"attack"`, selected on pointer down by the start tile owner and build-placement state.
- Risk: Poor arbitration could make map panning feel broken when starting on owned territory, especially for users who habitually drag the map from their land.

### 5. Directional preview overlays duplicate current distance weighting

- Evidence: `FoundationPage` builds border heat maps and vector overlays using `distanceFrontWeight` and `wildernessDistanceFocus`.
- Impact: Without updates, previews will show old distance-click semantics after the runtime changes.
- Recommendation: Update previews to show uniform heat for click hover and focused heat during attack drag, using the same normalized front focus as the command.
- Risk: Preview/runtime drift is likely if weighting math remains duplicated without a shared helper.

## Quick Wins

- Add protocol fields with defaults that preserve current command compatibility while tests migrate.
- Extract front-share calculation into named helpers for uniform and focused modes.
- Rename or re-describe UI copy for `wildernessDistanceFocus` as maximum concentration rather than click-distance focus.

## Medium Changes

- Implement owned-territory attack drag gesture state in `FoundationPage`.
- Add normalized sigmoid drag-distance calculation with max-distance clamping.
- Update runtime tests for uniform click and focused drag behavior.
- Update preview heat/vector rendering to distinguish click and drag semantics.

## High-Risk Decisions

- Whether dragging from owned territory should disable camera panning in that gesture, or whether a modifier/right-drag remains needed for panning from owned land.
- Whether maximum drag distance should be a fixed tuning setting, derived from the player's current border size, or computed from a map/viewport scale.
- Whether `wildernessDistanceFocus` should be renamed in settings/storage or only reinterpreted in code and UI text.

## Guardrails

- Keep `wildernessFrontCapacity` behavior and tests focused on velocity saturation.
- Keep command payloads deterministic and serializable.
- Keep plain click broad even when the click target is close to a specific border.
- Keep focused drag capped so dragging beyond the max distance has no additional effect.
- Add tests around both behavior modes before tuning visual polish.

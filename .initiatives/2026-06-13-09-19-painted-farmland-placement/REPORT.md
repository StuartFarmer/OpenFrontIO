# Analysis Report: Painted Farmland Placement

## Executive Summary

- Current build placement is single-shot and clears normal ghosts after one placement; paint mode needs explicit state instead of overloading normal structure behavior.
- Existing unit/buildable plumbing can support Farmland, but 1x1 painted placeables need a crisp contract around validation, duplicates, cost, upgrades, and rendering.
- Input handling currently reserves left-drag for camera movement/selection and right-click for context menus; paint mode must intercept these paths only while active.
- A bottom build UI already exists/planned, so Farmland should integrate there in the final wave after the placement mode and model are stable.

## Findings

### 1. Single-placement ghost flow is the core behavior to extend

- Evidence: `src/client/controllers/BuildPreviewController.ts` mirrors `uiState.ghostStructure`, validates hovered buildables, emits `BuildUnitIntentEvent`, and clears normal structure ghosts after placement. Only nukes preserve ghost state via `shouldPreserveGhostAfterBuild`.
- Impact: Farmland painting cannot be implemented as a plain normal structure without either clearing after the first tile or making all similar types preserve ghost state incorrectly.
- Recommendation: Add an explicit placement mode/metadata concept for paintable 1x1 placeables and keep normal structure placement unchanged.
- Risk: If paint mode shares too much implicit state with ghost placement, cancellation and cursor behavior will regress for existing buildings.

### 2. Input routing must distinguish paint drag from camera drag

- Evidence: `src/client/InputHandler.ts` emits `DragEvent` during normal left-drag and `MouseUpEvent` only for low-movement clicks. Shift/long-press paths reserve drag for warship selection.
- Impact: Holding the mouse to paint will currently pan the map instead of placing repeated tiles.
- Recommendation: Add paint-mode input events or controller state that consumes left pointer movement while a paintable unit is selected, emits tile-confirm attempts while moving, and leaves default drag behavior intact outside paint mode.
- Risk: Poor routing can break map panning, selection boxes, or touch long-press behavior.

### 3. Right-click already cancels ghosts before opening context menus

- Evidence: `InputHandler.onContextMenu` prevents default, clears `uiState.ghostStructure` when present, and returns before emitting `ContextMenuEvent`.
- Impact: This is close to the requested right-click cancel behavior, but paint mode needs its own cancellation state and should not leak a radial menu after cancellation.
- Recommendation: Reuse the existing cancellation pattern with a paint-mode flag/event and verify that the first right-click cancels paint mode without opening the radial menu.
- Risk: If Farmland only sets `ghostStructure`, right-click may cancel the preview but leave cursor/stroke state behind.

### 4. Existing buildable unit groups are structure-oriented

- Evidence: `src/core/game/Game.ts` defines `Structures`, `BuildMenus`, and `PlayerBuildable`; `PlayerImpl.canSpawnUnitType` routes structure types through `landBasedStructureSpawn`; `Config.unitInfo` and `unitResourceCost` contain per-unit cases.
- Impact: Adding Farmland touches core type definitions, build validation, costs, stats/serialization paths, renderer metadata, translations, and disabled-unit settings.
- Recommendation: Add Farmland deliberately to the correct buildable groups and use tests to pin disabled-unit behavior, cost accounting, duplicate placement rejection, and owned-land validation.
- Risk: Missing one enum/config/update path can compile but fail at runtime or render incorrectly.

### 5. Bottom build integration should follow the placement contract

- Evidence: `src/client/hud/layers/UnitDisplay.ts` already renders bottom build buttons tied to `uiState.ghostStructure`; `.initiatives/2026-06-13-09-14-rts-bottom-build-bar` is planning a bottom RTS build bar for building commands.
- Impact: Farmland should not be buried in the old `BuildMenu`; however, coupling it to an unfinished bottom bar first could block core placement work.
- Recommendation: Build Farmland placement independently behind a metadata-backed command, then integrate into the bottom build UI as the last wave.
- Risk: Duplicating a second bottom command surface would create confusing overlapping UI ownership.

## Quick Wins

- Introduce a `PlacementMode` or build metadata helper that marks Farmland as `paintable` and `footprint: "1x1"`.
- Preserve the existing ghost hover renderer and add a paint cursor only while the selected unit is paintable.
- Suppress duplicate placement attempts for the last painted tile in a stroke.

## Medium Changes

- Add Farmland to `UnitType`, `UnitParamsMap`, config, disabled-unit settings, translations, and renderer/state handling.
- Add paint-specific input events and controller handling for pointer-down/move/up without disturbing normal drags.
- Add focused Vitest coverage for validation, affordability, duplicate rejection, and paint-mode state transitions.

## High-Risk Decisions

- Whether Farmland is a `UnitType` rendered through existing unit updates or a separate tile-overlay domain model.
- Whether painting should send one `build_unit` intent per tile or introduce a batched placement intent.
- Whether Farmland produces food immediately, after construction, or is initially visual/placeable only.

## Guardrails

- Keep authoritative validation in core player/game logic.
- Do not add Farmland to old right-click build lists as the primary entry point.
- Keep non-paint unit placement behavior identical unless a test or acceptance check explicitly changes it.
- Coordinate final UI placement with the existing bottom-build-bar initiative rather than creating a parallel permanent bar.

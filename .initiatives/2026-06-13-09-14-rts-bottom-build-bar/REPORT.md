# Analysis Report: RTS Bottom Build Bar

## Executive Summary

- The existing ghost placement path is a strong fit for a traditional RTS bottom bar; it already supports selecting a build type, previewing placement, validating buildability, confirming on click/Enter, and cancelling on Escape.
- The current right-click build path is split across `InputHandler`, `BuildMenu`, `MainRadialMenu`, and `RadialMenuElements`, so removing build from the contextual menu must be done deliberately without breaking attack/diplomacy/boat actions.
- Missing building concepts are not part of this initiative. The work should focus on moving existing buildables to a persistent command surface.

## Findings

### 1. Build Placement Already Has A Reusable Ghost State Machine

- Evidence: `src/client/controllers/BuildPreviewController.ts` mirrors `uiState.ghostStructure`, queries `myPlayer().buildables(...)`, renders ghost preview data, emits `BuildUnitIntentEvent`, emits `SendUpgradeStructureIntentEvent`, and clears or preserves ghost state after confirmation.
- Impact: A bottom build bar can avoid duplicating placement logic by setting `uiState.ghostStructure` to the selected building type.
- Recommendation: Build the bar as a selector/controller over `UIState`, not as a direct construction surface.
- Risk: The current create flow initializes ghost units with zero cost until the first buildables query completes, so the bar must handle temporary unknown cost/disabled states cleanly.

### 2. Existing Build Menu Is Tile-Anchored And Modal-Oriented

- Evidence: `src/client/hud/layers/BuildMenu.ts` listens for `ShowBuildMenuEvent`, converts the event position to a tile, stores `clickedTile`, queries `BuildMenus.types`, and renders a centered `.build-menu` surface with all current build options.
- Impact: This component cannot become a persistent bottom bar without changing its core interaction contract.
- Recommendation: Create a dedicated bottom build bar component or heavily refactor `BuildMenu` into reusable build-item helpers plus a new persistent surface.
- Risk: Reusing `BuildMenu` directly could carry modal assumptions such as hiding on every `MouseDownEvent`.

### 3. Right-Click Radial Menu Owns The Current Contextual Build Entry

- Evidence: `src/client/hud/layers/RadialMenuElements.ts` includes `buildMenuElement` in `rootMenuElement` for owned territory, builds submenu entries from `Structures.types`, and calls `params.buildMenu.sendBuildOrUpgrade(buildableUnit, params.tile)`.
- Impact: The right-click menu will continue to expose the old build mechanism unless the build element is removed or gated.
- Recommendation: Remove `buildMenuElement` from owned-territory radial menu entries for this initiative, while leaving delete/alliance/info and non-owned contextual actions intact.
- Risk: Players may lose an immediate tile-anchored upgrade path unless the bottom bar plus ghost preview clearly supports upgrades.

### 4. Input Routing Already Reserves Normal Clicks For Ghost Confirmation

- Evidence: `InputHandler` emits `MouseUpEvent` for normal map clicks when menus are not opened, cancels ghost state on right-click/context menu, and `BuildPreviewController` consumes `MouseUpEvent` when a ghost structure is active.
- Impact: Bottom-bar buttons should not emit map build intents directly; they should enter ghost mode and let the next map click place.
- Recommendation: Buttons should stop event propagation, set `uiState.ghostStructure`, and visually show the active selection.
- Risk: If HUD button clicks leak to the canvas, they may trigger map actions; tests should cover event isolation.

### 5. Existing Buildables Are The Scope Boundary

- Evidence: `src/core/game/Game.ts` defines the current `Structures`, `BuildableAttacks`, and `BuildMenus` groups.
- Impact: The bottom bar can proceed without model work by rendering the existing buildable set and respecting `config.isUnitDisabled(...)`.
- Recommendation: Do not add or rename core units in this initiative. If a later product pass wants new resource-specific buildings, handle that as a separate mechanics initiative.
- Risk: If the bottom bar hard-codes a narrow list, it can drift from existing build rules and disabled-unit configuration.

## Quick Wins

- Add a new bottom-bar component that sets `uiState.ghostStructure` for existing buildable types.
- Remove the owned-territory build submenu from the radial menu.
- Reuse `renderResourceCostText(...)`, HUD buttons, and existing ghost preview affordances.

## Medium Changes

- Add tests around existing buildable filtering, active selection, and event isolation.
- Move shared build item metadata out of the modal-oriented `BuildMenu` if duplication grows.

## High-Risk Decisions

- Whether the bottom bar displays every current `BuildMenus` entry or only structure buildables from `Structures`.
- Whether keyboard shortcuts should remain as-is or be visually reflected in the new bottom bar.

## Guardrails

- Keep build validation authoritative in `PlayerView.buildables(...)` and core game config.
- Keep bottom-bar UI state separate from radial menu state.
- Do not regress Escape, Enter, right-click cancel, or normal attack click behavior.
- Test both the command surface and the existing `BuildPreviewController` contract.

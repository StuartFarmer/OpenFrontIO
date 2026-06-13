# Initiative: Painted Farmland Placement

## Stack

- Language: TypeScript
- Package manager: npm
- Test runner: Vitest
- Build: Vite plus `tsc --noEmit`
- UI: Lit Web Components, HUD custom elements, WebGL renderer
- CI: GitHub Actions inferred from repository conventions

## Goal

Add a new class of 1x1 building/unit placement, beginning with Farmland, that places by painting over owned tiles while the mouse is held. The user selects Farmland from the new bottom build UI, sees the existing tile hover/ghost affordance plus a paint-brush cursor, left-drags to place multiple 1x1 squares, and right-clicks or presses Escape to cancel paint mode.

## Problem Statement

Current construction is modeled as discrete unit placement. `BuildPreviewController` tracks one `uiState.ghostStructure`, validates the hovered tile, emits one `BuildUnitIntentEvent`, and then clears the ghost for normal structures. `InputHandler` treats left drag as camera movement or selection, and right-click currently cancels ghost placement before opening context actions. Farmland needs a repeatable, tile-by-tile paint interaction without breaking camera drag, click placement, radial menus, or the existing ghost preview path.

## Success Definition

- Farmland is represented as a first-class 1x1 placeable/buildable type with validation, cost, disabled-unit config, serialization/update, and tests.
- Selecting Farmland enters paint placement mode from the bottom build UI, not from the right-click build menu.
- Hover feedback remains tile-based and shows whether the current tile can receive farmland.
- Holding left mouse and moving across valid owned tiles places farmland repeatedly, with duplicate-tile suppression and affordability/validity checks per tile.
- Releasing left mouse ends the active stroke but keeps paint mode selected unless cancelled by right-click, Escape, or selecting a different tool.
- Right-click cancels the paint action before opening radial/context actions, and the cursor changes to a paint brush while paint mode is active.
- The final wave integrates Farmland into the new bottom building UI so it is discoverable with other build commands.

## Non-Goals

- Adding every future 1x1 building type.
- Redesigning the whole economy around farmland output.
- Replacing the existing structure ghost renderer for non-paint buildings.
- Removing all right-click menu behavior outside the specific build-entry path.
- Implementing mobile/touch painting beyond preserving existing touch behavior safely.

## Constraints

- Reuse existing player build validation and intent transport where possible.
- Do not duplicate authoritative build rules in the client HUD.
- Preserve camera panning and selection behavior for non-paint modes.
- Avoid treating farmland as an upgradable large structure unless explicitly chosen later.
- Coordinate with `.initiatives/2026-06-13-09-14-rts-bottom-build-bar`, which is already planning a bottom build surface.

## Assumptions

- Farmland should initially be a 1x1 land-based owned-territory placeable with no upgrade path.
- Farmland can use the existing `BuildUnitIntentEvent`/`build_unit` intent unless batching is later required for performance.
- Painting should emit one build intent per newly visited valid tile in the first implementation; a batch intent can be a follow-up if network pressure becomes measurable.
- The visual can start as a renderer-side 1x1 tile/sprite treatment and does not require a complex animated asset.

## Risk Posture

Medium-high. The core farmland type is routine, but paint placement crosses input handling, ghost preview state, cursor management, repeated network intents, WebGL visuals, and the emerging bottom build UI. The safest path is to land the 1x1 placeable contract first, then layer a narrowly scoped paint placement mode on top of existing validation.

## Next Step

Execute W0 to settle the 1x1 placeable contract and farmland gameplay semantics before changing input behavior.

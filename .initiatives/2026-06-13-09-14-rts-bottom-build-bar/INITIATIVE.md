# Initiative: RTS Bottom Build Bar

## Stack

- Language: TypeScript
- Package manager: npm
- Test runner: Vitest
- Build: Vite plus `tsc --noEmit`
- UI: Lit Web Components, HUD shell slots, custom HUD components
- CI: GitHub Actions inferred from repository conventions

## Goal

Replace the current right-click build-menu interaction with a persistent bottom-screen RTS-style build bar that exposes existing buildable units already supported by the game.

## Problem Statement

The current building flow is hidden behind contextual menu interactions. `InputHandler` emits `ShowBuildMenuEvent` when the build modifier is used, `BuildMenu` opens as a centered modal for a clicked tile, and `RadialMenuElements` exposes a right-click build submenu for owned territory. This is discoverable only after interacting with the map and does not match traditional RTS muscle memory, where available build options are visible in a persistent command bar and selection starts a placement preview.

## Success Definition

- A persistent bottom build bar is visible during active gameplay and hidden or disabled during spawn/dead states.
- The bar uses the existing buildable unit set, filtered by current config-disabled rules.
- Selecting a building enters ghost placement mode using the existing `BuildPreviewController` path.
- Clicking a valid map tile places or upgrades through existing build intent events and validation.
- The right-click radial menu no longer exposes building construction as the primary build mechanism.
- Keyboard and Escape behavior remain coherent with existing ghost structure handling.

## Non-Goals

- Rebalancing resource production or storage.
- Reworking attacks, boats, diplomacy, emoji, or other radial menu actions.
- Replacing the whole HUD shell.
- Adding new unit types.
- Redesigning renderer-side structure glyphs.

## Constraints

- Reuse existing build validation and placement infrastructure where possible.
- Do not duplicate server/game rules in the HUD.
- Preserve existing map click behavior for attack, spawn, camera drag, and ghost placement.
- Bottom UI must not obscure critical gameplay overlays more than the existing bottom HUD composition already does.
- The name `Silo` currently exists as a resource-capacity structure, while `MissileSilo` is a separate nuke structure.
- This initiative should not depend on any missing building type.

## Assumptions

- `UnitType.Silo` remains the current resource-capacity silo unless a later initiative changes naming or mechanics.
- Missing building concepts are intentionally out of scope.
- The current right-click radial menu should remain for non-build contextual actions.
- The bottom build bar should select a ghost placement type, not immediately build on the tile under the cursor.

## Risk Posture

Medium-low. The change is mostly client UI/input behavior because it reuses existing buildables and the existing ghost placement controller. The main risk is interaction regression around map clicks, right-click cancellation, and radial menu actions.

## Next Step

Implement the bottom-bar command surface using the existing ghost placement flow.

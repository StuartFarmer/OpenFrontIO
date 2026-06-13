# Initiative: Foundation Troop Movement UX

## Stack

- Language: TypeScript
- Package manager: npm
- Test runner: Vitest
- Build: `tsc --noEmit` and Vite via `npm run build-dev` / `npm run build-prod`
- UI: Lit web components for Foundation UI, WebGL canvas rendering for map presentation
- CI: GitHub Actions under `.github/workflows/`

## Goal

Replace Foundation's distance-click troop movement UX with OpenFront-style equal border push on normal click and click-drag concentrated fronts whose concentration scales smoothly with drag distance from the player's border.

## Problem Statement

Foundation currently uses the clicked target tile to determine both attack direction and front tightness. Close clicks produce narrow fronts because border troop shares are weighted by Gaussian distance to the click target. This makes click distance carry too much hidden meaning and diverges from the original OpenFront feel, where a normal click produces a broad, equal push from all sides.

## Success Definition

Plain click after player placement starts broad wilderness expansion with equal troop pressure across the player's current land border. Click-drag from inside owned territory starts a targeted expansion where drag distance controls concentration up to a configured maximum, with `wildernessDistanceFocus` serving as the maximum concentration sharpness and `wildernessFrontCapacity` continuing to cap per-front movement speed.

## Non-Goals

- Reworking troop economy, attack ratio, terrain speed, attrition, or food-supported troop capacity.
- Replacing the wilderness exploration simulation with original OpenFront combat logic.
- Adding multiplayer networking beyond the existing Foundation command envelope shape.
- Redesigning unrelated Foundation tuning panels or map generation controls.

## Constraints

- Preserve deterministic runtime behavior through command payload fields rather than client-only state.
- Keep existing map rendering and Foundation runtime architecture intact.
- Avoid breaking player placement and build placement pointer behavior.
- Keep camera panning available where it does not conflict with owned-territory attack drag.

## Assumptions

- `wildernessDistanceFocus` is the intended maximum concentration parameter for focused fronts.
- `wildernessFrontCapacity` should remain a speed saturation parameter, not be repurposed as a UX concentration control.
- Drag concentration should be computed by the client and sent as normalized command data so runtime tests can assert behavior without DOM input.
- Normal click should still use the clicked tile as an exploration target/direction, but not as a concentration control.

## Risk Posture

Moderate. The change crosses client pointer handling, command payloads, domain frontier weighting, tuning descriptions, and tests. It is contained to the Foundation module, but the current implementation has behavior-specific runtime tests that must be intentionally rewritten.

## Next Step

Run planning for this initiative.

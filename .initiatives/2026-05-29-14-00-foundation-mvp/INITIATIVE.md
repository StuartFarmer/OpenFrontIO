# Initiative: Foundation MVP

## Stack
- Language: TypeScript.
- Package manager: npm.
- Test runner: Vitest.
- Build: Vite plus `tsc --noEmit`.
- UI: Lit custom elements and the existing custom WebGL2 renderer.
- CI: GitHub Actions under `.github/workflows/`.

## Goal
Create the first internal non-OpenFront game module, `foundation`, as a minimal single-player prototype that proves blank-map placement and rendering without inheriting OpenFront gameplay mechanics.

## Problem Statement
The parent initiative, `.initiatives/2026-05-29-13-44-engine-sdk-game-modules/`, establishes the target architecture: engine lifecycle and primitives are shared, while games own their mechanics, schemas, client UI, and semantics. Foundation is the first proof that this can work.

The current codebase renders and simulates OpenFront through OpenFront-specific contracts. `GameRunner` creates OpenFront maps, nations, players, executions, win checks, and railroad recomputation. `ClientGameRunner` constructs `WorkerClient`, `GameView`, OpenFront HUD composition, `InputHandler`, and a WebGL frame builder. The renderer path itself is useful, but the live frame derivation and HUD shell assume units, alliances, structures, spawn phase, railroads, nukes, and OpenFront player fields.

Foundation should start small: a generated grass tile map, one plain `Player` record, click-to-place, fixed-radius tile ownership, and a tiny debug panel. Population and food are explicitly deferred until placement and rendering are stable.

## Success Definition
- `src/games/foundation` exists as the Foundation module home.
- Foundation can generate a blank semantic-free tile map and expose module-owned terrain queries.
- Foundation can represent one plain `Player` record and claim a fixed radius of tiles after a click.
- Foundation can render terrain and ownership through the existing custom WebGL renderer via a minimal adapter.
- Foundation has a small debug panel showing placement/rendering state.
- Foundation runs single-player first while keeping command/update envelopes compatible with the parent engine-module direction.
- The MVP does not implement or import OpenFront buildings, alliances, warships, diplomacy, bots, nations, win checks, or population/food ticking.

## Non-Goals
- Do not implement population or food ticking in the first MVP.
- Do not introduce ECS/entity-component storage.
- Do not make Foundation implement OpenFront `Game`, `Player`, or `Unit`.
- Do not move OpenFront into `src/games/openfront` in this initiative unless it is strictly required by Foundation.
- Do not implement multiplayer networking for Foundation yet.
- Do not replace the custom WebGL renderer or use Pixi for Foundation.
- Do not migrate all OpenFront updates to the generic update envelope here; use only the small Foundation-native shape needed for this MVP.

## Constraints
- Write the implementation under `src/games/foundation` where practical.
- Start single-player first.
- Start with click-to-place only; deterministic auto-start placement comes later.
- Placement claims a fixed radius around the clicked tile.
- Prove placement and rendering before population/food simulation.
- Include a small debug panel from the start.
- Use plain `Player` records.
- Use a semantic-free `EngineTileMap`-style primitive: dimensions, refs, terrain buffer, and state buffer only.
- Put terrain meaning in module-owned queries such as `FoundationTerrain`, not in the base map.
- Use the custom WebGL renderer path through a minimal adapter.
- Preserve a later multiplayer path by keeping command envelopes, update envelopes, turn sequencing, and transport boundaries explicit.
- Work in a dirty tree without reverting unrelated changes.

## Assumptions
- A first route such as `/foundation` or `/sandbox/foundation` is acceptable for launching the prototype.
- Foundation may use a local single-player runtime first, as long as the runtime shape mirrors future worker/message-passing boundaries.
- The existing renderer's `PlayerStatic` and tile-state palette expectations may be isolated inside the Foundation WebGL adapter even though those renderer types are still OpenFront-flavored.
- The blank grass map can reuse the low-level terrain byte convention where `1 << 7` renders as land/grass-like terrain, while Foundation terrain semantics remain module-owned.
- The first map size can be small and fixed, with config-driven sizing added later.

## Risk Posture
Medium. The MVP is intentionally narrow, but it touches boundaries that are currently coupled to OpenFront. The largest risk is accidentally building Foundation on OpenFront-specific `GameView`, `InputHandler`, or `GameRunner` APIs instead of isolating compatibility in a small adapter.

## Next Step
Execute the plan in `PLAN.md` wave by wave. Do not start implementation until the plan is accepted or explicitly selected for execution.

## Clarified Decisions
- The first blank map size should be `256x256`.
- Click-to-place should claim a fixed radius of 10 tiles around the clicked tile.
- The debug panel should show only real values we currently want to inspect. Do not add placeholder population/food fields before those systems exist.
- The route should be `/foundation`.

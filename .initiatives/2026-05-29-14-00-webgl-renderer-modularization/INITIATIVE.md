# Initiative: Custom WebGL Renderer Modularization

## Stack
- Language: TypeScript, GLSL shader source imported through Vite `?raw`.
- Package manager: npm.
- Test runner: Vitest.
- Build: Vite plus `tsc --noEmit` through `npm run build-dev` / `npm run build-prod`.
- UI: Lit custom elements for HUD, custom WebGL2 renderer for the map, Tailwind CSS.
- CI: GitHub Actions under `.github/workflows/`.

## Goal
Make the existing custom WebGL2 renderer reusable by the upcoming Foundation game module through a small module-owned adapter, without forcing Foundation to inherit OpenFront-specific frame derivation, HUD composition, units, structures, railroads, nukes, alliances, or radial-menu assumptions.

The first reusable slice should cover:

- Static terrain rendering from terrain bytes.
- Ownership rendering from a `Uint16Array` tile-state buffer.
- Camera resize/sync and map framing.
- Click-to-place support by translating screen coordinates to tile references.

## Problem Statement
The renderer is already factored better than the rest of the client: `src/client/render/gl/GameView.ts` is a public facade over `GPURenderer`, and `src/client/render/frame/Upload.ts` uses structural typing for upload targets. However, the live integration path is still OpenFront-shaped.

`ClientGameRunner` creates the WebGL canvas, extracts terrain through OpenFront `TerrainMapData`, synchronizes camera state through OpenFront `TransformHandler`, mounts the OpenFront HUD shell, installs the OpenFront `InputHandler`, and feeds renderer data through `WebGLFrameBuilder`. `WebGLFrameBuilder` reads OpenFront `GameView`, `PlayerView`, spawn-phase data, terrain mutations, cosmetics, and player colors before calling `uploadFrameData()`. `FrameData` and `FrameUploadTarget` carry OpenFront concepts such as units, structures, trails, railroads, nuke telegraphs, attack rings, relation matrices, alliance clusters, player status, and conquest/bonus events.

Foundation should not have to fake those fields to render a blank grass map and a claimed tile radius. The renderer needs a minimal shared surface and a Foundation adapter that can drive only the passes Foundation needs, while OpenFront keeps its current full renderer integration.

## Success Definition
The codebase has a planned path where:

- OpenFront continues using the current custom WebGL renderer without behavior changes.
- Foundation can mount the same WebGL canvas/facade through a module-owned adapter that uploads terrain and tile ownership only.
- The reusable renderer API is expressed in engine-neutral terms such as map dimensions, terrain bytes, tile state buffers, palette data, camera state, and pointer-to-tile conversion.
- OpenFront-only frame derivations remain behind an OpenFront adapter and are not required by Foundation.
- The path from the minimal Foundation adapter to richer renderer use is explicit: add optional pass groups or adapters as module needs appear.

## Non-Goals
- Do not replace the custom WebGL renderer with Pixi or another renderer.
- Do not rewrite every render pass in one step.
- Do not remove OpenFront HUD, controllers, replay support, or render effects in this initiative.
- Do not make Foundation implement OpenFront `GameView`, `PlayerView`, `UnitState`, diplomacy, railroads, nukes, or structures just to render.
- Do not implement Foundation population/food simulation here. Foundation MVP can build on this later.

## Constraints
- Write no implementation in this initiative; this is analysis and planning only.
- Preserve existing OpenFront imports and tests during implementation.
- Work in a shared dirty worktree and do not revert unrelated changes.
- Keep the first reusable renderer slice narrow enough to validate with terrain, ownership, camera, and click-to-place.
- Keep terrain semantics module-owned. The renderer may accept terrain bytes and color encoders, but it should not define game meanings such as land, lava, fertility, or passability.

## Assumptions
- Foundation will use the existing WebGL renderer, not Pixi, for its first renderer path.
- Foundation starts single-player/local and click-to-place only.
- Foundation claims a fixed radius around the clicked tile, but simulation rules are outside this renderer initiative.
- Foundation starts under `src/games/foundation` if that is easier, while renderer primitives can remain under `src/client/render` until shared engine folders emerge.
- OpenFront's current `FrameData` remains available as a compatibility path during early migration.

## Risk Posture
Medium. The renderer has useful boundaries, but `GPURenderer` eagerly constructs many OpenFront-specific passes and `FrameData` requires many OpenFront fields. The safest plan is to add a minimal renderer adapter path beside the existing OpenFront path first, then progressively split pass groups and frame contracts where Foundation proves the need.

## Next Step
Execute the plan in `PLAN.md`. Do not implement renderer changes until the related protocol/module initiatives agree on where the Foundation module will mount and how it will receive updates.

## Clarified Decisions
- Foundation can build a thin adapter against the current renderer first; renderer modularization can follow.
- OpenFront and Foundation should converge on the same base visuals.
- Visual parity between OpenFront and Foundation base map rendering matters; both should use the same base terrain/ownership rendering semantics where possible.
- The key design choice remains whether to drive the full `GPURenderer` with unused passes disabled or extract a smaller base renderer first.

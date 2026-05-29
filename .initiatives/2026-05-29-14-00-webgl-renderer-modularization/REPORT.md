# Analysis Report: Custom WebGL Renderer Modularization

## Executive Summary
- The reusable core is visible: a WebGL facade, camera object, terrain pass, territory pass, structural upload target, and long-lived tile buffers already exist.
- The current integration path is still OpenFront-specific because `ClientGameRunner`, `WebGLFrameBuilder`, `FrameData`, and `GPURenderer` assume OpenFront players, units, structures, railroads, trails, nukes, alliances, spawn phase, and HUD controllers.
- Foundation should start with a dedicated renderer adapter that bypasses OpenFront frame derivation and drives only terrain, ownership, camera, and click-to-place.
- The first implementation should preserve OpenFront behavior and create a parallel minimal path. Deeper pass modularization should come after Foundation proves the minimal path.

## Findings

### 1. The WebGL canvas and frame loop are created inside OpenFront client startup
- Evidence:
  - `createWebGLView()` is local to `src/client/ClientGameRunner.ts:292` and extracts terrain bytes from `TerrainMapData.gameMap` through `terrainByte(ref)` at `src/client/ClientGameRunner.ts:297`.
  - It constructs `WebGLGameView` with `ALL_UNIT_TYPES`, `maxPlayers: 1024`, and an empty OpenFront player header in `src/client/ClientGameRunner.ts:331`.
  - `createClientGame()` always constructs OpenFront `Config`, `WorkerClient`, and client `GameView` before creating the WebGL view in `src/client/ClientGameRunner.ts:459` and `src/client/ClientGameRunner.ts:475`.
  - The same function then mounts OpenFront `createRenderer()` and `InputHandler` in `src/client/ClientGameRunner.ts:535` and `src/client/ClientGameRunner.ts:554`.
- Impact:
  - Foundation cannot reuse WebGL rendering without entering the OpenFront client game path.
  - The current renderer mount point is not available as a module-owned service.
- Recommendation:
  - Extract a `WebGLMapSurface` or equivalent factory that accepts dimensions, terrain bytes, initial tile state, palette, and RAF control.
  - Keep `ClientGameRunner` as the OpenFront caller, but allow Foundation to call the same factory without OpenFront `GameView`.
- Risk:
  - Camera synchronization is tied to `TransformHandler`. The first extraction should keep behavior stable by preserving the existing OpenFront camera loop and adding a Foundation-specific minimal camera controller separately.

### 2. `GameView` is a useful facade but exposes a full OpenFront renderer vocabulary
- Evidence:
  - `src/client/render/gl/GameView.ts:1` describes the facade as wrapping `GPURenderer` and `Camera`.
  - Camera and coordinate operations are reusable: `screenToWorld()`, `worldToScreen()`, `fitMap()`, `focusBBox()`, and `setCameraState()` are exposed in `src/client/render/gl/GameView.ts:135`.
  - Data upload methods include reusable tile ownership operations at `src/client/render/gl/GameView.ts:194`, but also OpenFront-specific units, structures, railroads, nuke trajectories, attack rings, spawn overlay, SAM radius, radial menu, and warship selection methods through `src/client/render/gl/GameView.ts:228` to `src/client/render/gl/GameView.ts:333`.
- Impact:
  - The facade is the right level for reuse, but its public API encourages new modules to depend on OpenFront concepts.
- Recommendation:
  - Define a smaller interface for Foundation such as `BaseMapRenderTarget` with terrain deltas, tile-state upload, palette upload, camera methods, and owner hit-testing.
  - Leave the existing `GameView` API intact for OpenFront. Add adapter interfaces rather than deleting methods.
- Risk:
  - TypeScript structural typing can hide accidental coupling. Keep the Foundation adapter typed against the minimal target, not the full `GameView`.

### 3. `FrameData` and `uploadFrameData()` require OpenFront-only frame fields
- Evidence:
  - `FrameData` declares core buffers but also requires `trailState`, `railroadState`, units, players, names, player status, relation matrix, alliance clusters, nuke telegraphs, attack rings, and structure dirty flags in `src/client/render/types/FrameData.ts:22`.
  - `uploadFrameData()` dispatches railroads, units, structures, dead units, conquest events, bonus events, attack rings, nuke telegraphs, names, relations, and SAM alliance clusters in `src/client/render/frame/Upload.ts:102`.
  - `FrameUploadTarget` requires methods like `uploadRailroadState`, `updateUnits`, `updateStructures`, `applyConquestEvents`, `updateNukeTelegraphs`, `updateNames`, and `setSAMAllianceClusters` in `src/client/render/frame/Upload.ts:19`.
- Impact:
  - A minimal game must either populate dummy OpenFront frame data or bypass this uploader.
  - This blocks a clean Foundation adapter.
- Recommendation:
  - Introduce a smaller base frame/update path, for example `MapFrameData` with `tick`, `tileState`, `changedTiles`, `terrainBytes` or `terrainChangedTiles`, `palette`, and optional ownership hit-test data.
  - Keep `uploadFrameData()` as `uploadOpenFrontFrameData()` or behind `OpenFrontWebGLAdapter` over time.
- Risk:
  - Replay and live rendering both rely on current upload semantics. Do not alter `FrameData` destructively until OpenFront has compatibility coverage.

### 4. `WebGLFrameBuilder` is an OpenFront adapter already, but it is not named that way
- Evidence:
  - `WebGLFrameBuilder.update()` accepts `core/game/GameView`, syncs players, local player, spawn overlay, terrain deltas, and then uploads `gameView.frameData()` in `src/client/WebGLFrameBuilder.ts:46`.
  - It imports OpenFront assets/cosmetics via `extractFlagName`, `decodePatternData`, `PlayerType`, and `PlayerView`-derived colors in `src/client/WebGLFrameBuilder.ts:1`.
  - Spawn overlay derivation filters human players and reads `spawnTile`, team, colors, and `PlayerType.Human` in `src/client/WebGLFrameBuilder.ts:84`.
- Impact:
  - This is the natural OpenFront renderer adapter. Foundation should not reuse it.
- Recommendation:
  - Treat `WebGLFrameBuilder` as `OpenFrontWebGLFrameAdapter` conceptually, even if the file is not moved immediately.
  - Add a separate `FoundationWebGLAdapter` later that uploads terrain and ownership from Foundation state or generic update envelopes.
- Risk:
  - Renaming/moving too early could churn imports. A wrapper or new parallel adapter is safer as the first step.

### 5. `GPURenderer` eagerly constructs and draws many passes Foundation does not need
- Evidence:
  - `GPURenderer` declares pass fields for terrain, territory, trails, borders, fallout bloom, point lights, lightmap, structures, units, names, effects, range circles, SAM radius, crosshair, railroads, bars, conquest popups, radial menu, selection box, move indicator, nuke trajectory, and nuke telegraphs in `src/client/render/gl/Renderer.ts:96`.
  - The constructor instantiates terrain and territory at `src/client/render/gl/Renderer.ts:207` and `src/client/render/gl/Renderer.ts:284`, but continues through railroads, range circles, SAM radius, warship crosshair, structures, units, names, FX, bars, conquest, radial menu, selection boxes, and nukes in `src/client/render/gl/Renderer.ts:369`.
  - The draw path renders terrain and territory in `src/client/render/gl/Renderer.ts:1130`, then overlays spawn, borders, railroads, units, SAM radius, structure previews, structures, bars, selection, move indicators, nuke telegraphs, bloom, trails, missiles, FX, conquest popups, grid, names, and radial menu in `src/client/render/gl/Renderer.ts:1149`.
- Impact:
  - Foundation can disable some passes through render settings, but it still pays construction complexity and imports OpenFront concepts.
  - The renderer cannot yet be configured as "base map only".
- Recommendation:
  - Introduce pass groups or a renderer profile, starting with `baseMap`: terrain, territory, border ownership if needed, camera, and hit testing.
  - Avoid a boolean matrix exposed to games. The module adapter chooses a renderer profile or composed pass set.
- Risk:
  - Pass dependencies share textures (`tileTex`, `trailTex`, `paletteTex`, `borderTex`, heat textures). The first pass split must respect texture creation order.

### 6. Terrain and tile ownership data are close to the right reusable primitives
- Evidence:
  - `ColorUtils.encodeTerrainTile()` converts a terrain byte into RGBA and documents the current byte layout in `src/client/render/gl/utils/ColorUtils.ts:20`.
  - `TerrainPass` accepts precomputed `terrainRGBA` and supports per-tile terrain deltas in `src/client/render/gl/passes/TerrainPass.ts:25` and `src/client/render/gl/passes/TerrainPass.ts:55`.
  - `TileCodec` documents the tile-state layout as owner id bits plus fallout and defense flags in `src/client/render/gl/utils/TileCodec.ts:1`.
  - `TerritoryPass` owns CPU tile/trail buffers and supports full uploads, live references, deltas, owner queries, and owner bounding boxes in `src/client/render/gl/passes/TerritoryPass.ts:52` and `src/client/render/gl/passes/TerritoryPass.ts:138`.
- Impact:
  - Foundation can use the same low-level buffer path with a blank grass terrain byte buffer and an ownership state buffer.
  - The tile-state format's owner bits are useful, but fallout/defense semantics are OpenFront-specific and should remain optional.
- Recommendation:
  - Define the shared map render input around raw buffers and an optional color encoder. Do not put `isLand()`, `isGrass()`, or `isLava()` in the renderer.
  - Foundation can write owner ids into the low 12 bits and ignore upper OpenFront flags.
- Risk:
  - Current terrain coloring mirrors OpenFront `PastelTheme`. If Foundation wants different terrain visuals, the renderer needs a configurable terrain encoder or palette, not a hardcoded OpenFront color function.

### 7. Input and click-to-place need a smaller, module-owned path
- Evidence:
  - The WebGL canvas has `pointerEvents = "none"` and a transparent full-screen input overlay is used for pointer events in `src/client/ClientGameRunner.ts:308` and `src/client/ClientGameRunner.ts:490`.
  - `InputHandler` emits many OpenFront events, including build, emoji, warship selection, ground/boat attacks, alliances, pause, and game speed in `src/client/InputHandler.ts:361`.
  - Click handling switches between `MouseUpEvent`, `ContextMenuEvent`, build menu, emoji menu, spawn phase, and sandbox context menu in `src/client/InputHandler.ts:693`.
  - The GL renderer's event type definitions already describe generic pointer data including screen coordinates, world coordinates, tile coordinates, owner id, and button metadata in `src/client/render/gl/Events.ts:3`.
- Impact:
  - Foundation should not use OpenFront `InputHandler` just to detect clicks.
  - The renderer already has enough coordinate machinery for a simpler click-to-place controller.
- Recommendation:
  - Add a small input adapter for Foundation that listens on its module-owned overlay, uses `WebGLGameView.screenToWorld()`, computes tile refs, and emits a Foundation `place_player` intent.
  - Longer term, consider a generic input surface that maps DOM events to pointer/tile events without OpenFront commands.
- Risk:
  - Camera/pan/zoom behavior should remain consistent with OpenFront. Start with a minimal camera controller and copy only proven reusable interactions.

## Quick Wins
- Document `WebGLFrameBuilder` as the OpenFront adapter path and avoid using it from Foundation.
- Extract a small creation helper for WebGL canvas plus `WebGLGameView` construction that accepts `mapWidth`, `mapHeight`, `terrainBytes`, and `palette`.
- Define a minimal `BaseMapRenderTarget` interface covering full tile-state upload, tile deltas, terrain deltas, camera methods, and owner hit-testing.
- Add a Foundation renderer adapter design that uploads one player palette entry and a tile ownership state buffer.

## Medium Changes
- Split `FrameData` into a base map frame and an OpenFront frame extension.
- Add renderer profiles or pass groups so a base map renderer does not instantiate every OpenFront pass.
- Move OpenFront-specific render frame derivations and upload dispatch behind an OpenFront-named adapter.
- Add reusable pointer-to-tile input helpers that Foundation can use without `InputHandler`.

## High-Risk Decisions
- Whether to keep one `GPURenderer` with pass profiles or introduce a smaller `BaseMapRenderer` composed from existing passes.
- Whether terrain coloring remains hardcoded to OpenFront byte semantics or becomes configurable per module.
- Whether tile-state ownership keeps the current `OWNER_MASK` low-12-bit convention as a renderer-level contract.
- How soon to move renderer files toward `src/engine/render` versus keeping them in `src/client/render` until Foundation proves reuse.

## Guardrails
- Do not require Foundation to fake OpenFront `FrameData`.
- Do not remove or rewrite the OpenFront render path while creating the Foundation path.
- Do not expose pass toggles like `showWarships` or `showNukes` as the game module abstraction. Modules should select adapters/profiles, not feature booleans.
- Do not put terrain semantics in the base renderer. Let modules own terrain meaning and optionally provide render encoders.
- Keep click-to-place separate from OpenFront radial/build/warship input handling.

## Clarified Decisions
- Foundation may use a thin adapter against the current custom WebGL renderer before modularization is complete.
- Renderer modularization may follow Foundation MVP.
- OpenFront and Foundation should share the same base visuals and maintain parity for terrain/ownership rendering.
- Do not accept permanent divergent base-map visuals between OpenFront and Foundation.

# Analysis Report: Foundation MVP

## Executive Summary
- Foundation should be a narrow game module under `src/games/foundation`, not another OpenFront sandbox flag.
- The reusable rendering path is the custom WebGL facade in `src/client/render/gl`, but the current live `GameView`/`WebGLFrameBuilder` path is OpenFront-specific and should be bypassed by a Foundation adapter.
- The first server/runtime loop can be local single-player, but it should use command/update envelopes that mirror the parent engine-module design so multiplayer does not require a rewrite.
- A semantic-free tile map is feasible because the current map implementation already separates terrain bytes and mutable tile state buffers, even though its public interface mixes in OpenFront terrain semantics.
- The MVP must stop at placement and rendering; population/food ticking belongs to the next loop after the module/rendering path is proven.

## Findings

### 1. Foundation Cannot Reuse `GameRunner` Directly Without Importing OpenFront Mechanics
- Evidence:
  - `createGameRunner()` builds a `Config`, loads `gameStart.config.gameMap`, creates human `PlayerInfo`s, creates nations, and calls `createGame()` in `src/core/GameRunner.ts:34`.
  - `GameRunner.init()` installs spawn timer, random spawn, bots/tribes, nation executions, win check, and railroad recomputation in `src/core/GameRunner.ts:98`.
  - `executeNextTick()` emits `GameUpdateViewData` with OpenFront `GameUpdates` and `playerNameViewData` in `src/core/GameRunner.ts:188`.
- Impact:
  - Using this path would immediately pull in nations, spawn flow, victory, rails, and OpenFront update semantics.
- Recommendation:
  - Build a Foundation runtime under `src/games/foundation` with its own tiny command router and update envelope. Keep the structure compatible with later worker integration, but do not subclass or fake OpenFront `GameRunner`.
- Risk:
  - If the first MVP bypasses the worker entirely without preserving envelope/turn concepts, multiplayer will be harder later. Keep the local runtime shaped like a future worker runtime.

### 2. The Custom WebGL Renderer Is Reusable, But The Live Frame Producer Is Not
- Evidence:
  - `src/client/render/gl/GameView.ts:36` is a renderer facade over `GPURenderer`, with camera, tile upload, palette/player registration, and render lifecycle methods.
  - `src/client/render/gl/Renderer.ts:91` constructs the WebGL2 renderer and pass stack, including `TerrainPass` and `TerritoryPass`.
  - `createWebGLView()` in `src/client/ClientGameRunner.ts:292` extracts terrain bytes, creates the canvas, constructs `WebGLGameView`, and preallocates player textures.
  - `WebGLFrameBuilder.update()` syncs OpenFront players, spawn overlay, terrain deltas, and uploads `gameView.frameData()` in `src/client/WebGLFrameBuilder.ts:46`.
  - `src/client/view/GameView.ts:64` implements the client-side OpenFront mirror and derives railroads, relation matrix, alliance clusters, nuke telegraphs, units, names, and player states into `FrameData`.
- Impact:
  - The lower renderer can draw Foundation terrain and tile ownership, but the current frame source would force Foundation to mimic OpenFront state.
- Recommendation:
  - Create a Foundation WebGL adapter that directly constructs `WebGLGameView`, registers a minimal player palette, and uploads a minimal frame or tile/trail state. Keep all renderer compatibility types inside this adapter.
- Risk:
  - Renderer types such as `PlayerStatic` and `FrameData` still include OpenFront fields. Treat them as renderer ABI for now and do not leak them into Foundation domain types.

### 3. The Current Client Shell Mounts OpenFront HUD And Input By Default
- Evidence:
  - `renderSandboxShell()` mounts OpenFront HUD elements including attacks, control panel, unit display, chat, build menu, win modal, spawn timer, leaderboard, and team stats in `src/client/Main.ts:859`.
  - `createClientGame()` wires `createRenderer()`, `mountWebGLFrameLoop()`, and `InputHandler` in `src/client/ClientGameRunner.ts:535`.
- Impact:
  - Foundation cannot use the sandbox shell or `createClientGame()` as-is without inheriting unrelated UI and controls.
- Recommendation:
  - Add a Foundation-specific route/component that mounts only the WebGL canvas/adapter and a small debug panel.
- Risk:
  - Route integration touches `Main.ts`, which is currently dirty in the worktree. Implementation must preserve existing edits and avoid broad shell rewrites.

### 4. A Semantic-Free Tile Map Can Be Introduced Locally First
- Evidence:
  - Current `GameMap` includes generic addressing and buffers but also semantic methods like `isLand`, `isOcean`, `isShoreline`, `setWater`, and `terrainType` in `src/core/game/GameMap.ts:5`.
  - `GameMapImpl` stores immutable terrain in `Uint8Array` and mutable tile state in `Uint16Array` in `src/core/game/GameMap.ts:95`.
  - `tileStateBuffer()` exposes the live `Uint16Array` used by zero-copy render consumers in `src/core/game/GameMap.ts:75`.
  - `TerrainMapLoader` creates maps from raw one-byte-per-tile terrain buffers in `src/core/game/TerrainMapLoader.ts:113`.
- Impact:
  - The storage model already matches the parent initiative's `EngineTileMap` direction, but the current interface is too OpenFront-semantic.
- Recommendation:
  - Define Foundation's first `EngineTileMap`-style primitive locally under `src/games/foundation`, with only dimensions, ref/coordinate conversion, `terrainBuffer()`, and `stateBuffer()`. Add `FoundationTerrain` as a separate module-owned query layer.
- Risk:
  - Reusing `GameMapImpl` directly is tempting, but it would normalize semantic methods in the wrong layer. Use only the low-level buffer/addressing shape in Foundation.

### 5. Worker And Protocol Types Are OpenFront-Specific Today
- Evidence:
  - `WorkerClient` callbacks are typed as `GameUpdateViewData | ErrorUpdate` in `src/core/worker/WorkerClient.ts:25` and sends `Turn` from `src/core/Schemas.ts`.
  - `WorkerMessages` includes OpenFront query messages such as `player_actions`, `player_buildables`, `player_profile`, `player_border_tiles`, `attack_clustered_positions`, and `transport_ship_spawn` in `src/core/worker/WorkerMessages.ts:13`.
  - `Intent` is a union of OpenFront commands, including attack, boat, alliance, donate, embargo, build, warship movement, kick, and lobby config intents in `src/core/Schemas.ts:30`.
  - `GameConfigSchema` requires OpenFront fields such as map, difficulty, donate flags, game mode, nations, bots, disabled units, and mechanics in `src/core/Schemas.ts:222`.
- Impact:
  - Foundation cannot use current protocol types as its native contract.
- Recommendation:
  - For the MVP, define small Foundation command/update types locally that mirror the parent generic-envelope shape. Defer full shared worker/protocol migration to the protocol-envelope initiative.
- Risk:
  - Duplicating envelope ideas locally can drift from the eventual engine protocol. Keep names and fields intentionally close to the parent initiative's `EngineUpdateEnvelope` and `IntentEnvelope`.

### 6. Existing Tests Offer Useful Validation Patterns
- Evidence:
  - Map buffer behavior is already tested in `tests/core/game/GameMap.tileStateBuffer.test.ts`.
  - Client `GameView` frame contract is tested under `tests/client/view/GameView.test.ts`.
  - Renderer-derived frame helpers have tests under `tests/client/render/frame/derive/`.
  - Sandbox routes/components already have test coverage under `tests/client/sandbox/`.
- Impact:
  - Foundation can add focused unit tests without requiring browser-level rendering tests in the first pass.
- Recommendation:
  - Add tests for Foundation map generation, fixed-radius claim behavior, command/update routing, and debug component state. Use smoke tests/mocks for the WebGL adapter where WebGL2 is unavailable.
- Risk:
  - Real WebGL tests may be flaky under jsdom. Keep unit coverage around adapter inputs and lifecycle; leave visual/browser verification as manual or later Playwright work.

## Quick Wins
- Add `src/games/foundation` with local map/runtime/client folders.
- Generate a blank grass terrain buffer with `1 << 7` bytes and a zeroed `Uint16Array` state buffer.
- Implement fixed-radius tile collection independent of OpenFront `circleSearch()`.
- Add a Foundation route that avoids `renderSandboxShell()` and mounts only the module UI.
- Register a single renderer palette entry for Foundation's player owner id.

## Medium Changes
- Build a Foundation local runtime with command and update envelopes.
- Build a WebGL adapter that uploads terrain/state without OpenFront `ClientGameRunner` or `WebGLFrameBuilder`.
- Add a debug panel showing map size, placement status, selected tile, claimed tile count, and tick/update count.
- Keep runtime and adapter boundaries shaped so they can be moved into shared engine primitives later.

## High-Risk Decisions
- Whether the first Foundation route uses a local runtime or the current worker. Recommendation: local runtime first, with worker-shaped envelopes.
- How much of renderer `FrameData` to construct. Recommendation: use the smallest valid state upload path and isolate placeholder OpenFront renderer fields inside the adapter.
- Whether to introduce `src/engine` now. Recommendation: no; keep the MVP under `src/games/foundation` and extract shared engine primitives in follow-on initiatives.
- Whether to touch `Main.ts` for routing. Recommendation: yes, but only a minimal route hook; route shell changes are unavoidable for a usable MVP.

## Guardrails
- Do not extend `isSandbox` for Foundation.
- Do not mount `hud-game-shell` or OpenFront HUD controls for Foundation.
- Do not call `createGameRunner()`, `createGame()`, `createNationsForGame()`, or `Executor` from Foundation.
- Do not make `EngineTileMap` expose `isLand()`, `isGrass()`, `isLava()`, or passability.
- Do not introduce population/food ticking before placement/rendering is stable.
- Do not introduce ECS in this initiative.
- Keep OpenFront renderer compatibility code boxed into the Foundation WebGL adapter.

## Clarified Decisions
- Use a `256x256` blank map for the first loop.
- Fixed placement claim radius is 10 tiles around the clicked tile.
- The debug panel should not contain placeholders; show only live values worth inspecting.
- Mount Foundation at `/foundation`.

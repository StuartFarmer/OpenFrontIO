# Analysis Report: OpenFront Module Relocation/Wrapping

## Executive Summary
- OpenFront can be wrapped incrementally because the current server entry point is concentrated in `src/core/GameRunner.ts`, but that file imports and installs OpenFront gameplay directly.
- The client path is the larger integration risk: `src/client/ClientGameRunner.ts` creates the OpenFront view, WebGL view, input overlay, HUD renderer, input handler, sound manager, and update loop in one universal function.
- Worker and transport contracts are OpenFront-shaped today. This initiative should preserve those contracts under an OpenFront module while avoiding a permanent generic API based on player buildables, warships, alliances, or transport ships.
- Moving files into `src/games/openfront` is acceptable, but wrapper-first is safer than bulk moves because many tests and imports still point at `src/core/*` and `src/client/*`.

## Findings

### 1. Server startup is already a good first module seam, but it currently constructs OpenFront directly
- Evidence:
  - `createGameRunner()` constructs `Config`, loads `gameStart.config.gameMap`, creates human `PlayerInfo`s, creates nations with `createNationsForGame()`, calls `createGame()`, and constructs `Executor` in `src/core/GameRunner.ts:34`.
  - `GameRunner.init()` installs spawn timer, random spawn, tribes, nation executions, `WinCheckExecution`, and rail recompute in `src/core/GameRunner.ts:98`.
  - `executeNextTick()` assumes OpenFront `Game`, `GameUpdates`, packed motion plans, name placement, spawn phase, and `PlayerType.Nation` in `src/core/GameRunner.ts:125`.
- Impact:
  - Any new game would inherit OpenFront startup unless the runner creation is made module-owned.
  - The reusable part is the turn queue and tick drain shape, not the startup/install logic.
- Recommendation:
  - Introduce `OpenFrontServerModule` that contains the current `createGameRunner()` path and exposes a stable module method such as `createRunner(ctx)`.
  - Keep `GameRunner` as an OpenFront runtime class initially, or move it under `src/games/openfront/server` while updating imports directly.
- Risk:
  - Moving `GameRunner` too early can break worker imports and tests. Update imports and tests in the same change rather than adding re-export shims.

### 2. Worker messages expose OpenFront-specific RPCs that should be preserved as OpenFront client services, not engine services
- Evidence:
  - `Worker.worker.ts` imports `createGameRunner` and `GameRunner` directly in `src/core/worker/Worker.worker.ts:4`.
  - The worker batches `GameUpdateViewData[]` and transfers `packedTileUpdates` / `packedMotionPlans` in `src/core/worker/Worker.worker.ts:60` and `src/core/worker/Worker.worker.ts:105`.
  - Worker RPCs include `player_actions`, `player_buildables`, `player_profile`, `player_border_tiles`, `attack_clustered_positions`, and `transport_ship_spawn` in `src/core/worker/WorkerMessages.ts:13`.
- Impact:
  - These RPCs are useful for OpenFront HUD/input but are not a general engine API.
  - A module boundary that exposes these as generic requirements would recreate the OpenFront coupling under a new name.
- Recommendation:
  - Add an OpenFront worker adapter that keeps the current message union for OpenFront.
  - Leave generic worker-envelope migration to the protocol initiative, but ensure this initiative does not make OpenFront RPCs part of the base module interface.
- Risk:
  - Worker transfer handling is performance-sensitive. Preserve the current transferable buffers and batching behavior for OpenFront.

### 3. The client creates one fixed OpenFront game shell
- Evidence:
  - `joinLobby()` always creates `Transport`, loads terrain from `gameStartInfo.config.gameMap`, and calls `createClientGame()` on start in `src/client/ClientGameRunner.ts:96`.
  - `createClientGame()` creates `Config`, `WorkerClient`, OpenFront `GameView`, input overlay, custom WebGL view, `GameRenderer`, `InputHandler`, `SoundManager`, and `WebGLFrameBuilder` in `src/client/ClientGameRunner.ts:453`.
  - `ClientGameRunner.start()` assumes OpenFront update types for hash and win updates, updates `GameView`, runs WebGL frame builder, ticks HUD layers, and saves OpenFront game records in `src/client/ClientGameRunner.ts:676`.
- Impact:
  - The client shell is not module-owned. Any game launched through the current path inherits OpenFront UI, input, view, and persistence assumptions.
- Recommendation:
  - Introduce `OpenFrontClientModule.mount(ctx)` that owns the current `createClientGame()` behavior.
  - Keep the existing `joinLobby()` external API initially, but delegate the game creation/mounting step to the selected module.
- Risk:
  - Cleanup and reconnect behavior are spread across `joinLobby()`, `ClientGameRunner`, `Transport`, and worker lifecycle. Module wrapping must keep stop/cleanup semantics identical.

### 4. HUD composition is OpenFront-specific and should move behind the OpenFront client module
- Evidence:
  - `createRenderer()` queries fixed custom elements including `emoji-table`, `build-menu`, `leader-board`, sidebars, `control-panel`, `events-display`, `attacks-display`, `chat-display`, `win-modal`, `unit-display`, `spawn-timer`, `immunity-timer`, and others in `src/client/hud/GameRenderer.ts:41`.
  - It installs OpenFront-specific controllers such as `WarshipSelectionController`, `BuildPreviewController`, `SandboxTileRulerController`, `AttackingTroopsOverlay`, `MainRadialMenu`, `UnitDisplay`, and `WinModal` in `src/client/hud/GameRenderer.ts:263`.
- Impact:
  - This composition is correct for OpenFront but wrong as a universal engine shell.
- Recommendation:
  - Move or wrap this renderer composition as `OpenFrontHudModule` / `OpenFrontClientModule` internals.
  - Keep `GameRenderer` behavior intact and avoid trying to make these layers optional through feature flags.
- Risk:
  - Existing tests may rely on custom element names and document queries. Keep public tag behavior stable.

### 5. Schemas and transport intent events are OpenFront-shaped
- Evidence:
  - `Intent` includes OpenFront commands such as attack, boat, alliance, emoji, donate, embargo, build unit, warship move, delete unit, and pause in `src/core/Schemas.ts:30`.
  - `GameConfigSchema` requires OpenFront config fields such as map, difficulty, donate settings, game mode, map size, nations, bots, disabled units, teams, sandbox, and mechanics in `src/core/Schemas.ts:222`.
  - `Transport` defines event classes for OpenFront gameplay commands and subscribes to them directly in `src/client/Transport.ts:34` and `src/client/Transport.ts:196`.
- Impact:
  - The schema and event layer cannot be treated as generic module infrastructure.
- Recommendation:
  - In this initiative, preserve these as OpenFront schemas/events and place them behind OpenFront naming or adapters where practical.
  - Defer generic envelope/schema migration to the protocol initiative.
- Risk:
  - Trying to generalize schemas here would expand scope and increase multiplayer risk.

### 6. Existing tests provide strong behavior guards, but new boundary tests are needed
- Evidence:
  - Package scripts use Vitest and TypeScript/Vite build commands in `package.json`.
  - Current tests cover OpenFront core systems, executions, game views, worker/client parity, UI components, local server, and server lifecycle under `tests/`.
- Impact:
  - Refactoring can be guarded, but there is no specific test that asserts OpenFront is the default module or that wrappers do not branch by scattered switches.
- Recommendation:
  - Add focused tests for module registry defaulting, OpenFront server module delegation, OpenFront client module mount delegation, and direct import migration compatibility.
  - Run targeted tests around `GameRunner`, worker client update parity, `ClientGameRunner`/`GameView`, `LocalServer`, and server lifecycle, then run `npm test` or build once the extraction is complete.
- Risk:
  - Full test suite may be broad and slow. Use focused tests during waves, then full validation at the end.

## Quick Wins
- Create `src/games/openfront` with module entry files and keep current behavior delegated through wrappers.
- Add an OpenFront module registry with only `openfront` initially.
- Update import paths directly for moved files; avoid compatibility re-export shims.
- Add boundary tests before moving large client/server files.

## Medium Changes
- Move OpenFront server startup logic behind `OpenFrontServerModule`.
- Move OpenFront client game creation and HUD composition behind `OpenFrontClientModule`.
- Rename or alias OpenFront-specific schema/transport concepts so they are not mistaken for engine contracts.
- Add documentation in the module folder explaining what is OpenFront-owned versus shared.

## High-Risk Decisions
- Whether to physically move `GameRunner`, `GameImpl`, `PlayerImpl`, `GameUpdates`, and execution classes into `src/games/openfront` now or wrap them in place first. Recommendation: wrap first, then move only stable groups.
- Whether `Transport` becomes module-owned in this initiative. Recommendation: keep transport infrastructure in place but move OpenFront intent event binding behind OpenFront client composition where possible.
- Whether worker messages become generic now. Recommendation: no; preserve OpenFront worker messages and defer generic envelope work.
- Whether to rename `src/core/game/Game.ts` now. Recommendation: no; too much import churn for this initiative.

## Guardrails
- No scattered module switches. One boundary lookup is acceptable; behavior after lookup must live on the selected module.
- No feature flags like `showBuildMenu` or `enableWarships` as the module abstraction.
- No behavior changes to OpenFront spawn, bots, nations, win checks, rail recompute, HUD, replays, local server, or multiplayer.
- No Foundation code in this initiative.
- No broad deletion or cleanup of existing sandbox code.

## Clarified Decisions
- File moves into `src/games/openfront` are allowed early.
- Avoid re-export shims. Move references forward by updating import paths.
- The module boundary should include OpenFront HUD/client composition, not just server/game-runner code.
- Multiplayer-specific behavior remains a separate initiative.

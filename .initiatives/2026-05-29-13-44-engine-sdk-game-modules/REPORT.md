# Analysis Report: Engine SDK Game Modules

## Executive Summary
- The biggest blocker is not one specific gameplay feature; it is that OpenFront concepts are embedded in the cross-cutting contracts: config schema, intent schema, game/player interfaces, worker query API, game runner startup, and client HUD mounting.
- The correct target is a module contract, not a `ruleset` flag. A single module lookup at the edge is acceptable; behavior after lookup should be owned by the selected game module.
- The existing code already has useful engine candidates: deterministic turn queue, worker/main message loop, `GameMapImpl`, packed tile updates, WebGL frame loop, `GameSystemScheduler`, and stock-flow population/food models.
- The first prototype should be a foundation module with a generated all-grass map and a tiny command/update surface. It should not mount OpenFront HUD elements or accept OpenFront commands it does not implement.

## Findings

### 1. OpenFront Startup Is Hardcoded In `GameRunner`
- Evidence:
  - `createGameRunner()` constructs `Config`, loads a terrain map from `gameStart.config.gameMap`, creates human `PlayerInfo`s, creates nations via `createNationsForGame()`, calls `createGame()`, and always constructs `Executor` in `src/core/GameRunner.ts:34`.
  - `GameRunner.init()` installs spawn timer, random spawn players, tribes, nation executions, win check, and rail recompute directly in `src/core/GameRunner.ts:98`.
- Impact:
  - A new internal game cannot own its map source, startup flow, initial systems, AI, or win/lifecycle rules without modifying OpenFront startup code.
  - `isSandbox` only changes a few downstream behaviors; it does not create an independent game.
- Recommendation:
  - Introduce a server-side game module boundary at runner creation. The module should own map creation, world creation, command routing, systems, and initial executions.
  - Make OpenFront the default module that preserves the current path.
- Risk:
  - If this is done with central switches, maintenance will degrade quickly as prototypes are added. Use a registry lookup once, then call module methods.

### 2. The Client Runtime Mounts OpenFront HUD And Controllers As A Fixed Shell
- Evidence:
  - Sandbox shell markup explicitly mounts OpenFront UI elements such as `attacks-display`, `control-panel`, `unit-display`, `chat-display`, `build-menu`, `win-modal`, `spawn-timer`, `leader-board`, and `team-stats` in `src/client/Main.ts:859`.
  - `createRenderer()` queries and wires each OpenFront HUD element, then installs OpenFront controllers including warship selection, build preview, attacking troop overlay, radial menu, leaderboard, win modal, and unit display in `src/client/hud/GameRenderer.ts:43` and `src/client/hud/GameRenderer.ts:263`.
  - `createClientGame()` unconditionally creates `GameView`, WebGL view, OpenFront renderer, and `InputHandler` in `src/client/ClientGameRunner.ts:453`.
- Impact:
  - Even if the server-side mechanics were isolated, a prototype still inherits OpenFront's UI surface and interaction model.
  - A game with different TypeScript UI code has no clean mount point today.
- Recommendation:
  - Add a client-side game module boundary. The module should own DOM shell creation, view adapter creation, input handling, renderer/HUD mounting, and cleanup.
  - Keep the existing OpenFront client path as `OpenFrontClientModule`.
- Risk:
  - `GameRenderer` and `InputHandler` are currently broad integration objects. Pulling too much apart at once could regress OpenFront UI. Start by moving the current composition behind an OpenFront module without changing behavior.

### 3. Schemas Encode OpenFront As The Only Game Vocabulary
- Evidence:
  - `Intent` is a union of OpenFront commands: spawn, attack, boat, alliance, emoji, donate, embargo, build, warship movement, structure upgrade/delete, pause, and lobby config intents in `src/core/Schemas.ts:30`.
  - `GameConfigSchema` requires OpenFront fields such as `gameMap`, `difficulty`, `donateGold`, `gameMode`, `gameMapSize`, `nations`, `bots`, `infiniteGold`, `disabledUnits`, `playerTeams`, and `mechanics` in `src/core/Schemas.ts:222`.
- Impact:
  - Every game must pretend to be OpenFront at the wire/config layer.
  - A foundation game with only `plop_nation`, `set_food_allocation`, and `pause` cannot express that as its native command vocabulary.
- Recommendation:
  - Split transport envelope from game payload. Keep shared fields like `gameID`, `clientID`, turn number, and timestamps, but make config and intents module-owned payloads validated by the selected module.
  - Keep OpenFront's existing schema under its module and bridge it through the generic envelope.
- Risk:
  - Multiplayer/server code may assume the current `GameConfig` shape. Migration needs compatibility adapters so existing lobbies keep working.

### 4. The Core `Game`, `Player`, And `Unit` Interfaces Are OpenFront Domain Models
- Evidence:
  - `Player` includes territory, resources, units, buildability, diplomacy, targeting, communication, donation, embargo, attacking, transport ship spawn, and profile methods in `src/core/game/Game.ts:698`.
  - `Unit` includes train, targeting, projectile, health, warship, transport, missile cooldown, trade ship, construction, and upgrade methods in `src/core/game/Game.ts:605`.
  - `Game` extends `GameMap` but also includes teams, alliances, immunity, winner state, unit queries, pathfinding, water, rail, updates, and stats in `src/core/game/Game.ts:863`.
- Impact:
  - These are not engine interfaces; they are the OpenFront game model.
  - A minimal prototype either implements irrelevant methods or reuses `PlayerImpl`, pulling in unrelated semantics.
- Recommendation:
  - Rename or conceptually demote these to OpenFront interfaces over time.
  - Introduce smaller engine primitives such as `TileMap`, `WorldClock`, `EntityStore`, `CommandRouter`, `SystemScheduler`, and `UpdateStream`.
  - Let OpenFront adapt those primitives into its rich `Game`/`Player` surface.
- Risk:
  - A direct rename/move would be noisy. Start by adding new engine interfaces next to existing code and only migrate code that the foundation module needs.

### 5. The Update And Frame Contracts Mix Engine Data With OpenFront Events
- Evidence:
  - `GameUpdateViewData` has reusable packed tile updates, but its `updates` map is keyed by OpenFront-specific `GameUpdateType` values including alliances, units, bonus events, railroad events, conquest, embargo, and spawn phase end in `src/core/game/GameUpdates.ts:21` and `src/core/game/GameUpdates.ts:48`.
  - `PlayerUpdate` includes OpenFront fields for gold, resources, troop capacities, allies, embargoes, traitor state, targets, emojis, attacks, alliance requests, spawn state, and deletion cooldown in `src/core/game/GameUpdates.ts:180`.
  - `GameView.populateFrame()` computes railroad overlays, player status, relation matrix, alliance clusters, and nuke telegraphs as part of the frame in `src/client/view/GameView.ts:432`.
- Impact:
  - The renderer path contains reusable tile rendering, but the frame derivation assumes OpenFront state.
  - New games cannot emit simpler updates without either faking OpenFront fields or bypassing `GameView`.
- Recommendation:
  - Separate the engine frame/update base from OpenFront-derived frame layers.
  - Keep packed tile-state updates as a shared engine mechanism, but move OpenFront event interpretation into an OpenFront view adapter.
- Risk:
  - The WebGL renderer may currently expect fields that are only meaningful to OpenFront. The foundation module should prove a minimal frame adapter that renders terrain and ownership first.

### 6. The Current Sandbox Is A Tuning Layer, Not An Encapsulated Game
- Evidence:
  - Sandbox detection checks `gameStartInfo?.config.isSandbox === true` in `src/client/ClientGameRunner.ts:242`.
  - The sandbox start path creates a normal single-player OpenFront `GameStartInfo` using `GameMapType.World`, `GameMode.FFA`, optional bots/nations, mechanics override, and `isSandbox: true` in `src/client/sandbox/SandboxBalancer.ts:1878`.
  - The input handler still has OpenFront spawn-phase behavior with a special sandbox context-menu exception in `src/client/InputHandler.ts:839`.
- Impact:
  - Sandbox work remains coupled to OpenFront's starting flow, map assumptions, spawn semantics, UI, and command vocabulary.
  - This is adequate for tuning OpenFront mechanics, but not for an SDK-style blank-slate internal game.
- Recommendation:
  - Keep these tuning sandboxes for OpenFront.
  - Add a separate module-backed prototype route rather than extending `isSandbox`.
- Risk:
  - Reusing `/sandbox` for both tuning and module prototypes will blur the boundary. Use a distinct route or explicit module id.

### 7. Reusable Engine Candidates Already Exist
- Evidence:
  - `GameMapImpl` provides compact tile refs, terrain bytes, owner state, tile-state buffers, and search helpers in `src/core/game/GameMap.ts:1`.
  - `GameSystemScheduler` already supports ordered phases and spawn-phase filtering in `src/core/systems/GameSystem.ts:3`.
  - The worker loop handles initialization, queued turns, bounded tick draining, and batched transferable update buffers in `src/core/worker/Worker.worker.ts:1`.
  - Population/food/resource models are pure-ish model functions under `src/core/systems/models`, including `evaluatePlayerEconomyModel()` in `src/core/systems/models/PlayerEconomyModel.ts:40` and `createPopulationSystemModel()` in `src/core/systems/models/PopulationSystem.ts:27`.
- Impact:
  - The extraction does not need to begin from scratch.
  - The right move is to draw boundaries around these reusable pieces and prevent OpenFront code from being the only consumer.
- Recommendation:
  - Build the foundation prototype using the shared map/tick/worker/scheduler/model pieces while bypassing OpenFront HUD, command, nation AI, unit, alliance, and win systems.
- Risk:
  - Some reusable-looking pieces still import OpenFront types. Each candidate needs a dependency pass before moving it into an engine namespace.

## Quick Wins
- Add a `moduleId` or equivalent top-level game identifier to the shared game-start envelope, separate from OpenFront `GameConfig`.
- Create a game module registry with `openfront` as the only initial entry, preserving current behavior behind the module boundary.
- Move current `createGameRunner()` startup behavior behind `OpenFrontServerModule` without changing semantics.
- Move current `renderSandboxShell()` plus `createRenderer()` composition behind `OpenFrontClientModule` without changing semantics.
- Add a synthetic all-grass `TerrainMapData` creator for internal prototypes.

## Medium Changes
- Split shared transport envelopes from module-owned config and intent payloads.
- Add a foundation module with its own minimal server command router and client mount function.
- Introduce a minimal frame adapter for terrain and ownership that does not compute OpenFront-specific overlays.
- Extract population/food mechanics into a module-consumable package that depends on generic population/territory inputs, not `Player`.
- Define explicit module lifecycle hooks for create world, initialize systems, route commands, produce updates, mount client, and cleanup.

## High-Risk Decisions
- Whether `GameImpl` becomes an OpenFront implementation only, or whether parts of it are gradually generalized into a new `EngineWorld`.
- Whether all games must use the current worker turn protocol, or whether the engine supports alternate local runtimes later.
- Whether the custom WebGL renderer remains a shared engine renderer with pluggable layers, or OpenFront keeps it and Foundation uses a minimal adapter first. Current direction: Foundation should use the custom WebGL renderer path through a small module-owned adapter.
- How far to generalize schemas now versus keeping OpenFront schemas stable and introducing generic envelopes beside them.
- Whether the engine schema layer is Zod-specific or validation-library agnostic.
- Whether the shared map primitive is the current `GameMapImpl` interface or a smaller tile-buffer/map adapter that `GameMapImpl` can implement. Current direction: use a smaller semantic-free tile buffer/addressing contract.

## Guardrails
- Do not introduce feature flags such as `showBuildMenu`, `showAlliances`, or `enableWarships` as the primary abstraction.
- Do not add scattered `if (moduleId === ...)` checks. One registry lookup at the boundary is acceptable; module behavior must be polymorphic or composed after that.
- Do not make new games implement OpenFront's `Player`, `Unit`, or `Game` interfaces unless they are actually OpenFront-compatible games.
- Do not break existing OpenFront sandboxes while introducing module-backed prototypes.
- Treat OpenFront as the canonical game module, not as the engine itself.

## Standardization Target
The abstraction should standardize the runtime lifecycle and shared primitives, not OpenFront gameplay categories.

The engine owns:

- Deterministic tick processing.
- Worker/main-thread transport.
- Shared protocol envelopes.
- Map and tile primitives.
- System scheduling.
- Command routing lifecycle.
- Update stream transport.
- Renderer/input mounting surfaces.
- Cleanup and disposal lifecycle.

Game modules own:

- Config and intent schemas.
- World/entity/domain model.
- Map source or map generation.
- Command vocabulary.
- Installed systems.
- Initial state and starting flow.
- Update interpretation.
- Client view adapter.
- Renderer/HUD/UI composition.
- Victory/lifecycle rules, if any.

This keeps the engine generic while allowing games to be radically different. A new module should be free to have no buildings, no alliances, no units, no OpenFront HUD, and no OpenFront `Player` implementation.

### Module Contract Sketch
```ts
export interface GameModule {
  id: string;
  server: ServerGameModule;
  client: ClientGameModule;
  schemas: GameSchemas;
}

export interface ServerGameModule {
  createWorld(ctx: CreateWorldContext): Promise<WorldRuntime>;
  createCommandRouter(ctx: CommandRouterContext): CommandRouter;
  createSystems(ctx: SystemContext): GameSystem[];
  createInitialState(ctx: InitContext): void;
}

export interface ClientGameModule {
  mount(ctx: ClientMountContext): ClientRuntime;
}
```

### Protocol Direction
Use generic envelopes with module-owned payloads:

```ts
export interface GameStartEnvelope {
  gameID: string;
  moduleId: string;
  players: ClientPlayerInfo[];
  config: unknown;
}

export interface IntentEnvelope {
  clientID: string;
  turnNumber: number;
  payload: unknown;
}
```

The engine routes envelopes. The selected module validates and executes payloads.

Use the same strategy for updates:

```ts
export interface EngineUpdateEnvelope {
  moduleId: string;
  tick: number;

  map?: {
    tileState?: Uint16Array;
    changedTiles?: Uint32Array;
    terrainChangedTiles?: Uint32Array;
  };

  events: ModuleEventEnvelope[];

  metrics?: {
    tickExecutionDuration?: number;
    pendingTurns?: number;
  };
}

export interface ModuleEventEnvelope {
  type: string;
  payload: unknown;
}
```

OpenFront can initially bridge its current `GameUpdateViewData` shape into this envelope. That bridge should be transitional. Foundation should start on the generic envelope directly.

### Migration Shape
The incremental path should be:

1. Add `moduleId` and a game module registry.
2. Wrap current OpenFront server startup as `OpenFrontServerModule`.
3. Wrap current OpenFront client mounting as `OpenFrontClientModule`.
4. Split shared protocol envelopes from OpenFront-specific schemas.
5. Add synthetic all-grass map generation.
6. Add `foundation` server module.
7. Add `foundation` client module.
8. Extract shared engine primitives only when both OpenFront and Foundation use them.

The proof that this works is a Foundation module that runs without pretending to be OpenFront.

Large implementation areas should become separate initiatives as needed. Candidate follow-on initiatives:

- Generic protocol and update envelope migration.
- OpenFront module relocation/wrapping.
- Custom WebGL renderer modularization.
- Foundation MVP.
- Multiplayer compatibility path for non-OpenFront modules.

### Clarified Constraints From Discussion
- Foundation can ship single-player first, but its runtime contract should preserve a multiplayer path by keeping command envelopes, turn sequencing, and update streams generic.
- Foundation should use the existing custom WebGL renderer path through a minimal module-owned adapter. Do not use Pixi for the first Foundation renderer.
- Foundation should model the controllable actor as `Player`, not as OpenFront's `Nation`.
- Foundation can start under `src/games/foundation`, with the final engine/module layout extracted incrementally.
- Foundation's first placement flow should be click-to-place. Deterministic auto-start placement can follow in a later loop.
- Foundation should start with plain `Player` records rather than a generic entity/component store. ECS/entity-component storage should be considered later only if multiple modules need composable entity data across systems.
- Moving OpenFront files into `src/games/openfront` is acceptable early if imports and tests stay clean.
- Foundation click-to-place should claim a fixed radius around the clicked tile.
- Foundation's first loop should prove placement and rendering before adding population/food ticking.
- Foundation should include a small debug panel from the start.
- Current OpenFront map assets are manifest plus raw terrain byte buffers. A blank grass map can be generated using the same low-level terrain-byte representation without adopting all OpenFront map semantics.
- The base engine map should not expose semantic queries such as `isLand()`. It should expose dimensions, tile addressing, and raw terrain/state buffers. Semantic queries belong to module-owned adapters, e.g. `OpenFrontTerrain.isLand()` or `FoundationTerrain.isGrass()`.

### Engine Map Direction
Base interface:

```ts
export interface EngineTileMap {
  width(): number;
  height(): number;

  ref(x: number, y: number): TileRef;
  x(ref: TileRef): number;
  y(ref: TileRef): number;
  isValidRef(ref: TileRef): boolean;

  terrainBuffer(): Uint8Array;
  stateBuffer(): Uint16Array;
}
```

Module semantics:

```ts
export interface OpenFrontTerrain {
  isLand(tile: TileRef): boolean;
  isOcean(tile: TileRef): boolean;
  isShore(tile: TileRef): boolean;
}

export interface FoundationTerrain {
  isGrass(tile: TileRef): boolean;
  foodYield(tile: TileRef): number;
}
```

This keeps the engine open to different terrain models such as lava, temperature, fertility, roads, elevation, and unit-specific passability.

### Later Entity Model Option
Avoid ECS/entity-component storage in the first Foundation loop. Plain records are the right default:

```ts
type FoundationPlayer = {
  id: string;
  name: string;
  tiles: Set<TileRef>;
  population: number;
  nutritionHealth: number;
  food: number;
};
```

Revisit a generic entity/component store only when the code needs many independently composable object types. An ECS-style model would store data by entity id:

```ts
type EntityId = number;
type PositionComponent = { tile: TileRef };
type PopulationComponent = { current: number; nutritionHealth: number };
type FoodComponent = { stock: number; production: number };
type OwnerComponent = { playerId: string };
```

That may become useful later for multiple game modules, but it is premature for the first Foundation prototype.

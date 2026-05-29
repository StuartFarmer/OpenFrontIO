# Initiative: Engine SDK Game Modules

## Stack
- Language: TypeScript, with a Go map generator utility.
- Package manager: npm.
- Test runner: Vitest.
- Build: Vite plus `tsc --noEmit`.
- UI: Lit custom elements, WebGL renderer, Tailwind CSS.
- CI: GitHub Actions under `.github/workflows/`.

## Goal
Separate the reusable game engine/runtime from the canonical OpenFront game implementation so new internal games can be built as fully encapsulated modules rather than as conditional variants of OpenFront.

## Problem Statement
The current sandbox path is still largely the OpenFront game with selected knobs changed. `isSandbox` suppresses a few client and persistence behaviors, but the core runtime still loads OpenFront map assets, creates OpenFront-style players/nations, mounts OpenFront HUD elements, accepts the OpenFront command vocabulary, and uses a `Game`/`Player` model that includes buildings, alliances, warships, donations, chat, embargoes, attacks, and victory assumptions.

That makes it hard to build a blank grass-map prototype where population and food can be developed from first principles. A real engine/SDK boundary needs a module contract where OpenFront is one implementation and experiments are other implementations.

## Success Definition
The codebase has a documented architecture path where:

- The shared engine owns deterministic ticking, worker/main-thread transport, map/tile primitives, rendering surfaces, input surfaces, and lifecycle hooks.
- OpenFront is represented as a game module that installs its own server systems, commands, map source, update interpretation, renderer/HUD composition, and UI shell.
- A new foundation module can start with a generated all-grass map, a minimal player/nation concept, and only population/food mechanics without importing OpenFront-only gameplay.
- Adding a sixth or seventh internal prototype does not require scattering `if sandbox` or `if ruleset` checks through core files.

## Non-Goals
- Do not rewrite OpenFront gameplay in one pass.
- Do not replace the renderer before proving the module boundary.
- Do not remove existing sandbox pages immediately.
- Do not force all future games to use OpenFront's HUD, command vocabulary, units, diplomacy, or victory model.
- Do not design a perfect public SDK before a second game module exists.

## Constraints
- Preserve the canonical OpenFront implementation while extracting boundaries.
- Preserve existing worker-based deterministic turn processing unless a module explicitly opts out later.
- Avoid a boolean flag matrix or central switch statements for game behavior.
- Keep the first extraction small enough to validate with one blank-map foundation prototype.
- Work with the existing dirty worktree; do not revert unrelated changes.

## Assumptions
- The first non-OpenFront module is an internal prototype focused on map/territory, a ploppable nation/player, population, and food.
- The foundation prototype may start with a simpler renderer/client view if that makes the module boundary cleaner, but the initiative must preserve a clear path toward a full-featured view.
- OpenFront-specific UI can remain intact while a module-owned client mounting API is introduced next to it.
- Existing population/food model code is valuable and should be extracted downward only where it is not tied to OpenFront semantics.
- Foundation can be single-player first, but the abstractions should align with eventual multiplayer needs: connection lifecycle, message envelopes, command routing, deterministic turn processing, and update transport.
- Foundation should use `Player` as its first domain actor name rather than importing OpenFront's `Nation` concept.

## Risk Posture
Medium-high. The runtime has reusable pieces, but the public interfaces currently expose many OpenFront-specific concepts. The safest route is an incremental strangler approach: add module seams at the creation/mounting boundaries first, then move OpenFront assumptions behind the OpenFront module.

## Architecture Direction
The target abstraction is game modules over engine primitives. The engine should provide generic runtime services, while each game module owns the meaning of those services.

Proposed organization:

```text
engine/
  runtime/
  protocol/
  map/
  systems/
  render/
  input/

games/
  openfront/
    server/
    client/
    schemas/
    systems/
    ui/
  foundation/
    server/
    client/
    schemas/
    systems/
    ui/
```

OpenFront should become the canonical OpenFront module, not the implicit engine contract. The first non-OpenFront module should be `foundation`: a blank all-grass map, one ploppable nation/player/entity, and only population/food mechanics.

The central engine should do one module lookup at the boundary:

```ts
const module = gameModules.get(gameStart.moduleId ?? "openfront");
```

After that lookup, behavior should be delegated to the module. Avoid scattered checks such as `if (moduleId === "foundation")`, `if (isSandbox)`, or feature flags like `showBuildMenu`.

The module contract should be shaped around lifecycle, not OpenFront features:

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

The shared protocol should separate engine envelopes from module payloads:

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

Each module validates its own payloads. OpenFront keeps its attack/build/boat/alliance commands. Foundation can define only commands such as `plop_nation`, `set_food_allocation`, and `toggle_pause`.

Updates should follow the same principle. The target is a generic engine update envelope with module-owned events:

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

Foundation should emit native module events through this shape. OpenFront can initially bridge its current `GameUpdateViewData` into the generic envelope, but the long-term direction is to transition OpenFront over rather than keeping two permanent update protocols.

The standardized runtime lifecycle should be:

1. Load module.
2. Validate module config.
3. Create world.
4. Create command router.
5. Install systems.
6. Mount client.
7. Process turns.
8. Emit updates.
9. Cleanup.

None of those lifecycle steps should assume nations, buildings, alliances, ships, chat, diplomacy, or victory.

## Clarified Decisions
- Renderer: Foundation should use the existing custom WebGL renderer path, starting through a minimal module-owned adapter rather than Pixi. The initial adapter should focus on terrain, ownership, camera, and click-to-place, then grow toward richer rendering as module needs appear.
- Multiplayer: Foundation may be local/single-player first. The protocol and runtime seams should not block multiplayer; they should keep connection lifecycle, message passing, deterministic turns, and update streams explicit.
- Domain naming: Foundation should start with `Player` as the controllable actor. OpenFront's `Nation` concept should remain OpenFront-owned unless a future module intentionally adopts it.
- Schema validation: The current codebase uses Zod for runtime validation. Whether the engine remains Zod-specific or validation-library agnostic remains an open design decision.
- Map format: The engine map primitive should be a semantic-free tile buffer/addressing contract rather than the full OpenFront `GameMap` surface. Terrain meaning such as land, ocean, grass, lava, passability, yield, or shoreline should live in module-owned query/adaptor layers.
- Location: Foundation can start under `src/games/foundation` if that is the easiest path, with a later transition toward the final `src/engine` plus `src/games/*` organization.
- Starting flow: Foundation's first loop should use click-to-place only. Deterministic auto-start placement can be added in a second loop for tests and automation.
- State model: Foundation should start with plain `Player` records rather than introducing a generic entity/component store immediately. A generic entity/component store can be revisited later when multiple modules show repeated needs for composable entities, components, and systems.
- OpenFront migration: Moving files into `src/games/openfront` is acceptable early if imports and tests remain clean.
- Foundation placement: First placement can claim a fixed radius of tiles around the clicked tile.
- Foundation first loop: Prove placement and rendering first. Population/food ticking can be added after the module/rendering loop is stable.
- Foundation UI: Include a small debug panel from the start, even if the first version only reports placement/rendering state.

## Later Entity Model Option
Do not introduce ECS/entity-component storage in the first Foundation loop. It is a later option if plain records begin to block iteration.

In this context, an entity/component store would mean:

```ts
type EntityId = number;

type PositionComponent = { tile: TileRef };
type PopulationComponent = { current: number; nutritionHealth: number };
type FoodComponent = { stock: number; production: number };
type OwnerComponent = { playerId: string };
```

Instead of a concrete `Player` object holding all fields directly, the world would store components by entity id and systems would operate over matching component sets. That can be useful for many different game object types, but it adds abstraction and tooling overhead. Foundation should begin with direct `Player` records, then evaluate ECS only after the first module boundary and population/food loop are working.

The base engine map should stay close to:

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

Module-specific terrain APIs should be separate:

```ts
export interface FoundationTerrain {
  isGrass(tile: TileRef): boolean;
  foodYield(tile: TileRef): number;
}

export interface OpenFrontTerrain {
  isLand(tile: TileRef): boolean;
  isOcean(tile: TileRef): boolean;
  isShore(tile: TileRef): boolean;
}
```

This keeps options such as lava, temperature, fertility, roads, elevation, or module-specific passability from becoming engine assumptions.

## Next Step
Use `PARALLEL_BATCHES.md` as the execution guide for what can run concurrently and where to stop for review.

Large sub-scopes uncovered during planning should become their own initiatives instead of overloading this one. Likely candidates include protocol-envelope migration, renderer modularization, OpenFront module relocation, and Foundation MVP.

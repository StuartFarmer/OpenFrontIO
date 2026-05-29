# Analysis Report: Multiplayer Module Compatibility

## Executive Summary
- The server already has reusable multiplayer infrastructure: authenticated join/rejoin, deterministic turn batching, turn replay to late clients, ping/disconnect checks, hash collection, desync notices, and archiving.
- The reusable infrastructure is hidden behind OpenFront-shaped schemas. `GameConfig`, `Intent`, `GameStartInfo`, `Turn`, `prestart`, `winner`, and archive records all embed OpenFront assumptions.
- Foundation should remain single-player first, but it should run through the same local turn envelope shape that remote multiplayer will later use.
- OpenFront compatibility requires a bridge period: existing messages continue to parse, while generic module envelopes are introduced beside them.

## Findings

### 1. Current Wire Schemas Make OpenFront The Only Valid Game
- Evidence:
  - `Intent` is a union of OpenFront commands such as attack, boat, alliance, emoji, donations, embargo, build, warship movement, structure upgrade/delete, pause, and lobby-control intents in `src/core/Schemas.ts:30`.
  - `GameConfigSchema` requires OpenFront fields such as `gameMap`, `difficulty`, `donateGold`, `gameMode`, `gameMapSize`, `nations`, `bots`, `disabledUnits`, `playerTeams`, and mechanics in `src/core/Schemas.ts:222`.
  - `GameStartInfoSchema` stores `config: GameConfigSchema`, so every start message is OpenFront-config-shaped in `src/core/Schemas.ts:567`.
  - `ClientIntentMessageSchema` accepts only `IntentSchema` in `src/core/Schemas.ts:672`.
- Impact:
  - A non-OpenFront module cannot define native config or intent payloads without either faking OpenFront fields or widening the core schema.
  - Foundation cannot have a small command set such as `foundation/place_player` without coupling to the OpenFront intent union.
- Recommendation:
  - Introduce generic envelopes: `ModuleGameStartEnvelope`, `ModuleConfigEnvelope`, `ModuleIntentEnvelope`, and `ModuleTurn`.
  - Keep existing OpenFront schemas as the OpenFront module payload schema and bridge old messages into the new envelope.
- Risk:
  - A careless schema replacement could break production clients. Add compatibility parsers and tests before migrating callers.

### 2. Server Turn Relay Is Reusable But Stamps OpenFront Intents
- Evidence:
  - `GameServer` parses every connected-client message through `ClientMessageSchema` in `src/server/GameServer.ts:341`.
  - On `"intent"`, the server stamps `clientID` onto `clientMsg.intent` and stores it as a `StampedIntent` in `src/server/GameServer.ts:380`.
  - Turns are produced as `{ turnNumber, intents }` and broadcast as `ServerTurnMessage` in `src/server/GameServer.ts:816`.
  - `markClientDisconnected()` injects an OpenFront `mark_disconnected` intent into the turn stream in `src/server/GameServer.ts:1050`.
- Impact:
  - The deterministic relay is valuable, but the turn payload type is not generic.
  - Module-independent connection events are currently encoded as OpenFront gameplay intents.
- Recommendation:
  - Keep turn numbers and ordered delivery in the server layer, but replace `StampedIntent[]` with module-stamped payload envelopes.
  - Move disconnect state into either engine-level connection events or module-specific lifecycle hooks, with OpenFront adapting it back to `mark_disconnected` during the bridge.
- Risk:
  - Disconnect semantics affect gameplay and UI. OpenFront must keep identical behavior while the engine-level representation is introduced.

### 3. Lobby Start And Prestart Are OpenFront Map-Centric
- Evidence:
  - `prestart()` sends only `gameMap` and `gameMapSize` from `this.gameConfig` in `src/server/GameServer.ts:647`.
  - `ServerPrestartMessageSchema` requires `gameMap` and `gameMapSize` in `src/core/Schemas.ts:597`.
  - `ClientGameRunner.joinLobby()` handles `prestart` by immediately loading an OpenFront terrain map with `loadTerrainMap(message.gameMap, message.gameMapSize, ...)` in `src/client/ClientGameRunner.ts:133`.
  - `start()` creates `GameStartInfo` with `config: this.gameConfig` and OpenFront player cosmetics in `src/server/GameServer.ts:734`.
- Impact:
  - Foundation cannot pre-load a generated map or module-owned assets through the existing prestart message.
  - Non-OpenFront modules have no place to carry module-specific start metadata.
- Recommendation:
  - Add a generic prestart envelope: `{ type: "prestart", moduleId, payload }`.
  - Add a generic start envelope: `{ type: "start", moduleId, gameStart, turns, myClientID }`.
  - OpenFront payload remains `{ gameMap, gameMapSize }` initially.
- Risk:
  - Prestart controls perceived startup latency. The bridge should preserve the existing OpenFront fast map-load path.

### 4. LocalServer Is The Right First Compatibility Harness For Foundation
- Evidence:
  - `Transport` selects local mode for single-player games and replays in `src/client/Transport.ts:200`.
  - `LocalServer` already mirrors server turn pacing: it collects `StampedIntent[]`, emits start messages, sends ordered turns, handles pause, and accepts rejoin in `src/client/LocalServer.ts:82`.
  - `LocalServer` stores replay turns and compares archived hashes for replays in `src/client/LocalServer.ts:138` and `src/client/LocalServer.ts:200`.
- Impact:
  - Foundation can stay single-player while exercising the same logical lifecycle: start, intent, turn, turn-complete, hash, replay, and cleanup.
  - If Foundation bypasses `LocalServer` entirely, its later multiplayer path will be less trustworthy.
- Recommendation:
  - Convert or wrap `LocalServer` around the generic envelope first.
  - Let Foundation use local generic turns before any remote WebSocket support.
- Risk:
  - Local and remote behavior can diverge if only one path gets the new envelope. Tests should compare local and server turn construction semantics.

### 5. Worker/Main-Thread Runtime Is A Strong Candidate But Its Query API Is OpenFront-Specific
- Evidence:
  - `WorkerMessages.ts` imports OpenFront `BuildableUnit`, `PlayerActions`, `PlayerBorderTiles`, `PlayerProfile`, `PlayerBuildableUnitType`, `GameUpdateViewData`, and `Turn` in `src/core/worker/WorkerMessages.ts:1`.
  - Worker message types include `player_actions`, `player_buildables`, `player_profile`, `player_border_tiles`, `attack_clustered_positions`, and `transport_ship_spawn` in `src/core/worker/WorkerMessages.ts:13`.
  - The worker drain loop is reusable: it runs pending turns, batches updates, and transfers update buffers in `src/core/worker/Worker.worker.ts:42`.
  - Worker initialization always calls `createGameRunner()` with OpenFront `GameStartInfo` in `src/core/worker/Worker.worker.ts:140`.
- Impact:
  - The worker turn/drain mechanism can be shared, but non-OpenFront modules should not inherit OpenFront interactive query messages.
  - Foundation needs a worker runtime capable of module-owned updates and module-owned queries.
- Recommendation:
  - Split worker protocol into engine messages (`init`, `turn`, `game_update_batch`, `query`) and OpenFront query payloads.
  - Introduce a module worker runtime interface, then adapt OpenFront's current query messages behind it.
- Risk:
  - Query messages are used by OpenFront UI for radial menus, buildability, attacks, and profile display. Keep them through an OpenFront adapter during migration.

### 6. Rejoin, Replay, Hash, Desync, Winner, And Archive Are Not Yet Module-Capability Based
- Evidence:
  - Rejoin sends `turns: this.turns.slice(lastTurn)` in `sendStartGameMsg()` in `src/server/GameServer.ts:793`.
  - Server desync compares client-submitted hashes every 10 turns and broadcasts `desync` messages in `src/server/GameServer.ts:1100`.
  - `winner` uses OpenFront `WinnerSchema` and `AllPlayersStatsSchema` in `src/core/Schemas.ts:650`.
  - Server archive stores OpenFront `config`, `PlayerRecord`, `turns`, stats, and winner in `src/server/GameServer.ts:1059`.
  - Single-player archive rejects anything not `GameType.Singleplayer` and assumes one player in `src/server/Worker.ts:246`.
- Impact:
  - Some modules may have minimal winner, stats, archive, or hash semantics.
  - Foundation should not be forced to implement OpenFront stats to use deterministic turns, but it should still travel through the same engine service path with minimal payloads.
- Recommendation:
  - Define default module service hooks for remote multiplayer, replay, archive, winner/end-state, hash cadence, and hash payload creation.
  - Foundation should implement minimal service payloads first instead of opting out through capability booleans.
- Risk:
  - Archives and replay records are long-lived formats. Version any generic record envelopes before migrating storage.

### 7. Public Lobby Scheduling And IPC Are OpenFront Config-Coupled
- Evidence:
  - `GameManager.createGame()` merges defaults for OpenFront `GameConfig` such as map, mode, nations, bots, and disabled units in `src/server/GameManager.ts:64`.
  - Worker create-game HTTP validates through `CreateGameInputSchema`, which is `GameConfigSchema` or empty object in `src/core/WorkerSchemas.ts:3`.
  - Master/worker IPC `MasterCreateGameSchema` requires `gameConfig: GameConfigSchema` in `src/server/IPCBridgeSchema.ts:55`.
- Impact:
  - Public module lobbies cannot be scheduled without becoming OpenFront configs.
  - This is not a Foundation MVP blocker if Foundation remains single-player first, but it is a future remote multiplayer blocker.
- Recommendation:
  - Keep public scheduling registration-gated initially; OpenFront remains the only registered public module until module-aware paths are stable.
  - Add module-aware private game creation first if needed, then route public scheduling through module IDs and `GameModuleRuntime`.
- Risk:
  - Opening public module lobbies too early increases auth, moderation, rate-limit, and observability surface area.

## Quick Wins
- Document `moduleId` as the first field required on new generic game-start and turn envelopes.
- Keep OpenFront as default when `moduleId` is missing.
- Add bridge schemas that parse current OpenFront messages and normalize them into module envelopes internally.
- Treat `LocalServer` as the first Foundation-compatible transport harness.
- Keep public lobbies registration-gated until private/local module paths are stable; do not make OpenFront-only public lobbies permanent.

## Medium Changes
- Introduce generic client/server message schemas beside current `ClientMessageSchema` and `ServerMessageSchema`.
- Add module validation hooks for config, client intent payloads, server-stamped intent payloads, and optional lifecycle events.
- Split worker messages into engine runtime messages and module query payloads.
- Add default module service hooks for replay, archive, winner/end-state, desync hash cadence, and remote multiplayer readiness.
- Add OpenFront compatibility tests for old and new envelope forms.

## High-Risk Decisions
- Whether `GameServer` becomes fully module-aware before Foundation is remote-capable, or whether the first phase only makes local generic envelopes.
- How to represent engine-level disconnect and pause events without baking OpenFront intent types into every module.
- Whether archived turn records should store module envelopes immediately or preserve OpenFront records until a replay migration is designed.
- Whether winner voting is engine-level or module-level. Current evidence points to module-level payload semantics, while the engine should still provide the service path.

## Guardrails
- Do not make Foundation implement OpenFront `GameConfig`, `Intent`, `Winner`, `AllPlayersStats`, or `PlayerRecord`.
- Do not remove current OpenFront messages before compatibility tests prove identical behavior.
- Do not put `if moduleId === "foundation"` checks inside `GameServer`; use module validators and service hooks after one registry lookup.
- Do not let client-supplied payloads carry authoritative `clientID`; the server must continue stamping identity.
- Do not make Foundation remote-multiplayer visible until rejoin, hash/desync, replay/cleanup, and rate-limit behavior are explicitly decided.

## Recommended Compatibility Model
The target shape should be:

```ts
type ModuleId = string;

interface GameStartEnvelope {
  gameID: string;
  moduleId: ModuleId;
  players: ConnectedPlayerEnvelope[];
  config: unknown;
  lobbyCreatedAt: number;
  visibleAt?: number;
}

interface ClientIntentEnvelope {
  moduleId: ModuleId;
  payload: unknown;
}

interface StampedIntentEnvelope {
  moduleId: ModuleId;
  clientID: string;
  payload: unknown;
}

interface TurnEnvelope {
  turnNumber: number;
  intents: StampedIntentEnvelope[];
  hash?: number | null;
}
```

The server validates only the envelope and connection authority. The selected module validates `config` and `payload`.

OpenFront's bridge maps current `GameStartInfo`, `Intent`, `StampedIntent`, and `Turn` into these envelopes and back until the client/server stack speaks the generic shape directly.

## Clarified Decisions
- Begin this work after the Foundation single-player and generic protocol seams exist.
- Local-server support may come first, but the architecture must lead to the same central-server concept OpenFront uses.
- Hash/desync/rejoin/replay/archive/winner behavior should be default engine services with module-owned payload semantics; explicit capability flags can wait until a concrete exception appears.
- The desired end state is instant multiplayer ability for modules once compatibility work is complete, not a permanently local-only Foundation path.

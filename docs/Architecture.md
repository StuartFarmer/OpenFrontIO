# Game Architecture

The game is split into four components:

1. **client** - Handles rendering and UI for the user

2. **core** - Deterministic simulation. It is pure TypeScript/JavaScript code with no external dependencies. It must be fully deterministic.

3. **server** - Handles coordination and relays of intents/requests

4. **api** - A closed source Cloudflare Worker that handles auth, stats, game data storage, cosmetics, and monetization

## Simulation Architecture

The game simulation logic does not run on the server. Instead, each client runs their own instance of core, which is why it must be deterministic. At the end of each tick, data is sent from core to client via GameUpdates. Core and client run in different threads - the core runs in a worker thread.

## Systems Runtime

Core runs a deterministic systems scheduler inside `GameImpl.executeNextTick()`.
The scheduler owns the tick phase order and currently hosts the legacy execution
adapter as a compatibility phase. Major simulation families have native system
owners:

- Player economy and upkeep: `PlayerEconomySystem`, `PlayerUpkeepSystem`.
- Attack, battle, territory, and conquest: `AttackCommandSystem`,
  `BattleResolutionSystem`, `TerritoryConquestSystem`.
- Construction, structures, mobile units, and projectiles: `StructureSystem`,
  `MobileUnitSystem`, `ProjectileSystem`.
- Client and AI command submission: `IntentCommandSurface` and
  `AiCommandSurface`.

`Execution` classes are still part of the public compatibility layer. Some are
thin shims that delegate behavior to systems, while others are intentionally
retained engines until dedicated spawn, AI, social-action, and per-unit systems
replace them. The source-of-truth classification is
`src/core/systems/LegacyExecutionRegistry.ts`.

## Intents

When a user performs an action, it creates an "Intent" which is sent to the server. The server stores all intents for that tick/turn, and at the end, relays all intents to all clients in a bundle called a "turn". Each client receives the turn and sends it to its core simulation. The core then creates an "Execution" for each intent. Executions are the only thing that can modify the game state.

In the systems runtime, client turns are first normalized by
`IntentCommandSurface`. AI, tribe, and nation decisions use `AiCommandSurface`.
Those surfaces preserve the existing execution payloads and tick timing while
keeping command creation behind a systems boundary.

## Flow

1. Client sends intent to game server
2. Game server sends turn to client
3. Client forwards turn to core
4. Core maps intents through `IntentCommandSurface`
5. Core calls `executeNextTick()`
6. The systems scheduler runs each deterministic phase
7. Compatibility executions run through `LegacyExecutionSystem` where retained
8. At the end of the tick core sends updates to client
9. Client merges and renders the updates

## Static Assets / CDN

The game server only renders `index.html` and serves the websocket. Every other asset (the Vite JS/CSS bundle, images, map binaries, the worker module) is served from a CDN bucket. Setting `CDN_BASE` to an empty string falls back to same-origin and is the dev default.

### `CDN_BASE` format

- Full origin, no path, no trailing slash: `https://cdn.example.com`
- Set as a build-time variable in `vite.config.ts` (so the manifest is built with absolute URLs) and as a runtime env var on the server (so `RenderHtml.ts` can prefix Vite's emitted `/assets/...` refs at request time).
- Configured in CI via `vars.CDN_BASE` in `.github/workflows/{deploy,release}.yml`.

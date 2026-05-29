# Initiative: Generic Protocol and Update Envelope Migration

## Stack
- Language: TypeScript
- Package manager: npm
- Test runner: Vitest
- Build: Vite plus `tsc --noEmit`
- UI: Lit custom elements, custom WebGL2 renderer under `src/client/render/gl`
- Server: Express, WebSocket, `tsx`
- Schemas: Zod v4
- CI: repository workflow not inspected in this initiative

## Goal

Split the shared engine protocol from OpenFront-owned gameplay payloads so multiple game modules can share connection, turn, worker, and update transport without inheriting OpenFront commands, config, update enums, players, units, alliances, railroads, or victory semantics.

Foundation should start directly on the generic protocol/update envelope. OpenFront should continue to run through a temporary bridge from its existing payloads while the renderer, HUD, replay, and parity tests migrate incrementally.

## Problem Statement

The current wire and worker contracts are OpenFront contracts. `GameStartInfoSchema`, `GameConfigSchema`, `TurnSchema`, `IntentSchema`, `GameUpdateViewData`, and `GameUpdateType` encode one game's assumptions. This blocks an engine/SDK architecture because a new game module would need to pretend it has OpenFront maps, intents, players, units, alliances, railroads, and win events just to use the runtime.

The protocol needs a stable engine envelope:

```ts
interface GameStartEnvelope {
  gameID: string;
  moduleID: string;
  lobbyCreatedAt: number;
  visibleAt?: number;
  players: EnginePlayerEnvelope[];
  config: unknown;
}

interface TurnEnvelope {
  turnNumber: number;
  intents: StampedIntentEnvelope[];
  hash?: number | null;
}

interface StampedIntentEnvelope {
  clientID: string;
  type: string;
  payload: unknown;
}

interface EngineUpdateEnvelope {
  moduleID: string;
  tick: number;
  map?: {
    packedTileStateUpdates?: Uint32Array;
    packedTerrainUpdates?: Uint32Array;
    packedMotionPlans?: Uint32Array;
  };
  events: ModuleEventEnvelope[];
  metrics?: {
    tickExecutionDuration?: number;
    pendingTurns?: number;
  };
}

interface ModuleEventEnvelope {
  type: string;
  payload: unknown;
}
```

The exact type names can change during implementation, but the ownership boundary should not: the engine owns envelopes, transferables, lifecycle, and message routing; game modules own validation and meaning of `config`, intent payloads, update event payloads, replay event payloads, and client interpretation.

## Success Definition

- Shared protocol types exist outside OpenFront domain files.
- Server/client/worker transport can carry generic start, turn, intent, and update envelopes.
- OpenFront can bridge legacy `GameStartInfo`, `Turn`, `StampedIntent`, and `GameUpdateViewData` to/from generic envelopes with no gameplay behavior change.
- Foundation can use generic envelopes directly without importing OpenFront `GameUpdateType`, `GameConfigSchema`, or `IntentSchema`.
- Existing worker/client update parity and player update merge behavior stay covered while new generic envelope tests pin the bridge.

## Non-Goals

- Do not implement Foundation gameplay in this initiative.
- Do not relocate all OpenFront code into `src/games/openfront`; this initiative only prepares protocol boundaries.
- Do not replace the custom WebGL renderer.
- Do not remove the OpenFront legacy update shape in one pass.
- Do not redesign multiplayer authentication, lobby admission, or archival storage beyond envelope compatibility.

## Constraints

- Other work is active in the repository; do not revert unrelated edits.
- OpenFront must continue to run while the bridge exists.
- Multiplayer expects server stamping of client identity and ordered turns.
- Worker update batches rely on transferable typed array buffers for performance.
- Replay and parity utilities currently assume `GameUpdateViewData` and `GameUpdateType`.
- The first Foundation path is single-player, but abstractions must remain compatible with future multiplayer message passing.

## Assumptions

- The first generic envelope can live under `src/core/protocol` or a similar shared engine location.
- Module-owned payload validation should use Zod schemas exposed through the module contract, not OpenFront's discriminated unions.
- `moduleID` will default to `openfront` when reading old starts/records that do not include it.
- OpenFront's current `packedTileUpdates` can become `map.packedTileStateUpdates` in the generic envelope.
- OpenFront's `packedMotionPlans` can remain an optional engine map/motion transferable until renderer modularization decides its final ownership.

## Risk Posture

High coordination risk, medium implementation risk. The work crosses schemas, server WebSocket parsing, local single-player transport, worker messages, runner callbacks, client update consumption, replay utilities, and tests. It should be done in small bridge-first steps with parity tests and no large semantic rewrites.

## Next Step

Execute the plan in `PLAN.md`. Start by introducing protocol contracts and OpenFront adapters before changing worker or client runtime call sites.

## Clarified Decisions
- The generic start/turn/intent/update envelope should become the primary API immediately.
- OpenFront should be bridged into the generic API during migration, not kept as an equal permanent protocol.
- Module config, intent, and update payloads should be validated with Zod schemas.
- Replay/archive compatibility can wait for a later initiative.

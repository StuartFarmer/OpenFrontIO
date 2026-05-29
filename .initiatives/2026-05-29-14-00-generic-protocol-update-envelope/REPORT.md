# Analysis Report: Generic Protocol and Update Envelope Migration

## Executive Summary
- The current protocol is OpenFront-shaped end to end: `GameStartInfoSchema`, `GameConfigSchema`, `IntentSchema`, `TurnSchema`, and `GameUpdateViewData` live in core but encode OpenFront mechanics.
- The worker bridge is the critical migration point because `WorkerClient`, `Worker.worker.ts`, `WorkerMessages.ts`, and `GameRunner` all exchange `GameUpdateViewData` and transfer its buffers directly.
- The client update path consumes OpenFront update enums in the main loop, HUD, renderer frame builder, and tests; OpenFront needs a bridge so Foundation can start clean without forcing all UI code to migrate at once.
- Existing parity tests are valuable guardrails and should be expanded rather than bypassed.

## Findings

### 1. Core schemas combine engine envelopes with OpenFront payloads
- Evidence:
  - `src/core/Schemas.ts` defines `GameConfigSchema` with OpenFront map, difficulty, game mode, nations, bots, unit disablement, alliances, sandbox, mechanics, and resource tuning fields.
  - `src/core/Schemas.ts` defines `IntentSchema` as an OpenFront discriminated union including `attack`, `boat`, `allianceRequest`, `donate_gold`, `build_unit`, `move_warship`, `quick_chat`, `embargo`, and `set_food_allocation`.
  - `src/core/Schemas.ts` defines `TurnSchema` as `StampedIntentSchema.array()`, so turns cannot carry module-owned intent payloads.
  - `src/core/Schemas.ts` defines `GameStartInfoSchema` with `config: GameConfigSchema`.
  - `src/core/WorkerSchemas.ts` parses create-game input as `GameConfigSchema`.
- Impact: A new game module cannot use the existing transport without adopting OpenFront's config and intent vocabulary.
- Recommendation: Introduce generic start, turn, stamped intent, and module payload validation contracts. Keep OpenFront schemas as one module's schemas and bridge legacy shapes.
- Risk: Changing `TurnSchema` directly can break server, local single-player, replay records, and tests. Start with parallel generic types and adapters.

### 2. Worker updates are hard-coded to `GameUpdateViewData`
- Evidence:
  - `src/core/game/GameUpdates.ts` defines `GameUpdateViewData` with `updates: GameUpdates`, `packedTileUpdates`, `packedMotionPlans`, and `playerNameViewData`.
  - `src/core/worker/WorkerMessages.ts` uses `GameUpdateViewData` for `game_update` and `game_update_batch`.
  - `src/core/worker/Worker.worker.ts` batches `GameUpdateViewData[]` and transfers `gu.packedTileUpdates.buffer` plus optional `packedMotionPlans.buffer`.
  - `src/core/worker/WorkerClient.ts` exposes `start(gameUpdate: (gu: GameUpdateViewData | ErrorUpdate) => void)`.
  - `src/core/GameRunner.ts` calls back with `GameUpdateViewData`.
- Impact: Foundation would need to emit an OpenFront update object to use the worker, even if it only needs a map delta and `foundation/player_placed` event.
- Recommendation: Add `EngineUpdateEnvelope` and a legacy OpenFront adapter. Worker batching should operate on generic envelopes and discover transferables through a helper.
- Risk: Incorrect transferable collection can detach buffers too early or stop transferring large updates efficiently.

### 3. OpenFront event enums are consumed directly by client runtime and UI
- Evidence:
  - `src/client/ClientGameRunner.ts` reads `gu.updates[GameUpdateType.Hash]` and `gu.updates[GameUpdateType.Win]` in the main worker callback.
  - HUD layers such as `EventsDisplay`, `HeadsUpMessage`, `WinModal`, `ControlPanel`, and `AttacksDisplay` import `GameUpdateType`.
  - `src/client/WebGLFrameBuilder.ts` updates custom WebGL from `GameView.frameData()`, which is itself driven by OpenFront `GameView.update(gu)`.
  - `src/client/render/frame/RailroadCache.ts` reads railroad construction/snap/destruction updates from `GameUpdateViewData`.
  - `src/client/render/types/GameUpdates.ts` duplicates numeric `GameUpdateType` constants and comments that values must match the live game.
- Impact: A generic protocol cannot be consumed directly by existing OpenFront UI without a bridge, and Foundation should not depend on OpenFront enum values.
- Recommendation: Keep OpenFront UI on legacy updates initially through `OpenFrontUpdateBridge.toLegacyViewData(envelope)`, then migrate OpenFront consumers feature by feature.
- Risk: Long-lived dual shapes can drift. Tests should pin round-trip conversion and explicitly mark the bridge as transitional.

### 4. Runtime command routing is OpenFront-specific
- Evidence:
  - `src/core/systems/commands/IntentCommandSurface.ts` switches on OpenFront intent types and creates OpenFront executions.
  - `src/core/execution/ExecutionManager.ts` wraps that command surface and also spawns tribes, players, and nations.
  - `src/core/GameRunner.ts` constructs `new Executor(game, gameStart.gameID, clientID)` directly.
  - `src/client/Transport.ts` turns many OpenFront UI events into OpenFront `Intent` objects.
  - `src/client/LocalServer.ts` stores `StampedIntent[]` and stamps client IDs into OpenFront intents.
- Impact: Generic intent envelopes must be introduced before game modules can own command vocabularies.
- Recommendation: Create `StampedIntentEnvelope` and `TurnEnvelope`, then adapt OpenFront `Intent` to/from `{ type, payload }` while Foundation defines its own payloads.
- Risk: Server-side rate limiting and replay hashing may assume OpenFront intent sizes and exact JSON shape.

### 5. Multiplayer server messages and local single-player messages share OpenFront start/turn types
- Evidence:
  - `src/core/Schemas.ts` defines `ServerStartGameMessageSchema` with `turns: TurnSchema.array()` and `gameStartInfo: GameStartInfoSchema`.
  - `src/client/Transport.ts` validates remote messages with `ServerMessageSchema`.
  - `src/client/LocalServer.ts` sends the same `ServerStartGameMessage` and `ServerTurnMessage` types for local single-player.
  - `src/server/Worker.ts` parses client messages with `ClientMessageSchema`.
  - `src/server/GameManager.ts` creates games from `GameConfig`.
- Impact: The single-player Foundation path can be implemented first, but protocol design must not close off multiplayer because both paths share message schemas.
- Recommendation: Add generic wire message schemas that can carry a module ID and unknown/module-validated payloads, then bridge OpenFront server messages during migration.
- Risk: Adding `unknown` payloads to public WebSocket messages without module validators would weaken validation. The engine should validate envelopes and delegate payload validation to the selected module.

### 6. Tests already protect useful legacy behavior
- Evidence:
  - `tests/core/systems/WorkerClientUpdateParity.test.ts` compares `GameRunner` payloads against direct `GameUpdates`, packed tile updates, motion plans, tick, pending turns, and player name data.
  - `tests/GameUpdateUtils.test.ts` pins partial player update diff/merge behavior.
  - `tests/util/parity/ParitySnapshot.ts` can capture and normalize `GameUpdateViewData`.
  - Many HUD/client tests build `GameUpdateViewData` stubs in `tests/util/viewStubs.ts`.
- Impact: The migration can be made safer by adding envelope/bridge tests adjacent to existing parity tests.
- Recommendation: Add adapter tests before swapping call sites, then preserve the legacy parity test through the OpenFront bridge.
- Risk: If tests are updated only after runtime changes, regressions in typed array transfer, partial player updates, or update ordering may be hard to isolate.

## Quick Wins
- Add `moduleID?: "openfront"` defaulting at adapter boundaries.
- Introduce `EngineUpdateEnvelope` and `ModuleEventEnvelope` types without changing runtime behavior.
- Add OpenFront adapter functions that wrap `GameUpdateViewData` into a generic envelope and unwrap it back.
- Add tests for OpenFront update bridge round-trip and transferable collection.

## Medium Changes
- Change worker message types to carry generic update envelopes while preserving OpenFront callback compatibility through a wrapper.
- Add generic `TurnEnvelope` and `StampedIntentEnvelope` and bridge OpenFront turns.
- Update local single-player transport to stamp generic intents and default old starts to `openfront`.
- Add module-owned validators/facades so Foundation can define config and intent payloads independently.

## High-Risk Decisions
- Whether to replace `TurnSchema` in place or run generic and legacy turn schemas side by side during migration.
- Whether `playerNameViewData` remains an OpenFront legacy event or becomes a module-owned renderer event.
- Whether `packedMotionPlans` is engine-level or OpenFront renderer-specific.
- How replay/archive records version generic envelopes without breaking old records.

## Guardrails
- Bridge first, then migrate call sites.
- Keep OpenFront behavior byte-for-byte where parity tests already check update snapshots.
- Do not make `GameConfigSchema` the engine config schema.
- Do not make `GameUpdateType` part of the generic envelope.
- Do not let Foundation import OpenFront `Intent`, `GameConfig`, `GameUpdateType`, or `GameUpdateViewData`.
- Keep transferable typed arrays explicit and tested.

## Clarified Decisions
- Generic envelopes are the primary API immediately.
- OpenFront compatibility is handled through transitional bridges.
- Module config, intent, and update payloads are validated with Zod schemas.
- Replay/archive support is out of scope for the first protocol migration.

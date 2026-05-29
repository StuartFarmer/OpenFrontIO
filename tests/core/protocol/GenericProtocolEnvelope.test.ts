import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, test } from "vitest";
import type {
  EngineUpdateEnvelope,
  GameStartEnvelope,
  TurnEnvelope,
} from "../../../src/core/protocol";
import {
  collectUpdateEnvelopeTransferables,
  EngineErrorEnvelopeSchema,
  EngineUpdateEnvelopeSchema,
  GameStartEnvelopeSchema,
  StampedIntentEnvelopeSchema,
  TurnEnvelopeSchema,
} from "../../../src/core/protocol";

describe("generic protocol envelopes", () => {
  test("generic_start_envelope_accepts_unknown_config", () => {
    const start = {
      gameId: "game-1",
      moduleId: "foundation",
      lobbyCreatedAt: 1_764_320_000,
      visibleAt: 1_764_320_500,
      players: [
        {
          playerId: "player-1",
          clientId: "client-1",
          username: "Ada",
          profile: { color: "cyan" },
        },
      ],
      config: {
        board: { width: 12, height: 8 },
        winCondition: "connect_three_cities",
      },
    } satisfies GameStartEnvelope;

    const parsed = GameStartEnvelopeSchema.safeParse(start);

    expect(parsed.success).toBe(true);
    expect(parsed.data).toMatchObject({
      gameId: "game-1",
      moduleId: "foundation",
      config: {
        board: { width: 12, height: 8 },
        winCondition: "connect_three_cities",
      },
    });
  });

  test("generic_turn_envelope_accepts_module_owned_intents", () => {
    const turn = {
      moduleId: "foundation",
      turnNumber: 7,
      hash: null,
      intents: [
        {
          clientId: "client-1",
          type: "foundation/place_city",
          payload: { tile: 42, cityName: "North Gate" },
        },
      ],
    } satisfies TurnEnvelope;

    const parsedTurn = TurnEnvelopeSchema.safeParse(turn);
    const parsedIntent = StampedIntentEnvelopeSchema.safeParse(turn.intents[0]);

    expect(parsedTurn.success).toBe(true);
    expect(parsedTurn.data?.moduleId).toBe("foundation");
    expect(parsedIntent.success).toBe(true);
    expect(parsedTurn.data?.intents[0]).toEqual({
      clientId: "client-1",
      type: "foundation/place_city",
      payload: { tile: 42, cityName: "North Gate" },
    });
  });

  test("generic_update_envelope_carries_module_events", () => {
    const packedTileStateUpdates = new Uint32Array([1, 2, 3]);
    const packedTerrainUpdates = new Uint32Array([4, 5]);
    const packedMotionPlans = new Uint32Array([6]);
    const update = {
      moduleId: "foundation",
      tick: 12,
      map: {
        packedTileStateUpdates,
        packedTerrainUpdates,
        packedMotionPlans,
      },
      events: [
        {
          type: "foundation/player_placed",
          payload: { playerId: "player-1", tile: 24 },
        },
      ],
      metrics: {
        tickExecutionDuration: 3.5,
        pendingTurns: 2,
      },
    } satisfies EngineUpdateEnvelope;

    const parsed = EngineUpdateEnvelopeSchema.safeParse(update);
    const transferables = collectUpdateEnvelopeTransferables(update);

    expect(parsed.success).toBe(true);
    expect(parsed.data?.moduleId).toBe("foundation");
    expect(parsed.data?.events).toEqual(update.events);
    expect(parsed.data?.metrics).toEqual({
      tickExecutionDuration: 3.5,
      pendingTurns: 2,
    });
    expect(transferables).toEqual([
      packedTileStateUpdates.buffer,
      packedTerrainUpdates.buffer,
      packedMotionPlans.buffer,
    ]);
  });

  test("protocol_transferable_shape_deduplicates_shared_buffers", () => {
    const sharedBuffer = new ArrayBuffer(16);
    const update = {
      moduleId: "foundation",
      tick: 13,
      map: {
        packedTileStateUpdates: new Uint32Array(sharedBuffer, 0, 2),
        packedTerrainUpdates: new Uint32Array(sharedBuffer, 8, 2),
      },
      events: [],
    } satisfies EngineUpdateEnvelope;

    expect(collectUpdateEnvelopeTransferables(update)).toEqual([sharedBuffer]);
  });

  test("generic_error_envelope_validates_shape", () => {
    const parsed = EngineErrorEnvelopeSchema.safeParse({
      moduleId: "foundation",
      code: "intent_rejected",
      message: "Intent failed module validation",
      details: { intentType: "foundation/place_city" },
      tick: 13,
      recoverable: true,
    });

    expect(parsed.success).toBe(true);
    expect(parsed.data).toMatchObject({
      moduleId: "foundation",
      code: "intent_rejected",
      recoverable: true,
    });
  });

  test("protocol_contracts_do_not_import_openfront_domain_types", () => {
    const protocolRoot = resolve(
      import.meta.dirname,
      "../../../src/core/protocol",
    );
    const files = ["index.ts", "schemas.ts", "transferables.ts", "types.ts"];

    for (const file of files) {
      const source = readFileSync(resolve(protocolRoot, file), "utf8");

      expect(source).not.toContain("../game/");
      expect(source).not.toContain("./game/");
      expect(source).not.toContain("GameUpdateType");
      expect(source).not.toContain("GameConfig");
      expect(source).not.toContain("IntentSchema");
    }
  });
});

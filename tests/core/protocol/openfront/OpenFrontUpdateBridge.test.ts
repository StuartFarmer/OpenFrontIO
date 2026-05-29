import { describe, expect, test } from "vitest";
import type { GameUpdates } from "../../../../src/core/game/Game";
import {
  GameUpdateType,
  type GameUpdateViewData,
} from "../../../../src/core/game/GameUpdates";
import {
  OPENFRONT_LEGACY_UPDATES_EVENT,
  OPENFRONT_MODULE_ID,
  OPENFRONT_PLAYER_NAME_VIEW_DATA_EVENT,
} from "../../../../src/core/protocol/openfront/constants";
import {
  collectOpenFrontUpdateTransferables,
  toEngineUpdateEnvelope,
  toOpenFrontGameUpdateViewData,
} from "../../../../src/core/protocol/openfront/update";

describe("OpenFront update bridge", () => {
  test("openfront_update_bridge_round_trips_game_update_view_data", () => {
    const packedTileUpdates = new Uint32Array([10, 20, 30, 40]);
    const packedMotionPlans = new Uint32Array([7, 8, 9]);
    const updates = emptyGameUpdates();
    updates[GameUpdateType.Hash].push({
      type: GameUpdateType.Hash,
      tick: 42,
      hash: 12345,
    });
    const gameUpdate = {
      tick: 42,
      updates,
      packedTileUpdates,
      packedMotionPlans,
      playerNameViewData: {
        "player-a": { x: 1, y: 2, size: 3 },
      },
      tickExecutionDuration: 5.5,
      pendingTurns: 3,
    } satisfies GameUpdateViewData;

    const envelope = toEngineUpdateEnvelope(gameUpdate);
    const roundTrip = toOpenFrontGameUpdateViewData(envelope);

    expect(envelope).toMatchObject({
      moduleId: OPENFRONT_MODULE_ID,
      tick: 42,
      metrics: {
        tickExecutionDuration: 5.5,
        pendingTurns: 3,
      },
    });
    expect(envelope.map?.packedTileStateUpdates).toBe(packedTileUpdates);
    expect(envelope.map?.packedMotionPlans).toBe(packedMotionPlans);
    expect(envelope.events.map((event) => event.type)).toEqual([
      OPENFRONT_LEGACY_UPDATES_EVENT,
      OPENFRONT_PLAYER_NAME_VIEW_DATA_EVENT,
    ]);
    expect(roundTrip).toEqual(gameUpdate);
    expect(roundTrip.packedTileUpdates).toBe(packedTileUpdates);
    expect(roundTrip.packedMotionPlans).toBe(packedMotionPlans);
    expect(roundTrip.updates).toBe(updates);
    expect(roundTrip.playerNameViewData).toBe(gameUpdate.playerNameViewData);
  });

  test("openfront_update_bridge_transferables", () => {
    const packedTileUpdates = new Uint32Array([1, 2]);
    const packedMotionPlans = new Uint32Array([3, 4]);
    const gameUpdate = {
      tick: 1,
      updates: emptyGameUpdates(),
      packedTileUpdates,
      packedMotionPlans,
      playerNameViewData: {},
    } satisfies GameUpdateViewData;

    expect(collectOpenFrontUpdateTransferables(gameUpdate)).toEqual([
      packedTileUpdates.buffer,
      packedMotionPlans.buffer,
    ]);
  });
});

function emptyGameUpdates(): GameUpdates {
  return Object.fromEntries(
    Object.values(GameUpdateType)
      .filter((value): value is number => typeof value === "number")
      .map((type) => [type, []]),
  ) as unknown as GameUpdates;
}

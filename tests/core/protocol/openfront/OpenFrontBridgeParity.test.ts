import { describe, expect, test } from "vitest";
import type { PlayerState } from "../../../../src/client/render/types";
import type { GameUpdates } from "../../../../src/core/game/Game";
import {
  applyStateUpdate,
  diffPlayerUpdate,
} from "../../../../src/core/game/GameUpdateUtils";
import {
  GameUpdateType,
  type GameUpdateViewData,
  type PlayerUpdate,
} from "../../../../src/core/game/GameUpdates";
import {
  toEngineUpdateEnvelope,
  toOpenFrontGameUpdateViewData,
} from "../../../../src/core/protocol/openfront/update";
import { normalizeForParity } from "../../../util/parity/ParitySnapshot";
import { makePlayerUpdate } from "../../../util/viewStubs";

describe("OpenFront bridge parity", () => {
  test("openfront_bridge_preserves_parity_snapshot", () => {
    const updates = emptyGameUpdates();
    updates[GameUpdateType.Hash].push({
      type: GameUpdateType.Hash,
      tick: 77,
      hash: 321,
    });
    updates[GameUpdateType.Player].push(
      makePlayerUpdate({
        id: "player-a",
        gold: 250n,
        resources: { food: 11n, energy: 12n, materials: 13n },
      }),
    );
    const legacyUpdate = {
      tick: 77,
      updates,
      packedTileUpdates: new Uint32Array([1, 2, 3, 4]),
      packedMotionPlans: new Uint32Array([5, 6]),
      playerNameViewData: {
        "player-a": { x: 10, y: 20, size: 30 },
      },
      tickExecutionDuration: 2.25,
      pendingTurns: 1,
    } satisfies GameUpdateViewData;

    const bridgedUpdate = toOpenFrontGameUpdateViewData(
      toEngineUpdateEnvelope(legacyUpdate),
    );

    expect(normalizeForParity(bridgedUpdate)).toEqual(
      normalizeForParity(legacyUpdate),
    );
  });

  test("openfront_bridge_preserves_partial_player_updates", () => {
    const previous = makePlayerUpdate({
      id: "player-a",
      gold: 100n,
      troops: 50,
      resources: { food: 10n, energy: 10n, materials: 10n },
    });
    const next = makePlayerUpdate({
      id: "player-a",
      gold: 175n,
      troops: 65,
      resources: { food: 10n, energy: 12n, materials: 10n },
    });
    const diff = diffPlayerUpdate(previous, next);
    expect(diff).not.toBeNull();
    const playerDiff = diff as PlayerUpdate;

    const legacyUpdate = {
      tick: 88,
      updates: {
        ...emptyGameUpdates(),
        [GameUpdateType.Player]: [playerDiff],
      },
      packedTileUpdates: new Uint32Array(0),
      playerNameViewData: {},
    } satisfies GameUpdateViewData;
    const bridgedUpdate = toOpenFrontGameUpdateViewData(
      toEngineUpdateEnvelope(legacyUpdate),
    );
    const bridgedDiff = bridgedUpdate.updates[GameUpdateType.Player][0];
    const renderState = playerStateFrom(previous);

    applyStateUpdate(renderState, bridgedDiff);

    expect(normalizeForParity(bridgedDiff)).toEqual(
      normalizeForParity(playerDiff),
    );
    expect(renderState.gold).toBe(175);
    expect(renderState.troops).toBe(65);
    expect(renderState.resources).toEqual({
      food: 10,
      energy: 12,
      materials: 10,
    });
  });
});

function emptyGameUpdates(): GameUpdates {
  return Object.fromEntries(
    Object.values(GameUpdateType)
      .filter((value): value is number => typeof value === "number")
      .map((type) => [type, []]),
  ) as unknown as GameUpdates;
}

function playerStateFrom(update: PlayerUpdate): PlayerState {
  return {
    smallID: update.smallID ?? 1,
    isAlive: update.isAlive ?? true,
    isDisconnected: update.isDisconnected ?? false,
    tilesOwned: update.tilesOwned ?? 0,
    gold: Number(update.gold ?? 0n),
    resources: {
      food: Number(update.resources?.food ?? 0n),
      energy: Number(update.resources?.energy ?? 0n),
      materials: Number(update.resources?.materials ?? 0n),
    },
    resourceCapacity: {
      food: Number(update.resourceCapacity?.food ?? 0n),
      energy: Number(update.resourceCapacity?.energy ?? 0n),
      materials: Number(update.resourceCapacity?.materials ?? 0n),
    },
    foodAllocationToPopulation: update.foodAllocationToPopulation ?? 0.5,
    nutritionHealth: update.nutritionHealth ?? 1,
    stockFlowDiagnostics: update.stockFlowDiagnostics,
    effectiveTroopCapacity: update.effectiveTroopCapacity ?? 1_000,
    biomassSupportedTroopCapacity:
      update.biomassSupportedTroopCapacity ?? 1_000,
    troopIncreaseRate: update.troopIncreaseRate ?? 0,
    troops: update.troops ?? 0,
    isTraitor: update.isTraitor ?? false,
    traitorRemainingTicks: update.traitorRemainingTicks ?? 0,
    betrayals: update.betrayals ?? 0,
    hasSpawned: update.hasSpawned ?? true,
    spawnTile: update.spawnTile,
    lastDeleteUnitTick: update.lastDeleteUnitTick ?? 0,
    allies: update.allies ?? [],
    embargoes: update.embargoes ? [...update.embargoes].map(Number) : [],
    targets: update.targets ?? [],
    outgoingAttacks: update.outgoingAttacks ?? [],
    incomingAttacks: update.incomingAttacks ?? [],
    outgoingAllianceRequests: update.outgoingAllianceRequests ?? [],
    alliances: update.alliances ?? [],
    outgoingEmojis: update.outgoingEmojis ?? [],
  };
}

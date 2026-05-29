import { describe, expect, test } from "vitest";
import type { PlayerState } from "../../../src/client/render/types";
import { AttackExecution } from "../../../src/core/execution/AttackExecution";
import { Executor } from "../../../src/core/execution/ExecutionManager";
import { PlayerInfo, PlayerType } from "../../../src/core/game/Game";
import {
  ErrorUpdate,
  GameUpdateViewData,
} from "../../../src/core/game/GameUpdates";
import { applyStateUpdate } from "../../../src/core/game/GameUpdateUtils";
import { GameRunner } from "../../../src/core/GameRunner";
import {
  captureParitySnapshot,
  normalizeForParity,
} from "../../util/parity/ParitySnapshot";
import { setup } from "../../util/Setup";
import { makePlayerUpdate } from "../../util/viewStubs";

describe("worker/client update parity", () => {
  test("worker_update_parity_scripted_game", async () => {
    const expected = await buildTwoPlayerFront();
    const actual = await buildTwoPlayerFront();

    expected.addExecution(
      new AttackExecution(
        1_000,
        expected.player("attacker"),
        expected.player("defender").id(),
      ),
    );
    const expectedUpdates = expected.executeNextTick();
    const expectedPackedTileUpdates = expected.drainPackedTileUpdates();
    const expectedPackedMotionPlans = expected.drainPackedMotionPlans();

    let actualPayload: GameUpdateViewData | null = null;
    const runner = new GameRunner(
      actual,
      new Executor(actual, "game", undefined),
      (gu: GameUpdateViewData | ErrorUpdate) => {
        if ("errMsg" in gu) throw new Error(gu.errMsg);
        actualPayload = gu;
      },
    );
    runner.addTurn({
      turnNumber: 0,
      intents: [
        {
          type: "attack",
          clientID: "client-a",
          targetID: actual.player("defender").id(),
          troops: 1_000,
        },
      ],
    });

    expect(runner.executeNextTick(0)).toBe(true);
    expect(actualPayload).not.toBeNull();

    expect(
      normalizeForParity(
        captureParitySnapshot(expected, {
          updates: expectedUpdates,
          packedTileUpdates: expectedPackedTileUpdates,
          packedMotionPlans: expectedPackedMotionPlans,
        }),
      ),
    ).toEqual(
      normalizeForParity(
        captureParitySnapshot(actual, {
          updates: actualPayload!.updates,
          packedTileUpdates: actualPayload!.packedTileUpdates,
          packedMotionPlans: actualPayload!.packedMotionPlans ?? null,
        }),
      ),
    );

    expect(normalizeForParity(actualPayload!.updates)).toEqual(
      normalizeForParity(expectedUpdates),
    );
    expect(Array.from(actualPayload!.packedTileUpdates)).toEqual(
      Array.from(expectedPackedTileUpdates),
    );
    expect(Array.from(actualPayload!.packedMotionPlans ?? [])).toEqual(
      Array.from(expectedPackedMotionPlans ?? []),
    );
    expect(actualPayload!.pendingTurns).toBe(0);
    expect(actualPayload!.tick).toBe(expected.ticks());
    expect(actualPayload!.playerNameViewData).toMatchObject({
      attacker: expect.any(Object),
      defender: expect.any(Object),
    });
  });

  test("client_state_merge_preserves_system_updates", () => {
    const state = makePlayerState({
      gold: 100,
      troops: 250,
      resourceCapacity: { food: 1_000, energy: 1_000, materials: 1_000 },
      outgoingAttacks: [
        {
          attackerID: 1,
          targetID: 2,
          troops: 50,
          id: "old",
          retreating: false,
        },
      ],
    });

    applyStateUpdate(
      state,
      makePlayerUpdate({
        gold: 150n,
        resources: { food: 10n, energy: 20n, materials: 30n },
        resourceCapacity: undefined,
        troopIncreaseRate: 12,
        troops: undefined,
        outgoingAttacks: [
          {
            attackerID: 1,
            targetID: 2,
            troops: 75,
            id: "new",
            retreating: false,
          },
        ],
      }),
    );

    expect(state.gold).toBe(150);
    expect(state.resources).toEqual({ food: 10, energy: 20, materials: 30 });
    expect(state.resourceCapacity).toEqual({
      food: 1_000,
      energy: 1_000,
      materials: 1_000,
    });
    expect(state.troops).toBe(250);
    expect(state.troopIncreaseRate).toBe(12);
    expect(state.outgoingAttacks).toEqual([
      {
        attackerID: 1,
        targetID: 2,
        troops: 75,
        id: "new",
        retreating: false,
      },
    ]);
  });
});

async function buildTwoPlayerFront() {
  const game = await setup("big_plains", { instantBuild: true }, [
    new PlayerInfo("attacker", PlayerType.Human, "client-a", "attacker"),
    new PlayerInfo("defender", PlayerType.Human, "client-d", "defender"),
  ]);
  const attacker = game.player("attacker");
  const defender = game.player("defender");

  attacker.conquer(game.ref(50, 50));
  defender.conquer(game.ref(51, 50));
  attacker.setTroops(10_000);
  defender.setTroops(8_000);

  return game;
}

function makePlayerState(overrides: Partial<PlayerState> = {}): PlayerState {
  return {
    smallID: 1,
    isAlive: true,
    isDisconnected: false,
    tilesOwned: 0,
    gold: 0,
    resources: { food: 0, energy: 0, materials: 0 },
    resourceCapacity: { food: 0, energy: 0, materials: 0 },
    foodAllocationToPopulation: 0.5,
    nutritionHealth: 1,
    effectiveTroopCapacity: 1_000,
    biomassSupportedTroopCapacity: 1_000,
    troopIncreaseRate: 0,
    troops: 100,
    isTraitor: false,
    traitorRemainingTicks: 0,
    betrayals: 0,
    hasSpawned: true,
    lastDeleteUnitTick: 0,
    allies: [],
    embargoes: [],
    targets: [],
    outgoingAttacks: [],
    incomingAttacks: [],
    outgoingAllianceRequests: [],
    alliances: [],
    outgoingEmojis: [],
    ...overrides,
  };
}

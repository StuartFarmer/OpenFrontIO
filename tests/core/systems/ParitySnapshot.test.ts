import { describe, expect, test } from "vitest";
import { AttackExecution } from "../../../src/core/execution/AttackExecution";
import { PlayerInfo, PlayerType, UnitType } from "../../../src/core/game/Game";
import { captureParitySnapshot } from "../../util/parity/ParitySnapshot";
import { setup } from "../../util/Setup";

describe("parity snapshot", () => {
  test("parity_snapshot_contract captures populated game state", async () => {
    const game = await setup("big_plains", { instantBuild: true }, [
      new PlayerInfo("attacker", PlayerType.Human, "client-a", "attacker"),
      new PlayerInfo("defender", PlayerType.Human, "client-d", "defender"),
    ]);
    const attacker = game.player("attacker");
    const defender = game.player("defender");
    const attackerTile = game.ref(50, 50);
    const defenderTile = game.ref(51, 50);

    attacker.conquer(attackerTile);
    defender.conquer(defenderTile);
    attacker.setTroops(10_000);
    defender.setTroops(8_000);
    attacker.addGold(1_000n);
    attacker.addResources(
      { food: 1_000n, energy: 1_000n, materials: 1_000n },
      undefined,
      { updateGold: false },
    );
    attacker.buildUnit(UnitType.City, attackerTile, {});
    game.addExecution(new AttackExecution(1_000, attacker, defender.id()));

    const updates = game.executeNextTick();
    const packedTileUpdates = game.drainPackedTileUpdates();
    const snapshot = captureParitySnapshot(game, {
      updates,
      packedTileUpdates,
    });

    expect(snapshot).toMatchObject({
      tick: 1,
      inSpawnPhase: false,
      isPaused: false,
      winner: null,
    });
    expect(snapshot.players).toHaveLength(2);
    expect(snapshot.players[0]).toMatchObject({
      id: "attacker",
      troops: 9_000,
      gold: "1000",
      resources: {
        food: expect.any(String),
        energy: expect.any(String),
        materials: expect.any(String),
      },
      tiles: [attackerTile],
      units: [expect.any(Number)],
      outgoingAttacks: [expect.any(String)],
    });
    expect(snapshot.attacks).toHaveLength(1);
    expect(snapshot.attacks[0]).toMatchObject({
      attackerID: attacker.smallID(),
      targetID: defender.smallID(),
      troops: 1_000,
      isActive: true,
    });
    expect(snapshot.units).toHaveLength(1);
    expect(snapshot.units[0]).toMatchObject({
      type: UnitType.City,
      ownerID: attacker.smallID(),
      tile: attackerTile,
    });
    expect(snapshot.stats).toMatchObject({
      "client-a": {
        attacks: ["1000"],
      },
      "client-d": {
        attacks: ["0", "1000"],
      },
    });
    expect(snapshot.updates).toBeDefined();
    expect(snapshot.packedTileUpdates).toEqual(Array.from(packedTileUpdates));
  });

  test("parity_snapshot_stability is deterministic for unchanged state", async () => {
    const game = await setup("big_plains", { instantBuild: true }, [
      new PlayerInfo("player", PlayerType.Human, "client", "player"),
    ]);
    const player = game.player("player");

    player.conquer(game.ref(50, 50));
    player.setTroops(5_000);
    player.addGold(250n);
    player.buildUnit(UnitType.City, game.ref(50, 50), {});

    const first = captureParitySnapshot(game);
    const second = captureParitySnapshot(game);

    expect(second).toEqual(first);
  });
});

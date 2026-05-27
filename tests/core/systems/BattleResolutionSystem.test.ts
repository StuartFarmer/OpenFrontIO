import { describe, expect, test } from "vitest";
import { AttackExecution } from "../../../src/core/execution/AttackExecution";
import { PlayerInfo, PlayerType } from "../../../src/core/game/Game";
import { captureParitySnapshot } from "../../util/parity/ParitySnapshot";
import { setup } from "../../util/Setup";

describe("BattleResolutionSystem", () => {
  test("battle_resolution_matches_legacy_tile_pressure", async () => {
    const game = await buildAttackGame();
    const attacker = game.player("attacker");
    const defender = game.player("defender");
    const before = captureParitySnapshot(game);

    game.executeNextTick();
    const after = captureParitySnapshot(game);

    expect(
      after.players.find((p) => p.id === defender.id())!.troops,
    ).toBeLessThan(before.players.find((p) => p.id === defender.id())!.troops);
    expect(
      after.players.find((p) => p.id === attacker.id())!.tilesOwned,
    ).toBeGreaterThan(
      before.players.find((p) => p.id === attacker.id())!.tilesOwned,
    );
    expect(attacker.outgoingAttacks()[0]?.troops()).toBeLessThan(1_000);
  });

  test("battle_resolution_preserves_retreat", async () => {
    const game = await buildAttackGame();
    const attacker = game.player("attacker");
    const attack = attacker.outgoingAttacks()[0];

    attack.orderRetreat();
    attack.executeRetreat();
    game.executeNextTick();

    expect(attacker.outgoingAttacks()).toHaveLength(0);
    expect(attacker.troops()).toBe(9_750);
  });
});

async function buildAttackGame() {
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

  game.addExecution(new AttackExecution(1_000, attacker, defender.id()));
  game.executeNextTick();

  return game;
}

import { describe, expect, test } from "vitest";
import { AttackExecution } from "../../../src/core/execution/AttackExecution";
import { PlayerInfo, PlayerType } from "../../../src/core/game/Game";
import { AttackStateAdapter } from "../../../src/core/systems/gameplay/AttackStateAdapter";
import { captureParitySnapshot } from "../../util/parity/ParitySnapshot";
import { setup } from "../../util/Setup";

describe("AttackStateAdapter", () => {
  test("attack_state_adapter_lists_active_attacks", async () => {
    const game = await buildAttackGame();
    const attacker = game.player("attacker");
    const defender = game.player("defender");

    const adapter = new AttackStateAdapter(game);
    const attacks = adapter.activeAttacks();

    expect(attacks).toHaveLength(1);
    expect(attacks[0].attacker()).toBe(attacker);
    expect(attacks[0].target()).toBe(defender);
    expect(attacks[0].troops()).toBe(1_000);
    expect(adapter.outgoingAttacks(attacker)).toHaveLength(1);
    expect(adapter.incomingAttacks(defender)).toHaveLength(1);
  });

  test("attack_state_adapter_preserves_attack_updates", async () => {
    const expected = await buildAttackGame();
    const actual = await buildAttackGame();

    const expectedAttack = expected.player("attacker").outgoingAttacks()[0];
    expectedAttack.setTroops(750);
    expectedAttack.orderRetreat();

    const actualAttack = new AttackStateAdapter(actual).activeAttacks()[0];
    actualAttack.setTroops(750);
    actualAttack.orderRetreat();

    expect(normalizedSnapshot(actual)).toEqual(normalizedSnapshot(expected));
    expect(actual.player("attacker").toUpdate()).toEqual(
      expected.player("attacker").toUpdate(),
    );
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

function normalizedSnapshot(game: Awaited<ReturnType<typeof buildAttackGame>>) {
  const snapshot = captureParitySnapshot(game);
  return {
    players: snapshot.players,
    attacks: snapshot.attacks,
    hash: snapshot.hash,
  };
}

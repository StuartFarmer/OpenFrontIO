import { describe, expect, test } from "vitest";
import { Executor } from "../../../src/core/execution/ExecutionManager";
import { PlayerInfo, PlayerType, UnitType } from "../../../src/core/game/Game";
import { StampedIntent } from "../../../src/core/Schemas";
import { setup } from "../../util/Setup";

describe("IntentCommandSurface", () => {
  test("intent_command_surface_preserves_attack_intent", async () => {
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

    const executor = new Executor(game, "game", undefined);
    game.addExecution(
      executor.createExec({
        type: "attack",
        clientID: "client-a",
        targetID: defender.id(),
        troops: 1_000,
      } satisfies StampedIntent),
    );
    game.executeNextTick();

    expect(attacker.outgoingAttacks()).toHaveLength(1);
    expect(attacker.outgoingAttacks()[0].target()).toBe(defender);
  });

  test("intent_command_surface_preserves_build_intent", async () => {
    const game = await setup("big_plains", { infiniteGold: true }, [
      new PlayerInfo("builder", PlayerType.Human, "client", "builder"),
    ]);
    const builder = game.player("builder");
    const tile = game.ref(50, 50);
    builder.conquer(tile);

    const executor = new Executor(game, "game", undefined);
    game.addExecution(
      executor.createExec({
        type: "build_unit",
        clientID: "client",
        unit: UnitType.City,
        tile,
      } satisfies StampedIntent),
    );

    for (let i = 0; i < 4; i++) {
      game.executeNextTick();
    }

    expect(builder.units(UnitType.City)).toHaveLength(1);
  });
});

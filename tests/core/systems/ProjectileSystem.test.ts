import { describe, expect, test } from "vitest";
import { NukeExecution } from "../../../src/core/execution/NukeExecution";
import { PlayerInfo, PlayerType, UnitType } from "../../../src/core/game/Game";
import { ProjectileSystem } from "../../../src/core/systems/gameplay/ProjectileSystem";
import { setup } from "../../util/Setup";

describe("ProjectileSystem", () => {
  test("projectile_system_preserves_nuke_lifecycle", async () => {
    const game = await setup("big_plains", { infiniteGold: true }, [
      new PlayerInfo("player", PlayerType.Human, "client", "player"),
    ]);
    const player = game.player("player");
    const siloTile = game.ref(50, 50);
    const targetTile = game.ref(60, 60);
    player.conquer(siloTile);
    player.buildUnit(UnitType.MissileSilo, siloTile, {});

    game.addExecution(
      new NukeExecution(UnitType.AtomBomb, player, targetTile, null, 50),
    );
    game.executeNextTick();
    game.executeNextTick();

    expect(player.units(UnitType.AtomBomb)).toHaveLength(1);
    expect(player.units(UnitType.MissileSilo)[0].isInCooldown()).toBe(true);

    for (let i = 0; i < 5; i++) {
      game.executeNextTick();
    }

    expect(player.units(UnitType.AtomBomb)).toHaveLength(0);
  });

  test("projectile_system_preserves_sam_interception", async () => {
    const game = await setup("big_plains", { infiniteGold: true }, [
      new PlayerInfo("attacker", PlayerType.Human, "client-a", "attacker"),
      new PlayerInfo("defender", PlayerType.Human, "client-d", "defender"),
    ]);
    const attacker = game.player("attacker");
    const defender = game.player("defender");
    const target = attacker.buildUnit(UnitType.AtomBomb, game.ref(50, 50), {
      trajectory: [],
    });
    const missile = defender.buildUnit(
      UnitType.SAMMissile,
      game.ref(51, 50),
      {},
    );

    new ProjectileSystem().completeSamIntercept(
      game,
      missile,
      target,
      defender,
    );

    expect(target.isActive()).toBe(false);
    expect(missile.isActive()).toBe(false);
  });
});

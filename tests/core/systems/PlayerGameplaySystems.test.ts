import { describe, expect, test } from "vitest";
import { PlayerInfo, PlayerType, UnitType } from "../../../src/core/game/Game";
import { PlayerEconomySystem } from "../../../src/core/systems/gameplay/PlayerEconomySystem";
import { PlayerUpkeepSystem } from "../../../src/core/systems/gameplay/PlayerUpkeepSystem";
import { setup } from "../../util/Setup";

describe("player gameplay systems", () => {
  test("native_economy_matches_player_execution", async () => {
    const game = await setup("big_plains", { instantBuild: true }, [
      new PlayerInfo("player", PlayerType.Human, "client", "player"),
    ]);
    const player = game.player("player");
    player.conquer(game.ref(50, 50));
    player.setTroops(25_000);
    const expected = game.config().playerEconomyTick(game, player);

    const result = new PlayerEconomySystem().tickPlayer(game, player);

    expect(result.troopDelta).toBe(expected.troopDelta);
    expect(result.resourceDelta).toEqual(expected.resourceDelta);
    expect(player.troops()).toBe(25_000 + expected.troopDelta);
    expect(player.resources()).toEqual(expected.resourceDelta);
  });

  test("native_economy_preserves_resource_bigints", async () => {
    const game = await setup("big_plains", { instantBuild: true }, [
      new PlayerInfo("player", PlayerType.Human, "client", "player"),
    ]);
    const player = game.player("player");
    player.conquer(game.ref(50, 50));

    new PlayerEconomySystem().tickPlayer(game, player);

    expect(typeof player.resources().food).toBe("bigint");
    expect(typeof player.resources().energy).toBe("bigint");
    expect(typeof player.resources().materials).toBe("bigint");
  });

  test("native_upkeep_preserves_structure_capture", async () => {
    const game = await setup("big_plains", { instantBuild: true }, [
      new PlayerInfo("owner", PlayerType.Human, "client-a", "owner"),
      new PlayerInfo("captor", PlayerType.Human, "client-b", "captor"),
    ]);
    const owner = game.player("owner");
    const captor = game.player("captor");
    const tile = game.ref(50, 50);
    owner.conquer(tile);
    const city = owner.buildUnit(UnitType.City, tile, {});
    captor.conquer(tile);
    const system = new PlayerUpkeepSystem();
    const state = system.initializePlayer(owner, game.ticks());

    const result = system.tickPlayer(game, owner, state, game.ticks());

    expect(result.active).toBe(false);
    expect(city.owner()).toBe(captor);
  });

  test("native_upkeep_marks_dead_player_inactive", async () => {
    const game = await setup("big_plains", { instantBuild: true }, [
      new PlayerInfo("player", PlayerType.Human, "client", "player"),
    ]);
    const player = game.player("player");
    const system = new PlayerUpkeepSystem();
    const state = system.initializePlayer(player, game.ticks());

    const result = system.tickPlayer(game, player, state, game.ticks());

    expect(result.active).toBe(false);
    expect(player.gold()).toBe(0n);
  });
});

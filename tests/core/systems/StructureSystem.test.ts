import { describe, expect, test } from "vitest";
import { ConstructionExecution } from "../../../src/core/execution/ConstructionExecution";
import { MissileSiloExecution } from "../../../src/core/execution/MissileSiloExecution";
import { RailStationExecution } from "../../../src/core/execution/RailStationExecution";
import { PlayerInfo, PlayerType, UnitType } from "../../../src/core/game/Game";
import { setup } from "../../util/Setup";

describe("StructureSystem", () => {
  test("structure_system_preserves_construction_completion", async () => {
    const game = await setup("plains", { instantBuild: false }, [
      new PlayerInfo("player", PlayerType.Human, "client", "player"),
    ]);
    const player = game.player("player");
    const tile = game.ref(0, 10);
    player.conquer(tile);
    player.addResources(
      game.config().unitResourceCost(UnitType.City, game, player),
      undefined,
      { updateGold: false },
    );

    game.addExecution(new ConstructionExecution(player, UnitType.City, tile));
    const duration = game.unitInfo(UnitType.City).constructionDuration ?? 0;
    for (let i = 0; i < duration + 3; i++) {
      game.executeNextTick();
    }

    expect(player.units(UnitType.City)).toHaveLength(1);
    expect(player.units(UnitType.City)[0].isUnderConstruction()).toBe(false);
  });

  test("structure_system_preserves_station_and_silo_ticks", async () => {
    const game = await setup("big_plains", { instantBuild: true }, [
      new PlayerInfo("player", PlayerType.Human, "client", "player"),
    ]);
    const player = game.player("player");
    const cityTile = game.ref(50, 50);
    const railTile = game.ref(51, 50);
    const siloTile = game.ref(52, 50);
    player.conquer(cityTile);
    player.conquer(railTile);
    player.conquer(siloTile);

    const city = player.buildUnit(UnitType.City, cityTile, {});
    const rail = player.buildUnit(UnitType.RailStation, railTile, {});
    const silo = player.buildUnit(UnitType.MissileSilo, siloTile, {});

    game.addExecution(new RailStationExecution(rail));
    game.addExecution(new MissileSiloExecution(silo));
    game.executeNextTick();
    game.executeNextTick();

    expect(rail.hasTrainStation()).toBe(true);
    expect(city.hasTrainStation()).toBe(true);

    silo.launch();
    for (let i = 0; i < game.config().SiloCooldown() + 1; i++) {
      game.executeNextTick();
    }

    expect(silo.isInCooldown()).toBe(false);
  });
});

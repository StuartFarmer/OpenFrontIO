import {
  Game,
  Player,
  PlayerInfo,
  PlayerType,
  UnitType,
} from "../../../src/core/game/Game";
import { setup } from "../../util/Setup";
import { constructionExecution } from "../../util/utils";

describe("RailStationExecution", () => {
  let game: Game;
  let player: Player;

  beforeEach(async () => {
    game = await setup(
      "plains",
      { infiniteGold: true, instantBuild: true },
      [new PlayerInfo("player", PlayerType.Human, null, "player_id")],
    );
    game.config().structureMinDist = () => 0;
    player = game.player("player_id");
  });

  test("Rail Station construction creates rail nodes for itself and nearby structures", () => {
    const cityTile = game.ref(0, 0);
    const stationTile = game.ref(4, 0);
    player.conquer(cityTile);
    player.conquer(stationTile);
    const city = player.buildUnit(UnitType.City, cityTile, {});

    constructionExecution(game, player, 4, 0, UnitType.RailStation);

    const railStation = player.units(UnitType.RailStation)[0];
    expect(railStation.hasTrainStation()).toBe(true);
    expect(city.hasTrainStation()).toBe(true);
  });

  test("Factory construction does not create rail nodes", () => {
    const cityTile = game.ref(0, 0);
    const factoryTile = game.ref(4, 0);
    player.conquer(cityTile);
    player.conquer(factoryTile);
    const city = player.buildUnit(UnitType.City, cityTile, {});

    constructionExecution(game, player, 4, 0, UnitType.Factory);

    const factory = player.units(UnitType.Factory)[0];
    expect(factory.hasTrainStation()).toBe(false);
    expect(city.hasTrainStation()).toBe(false);
  });
});

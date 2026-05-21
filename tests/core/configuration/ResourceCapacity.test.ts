import {
  Game,
  Player,
  PlayerInfo,
  PlayerType,
  UnitType,
} from "../../../src/core/game/Game";
import { GameUpdateType } from "../../../src/core/game/GameUpdates";
import { resourceRegenDelta } from "../../../src/core/game/Resources";
import { setup } from "../../util/Setup";

describe("resource capacity config", () => {
  let game: Game;
  let player: Player;

  beforeEach(async () => {
    game = await setup("plains", { instantBuild: true }, [
      new PlayerInfo("player", PlayerType.Human, null, "player_id"),
    ]);
    player = game.player("player_id");
  });

  test("controlled area increases resource capacity", () => {
    player.conquer(game.ref(0, 0));
    const oneTileCapacity = game.config().maxResources(player);

    for (let x = 1; x <= 10; x++) {
      player.conquer(game.ref(x, 0));
    }
    const expandedCapacity = game.config().maxResources(player);

    expect(expandedCapacity).toEqual({
      food: expandedCapacity.food,
      energy: expandedCapacity.food,
      materials: expandedCapacity.food,
    });
    expect(expandedCapacity.food).toBeGreaterThan(oneTileCapacity.food);
  });

  test("completed Factory levels increase resource capacity", () => {
    const tile = game.ref(0, 0);
    player.conquer(tile);
    const beforeFactory = game.config().maxResources(player);
    const factory = player.buildUnit(UnitType.Factory, tile, {});

    expect(factory.isUnderConstruction()).toBe(false);

    const afterFactory = game.config().maxResources(player);
    expect(afterFactory.food - beforeFactory.food).toBe(
      game.config().factoryResourceCapacityIncrease(),
    );
    expect(afterFactory.energy).toBe(afterFactory.food);
    expect(afterFactory.materials).toBe(afterFactory.food);
  });

  test("under-construction Factories do not increase resource capacity", () => {
    const tile = game.ref(0, 0);
    player.conquer(tile);
    const beforeFactory = game.config().maxResources(player);
    const factory = player.buildUnit(UnitType.Factory, tile, {});

    factory.setUnderConstruction(true);
    expect(game.config().maxResources(player)).toEqual(beforeFactory);

    factory.setUnderConstruction(false);
    expect(game.config().maxResources(player).food).toBeGreaterThan(
      beforeFactory.food,
    );
  });

  test("resourceIncreaseRate favors fuels on lowland/plains tiles", () => {
    player.conquer(game.ref(0, 0));
    const before = player.resources();
    const delta = game.config().resourceIncreaseRate(game, player);

    expect(player.resources()).toEqual(before);
    expect(delta.food).toBeGreaterThan(0n);
    expect(delta.energy).toBeGreaterThan(delta.food);
    expect(delta.energy).toBeGreaterThan(delta.materials);
  });

  test("resourceIncreaseRate favors biomass on highland tiles", () => {
    const tile = game.ref(0, 0);
    game.setMagnitude(tile, 15);
    player.conquer(tile);

    const delta = game.config().resourceIncreaseRate(game, player);

    expect(delta.food).toBeGreaterThan(delta.energy);
    expect(delta.food).toBeGreaterThan(delta.materials);
  });

  test("resourceIncreaseRate favors metals on mountain tiles", () => {
    const tile = game.ref(0, 0);
    game.setMagnitude(tile, 25);
    player.conquer(tile);

    const delta = game.config().resourceIncreaseRate(game, player);

    expect(delta.materials).toBeGreaterThan(delta.food);
    expect(delta.materials).toBeGreaterThan(delta.energy);
  });

  test("resourceIncreaseRate is slowed to one third of the base regen curve", () => {
    player.conquer(game.ref(0, 0));
    const capacity = game.config().maxResources(player);
    const baseDelta = resourceRegenDelta(player.resources(), capacity);
    const slowedUniformDelta = resourceRegenDelta(
      player.resources(),
      capacity,
      1 / 3,
    );
    const slowerDelta = game.config().resourceIncreaseRate(game, player);

    expect(baseDelta.food).toBeGreaterThan(0n);
    expect(
      slowedUniformDelta.food +
        slowedUniformDelta.energy +
        slowedUniformDelta.materials,
    ).toBeLessThan(baseDelta.food + baseDelta.energy + baseDelta.materials);
    expect(slowerDelta.food + slowerDelta.energy + slowerDelta.materials).toBe(
      slowedUniformDelta.food +
        slowedUniformDelta.energy +
        slowedUniformDelta.materials,
    );
  });

  test("City, Port, and Factory split their legacy gold price into resource costs", () => {
    player.conquer(game.ref(0, 0));

    expect(game.config().unitResourceCost(UnitType.City, game, player)).toEqual(
      {
        food: 62_500n,
        energy: 31_250n,
        materials: 31_250n,
      },
    );
    expect(game.config().unitResourceCost(UnitType.Port, game, player)).toEqual(
      {
        food: 31_250n,
        energy: 31_250n,
        materials: 62_500n,
      },
    );
    expect(
      game.config().unitResourceCost(UnitType.Factory, game, player),
    ).toEqual({
      food: 31_250n,
      energy: 62_500n,
      materials: 31_250n,
    });
  });

  test("player updates carry resource capacity and diff capacity changes", () => {
    const tile = game.ref(0, 0);
    player.conquer(tile);

    const full = player.toUpdate();
    expect(full).toMatchObject({
      type: GameUpdateType.Player,
      id: "player_id",
      resourceCapacity: game.config().maxResources(player),
    });

    player.buildUnit(UnitType.Factory, tile, {});
    const diff = player.toUpdate();

    expect(diff).toMatchObject({
      type: GameUpdateType.Player,
      id: "player_id",
      resourceCapacity: game.config().maxResources(player),
    });
  });
});

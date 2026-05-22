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

  test("completed Silo levels increase resource capacity", () => {
    const tile = game.ref(0, 0);
    player.conquer(tile);
    const beforeSilo = game.config().maxResources(player);
    const silo = player.buildUnit(UnitType.Silo, tile, {});

    expect(silo.isUnderConstruction()).toBe(false);

    const afterSilo = game.config().maxResources(player);
    expect(afterSilo.food - beforeSilo.food).toBe(
      game.config().factoryResourceCapacityIncrease(),
    );
    expect(afterSilo.energy).toBe(afterSilo.food);
    expect(afterSilo.materials).toBe(afterSilo.food);
  });

  test("under-construction Silos do not increase resource capacity", () => {
    const tile = game.ref(0, 0);
    player.conquer(tile);
    const beforeSilo = game.config().maxResources(player);
    const silo = player.buildUnit(UnitType.Silo, tile, {});

    silo.setUnderConstruction(true);
    expect(game.config().maxResources(player)).toEqual(beforeSilo);

    silo.setUnderConstruction(false);
    expect(game.config().maxResources(player).food).toBeGreaterThan(
      beforeSilo.food,
    );
  });

  test("Factory levels do not increase resource capacity", () => {
    const tile = game.ref(0, 0);
    player.conquer(tile);
    const beforeFactory = game.config().maxResources(player);
    player.buildUnit(UnitType.Factory, tile, {});

    expect(game.config().maxResources(player)).toEqual(beforeFactory);
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

  test("biomass-supported troop capacity follows terrain production blend", () => {
    const plainsTile = game.ref(0, 0);
    player.conquer(plainsTile);
    const plainsTroopCapacity = game.config().maxTroops(player);
    const plainsBiomassCapacity = game
      .config()
      .biomassSupportedTroopCapacity(game, player);

    expect(plainsBiomassCapacity).toBeCloseTo(plainsTroopCapacity, 0);

    const highlandGamePlayer = game.player("player_id");
    const highlandTile = game.ref(1, 0);
    game.setMagnitude(highlandTile, 15);
    highlandGamePlayer.conquer(highlandTile);

    expect(
      game.config().biomassSupportedTroopCapacity(game, highlandGamePlayer),
    ).toBeGreaterThan(game.config().maxTroops(highlandGamePlayer));
  });

  test("troopIncreaseRate uses classic logistic growth below carrying capacity", () => {
    player.conquer(game.ref(0, 0));
    const capacity = game.config().effectiveTroopCapacity(game, player);
    player.setTroops(capacity / 2);

    const rate = game.config().troopIncreaseRate(player, game);

    expect(rate).toBeCloseTo(0.016 * player.troops() * 0.5, 5);
    expect(rate).toBeGreaterThan(0);
  });

  test("troopIncreaseRate becomes negative above biomass-supported capacity", () => {
    const tile = game.ref(0, 0);
    player.conquer(tile);
    const biomassCapacity = game
      .config()
      .biomassSupportedTroopCapacity(game, player);
    player.buildUnit(UnitType.City, tile, {});

    expect(game.config().maxTroops(player)).toBeGreaterThan(biomassCapacity);
    expect(game.config().effectiveTroopCapacity(game, player)).toBeCloseTo(
      biomassCapacity,
      0,
    );

    player.setTroops(biomassCapacity * 1.1);

    expect(game.config().troopIncreaseRate(player, game)).toBeLessThan(0);
  });

  test("City, Port, Factory, Rail Station, and Silo split their legacy gold price into resource costs", () => {
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
    expect(
      game.config().unitResourceCost(UnitType.RailStation, game, player),
    ).toEqual({
      food: 31_250n,
      energy: 31_250n,
      materials: 62_500n,
    });
    expect(game.config().unitResourceCost(UnitType.Silo, game, player)).toEqual(
      {
        food: 31_250n,
        energy: 31_250n,
        materials: 62_500n,
      },
    );
  });

  test("player updates carry resource capacity and diff capacity changes", () => {
    const tile = game.ref(0, 0);
    player.conquer(tile);

    const full = player.toUpdate();
    expect(full).toMatchObject({
      type: GameUpdateType.Player,
      id: "player_id",
      resourceCapacity: game.config().maxResources(player),
      effectiveTroopCapacity: game
        .config()
        .effectiveTroopCapacity(game, player),
      biomassSupportedTroopCapacity: game
        .config()
        .biomassSupportedTroopCapacity(game, player),
      troopIncreaseRate: game.config().troopIncreaseRate(player, game),
    });

    player.buildUnit(UnitType.Silo, tile, {});
    const diff = player.toUpdate();

    expect(diff).toMatchObject({
      type: GameUpdateType.Player,
      id: "player_id",
      resourceCapacity: game.config().maxResources(player),
    });
  });
});

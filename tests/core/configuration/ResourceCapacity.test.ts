import {
  MechanicsConfigSchema,
  resolveMechanicsConfig,
} from "../../../src/core/configuration/MechanicsConfig";
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

function totalCapacity(capacity: {
  food: bigint;
  energy: bigint;
  materials: bigint;
}): bigint {
  return capacity.food + capacity.energy + capacity.materials;
}

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

    let conquered = 1;
    for (let y = 0; y < 100 && conquered < 1500; y++) {
      for (let x = 0; x < 100 && conquered < 1500; x++) {
        const tile = game.ref(x, y);
        if (tile === game.ref(0, 0)) continue;
        player.conquer(tile);
        conquered++;
      }
    }
    const expandedCapacity = game.config().maxResources(player);

    expect(expandedCapacity).toEqual({
      food: expandedCapacity.food,
      energy: expandedCapacity.food,
      materials: expandedCapacity.food,
    });
    expect(totalCapacity(expandedCapacity)).toBeGreaterThan(
      totalCapacity(oneTileCapacity),
    );
  });

  test("base resource capacity uses the configured default", () => {
    player.conquer(game.ref(0, 0));
    const resourceCapacity = game.config().maxResources(player);

    expect(resourceCapacity.food).toBe(34_000n);
  });

  test("mechanics config resolves partial inputs with defaults", () => {
    const parsed = MechanicsConfigSchema.parse({
      populationResources: {
        populationGrowthRate: 0.02,
        terrainWeights: {
          plains: {
            food: 5,
          },
        },
      },
    });

    const resolved = resolveMechanicsConfig(parsed);

    expect(resolved.version).toBe(1);
    expect(resolved.populationResources.populationGrowthRate).toBe(0.02);
    expect(resolved.populationResources.initialPopulation).toBe(250);
    expect(resolved.populationResources.maxPopulationPerTile).toBe(3000);
    expect(resolved.populationResources.populationFoodConstraintMode).toBe(
      "dynamic-shortage",
    );
    expect(resolved.populationResources.foodAllocationToPopulation).toBe(0.5);
    expect(
      resolved.populationResources.foodConsumptionPerPopulation,
    ).toBeCloseTo(10 * (365 / 600), 5);
    expect(
      resolved.populationResources.foodConsumptionPerMobilizedPopulation,
    ).toBeCloseTo(30 * (365 / 600), 5);
    expect(resolved.populationResources.wartimeFoodConsumptionMultiplier).toBe(
      3,
    );
    expect(resolved.populationResources.foodProductionPerTile).toBe(50_000_000);
    expect(resolved.populationResources.foodTicksPerYear).toBe(600);
    expect(
      resolved.populationResources.foodProductionTechnologyMultiplier,
    ).toBe(1);
    expect(resolved.populationResources.birthNutritionThreshold).toBe(0.8);
    expect(resolved.populationResources.survivalNutritionThreshold).toBe(0.5);
    expect(resolved.populationResources.starvationDamageRate).toBe(0.005);
    expect(resolved.populationResources.nutritionRecoveryRate).toBe(0.01);
    expect(resolved.populationResources.starvationMortalityScale).toBe(0.002);
    expect(resolved.populationResources.minBaseResourceCapacity).toBe(25_000);
    expect(resolved.populationResources.baselineBiomassProductionShare).toBe(
      0.25,
    );
    expect(resolved.populationResources.terrainWeights.plains).toEqual({
      food: 5,
      energy: 2,
      materials: 1,
    });
  });

  test("mechanics config migrates legacy troop capacity aliases", () => {
    const parsed = MechanicsConfigSchema.parse({
      populationResources: {
        troopCapacityBase: 12_000,
        troopCapacityTerritoryScale: 750,
        troopCapacityTerritoryExponent: 0.8,
        cityTroopCapacityIncrease: 60_000,
      },
    });

    const resolved = resolveMechanicsConfig(parsed);

    expect(resolved.populationResources.maxPopulationPerTile).toBe(750);
    expect("troopCapacityBase" in resolved.populationResources).toBe(false);
    expect("troopCapacityTerritoryScale" in resolved.populationResources).toBe(
      false,
    );
  });

  test("mechanics config rejects invalid values", () => {
    expect(() =>
      MechanicsConfigSchema.parse({
        version: 2,
      }),
    ).toThrow();
    expect(() =>
      MechanicsConfigSchema.parse({
        populationResources: {
          baselineBiomassProductionShare: 0,
        },
      }),
    ).toThrow();
    expect(() =>
      MechanicsConfigSchema.parse({
        populationResources: {
          terrainWeights: {
            plains: {
              food: -1,
            },
          },
        },
      }),
    ).toThrow();
    expect(() =>
      MechanicsConfigSchema.parse({
        populationResources: {
          foodConsumptionPerPopulation: -1,
        },
      }),
    ).toThrow();
    expect(() =>
      MechanicsConfigSchema.parse({
        populationResources: {
          foodAllocationToPopulation: 1.1,
        },
      }),
    ).toThrow();
    expect(() =>
      MechanicsConfigSchema.parse({
        populationResources: {
          foodProductionTechnologyMultiplier: 0,
        },
      }),
    ).toThrow();
    expect(() =>
      MechanicsConfigSchema.parse({
        populationResources: {
          foodProductionTechnologyMultiplier: 11,
        },
      }),
    ).toThrow();
    expect(() =>
      MechanicsConfigSchema.parse({
        populationResources: {
          populationFoodConstraintMode: "invalid",
        },
      }),
    ).toThrow();
  });

  test("custom mechanics can tune resource capacity values", async () => {
    const customGame = await setup(
      "plains",
      {
        instantBuild: true,
        mechanics: {
          populationResources: {
            minBaseResourceCapacity: 100_000,
            siloResourceCapacityIncrease: 50_000,
          },
        },
      },
      [new PlayerInfo("player", PlayerType.Human, null, "player_id")],
    );
    const customPlayer = customGame.player("player_id");
    const tile = customGame.ref(0, 0);
    customPlayer.conquer(tile);

    expect(customGame.config().maxResources(customPlayer).food).toBe(100_000n);

    customPlayer.buildUnit(UnitType.Silo, tile, {});

    expect(customGame.config().maxResources(customPlayer).food).toBe(150_000n);
    expect(customGame.config().factoryResourceCapacityIncrease()).toBe(50_000n);
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
    expect(delta.energy).toBeGreaterThan(delta.materials);
  });

  test("custom terrain mechanics change resource production split", async () => {
    const customGame = await setup(
      "plains",
      {
        mechanics: {
          populationResources: {
            terrainWeights: {
              plains: {
                food: 4,
                energy: 0,
                materials: 0,
              },
            },
          },
        },
      },
      [new PlayerInfo("player", PlayerType.Human, null, "player_id")],
    );
    const customPlayer = customGame.player("player_id");
    customPlayer.conquer(customGame.ref(0, 0));

    const delta = customGame
      .config()
      .resourceIncreaseRate(customGame, customPlayer);

    expect(delta.food).toBeGreaterThan(0n);
    expect(delta.energy).toBe(0n);
    expect(delta.materials).toBe(0n);
  });

  test("resourceIncreaseRate scales food production by agriculture technology", async () => {
    const baseGame = await setup(
      "plains",
      {
        instantBuild: true,
        mechanics: {
          populationResources: {
            minBaseResourceCapacity: 10_000_000,
          },
        },
      },
      [new PlayerInfo("player", PlayerType.Human, null, "player_id")],
    );
    const basePlayer = baseGame.player("player_id");
    basePlayer.conquer(baseGame.ref(0, 0));

    const technologyGame = await setup(
      "plains",
      {
        instantBuild: true,
        mechanics: {
          populationResources: {
            minBaseResourceCapacity: 10_000_000,
            foodProductionTechnologyMultiplier: 2,
          },
        },
      },
      [new PlayerInfo("player", PlayerType.Human, null, "player_id")],
    );
    const technologyPlayer = technologyGame.player("player_id");
    technologyPlayer.conquer(technologyGame.ref(0, 0));

    const baseDelta = baseGame
      .config()
      .resourceIncreaseRate(baseGame, basePlayer);
    const technologyDelta = technologyGame
      .config()
      .resourceIncreaseRate(technologyGame, technologyPlayer);

    expect(baseDelta.food).toBe(83_333n);
    expect(technologyDelta.food).toBe(166_666n);
  });

  test("resourceIncreaseRate favors metals on mountain tiles", () => {
    const tile = game.ref(0, 0);
    game.setMagnitude(tile, 25);
    player.conquer(tile);

    const delta = game.config().resourceIncreaseRate(game, player);

    expect(delta.materials).toBeGreaterThan(delta.energy);
  });

  test("non-food resourceIncreaseRate is slowed by the configured passive multiplier", () => {
    player.conquer(game.ref(0, 0));
    const capacity = game.config().maxResources(player);
    const baseDelta = resourceRegenDelta(player.resources(), capacity);
    const slowerDelta = game.config().resourceIncreaseRate(game, player);

    expect(baseDelta.food).toBeGreaterThan(0n);
    expect(slowerDelta.energy + slowerDelta.materials).toBeLessThan(
      baseDelta.energy + baseDelta.materials,
    );
    expect(slowerDelta.energy + slowerDelta.materials).toBeGreaterThan(0n);
  });

  test("biomass-supported population follows terrain production blend", () => {
    const plainsTile = game.ref(0, 0);
    player.conquer(plainsTile);
    const plainsTroopCapacity = game.config().maxTroops(player);
    const plainsBiomassCapacity = game
      .config()
      .biomassSupportedTroopCapacity(game, player);

    expect(plainsTroopCapacity).toBe(3000);
    expect(plainsBiomassCapacity).toBeGreaterThan(plainsTroopCapacity);
    expect(plainsBiomassCapacity).toBeCloseTo(
      Number(game.config().maxResources(player).food),
      0,
    );

    const highlandGamePlayer = game.player("player_id");
    const highlandTile = game.ref(1, 0);
    game.setMagnitude(highlandTile, 15);
    highlandGamePlayer.conquer(highlandTile);

    expect(
      game.config().biomassSupportedTroopCapacity(game, highlandGamePlayer),
    ).toBeGreaterThan(plainsBiomassCapacity);
  });

  test("custom biomass baseline tunes supported population", async () => {
    const customGame = await setup(
      "plains",
      {
        mechanics: {
          populationResources: {
            baselineBiomassProductionShare: 0.5,
          },
        },
      },
      [new PlayerInfo("player", PlayerType.Human, null, "player_id")],
    );
    const customPlayer = customGame.player("player_id");
    customPlayer.conquer(customGame.ref(0, 0));

    expect(
      customGame
        .config()
        .biomassSupportedTroopCapacity(customGame, customPlayer),
    ).toBeCloseTo(
      Number(customGame.config().maxResources(customPlayer).food) / 2,
    );
  });

  test("troopIncreaseRate uses classic logistic growth below max population", () => {
    player.conquer(game.ref(0, 0));
    const capacity = game.config().effectiveTroopCapacity(game, player);
    player.setTroops(capacity / 2);

    const rate = game.config().troopIncreaseRate(player);

    expect(rate).toBeCloseTo(0.0015 * player.troops() * 0.5, 5);
    expect(rate).toBeGreaterThan(0);
  });

  test("custom troop growth rate changes troopIncreaseRate", async () => {
    const customGame = await setup(
      "plains",
      {
        mechanics: {
          populationResources: {
            populationGrowthRate: 0.032,
          },
        },
      },
      [new PlayerInfo("player", PlayerType.Human, null, "player_id")],
    );
    const customPlayer = customGame.player("player_id");
    customPlayer.conquer(customGame.ref(0, 0));
    const capacity = customGame
      .config()
      .effectiveTroopCapacity(customGame, customPlayer);
    customPlayer.setTroops(capacity / 2);

    const rate = customGame.config().troopIncreaseRate(customPlayer);

    expect(rate).toBeCloseTo(0.032 * customPlayer.troops() * 0.5, 5);
  });

  test("custom max population mechanics change maxTroops", async () => {
    const customGame = await setup(
      "plains",
      {
        mechanics: {
          populationResources: {
            maxPopulationPerTile: 10_000,
          },
        },
      },
      [new PlayerInfo("player", PlayerType.Human, null, "player_id")],
    );
    const customPlayer = customGame.player("player_id");
    const tile = customGame.ref(0, 0);
    customPlayer.conquer(tile);

    expect(customGame.config().maxTroops(customPlayer)).toBe(10_000);

    customPlayer.buildUnit(UnitType.City, tile, {});

    expect(customGame.config().maxTroops(customPlayer)).toBe(10_000);
  });

  test("troopIncreaseRate becomes negative above max population", () => {
    const tile = game.ref(0, 0);
    player.conquer(tile);
    const capacity = game.config().effectiveTroopCapacity(game, player);

    expect(capacity).toBe(game.config().maxTroops(player));

    player.setTroops(capacity * 1.1);

    expect(game.config().troopIncreaseRate(player, game)).toBeLessThan(0);
  });

  test("City, Port, Factory, Rail Station, Silo, and Farmland split their legacy gold price into resource costs", () => {
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
    expect(
      game.config().unitResourceCost(UnitType.Farmland, game, player),
    ).toEqual({
      food: 1_250n,
      energy: 2_500n,
      materials: 1_250n,
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

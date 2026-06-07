import { describe, expect, test } from "vitest";
import {
  DEFAULT_MECHANICS_CONFIG,
  resolveMechanicsConfig,
} from "../../../src/core/configuration/MechanicsConfig";
import { PlayerInfo, PlayerType } from "../../../src/core/game/Game";
import {
  evaluatePlayerEconomy,
  evaluatePlayerPopulationCapacity,
  evaluatePlayerPopulationGrowth,
  evaluatePlayerResourceCapacity,
  evaluatePlayerResourceProduction,
  terrainResourceProductionSplit,
} from "../../../src/games/openfront/systems/PlayerEconomyAdapter";
import { setup } from "../../util/Setup";

describe("PlayerEconomyAdapter StockFlow compatibility boundary", () => {
  test("reads player population and resource state into model inputs", async () => {
    const game = await setup("plains", { instantBuild: true }, [
      new PlayerInfo("player", PlayerType.Human, null, "player_id"),
    ]);
    const player = game.player("player_id");
    player.conquer(game.ref(0, 0));
    player.setTroops(50_000);

    const mechanics = DEFAULT_MECHANICS_CONFIG.populationResources;
    const result = evaluatePlayerEconomy(game, player, {
      mechanics,
      difficulty: game.config().gameConfig().difficulty,
      hasInfiniteTroops: false,
    });

    expect(result.population.population).toBe(player.troops());
    expect(result.population.capacity).toBe(game.config().maxTroops(player));
    expect(result.resources.capacity).toEqual(
      game.config().maxResources(player),
    );
  });

  test("converts runtime resource deltas back to resource stockpile deltas", async () => {
    const mechanicsInput = {
      populationResources: {
        passiveResourceRegenMultiplier: 1,
        resourceRegenBase: 1000,
      },
    };
    const game = await setup("plains", { mechanics: mechanicsInput }, [
      new PlayerInfo("player", PlayerType.Human, null, "player_id"),
    ]);
    const player = game.player("player_id");
    player.conquer(game.ref(0, 0));

    const mechanics =
      resolveMechanicsConfig(mechanicsInput).populationResources;

    const delta = evaluatePlayerResourceProduction(game, player, {
      mechanics,
      difficulty: game.config().gameConfig().difficulty,
    });

    expect(delta).toEqual(game.config().resourceIncreaseRate(game, player));
    expect(typeof delta.food).toBe("bigint");
  });

  test("uses player food allocation override when evaluating economy", async () => {
    const mechanicsInput = {
      populationResources: {
        passiveResourceRegenMultiplier: 0,
        foodAllocationToPopulation: 1,
        foodConsumptionPerPopulation: 1,
        foodConsumptionPerMobilizedPopulation: 0,
        foodProductionPerTile: 60_000,
        wartimeFoodConsumptionMultiplier: 1,
      },
    };
    const game = await setup("plains", { mechanics: mechanicsInput }, [
      new PlayerInfo("player", PlayerType.Human, null, "player_id"),
    ]);
    const player = game.player("player_id");
    player.conquer(game.ref(0, 0));
    player.setTroops(100);
    player.addResources({ food: 100n, energy: 0n, materials: 0n }, undefined, {
      updateGold: false,
    });
    player.setFoodAllocationToPopulation(0.25);

    const result = evaluatePlayerEconomy(game, player, {
      mechanics: resolveMechanicsConfig(mechanicsInput).populationResources,
      difficulty: game.config().gameConfig().difficulty,
      hasInfiniteTroops: false,
    });

    expect(result.food.allocatedAvailable).toBe(25);
    expect(result.food.consumed).toBe(25);
    expect(result.food.reservedSurplus).toBe(75);
    expect(result.resourceDelta.food).toBe(75n);
  });

  test("exposes terrain production weights as addressable model inputs", async () => {
    const game = await setup("plains", { instantBuild: true }, [
      new PlayerInfo("player", PlayerType.Human, null, "player_id"),
    ]);
    const player = game.player("player_id");
    player.conquer(game.ref(0, 0));
    const highland = game.ref(1, 0);
    game.setMagnitude(highland, 15);
    player.conquer(highland);

    const weights = terrainResourceProductionSplit(
      game,
      player,
      DEFAULT_MECHANICS_CONFIG.populationResources,
    );

    expect(weights).toEqual({
      food: 3,
      energy: 3,
      materials: 2,
    });
  });

  test("population and resource helper outputs match Config wrappers", async () => {
    const game = await setup("plains", { instantBuild: true }, [
      new PlayerInfo("player", PlayerType.Human, null, "player_id"),
    ]);
    const player = game.player("player_id");
    player.conquer(game.ref(0, 0));
    player.setTroops(game.config().maxTroops(player) / 2);
    const options = {
      mechanics: DEFAULT_MECHANICS_CONFIG.populationResources,
      difficulty: game.config().gameConfig().difficulty,
      hasInfiniteTroops: false,
    };

    expect(evaluatePlayerPopulationCapacity(player, options)).toBe(
      game.config().maxTroops(player),
    );
    expect(evaluatePlayerPopulationGrowth(player, options)).toBeCloseTo(
      game.config().troopIncreaseRate(player),
      5,
    );
    expect(game.config().troopIncreaseRate(player, game)).toBeCloseTo(
      game.config().playerEconomyTick(game, player).troopDelta,
      5,
    );
    expect(evaluatePlayerResourceCapacity(player, options)).toEqual(
      game.config().maxResources(player),
    );
  });
});

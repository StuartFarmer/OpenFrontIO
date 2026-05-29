import { describe, expect, test } from "vitest";
import {
  DEFAULT_MECHANICS_CONFIG,
  resolveMechanicsConfig,
} from "../../../src/core/configuration/MechanicsConfig";
import { PlayerInfo, PlayerType } from "../../../src/core/game/Game";
import {
  capacityMultiplierForPlayerType,
  evaluatePopulationSystem,
  growthMultiplierForPlayerType,
} from "../../../src/core/systems/models/PopulationSystem";
import { setup } from "../../util/Setup";

describe("PopulationSystem", () => {
  test("matches current human max population from owned tiles", async () => {
    const game = await setup("plains", { instantBuild: true }, [
      new PlayerInfo("player", PlayerType.Human, null, "player_id"),
    ]);
    const player = game.player("player_id");
    player.conquer(game.ref(0, 0));

    const mechanics = DEFAULT_MECHANICS_CONFIG.populationResources;
    const result = evaluatePopulationSystem(mechanics, {
      population: player.troops(),
      tilesOwned: player.numTilesOwned(),
      maxPopulationOverride: 0,
      capacityMultiplier: capacityMultiplierForPlayerType(
        player.type(),
        mechanics,
        game.config().gameConfig().difficulty,
      ),
      growthMultiplier: 1,
    });

    expect(result.capacity).toBe(game.config().maxTroops(player));
  });

  test("matches current logistic growth below capacity", async () => {
    const game = await setup("plains", { instantBuild: true }, [
      new PlayerInfo("player", PlayerType.Human, null, "player_id"),
    ]);
    const player = game.player("player_id");
    player.conquer(game.ref(0, 0));
    player.setTroops(game.config().maxTroops(player) / 2);
    const mechanics = DEFAULT_MECHANICS_CONFIG.populationResources;

    const result = evaluatePopulationSystem(mechanics, {
      population: player.troops(),
      tilesOwned: player.numTilesOwned(),
      maxPopulationOverride: 0,
      capacityMultiplier: capacityMultiplierForPlayerType(
        player.type(),
        mechanics,
        game.config().gameConfig().difficulty,
      ),
      growthMultiplier: growthMultiplierForPlayerType(
        player.type(),
        mechanics,
        game.config().gameConfig().difficulty,
      ),
    });

    expect(result.growth).toBeCloseTo(
      game.config().troopIncreaseRate(player, game),
      5,
    );
  });

  test("matches bot and nation multipliers", async () => {
    const game = await setup("plains", { instantBuild: true }, [
      new PlayerInfo("bot", PlayerType.Bot, null, "bot_id"),
      new PlayerInfo("nation", PlayerType.Nation, null, "nation_id"),
    ]);
    const bot = game.player("bot_id");
    const nation = game.player("nation_id");
    bot.conquer(game.ref(0, 0));
    nation.conquer(game.ref(1, 0));
    const mechanics = DEFAULT_MECHANICS_CONFIG.populationResources;

    const botResult = evaluatePopulationSystem(mechanics, {
      population: bot.troops(),
      tilesOwned: bot.numTilesOwned(),
      maxPopulationOverride: 0,
      capacityMultiplier: capacityMultiplierForPlayerType(
        bot.type(),
        mechanics,
        game.config().gameConfig().difficulty,
      ),
      growthMultiplier: growthMultiplierForPlayerType(
        bot.type(),
        mechanics,
        game.config().gameConfig().difficulty,
      ),
    });
    const nationResult = evaluatePopulationSystem(mechanics, {
      population: nation.troops(),
      tilesOwned: nation.numTilesOwned(),
      maxPopulationOverride: 0,
      capacityMultiplier: capacityMultiplierForPlayerType(
        nation.type(),
        mechanics,
        game.config().gameConfig().difficulty,
      ),
      growthMultiplier: growthMultiplierForPlayerType(
        nation.type(),
        mechanics,
        game.config().gameConfig().difficulty,
      ),
    });

    expect(botResult.capacity).toBe(game.config().maxTroops(bot));
    expect(nationResult.capacity).toBe(game.config().maxTroops(nation));
    expect(botResult.growth).toBeCloseTo(
      game.config().troopIncreaseRate(bot, game),
      5,
    );
    expect(nationResult.growth).toBeCloseTo(
      game.config().troopIncreaseRate(nation, game),
      5,
    );
  });

  test("uses custom population mechanics", async () => {
    const game = await setup("plains", { instantBuild: true }, [
      new PlayerInfo("player", PlayerType.Human, null, "player_id"),
    ]);
    const player = game.player("player_id");
    player.conquer(game.ref(0, 0));
    const mechanics = resolveMechanicsConfig({
      populationResources: {
        maxPopulationPerTile: 10_000,
        populationGrowthRate: 0.032,
      },
    }).populationResources;

    const result = evaluatePopulationSystem(mechanics, {
      population: 5_000,
      tilesOwned: player.numTilesOwned(),
      maxPopulationOverride: 0,
      capacityMultiplier: 1,
      growthMultiplier: 1,
    });

    expect(result.capacity).toBe(10_000);
    expect(result.growth).toBeCloseTo(0.032 * 5_000 * 0.5, 5);
  });

  test("food satisfaction controls births, deaths, and nutrition health", () => {
    const mechanics = resolveMechanicsConfig({
      populationResources: {
        populationGrowthRate: 0.02,
        maxPopulationPerTile: 10_000,
        birthNutritionThreshold: 0.8,
        survivalNutritionThreshold: 0.5,
        starvationDamageRate: 0.01,
        nutritionRecoveryRate: 0.02,
        starvationMortalityScale: 0.01,
      },
    }).populationResources;

    const fullFood = evaluatePopulationSystem(mechanics, {
      population: 5_000,
      tilesOwned: 1,
      maxPopulationOverride: 0,
      capacityMultiplier: 1,
      growthMultiplier: 1,
      foodSatisfactionRatio: 1,
      nutritionHealth: 1,
    });
    const shortage = evaluatePopulationSystem(mechanics, {
      population: 5_000,
      tilesOwned: 1,
      maxPopulationOverride: 0,
      capacityMultiplier: 1,
      growthMultiplier: 1,
      foodSatisfactionRatio: 0,
      nutritionHealth: 0.5,
    });

    expect(fullFood.growth).toBeCloseTo(50, 5);
    expect(fullFood.births).toBeCloseTo(50, 5);
    expect(fullFood.deaths).toBe(0);
    expect(fullFood.nutritionHealth).toBe(1);
    expect(shortage.growth).toBeLessThan(fullFood.growth);
    expect(shortage.births).toBe(0);
    expect(shortage.deaths).toBeCloseTo(25, 5);
    expect(shortage.growth).toBeCloseTo(-25, 5);
    expect(shortage.nutritionHealth).toBeCloseTo(0.49, 5);
  });

  test("effective capacity override can make food the hard population cap", () => {
    const mechanics = resolveMechanicsConfig({
      populationResources: {
        populationGrowthRate: 0.02,
        maxPopulationPerTile: 10_000,
      },
    }).populationResources;

    const result = evaluatePopulationSystem(mechanics, {
      population: 5_000,
      tilesOwned: 1,
      maxPopulationOverride: 0,
      effectiveCapacityOverride: 2_000,
      capacityMultiplier: 1,
      growthMultiplier: 1,
      foodSatisfactionRatio: 1,
    });

    expect(result.capacity).toBe(2_000);
    expect(result.growth).toBe(-3_000);
  });

  test("over-cap population shrinks to capacity without overshooting below zero", () => {
    const mechanics = resolveMechanicsConfig({
      populationResources: {
        populationGrowthRate: 0.02,
        maxPopulationPerTile: 250,
      },
    }).populationResources;

    const result = evaluatePopulationSystem(mechanics, {
      population: 25_000,
      tilesOwned: 1,
      maxPopulationOverride: 0,
      capacityMultiplier: 1,
      growthMultiplier: 1,
      foodSatisfactionRatio: 1,
    });

    expect(result.capacity).toBe(250);
    expect(result.growth).toBe(-24_750);
  });
});

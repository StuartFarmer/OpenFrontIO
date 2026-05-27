import { describe, expect, test } from "vitest";
import { resolveMechanicsConfig } from "../../../src/core/configuration/MechanicsConfig";
import { PlayerType } from "../../../src/core/game/Game";
import { createZeroResources } from "../../../src/core/game/Resources";
import { evaluatePlayerEconomyModel } from "../../../src/core/systems/models/PlayerEconomyModel";

describe("PlayerEconomyModel", () => {
  test("hard food capacity reduces population toward food-supported population", () => {
    const mechanics = resolveMechanicsConfig({
      populationResources: {
        passiveResourceRegenMultiplier: 0,
        foodConsumptionPerPopulation: 1,
        foodConsumptionPerMobilizedPopulation: 1,
        wartimeFoodConsumptionMultiplier: 1,
        populationGrowthRate: 0.02,
        maxPopulationPerTile: 10_000,
        foodShortageBirthPenalty: 1,
        famineDeathRate: 0.01,
      },
    }).populationResources;

    const resources = createZeroResources();
    resources.food = 50n;

    const result = evaluatePlayerEconomyModel({
      mechanics,
      playerType: PlayerType.Human,
      population: {
        population: 100,
        tilesOwned: 1,
        maxPopulationOverride: 0,
        capacityMultiplier: 1,
        growthMultiplier: 1,
      },
      resources: {
        resources,
        tilesOwned: 1,
        siloLevels: 0,
        capacityMultiplier: 1,
        regenMultiplier: 1,
        terrainWeights: {
          food: 0,
          energy: 0,
          materials: 0,
        },
      },
      war: {
        mobilizedPopulation: 50,
      },
    });

    expect(result.food.needed).toBe(150);
    expect(result.food.consumed).toBe(50);
    expect(result.food.shortageRatio).toBeCloseTo(2 / 3, 5);
    expect(result.resourceDelta.food).toBe(-50n);
    expect(result.population.capacity).toBe(0);
    expect(result.troopDelta).toBe(-100);
  });

  test("dynamic shortage mode applies shortage as birth and death pressure", () => {
    const mechanics = resolveMechanicsConfig({
      populationResources: {
        populationFoodConstraintMode: "dynamic-shortage",
        passiveResourceRegenMultiplier: 0,
        foodConsumptionPerPopulation: 1,
        foodConsumptionPerMobilizedPopulation: 1,
        wartimeFoodConsumptionMultiplier: 1,
        populationGrowthRate: 0.02,
        maxPopulationPerTile: 10_000,
        foodShortageBirthPenalty: 1,
        famineDeathRate: 0.01,
      },
    }).populationResources;

    const resources = createZeroResources();
    resources.food = 50n;

    const result = evaluatePlayerEconomyModel({
      mechanics,
      playerType: PlayerType.Human,
      population: {
        population: 100,
        tilesOwned: 1,
        maxPopulationOverride: 0,
        capacityMultiplier: 1,
        growthMultiplier: 1,
      },
      resources: {
        resources,
        tilesOwned: 1,
        siloLevels: 0,
        capacityMultiplier: 1,
        regenMultiplier: 1,
        terrainWeights: {
          food: 0,
          energy: 0,
          materials: 0,
        },
      },
      war: {
        mobilizedPopulation: 50,
      },
    });

    expect(result.population.capacity).toBe(10_000);
    expect(result.troopDelta).toBeLessThan(0);
    expect(result.troopDelta).toBeGreaterThan(-100);
  });
});

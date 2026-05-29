import { describe, expect, test } from "vitest";
import { resolveMechanicsConfig } from "../../../src/core/configuration/MechanicsConfig";
import { PlayerType } from "../../../src/core/game/Game";
import { createZeroResources } from "../../../src/core/game/Resources";
import { evaluatePlayerEconomyModel } from "../../../src/core/systems/models/PlayerEconomyModel";

describe("PlayerEconomyModel", () => {
  test("hard food capacity reduces population toward food-supported population", () => {
    const mechanics = resolveMechanicsConfig({
      populationResources: {
        populationFoodConstraintMode: "hard-min-cap",
        passiveResourceRegenMultiplier: 0,
        foodConsumptionPerPopulation: 1,
        foodConsumptionPerMobilizedPopulation: 1,
        foodProductionPerTile: 0,
        wartimeFoodConsumptionMultiplier: 1,
        populationGrowthRate: 0.02,
        maxPopulationPerTile: 10_000,
      },
    }).populationResources;

    const resources = createZeroResources();
    resources.food = 50n;

    const result = evaluatePlayerEconomyModel({
      mechanics,
      playerType: PlayerType.Human,
      nutritionHealth: 1,
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
    expect(result.food.consumed).toBe(0);
    expect(result.food.shortageRatio).toBe(1);
    expect(result.resourceDelta.food).toBe(0n);
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
        foodProductionPerTile: 0,
        wartimeFoodConsumptionMultiplier: 1,
        populationGrowthRate: 0.02,
        maxPopulationPerTile: 10_000,
        starvationMortalityScale: 0.002,
      },
    }).populationResources;

    const resources = createZeroResources();
    resources.food = 50n;

    const result = evaluatePlayerEconomyModel({
      mechanics,
      playerType: PlayerType.Human,
      nutritionHealth: 0.5,
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

  test("food allocation controls stored surplus instead of unused feed", () => {
    const mechanics = resolveMechanicsConfig({
      populationResources: {
        foodAllocationToPopulation: 0.75,
        foodConsumptionPerPopulation: 1,
        foodConsumptionPerMobilizedPopulation: 0,
        foodProductionPerTile: 60_000,
        wartimeFoodConsumptionMultiplier: 1,
        populationGrowthRate: 0,
        maxPopulationPerTile: 10_000,
      },
    }).populationResources;

    const result = evaluatePlayerEconomyModel({
      mechanics,
      playerType: PlayerType.Human,
      nutritionHealth: 1,
      population: {
        population: 10,
        tilesOwned: 1,
        maxPopulationOverride: 0,
        capacityMultiplier: 1,
        growthMultiplier: 1,
      },
      resources: {
        resources: createZeroResources(),
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
        mobilizedPopulation: 0,
      },
    });

    expect(result.resources.production.food).toBe(100n);
    expect(result.food.allocatedAvailable).toBe(75);
    expect(result.food.consumed).toBe(10);
    expect(result.food.reservedSurplus).toBe(25);
    expect(result.resourceDelta.food).toBe(25n);
  });
});

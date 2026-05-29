import { describe, expect, test } from "vitest";
import { resolveMechanicsConfig } from "../../../src/core/configuration/MechanicsConfig";
import { evaluateFoodSystem } from "../../../src/core/systems/models/FoodSystem";

describe("FoodSystem", () => {
  test("publishes food stock, produced, needed, consumed, and shortage", () => {
    const mechanics = resolveMechanicsConfig({
      populationResources: {
        foodConsumptionPerPopulation: 0.1,
      },
    }).populationResources;

    const result = evaluateFoodSystem(mechanics, {
      stock: 50,
      produced: 25,
      population: 1_000,
      mobilizedPopulation: 0,
      warFoodConsumptionMultiplier: 1,
    });

    expect(result.stock).toBe(50);
    expect(result.produced).toBe(25);
    expect(result.allocatedAvailable).toBe(12.5);
    expect(result.reservedSurplus).toBe(12.5);
    expect(result.needed).toBe(100);
    expect(result.consumed).toBe(12.5);
    expect(result.shortageRatio).toBe(0.875);
    expect(result.delta).toBe(0);
  });

  test("reserves stockpiled food instead of feeding from the whole stock", () => {
    const mechanics = resolveMechanicsConfig({
      populationResources: {
        foodAllocationToPopulation: 0.5,
        foodConsumptionPerPopulation: 1,
      },
    }).populationResources;

    const result = evaluateFoodSystem(mechanics, {
      stock: 100,
      produced: 20,
      population: 100,
      mobilizedPopulation: 0,
      warFoodConsumptionMultiplier: 1,
    });

    expect(result.allocatedAvailable).toBe(10);
    expect(result.reservedSurplus).toBe(10);
    expect(result.needed).toBe(100);
    expect(result.consumed).toBe(10);
    expect(result.shortageRatio).toBe(0.9);
    expect(result.surplus).toBe(110);
    expect(result.delta).toBe(0);
  });

  test("does not consume more food than allocated production", () => {
    const mechanics = resolveMechanicsConfig({
      populationResources: {
        foodAllocationToPopulation: 1,
        foodConsumptionPerPopulation: 1,
      },
    }).populationResources;

    const result = evaluateFoodSystem(mechanics, {
      stock: 10,
      produced: 5,
      population: 100,
      mobilizedPopulation: 0,
      warFoodConsumptionMultiplier: 1,
    });

    expect(result.consumed).toBe(5);
    expect(result.shortageRatio).toBe(0.95);
  });

  test("wartime mobilized population increases food need", () => {
    const mechanics = resolveMechanicsConfig({
      populationResources: {
        foodAllocationToPopulation: 1,
        foodConsumptionPerPopulation: 0.1,
        foodConsumptionPerMobilizedPopulation: 0.5,
      },
    }).populationResources;

    const result = evaluateFoodSystem(mechanics, {
      stock: 500,
      produced: 500,
      population: 1_000,
      mobilizedPopulation: 200,
      warFoodConsumptionMultiplier: 2,
    });

    expect(result.needed).toBe(400);
    expect(result.consumed).toBe(400);
    expect(result.shortageRatio).toBe(0);
    expect(result.reservedSurplus).toBe(0);
    expect(result.surplus).toBe(500);
  });
});

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
    expect(result.allocatedAvailable).toBe(75);
    expect(result.needed).toBe(100);
    expect(result.consumed).toBe(75);
    expect(result.shortageRatio).toBe(0.25);
    expect(result.delta).toBe(-75);
  });

  test("reserves unallocated food instead of consuming the whole stock", () => {
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

    expect(result.allocatedAvailable).toBe(60);
    expect(result.needed).toBe(100);
    expect(result.consumed).toBe(60);
    expect(result.shortageRatio).toBe(0.4);
    expect(result.delta).toBe(-60);
  });

  test("does not consume more food than is available", () => {
    const mechanics = resolveMechanicsConfig({
      populationResources: {
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

    expect(result.consumed).toBe(15);
    expect(result.shortageRatio).toBe(0.85);
  });

  test("wartime mobilized population increases food need", () => {
    const mechanics = resolveMechanicsConfig({
      populationResources: {
        foodConsumptionPerPopulation: 0.1,
        foodConsumptionPerMobilizedPopulation: 0.5,
      },
    }).populationResources;

    const result = evaluateFoodSystem(mechanics, {
      stock: 500,
      produced: 0,
      population: 1_000,
      mobilizedPopulation: 200,
      warFoodConsumptionMultiplier: 2,
    });

    expect(result.needed).toBe(400);
    expect(result.consumed).toBe(400);
    expect(result.shortageRatio).toBe(0);
  });
});

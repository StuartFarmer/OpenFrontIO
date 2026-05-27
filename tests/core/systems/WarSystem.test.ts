import { describe, expect, test } from "vitest";
import { resolveMechanicsConfig } from "../../../src/core/configuration/MechanicsConfig";
import { evaluateWarSystem } from "../../../src/core/systems/models/WarSystem";

describe("WarSystem", () => {
  test("publishes no-war pressure", () => {
    const mechanics = resolveMechanicsConfig({
      populationResources: {
        wartimeFoodConsumptionMultiplier: 2,
      },
    }).populationResources;

    const result = evaluateWarSystem(mechanics, {
      mobilizedPopulation: 0,
    });

    expect(result.isAtWar).toBe(false);
    expect(result.mobilizedPopulation).toBe(0);
    expect(result.foodConsumptionMultiplier).toBe(1);
    expect(result.casualtyFlow).toBe(0);
  });

  test("publishes mobilized population and wartime food multiplier", () => {
    const mechanics = resolveMechanicsConfig({
      populationResources: {
        wartimeFoodConsumptionMultiplier: 1.5,
      },
    }).populationResources;

    const result = evaluateWarSystem(mechanics, {
      mobilizedPopulation: 12_000,
    });

    expect(result.isAtWar).toBe(true);
    expect(result.mobilizedPopulation).toBe(12_000);
    expect(result.foodConsumptionMultiplier).toBe(1.5);
  });
});

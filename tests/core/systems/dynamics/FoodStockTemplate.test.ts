import { describe, expect, it } from "vitest";
import {
  dynamicsNodeAddress,
  runDynamicsSimulation,
  SIMPLE_FOOD_STOCK_TEMPLATE,
} from "../../../../src/core/systems/dynamics";

describe("simple food stock dynamics template", () => {
  it("fills to capacity and reports overflow", () => {
    const result = runDynamicsSimulation(SIMPLE_FOOD_STOCK_TEMPLATE.system, {
      ...SIMPLE_FOOD_STOCK_TEMPLATE.scenario,
      tickCount: 1,
      inputValues: {
        tilesOwned: 100,
        population: 10,
      },
      parameterValues: {
        yieldPerTile: 1,
        foodPerPopulation: 1,
        foodStockCapacity: 50,
      },
      stockInitialValues: {
        foodStock: 0,
      },
    });

    expect(result.frames[0].stocks.foodStock).toBe(50);
    expect(result.frames[0].flows.foodProductionFlow).toBe(100);
    expect(result.frames[0].flows.foodDemandFlow).toBe(-10);
    expect(result.frames[0].stockDeltas.foodStock).toBe(50);
    expect(result.frames[0].stockOverflows.foodStock).toBe(40);
    expect(
      result.frames[0].values[dynamicsNodeAddress("foodStockDelta", "value")],
    ).toBe(50);
    expect(
      result.frames[0].values[
        dynamicsNodeAddress("foodStockOverflow", "value")
      ],
    ).toBe(40);
  });

  it("draws down stock under deficit", () => {
    const result = runDynamicsSimulation(SIMPLE_FOOD_STOCK_TEMPLATE.system, {
      ...SIMPLE_FOOD_STOCK_TEMPLATE.scenario,
      tickCount: 1,
      inputValues: {
        tilesOwned: 10,
        population: 100,
      },
      parameterValues: {
        yieldPerTile: 1,
        foodPerPopulation: 1,
        foodStockCapacity: 50,
      },
      stockInitialValues: {
        foodStock: 20,
      },
    });

    expect(result.frames[0].stocks.foodStock).toBe(0);
    expect(result.frames[0].flows.foodProductionFlow).toBe(10);
    expect(result.frames[0].flows.foodDemandFlow).toBe(-100);
    expect(result.frames[0].stockDeltas.foodStock).toBe(-20);
    expect(result.frames[0].stockOverflows.foodStock).toBe(0);
    expect(
      result.frames[0].values[dynamicsNodeAddress("foodStockDelta", "value")],
    ).toBe(-20);
  });
});

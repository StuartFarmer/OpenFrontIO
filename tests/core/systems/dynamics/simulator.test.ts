import { describe, expect, it } from "vitest";
import {
  DYNAMICS_SYSTEM_SCHEMA_VERSION,
  dynamicsNodeAddress,
  runDynamicsSimulation,
  type DynamicsScenario,
  type DynamicsSystemDefinition,
} from "../../../../src/core/systems/dynamics";

describe("dynamics simulator", () => {
  it("records clamped stock overflow", () => {
    const system = createFoodStockSystem();
    const scenario = createScenario({
      inputValues: { production: 100, demand: 10 },
      parameterValues: { capacity: 50 },
      stockInitialValues: { foodStock: 0 },
    });

    const result = runDynamicsSimulation(system, scenario);

    expect(result.frames).toHaveLength(1);
    expect(result.frames[0].stocks.foodStock).toBe(50);
    expect(result.frames[0].stockDeltas.foodStock).toBe(50);
    expect(result.frames[0].stockOverflows.foodStock).toBe(40);
    expect(result.frames[0].flows.productionFlow).toBe(100);
    expect(result.frames[0].flows.demandFlow).toBe(-10);
    expect(result.finalStocks.foodStock).toBe(50);
  });

  it("uses scenario input overrides", () => {
    const system = createFoodStockSystem();
    const scenario = createScenario({
      inputValues: { production: 25, demand: 5 },
      parameterValues: { capacity: 100 },
      stockInitialValues: { foodStock: 10 },
    });

    const result = runDynamicsSimulation(system, scenario);

    expect(
      result.frames[0].values[dynamicsNodeAddress("production", "value")],
    ).toBe(25);
    expect(
      result.frames[0].values[dynamicsNodeAddress("demand", "value")],
    ).toBe(5);
    expect(result.frames[0].stocks.foodStock).toBe(30);
    expect(result.frames[0].stockDeltas.foodStock).toBe(20);
    expect(result.frames[0].stockOverflows.foodStock).toBe(0);
  });

  it("applies outflows down to the stock minimum", () => {
    const system = createFoodStockSystem();
    const scenario = createScenario({
      inputValues: { production: 10, demand: 100 },
      parameterValues: { capacity: 100 },
      stockInitialValues: { foodStock: 20 },
    });

    const result = runDynamicsSimulation(system, scenario);

    expect(result.frames[0].stocks.foodStock).toBe(0);
    expect(result.frames[0].stockDeltas.foodStock).toBe(-20);
    expect(result.frames[0].stockOverflows.foodStock).toBe(0);
  });
});

function createScenario(
  overrides: Partial<DynamicsScenario>,
): DynamicsScenario {
  return {
    version: DYNAMICS_SYSTEM_SCHEMA_VERSION,
    id: "baseline",
    systemId: "food-stock-test",
    name: "Baseline",
    tickCount: 1,
    ...overrides,
  };
}

function createFoodStockSystem(): DynamicsSystemDefinition {
  return {
    version: DYNAMICS_SYSTEM_SCHEMA_VERSION,
    id: "food-stock-test",
    name: "Food Stock Test",
    nodes: [
      {
        id: "production",
        type: "input",
        name: "foodProduction",
        position: { x: 0, y: 0 },
        config: { value: 100 },
      },
      {
        id: "demand",
        type: "input",
        name: "foodDemand",
        position: { x: 0, y: 100 },
        config: { value: 10 },
      },
      {
        id: "capacity",
        type: "parameter",
        name: "foodStockCapacity",
        position: { x: 0, y: 200 },
        config: { value: 50 },
      },
      {
        id: "productionFlow",
        type: "flow",
        name: "foodProductionFlow",
        position: { x: 240, y: 0 },
        config: { direction: "inflow" },
      },
      {
        id: "demandFlow",
        type: "flow",
        name: "foodDemandFlow",
        position: { x: 240, y: 100 },
        config: { direction: "outflow" },
      },
      {
        id: "foodStock",
        type: "stock",
        name: "foodStock",
        position: { x: 480, y: 50 },
        config: { initialValue: 0, min: 0 },
      },
    ],
    edges: [
      {
        id: "production-to-flow",
        source: "production",
        sourceHandle: "value",
        target: "productionFlow",
        targetHandle: "amount",
      },
      {
        id: "demand-to-flow",
        source: "demand",
        sourceHandle: "value",
        target: "demandFlow",
        targetHandle: "amount",
      },
      {
        id: "production-flow-to-stock",
        source: "productionFlow",
        sourceHandle: "amount",
        target: "foodStock",
        targetHandle: "inflow",
      },
      {
        id: "demand-flow-to-stock",
        source: "demandFlow",
        sourceHandle: "amount",
        target: "foodStock",
        targetHandle: "outflow",
      },
      {
        id: "capacity-to-stock",
        source: "capacity",
        sourceHandle: "value",
        target: "foodStock",
        targetHandle: "max",
      },
    ],
  };
}

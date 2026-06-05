import { describe, expect, it } from "vitest";
import {
  compileDynamicsSystem,
  DYNAMICS_SYSTEM_SCHEMA_VERSION,
  dynamicsNodeAddress,
  type DynamicsSystemDefinition,
} from "../../../../src/core/systems/dynamics";

describe("dynamics compiler", () => {
  it("maps a single stock graph to a stock-flow model", () => {
    const system = createFoodStockSystem();

    const compiled = compileDynamicsSystem(system);

    expect(compiled.model.id).toBe("food-stock-test");
    expect(compiled.model.externalInputs).toContain(
      dynamicsNodeAddress("production", "value"),
    );
    expect(compiled.model.externalInputs).toContain(
      dynamicsNodeAddress("capacity", "value"),
    );
    expect(compiled.stockAddresses).toEqual({
      foodStock: dynamicsNodeAddress("foodStock", "value"),
    });
    expect(compiled.valueAddresses.productionFlow).toBe(
      dynamicsNodeAddress("productionFlow", "amount"),
    );
  });

  it("rejects edges that reference unknown nodes", () => {
    const system = {
      ...createFoodStockSystem(),
      edges: [
        {
          id: "missing",
          source: "missing-node",
          sourceHandle: "value",
          target: "foodStock",
          targetHandle: "max",
        },
      ],
    } satisfies DynamicsSystemDefinition;

    expect(() => compileDynamicsSystem(system)).toThrow(
      'Edge "missing" references missing source node "missing-node".',
    );
  });
});

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

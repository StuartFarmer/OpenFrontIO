import { describe, expect, it } from "vitest";
import {
  DYNAMICS_ACTIVATION_FUNCTIONS,
  DYNAMICS_MATH_OPERATIONS,
  DYNAMICS_NODE_TYPES,
  DYNAMICS_SYSTEM_SCHEMA_VERSION,
  dynamicsNodeAddress,
  dynamicsNodeById,
  renameDynamicsNode,
  type DynamicsNode,
  type DynamicsScenario,
  type DynamicsSystemDefinition,
} from "../../../../src/core/systems/dynamics";

describe("dynamics schema module", () => {
  it("exports the dynamics schema version from the public module entrypoint", () => {
    expect(DYNAMICS_SYSTEM_SCHEMA_VERSION).toBe(1);
  });

  it("accepts the layer one node catalog as framework-neutral schema", () => {
    const nodes = [
      {
        id: "tiles-owned",
        type: "input",
        name: "tilesOwned",
        position: { x: 0, y: 0 },
        config: { value: 10, min: 0, max: 1000, step: 1, unit: "tiles" },
      },
      {
        id: "yield-per-tile",
        type: "parameter",
        name: "yieldPerTile",
        position: { x: 0, y: 120 },
        config: { value: 2, min: 0, max: 10, step: 0.1, unit: "food/tile" },
      },
      {
        id: "food-production",
        type: "math",
        name: "foodProduction",
        position: { x: 240, y: 60 },
        config: { operation: "multiply" },
      },
      {
        id: "crop-yield-curve",
        type: "activation",
        name: "cropYieldCurve",
        position: { x: 240, y: 180 },
        config: { function: "logistic", min: 1, max: 3, k: 10 },
      },
      {
        id: "food-production-flow",
        type: "flow",
        name: "foodProductionFlow",
        position: { x: 480, y: 60 },
        config: { direction: "inflow", unit: "food/tick" },
      },
      {
        id: "food-stock",
        type: "stock",
        name: "foodStock",
        position: { x: 720, y: 60 },
        config: { initialValue: 0, min: 0, max: 20_000, unit: "food" },
      },
      {
        id: "food-overflow",
        type: "probe",
        name: "foodOverflow",
        position: { x: 960, y: 120 },
        config: { charted: true, unit: "food" },
      },
    ] as const satisfies readonly DynamicsNode[];

    const system = {
      version: DYNAMICS_SYSTEM_SCHEMA_VERSION,
      id: "simple-food-stock",
      name: "Simple Food Stock",
      nodes,
      edges: [
        {
          id: "tiles-to-production",
          source: "tiles-owned",
          sourceHandle: "value",
          target: "food-production",
          targetHandle: "a",
        },
      ],
    } satisfies DynamicsSystemDefinition;

    const scenario = {
      version: DYNAMICS_SYSTEM_SCHEMA_VERSION,
      id: "baseline",
      systemId: system.id,
      name: "Baseline",
      inputValues: { "tiles-owned": 15 },
      parameterValues: { "yield-per-tile": 2 },
      stockInitialValues: { "food-stock": 100 },
      tickCount: 120,
    } satisfies DynamicsScenario;

    expect(DYNAMICS_NODE_TYPES).toEqual([
      "input",
      "parameter",
      "math",
      "activation",
      "flow",
      "stock",
      "probe",
    ]);
    expect(DYNAMICS_MATH_OPERATIONS).toContain("clamp");
    expect(DYNAMICS_ACTIVATION_FUNCTIONS).toContain("logistic");
    expect(system.nodes.map((node) => node.type)).toEqual(DYNAMICS_NODE_TYPES);
    expect(scenario.systemId).toBe(system.id);
  });

  it("keeps edge identity stable when a node is renamed", () => {
    const system: DynamicsSystemDefinition = {
      version: DYNAMICS_SYSTEM_SCHEMA_VERSION,
      id: "rename-test",
      name: "Rename Test",
      nodes: [
        {
          id: "population",
          type: "input",
          name: "population",
          position: { x: 0, y: 0 },
          config: { value: 100 },
        },
        {
          id: "food-demand",
          type: "math",
          name: "foodDemand",
          position: { x: 200, y: 0 },
          config: { operation: "multiply" },
        },
      ],
      edges: [
        {
          id: "population-to-demand",
          source: "population",
          sourceHandle: "value",
          target: "food-demand",
          targetHandle: "a",
        },
      ],
    };

    const renamed = renameDynamicsNode(system, "population", "troops");

    expect(dynamicsNodeById(renamed, "population")?.name).toBe("troops");
    expect(renamed.edges).toEqual(system.edges);
    expect(dynamicsNodeAddress("population", "value")).toBe("population.value");
  });
});

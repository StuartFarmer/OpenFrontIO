import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { DYNAMICS_SCHEMA_VERSION } from "../../../../src/core/systems/dynamics";
import {
  applyInputActions,
  dynamicsCompileDiagnostics,
  FOUNDATION_DYNAMICS_EDGES,
  FOUNDATION_DYNAMICS_NODES,
  initialSimulationState,
  normalizeReadInputs,
  parseDynamicsSystemLibraryJson,
  POPULATION_SURPLUS_DYNAMICS_EDGES,
  POPULATION_SURPLUS_DYNAMICS_NODES,
  savedDynamicsSystem,
  savedDynamicsSystemToSchema,
  serializeDynamicsSystemLibrary,
  stepSimulationState,
} from "../../../../src/games/foundation/dynamics/FoundationDynamicsModel";
import {
  parseFoundationDynamicsSystemLibraryJson,
  serializeFoundationDynamicsSystemLibrary,
} from "../../../../src/games/foundation/dynamics/FoundationDynamicsStorage";

describe("FoundationDynamicsModel", () => {
  it("applies input actions as unclamped value deltas", () => {
    const nodes = FOUNDATION_DYNAMICS_NODES.map((node) =>
      node.id === "tiles-owned"
        ? {
            ...node,
            data: {
              ...node.data,
              value: 0,
              sliderMin: 0,
              sliderMax: 100,
            },
          }
        : node,
    );

    const increased = applyInputActions(nodes, [
      { nodeId: "tiles-owned", remainingTicks: 1, deltaPerTick: 200 },
    ]).nodes;
    expect(
      increased.find((node) => node.id === "tiles-owned")?.data.value,
    ).toBe(200);

    const decreased = applyInputActions(increased, [
      { nodeId: "tiles-owned", remainingTicks: 1, deltaPerTick: -1000 },
    ]).nodes;
    expect(
      decreased.find((node) => node.id === "tiles-owned")?.data.value,
    ).toBe(-800);
  });

  it("names read inputs after the sink they read", () => {
    const normalized = normalizeReadInputs(
      POPULATION_SURPLUS_DYNAMICS_NODES.map((node) =>
        node.id === "surplus-population-read"
          ? { ...node, data: { ...node.data, name: "wrongName" } }
          : node,
      ),
    );

    expect(
      normalized.find((node) => node.id === "surplus-population-read")?.data
        .name,
    ).toBe("population");
  });

  it("feeds population stock back through a read input on the next tick", () => {
    const initial = initialSimulationState(
      POPULATION_SURPLUS_DYNAMICS_NODES,
      POPULATION_SURPLUS_DYNAMICS_EDGES,
    );
    const next = stepSimulationState(
      initial,
      POPULATION_SURPLUS_DYNAMICS_NODES,
      POPULATION_SURPLUS_DYNAMICS_EDGES,
    );

    expect(initial.sinkStates["surplus-population-stock"]).toBe(10);
    expect(next.sinkStates["surplus-population-stock"]).toBeGreaterThan(10);
  });

  it("does not step invalid graphs through fallback simulation", () => {
    const invalidNodes = FOUNDATION_DYNAMICS_NODES.map((node) =>
      node.id === "food-production"
        ? { ...node, data: { ...node.data, expression: "tilesOwned *" } }
        : node,
    );
    const initial = initialSimulationState(
      FOUNDATION_DYNAMICS_NODES,
      FOUNDATION_DYNAMICS_EDGES,
    );

    expect(
      dynamicsCompileDiagnostics(invalidNodes, FOUNDATION_DYNAMICS_EDGES),
    ).toContain('Node "food-production" has an invalid expression.');
    expect(() =>
      stepSimulationState(initial, invalidNodes, FOUNDATION_DYNAMICS_EDGES),
    ).toThrow();
  });

  it("does not carry raw fallback evaluator code in the editor model", () => {
    const source = readFileSync(
      "src/games/foundation/dynamics/FoundationDynamicsModel.ts",
      "utf8",
    );

    expect(source).not.toContain("fallbackStepSimulationState");
    expect(source).not.toContain("fallbackInitialSimulationState");
    expect(source).not.toContain("new Function");
    expect(source).not.toContain("with (scope)");
  });

  it("reserves a configurable share of production before feeding population", () => {
    const initial = initialSimulationState(
      POPULATION_SURPLUS_DYNAMICS_NODES,
      POPULATION_SURPLUS_DYNAMICS_EDGES,
    );
    const next = stepSimulationState(
      initial,
      POPULATION_SURPLUS_DYNAMICS_NODES,
      POPULATION_SURPLUS_DYNAMICS_EDGES,
    );
    const frame = next.frames[next.frames.length - 1];

    expect(frame?.operatorValues["surplus-food-production"]).toBe(40);
    expect(frame?.operatorValues["surplus-food-supply"]).toBe(10);
    expect(frame?.operatorValues["surplus-food-available"]).toBe(30);
    expect(frame?.operatorValues["surplus-food-surplus"]).toBe(20);
    expect(next.sinkStates["surplus-food-stock"]).toBe(30);
  });

  it("uses supply share to change the population ceiling", () => {
    const lowSupplyShare = runPopulationSurplusSystem(0);
    const highSupplyShare = runPopulationSurplusSystem(0.75);

    expect(lowSupplyShare.sinkStates["surplus-population-stock"]).toBe(40);
    expect(highSupplyShare.sinkStates["surplus-population-stock"]).toBe(10);
  });

  it("imports v1 saved system JSON through the compatibility path", () => {
    const v1System = savedDynamicsSystem(
      "Food v1",
      FOUNDATION_DYNAMICS_NODES,
      POPULATION_SURPLUS_DYNAMICS_EDGES.slice(0, 0),
    );

    const imported = parseDynamicsSystemLibraryJson(
      JSON.stringify({ version: 1, systems: [v1System] }),
    );

    expect(imported).toHaveLength(1);
    expect(imported[0]?.name).toBe("Food v1");
    expect(imported[0]?.nodes[0]?.position).toEqual(
      FOUNDATION_DYNAMICS_NODES[0]?.position,
    );
  });

  it("exports saved systems with the canonical schema version", () => {
    const system = savedDynamicsSystem(
      "Food v2",
      FOUNDATION_DYNAMICS_NODES,
      POPULATION_SURPLUS_DYNAMICS_EDGES.slice(0, 0),
    );

    const serialized = serializeDynamicsSystemLibrary([system]);
    const parsed = JSON.parse(serialized) as {
      version: number;
      systems: readonly {
        definition: { nodes: readonly unknown[] };
        scenario: { inputValues?: Record<string, number> };
        view: { nodes: readonly unknown[] };
      }[];
    };

    expect(parsed.version).toBe(DYNAMICS_SCHEMA_VERSION);
    expect(parsed.systems[0]?.definition.nodes[0]).not.toHaveProperty(
      "position",
    );
    expect(parsed.systems[0]?.scenario.inputValues?.["tiles-owned"]).toBe(10);
    expect(parsed.systems[0]?.view.nodes[0]).toHaveProperty("position");
  });

  it("stores canonical v2 systems through the storage API", () => {
    const system = savedDynamicsSystemToSchema(
      savedDynamicsSystem(
        "Food storage v2",
        FOUNDATION_DYNAMICS_NODES,
        POPULATION_SURPLUS_DYNAMICS_EDGES.slice(0, 0),
      ),
    );

    const serialized = serializeFoundationDynamicsSystemLibrary([system]);
    const parsed = JSON.parse(serialized) as {
      version: number;
      systems: readonly { definition: { name: string } }[];
    };

    expect(parsed.version).toBe(DYNAMICS_SCHEMA_VERSION);
    expect(parsed.systems[0]?.definition.name).toBe("Food storage v2");
  });

  it("imports v1 JSON as canonical v2 systems through the storage API", () => {
    const v1System = savedDynamicsSystem(
      "Food storage v1",
      FOUNDATION_DYNAMICS_NODES,
      POPULATION_SURPLUS_DYNAMICS_EDGES.slice(0, 0),
    );

    const imported = parseFoundationDynamicsSystemLibraryJson(
      JSON.stringify({ version: 1, systems: [v1System] }),
    );

    expect(imported[0]?.version).toBe(DYNAMICS_SCHEMA_VERSION);
    expect(imported[0]?.definition.name).toBe("Food storage v1");
    expect(imported[0]?.view.nodes[0]?.position).toEqual(
      FOUNDATION_DYNAMICS_NODES[0]?.position,
    );
  });
});

function runPopulationSurplusSystem(foodSupplyShare: number) {
  const nodes = POPULATION_SURPLUS_DYNAMICS_NODES.map((node) =>
    node.id === "surplus-food-supply-share"
      ? { ...node, data: { ...node.data, value: foodSupplyShare } }
      : node,
  );
  let simulation = initialSimulationState(
    nodes,
    POPULATION_SURPLUS_DYNAMICS_EDGES,
  );
  for (let tick = 0; tick < 80; tick++) {
    simulation = stepSimulationState(
      simulation,
      nodes,
      POPULATION_SURPLUS_DYNAMICS_EDGES,
    );
  }
  return simulation;
}

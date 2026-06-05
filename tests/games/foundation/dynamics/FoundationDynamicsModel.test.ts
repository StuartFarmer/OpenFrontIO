import { describe, expect, it } from "vitest";
import {
  applyInputActions,
  FOUNDATION_DYNAMICS_NODES,
  initialSimulationState,
  normalizeReadInputs,
  POPULATION_SURPLUS_DYNAMICS_EDGES,
  POPULATION_SURPLUS_DYNAMICS_NODES,
  stepSimulationState,
} from "../../../../src/games/foundation/dynamics/FoundationDynamicsModel";

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

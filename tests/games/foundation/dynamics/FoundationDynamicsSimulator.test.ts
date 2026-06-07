import { describe, expect, it } from "vitest";
import {
  initialDynamicsSimulationState,
  stepDynamicsSimulationState,
} from "../../../../src/core/systems/dynamics";
import {
  applyInputActions,
  FOUNDATION_DYNAMICS_EDGES,
  FOUNDATION_DYNAMICS_NODES,
  POPULATION_SURPLUS_DYNAMICS_EDGES,
  POPULATION_SURPLUS_DYNAMICS_NODES,
  savedDynamicsSystem,
  savedDynamicsSystemToSchema,
} from "../../../../src/games/foundation/dynamics/FoundationDynamicsModel";

describe("DynamicsSimulator", () => {
  it("steps the food stock builtin through compiled structures", () => {
    const system = savedDynamicsSystemToSchema(
      savedDynamicsSystem(
        "Food",
        FOUNDATION_DYNAMICS_NODES,
        FOUNDATION_DYNAMICS_EDGES,
      ),
    );
    const initial = initialDynamicsSimulationState(system);
    const next = stepDynamicsSimulationState(initial, system);

    expect(initial.sinkStates["food-stock"]).toBe(0);
    expect(next.frames[next.frames.length - 1]?.operatorValues).toEqual({
      "food-production": 20,
      "food-demand": 10,
    });
    expect(next.sinkStates["food-stock"]).toBe(10);
  });

  it("feeds sink reads into the next tick", () => {
    const system = savedDynamicsSystemToSchema(
      savedDynamicsSystem(
        "Population",
        POPULATION_SURPLUS_DYNAMICS_NODES,
        POPULATION_SURPLUS_DYNAMICS_EDGES,
      ),
    );
    const initial = initialDynamicsSimulationState(system);
    const next = stepDynamicsSimulationState(initial, system);

    expect(initial.sinkStates["surplus-population-stock"]).toBe(10);
    expect(next.sinkStates["surplus-population-stock"]).toBeGreaterThan(10);
  });

  it("preserves input ramp action behavior before simulation", () => {
    const applied = applyInputActions(FOUNDATION_DYNAMICS_NODES, [
      { nodeId: "tiles-owned", remainingTicks: 1, deltaPerTick: 10 },
    ]);
    const system = savedDynamicsSystemToSchema(
      savedDynamicsSystem("Food", applied.nodes, FOUNDATION_DYNAMICS_EDGES),
    );
    const next = stepDynamicsSimulationState(
      initialDynamicsSimulationState(system),
      system,
    );

    expect(next.frames[next.frames.length - 1]?.operatorValues).toMatchObject({
      "food-production": 40,
    });
    expect(applied.actions).toEqual([]);
  });
});

import { describe, expect, it } from "vitest";
import {
  GameSystemScheduler,
  type GameSystem,
} from "../../../src/core/systems/GameSystem";
import type { GameSystemContext } from "../../../src/core/systems/GameSystemContext";
import {
  createDynamicsGraphGameSystem,
  DYNAMICS_SCHEMA_VERSION,
  type DynamicsSavedSystem,
} from "../../../src/core/systems/dynamics";

describe("DynamicsGraphBinding", () => {
  it("runs graph bindings in scheduler order with imperative systems", () => {
    const calls: string[] = [];
    const host = { input: 2, stock: 10, afterSawStock: 0 };
    const scheduler = new GameSystemScheduler([
      imperativeSystem("after", "postTick", calls, () => {
        host.afterSawStock = host.stock;
      }),
      createDynamicsGraphGameSystem({
        id: "graph-stock",
        phase: "simulation",
        order: 10,
        readSystem: () => stockSystem(host.input, host.stock),
        applyResult: (result) => {
          host.stock = result.nextState.sinkStates.stock ?? host.stock;
          calls.push("graph-stock");
        },
      }),
      imperativeSystem("before", "preTick", calls, () => {
        host.input = 5;
      }),
      imperativeSystem("simulation-after", "simulation", calls, undefined, 20),
    ]);

    scheduler.tick(fakeContext());

    expect(calls).toEqual([
      "before",
      "graph-stock",
      "simulation-after",
      "after",
    ]);
    expect(host.stock).toBe(15);
    expect(host.afterSawStock).toBe(15);
  });

  it("applies sink and operator outputs to host state", () => {
    const host = { input: 4, stock: 3, appliedOperator: 0 };
    const result = createDynamicsGraphGameSystem({
      id: "graph-outputs",
      phase: "simulation",
      readSystem: () => stockSystem(host.input, host.stock, "delta * 2"),
      applyResult: (bindingResult) => {
        host.stock = bindingResult.nextState.sinkStates.stock ?? host.stock;
        host.appliedOperator = bindingResult.frame.operatorValues.doubled ?? 0;
      },
    });

    result.tick(fakeContext());

    expect(host.appliedOperator).toBe(8);
    expect(host.stock).toBe(11);
  });
});

function imperativeSystem(
  id: string,
  phase: GameSystem["phase"],
  calls: string[],
  onTick: () => void = () => {},
  order?: number,
): GameSystem {
  return {
    id,
    phase,
    order,
    tick: () => {
      onTick();
      calls.push(id);
    },
  };
}

function stockSystem(
  inputValue: number,
  stockInitialState: number,
  operatorExpression = "delta",
): DynamicsSavedSystem {
  return {
    version: DYNAMICS_SCHEMA_VERSION,
    definition: {
      version: DYNAMICS_SCHEMA_VERSION,
      id: "stock-system",
      name: "Stock system",
      nodes: [
        {
          id: "delta",
          primitive: "input",
          name: "delta",
          inputKind: "user",
        },
        {
          id: "doubled",
          primitive: "operator",
          name: "doubled",
          expression: operatorExpression,
        },
        {
          id: "stock",
          primitive: "sink",
          name: "stock",
          expression: "state + doubled",
        },
      ],
      edges: [
        { id: "delta-to-doubled", source: "delta", target: "doubled" },
        { id: "doubled-to-stock", source: "doubled", target: "stock" },
      ],
    },
    scenario: {
      version: DYNAMICS_SCHEMA_VERSION,
      id: "default",
      systemId: "stock-system",
      name: "Default",
      inputValues: { delta: inputValue },
      sinkInitialStates: { stock: stockInitialState },
    },
    view: {
      version: DYNAMICS_SCHEMA_VERSION,
      systemId: "stock-system",
      nodes: [],
    },
  };
}

function fakeContext(): GameSystemContext {
  return {
    game: undefined as never,
    tick: 0,
    inSpawnPhase: false,
    config: undefined as never,
    players: () => [],
    allPlayers: () => [],
    units: () => [],
    addExecution: () => {},
    addUpdate: () => {},
    stats: () => undefined as never,
  };
}

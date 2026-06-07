import { describe, expect, it } from "vitest";
import {
  compileDynamicsSystem,
  DynamicsCompileError,
} from "../../../../src/core/systems/dynamics";
import {
  FOUNDATION_DYNAMICS_EDGES,
  FOUNDATION_DYNAMICS_NODES,
  savedDynamicsSystem,
  savedDynamicsSystemToSchema,
} from "../../../../src/games/foundation/dynamics/FoundationDynamicsModel";

describe("DynamicsCompiler", () => {
  it("orders operator dependencies", () => {
    const compiled = compileDynamicsSystem(
      savedDynamicsSystemToSchema(
        savedDynamicsSystem(
          "Food",
          FOUNDATION_DYNAMICS_NODES,
          FOUNDATION_DYNAMICS_EDGES,
        ),
      ),
    );

    expect(compiled.operators.map((operator) => operator.id)).toEqual([
      "food-production",
      "food-demand",
    ]);
    expect(compiled.inputs.map((input) => input.id)).toContain("tiles-owned");
    expect(compiled.sinks.map((sink) => sink.id)).toEqual(["food-stock"]);
  });

  it("rejects operator cycles", () => {
    const schema = savedDynamicsSystemToSchema(
      savedDynamicsSystem("Cycle", FOUNDATION_DYNAMICS_NODES, [
        ...FOUNDATION_DYNAMICS_EDGES,
        {
          id: "cycle-a",
          source: "food-production",
          target: "food-demand",
        },
        {
          id: "cycle-b",
          source: "food-demand",
          target: "food-production",
        },
      ]),
    );

    expect(() => compileDynamicsSystem(schema)).toThrow(DynamicsCompileError);
    expect(() => compileDynamicsSystem(schema)).toThrow("operator cycle");
  });

  it("reports invalid formulas", () => {
    const schema = savedDynamicsSystemToSchema(
      savedDynamicsSystem(
        "Invalid",
        FOUNDATION_DYNAMICS_NODES.map((node) =>
          node.id === "food-production"
            ? { ...node, data: { ...node.data, expression: "tilesOwned *" } }
            : node,
        ),
        FOUNDATION_DYNAMICS_EDGES,
      ),
    );

    expect(() => compileDynamicsSystem(schema)).toThrow(
      'Node "food-production" has an invalid expression.',
    );
  });

  it("rejects non-finite scenario defaults", () => {
    const schema = {
      ...savedDynamicsSystemToSchema(
        savedDynamicsSystem(
          "Non finite",
          FOUNDATION_DYNAMICS_NODES,
          FOUNDATION_DYNAMICS_EDGES,
        ),
      ),
      scenario: {
        ...savedDynamicsSystemToSchema(
          savedDynamicsSystem(
            "Non finite",
            FOUNDATION_DYNAMICS_NODES,
            FOUNDATION_DYNAMICS_EDGES,
          ),
        ).scenario,
        inputValues: {
          "tiles-owned": Number.NaN,
        },
      },
    };

    expect(() => compileDynamicsSystem(schema)).toThrow(
      'Input "tiles-owned" has a non-finite default value.',
    );
  });
});

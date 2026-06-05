import { describe, expect, it } from "vitest";
import { SIMPLE_FOOD_STOCK_TEMPLATE } from "../../../../src/core/systems/dynamics";
import {
  replaceDynamicsNode,
  updateDynamicsNodeConfig,
  updateDynamicsNodeName,
} from "../../../../src/games/foundation/dynamics/react";

describe("DynamicsInspector helpers", () => {
  it("renames a node without changing its id or edges", () => {
    const system = SIMPLE_FOOD_STOCK_TEMPLATE.system;
    const node = system.nodes.find((node) => node.id === "population");
    expect(node).toBeTruthy();

    const renamed = replaceDynamicsNode(
      system,
      updateDynamicsNodeName(node!, "troops"),
    );

    expect(renamed.nodes.find((node) => node.id === "population")?.name).toBe(
      "troops",
    );
    expect(renamed.edges).toEqual(system.edges);
  });

  it("updates numeric node config values", () => {
    const system = SIMPLE_FOOD_STOCK_TEMPLATE.system;
    const node = system.nodes.find((node) => node.id === "yieldPerTile");
    expect(node?.type).toBe("parameter");

    const updated = updateDynamicsNodeConfig(node!, { value: 3 });

    expect(updated.config).toMatchObject({ value: 3 });
    expect(updated.id).toBe("yieldPerTile");
  });
});

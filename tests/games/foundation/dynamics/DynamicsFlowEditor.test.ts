import { describe, expect, it } from "vitest";
import { SIMPLE_FOOD_STOCK_TEMPLATE } from "../../../../src/core/systems/dynamics";
import {
  addDynamicsNodeToSystem,
  dynamicsSystemToReactFlowEdges,
  dynamicsSystemToReactFlowNodes,
} from "../../../../src/games/foundation/dynamics/react";

describe("DynamicsFlowEditor schema mapping", () => {
  it("maps portable dynamics schema to React Flow nodes and edges", () => {
    const nodes = dynamicsSystemToReactFlowNodes(
      SIMPLE_FOOD_STOCK_TEMPLATE.system,
    );
    const edges = dynamicsSystemToReactFlowEdges(
      SIMPLE_FOOD_STOCK_TEMPLATE.system,
    );

    expect(nodes).toHaveLength(SIMPLE_FOOD_STOCK_TEMPLATE.system.nodes.length);
    expect(edges).toHaveLength(SIMPLE_FOOD_STOCK_TEMPLATE.system.edges.length);
    expect(nodes.find((node) => node.id === "foodStock")?.type).toBe(
      "dynamics",
    );
    expect(nodes.find((node) => node.id === "foodStock")?.data).toMatchObject({
      label: "foodStock",
      nodeType: "stock",
    });
    expect(edges.find((edge) => edge.id === "capacity-to-stock")).toMatchObject(
      {
        source: "foodStockCapacity",
        target: "foodStock",
        targetHandle: "max",
      },
    );
  });

  it("adds a layer one node without mutating the original system", () => {
    const before = SIMPLE_FOOD_STOCK_TEMPLATE.system;

    const after = addDynamicsNodeToSystem(before, "input");

    expect(before.nodes).toHaveLength(12);
    expect(after.nodes).toHaveLength(13);
    expect(after.nodes[12]).toMatchObject({
      id: "input",
      type: "input",
      name: "input",
      config: { value: 0 },
    });
  });
});

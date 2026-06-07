import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { DYNAMICS_SCHEMA_VERSION } from "../../../../src/core/systems/dynamics";
import {
  FOUNDATION_DYNAMICS_EDGES,
  FOUNDATION_DYNAMICS_NODES,
  savedDynamicsSystem,
  savedDynamicsSystemToSchema,
} from "../../../../src/games/foundation/dynamics/FoundationDynamicsModel";
import {
  dynamicsSystemToReactFlowGraph,
  reactFlowGraphToDynamicsSystem,
} from "../../../../src/games/foundation/dynamics/react/FoundationDynamicsReactFlowMapping";

describe("Foundation dynamics React Flow mapping", () => {
  it("round trips canonical schema through React Flow projection", () => {
    const system = savedDynamicsSystem(
      "Food Mapping",
      FOUNDATION_DYNAMICS_NODES,
      FOUNDATION_DYNAMICS_EDGES,
    );

    const schema = savedDynamicsSystemToSchema(system);
    const graph = dynamicsSystemToReactFlowGraph(schema);
    const roundTripped = reactFlowGraphToDynamicsSystem(schema, graph);

    expect(schema.version).toBe(DYNAMICS_SCHEMA_VERSION);
    expect(schema.definition.nodes[0]).not.toHaveProperty("position");
    expect(graph.nodes[0]?.position).toEqual(
      FOUNDATION_DYNAMICS_NODES[0]?.position,
    );
    expect(graph.nodes[0]?.initialWidth).toBeGreaterThan(0);
    expect(graph.nodes[0]?.initialHeight).toBeGreaterThan(0);
    expect(schema.view.nodes[0]?.position).toEqual(
      FOUNDATION_DYNAMICS_NODES[0]?.position,
    );
    expect(roundTripped.definition.nodes.map((node) => node.id)).toEqual(
      schema.definition.nodes.map((node) => node.id),
    );
    expect(roundTripped.definition.edges.map((edge) => edge.id)).toEqual(
      schema.definition.edges.map((edge) => edge.id),
    );
    expect(roundTripped.scenario).toEqual(schema.scenario);
    expect(roundTripped.view.nodes[0]?.position).toEqual(
      schema.view.nodes[0]?.position,
    );
  });

  it("keeps editable input controls in view metadata", () => {
    const system = savedDynamicsSystem(
      "Food Mapping",
      FOUNDATION_DYNAMICS_NODES,
      FOUNDATION_DYNAMICS_EDGES,
    );

    const schema = savedDynamicsSystemToSchema(system);
    const graph = dynamicsSystemToReactFlowGraph(schema);
    const roundTripped = reactFlowGraphToDynamicsSystem(schema, graph);
    const tilesOwnedView = schema.view.nodes.find(
      (node) => node.id === "tiles-owned",
    );
    const roundTrippedTilesOwnedView = roundTripped.view.nodes.find(
      (node) => node.id === "tiles-owned",
    );

    expect(tilesOwnedView?.inputControl).toEqual({
      sliderMin: 0,
      sliderMax: 100,
      actionAmount: 1,
      actionTicks: 10,
    });
    expect(roundTripped.definition.nodes[0]).not.toHaveProperty("inputControl");
    expect(roundTrippedTilesOwnedView?.inputControl).toEqual(
      tilesOwnedView?.inputControl,
    );
  });

  it("keeps React Flow imports inside the mapping and bridge modules", () => {
    const modelSource = readFileSync(
      "src/games/foundation/dynamics/FoundationDynamicsModel.ts",
      "utf8",
    );
    const pageSource = readFileSync(
      "src/games/foundation/client/FoundationDynamicsPage.ts",
      "utf8",
    );

    expect(modelSource).not.toContain("@xyflow/react");
    expect(pageSource).not.toContain("@xyflow/react");
  });
});

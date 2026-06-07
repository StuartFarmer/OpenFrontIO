import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  DYNAMICS_SCHEMA_VERSION,
  type DynamicsRuntimeState,
  type DynamicsSavedSystem,
  validateDynamicsSystemDefinition,
} from "../../../../src/core/systems/dynamics";

describe("DynamicsSchema", () => {
  it("separates definition, scenario, view, and runtime state", () => {
    const saved = exampleSavedSystem();
    const runtime: DynamicsRuntimeState = {
      running: false,
      tick: 0,
      sinkStates: { foodStock: 0 },
      frames: [
        {
          tick: 0,
          operatorValues: { foodProduction: 20 },
          sinkStates: { foodStock: 0 },
        },
      ],
    };

    expect(saved.definition.nodes[0]).not.toHaveProperty("position");
    expect(saved.definition.nodes[0]).not.toHaveProperty("value");
    expect(saved.scenario.inputValues?.tilesOwned).toBe(10);
    expect(saved.view.nodes[0].position).toEqual({ x: 0, y: 0 });
    expect(runtime.frames[0]?.operatorValues.foodProduction).toBe(20);
  });

  it("rejects duplicate node ids and missing edge references", () => {
    const saved = exampleSavedSystem();

    const errors = validateDynamicsSystemDefinition({
      ...saved.definition,
      nodes: [
        ...saved.definition.nodes,
        {
          id: "tilesOwned",
          primitive: "input",
          name: "duplicateTilesOwned",
          inputKind: "user",
        },
      ],
      edges: [
        ...saved.definition.edges,
        {
          id: "missing-source",
          source: "missing",
          target: "foodProduction",
        },
      ],
    });

    expect(errors).toEqual(
      expect.arrayContaining([
        'Duplicate dynamics node id "tilesOwned".',
        'Dynamics edge "missing-source" references missing source "missing".',
      ]),
    );
  });

  it("rejects read inputs that reference missing sinks", () => {
    const saved = exampleSavedSystem();
    const errors = validateDynamicsSystemDefinition({
      ...saved.definition,
      nodes: [
        ...saved.definition.nodes,
        {
          id: "foodRead",
          primitive: "input",
          name: "foodRead",
          inputKind: "read",
          readSinkId: "missingSink",
        },
      ],
    });

    expect(errors).toContain(
      'Read input "foodRead" references missing sink "missingSink".',
    );
  });

  it("does not import React Flow in the schema module", () => {
    const source = readFileSync(
      "src/core/systems/dynamics/DynamicsSchema.ts",
      "utf8",
    );

    expect(source).not.toContain("@xyflow/react");
  });
});

function exampleSavedSystem(): DynamicsSavedSystem {
  return {
    version: DYNAMICS_SCHEMA_VERSION,
    definition: {
      version: DYNAMICS_SCHEMA_VERSION,
      id: "food",
      name: "Food",
      nodes: [
        {
          id: "tilesOwned",
          primitive: "input",
          name: "tilesOwned",
          inputKind: "user",
        },
        {
          id: "yieldPerTile",
          primitive: "input",
          name: "yieldPerTile",
          inputKind: "constant",
        },
        {
          id: "foodProduction",
          primitive: "operator",
          name: "foodProduction",
          expression: "tilesOwned * yieldPerTile",
        },
        {
          id: "foodStock",
          primitive: "sink",
          name: "foodStock",
          expression: "state + foodProduction",
        },
      ],
      edges: [
        {
          id: "tiles-to-production",
          source: "tilesOwned",
          target: "foodProduction",
        },
      ],
    },
    scenario: {
      version: DYNAMICS_SCHEMA_VERSION,
      id: "baseline",
      systemId: "food",
      name: "Baseline",
      inputValues: {
        tilesOwned: 10,
        yieldPerTile: 2,
      },
      sinkInitialStates: {
        foodStock: 0,
      },
    },
    view: {
      version: DYNAMICS_SCHEMA_VERSION,
      systemId: "food",
      nodes: [
        {
          id: "tilesOwned",
          position: { x: 0, y: 0 },
          inputControl: { sliderMin: 0, sliderMax: 100 },
        },
      ],
    },
  };
}

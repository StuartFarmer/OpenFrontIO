import { describe, expect, it } from "vitest";
import {
  initialDynamicsSimulationState,
  stepDynamicsSimulationState,
} from "../../../../src/core/systems/dynamics";
import {
  createPlayer,
  normalizeFoundationSimulationParameters,
  type FoundationSimulationParameters,
  type Player,
} from "../../../../src/games/foundation/domain";
import {
  FOUNDATION_DYNAMICS_BUILTIN_SYSTEMS,
  FOUNDATION_ECONOMY_DYNAMICS_SYSTEM_ID,
  savedDynamicsSystemFromSchema,
} from "../../../../src/games/foundation/dynamics/FoundationDynamicsModel";
import {
  createFoundationEconomyDynamicsSystem,
  FOUNDATION_ECONOMY_NODE_IDS,
} from "../../../../src/games/foundation/dynamics/FoundationEconomyDynamics";
import { foundationEconomyFixture } from "./fixtures/FoundationEconomyFixtures";

describe("Foundation economy dynamics", () => {
  it("matches fixed placed-player economy fixture values", () => {
    const fixture = foundationEconomyFixture("placed-balanced");
    const parameters = normalizeFoundationSimulationParameters(
      fixture.parameters,
    );
    const player = fixturePlayer(fixture);

    const result = stepEconomy(player, parameters);
    const frame = result.frames[result.frames.length - 1];

    expectCloseToRecord(result.sinkStates, fixture.graph.sinkStates);
    expectCloseToRecord(frame.operatorValues, fixture.graph.operatorValues);
  });

  it("matches fixed no-op fixture values before player placement", () => {
    const fixture = foundationEconomyFixture("unplaced-noop");
    const parameters = normalizeFoundationSimulationParameters(
      fixture.parameters,
    );
    const player = fixturePlayer(fixture);

    const result = stepEconomy(player, parameters);
    const frame = result.frames[result.frames.length - 1];

    expectCloseToRecord(result.sinkStates, fixture.graph.sinkStates);
    expectCloseToRecord(frame.operatorValues, fixture.graph.operatorValues);
  });

  it("is available as an editor-loadable built-in system", () => {
    const builtin = FOUNDATION_DYNAMICS_BUILTIN_SYSTEMS.find(
      (system) =>
        system.definition.id === FOUNDATION_ECONOMY_DYNAMICS_SYSTEM_ID,
    );

    expect(builtin).toBeTruthy();
    expect(builtin?.definition.name).toBe("Foundation economy model");
    expect(builtin?.definition.nodes.length).toBeGreaterThan(0);
    expect(builtin?.definition.edges.length).toBeGreaterThan(0);
    expect(builtin?.view.nodes.length).toBeGreaterThan(0);
  });

  it("keeps built-in view metadata when projected into the editor", () => {
    for (const builtin of FOUNDATION_DYNAMICS_BUILTIN_SYSTEMS) {
      const editorSystem = savedDynamicsSystemFromSchema(builtin);

      expect(builtin.definition.nodes[0]).not.toHaveProperty("position");
      expect(editorSystem.nodes[0]?.position).toEqual(
        builtin.view.nodes.find((node) => node.id === editorSystem.nodes[0]?.id)
          ?.position,
      );
    }
  });
});

function stepEconomy(
  player: Player,
  parameters: FoundationSimulationParameters,
) {
  const system = createFoundationEconomyDynamicsSystem({
    inputValues: {
      [FOUNDATION_ECONOMY_NODE_IDS.isPlaced]: player.placement === null ? 0 : 1,
      [FOUNDATION_ECONOMY_NODE_IDS.tilesOwned]:
        player.placement?.claimedTileCount ?? 0,
      [FOUNDATION_ECONOMY_NODE_IDS.foodPerTile]: parameters.foodPerTile,
      [FOUNDATION_ECONOMY_NODE_IDS.foodReservePercentage]:
        parameters.foodReservePercentage,
      [FOUNDATION_ECONOMY_NODE_IDS.foodPerTroop]: parameters.foodPerTroop,
      [FOUNDATION_ECONOMY_NODE_IDS.baseFoodStorageCapacity]:
        parameters.baseFoodStorageCapacity,
      [FOUNDATION_ECONOMY_NODE_IDS.baseSilosOwned]: parameters.baseSilosOwned,
      [FOUNDATION_ECONOMY_NODE_IDS.addedStorageCapacityPerSilo]:
        parameters.addedStorageCapacityPerSilo,
      [FOUNDATION_ECONOMY_NODE_IDS.stockpileGrowthRate]:
        parameters.stockpileGrowthRate,
      [FOUNDATION_ECONOMY_NODE_IDS.maxPopulationGrowthRate]:
        parameters.maxPopulationGrowthRate,
    },
    sinkInitialStates: {
      [FOUNDATION_ECONOMY_NODE_IDS.foodStock]: player.foodStock,
      [FOUNDATION_ECONOMY_NODE_IDS.troops]: player.troops,
    },
  });
  return stepDynamicsSimulationState(
    initialDynamicsSimulationState(system),
    system,
  );
}

function placedPlayer(options: {
  readonly claimedTileCount: number;
  readonly troops: number;
  readonly foodStock: number;
}): Player {
  const player = createPlayer("player-1", {
    troops: options.troops,
    foodStock: options.foodStock,
  });
  return {
    ...player,
    placement: {
      selectedTile: 1,
      claimedTiles: Array.from(
        { length: options.claimedTileCount },
        (_value, index) => index + 1,
      ),
      claimedTileCount: options.claimedTileCount,
    },
  };
}

function fixturePlayer(
  fixture: ReturnType<typeof foundationEconomyFixture>,
): Player {
  if (fixture.player === null) {
    return createPlayer("player-1", {
      troops: 25_000,
      foodStock: 1_750,
    });
  }
  return placedPlayer(fixture.player);
}

function expectCloseToRecord(
  actual: Readonly<Record<string, number>>,
  expected: Readonly<Record<string, number>>,
): void {
  for (const [key, value] of Object.entries(expected)) {
    expect(actual[key]).toBeCloseTo(value, 6);
  }
}

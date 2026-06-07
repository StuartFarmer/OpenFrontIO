import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import type { GameSystemContext } from "../../../../src/core/systems/GameSystemContext";
import { tickDynamicsGraphBinding } from "../../../../src/core/systems/dynamics";
import {
  createPlayer,
  normalizeFoundationSimulationParameters,
  type FoundationFoodStockMetrics,
  type Player,
} from "../../../../src/games/foundation/domain";
import {
  createFoundationEconomyDynamicsBinding,
  evaluateFoundationEconomyDynamicsSnapshot,
  tickFoundationEconomyDynamicsRuntime,
} from "../../../../src/games/foundation/runtime";
import { foundationEconomyFixture } from "./fixtures/FoundationEconomyFixtures";

describe("FoundationEconomyDynamicsSystem", () => {
  it("reads Foundation player state without mutating it", () => {
    const fixture = foundationEconomyFixture("placed-balanced");
    const parameters = normalizeFoundationSimulationParameters(
      fixture.parameters,
    );
    const player = fixturePlayer(fixture);

    const snapshot = evaluateFoundationEconomyDynamicsSnapshot(
      player,
      parameters,
    );

    expect(player.troops).toBe(fixture.player?.troops);
    expect(player.foodStock).toBe(fixture.player?.foodStock);
    expect(snapshot.sinkStates).toMatchObject({
      "foundation-economy-food-stock": fixture.player?.foodStock,
      "foundation-economy-troops": fixture.player?.troops,
    });
    expect(snapshot.metrics.foodProduction).toBe(
      fixture.snapshotMetrics.foodProduction,
    );
    expect(snapshot.metrics.foodDemand).toBe(
      fixture.snapshotMetrics.foodDemand,
    );
  });

  it("outputs the metrics shape used by Foundation runtime updates", () => {
    const fixture = foundationEconomyFixture("placed-balanced");
    const parameters = normalizeFoundationSimulationParameters(
      fixture.parameters,
    );
    const player = fixturePlayer(fixture);
    const lastFoodStock: FoundationFoodStockMetrics = {
      produced: 0,
      producedForPeople: 0,
      producedForStorage: 0,
      demanded: 0,
      populationCapacity: 0,
      stockBefore: 2_950,
      stockAfter: 3_000,
      stockCapacity: fixture.snapshotMetrics.foodStockCapacity ?? 0,
      stockDelta: 50,
      overflow: 4,
    };

    const snapshot = evaluateFoundationEconomyDynamicsSnapshot(
      player,
      parameters,
      lastFoodStock,
    );

    expect(snapshot.metrics).toMatchObject({
      pendingTurns: 0,
      troops: player.troops,
      troopIncreaseRate: fixture.snapshotMetrics.troopIncreaseRate,
      maxTroops: fixture.snapshotMetrics.maxTroops,
      foodProduction: fixture.snapshotMetrics.foodProduction,
      foodDemand: fixture.snapshotMetrics.foodDemand,
      foodSupportedTroops: fixture.snapshotMetrics.foodSupportedTroops,
      foodSurplus: fixture.snapshotMetrics.foodSurplus,
      foodStock: player.foodStock,
      foodStockCapacity: fixture.snapshotMetrics.foodStockCapacity,
      foodStockDelta: 50,
      foodStockOverflow: 4,
      exploringTroops: 0,
    });
  });

  it("matches fixed fixture values for one economy tick", () => {
    const fixture = foundationEconomyFixture("runtime-growth");
    const parameters = normalizeFoundationSimulationParameters(
      fixture.parameters,
    );
    const player = fixturePlayer(fixture);

    const result = tickFoundationEconomyDynamicsRuntime(player, parameters);

    expect(result.player.foodStock).toBeCloseTo(
      fixture.runtime.player.foodStock,
      6,
    );
    expect(result.player.troops).toBeCloseTo(fixture.runtime.player.troops, 6);
    expectCloseToRecord(
      result.foodStockMetrics,
      fixture.runtime.foodStockMetrics,
    );
    expectCloseToRecord(result.metrics, fixture.runtime.metrics);
  });

  it("runs through the generic graph binding contract", () => {
    const parameters = normalizeFoundationSimulationParameters({
      foodPerTile: 1_500,
    });
    let player = placedPlayer({
      claimedTileCount: 90,
      troops: 28_000,
      foodStock: 6_000,
    });
    const binding = createFoundationEconomyDynamicsBinding<GameSystemContext>({
      readPlayer: () => player,
      readParameters: () => parameters,
      applyTick: (tick) => {
        player = tick.player;
      },
    });

    tickDynamicsGraphBinding(binding, fakeContext());

    expect(player.foodStock).toBeGreaterThan(6_000);
    expect(player.troops).toBeGreaterThan(28_000);
  });

  it("keeps Foundation runtime callers on the graph-backed economy system", () => {
    const runtimeSources = [
      "src/games/foundation/runtime/FoundationRuntime.ts",
      "src/games/foundation/runtime/FoundationCommandRouter.ts",
      "src/games/foundation/runtime/index.ts",
    ];

    for (const sourcePath of runtimeSources) {
      const source = readFileSync(sourcePath, "utf8");
      expect(source).not.toContain("FoundationDynamicsRuntimeAdapter");
      expect(source).not.toContain("tickFoundationFood");
      expect(source).not.toContain("troopIncreaseRate(");
    }
  });
});

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

function expectCloseToRecord(actual: object, expected: object): void {
  const actualRecord = actual as Readonly<Record<string, number | undefined>>;
  const expectedRecord = expected as Readonly<Record<string, number>>;

  for (const [key, value] of Object.entries(expectedRecord)) {
    expect(actualRecord[key]).toBeCloseTo(value, 6);
  }
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

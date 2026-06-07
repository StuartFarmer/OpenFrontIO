import { existsSync, readFileSync } from "node:fs";
import { describe, expect, test } from "vitest";
import {
  type GameSystem,
  GameSystemScheduler,
} from "../../../src/core/systems/GameSystem";
import type { GameSystemContext } from "../../../src/core/systems/GameSystemContext";
import {
  createPlayer,
  normalizeFoundationSimulationParameters,
  type Player,
} from "../../../src/games/foundation/domain";
import { tickFoundationEconomyDynamicsRuntime } from "../../../src/games/foundation/runtime";

describe("dynamics graph system boundary", () => {
  test("scheduler_runs_compiled_dynamics_system_in_phase_order", () => {
    const calls: string[] = [];
    const parameters = normalizeFoundationSimulationParameters();
    let player = placedPlayer({
      claimedTileCount: 72,
      troops: 25_000,
      foodStock: 2_000,
    });
    const scheduler = new GameSystemScheduler([
      imperativeSystem("emit-updates", "postTick", calls),
      dynamicsEconomySystem(
        () => player,
        (next) => (player = next),
        calls,
      ),
      imperativeSystem("commands", "preTick", calls),
      imperativeSystem("territory", "simulation", calls, 20),
    ]);

    scheduler.tick(fakeContext());

    expect(calls).toEqual([
      "commands",
      "foundation-economy-dynamics",
      "territory",
      "emit-updates",
    ]);
    expect(player.foodStock).toBeGreaterThan(2_000);
    expect(player.troops).toBeGreaterThan(25_000);

    function dynamicsEconomySystem(
      readPlayer: () => Player,
      writePlayer: (player: Player) => void,
      calls: string[],
    ): GameSystem {
      return {
        id: "foundation-economy-dynamics",
        phase: "simulation",
        order: 10,
        tick: () => {
          const result = tickFoundationEconomyDynamicsRuntime(
            readPlayer(),
            parameters,
          );
          writePlayer(result.player);
          calls.push("foundation-economy-dynamics");
        },
      };
    }
  });

  test("runtime_boundary_does_not_import_react_flow", () => {
    const runtimeSources = [
      "../../../src/core/systems/dynamics/DynamicsSchema.ts",
      "../../../src/core/systems/dynamics/DynamicsCompiler.ts",
      "../../../src/core/systems/dynamics/DynamicsSimulator.ts",
      "../../../src/core/systems/dynamics/DynamicsGraphBinding.ts",
      "../../../src/games/foundation/dynamics/FoundationEconomyDynamics.ts",
      "../../../src/games/foundation/runtime/FoundationEconomyDynamicsSystem.ts",
      "../../../src/games/foundation/runtime/FoundationRuntime.ts",
    ];

    for (const source of runtimeSources) {
      const contents = readFileSync(new URL(source, import.meta.url), "utf8");
      expect(contents).not.toContain("@xyflow/react");
    }
  });

  test("foundation_runtime_public_exports_do_not_expose_adapter_aliases", () => {
    const runtimeBarrel = readFileSync(
      "src/games/foundation/runtime/index.ts",
      "utf8",
    );

    expect(
      existsSync(
        "src/games/foundation/runtime/FoundationDynamicsRuntimeAdapter.ts",
      ),
    ).toBe(false);
    expect(runtimeBarrel).not.toContain("FoundationDynamicsRuntimeAdapter");
    expect(runtimeBarrel).not.toContain("tickFoundationDynamicsRuntime");
    expect(runtimeBarrel).not.toContain(
      "evaluateFoundationDynamicsRuntimeSnapshot",
    );
  });
});

function imperativeSystem(
  id: string,
  phase: GameSystem["phase"],
  calls: string[],
  order?: number,
): GameSystem {
  return {
    id,
    phase,
    order,
    tick: () => calls.push(id),
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

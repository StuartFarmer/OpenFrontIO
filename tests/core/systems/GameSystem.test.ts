import { describe, expect, test } from "vitest";
import {
  GameSystem,
  GameSystemScheduler,
} from "../../../src/core/systems/GameSystem";
import { GameSystemContext } from "../../../src/core/systems/GameSystemContext";

describe("game system scheduler", () => {
  test("system_scheduler_orders_phases", () => {
    const calls: string[] = [];
    const scheduler = new GameSystemScheduler([
      recordingSystem("simulation-b", "simulation", calls, 20),
      recordingSystem("pre", "preTick", calls),
      recordingSystem("simulation-a", "simulation", calls, 10),
      recordingSystem("post", "postTick", calls),
      recordingSystem("legacy", "legacyExecution", calls),
    ]);

    scheduler.tick(fakeContext({ inSpawnPhase: false }));

    expect(calls).toEqual([
      "pre",
      "legacy",
      "simulation-a",
      "simulation-b",
      "post",
    ]);
  });

  test("system_scheduler_respects_spawn_phase", () => {
    const calls: string[] = [];
    const scheduler = new GameSystemScheduler([
      recordingSystem("blocked", "simulation", calls),
      {
        ...recordingSystem("allowed", "simulation", calls),
        activeDuringSpawnPhase: () => true,
      },
    ]);

    scheduler.tick(fakeContext({ inSpawnPhase: true }));

    expect(calls).toEqual(["allowed"]);
  });
});

function recordingSystem(
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

function fakeContext(
  overrides: Partial<Pick<GameSystemContext, "inSpawnPhase">> = {},
): GameSystemContext {
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
    ...overrides,
  };
}

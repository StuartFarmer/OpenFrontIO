import { describe, expect, test } from "vitest";
import { Execution, Game } from "../../../src/core/game/Game";
import { GameSystemContext } from "../../../src/core/systems/GameSystemContext";
import { LEGACY_EXECUTION_REGISTRY } from "../../../src/core/systems/LegacyExecutionRegistry";
import { LegacyExecutionSystem } from "../../../src/core/systems/LegacyExecutionSystem";

describe("legacy execution system", () => {
  test("legacy_execution_adapter_preserves_tick_order", () => {
    const calls: string[] = [];
    const system = new LegacyExecutionSystem();
    const first = recordingExecution("first", calls);
    const second = recordingExecution("second", calls);

    system.addExecution(first, second);
    system.tick(fakeContext({ tick: 0, inSpawnPhase: false }));
    system.tick(fakeContext({ tick: 1, inSpawnPhase: false }));

    expect(calls).toEqual([
      "first:init:0",
      "second:init:0",
      "first:tick:1",
      "second:tick:1",
    ]);
  });

  test("legacy_execution_retirement_no_duplicate_ticks", () => {
    const calls: string[] = [];
    const system = new LegacyExecutionSystem();
    const execution = recordingExecution("execution", calls);

    system.addExecution(execution);
    system.tick(fakeContext({ tick: 10, inSpawnPhase: false }));

    expect(calls).toEqual(["execution:init:10"]);

    system.tick(fakeContext({ tick: 11, inSpawnPhase: false }));

    expect(calls).toEqual(["execution:init:10", "execution:tick:11"]);
  });

  test("legacy_execution_adapter_removes_inactive", () => {
    const calls: string[] = [];
    const system = new LegacyExecutionSystem();
    const execution = recordingExecution("execution", calls, {
      activeAfterFirstTick: false,
    });

    system.addExecution(execution);
    system.tick(fakeContext({ tick: 0, inSpawnPhase: false }));
    system.tick(fakeContext({ tick: 1, inSpawnPhase: false }));
    system.tick(fakeContext({ tick: 2, inSpawnPhase: false }));

    expect(calls).toEqual(["execution:init:0", "execution:tick:1"]);
    expect(system.executions()).toEqual([]);
  });

  test("legacy_execution_adapter_preserves_spawn_phase_gating", () => {
    const calls: string[] = [];
    const system = new LegacyExecutionSystem();
    const blocked = recordingExecution("blocked", calls);
    const allowed = recordingExecution("allowed", calls, {
      activeDuringSpawnPhase: true,
    });

    system.addExecution(blocked, allowed);
    system.tick(fakeContext({ tick: 0, inSpawnPhase: true }));

    expect(calls).toEqual(["allowed:init:0"]);
    expect(system.executions()).toContain(blocked);
  });

  test("legacy_execution_compatibility_shims_documented", () => {
    const documentedExecutions = new Set(
      LEGACY_EXECUTION_REGISTRY.flatMap((record) => record.executions),
    );

    expect(Array.from(documentedExecutions)).toEqual(
      expect.arrayContaining([
        "PlayerExecution",
        "AttackExecution",
        "ConstructionExecution",
        "NukeExecution",
        "IntentCommandSurface",
        "AiCommandSurface",
        "NationExecution",
        "TribeExecution",
        "SpawnExecution",
        "EmojiExecution",
      ]),
    );
    expect(
      LEGACY_EXECUTION_REGISTRY.filter(
        (record) => record.status === "compatibility-shim",
      ).length,
    ).toBeGreaterThan(0);
    expect(
      LEGACY_EXECUTION_REGISTRY.filter(
        (record) => record.status === "system-owned",
      ).length,
    ).toBeGreaterThan(0);
    expect(
      LEGACY_EXECUTION_REGISTRY.filter(
        (record) => record.status === "retained-engine",
      ).length,
    ).toBeGreaterThan(0);
  });
});

function recordingExecution(
  id: string,
  calls: string[],
  options: Partial<{
    activeAfterFirstTick: boolean;
    activeDuringSpawnPhase: boolean;
  }> = {},
): Execution {
  let active = true;
  let tickCount = 0;
  return {
    init: (_game, tick) => calls.push(`${id}:init:${tick}`),
    tick: (tick) => {
      calls.push(`${id}:tick:${tick}`);
      tickCount++;
      if (options.activeAfterFirstTick === false && tickCount >= 1) {
        active = false;
      }
    },
    isActive: () => active,
    activeDuringSpawnPhase: () => options.activeDuringSpawnPhase === true,
  };
}

function fakeContext(
  overrides: Partial<Pick<GameSystemContext, "tick" | "inSpawnPhase">>,
): GameSystemContext {
  return {
    game: undefined as never as Game,
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

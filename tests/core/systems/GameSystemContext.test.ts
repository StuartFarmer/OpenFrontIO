import { describe, expect, test, vi } from "vitest";
import { NoOpExecution } from "../../../src/core/execution/NoOpExecution";
import { GameUpdateType } from "../../../src/core/game/GameUpdates";
import { createGameSystemContext } from "../../../src/core/systems/GameSystemContext";
import { setup } from "../../util/Setup";

describe("game system context", () => {
  test("system_context_exposes_tick_and_config", async () => {
    const game = await setup("big_plains");
    const context = createGameSystemContext(game);

    expect(context.game).toBe(game);
    expect(context.tick).toBe(game.ticks());
    expect(context.inSpawnPhase).toBe(game.inSpawnPhase());
    expect(context.config).toBe(game.config());
    expect(context.players()).toEqual(game.players());
    expect(context.allPlayers()).toEqual(game.allPlayers());
    expect(context.units()).toEqual(game.units());
    expect(context.stats()).toBe(game.stats());
  });

  test("system_context_enqueues_updates_and_executions", async () => {
    const game = await setup("big_plains");
    const addUpdate = vi.spyOn(game, "addUpdate");
    const context = createGameSystemContext(game);
    const execution = new NoOpExecution();

    context.addExecution(execution);
    context.addUpdate({
      type: GameUpdateType.Hash,
      tick: 0,
      hash: 123,
    });

    expect(
      (game as typeof game & { executions(): unknown[] }).executions(),
    ).toContain(execution);
    expect(addUpdate).toHaveBeenCalledWith({
      type: GameUpdateType.Hash,
      tick: 0,
      hash: 123,
    });
  });
});

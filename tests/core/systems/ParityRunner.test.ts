import { describe, expect, test } from "vitest";
import { PlayerInfo, PlayerType } from "../../../src/core/game/Game";
import {
  expectParity,
  formatParityDiff,
  runParityScenario,
} from "../../util/parity/ParityRunner";
import { setup } from "../../util/Setup";

describe("parity runner", () => {
  test("parity_runner_passes_identical_games", async () => {
    const expected = await buildSimpleGame();
    const actual = await buildSimpleGame();

    const result = runParityScenario(
      { label: "legacy", game: expected },
      { label: "systems", game: actual },
      { ticks: 3, captureUpdates: true },
    );

    expect(result.firstDiff).toBeNull();
    expect(result.steps).toHaveLength(3);
    expect(() => expectParity(result)).not.toThrow();
  });

  test("parity_runner_reports_changed_troops", async () => {
    const expected = await buildSimpleGame();
    const actual = await buildSimpleGame();

    actual.player("player").addTroops(1);

    const result = runParityScenario(
      { label: "legacy", game: expected },
      { label: "systems", game: actual },
      { ticks: 1 },
    );

    expect(result.firstDiff).toMatchObject({
      path: "$.hash",
      expected: expect.any(Number),
      actual: expect.any(Number),
    });
    expect(formatParityDiff(result)).toContain("Parity mismatch at tick 1");
    expect(formatParityDiff(result)).toContain("$.hash");
  });
});

async function buildSimpleGame() {
  const game = await setup("big_plains", { instantBuild: true }, [
    new PlayerInfo("player", PlayerType.Human, "client", "player"),
  ]);
  const player = game.player("player");

  player.conquer(game.ref(50, 50));
  player.setTroops(5_000);

  return game;
}

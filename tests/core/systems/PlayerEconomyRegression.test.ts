import { describe, expect, test } from "vitest";
import { PlayerExecution } from "../../../src/core/execution/PlayerExecution";
import { PlayerInfo, PlayerType } from "../../../src/core/game/Game";
import { setup } from "../../util/Setup";
import { executeTicks } from "../../util/utils";

describe("PlayerEconomy stock-flow regression", () => {
  test("same initial state produces deterministic economy outputs", async () => {
    const buildGame = async () => {
      const game = await setup("big_plains", { instantBuild: true }, [
        new PlayerInfo("player", PlayerType.Human, null, "player_id"),
      ]);
      const player = game.player("player_id");
      player.conquer(game.ref(50, 50));
      player.setTroops(25_000);
      game.addExecution(new PlayerExecution(player));
      return { game, player };
    };

    const first = await buildGame();
    const second = await buildGame();

    executeTicks(first.game, 5);
    executeTicks(second.game, 5);

    expect(second.player.troops()).toBe(first.player.troops());
    expect(second.player.resources()).toEqual(first.player.resources());
  });
});

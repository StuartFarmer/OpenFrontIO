import { describe, expect, test } from "vitest";
import type { GameUpdates } from "../../../src/core/game/Game";
import { Game, PlayerInfo, PlayerType } from "../../../src/core/game/Game";
import { GameUpdateType } from "../../../src/core/game/GameUpdates";
import { TerritoryConquestSystem } from "../../../src/games/openfront/systems/gameplay/TerritoryConquestSystem";
import { setup } from "../../util/Setup";

describe("TerritoryConquestSystem", () => {
  test("territory_system_preserves_tile_capture", async () => {
    const game = await buildTwoPlayerFront();
    const attacker = game.player("attacker");
    const defender = game.player("defender");
    const defenderTile = game.ref(51, 50);

    new TerritoryConquestSystem().captureAttackTile({
      game,
      attacker,
      target: defender,
      tile: defenderTile,
    });

    expect(game.owner(defenderTile)).toBe(attacker);
    expect(attacker.numTilesOwned()).toBe(2);
    expect(defender.numTilesOwned()).toBe(0);
  });

  test("conquest_system_preserves_rewards_and_events", async () => {
    const game = await buildTwoPlayerFront(PlayerType.Bot);
    const attacker = game.player("attacker");
    const defender = game.player("defender");
    defender.addGold(500n);
    defender.addResources(
      { food: 10n, energy: 20n, materials: 30n },
      undefined,
      { updateGold: false },
    );
    const attackerResources = attacker.resources();
    const defenderResources = defender.resources();

    new TerritoryConquestSystem().handleDeadDefender(game, attacker, defender);

    expect(attacker.gold()).toBe(500n);
    expect(attacker.resources()).toEqual({
      food: attackerResources.food + 500n + defenderResources.food,
      energy: attackerResources.energy + 500n + defenderResources.energy,
      materials:
        attackerResources.materials + 500n + defenderResources.materials,
    });
    expect(defender.gold()).toBe(0n);
    expect(defender.resources()).toEqual({
      food: 0n,
      energy: 0n,
      materials: 0n,
    });
    expect(latestUpdates(game)[GameUpdateType.ConquestEvent]).toContainEqual(
      expect.objectContaining({
        conquerorId: attacker.id(),
        conqueredId: defender.id(),
      }),
    );
  });
});

async function buildTwoPlayerFront(defenderType = PlayerType.Human) {
  const game = await setup("big_plains", { instantBuild: true }, [
    new PlayerInfo("attacker", PlayerType.Human, "client-a", "attacker"),
    new PlayerInfo("defender", defenderType, "client-d", "defender"),
  ]);
  const attacker = game.player("attacker");
  const defender = game.player("defender");

  attacker.conquer(game.ref(50, 50));
  defender.conquer(game.ref(51, 50));
  attacker.setTroops(10_000);
  defender.setTroops(8_000);

  return game;
}

function latestUpdates(game: Game) {
  return (game as unknown as { updates: GameUpdates }).updates;
}

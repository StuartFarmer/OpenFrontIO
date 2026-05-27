import { describe, test } from "vitest";
import { AttackExecution } from "../../../src/core/execution/AttackExecution";
import { PlayerExecution } from "../../../src/core/execution/PlayerExecution";
import { PlayerInfo, PlayerType, UnitType } from "../../../src/core/game/Game";
import {
  expectParity,
  runParityScenario,
} from "../../util/parity/ParityRunner";
import { setup } from "../../util/Setup";

describe("systems parity legacy fixtures", () => {
  test("parity_legacy_economy_fixture", async () => {
    const expected = await buildEconomyGame();
    const actual = await buildEconomyGame();

    expectParity(
      runParityScenario(
        { label: "legacy", game: expected },
        { label: "systems", game: actual },
        { ticks: 3, captureUpdates: true },
      ),
    );
  });

  test("parity_legacy_attack_fixture", async () => {
    const expected = await buildAttackGame();
    const actual = await buildAttackGame();

    expectParity(
      runParityScenario(
        { label: "legacy", game: expected },
        { label: "systems", game: actual },
        { ticks: 4, captureUpdates: true },
      ),
    );
  });

  test("parity_legacy_counterattack_fixture", async () => {
    const expected = await buildCounterattackGame();
    const actual = await buildCounterattackGame();

    expectParity(
      runParityScenario(
        { label: "legacy", game: expected },
        { label: "systems", game: actual },
        { ticks: 2, captureUpdates: true },
      ),
    );
  });

  test("parity_legacy_conquest_fixture", async () => {
    const expected = await buildConquestGame();
    const actual = await buildConquestGame();

    expectParity(
      runParityScenario(
        { label: "legacy", game: expected },
        { label: "systems", game: actual },
        { ticks: 5, captureUpdates: true },
      ),
    );
  });

  test("parity_legacy_unit_fixture", async () => {
    const expected = await buildUnitGame();
    const actual = await buildUnitGame();

    expectParity(
      runParityScenario(
        { label: "legacy", game: expected },
        { label: "systems", game: actual },
        { ticks: 1, captureUpdates: true },
      ),
    );
  });
});

async function buildEconomyGame() {
  const game = await setup("big_plains", { instantBuild: true }, [
    new PlayerInfo("player", PlayerType.Human, "client", "player"),
  ]);
  const player = game.player("player");

  player.conquer(game.ref(50, 50));
  player.setTroops(25_000);
  game.addExecution(new PlayerExecution(player));

  return game;
}

async function buildAttackGame() {
  const game = await buildTwoPlayerFront();
  const attacker = game.player("attacker");
  const defender = game.player("defender");

  game.addExecution(new AttackExecution(1_000, attacker, defender.id()));

  return game;
}

async function buildCounterattackGame() {
  const game = await buildTwoPlayerFront();
  const attacker = game.player("attacker");
  const defender = game.player("defender");

  game.addExecution(
    new AttackExecution(1_000, attacker, defender.id()),
    new AttackExecution(600, defender, attacker.id()),
  );

  return game;
}

async function buildConquestGame() {
  const game = await buildTwoPlayerFront();
  const attacker = game.player("attacker");
  const defender = game.player("defender");

  attacker.setTroops(100_000);
  defender.setTroops(100);
  game.addExecution(new AttackExecution(50_000, attacker, defender.id()));

  return game;
}

async function buildUnitGame() {
  const game = await setup("big_plains", { instantBuild: true }, [
    new PlayerInfo("player", PlayerType.Human, "client", "player"),
  ]);
  const player = game.player("player");
  const tile = game.ref(50, 50);

  player.conquer(tile);
  player.setTroops(10_000);
  player.buildUnit(UnitType.City, tile, {});

  return game;
}

async function buildTwoPlayerFront() {
  const game = await setup("big_plains", { instantBuild: true }, [
    new PlayerInfo("attacker", PlayerType.Human, "client-a", "attacker"),
    new PlayerInfo("defender", PlayerType.Human, "client-d", "defender"),
  ]);
  const attacker = game.player("attacker");
  const defender = game.player("defender");

  attacker.conquer(game.ref(50, 50));
  defender.conquer(game.ref(51, 50));
  attacker.setTroops(10_000);
  defender.setTroops(8_000);

  return game;
}

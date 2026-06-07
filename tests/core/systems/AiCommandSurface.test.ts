import { describe, expect, test } from "vitest";
import { AttackExecution } from "../../../src/core/execution/AttackExecution";
import { ConstructionExecution } from "../../../src/core/execution/ConstructionExecution";
import { PlayerInfo, PlayerType, UnitType } from "../../../src/core/game/Game";
import { AiCommandSurface } from "../../../src/games/openfront/systems/commands/AiCommandSurface";
import {
  expectParity,
  runParityScenario,
} from "../../util/parity/ParityRunner";
import { setup } from "../../util/Setup";

describe("AiCommandSurface", () => {
  test("ai_command_migration_preserves_attack_timing", async () => {
    const game = await buildTwoPlayerFront();
    const attacker = game.player("attacker");
    const defender = game.player("defender");

    new AiCommandSurface(game).sendAttack(attacker, 1_000, defender.id());

    expect(attacker.outgoingAttacks()).toHaveLength(0);

    game.executeNextTick();

    expect(attacker.outgoingAttacks()).toHaveLength(1);
    expect(attacker.outgoingAttacks()[0].target()).toBe(defender);
  });

  test("ai_command_surface_attack_matches_legacy_execution", async () => {
    const expected = await buildTwoPlayerFront();
    const actual = await buildTwoPlayerFront();

    expected.addExecution(
      new AttackExecution(
        1_000,
        expected.player("attacker"),
        expected.player("defender").id(),
      ),
    );
    new AiCommandSurface(actual).sendAttack(
      actual.player("attacker"),
      1_000,
      actual.player("defender").id(),
    );

    expectParity(
      runParityScenario(
        { label: "legacy", game: expected },
        { label: "surface", game: actual },
        { ticks: 4, captureUpdates: true },
      ),
    );
  });

  test("nation_command_migration_preserves_structure_actions", async () => {
    const expected = await buildNationStructureGame();
    const actual = await buildNationStructureGame();

    const expectedNation = expected.player("nation");
    const actualNation = actual.player("nation");
    const tile = expected.ref(50, 50);

    expected.addExecution(
      new ConstructionExecution(expectedNation, UnitType.City, tile),
    );
    new AiCommandSurface(actual).buildUnit(
      actualNation,
      UnitType.City,
      actual.ref(50, 50),
    );

    expectParity(
      runParityScenario(
        { label: "legacy", game: expected },
        { label: "surface", game: actual },
        { ticks: 4, captureUpdates: true },
      ),
    );
  });
});

async function buildTwoPlayerFront() {
  const game = await setup("big_plains", { instantBuild: true }, [
    new PlayerInfo("attacker", PlayerType.Bot, "client-a", "attacker"),
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

async function buildNationStructureGame() {
  const game = await setup("big_plains", { infiniteGold: true }, [
    new PlayerInfo("nation", PlayerType.Nation, "client", "nation"),
  ]);
  const nation = game.player("nation");
  nation.conquer(game.ref(50, 50));
  nation.setTroops(10_000);

  return game;
}

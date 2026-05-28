import { describe, test } from "vitest";
import { AttackExecution } from "../../../src/core/execution/AttackExecution";
import { ConstructionExecution } from "../../../src/core/execution/ConstructionExecution";
import { MoveWarshipExecution } from "../../../src/core/execution/MoveWarshipExecution";
import { NukeExecution } from "../../../src/core/execution/NukeExecution";
import { PlayerExecution } from "../../../src/core/execution/PlayerExecution";
import { WarshipExecution } from "../../../src/core/execution/WarshipExecution";
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

  test("attack_parity_terra_nullius", async () => {
    const expected = await buildTerraNulliusAttackGame();
    const actual = await buildTerraNulliusAttackGame();

    expectParity(
      runParityScenario(
        { label: "legacy", game: expected },
        { label: "systems", game: actual },
        { ticks: 4, captureUpdates: true },
      ),
    );
  });

  test("attack_parity_retreat", async () => {
    const expected = await buildRetreatGame();
    const actual = await buildRetreatGame();

    expectParity(
      runParityScenario(
        { label: "legacy", game: expected },
        { label: "systems", game: actual },
        { ticks: 2, captureUpdates: true },
      ),
    );
  });

  test("attack_parity_bot_target", async () => {
    const expected = await buildTypedTargetAttackGame(PlayerType.Bot);
    const actual = await buildTypedTargetAttackGame(PlayerType.Bot);

    expectParity(
      runParityScenario(
        { label: "legacy", game: expected },
        { label: "systems", game: actual },
        { ticks: 4, captureUpdates: true },
      ),
    );
  });

  test("attack_parity_nation_target", async () => {
    const expected = await buildTypedTargetAttackGame(PlayerType.Nation);
    const actual = await buildTypedTargetAttackGame(PlayerType.Nation);

    expectParity(
      runParityScenario(
        { label: "legacy", game: expected },
        { label: "systems", game: actual },
        { ticks: 4, captureUpdates: true },
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

  test("unit_parity_structure_lifecycle", async () => {
    const expected = await buildStructureLifecycleGame();
    const actual = await buildStructureLifecycleGame();

    expectParity(
      runParityScenario(
        { label: "legacy", game: expected },
        { label: "systems", game: actual },
        { ticks: 6, captureUpdates: true },
      ),
    );
  });

  test("unit_parity_mobile_lifecycle", async () => {
    const expected = await buildMobileLifecycleGame();
    const actual = await buildMobileLifecycleGame();

    expectParity(
      runParityScenario(
        { label: "legacy", game: expected },
        { label: "systems", game: actual },
        { ticks: 6, captureUpdates: true },
      ),
    );
  });

  test("unit_parity_projectile_lifecycle", async () => {
    const expected = await buildProjectileLifecycleGame();
    const actual = await buildProjectileLifecycleGame();

    expectParity(
      runParityScenario(
        { label: "legacy", game: expected },
        { label: "systems", game: actual },
        { ticks: 8, captureUpdates: true },
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

async function buildTerraNulliusAttackGame() {
  const game = await setup("big_plains", { instantBuild: true }, [
    new PlayerInfo("attacker", PlayerType.Human, "client-a", "attacker"),
  ]);
  const attacker = game.player("attacker");

  attacker.conquer(game.ref(50, 50));
  attacker.setTroops(10_000);
  game.addExecution(
    new AttackExecution(1_000, attacker, game.terraNullius().id()),
  );

  return game;
}

async function buildRetreatGame() {
  const game = await buildTwoPlayerFront();
  const attacker = game.player("attacker");
  const defender = game.player("defender");

  game.addExecution(new AttackExecution(1_000, attacker, defender.id()));
  game.executeNextTick();
  attacker.outgoingAttacks()[0].orderRetreat();
  attacker.outgoingAttacks()[0].executeRetreat();

  return game;
}

async function buildTypedTargetAttackGame(targetType: PlayerType) {
  const game = await setup("big_plains", { instantBuild: true }, [
    new PlayerInfo("attacker", PlayerType.Human, "client-a", "attacker"),
    new PlayerInfo("defender", targetType, "client-d", "defender"),
  ]);
  const attacker = game.player("attacker");
  const defender = game.player("defender");

  attacker.conquer(game.ref(50, 50));
  defender.conquer(game.ref(51, 50));
  attacker.setTroops(10_000);
  defender.setTroops(8_000);
  game.addExecution(new AttackExecution(1_000, attacker, defender.id()));

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

async function buildStructureLifecycleGame() {
  const game = await setup("big_plains", { infiniteGold: true }, [
    new PlayerInfo("builder", PlayerType.Human, "client", "builder"),
  ]);
  const player = game.player("builder");
  const cityTile = game.ref(50, 50);
  const siloTile = game.ref(70, 50);

  player.conquer(cityTile);
  player.conquer(siloTile);
  game.addExecution(
    new ConstructionExecution(player, UnitType.City, cityTile),
    new ConstructionExecution(player, UnitType.MissileSilo, siloTile),
  );

  return game;
}

async function buildMobileLifecycleGame() {
  const game = await setup(
    "half_land_half_ocean",
    { infiniteGold: true, instantBuild: true },
    [new PlayerInfo("fleet", PlayerType.Human, "client", "fleet")],
  );
  const player = game.player("fleet");
  const start = game.ref(8, 10);
  const patrol = game.ref(11, 15);
  const warship = player.buildUnit(UnitType.Warship, start, {
    patrolTile: start,
  });

  game.addExecution(new WarshipExecution(warship));
  game.addExecution(new MoveWarshipExecution(player, [warship.id()], patrol));

  return game;
}

async function buildProjectileLifecycleGame() {
  const game = await setup("big_plains", { infiniteGold: true }, [
    new PlayerInfo("launcher", PlayerType.Human, "client", "launcher"),
    new PlayerInfo("target", PlayerType.Human, "target-client", "target"),
  ]);
  const launcher = game.player("launcher");
  const target = game.player("target");
  const siloTile = game.ref(50, 50);
  const targetTile = game.ref(55, 50);

  launcher.conquer(siloTile);
  target.conquer(targetTile);
  launcher.buildUnit(UnitType.MissileSilo, siloTile, {});
  target.buildUnit(UnitType.City, targetTile, {});
  game.addExecution(
    new NukeExecution(UnitType.AtomBomb, launcher, targetTile, null, 50),
  );

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

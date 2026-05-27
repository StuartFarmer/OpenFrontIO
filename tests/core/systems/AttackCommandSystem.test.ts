import { describe, expect, test } from "vitest";
import { AttackExecution } from "../../../src/core/execution/AttackExecution";
import {
  Attack,
  Game,
  Player,
  PlayerInfo,
  PlayerType,
  TerraNullius,
} from "../../../src/core/game/Game";
import { TileRef } from "../../../src/core/game/GameMap";
import { AttackCommandSystem } from "../../../src/core/systems/gameplay/AttackCommandSystem";
import { captureParitySnapshot } from "../../util/parity/ParitySnapshot";
import { setup } from "../../util/Setup";

describe("AttackCommandSystem", () => {
  test("attack_command_preserves_startup_side_effects", async () => {
    const expected = await buildTwoPlayerFront();
    const actual = await buildTwoPlayerFront();

    const expectedAttacker = expected.player("attacker");
    const expectedDefender = expected.player("defender");
    expected.addExecution(
      new AttackExecution(1_000, expectedAttacker, expectedDefender.id()),
    );
    expected.executeNextTick();

    const actualAttacker = actual.player("attacker");
    const actualDefender = actual.player("defender");
    startAttackDirectly(actual, actualAttacker, actualDefender, 1_000);

    expect(normalizedSnapshot(actual)).toEqual(normalizedSnapshot(expected));
    expect(actualAttacker.troops()).toBe(expectedAttacker.troops());
    expect(actualDefender.incomingAttacks()[0].troops()).toBe(1_000);
  });

  test("attack_command_preserves_counterattack_cancel", async () => {
    const expected = await buildTwoPlayerFront();
    const actual = await buildTwoPlayerFront();

    const expectedAttacker = expected.player("attacker");
    const expectedDefender = expected.player("defender");
    expected.addExecution(
      new AttackExecution(1_000, expectedAttacker, expectedDefender.id()),
      new AttackExecution(600, expectedDefender, expectedAttacker.id()),
    );
    expected.executeNextTick();

    const actualAttacker = actual.player("attacker");
    const actualDefender = actual.player("defender");
    startAttackDirectly(actual, actualAttacker, actualDefender, 1_000);
    startAttackDirectly(actual, actualDefender, actualAttacker, 600);

    expect(normalizedSnapshot(actual)).toEqual(normalizedSnapshot(expected));
    expect(actualAttacker.outgoingAttacks()).toHaveLength(1);
    expect(actualAttacker.outgoingAttacks()[0].troops()).toBe(400);
    expect(actualDefender.outgoingAttacks()).toHaveLength(0);
  });
});

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

function startAttackDirectly(
  game: Game,
  owner: Player,
  target: Player,
  startTroops: number,
) {
  const system = new AttackCommandSystem();
  system.startAttack(game, {
    startTroops,
    owner,
    targetID: target.id(),
    sourceTile: null,
    removeTroops: true,
    initializeFrontier: (attack, resolvedTarget) => {
      initializeAttackBorder(game, attack, owner, resolvedTarget, null);
    },
  });
}

function initializeAttackBorder(
  game: Game,
  attack: Attack,
  owner: Player,
  target: Player | TerraNullius,
  sourceTile: TileRef | null,
) {
  attack.clearBorder();
  if (sourceTile !== null) {
    addNeighbors(game, attack, target, sourceTile);
    return;
  }
  for (const tile of owner.borderTiles()) {
    addNeighbors(game, attack, target, tile);
  }
}

function addNeighbors(
  game: Game,
  attack: Attack,
  target: Player | TerraNullius,
  tile: TileRef,
) {
  game.forEachNeighbor(tile, (neighbor) => {
    if (game.isWater(neighbor) || game.owner(neighbor) !== target) {
      return;
    }
    attack.addBorderTile(neighbor);
  });
}

function normalizedSnapshot(game: Game) {
  const snapshot = captureParitySnapshot(game);
  return {
    players: snapshot.players,
    attacks: snapshot.attacks,
    hash: snapshot.hash,
  };
}

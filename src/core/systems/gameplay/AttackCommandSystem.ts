import {
  Attack,
  Difficulty,
  Game,
  Player,
  PlayerID,
  PlayerType,
  TerraNullius,
} from "../../game/Game";
import { TileRef } from "../../game/GameMap";
import { assertNever } from "../../Util";

export interface AttackCommand {
  startTroops: number | null;
  owner: Player;
  targetID: PlayerID | null;
  sourceTile: TileRef | null;
  removeTroops: boolean;
  initializeFrontier: (attack: Attack, target: Player | TerraNullius) => void;
}

export interface AttackCommandResult {
  active: boolean;
  attack: Attack | null;
  target: Player | TerraNullius | null;
  startTroops: number | null;
}

export class AttackCommandSystem {
  startAttack(game: Game, command: AttackCommand): AttackCommandResult {
    const { owner, targetID, sourceTile, removeTroops } = command;
    let startTroops = command.startTroops;

    if (targetID !== null && !game.hasPlayer(targetID)) {
      console.warn(`target ${targetID} not found`);
      return this.inactive(null, startTroops);
    }

    const target =
      targetID === game.terraNullius().id()
        ? game.terraNullius()
        : game.player(targetID);

    if (owner === target) {
      console.error(`Player ${owner} cannot attack itself`);
      return this.inactive(target, startTroops);
    }

    if (target.isPlayer()) {
      const targetPlayer = target as Player;
      if (owner.isFriendly(targetPlayer)) {
        console.warn(
          `${owner.displayName()} cannot attack ${targetPlayer.displayName()} because they are friendly (allied or same team)`,
        );
        return this.inactive(target, startTroops);
      }
    }

    if (target.isPlayer()) {
      const targetPlayer = target as Player;
      if (
        targetPlayer.type() !== PlayerType.Bot &&
        owner.type() !== PlayerType.Bot
      ) {
        targetPlayer.addEmbargo(owner, true);
        this.rejectIncomingAllianceRequests(owner, targetPlayer);
      }
    }

    if (target.isPlayer() && !owner.canAttackPlayer(target)) {
      return this.inactive(target, startTroops);
    }

    startTroops ??= game.config().attackAmount(owner, target);
    if (removeTroops) {
      startTroops = Math.min(owner.troops(), startTroops);
      owner.removeTroops(startTroops);
    }

    const attack = owner.createAttack(
      target,
      startTroops,
      sourceTile,
      new Set<TileRef>(),
    );

    command.initializeFrontier(attack, target);

    game.stats().attack(owner, target, startTroops);

    for (const incoming of owner.incomingAttacks()) {
      if (incoming.attacker() === target) {
        if (incoming.troops() > attack.troops()) {
          incoming.setTroops(incoming.troops() - attack.troops());
          attack.delete();
          return {
            active: false,
            attack,
            target,
            startTroops,
          };
        } else {
          attack.setTroops(attack.troops() - incoming.troops());
          incoming.delete();
        }
      }
    }

    for (const outgoing of owner.outgoingAttacks()) {
      if (
        outgoing !== attack &&
        outgoing.target() === attack.target() &&
        attack.sourceTile() === null
      ) {
        attack.setTroops(attack.troops() + outgoing.troops());
        outgoing.delete();
      }
    }

    if (target.isPlayer()) {
      target.updateRelation(owner, this.relationChange(game));
    }

    return {
      active: true,
      attack,
      target,
      startTroops,
    };
  }

  private inactive(
    target: Player | TerraNullius | null,
    startTroops: number | null,
  ): AttackCommandResult {
    return {
      active: false,
      attack: null,
      target,
      startTroops,
    };
  }

  private rejectIncomingAllianceRequests(owner: Player, target: Player) {
    const request = owner
      .incomingAllianceRequests()
      .find((ar) => ar.requestor() === target);
    if (request !== undefined) {
      request.reject();
    }
  }

  private relationChange(game: Game): number {
    const difficulty = game.config().gameConfig().difficulty;
    switch (difficulty) {
      case Difficulty.Easy:
        return -60;
      case Difficulty.Medium:
        return -70;
      case Difficulty.Hard:
        return -80;
      case Difficulty.Impossible:
        return -100;
      default:
        assertNever(difficulty);
    }
  }
}

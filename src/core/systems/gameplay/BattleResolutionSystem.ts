import {
  Attack,
  Game,
  Player,
  TerrainType,
  TerraNullius,
} from "../../game/Game";
import { TileRef } from "../../game/GameMap";

export interface BattleFrontier {
  size(): number;
  dequeue(): [TileRef, number];
}

export interface BattleResolutionContext {
  game: Game;
  owner: Player;
  target: Player | TerraNullius;
  attack: Attack;
  frontier: BattleFrontier;
  randomBorderJitter: () => number;
  refreshFrontier: () => void;
  retreat: (malusPercent?: number) => void;
  deactivate: () => void;
  addNeighbors: (tile: TileRef) => void;
  captureTile: (tile: TileRef) => void;
  handleDeadDefender: () => void;
}

const malusForRetreat = 25;

export class BattleResolutionSystem {
  tickAttack(context: BattleResolutionContext): void {
    const { game, owner, target, attack, frontier } = context;
    let troopCount = attack.troops();
    const targetIsPlayer = target.isPlayer();
    const targetPlayer = targetIsPlayer ? (target as Player) : null;

    if (attack.retreated()) {
      if (targetIsPlayer) {
        context.retreat(malusForRetreat);
      } else {
        context.retreat();
      }
      context.deactivate();
      return;
    }

    if (attack.retreating()) {
      return;
    }

    if (!attack.isActive()) {
      context.deactivate();
      return;
    }

    if (targetPlayer && owner.isFriendly(targetPlayer)) {
      context.retreat();
      return;
    }

    let numTilesPerTick = game
      .config()
      .attackTilesPerTick(
        troopCount,
        owner,
        target,
        attack.borderSize() + context.randomBorderJitter(),
      );

    while (numTilesPerTick > 0) {
      if (troopCount < 1) {
        attack.delete();
        context.deactivate();
        return;
      }

      if (frontier.size() === 0) {
        context.refreshFrontier();
        context.retreat();
        return;
      }

      const [tileToConquer] = frontier.dequeue();
      attack.removeBorderTile(tileToConquer);

      if (!this.isAttackableBorderTile(game, owner, target, tileToConquer)) {
        continue;
      }
      if (!game.isLand(tileToConquer)) {
        continue;
      }

      context.addNeighbors(tileToConquer);
      const { attackerTroopLoss, defenderTroopLoss, tilesPerTickUsed } = game
        .config()
        .attackLogic(game, troopCount, owner, target, tileToConquer);
      numTilesPerTick -= tilesPerTickUsed;
      troopCount -= attackerTroopLoss;
      attack.setTroops(troopCount);
      if (targetPlayer) {
        targetPlayer.removeTroops(defenderTroopLoss);
      }
      context.captureTile(tileToConquer);
      context.handleDeadDefender();
    }
  }

  private isAttackableBorderTile(
    game: Game,
    owner: Player,
    target: Player | TerraNullius,
    tile: TileRef,
  ): boolean {
    let onBorder = false;
    game.forEachNeighbor(tile, (neighbor) => {
      if (!onBorder && game.owner(neighbor) === owner) {
        onBorder = true;
      }
    });
    return game.owner(tile) === target && onBorder;
  }
}

export function terrainPriorityMagnitude(terrain: TerrainType): number {
  switch (terrain) {
    case TerrainType.Plains:
      return 1;
    case TerrainType.Highland:
      return 1.5;
    case TerrainType.Mountain:
      return 2;
    default:
      return 0;
  }
}

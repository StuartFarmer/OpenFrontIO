import { Game, Player, TerraNullius } from "../../../../core/game/Game";
import { TileRef } from "../../../../core/game/GameMap";

export interface AttackTileCapture {
  game: Game;
  attacker: Player;
  target: Player | TerraNullius;
  tile: TileRef;
}

export class TerritoryConquestSystem {
  captureAttackTile(capture: AttackTileCapture): void {
    capture.attacker.conquer(capture.tile);
  }

  handleDeadDefender(
    game: Game,
    attacker: Player,
    target: Player | TerraNullius,
  ): void {
    if (!(target.isPlayer() && target.numTilesOwned() < 100)) return;

    game.conquerPlayer(attacker, target);

    for (let i = 0; i < 10; i++) {
      for (const tile of target.tiles()) {
        let borders = false;
        game.forEachNeighbor(tile, (neighbor) => {
          if (!borders && game.owner(neighbor) === attacker) {
            borders = true;
          }
        });
        if (borders) {
          attacker.conquer(tile);
        } else {
          let captured = false;
          game.forEachNeighbor(tile, (neighbor) => {
            if (captured) return;
            const neighborOwner = game.owner(neighbor);
            if (
              neighborOwner.isPlayer() &&
              neighborOwner !== target &&
              !neighborOwner.isFriendly(target)
            ) {
              game.player(neighborOwner.id()).conquer(tile);
              captured = true;
            }
          });
        }
      }
    }
  }
}

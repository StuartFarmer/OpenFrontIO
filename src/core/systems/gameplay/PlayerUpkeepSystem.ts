import {
  Cell,
  Game,
  Player,
  Structures,
  Tick,
  UnitType,
} from "../../game/Game";
import { TileRef } from "../../game/GameMap";
import {
  calculateBoundingBox,
  getMode,
  inscribed,
  simpleHash,
} from "../../Util";

interface ClusterTraversalState {
  visited: Uint32Array;
  gen: number;
}

export interface PlayerUpkeepState {
  lastClusterCalculationTick: number;
}

export interface PlayerUpkeepResult {
  readonly active: boolean;
  readonly state: PlayerUpkeepState;
}

const ticksPerClusterCalculation = 20;
const traversalStates = new WeakMap<Game, ClusterTraversalState>();

export class PlayerUpkeepSystem {
  initializePlayer(player: Player, ticks: Tick): PlayerUpkeepState {
    return {
      lastClusterCalculationTick:
        ticks + (simpleHash(player.name()) % ticksPerClusterCalculation),
    };
  }

  tickPlayer(
    game: Game,
    player: Player,
    state: PlayerUpkeepState,
    ticks: Tick,
  ): PlayerUpkeepResult {
    player.decayRelations();
    this.transferCapturedStructures(game, player);

    if (!player.isAlive()) {
      this.removeOnDeath(player);
      game.stats().playerKilled(player, ticks);
      return { active: false, state };
    }

    this.expireAlliances(game, player);
    this.expireTemporaryEmbargoes(game, player);

    const nextState = this.maybeRemoveClusters(game, player, state, ticks);
    return { active: true, state: nextState };
  }

  private transferCapturedStructures(game: Game, player: Player): void {
    for (const unit of player.units()) {
      if (!Structures.has(unit.type())) {
        continue;
      }

      const owner = game.owner(unit.tile());
      if (!owner?.isPlayer()) {
        unit.delete();
        continue;
      }
      if (owner === player) {
        continue;
      }

      const captor = game.player(owner.id());
      if (unit.type() === UnitType.DefensePost) {
        unit.decreaseLevel(captor);
        if (unit.isActive()) {
          captor.captureUnit(unit);
        }
      } else {
        captor.captureUnit(unit);
      }
    }
  }

  private expireAlliances(game: Game, player: Player): void {
    for (const alliance of player.alliances()) {
      if (alliance.expiresAt() <= game.ticks()) {
        alliance.expire();
      }
    }
  }

  private expireTemporaryEmbargoes(game: Game, player: Player): void {
    for (const embargo of player.getEmbargoes()) {
      if (
        embargo.isTemporary &&
        game.ticks() - embargo.createdAt >
          game.config().temporaryEmbargoDuration()
      ) {
        player.stopEmbargo(embargo.target);
      }
    }
  }

  private maybeRemoveClusters(
    game: Game,
    player: Player,
    state: PlayerUpkeepState,
    ticks: Tick,
  ): PlayerUpkeepState {
    if (
      ticks - state.lastClusterCalculationTick <= ticksPerClusterCalculation &&
      player.numTilesOwned() >= 100
    ) {
      return state;
    }
    if (player.lastTileChange() < state.lastClusterCalculationTick) {
      return state;
    }

    const nextState = {
      lastClusterCalculationTick: ticks,
    };
    const start = performance.now();
    this.removeClusters(game, player);
    const end = performance.now();
    if (end - start > 1000) {
      console.log(`player ${player.name()}, took ${end - start}ms`);
    }
    return nextState;
  }

  private removeClusters(game: Game, player: Player): void {
    const clusters = this.calculateClusters(game, player);

    if (clusters.length === 0) {
      player.largestClusterBoundingBox = null;
      return;
    }

    let largestIndex = 0;
    let largestSize = clusters[0].size;
    for (let i = 1; i < clusters.length; i++) {
      const size = clusters[i].size;
      if (size > largestSize) {
        largestSize = size;
        largestIndex = i;
      }
    }

    const largestCluster = clusters[largestIndex];
    if (largestCluster === undefined) throw new Error("No clusters");

    const largestClusterBox = calculateBoundingBox(game, largestCluster);
    player.largestClusterBoundingBox = largestClusterBox;
    const surroundedBy = this.surroundedBySamePlayer(
      game,
      player,
      largestCluster,
      largestClusterBox,
    );
    if (surroundedBy && !surroundedBy.isFriendly(player)) {
      this.removeCluster(game, player, largestCluster);
    }

    for (let i = 0; i < clusters.length; i++) {
      if (i === largestIndex) continue;
      const cluster = clusters[i];
      if (this.isSurrounded(game, player, cluster)) {
        this.removeCluster(game, player, cluster);
      }
    }
  }

  private surroundedBySamePlayer(
    game: Game,
    player: Player,
    cluster: Set<TileRef>,
    clusterBox: { min: Cell; max: Cell },
  ): false | Player {
    const enemies = new Set<number>();

    let minX = Infinity,
      minY = Infinity,
      maxX = -Infinity,
      maxY = -Infinity;

    for (const tile of cluster) {
      let hasUnownedNeighbor = false;
      if (game.isOceanShore(tile) || game.isOnEdgeOfMap(tile)) {
        return false;
      }
      game.forEachNeighbor(tile, (neighbor) => {
        if (!game.hasOwner(neighbor)) {
          hasUnownedNeighbor = true;
          return;
        }
        const ownerId = game.ownerID(neighbor);
        if (ownerId !== player.smallID()) {
          enemies.add(ownerId);
          const px = game.x(neighbor);
          const py = game.y(neighbor);
          minX = Math.min(minX, px);
          minY = Math.min(minY, py);
          maxX = Math.max(maxX, px);
          maxY = Math.max(maxY, py);
        }
      });
      if (hasUnownedNeighbor) {
        return false;
      }
      if (enemies.size !== 1) {
        return false;
      }
    }
    if (enemies.size !== 1) {
      return false;
    }

    const enemy = game.playerBySmallID(Array.from(enemies)[0]) as Player;
    const localEnemyBox = {
      min: new Cell(minX, minY),
      max: new Cell(maxX, maxY),
    };
    if (inscribed(localEnemyBox, clusterBox)) {
      return enemy;
    }
    return false;
  }

  private isSurrounded(
    game: Game,
    player: Player,
    cluster: Set<TileRef>,
  ): boolean {
    let hasEnemy = false;
    let minX = Infinity,
      minY = Infinity,
      maxX = -Infinity,
      maxY = -Infinity;
    for (const tile of cluster) {
      if (game.isShore(tile) || game.isOnEdgeOfMap(tile)) {
        return false;
      }
      game.forEachNeighbor(tile, (neighbor) => {
        const owner = game.owner(neighbor);
        if (owner.isPlayer() && game.ownerID(neighbor) !== player.smallID()) {
          hasEnemy = true;
          const x = game.x(neighbor);
          const y = game.y(neighbor);
          minX = Math.min(minX, x);
          minY = Math.min(minY, y);
          maxX = Math.max(maxX, x);
          maxY = Math.max(maxY, y);
        }
      });
    }
    if (!hasEnemy) {
      return false;
    }
    const clusterBox = calculateBoundingBox(game, cluster);
    const enemyBox = { min: new Cell(minX, minY), max: new Cell(maxX, maxY) };
    return inscribed(enemyBox, clusterBox);
  }

  private removeCluster(
    game: Game,
    player: Player,
    cluster: Set<TileRef>,
  ): void {
    for (const tile of cluster) {
      if (game?.ownerID(tile) !== player?.smallID()) {
        return;
      }
    }

    const capturing = this.getCapturingPlayer(game, player, cluster);
    if (capturing === null) {
      return;
    }

    const firstTile = cluster.values().next().value;
    if (!firstTile) {
      return;
    }

    const tiles = this.floodFillWithGen(
      game,
      this.bumpGeneration(game),
      this.traversalState(game).visited,
      [firstTile],
      (tile, cb) => game.forEachNeighbor(tile, cb),
      (tile) => game.ownerID(tile) === player.smallID(),
    );

    if (player.numTilesOwned() === tiles.size) {
      game.conquerPlayer(capturing, player);
    }

    for (const tile of tiles) {
      capturing.conquer(tile);
    }
  }

  private getCapturingPlayer(
    game: Game,
    player: Player,
    cluster: Set<TileRef>,
  ): Player | null {
    const neighbors = new Map<Player, number>();
    for (const tile of cluster) {
      game.forEachNeighbor(tile, (neighbor) => {
        const owner = game.owner(neighbor);
        if (owner.isPlayer() && owner !== player && !owner.isFriendly(player)) {
          neighbors.set(owner, (neighbors.get(owner) ?? 0) + 1);
        }
      });
    }

    if (neighbors.size === 0) {
      return null;
    }

    let largestNeighborAttack: Player | null = null;
    let largestTroopCount = 0;
    for (const [neighbor] of neighbors) {
      for (const attack of neighbor.outgoingAttacks()) {
        if (attack.target() === player) {
          if (attack.troops() > largestTroopCount) {
            largestTroopCount = attack.troops();
            largestNeighborAttack = neighbor;
          }
        }
      }
    }

    if (largestNeighborAttack !== null) {
      return largestNeighborAttack;
    }

    return getMode(neighbors);
  }

  private calculateClusters(game: Game, player: Player): Set<TileRef>[] {
    const borderTiles = player.borderTiles();
    if (borderTiles.size === 0) return [];

    const state = this.traversalState(game);
    const currentGen = this.bumpGeneration(game);
    const visited = state.visited;

    const clusters: Set<TileRef>[] = [];

    for (const startTile of borderTiles) {
      if (visited[startTile] === currentGen) continue;

      const cluster = this.floodFillWithGen(
        game,
        currentGen,
        visited,
        [startTile],
        (tile, cb) => game.forEachNeighborWithDiag(tile, cb),
        (tile) => borderTiles.has(tile),
      );
      clusters.push(cluster);
    }
    return clusters;
  }

  private traversalState(game: Game): ClusterTraversalState {
    const totalTiles = game.width() * game.height();
    let state = traversalStates.get(game);
    if (!state || state.visited.length < totalTiles) {
      state = {
        visited: new Uint32Array(totalTiles),
        gen: 0,
      };
      traversalStates.set(game, state);
    }
    return state;
  }

  private bumpGeneration(game: Game): number {
    const state = this.traversalState(game);
    state.gen++;
    if (state.gen === 0xffffffff) {
      state.visited.fill(0);
      state.gen = 1;
    }
    return state.gen;
  }

  private floodFillWithGen(
    game: Game,
    currentGen: number,
    visited: Uint32Array,
    startTiles: TileRef[],
    neighborFn: (tile: TileRef, callback: (neighbor: TileRef) => void) => void,
    includeFn: (tile: TileRef) => boolean,
  ): Set<TileRef> {
    const result = new Set<TileRef>();
    const stack: TileRef[] = [];

    for (const start of startTiles) {
      if (visited[start] === currentGen) continue;
      if (!includeFn(start)) continue;
      visited[start] = currentGen;
      result.add(start);
      stack.push(start);
    }

    while (stack.length > 0) {
      const tile = stack.pop()!;
      neighborFn(tile, (neighbor) => {
        if (visited[neighbor] === currentGen) {
          return;
        }
        if (!includeFn(neighbor)) {
          return;
        }
        visited[neighbor] = currentGen;
        result.add(neighbor);
        stack.push(neighbor);
      });
    }

    return result;
  }

  private removeOnDeath(player: Player): void {
    const gold = player.gold();
    player.removeGold(gold);

    player.units().forEach((unit) => {
      if (
        unit.type() !== UnitType.AtomBomb &&
        unit.type() !== UnitType.HydrogenBomb &&
        unit.type() !== UnitType.MIRVWarhead &&
        unit.type() !== UnitType.MIRV
      ) {
        unit.delete();
      }
    });

    player.removeAllAlliances();
  }
}

import seedrandom from "seedrandom";
import { EngineTileMap, TileRef } from "./EngineTileMap";
import { ExplorationAttack } from "./ExplorationAttack";
import { Player } from "./FoundationPlayer";
import { ownerIdFromState, setOwnerId } from "./placePlayer";

const FOUNDATION_WILDERNESS_ATTACK_FRACTION = 1 / 5;
const FOUNDATION_GRASS_ATTACKER_LOSS = 80 / 5;
const FOUNDATION_GRASS_ATTACK_SPEED = 16.5;
const FOUNDATION_WILDERNESS_TILES_PER_TICK_MULTIPLIER = 2;
const FOUNDATION_WILDERNESS_RANDOM_SEED = "123";

export interface StartWildernessExplorationResult {
  player: Player;
  committedTroops: number;
}

export interface StartWildernessExplorationOptions {
  troopRatio?: number;
}

export interface TickWildernessExplorationResult {
  player: Player;
  claimedTiles: TileRef[];
  completed: boolean;
}

export function startWildernessExploration(
  map: EngineTileMap,
  player: Player,
  targetTile: TileRef,
  tick: number,
  options: StartWildernessExplorationOptions = {},
): StartWildernessExplorationResult {
  if (!player.placement) {
    throw new Error("Cannot explore wilderness before player placement");
  }
  if (!map.isValidRef(targetTile)) {
    throw new Error(`Cannot explore toward invalid tile: ${targetTile}`);
  }
  if (ownerIdFromState(map.stateBuffer()[targetTile]) === player.ownerId) {
    throw new Error("Cannot explore an already owned tile");
  }
  const troopRatio = clamp(
    options.troopRatio ?? FOUNDATION_WILDERNESS_ATTACK_FRACTION,
    0,
    1,
  );
  const committedTroops = Math.floor(player.troops * troopRatio);
  if (committedTroops < 1) {
    throw new Error("Not enough troops to explore wilderness");
  }

  const rng = createWildernessRandom(player.activeExploration?.randomState);
  const attack = new ExplorationAttack();
  refreshWildernessFrontier(map, player, attack, rng, tick);
  const attackState = attack.toState();
  const activeTroops = player.activeExploration?.troops ?? 0;

  return {
    player: {
      ...player,
      troops: player.troops - committedTroops,
      activeExploration: {
        id: player.activeExploration?.id ?? `explore-${targetTile}`,
        targetTile,
        troops: activeTroops + committedTroops,
        frontier: attackState.frontier,
        borderTiles: attackState.borderTiles,
        randomState: serializeRandomState(rng),
      },
    },
    committedTroops,
  };
}

export function tickWildernessExploration(
  map: EngineTileMap,
  player: Player,
  tick: number,
): TickWildernessExplorationResult {
  const exploration = player.activeExploration;
  const placement = player.placement;
  if (!exploration || !placement) {
    return { player, claimedTiles: [], completed: false };
  }

  let explorationTroops = exploration.troops;
  const rng = createWildernessRandom(exploration.randomState);
  if (explorationTroops < 1) {
    return {
      player: {
        ...player,
        activeExploration: null,
      },
      claimedTiles: [],
      completed: true,
    };
  }

  const attack = ExplorationAttack.fromExploration(exploration);
  if (attack.frontierSize() === 0) {
    return {
      player: {
        ...player,
        troops: player.troops + explorationTroops,
        activeExploration: null,
      },
      claimedTiles: [],
      completed: true,
    };
  }

  let tileBudget =
    (attack.borderSize() + randomInt(rng, 0, 5)) *
    FOUNDATION_WILDERNESS_TILES_PER_TICK_MULTIPLIER;
  const claimedTiles: TileRef[] = [];
  while (tileBudget > 0) {
    if (tileBudget <= 0 || explorationTroops < 1) {
      break;
    }

    if (attack.frontierSize() === 0) {
      return {
        player: {
          ...player,
          troops: player.troops + explorationTroops,
          activeExploration: null,
        },
        claimedTiles,
        completed: true,
      };
    }

    const [tile] = attack.dequeue();
    attack.removeBorderTile(tile);

    if (!isOwnedBorderNeighbor(map, player.ownerId, tile)) {
      continue;
    }
    if (ownerIdFromState(map.stateBuffer()[tile]) !== 0) {
      continue;
    }

    addWildernessNeighbors(map, player.ownerId, tile, tick, rng, {
      attack,
    });

    const tilesPerTickUsed = wildernessTilesPerTickUsed(explorationTroops);
    tileBudget -= tilesPerTickUsed;
    explorationTroops -= FOUNDATION_GRASS_ATTACKER_LOSS;
    setOwnerId(map.stateBuffer(), tile, player.ownerId);
    claimedTiles.push(tile);
  }

  const nextClaimedTiles = [...placement.claimedTiles, ...claimedTiles];
  const completed = explorationTroops < 1;
  const attackState = attack.toState();

  return {
    player: {
      ...player,
      placement: {
        ...placement,
        claimedTiles: nextClaimedTiles,
        claimedTileCount: nextClaimedTiles.length,
      },
      activeExploration: completed
        ? null
        : {
            ...exploration,
            troops: explorationTroops,
            frontier: attackState.frontier,
            borderTiles: attackState.borderTiles,
            randomState: serializeRandomState(rng),
          },
    },
    claimedTiles,
    completed,
  };
}

function refreshWildernessFrontier(
  map: EngineTileMap,
  player: Player,
  attack: ExplorationAttack,
  rng: StatefulRandom,
  tick: number,
): void {
  attack.clearBorder();
  for (const tile of player.placement?.claimedTiles ?? []) {
    addWildernessNeighbors(map, player.ownerId, tile, tick, rng, {
      attack,
    });
  }
}

function addWildernessNeighbors(
  map: EngineTileMap,
  ownerId: number,
  tile: TileRef,
  tick: number,
  rng: StatefulRandom,
  frontierState: {
    attack: ExplorationAttack;
  },
): void {
  forEachCardinalNeighbor(map, tile, (neighbor) => {
    if (ownerIdFromState(map.stateBuffer()[neighbor]) !== 0) {
      return;
    }

    frontierState.attack.addBorderTile(neighbor);
    let numOwnedByMe = 0;
    forEachCardinalNeighbor(map, neighbor, (candidateNeighbor) => {
      if (ownerIdFromState(map.stateBuffer()[candidateNeighbor]) === ownerId) {
        numOwnedByMe++;
      }
    });

    const plainsMagnitude = 1;
    const priority =
      (randomInt(rng, 0, 7) + 10) *
        (1 - numOwnedByMe * 0.5 + plainsMagnitude / 2) +
      tick;

    frontierState.attack.enqueue(neighbor, priority);
  });
}

function isOwnedBorderNeighbor(
  map: EngineTileMap,
  ownerId: number,
  tile: TileRef,
): boolean {
  let onBorder = false;
  forEachCardinalNeighbor(map, tile, (neighbor) => {
    if (
      !onBorder &&
      ownerIdFromState(map.stateBuffer()[neighbor]) === ownerId
    ) {
      onBorder = true;
    }
  });
  return onBorder;
}

function forEachCardinalNeighbor(
  map: EngineTileMap,
  tile: TileRef,
  callback: (neighbor: TileRef) => void,
): void {
  const x = map.x(tile);
  const y = map.y(tile);
  if (x > 0) callback(map.ref(x - 1, y));
  if (x + 1 < map.width()) callback(map.ref(x + 1, y));
  if (y > 0) callback(map.ref(x, y - 1));
  if (y + 1 < map.height()) callback(map.ref(x, y + 1));
}

function wildernessTilesPerTickUsed(explorationTroops: number): number {
  return clamp(
    (2000 * Math.max(10, FOUNDATION_GRASS_ATTACK_SPEED)) / explorationTroops,
    5,
    100,
  );
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

type StatefulRandom = seedrandom.PRNG & { state(): unknown };

function createWildernessRandom(state?: string): StatefulRandom {
  return (
    state
      ? seedrandom("", { state: JSON.parse(state) })
      : seedrandom(FOUNDATION_WILDERNESS_RANDOM_SEED, { state: true })
  ) as StatefulRandom;
}

function serializeRandomState(rng: StatefulRandom): string {
  return JSON.stringify(rng.state());
}

function randomInt(rng: StatefulRandom, min: number, max: number): number {
  const lo = Math.floor(min);
  const hi = Math.floor(max);
  return Math.floor(rng() * (hi - lo)) + lo;
}

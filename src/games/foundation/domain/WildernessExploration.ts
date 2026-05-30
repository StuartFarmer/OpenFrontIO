import seedrandom from "seedrandom";
import { EngineTileMap, TileRef } from "./EngineTileMap";
import { Player, WildernessFrontierTile } from "./FoundationPlayer";
import { ownerIdFromState, setOwnerId } from "./placePlayer";

const FOUNDATION_WILDERNESS_ATTACK_FRACTION = 1 / 5;
const FOUNDATION_GRASS_ATTACKER_LOSS = 80 / 5;
const FOUNDATION_GRASS_ATTACK_SPEED = 16.5;
const FOUNDATION_WILDERNESS_RANDOM_SEED = "123";

export interface StartWildernessExplorationResult {
  player: Player;
  committedTroops: number;
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
  if (player.activeExploration) {
    throw new Error("Cannot start a second active wilderness exploration");
  }

  const committedTroops = Math.floor(
    player.troops * FOUNDATION_WILDERNESS_ATTACK_FRACTION,
  );
  if (committedTroops < 1) {
    throw new Error("Not enough troops to explore wilderness");
  }

  const rng = createWildernessRandom();
  const frontier = createWildernessFrontier(map, player, rng, tick);

  return {
    player: {
      ...player,
      troops: player.troops - committedTroops,
      activeExploration: {
        id: `explore-${targetTile}`,
        targetTile,
        troops: committedTroops,
        frontier: frontier.frontier,
        borderTiles: frontier.borderTiles,
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

  const frontier = [...exploration.frontier];
  const borderTiles = new Set<TileRef>(exploration.borderTiles);
  if (frontier.length === 0) {
    const refreshed = createWildernessFrontier(map, player, rng, tick);
    return {
      player: {
        ...player,
        troops: player.troops + explorationTroops,
        activeExploration:
          refreshed.frontier.length === 0
            ? null
            : {
                ...exploration,
                frontier: refreshed.frontier,
                borderTiles: refreshed.borderTiles,
                randomState: serializeRandomState(rng),
              },
      },
      claimedTiles: [],
      completed: true,
    };
  }

  let tileBudget = (borderTiles.size + randomInt(rng, 0, 5)) * 2;
  const claimedTiles: TileRef[] = [];
  while (tileBudget > 0) {
    if (tileBudget <= 0 || explorationTroops < 1) {
      break;
    }

    if (frontier.length === 0) {
      const refreshed = createWildernessFrontier(map, player, rng, tick);
      return {
        player: {
          ...player,
          troops: player.troops + explorationTroops,
          activeExploration:
            refreshed.frontier.length === 0
              ? null
              : {
                  ...exploration,
                  frontier: refreshed.frontier,
                  borderTiles: refreshed.borderTiles,
                  randomState: serializeRandomState(rng),
                },
        },
        claimedTiles,
        completed: true,
      };
    }

    const tile = dequeueWildernessFrontier(frontier);
    borderTiles.delete(tile);

    if (!isOwnedBorderNeighbor(map, player.ownerId, tile)) {
      continue;
    }
    if (ownerIdFromState(map.stateBuffer()[tile]) !== 0) {
      continue;
    }

    addWildernessNeighbors(map, player.ownerId, tile, tick, rng, {
      frontier,
      borderTiles,
    });

    const tilesPerTickUsed = wildernessTilesPerTickUsed(explorationTroops);
    tileBudget -= tilesPerTickUsed;
    explorationTroops -= FOUNDATION_GRASS_ATTACKER_LOSS;
    setOwnerId(map.stateBuffer(), tile, player.ownerId);
    claimedTiles.push(tile);
  }

  const nextClaimedTiles = [...placement.claimedTiles, ...claimedTiles];
  const completed = explorationTroops < 1;

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
            frontier,
            borderTiles: Array.from(borderTiles),
            randomState: serializeRandomState(rng),
          },
    },
    claimedTiles,
    completed,
  };
}

function createWildernessFrontier(
  map: EngineTileMap,
  player: Player,
  rng: StatefulRandom,
  tick: number,
): { frontier: WildernessFrontierTile[]; borderTiles: TileRef[] } {
  const frontier: WildernessFrontierTile[] = [];
  const borderTiles = new Set<TileRef>();
  for (const tile of player.placement?.claimedTiles ?? []) {
    addWildernessNeighbors(map, player.ownerId, tile, tick, rng, {
      frontier,
      borderTiles,
    });
  }
  return {
    frontier,
    borderTiles: Array.from(borderTiles),
  };
}

function addWildernessNeighbors(
  map: EngineTileMap,
  ownerId: number,
  tile: TileRef,
  tick: number,
  rng: StatefulRandom,
  frontierState: {
    frontier: WildernessFrontierTile[];
    borderTiles: Set<TileRef>;
  },
): void {
  forEachCardinalNeighbor(map, tile, (neighbor) => {
    if (ownerIdFromState(map.stateBuffer()[neighbor]) !== 0) {
      return;
    }
    if (frontierState.borderTiles.has(neighbor)) {
      return;
    }

    frontierState.borderTiles.add(neighbor);
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

    frontierState.frontier.push({ tile: neighbor, priority });
  });
}

function dequeueWildernessFrontier(
  frontier: WildernessFrontierTile[],
): TileRef {
  let bestIndex = 0;
  let bestPriority = frontier[0].priority;
  for (let i = 1; i < frontier.length; i++) {
    const priority = frontier[i].priority;
    if (priority < bestPriority) {
      bestPriority = priority;
      bestIndex = i;
    }
  }
  const [best] = frontier.splice(bestIndex, 1);
  return best.tile;
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

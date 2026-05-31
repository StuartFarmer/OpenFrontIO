import seedrandom from "seedrandom";
import { EngineTileMap, TileRef } from "./EngineTileMap";
import { ExplorationAttack } from "./ExplorationAttack";
import { Player, WildernessExplorationIntent } from "./FoundationPlayer";
import {
  DEFAULT_FOUNDATION_WILDERNESS_PARAMETERS,
  FoundationWildernessParameters,
} from "./FoundationWildernessParameters";
import { isLandTile, ownerIdFromState, setOwnerId } from "./placePlayer";

const FOUNDATION_WILDERNESS_ATTACK_FRACTION = 1 / 5;
const FOUNDATION_WILDERNESS_RANDOM_SEED = "123";
const DIRECTIONAL_FRONT_PRIORITY_SCALE = 100;
const MIN_DIRECTIONAL_FRONT_SIGMA = 0.01;

export interface StartWildernessExplorationResult {
  player: Player;
  committedTroops: number;
  intent: WildernessExplorationIntent;
}

export interface StartWildernessExplorationOptions {
  troopRatio?: number;
  parameters?: FoundationWildernessRuntimeParameters;
}

export interface TickWildernessExplorationResult {
  player: Player;
  claimedTiles: TileRef[];
  completed: boolean;
}

export type FoundationWildernessRuntimeParameters = Pick<
  FoundationWildernessParameters,
  | "wildernessBaseSpeed"
  | "elevationSlopeScale"
  | "minToblerSpeedMultiplier"
  | "maxToblerSpeedMultiplier"
  | "terrainPriorityElevationScale"
  | "wildernessVectorSharpness"
  | "wildernessFrontCapacity"
  | "wildernessAttackerLossPerTile"
  | "wildernessTilesPerTickMultiplier"
>;

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
  const intent = createWildernessExplorationIntent(map, player, targetTile);

  const rng = createWildernessRandom(player.activeExploration?.randomState);
  const attack = new ExplorationAttack();
  refreshWildernessFrontier(
    map,
    player,
    attack,
    rng,
    tick,
    intent,
    options.parameters,
  );
  const attackState = attack.toState();
  const activeTroops = player.activeExploration?.troops ?? 0;

  return {
    player: {
      ...player,
      troops: player.troops - committedTroops,
      activeExploration: {
        id: player.activeExploration?.id ?? `explore-${targetTile}`,
        targetTile,
        intent,
        troops: activeTroops + committedTroops,
        frontier: attackState.frontier,
        borderTiles: attackState.borderTiles,
        randomState: serializeRandomState(rng),
      },
    },
    committedTroops,
    intent,
  };
}

export function tickWildernessExploration(
  map: EngineTileMap,
  player: Player,
  tick: number,
  parameters: FoundationWildernessRuntimeParameters = DEFAULT_FOUNDATION_WILDERNESS_PARAMETERS,
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
  const frontShares = createDirectionalFrontShareMap(
    map,
    player.ownerId,
    exploration.intent,
    parameters.wildernessVectorSharpness,
  );
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
    parameters.wildernessTilesPerTickMultiplier;
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
    if (!isLandTile(map, tile)) {
      continue;
    }

    addWildernessNeighbors(map, player.ownerId, tile, tick, rng, {
      attack,
      intent: exploration.intent,
      parameters,
      frontShares,
    });

    const tilesPerTickUsed = wildernessTilesPerTickUsed(
      map,
      player.ownerId,
      tile,
      explorationTroops,
      parameters,
    );
    tileBudget -= tilesPerTickUsed;
    explorationTroops -= parameters.wildernessAttackerLossPerTile;
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
  intent: WildernessExplorationIntent,
  parameters: FoundationWildernessRuntimeParameters = DEFAULT_FOUNDATION_WILDERNESS_PARAMETERS,
): void {
  attack.clearBorder();
  const frontShares = createDirectionalFrontShareMap(
    map,
    player.ownerId,
    intent,
    parameters.wildernessVectorSharpness,
  );
  for (const tile of player.placement?.claimedTiles ?? []) {
    addWildernessNeighbors(map, player.ownerId, tile, tick, rng, {
      attack,
      intent,
      parameters,
      frontShares,
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
    intent?: WildernessExplorationIntent;
    parameters?: FoundationWildernessRuntimeParameters;
    frontShares?: ReadonlyMap<TileRef, number>;
  },
): void {
  const sourceShare = directionalFrontShareForTile(
    map,
    ownerId,
    tile,
    frontierState.frontShares,
  );
  forEachCardinalNeighbor(map, tile, (neighbor) => {
    if (!isLandTile(map, neighbor)) {
      return;
    }
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

    const terrainPriorityWeight = wildernessTerrainPriorityWeight(
      map.elevation(neighbor),
      frontierState.parameters,
    );
    const priority =
      (randomInt(rng, 0, 7) + 10) *
        (1 - numOwnedByMe * 0.5 + terrainPriorityWeight / 2) +
      directionalPriorityPenalty(sourceShare) +
      tick;

    frontierState.attack.enqueue(neighbor, priority);
  });
}

function createWildernessExplorationIntent(
  map: EngineTileMap,
  player: Player,
  targetTile: TileRef,
): WildernessExplorationIntent {
  const originTile = closestOwnedBorderTile(map, player, targetTile);
  const rawDx = map.x(targetTile) - map.x(originTile);
  const rawDy = map.y(targetTile) - map.y(originTile);
  const distance = Math.hypot(rawDx, rawDy);
  if (distance === 0) {
    return {
      originTile,
      targetTile,
      dx: 0,
      dy: 0,
      distance: 0,
    };
  }

  return {
    originTile,
    targetTile,
    dx: rawDx / distance,
    dy: rawDy / distance,
    distance,
  };
}

function closestOwnedBorderTile(
  map: EngineTileMap,
  player: Player,
  targetTile: TileRef,
): TileRef {
  const placement = player.placement;
  if (!placement) {
    throw new Error("Cannot explore wilderness before player placement");
  }

  const targetX = map.x(targetTile);
  const targetY = map.y(targetTile);
  let closestTile: TileRef | null = null;
  let closestDistanceSq = Number.POSITIVE_INFINITY;

  for (const tile of placement.claimedTiles) {
    if (!isOwnedBorderTile(map, player.ownerId, tile)) {
      continue;
    }

    const dx = map.x(tile) - targetX;
    const dy = map.y(tile) - targetY;
    const distanceSq = dx * dx + dy * dy;
    if (distanceSq < closestDistanceSq) {
      closestTile = tile;
      closestDistanceSq = distanceSq;
    }
  }

  if (closestTile !== null) {
    return closestTile;
  }

  return placement.selectedTile;
}

function isOwnedBorderTile(
  map: EngineTileMap,
  ownerId: number,
  tile: TileRef,
): boolean {
  if (ownerIdFromState(map.stateBuffer()[tile]) !== ownerId) {
    return false;
  }

  const x = map.x(tile);
  const y = map.y(tile);
  if (x === 0 || y === 0 || x + 1 === map.width() || y + 1 === map.height()) {
    return true;
  }

  let border = false;
  forEachCardinalNeighbor(map, tile, (neighbor) => {
    if (!border && ownerIdFromState(map.stateBuffer()[neighbor]) !== ownerId) {
      border = true;
    }
  });
  return border;
}

function createDirectionalFrontShareMap(
  map: EngineTileMap,
  ownerId: number,
  intent: WildernessExplorationIntent | undefined,
  sigmaScale: number,
): Map<TileRef, number> {
  const shares = new Map<TileRef, number>();
  if (!intent) {
    return shares;
  }

  const borderTiles = new Set<TileRef>();
  for (let tile = 0; tile < map.width() * map.height(); tile += 1) {
    if (isOwnedBorderTile(map, ownerId, tile)) {
      borderTiles.add(tile);
    }
  }
  if (!borderTiles.has(intent.originTile)) {
    borderTiles.add(intent.originTile);
  }
  if (borderTiles.size === 0) {
    return shares;
  }

  const distances = new Map<TileRef, number>();
  const queue: TileRef[] = [intent.originTile];
  distances.set(intent.originTile, 0);

  for (let head = 0; head < queue.length; head += 1) {
    const tile = queue[head];
    const distance = distances.get(tile) ?? 0;
    forEachNeighbor(map, tile, (neighbor) => {
      if (!borderTiles.has(neighbor) || distances.has(neighbor)) {
        return;
      }

      distances.set(neighbor, distance + 1);
      queue.push(neighbor);
    });
  }

  let totalWeight = 0;
  for (const tile of borderTiles) {
    const distance = distances.get(tile);
    const weight =
      distance === undefined ? 0 : directionalFrontWeight(distance, sigmaScale);
    shares.set(tile, weight);
    totalWeight += weight;
  }
  if (totalWeight <= 0) {
    return shares;
  }

  for (const [tile, weight] of shares) {
    shares.set(tile, weight / totalWeight);
  }
  return shares;
}

function directionalPriorityPenalty(sourceShare: number): number {
  return -sourceShare * DIRECTIONAL_FRONT_PRIORITY_SCALE;
}

function directionalFrontShareForTile(
  map: EngineTileMap,
  ownerId: number,
  tile: TileRef,
  frontShares: ReadonlyMap<TileRef, number> | undefined,
): number {
  if (!frontShares || frontShares.size === 0) {
    return 0;
  }

  let share = 0;
  share = Math.max(share, frontShares.get(tile) ?? 0);
  forEachCardinalNeighbor(map, tile, (neighbor) => {
    if (ownerIdFromState(map.stateBuffer()[neighbor]) !== ownerId) {
      return;
    }

    share = Math.max(share, frontShares.get(neighbor) ?? 0);
  });

  return share;
}

export function directionalFrontWeight(
  frontDistance: number,
  sigmaScale: number,
): number {
  if (frontDistance < 0 || sigmaScale <= 0) {
    return 0;
  }

  const sigma = Math.max(MIN_DIRECTIONAL_FRONT_SIGMA, sigmaScale);
  const z = frontDistance / sigma;
  return Math.exp(-0.5 * z * z);
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
      isLandTile(map, neighbor) &&
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

function forEachNeighbor(
  map: EngineTileMap,
  tile: TileRef,
  callback: (neighbor: TileRef) => void,
): void {
  const x = map.x(tile);
  const y = map.y(tile);
  for (let dy = -1; dy <= 1; dy += 1) {
    for (let dx = -1; dx <= 1; dx += 1) {
      if (dx === 0 && dy === 0) {
        continue;
      }

      const nx = x + dx;
      const ny = y + dy;
      if (nx < 0 || ny < 0 || nx >= map.width() || ny >= map.height()) {
        continue;
      }

      callback(map.ref(nx, ny));
    }
  }
}

function wildernessTilesPerTickUsed(
  map: EngineTileMap,
  ownerId: number,
  tile: TileRef,
  explorationTroops: number,
  parameters: FoundationWildernessRuntimeParameters,
): number {
  const activeFrontTroops = Math.min(
    explorationTroops,
    parameters.wildernessFrontCapacity,
  );

  return clamp(
    (2000 *
      Math.max(10, wildernessSpeedForTile(map, ownerId, tile, parameters))) /
      activeFrontTroops,
    5,
    100,
  );
}

export function wildernessSpeedForTile(
  map: EngineTileMap,
  ownerId: number,
  tile: TileRef,
  parameters: FoundationWildernessRuntimeParameters = DEFAULT_FOUNDATION_WILDERNESS_PARAMETERS,
): number {
  const slope = wildernessSlopeForTile(map, ownerId, tile, parameters);
  const speedMultiplier = clamp(
    toblerSpeedMultiplier(slope),
    parameters.minToblerSpeedMultiplier,
    parameters.maxToblerSpeedMultiplier,
  );
  return parameters.wildernessBaseSpeed / speedMultiplier;
}

export function toblerSpeedMultiplier(slope: number): number {
  const flatSpeed = toblerSpeedForSlope(0);
  return toblerSpeedForSlope(slope) / flatSpeed;
}

function wildernessSlopeForTile(
  map: EngineTileMap,
  ownerId: number,
  tile: TileRef,
  parameters: FoundationWildernessRuntimeParameters,
): number {
  let sourceElevation = 0;
  let ownedNeighborCount = 0;
  forEachCardinalNeighbor(map, tile, (neighbor) => {
    if (ownerIdFromState(map.stateBuffer()[neighbor]) === ownerId) {
      sourceElevation += map.elevation(neighbor);
      ownedNeighborCount++;
    }
  });

  if (ownedNeighborCount === 0) {
    return 0;
  }

  const averageSourceElevation = sourceElevation / ownedNeighborCount;
  return (
    (map.elevation(tile) - averageSourceElevation) *
    parameters.elevationSlopeScale
  );
}

function toblerSpeedForSlope(slope: number): number {
  return 6 * Math.exp(-3.5 * Math.abs(slope + 0.05));
}

export function wildernessTerrainPriorityWeight(
  elevation: number,
  parameters: Pick<
    FoundationWildernessRuntimeParameters,
    "terrainPriorityElevationScale"
  > = DEFAULT_FOUNDATION_WILDERNESS_PARAMETERS,
): number {
  return 1 + clamp(elevation, 0, 1) * parameters.terrainPriorityElevationScale;
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

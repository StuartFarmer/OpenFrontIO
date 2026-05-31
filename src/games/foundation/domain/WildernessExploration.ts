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
const DISTANCE_FRONT_PRIORITY_SCALE = 100;

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
  | "wildernessDistanceFocus"
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
  const frontShares = createDistanceFrontShareMap(
    map,
    player.ownerId,
    exploration.intent,
    parameters.wildernessDistanceFocus,
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

  const claimedTiles: TileRef[] = [];
  for (const frontierTile of attack.drainFrontier()) {
    if (explorationTroops < 1) {
      break;
    }

    const {
      tile,
      priority,
      troopShare: queuedTroopShare,
      progress: queuedProgress = 0,
    } = frontierTile;
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

    const troopShare =
      queuedTroopShare ??
      directionalFrontShareForTile(map, player.ownerId, tile, frontShares);
    const allocatedTroops = troopBudgetForShare(explorationTroops, troopShare);
    if (allocatedTroops <= 0) {
      continue;
    }

    const velocity = wildernessFrontVelocity(
      map,
      player.ownerId,
      tile,
      allocatedTroops,
      parameters,
    );
    const nextProgress = queuedProgress + velocity;
    if (nextProgress < 1) {
      attack.addBorderTile(tile);
      attack.enqueue(tile, priority, queuedTroopShare, nextProgress);
      continue;
    }

    explorationTroops -= parameters.wildernessAttackerLossPerTile;
    setOwnerId(map.stateBuffer(), tile, player.ownerId);
    addWildernessNeighbors(map, player.ownerId, tile, tick, rng, {
      attack,
      intent: exploration.intent,
      parameters,
      frontShares,
      troopShare,
    });
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
  const frontShares = createDistanceFrontShareMap(
    map,
    player.ownerId,
    intent,
    parameters.wildernessDistanceFocus,
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
    troopShare?: number;
  },
): void {
  const sourceShare =
    frontierState.troopShare ??
    directionalFrontShareForTile(map, ownerId, tile, frontierState.frontShares);
  const neighbors: TileRef[] = [];
  forEachCardinalNeighbor(map, tile, (neighbor) => {
    if (!isLandTile(map, neighbor)) {
      return;
    }
    if (ownerIdFromState(map.stateBuffer()[neighbor]) !== 0) {
      return;
    }

    neighbors.push(neighbor);
  });

  if (neighbors.length === 0) {
    return;
  }

  const neighborShare = sourceShare / neighbors.length;
  for (const neighbor of neighbors) {
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
      distancePriorityPenalty(neighborShare) +
      tick;

    frontierState.attack.enqueue(neighbor, priority, neighborShare);
  }
}

function createWildernessExplorationIntent(
  map: EngineTileMap,
  player: Player,
  targetTile: TileRef,
): WildernessExplorationIntent {
  const origin = averageOwnedBorderOrigin(map, player);
  const rawDx = map.x(targetTile) + 0.5 - origin.x;
  const rawDy = map.y(targetTile) + 0.5 - origin.y;
  const distance = Math.hypot(rawDx, rawDy);
  if (distance === 0) {
    return {
      originTile: origin.tile,
      targetTile,
      dx: 0,
      dy: 0,
      distance: 0,
    };
  }

  return {
    originTile: origin.tile,
    targetTile,
    dx: rawDx / distance,
    dy: rawDy / distance,
    distance,
  };
}

function averageOwnedBorderOrigin(
  map: EngineTileMap,
  player: Player,
): { tile: TileRef; x: number; y: number } {
  const placement = player.placement;
  if (!placement) {
    throw new Error("Cannot explore wilderness before player placement");
  }

  let totalX = 0;
  let totalY = 0;
  let count = 0;

  for (const tile of placement.claimedTiles) {
    if (!isOwnedBorderTile(map, player.ownerId, tile)) {
      continue;
    }

    totalX += map.x(tile) + 0.5;
    totalY += map.y(tile) + 0.5;
    count++;
  }

  if (count === 0) {
    return {
      tile: placement.selectedTile,
      x: map.x(placement.selectedTile) + 0.5,
      y: map.y(placement.selectedTile) + 0.5,
    };
  }

  const x = totalX / count;
  const y = totalY / count;
  return {
    tile: closestOwnedTileToPoint(map, player, x, y),
    x,
    y,
  };
}

function closestOwnedTileToPoint(
  map: EngineTileMap,
  player: Player,
  x: number,
  y: number,
): TileRef {
  const placement = player.placement;
  if (!placement) {
    throw new Error("Cannot explore wilderness before player placement");
  }

  let closestTile = placement.selectedTile;
  let closestDistanceSq = Number.POSITIVE_INFINITY;
  for (const tile of placement.claimedTiles) {
    const dx = map.x(tile) + 0.5 - x;
    const dy = map.y(tile) + 0.5 - y;
    const distanceSq = dx * dx + dy * dy;
    if (distanceSq < closestDistanceSq) {
      closestTile = tile;
      closestDistanceSq = distanceSq;
    }
  }

  return closestTile;
}

function isOwnedBorderTile(
  map: EngineTileMap,
  ownerId: number,
  tile: TileRef,
): boolean {
  if (ownerIdFromState(map.stateBuffer()[tile]) !== ownerId) {
    return false;
  }

  let border = false;
  forEachCardinalNeighbor(map, tile, (neighbor) => {
    if (
      !border &&
      isLandTile(map, neighbor) &&
      ownerIdFromState(map.stateBuffer()[neighbor]) !== ownerId
    ) {
      border = true;
    }
  });
  return border;
}

function createDistanceFrontShareMap(
  map: EngineTileMap,
  ownerId: number,
  intent: WildernessExplorationIntent | undefined,
  distanceFocus: number,
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
  if (borderTiles.size === 0) {
    return shares;
  }

  let totalWeight = 0;
  let minDistance = Number.POSITIVE_INFINITY;
  const distances = new Map<TileRef, number>();
  const targetX = map.x(intent.targetTile);
  const targetY = map.y(intent.targetTile);
  for (const tile of borderTiles) {
    const dx = map.x(tile) - targetX;
    const dy = map.y(tile) - targetY;
    const distance = Math.hypot(dx, dy);
    distances.set(tile, distance);
    minDistance = Math.min(minDistance, distance);
  }

  for (const tile of borderTiles) {
    const weight = distanceFrontWeight(
      distances.get(tile) ?? 0,
      distanceFocus,
      minDistance,
    );
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

function distancePriorityPenalty(sourceShare: number): number {
  return -sourceShare * DISTANCE_FRONT_PRIORITY_SCALE;
}

export function distanceFrontWeight(
  distance: number,
  focus = DEFAULT_FOUNDATION_WILDERNESS_PARAMETERS.wildernessDistanceFocus,
  referenceDistance = 0,
): number {
  if (
    !Number.isFinite(distance) ||
    distance < 0 ||
    !Number.isFinite(focus) ||
    focus <= 0 ||
    !Number.isFinite(referenceDistance) ||
    referenceDistance < 0
  ) {
    return 0;
  }

  const z = distance * focus;
  const referenceZ = referenceDistance * focus;
  return Math.exp(-0.5 * (z * z - referenceZ * referenceZ));
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

function troopBudgetForShare(
  explorationTroops: number,
  troopShare: number,
): number {
  const boundedShare = clamp(troopShare, 0, 1);
  return explorationTroops * boundedShare;
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

function wildernessFrontVelocity(
  map: EngineTileMap,
  ownerId: number,
  tile: TileRef,
  frontTroops: number,
  parameters: FoundationWildernessRuntimeParameters,
): number {
  const terminalTroopFactor = clamp(
    frontTroops / parameters.wildernessFrontCapacity,
    0,
    1,
  );
  const slopeFactor =
    parameters.wildernessBaseSpeed /
    wildernessSpeedForTile(map, ownerId, tile, parameters);

  return (
    parameters.wildernessTilesPerTickMultiplier *
    terminalTroopFactor *
    slopeFactor
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

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
const FOCUSED_FRONT_MIN_LANE_WIDTH = 1;
const FOCUSED_FRONT_BORDER_LANE_SCALE = 0.12;
const FOCUSED_FRONT_BASE_LANE_WIDTH = 6;
const FOCUSED_FRONT_DIRECTION_POWER = 8;

interface WildernessNeighborCandidate {
  tile: TileRef;
  eligible: boolean;
  blocksFocusedPressure: boolean;
}

export interface StartWildernessExplorationResult {
  player: Player;
  committedTroops: number;
  intent: WildernessExplorationIntent;
}

export interface StartWildernessExplorationOptions {
  troopRatio?: number;
  frontMode?: "uniform" | "focused";
  frontFocus?: number;
  parameters?: FoundationWildernessRuntimeParameters;
}

export interface TickWildernessExplorationResult {
  player: Player;
  claimedTiles: TileRef[];
  completed: boolean;
}

export type FoundationWildernessRuntimeParameters = Pick<
  FoundationWildernessParameters,
  | "wildernessMechanics"
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
  const intent = createWildernessExplorationIntent(map, player, targetTile, {
    frontMode: normalizeFrontMode(options.frontMode),
    frontFocus: clamp(options.frontFocus ?? 0, 0, 1),
  });

  const rng = createWildernessRandom(player.activeExploration?.randomState);
  const activeExploration = player.activeExploration;
  const activeTroops = activeExploration?.troops ?? 0;
  const totalExplorationTroops = activeTroops + committedTroops;
  const attack = activeExploration
    ? ExplorationAttack.fromExploration(activeExploration)
    : new ExplorationAttack();

  if (activeExploration) {
    attack.scaleTroopShares(activeTroops / totalExplorationTroops);
  }

  appendWildernessFrontier(
    map,
    player,
    attack,
    rng,
    tick,
    intent,
    options.parameters,
    committedTroops / totalExplorationTroops,
  );
  const attackState = attack.toState();

  return {
    player: {
      ...player,
      troops: player.troops - committedTroops,
      activeExploration: {
        id: activeExploration?.id ?? `explore-${targetTile}`,
        targetTile,
        intent,
        troops: totalExplorationTroops,
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
  if (parameters.wildernessMechanics === "openfront") {
    return tickWildernessExplorationOpenFront(
      map,
      player,
      tick,
      parameters,
      attack,
      explorationTroops,
      rng,
    );
  }

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

function tickWildernessExplorationOpenFront(
  map: EngineTileMap,
  player: Player,
  tick: number,
  parameters: FoundationWildernessRuntimeParameters,
  attack: ExplorationAttack,
  explorationTroops: number,
  rng: StatefulRandom,
): TickWildernessExplorationResult {
  const exploration = player.activeExploration;
  const placement = player.placement;
  if (!exploration || !placement) {
    return { player, claimedTiles: [], completed: false };
  }

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

  while (
    tileBudget > 0 &&
    explorationTroops >= 1 &&
    attack.frontierSize() > 0
  ) {
    const [tileToConquer] = attack.dequeue();
    attack.removeBorderTile(tileToConquer);

    if (!isOwnedBorderNeighbor(map, player.ownerId, tileToConquer)) {
      continue;
    }
    if (ownerIdFromState(map.stateBuffer()[tileToConquer]) !== 0) {
      continue;
    }
    if (!isLandTile(map, tileToConquer)) {
      continue;
    }

    const { attackerTroopLoss, tilesPerTickUsed } =
      openFrontWildernessAttackLogic(map, tileToConquer, explorationTroops, {
        lossPerTile: parameters.wildernessAttackerLossPerTile,
      });
    tileBudget -= tilesPerTickUsed;
    explorationTroops -= attackerTroopLoss;
    setOwnerId(map.stateBuffer(), tileToConquer, player.ownerId);
    addWildernessNeighbors(map, player.ownerId, tileToConquer, tick, rng, {
      attack,
      parameters,
    });
    claimedTiles.push(tileToConquer);
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

function openFrontWildernessAttackLogic(
  map: EngineTileMap,
  tileToConquer: TileRef,
  attackTroops: number,
  options: { lossPerTile: number },
): {
  attackerTroopLoss: number;
  tilesPerTickUsed: number;
} {
  const { magnitude, speed } = openFrontTerrainStats(
    map.elevation(tileToConquer),
  );
  const lossScale = options.lossPerTile / 16;
  return {
    attackerTroopLoss: (magnitude / 5) * lossScale,
    tilesPerTickUsed: within(
      (2000 * Math.max(10, speed)) / Math.max(1, attackTroops),
      5,
      100,
    ),
  };
}

function openFrontTerrainStats(elevation: number): {
  magnitude: number;
  speed: number;
} {
  if (elevation >= 0.75) {
    return { magnitude: 120, speed: 25 };
  }
  if (elevation >= 0.45) {
    return { magnitude: 100, speed: 20 };
  }
  return { magnitude: 80, speed: 16.5 };
}

function openFrontTerrainPriorityMagnitude(elevation: number): number {
  if (elevation >= 0.75) {
    return 2;
  }
  if (elevation >= 0.45) {
    return 1.5;
  }
  return 1;
}

function appendWildernessFrontier(
  map: EngineTileMap,
  player: Player,
  attack: ExplorationAttack,
  rng: StatefulRandom,
  tick: number,
  intent: WildernessExplorationIntent,
  parameters: FoundationWildernessRuntimeParameters = DEFAULT_FOUNDATION_WILDERNESS_PARAMETERS,
  troopShareScale = 1,
): void {
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
      troopShareScale,
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
    troopShareScale?: number;
  },
): void {
  const useOpenFrontMechanics =
    frontierState.parameters?.wildernessMechanics === "openfront";
  const sourceShare = useOpenFrontMechanics
    ? 1
    : (frontierState.troopShare ??
      directionalFrontShareForTile(
        map,
        ownerId,
        tile,
        frontierState.frontShares,
      ));
  const candidates: WildernessNeighborCandidate[] = [];
  forEachCardinalNeighbor(map, tile, (neighbor) => {
    const isLand = isLandTile(map, neighbor);
    candidates.push({
      tile: neighbor,
      eligible: isLand && ownerIdFromState(map.stateBuffer()[neighbor]) === 0,
      blocksFocusedPressure: !isLand,
    });
  });

  if (candidates.length === 0) {
    return;
  }

  const focusedWeights = useOpenFrontMechanics
    ? { weights: new Map<TileRef, number>(), blockedWeight: 0 }
    : focusedNeighborWeights(
        map,
        tile,
        candidates,
        frontierState.intent,
        frontierState.frontShares?.size ?? 0,
      );
  const eligibleNeighbors = candidates
    .filter((candidate) => candidate.eligible)
    .map((candidate) => candidate.tile);
  const neighborShareScale = frontierState.troopShareScale ?? 1;
  const equalNeighborShare =
    eligibleNeighbors.length === 0 ? 0 : sourceShare / eligibleNeighbors.length;
  const stopFocusedPressureAtShore = focusedWeights.blockedWeight > 0;
  let redirectedShare = sourceShare * focusedWeights.blockedWeight;
  for (const neighbor of eligibleNeighbors) {
    const weight = focusedWeights.weights.get(neighbor);
    if (stopFocusedPressureAtShore && weight !== undefined) {
      redirectedShare += sourceShare * weight;
      continue;
    }
    const neighborShare =
      (weight === undefined ? equalNeighborShare : sourceShare * weight) *
      neighborShareScale;
    if (neighborShare <= 0) {
      continue;
    }
    frontierState.attack.addBorderTile(neighbor);
    let numOwnedByMe = 0;
    forEachCardinalNeighbor(map, neighbor, (candidateNeighbor) => {
      if (ownerIdFromState(map.stateBuffer()[candidateNeighbor]) === ownerId) {
        numOwnedByMe++;
      }
    });

    const terrainPriorityWeight = useOpenFrontMechanics
      ? openFrontTerrainPriorityMagnitude(map.elevation(neighbor))
      : wildernessTerrainPriorityWeight(
          map.elevation(neighbor),
          frontierState.parameters,
        );
    const sharePriorityPenalty = useOpenFrontMechanics
      ? 0
      : distancePriorityPenalty(neighborShare);
    const priority =
      (randomInt(rng, 0, 7) + 10) *
        (1 - numOwnedByMe * 0.5 + terrainPriorityWeight / 2) +
      sharePriorityPenalty +
      tick;

    frontierState.attack.enqueue(neighbor, priority, neighborShare);
  }

  const blockedShare = redirectedShare * neighborShareScale;
  if (blockedShare > 0) {
    reassignBlockedFocusedShare(map, ownerId, tile, tick, rng, frontierState, {
      blockedShare,
    });
  }
}

function reassignBlockedFocusedShare(
  map: EngineTileMap,
  ownerId: number,
  blockedSourceTile: TileRef,
  tick: number,
  rng: StatefulRandom,
  frontierState: {
    attack: ExplorationAttack;
    parameters?: FoundationWildernessRuntimeParameters;
    frontShares?: ReadonlyMap<TileRef, number>;
  },
  options: { blockedShare: number },
): void {
  const targetTile = randomAlternativeFrontTile(
    map,
    ownerId,
    blockedSourceTile,
    rng,
    frontierState,
  );
  if (targetTile === null) {
    return;
  }

  frontierState.attack.addBorderTile(targetTile);
  let numOwnedByMe = 0;
  forEachCardinalNeighbor(map, targetTile, (candidateNeighbor) => {
    if (ownerIdFromState(map.stateBuffer()[candidateNeighbor]) === ownerId) {
      numOwnedByMe++;
    }
  });
  const terrainPriorityWeight = wildernessTerrainPriorityWeight(
    map.elevation(targetTile),
    frontierState.parameters,
  );
  const priority =
    (randomInt(rng, 0, 7) + 10) *
      (1 - numOwnedByMe * 0.5 + terrainPriorityWeight / 2) +
    distancePriorityPenalty(options.blockedShare) +
    tick;

  frontierState.attack.enqueue(targetTile, priority, options.blockedShare);
}

function randomAlternativeFrontTile(
  map: EngineTileMap,
  ownerId: number,
  blockedSourceTile: TileRef,
  rng: StatefulRandom,
  frontierState: {
    attack: ExplorationAttack;
    frontShares?: ReadonlyMap<TileRef, number>;
  },
): TileRef | null {
  const candidates = new Set<TileRef>();
  for (const entry of frontierState.attack.toState().frontier) {
    if (isAlternativeFrontTile(map, ownerId, blockedSourceTile, entry.tile)) {
      candidates.add(entry.tile);
    }
  }

  for (const ownedBorderTile of frontierState.frontShares?.keys() ?? []) {
    if (ownerIdFromState(map.stateBuffer()[ownedBorderTile]) !== ownerId) {
      continue;
    }
    forEachCardinalNeighbor(map, ownedBorderTile, (neighbor) => {
      if (isAlternativeFrontTile(map, ownerId, blockedSourceTile, neighbor)) {
        candidates.add(neighbor);
      }
    });
  }

  if (candidates.size === 0) {
    return null;
  }

  return Array.from(candidates)[randomInt(rng, 0, candidates.size)] ?? null;
}

function isAlternativeFrontTile(
  map: EngineTileMap,
  ownerId: number,
  blockedSourceTile: TileRef,
  tile: TileRef,
): boolean {
  return (
    tile !== blockedSourceTile &&
    !isNearbyTile(map, blockedSourceTile, tile) &&
    isLandTile(map, tile) &&
    ownerIdFromState(map.stateBuffer()[tile]) === 0 &&
    isOwnedBorderNeighbor(map, ownerId, tile)
  );
}

function createWildernessExplorationIntent(
  map: EngineTileMap,
  player: Player,
  targetTile: TileRef,
  front: {
    frontMode: "uniform" | "focused";
    frontFocus: number;
  },
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
      frontMode: front.frontMode,
      frontFocus: front.frontFocus,
    };
  }

  return {
    originTile: origin.tile,
    targetTile,
    dx: rawDx / distance,
    dy: rawDy / distance,
    distance,
    frontMode: front.frontMode,
    frontFocus: front.frontFocus,
  };
}

function normalizeFrontMode(
  frontMode: "uniform" | "focused" | undefined,
): "uniform" | "focused" {
  return frontMode === "focused" ? "focused" : "uniform";
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

  const frontMode = intent.frontMode ?? "uniform";
  const frontFocus = clamp(intent.frontFocus ?? 0, 0, 1);
  const effectiveDistanceFocus =
    frontMode === "focused" ? distanceFocus * frontFocus : 0;

  if (effectiveDistanceFocus <= 0) {
    const share = 1 / borderTiles.size;
    for (const tile of borderTiles) {
      shares.set(tile, share);
    }
    return shares;
  }

  let totalWeight = 0;
  for (const tile of borderTiles) {
    const weight = focusedFrontWeight(
      map,
      tile,
      intent,
      effectiveDistanceFocus,
      borderTiles.size,
    );
    shares.set(tile, weight);
    totalWeight += weight;
  }
  if (totalWeight <= 0) {
    const share = 1 / borderTiles.size;
    for (const tile of borderTiles) {
      shares.set(tile, share);
    }
    return shares;
  }

  for (const [tile, weight] of shares) {
    shares.set(tile, weight / totalWeight);
  }
  return shares;
}

function focusedFrontWeight(
  map: EngineTileMap,
  tile: TileRef,
  intent: WildernessExplorationIntent,
  effectiveDistanceFocus: number,
  borderTileCount: number,
): number {
  if (!hasFocusedDirection(intent) || effectiveDistanceFocus <= 0) {
    return 0;
  }

  const originX = map.x(intent.originTile) + 0.5;
  const originY = map.y(intent.originTile) + 0.5;
  const tileX = map.x(tile) + 0.5;
  const tileY = map.y(tile) + 0.5;
  const rx = tileX - originX;
  const ry = tileY - originY;
  const projectedDistance = rx * intent.dx + ry * intent.dy;
  if (projectedDistance < 0) {
    return 0;
  }

  const distance = Math.hypot(rx, ry);
  const alignment =
    distance <= 0 ? 1 : clamp(projectedDistance / distance, 0, 1);
  if (alignment <= 0) {
    return 0;
  }

  const lateralDistance = Math.abs(rx * intent.dy - ry * intent.dx);
  const laneWidth = focusedFrontLaneWidth(borderTileCount, intent.frontFocus);
  const laneWeight = Math.exp(-0.5 * Math.pow(lateralDistance / laneWidth, 2));
  const directionWeight = Math.pow(
    alignment,
    focusedDirectionPower(intent.frontFocus),
  );
  const distanceWeight = distanceFrontWeight(
    lateralDistance,
    effectiveDistanceFocus,
    0,
  );

  return directionWeight * Math.max(laneWeight, distanceWeight);
}

function focusedNeighborWeights(
  map: EngineTileMap,
  sourceTile: TileRef,
  candidates: readonly WildernessNeighborCandidate[],
  intent: WildernessExplorationIntent | undefined,
  borderTileCount: number,
): { weights: Map<TileRef, number>; blockedWeight: number } {
  const weights = new Map<TileRef, number>();
  if (!intent || !hasFocusedDirection(intent) || candidates.length === 0) {
    return { weights, blockedWeight: 0 };
  }

  let totalWeight = 0;
  let blockedWeight = 0;
  for (const candidate of candidates) {
    const neighbor = candidate.tile;
    const stepDx = map.x(neighbor) - map.x(sourceTile);
    const stepDy = map.y(neighbor) - map.y(sourceTile);
    const forwardAlignment = clamp(
      stepDx * intent.dx + stepDy * intent.dy,
      0,
      1,
    );
    if (forwardAlignment <= 0) {
      weights.set(neighbor, 0);
      continue;
    }

    const laneWeight = focusedLaneWeightForTile(
      map,
      neighbor,
      intent,
      borderTileCount,
    );
    const weight =
      Math.pow(forwardAlignment, focusedDirectionPower(intent.frontFocus)) *
      laneWeight;
    if (candidate.eligible) {
      weights.set(neighbor, weight);
      totalWeight += weight;
    } else if (candidate.blocksFocusedPressure) {
      blockedWeight += weight;
      totalWeight += weight;
    }
  }

  if (totalWeight <= 0) {
    weights.clear();
    return { weights, blockedWeight: 0 };
  }

  for (const [tile, weight] of weights) {
    weights.set(tile, weight / totalWeight);
  }
  return { weights, blockedWeight: blockedWeight / totalWeight };
}

function focusedLaneWeightForTile(
  map: EngineTileMap,
  tile: TileRef,
  intent: WildernessExplorationIntent,
  borderTileCount: number,
): number {
  const originX = map.x(intent.originTile) + 0.5;
  const originY = map.y(intent.originTile) + 0.5;
  const tileX = map.x(tile) + 0.5;
  const tileY = map.y(tile) + 0.5;
  const rx = tileX - originX;
  const ry = tileY - originY;
  const lateralDistance = Math.abs(rx * intent.dy - ry * intent.dx);
  const laneWidth = focusedFrontLaneWidth(borderTileCount, intent.frontFocus);
  return Math.exp(-0.5 * Math.pow(lateralDistance / laneWidth, 2));
}

function hasFocusedDirection(intent: WildernessExplorationIntent): boolean {
  return (
    intent.frontMode === "focused" &&
    (intent.frontFocus ?? 0) > 0 &&
    Number.isFinite(intent.dx) &&
    Number.isFinite(intent.dy) &&
    (intent.dx !== 0 || intent.dy !== 0)
  );
}

function focusedDirectionPower(frontFocus = 0): number {
  return 1 + clamp(frontFocus, 0, 1) * FOCUSED_FRONT_DIRECTION_POWER;
}

export function focusedFrontLaneWidth(
  borderTileCount: number,
  frontFocus = 0,
): number {
  const borderWidth = Math.sqrt(Math.max(1, borderTileCount));
  const borderFloor = Math.max(
    FOCUSED_FRONT_MIN_LANE_WIDTH,
    borderWidth * FOCUSED_FRONT_BORDER_LANE_SCALE,
  );
  const focusWidth =
    FOCUSED_FRONT_BASE_LANE_WIDTH / (1 + clamp(frontFocus, 0, 1) * 5);
  return Math.max(borderFloor, focusWidth);
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

function isNearbyTile(
  map: EngineTileMap,
  sourceTile: TileRef,
  candidateTile: TileRef,
): boolean {
  return (
    Math.abs(map.x(sourceTile) - map.x(candidateTile)) <= 1 &&
    Math.abs(map.y(sourceTile) - map.y(candidateTile)) <= 1
  );
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

function within(value: number, min: number, max: number): number {
  if (value < min) return min;
  if (value > max) return max;
  return value;
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

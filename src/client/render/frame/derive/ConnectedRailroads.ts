export interface ConnectedRailroadUnit {
  pos: number;
  ownerID: number;
  isActive: boolean;
  hasTrainStation: boolean;
  underConstruction?: boolean;
}

export interface ConnectedRailroadInput {
  railroads: ReadonlyMap<number, readonly number[]>;
  units: Iterable<ConnectedRailroadUnit>;
  localPlayerID: number;
  mapWidth: number;
  mapHeight: number;
  stationSnapRadius?: number;
}

export interface RailroadRouteOverlay {
  connected: number[];
  disconnected: number[];
}

const DEFAULT_STATION_SNAP_RADIUS = 3;

export function computeRailroadRouteOverlay(
  input: ConnectedRailroadInput,
): RailroadRouteOverlay {
  if (input.localPlayerID <= 0 || input.railroads.size === 0) {
    return { connected: [], disconnected: [] };
  }

  const railIdsByTile = new Map<number, number[]>();
  const neighborsByRailId = new Map<number, Set<number>>();

  for (const [railId, tiles] of input.railroads) {
    neighborsByRailId.set(railId, new Set());
    for (const tile of tiles) {
      const ids = railIdsByTile.get(tile);
      if (ids) {
        ids.push(railId);
      } else {
        railIdsByTile.set(tile, [railId]);
      }
    }
  }

  for (const ids of railIdsByTile.values()) {
    linkRailIds(ids, neighborsByRailId);
  }

  const seedRailIds = new Set<number>();
  const radius = input.stationSnapRadius ?? DEFAULT_STATION_SNAP_RADIUS;

  for (const unit of input.units) {
    if (!unit.isActive || unit.underConstruction || !unit.hasTrainStation) {
      continue;
    }

    const nearbyRailIds = railIdsNearTile(
      unit.pos,
      radius,
      input.mapWidth,
      input.mapHeight,
      railIdsByTile,
    );
    if (nearbyRailIds.size === 0) continue;

    linkRailIds([...nearbyRailIds], neighborsByRailId);
    if (unit.ownerID === input.localPlayerID) {
      for (const railId of nearbyRailIds) {
        seedRailIds.add(railId);
      }
    }
  }

  if (seedRailIds.size === 0) {
    return {
      connected: [],
      disconnected: uniqueRailroadTiles(input.railroads),
    };
  }

  const connectedRailIds = floodConnectedRailIds(
    seedRailIds,
    neighborsByRailId,
  );
  const connectedTiles = new Set<number>();
  const disconnectedTiles = new Set<number>();

  for (const [railId, tiles] of input.railroads) {
    const target = connectedRailIds.has(railId)
      ? connectedTiles
      : disconnectedTiles;
    for (const tile of tiles) target.add(tile);
  }

  return {
    connected: [...connectedTiles],
    disconnected: [...disconnectedTiles],
  };
}

export function computeConnectedRailroadTiles(
  input: ConnectedRailroadInput,
): number[] {
  return computeRailroadRouteOverlay(input).connected;
}

function linkRailIds(
  ids: readonly number[],
  neighborsByRailId: Map<number, Set<number>>,
) {
  if (ids.length < 2) return;

  for (const id of ids) {
    let neighbors = neighborsByRailId.get(id);
    if (!neighbors) {
      neighbors = new Set();
      neighborsByRailId.set(id, neighbors);
    }
    for (const otherId of ids) {
      if (otherId !== id) neighbors.add(otherId);
    }
  }
}

function railIdsNearTile(
  tile: number,
  radius: number,
  mapWidth: number,
  mapHeight: number,
  railIdsByTile: ReadonlyMap<number, readonly number[]>,
): Set<number> {
  const result = new Set<number>();
  const x = tile % mapWidth;
  const y = Math.floor(tile / mapWidth);
  const minX = Math.max(0, x - radius);
  const maxX = Math.min(mapWidth - 1, x + radius);
  const minY = Math.max(0, y - radius);
  const maxY = Math.min(mapHeight - 1, y + radius);

  for (let yy = minY; yy <= maxY; yy++) {
    for (let xx = minX; xx <= maxX; xx++) {
      const ids = railIdsByTile.get(yy * mapWidth + xx);
      if (!ids) continue;
      for (const id of ids) {
        result.add(id);
      }
    }
  }

  return result;
}

function floodConnectedRailIds(
  seedRailIds: ReadonlySet<number>,
  neighborsByRailId: ReadonlyMap<number, ReadonlySet<number>>,
): Set<number> {
  const visited = new Set<number>();
  const queue = [...seedRailIds];

  for (let i = 0; i < queue.length; i++) {
    const id = queue[i];
    if (visited.has(id)) continue;
    visited.add(id);

    const neighbors = neighborsByRailId.get(id);
    if (!neighbors) continue;
    for (const neighbor of neighbors) {
      if (!visited.has(neighbor)) {
        queue.push(neighbor);
      }
    }
  }

  return visited;
}

function uniqueRailroadTiles(
  railroads: ReadonlyMap<number, readonly number[]>,
): number[] {
  const tiles = new Set<number>();
  for (const railroadTiles of railroads.values()) {
    for (const tile of railroadTiles) tiles.add(tile);
  }
  return [...tiles];
}

import { EngineTileMap, TileRef } from "./EngineTileMap";
import { Player } from "./FoundationPlayer";

export const FOUNDATION_PLACEMENT_RADIUS = 4;
export const FOUNDATION_OWNER_ID_MASK = 0x0fff;

export interface PlacePlayerResult {
  player: Player;
  claimedTiles: TileRef[];
}

export function placePlayer(
  map: EngineTileMap,
  player: Player,
  clickedTile: TileRef,
): PlacePlayerResult {
  if (!map.isValidRef(clickedTile)) {
    throw new Error(`Cannot place player on invalid tile: ${clickedTile}`);
  }
  assertValidOwnerId(player.ownerId);

  clearPreviousPlacement(map, player);
  const claimedTiles = collectTilesInRadius(map, clickedTile);
  for (const tile of claimedTiles) {
    setOwnerId(map.stateBuffer(), tile, player.ownerId);
  }

  return {
    player: {
      ...player,
      placement: {
        selectedTile: clickedTile,
        claimedTiles,
        claimedTileCount: claimedTiles.length,
      },
    },
    claimedTiles,
  };
}

export function collectTilesInRadius(
  map: EngineTileMap,
  centerTile: TileRef,
  radius: number = FOUNDATION_PLACEMENT_RADIUS,
): TileRef[] {
  if (!map.isValidRef(centerTile)) {
    throw new Error(`Invalid center tile: ${centerTile}`);
  }
  assertValidRadius(radius);

  const centerX = map.x(centerTile);
  const centerY = map.y(centerTile);
  const minX = Math.max(0, centerX - radius);
  const maxX = Math.min(map.width() - 1, centerX + radius);
  const minY = Math.max(0, centerY - radius);
  const maxY = Math.min(map.height() - 1, centerY + radius);
  const radiusSquared = radius * radius;
  const tiles: TileRef[] = [];

  for (let y = minY; y <= maxY; y++) {
    for (let x = minX; x <= maxX; x++) {
      const dx = x - (centerX - 0.5);
      const dy = y - (centerY - 0.5);
      if (dx * dx + dy * dy <= radiusSquared) {
        tiles.push(map.ref(x, y));
      }
    }
  }

  return tiles;
}

export function ownerIdFromState(state: number): number {
  return state & FOUNDATION_OWNER_ID_MASK;
}

function clearPreviousPlacement(map: EngineTileMap, player: Player): void {
  if (!player.placement) {
    return;
  }

  const state = map.stateBuffer();
  for (const tile of player.placement.claimedTiles) {
    if (
      map.isValidRef(tile) &&
      ownerIdFromState(state[tile]) === player.ownerId
    ) {
      state[tile] &= ~FOUNDATION_OWNER_ID_MASK;
    }
  }
}

export function setOwnerId(
  state: Uint16Array,
  tile: TileRef,
  ownerId: number,
): void {
  state[tile] = (state[tile] & ~FOUNDATION_OWNER_ID_MASK) | ownerId;
}

function assertValidOwnerId(ownerId: number): void {
  if (
    !Number.isInteger(ownerId) ||
    ownerId <= 0 ||
    ownerId > FOUNDATION_OWNER_ID_MASK
  ) {
    throw new Error(`Invalid Foundation owner id: ${ownerId}`);
  }
}

function assertValidRadius(radius: number): void {
  if (!Number.isInteger(radius) || radius < 0) {
    throw new Error(`Invalid placement radius: ${radius}`);
  }
}

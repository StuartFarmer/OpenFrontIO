import { TileRef } from "./EngineTileMap";

export interface PlayerPlacement {
  selectedTile: TileRef;
  claimedTiles: readonly TileRef[];
  claimedTileCount: number;
}

export interface Player {
  id: string;
  ownerId: number;
  name: string;
  placement: PlayerPlacement | null;
}

export function createPlayer(
  id: string,
  options: { ownerId?: number; name?: string } = {},
): Player {
  return {
    id,
    ownerId: options.ownerId ?? 1,
    name: options.name ?? "Player",
    placement: null,
  };
}

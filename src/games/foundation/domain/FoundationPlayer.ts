import { TileRef } from "./EngineTileMap";

export const FOUNDATION_STARTING_TROOPS = 25_000;

export interface PlayerPlacement {
  selectedTile: TileRef;
  claimedTiles: readonly TileRef[];
  claimedTileCount: number;
}

export interface WildernessExploration {
  id: string;
  targetTile: TileRef;
  troops: number;
  frontier: readonly WildernessFrontierTile[];
  borderTiles: readonly TileRef[];
  randomState: string;
}

export interface WildernessFrontierTile {
  tile: TileRef;
  priority: number;
}

export interface Player {
  id: string;
  ownerId: number;
  name: string;
  troops: number;
  placement: PlayerPlacement | null;
  activeExploration: WildernessExploration | null;
}

export function createPlayer(
  id: string,
  options: { ownerId?: number; name?: string } = {},
): Player {
  return {
    id,
    ownerId: options.ownerId ?? 1,
    name: options.name ?? "Player",
    troops: FOUNDATION_STARTING_TROOPS,
    placement: null,
    activeExploration: null,
  };
}

import { TileRef } from "./EngineTileMap";
import { FOUNDATION_STARTING_TROOPS } from "./FoundationTroops";

export interface PlayerPlacement {
  selectedTile: TileRef;
  claimedTiles: readonly TileRef[];
  claimedTileCount: number;
}

export interface WildernessExploration {
  id: string;
  targetTile: TileRef;
  intent: WildernessExplorationIntent;
  troops: number;
  frontier: readonly WildernessFrontierTile[];
  borderTiles: readonly TileRef[];
  randomState: string;
}

export interface WildernessExplorationIntent {
  originTile: TileRef;
  targetTile: TileRef;
  dx: number;
  dy: number;
  distance: number;
}

export interface WildernessFrontierTile {
  tile: TileRef;
  priority: number;
  troopShare?: number;
  progress?: number;
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
  options: { ownerId?: number; name?: string; troops?: number } = {},
): Player {
  return {
    id,
    ownerId: options.ownerId ?? 1,
    name: options.name ?? "Player",
    troops: options.troops ?? FOUNDATION_STARTING_TROOPS,
    placement: null,
    activeExploration: null,
  };
}

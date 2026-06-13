import { TileRef } from "./EngineTileMap";
import type { FoundationBuildingType } from "./FoundationBuildings";
import { FOUNDATION_STARTING_TROOPS } from "./FoundationTroops";

export interface FoundationBuilding {
  id: string;
  type: FoundationBuildingType;
  tileRef: TileRef;
  level: number;
  underConstruction: boolean;
}

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
  frontMode?: "uniform" | "focused";
  frontFocus?: number;
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
  foodStock: number;
  buildings: readonly FoundationBuilding[];
  placement: PlayerPlacement | null;
  activeExploration: WildernessExploration | null;
}

export function createPlayer(
  id: string,
  options: {
    ownerId?: number;
    name?: string;
    troops?: number;
    foodStock?: number;
  } = {},
): Player {
  return {
    id,
    ownerId: options.ownerId ?? 1,
    name: options.name ?? "Player",
    troops: options.troops ?? FOUNDATION_STARTING_TROOPS,
    foodStock: options.foodStock ?? 0,
    buildings: [],
    placement: null,
    activeExploration: null,
  };
}

export function countFoundationBuildings(
  player: Player,
  type: FoundationBuildingType,
): number {
  return player.buildings.reduce((total, building) => {
    if (building.type !== type || building.underConstruction) {
      return total;
    }
    return total + building.level;
  }, 0);
}

import { PlayerBuildableUnitType } from "../core/game/Game";
import { TileRef } from "../core/game/GameMap";

export interface UIState {
  attackRatio: number;
  foodAllocationToPopulation?: number;
  ghostStructure: PlayerBuildableUnitType | null;
  overlappingRailroads: number[];
  ghostRailPaths: TileRef[][];
  rocketDirectionUp: boolean;
}

import { PlayerBuildableUnitType } from "../core/game/Game";
import { TileRef } from "../core/game/GameMap";
import type { ResourceKind } from "../core/game/Resources";

export interface UIState {
  attackRatio: number;
  resourceImportBlend?: Record<ResourceKind, number>;
  resourceExportBlend?: Record<ResourceKind, number>;
  ghostStructure: PlayerBuildableUnitType | null;
  overlappingRailroads: number[];
  ghostRailPaths: TileRef[][];
  rocketDirectionUp: boolean;
}

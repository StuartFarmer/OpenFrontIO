import { PlayerBuildableUnitType, UnitType } from "../../core/game/Game";

export type PlacementMode = "single" | "paint";

export function placementModeFor(
  unitType: PlayerBuildableUnitType | null,
): PlacementMode | null {
  if (unitType === null) {
    return null;
  }
  return isPaintableBuildUnit(unitType) ? "paint" : "single";
}

export function isPaintableBuildUnit(
  unitType: PlayerBuildableUnitType | null,
): unitType is UnitType.Farmland {
  return unitType === UnitType.Farmland;
}

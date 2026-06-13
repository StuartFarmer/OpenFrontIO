export type FoundationBuildingType =
  | "farmland"
  | "grain-silo"
  | "oil-tank"
  | "mineral-stockpile";

export type FoundationBuildingCategory = "agriculture" | "storage";
export type FoundationBuildingPlacementMode = "paint" | "single";

export interface FoundationBuildingDefinition {
  id: FoundationBuildingType;
  label: string;
  meta: string;
  color: string;
  category: FoundationBuildingCategory;
  iconKey: "fuel" | "gem" | "sprout" | "wheat";
  footprintSize: number;
  placementMode: FoundationBuildingPlacementMode;
  showInBuildBar: boolean;
}

export const FOUNDATION_BUILDINGS: readonly FoundationBuildingDefinition[] = [
  {
    id: "farmland",
    label: "Farmland",
    meta: "Food",
    color: "rgb(96 142 62)",
    category: "agriculture",
    iconKey: "sprout",
    footprintSize: 1,
    placementMode: "paint",
    showInBuildBar: true,
  },
  {
    id: "grain-silo",
    label: "Grain Silo",
    meta: "Food",
    color: "rgb(214 162 58)",
    category: "storage",
    iconKey: "wheat",
    footprintSize: 4,
    placementMode: "single",
    showInBuildBar: true,
  },
  {
    id: "oil-tank",
    label: "Oil Tank",
    meta: "Fuel",
    color: "rgb(5 7 8)",
    category: "storage",
    iconKey: "fuel",
    footprintSize: 4,
    placementMode: "single",
    showInBuildBar: true,
  },
  {
    id: "mineral-stockpile",
    label: "Mineral Stockpile",
    meta: "Ore",
    color: "rgb(185 193 199)",
    category: "storage",
    iconKey: "gem",
    footprintSize: 4,
    placementMode: "single",
    showInBuildBar: false,
  },
];

export const FOUNDATION_BUILDING_BY_ID: Readonly<
  Record<FoundationBuildingType, FoundationBuildingDefinition>
> = Object.fromEntries(
  FOUNDATION_BUILDINGS.map((building) => [building.id, building]),
) as Record<FoundationBuildingType, FoundationBuildingDefinition>;

export const FOUNDATION_STORAGE_BUILDINGS = FOUNDATION_BUILDINGS.filter(
  (building) => building.category === "storage",
);

export const FOUNDATION_BUILD_BAR_BUILDINGS = FOUNDATION_BUILDINGS.filter(
  (building) => building.showInBuildBar,
);

export function isFoundationBuildingType(
  value: string,
): value is FoundationBuildingType {
  return value in FOUNDATION_BUILDING_BY_ID;
}

export function foundationBuildingDefinition(
  value: FoundationBuildingType,
): FoundationBuildingDefinition {
  return FOUNDATION_BUILDING_BY_ID[value];
}

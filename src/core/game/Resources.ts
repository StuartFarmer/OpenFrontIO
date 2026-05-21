export const ResourceKinds = ["food", "energy", "materials"] as const;

export type ResourceKind = (typeof ResourceKinds)[number];
export type ResourceAmount = bigint;
export type ResourceStockpile = Record<ResourceKind, ResourceAmount>;
export type ResourceDelta = Partial<ResourceStockpile>;

export interface AddResourcesOptions {
  updateGold?: boolean;
}

export function createZeroResources(): ResourceStockpile {
  return {
    food: 0n,
    energy: 0n,
    materials: 0n,
  };
}

export function resourcesFromGoldAmount(
  amount: ResourceAmount,
): ResourceStockpile {
  return {
    food: amount,
    energy: amount,
    materials: amount,
  };
}

export function cloneResources(
  resources: ResourceStockpile,
): ResourceStockpile {
  return {
    food: resources.food,
    energy: resources.energy,
    materials: resources.materials,
  };
}

export function addResourceDelta(
  resources: ResourceStockpile,
  delta: ResourceDelta,
): ResourceStockpile {
  return {
    food: resources.food + (delta.food ?? 0n),
    energy: resources.energy + (delta.energy ?? 0n),
    materials: resources.materials + (delta.materials ?? 0n),
  };
}

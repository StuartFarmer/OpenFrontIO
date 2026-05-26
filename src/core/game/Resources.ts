export const ResourceKinds = ["food", "energy", "materials"] as const;

export type ResourceKind = (typeof ResourceKinds)[number];
export type ResourceAmount = bigint;
export type ResourceStockpile = Record<ResourceKind, ResourceAmount>;
export type ResourceDelta = Partial<ResourceStockpile>;

export interface AddResourcesOptions {
  updateGold?: boolean;
  bonusGoldAmount?: ResourceAmount;
  bonusResources?: ResourceStockpile;
  bonusSource?: "rail" | "ship";
}

export interface ResourceRegenOptions {
  base: number;
  exponent: number;
  divisor: number;
}

const DEFAULT_RESOURCE_REGEN_OPTIONS: ResourceRegenOptions = {
  base: 10,
  exponent: 0.73,
  divisor: 4,
};

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

export function resourcesFromExportBlend(
  amount: ResourceAmount,
  exporterResources: ResourceStockpile,
): ResourceStockpile {
  if (amount <= 0n) {
    return createZeroResources();
  }

  const total =
    exporterResources.food +
    exporterResources.energy +
    exporterResources.materials;
  if (total <= 0n) {
    return splitResourcesEvenly(amount);
  }

  const food = (amount * exporterResources.food) / total;
  const energy = (amount * exporterResources.energy) / total;
  return {
    food,
    energy,
    materials: amount - food - energy,
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

export function remainingResourceCapacity(
  resources: ResourceStockpile,
  capacity: ResourceStockpile,
): ResourceStockpile {
  return {
    food: positiveDifference(capacity.food, resources.food),
    energy: positiveDifference(capacity.energy, resources.energy),
    materials: positiveDifference(capacity.materials, resources.materials),
  };
}

export function clampResourceDeltaToCapacity(
  resources: ResourceStockpile,
  delta: ResourceStockpile,
  capacity: ResourceStockpile,
): ResourceStockpile {
  const remaining = remainingResourceCapacity(resources, capacity);
  return {
    food: clampPositiveDelta(delta.food, remaining.food),
    energy: clampPositiveDelta(delta.energy, remaining.energy),
    materials: clampPositiveDelta(delta.materials, remaining.materials),
  };
}

export function resourceRegenAmount(
  current: ResourceAmount,
  capacity: ResourceAmount,
  multiplier: number = 1,
  options: ResourceRegenOptions = DEFAULT_RESOURCE_REGEN_OPTIONS,
): ResourceAmount {
  if (capacity <= 0n || current >= capacity || multiplier <= 0) {
    return 0n;
  }

  const currentAmount = Number(current);
  const maxAmount = Number(capacity);
  let toAdd =
    options.base + Math.pow(currentAmount, options.exponent) / options.divisor;
  toAdd *= 1 - currentAmount / maxAmount;
  toAdd *= multiplier;

  const cappedDelta = Math.min(Math.max(toAdd, 0), maxAmount - currentAmount);
  if (cappedDelta <= 0) {
    return 0n;
  }
  return BigInt(Math.max(1, Math.floor(cappedDelta)));
}

export function resourceRegenDelta(
  resources: ResourceStockpile,
  capacity: ResourceStockpile,
  multiplier: number = 1,
  options: ResourceRegenOptions = DEFAULT_RESOURCE_REGEN_OPTIONS,
): ResourceStockpile {
  return {
    food: resourceRegenAmount(
      resources.food,
      capacity.food,
      multiplier,
      options,
    ),
    energy: resourceRegenAmount(
      resources.energy,
      capacity.energy,
      multiplier,
      options,
    ),
    materials: resourceRegenAmount(
      resources.materials,
      capacity.materials,
      multiplier,
      options,
    ),
  };
}

function positiveDifference(
  a: ResourceAmount,
  b: ResourceAmount,
): ResourceAmount {
  return a > b ? a - b : 0n;
}

function clampPositiveDelta(
  delta: ResourceAmount,
  available: ResourceAmount,
): ResourceAmount {
  if (delta <= 0n) return delta;
  return delta < available ? delta : available;
}

function splitResourcesEvenly(amount: ResourceAmount): ResourceStockpile {
  const share = amount / 3n;
  return {
    food: share,
    energy: share,
    materials: amount - share - share,
  };
}

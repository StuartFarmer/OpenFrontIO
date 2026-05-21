import {
  cloneResources,
  createZeroResources,
  ResourceKinds,
} from "./Resources";
import type { ResourceAmount, ResourceStockpile } from "./Resources";

export interface ResourceBlend {
  food: number;
  energy: number;
  materials: number;
}

export interface ResourceTradeExchange {
  firstReceives: ResourceStockpile;
  secondReceives: ResourceStockpile;
}

export const EqualResourceBlend: ResourceBlend = {
  food: 1,
  energy: 1,
  materials: 1,
};

export function resourceTotal(resources: ResourceStockpile): ResourceAmount {
  return resources.food + resources.energy + resources.materials;
}

export function calculateTradeManifest(
  maxPayload: ResourceAmount,
  exporterResources: ResourceStockpile,
  importerResources: ResourceStockpile,
  importerCapacity: ResourceStockpile,
  exporterBlend: ResourceBlend = EqualResourceBlend,
  importerBlend: ResourceBlend = EqualResourceBlend,
): ResourceStockpile {
  if (maxPayload <= 0n) {
    return createZeroResources();
  }

  const surplus = resourcesAboveTarget(exporterResources, exporterBlend);
  const deficit = resourcesBelowTarget(importerResources, importerBlend);
  const headroom = resourceHeadroom(importerResources, importerCapacity);

  const raw = createZeroResources();
  for (const kind of ResourceKinds) {
    raw[kind] = minResourceAmount(surplus[kind], deficit[kind], headroom[kind]);
  }
  return scaleResourcesToMax(raw, maxPayload);
}

export function calculateTradeExchange(
  maxPayload: ResourceAmount,
  firstResources: ResourceStockpile,
  firstCapacity: ResourceStockpile,
  secondResources: ResourceStockpile,
  secondCapacity: ResourceStockpile,
  firstBlend: ResourceBlend = EqualResourceBlend,
  secondBlend: ResourceBlend = EqualResourceBlend,
): ResourceTradeExchange {
  const secondReceives = calculateTradeManifest(
    maxPayload,
    firstResources,
    secondResources,
    secondCapacity,
    firstBlend,
    secondBlend,
  );
  const firstReceives = calculateTradeManifest(
    maxPayload,
    secondResources,
    firstResources,
    firstCapacity,
    secondBlend,
    firstBlend,
  );

  const exchangeTotal = minResourceAmount(
    maxPayload,
    resourceTotal(firstReceives),
    resourceTotal(secondReceives),
  );

  if (exchangeTotal <= 0n) {
    return {
      firstReceives: createZeroResources(),
      secondReceives: createZeroResources(),
    };
  }

  return {
    firstReceives: scaleResourcesToTotal(firstReceives, exchangeTotal),
    secondReceives: scaleResourcesToTotal(secondReceives, exchangeTotal),
  };
}

function resourcesAboveTarget(
  resources: ResourceStockpile,
  blend: ResourceBlend,
): ResourceStockpile {
  const target = targetResourcesForTotal(resourceTotal(resources), blend);
  return {
    food: positiveDifference(resources.food, target.food),
    energy: positiveDifference(resources.energy, target.energy),
    materials: positiveDifference(resources.materials, target.materials),
  };
}

function resourcesBelowTarget(
  resources: ResourceStockpile,
  blend: ResourceBlend,
): ResourceStockpile {
  const target = targetResourcesForTotal(resourceTotal(resources), blend);
  return {
    food: positiveDifference(target.food, resources.food),
    energy: positiveDifference(target.energy, resources.energy),
    materials: positiveDifference(target.materials, resources.materials),
  };
}

function targetResourcesForTotal(
  total: ResourceAmount,
  blend: ResourceBlend,
): ResourceStockpile {
  if (total <= 0n) {
    return createZeroResources();
  }

  const blendTotal = blend.food + blend.energy + blend.materials;
  if (blendTotal <= 0) {
    return createZeroResources();
  }

  const food = BigInt(Math.floor((Number(total) * blend.food) / blendTotal));
  const energy = BigInt(
    Math.floor((Number(total) * blend.energy) / blendTotal),
  );
  return {
    food,
    energy,
    materials: total - food - energy,
  };
}

function resourceHeadroom(
  resources: ResourceStockpile,
  capacity: ResourceStockpile,
): ResourceStockpile {
  return {
    food: positiveDifference(capacity.food, resources.food),
    energy: positiveDifference(capacity.energy, resources.energy),
    materials: positiveDifference(capacity.materials, resources.materials),
  };
}

function scaleResourcesToMax(
  resources: ResourceStockpile,
  maxTotal: ResourceAmount,
): ResourceStockpile {
  if (resourceTotal(resources) <= maxTotal) {
    return cloneResources(resources);
  }
  return scaleResourcesToTotal(resources, maxTotal);
}

function scaleResourcesToTotal(
  resources: ResourceStockpile,
  targetTotal: ResourceAmount,
): ResourceStockpile {
  if (targetTotal <= 0n) {
    return createZeroResources();
  }

  const currentTotal = resourceTotal(resources);
  if (currentTotal <= targetTotal) {
    return cloneResources(resources);
  }

  const scaled = createZeroResources();
  for (const kind of ResourceKinds) {
    scaled[kind] = (resources[kind] * targetTotal) / currentTotal;
  }

  let remaining = targetTotal - resourceTotal(scaled);
  for (const kind of [...ResourceKinds].reverse()) {
    if (remaining <= 0n) break;
    const available = resources[kind] - scaled[kind];
    const toAdd = available < remaining ? available : remaining;
    scaled[kind] += toAdd;
    remaining -= toAdd;
  }

  return scaled;
}

function positiveDifference(
  a: ResourceAmount,
  b: ResourceAmount,
): ResourceAmount {
  return a > b ? a - b : 0n;
}

function minResourceAmount(
  first: ResourceAmount,
  ...rest: ResourceAmount[]
): ResourceAmount {
  let min = first;
  for (const value of rest) {
    if (value < min) {
      min = value;
    }
  }
  return min;
}

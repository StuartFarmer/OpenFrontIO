import type { Player } from "./FoundationPlayer";
import {
  type FoundationTroopParameters,
  foodDemandForPlayer,
  foodProductionForPeopleForPlayer,
  foodProductionForPlayer,
  foodProductionForStorageForPlayer,
  troopIncreaseRate,
} from "./FoundationTroops";

export const FOUNDATION_STARTING_FOOD_STOCK = 0;
export const FOUNDATION_BASE_FOOD_STOCK_CAPACITY = 0;
export const FOUNDATION_BASE_SILOS_OWNED = 1;
export const FOUNDATION_ADDED_STORAGE_CAPACITY_PER_SILO = 50_000;
export const FOUNDATION_STOCKPILE_GROWTH_RATE = 0.025;

export interface FoundationFoodParameters {
  startingFoodStorage: number;
  baseFoodStorageCapacity: number;
  baseSilosOwned: number;
  addedStorageCapacityPerSilo: number;
  stockpileGrowthRate: number;
}

export interface FoundationFoodStockMetrics {
  produced: number;
  producedForPeople: number;
  producedForStorage: number;
  demanded: number;
  populationCapacity: number;
  stockBefore: number;
  stockAfter: number;
  stockCapacity: number;
  stockDelta: number;
  overflow: number;
}

export interface FoundationFoodTickResult {
  player: Player;
  metrics: FoundationFoodStockMetrics;
}

export const DEFAULT_FOUNDATION_FOOD_PARAMETERS: FoundationFoodParameters = {
  startingFoodStorage: FOUNDATION_STARTING_FOOD_STOCK,
  baseFoodStorageCapacity: FOUNDATION_BASE_FOOD_STOCK_CAPACITY,
  baseSilosOwned: FOUNDATION_BASE_SILOS_OWNED,
  addedStorageCapacityPerSilo: FOUNDATION_ADDED_STORAGE_CAPACITY_PER_SILO,
  stockpileGrowthRate: FOUNDATION_STOCKPILE_GROWTH_RATE,
};

export function normalizeFoundationFoodParameters(
  parameters: Partial<FoundationFoodParameters> = {},
): FoundationFoodParameters {
  return {
    startingFoodStorage: nonNegativeNumber(
      parameters.startingFoodStorage,
      DEFAULT_FOUNDATION_FOOD_PARAMETERS.startingFoodStorage,
    ),
    baseFoodStorageCapacity: nonNegativeNumber(
      parameters.baseFoodStorageCapacity,
      DEFAULT_FOUNDATION_FOOD_PARAMETERS.baseFoodStorageCapacity,
    ),
    baseSilosOwned: nonNegativeNumber(
      parameters.baseSilosOwned,
      DEFAULT_FOUNDATION_FOOD_PARAMETERS.baseSilosOwned,
    ),
    addedStorageCapacityPerSilo: nonNegativeNumber(
      parameters.addedStorageCapacityPerSilo,
      DEFAULT_FOUNDATION_FOOD_PARAMETERS.addedStorageCapacityPerSilo,
    ),
    stockpileGrowthRate: nonNegativeNumber(
      parameters.stockpileGrowthRate,
      DEFAULT_FOUNDATION_FOOD_PARAMETERS.stockpileGrowthRate,
    ),
  };
}

/**
 * Compatibility/reference evaluator for non-runtime callers and parity tests.
 * Live Foundation runtime economy ticks are sourced from the compiled dynamics
 * graph-backed economy system in `FoundationEconomyDynamicsSystem`.
 */
export function tickFoundationFood(
  player: Player,
  parameters: FoundationFoodParameters & FoundationTroopParameters,
): FoundationFoodTickResult {
  if (!player.placement) {
    return {
      player,
      metrics: createEmptyFoundationFoodStockMetrics(player, parameters),
    };
  }

  const produced = foodProductionForPlayer(player, parameters);
  const producedForPeople = foodProductionForPeopleForPlayer(
    player,
    parameters,
  );
  const producedForStorage = foodProductionForStorageForPlayer(
    player,
    parameters,
  );
  const demanded = foodDemandForPlayer(player, parameters);
  const populationCapacity = populationCapacityForPlayer(player, parameters);
  const troopDelta = troopIncreaseRate(player, parameters);
  const metrics = evaluateFoundationFoodStock(player.foodStock, {
    produced,
    producedForPeople,
    producedForStorage,
    demanded,
    populationCapacity,
    capacity: foodStockCapacityForPlayer(player, parameters),
    stockpileGrowthRate: parameters.stockpileGrowthRate,
  });

  if (metrics.stockAfter === player.foodStock && troopDelta === 0) {
    return { player, metrics };
  }

  return {
    player: {
      ...player,
      foodStock: metrics.stockAfter,
      troops: Math.max(1, player.troops + troopDelta),
    },
    metrics,
  };
}

export function createEmptyFoundationFoodStockMetrics(
  player: Player,
  parameters: FoundationFoodParameters,
): FoundationFoodStockMetrics {
  const stockCapacity = foodStockCapacityForPlayer(player, parameters);
  return {
    produced: 0,
    producedForPeople: 0,
    producedForStorage: 0,
    demanded: 0,
    populationCapacity: 0,
    stockBefore: player.foodStock,
    stockAfter: player.foodStock,
    stockCapacity,
    stockDelta: 0,
    overflow: 0,
  };
}

export function foodStockCapacityForPlayer(
  _player: Player,
  parameters: FoundationFoodParameters,
): number {
  return (
    parameters.baseFoodStorageCapacity +
    parameters.baseSilosOwned * parameters.addedStorageCapacityPerSilo
  );
}

export function populationCapacityForPlayer(
  player: Player,
  parameters: FoundationTroopParameters,
): number {
  if (parameters.foodPerTroop <= 0) {
    return Number.POSITIVE_INFINITY;
  }
  return (
    foodProductionForPeopleForPlayer(player, parameters) /
    parameters.foodPerTroop
  );
}

function evaluateFoundationFoodStock(
  stock: number,
  inputs: {
    produced: number;
    producedForPeople: number;
    producedForStorage: number;
    demanded: number;
    populationCapacity: number;
    capacity: number;
    stockpileGrowthRate: number;
  },
): FoundationFoodStockMetrics {
  if (inputs.capacity <= 0) {
    return {
      produced: inputs.produced,
      producedForPeople: inputs.producedForPeople,
      producedForStorage: inputs.producedForStorage,
      demanded: inputs.demanded,
      populationCapacity: inputs.populationCapacity,
      stockBefore: stock,
      stockAfter: 0,
      stockCapacity: 0,
      stockDelta: -stock,
      overflow: Math.max(0, stock),
    };
  }

  const rawStockAfter =
    stock +
    inputs.producedForStorage *
      inputs.stockpileGrowthRate *
      (1 - stock / inputs.capacity);
  const stockAfter = clamp(Math.max(rawStockAfter, 1), 0, inputs.capacity);

  return {
    produced: inputs.produced,
    producedForPeople: inputs.producedForPeople,
    producedForStorage: inputs.producedForStorage,
    demanded: inputs.demanded,
    populationCapacity: inputs.populationCapacity,
    stockBefore: stock,
    stockAfter,
    stockCapacity: inputs.capacity,
    stockDelta: stockAfter - stock,
    overflow: Math.max(0, rawStockAfter - inputs.capacity),
  };
}

function nonNegativeNumber(
  value: number | undefined,
  fallback: number,
): number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0
    ? value
    : fallback;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

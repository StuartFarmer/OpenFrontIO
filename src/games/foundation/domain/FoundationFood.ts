import { runStockFlowStep } from "../../../core/systems/StockFlowRuntime";
import type { StockFlowModel } from "../../../core/systems/StockFlowSystem";
import type { Player } from "./FoundationPlayer";
import {
  type FoundationTroopParameters,
  foodDemandForPlayer,
  foodProductionForPlayer,
} from "./FoundationTroops";

export const FOUNDATION_STARTING_FOOD_STOCK = 0;
export const FOUNDATION_BASE_FOOD_STOCK_CAPACITY = 20_000;

export interface FoundationFoodParameters {
  startingFoodStorage: number;
  baseFoodStorageCapacity: number;
}

export interface FoundationFoodStockMetrics {
  produced: number;
  demanded: number;
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
};

const FOUNDATION_FOOD_STOCK_FLOW_MODEL: StockFlowModel = {
  id: "foundation-food",
  externalInputs: ["food.production", "food.demand", "food.capacity"],
  systems: [
    {
      id: "food",
      reads: ["food.production", "food.demand", "food.capacity"],
      stocks: {
        "food.stock": {
          initial: 0,
          min: 0,
          max: ({ getNumber }) => getNumber("food.capacity"),
        },
      },
      outputs: {
        "food.produced": ({ getNumber }) => getNumber("food.production"),
        "food.demanded": ({ getNumber }) => getNumber("food.demand"),
        "food.rawNextStock": ({ getNumber }) =>
          getNumber("food.stock") +
          getNumber("food.production") -
          getNumber("food.demand"),
        "food.overflow": ({ getNumber }) =>
          Math.max(
            0,
            getNumber("food.rawNextStock") - getNumber("food.capacity"),
          ),
      },
      flows: {
        "food.production": {
          stock: "food.stock",
          amount: ({ getNumber }) => getNumber("food.produced"),
        },
        "food.consumption": {
          stock: "food.stock",
          amount: ({ getNumber }) => -getNumber("food.demanded"),
        },
      },
    },
  ],
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
  };
}

export function tickFoundationFood(
  player: Player,
  parameters: FoundationFoodParameters & FoundationTroopParameters,
): FoundationFoodTickResult {
  const produced = player.placement
    ? foodProductionForPlayer(player, parameters)
    : 0;
  const demanded = player.placement
    ? foodDemandForPlayer(player, parameters)
    : 0;
  const metrics = evaluateFoundationFoodStock(player.foodStock, {
    produced,
    demanded,
    capacity: foodStockCapacityForPlayer(player, parameters),
  });

  if (metrics.stockAfter === player.foodStock) {
    return { player, metrics };
  }

  return {
    player: {
      ...player,
      foodStock: metrics.stockAfter,
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
    demanded: 0,
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
  return parameters.baseFoodStorageCapacity;
}

function evaluateFoundationFoodStock(
  stock: number,
  inputs: { produced: number; demanded: number; capacity: number },
): FoundationFoodStockMetrics {
  const result = runStockFlowStep(FOUNDATION_FOOD_STOCK_FLOW_MODEL, {
    stocks: {
      "food.stock": stock,
    },
    inputs: {
      "food.production": inputs.produced,
      "food.demand": inputs.demanded,
      "food.capacity": inputs.capacity,
    },
  });
  const stockAfter = result.stocks["food.stock"];

  return {
    produced: result.outputs["food.produced"] as number,
    demanded: result.outputs["food.demanded"] as number,
    stockBefore: stock,
    stockAfter,
    stockCapacity: inputs.capacity,
    stockDelta: stockAfter - stock,
    overflow: result.outputs["food.overflow"] as number,
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

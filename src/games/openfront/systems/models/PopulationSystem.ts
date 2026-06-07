import { PopulationResourceMechanicsConfig } from "../../../../core/configuration/MechanicsConfig";
import { PlayerType } from "../../../../core/game/Game";
import { runStockFlowStep } from "../StockFlowRuntime";
import { StockFlowModel } from "../StockFlowSystem";

export interface PopulationSystemInputs {
  readonly population: number;
  readonly tilesOwned: number;
  readonly maxPopulationOverride: number;
  readonly effectiveCapacityOverride?: number;
  readonly capacityMultiplier: number;
  readonly growthMultiplier: number;
  readonly foodSatisfactionRatio?: number;
  readonly nutritionHealth?: number;
}

export interface PopulationSystemResult {
  readonly population: number;
  readonly capacity: number;
  readonly growth: number;
  readonly births: number;
  readonly deaths: number;
  readonly nutritionHealth: number;
  readonly foodSatisfactionRatio: number;
}

export function createPopulationSystemModel(
  mechanics: PopulationResourceMechanicsConfig,
): StockFlowModel {
  return {
    id: "population-system",
    externalInputs: [
      "territory.tilesOwned",
      "player.maxPopulationOverride",
      "population.effectiveCapacityOverride",
      "player.capacityMultiplier",
      "player.populationGrowthMultiplier",
      "food.satisfactionRatio",
    ],
    systems: [
      {
        id: "population",
        reads: [
          "territory.tilesOwned",
          "player.maxPopulationOverride",
          "population.effectiveCapacityOverride",
          "player.capacityMultiplier",
          "player.populationGrowthMultiplier",
          "food.satisfactionRatio",
        ],
        stocks: {
          "population.current": { initial: 0, min: 0 },
          "population.nutritionHealth": { initial: 1, min: 0, max: 1 },
        },
        parameters: {
          maxPopulationPerTile: {
            value: mechanics.maxPopulationPerTile,
          },
          populationGrowthRate: {
            value: mechanics.populationGrowthRate,
          },
          birthNutritionThreshold: {
            value: mechanics.birthNutritionThreshold,
          },
          survivalNutritionThreshold: {
            value: mechanics.survivalNutritionThreshold,
          },
          starvationDamageRate: {
            value: mechanics.starvationDamageRate,
          },
          nutritionRecoveryRate: {
            value: mechanics.nutritionRecoveryRate,
          },
          starvationMortalityScale: {
            value: mechanics.starvationMortalityScale,
          },
        },
        outputs: {
          "population.baseCapacity": ({ getNumber, params }) => {
            const override = getNumber("player.maxPopulationOverride");
            if (override > 0) {
              return override;
            }
            return (
              getNumber("territory.tilesOwned") * params.maxPopulationPerTile
            );
          },
          "population.capacity": ({ getNumber }) =>
            getNumber("population.effectiveCapacityOverride") >= 0
              ? getNumber("population.effectiveCapacityOverride")
              : getNumber("population.baseCapacity") *
                getNumber("player.capacityMultiplier"),
          "population.logisticGrowth": ({ getNumber, params }) => {
            const population = getNumber("population.current");
            const capacity = getNumber("population.capacity");
            if (capacity <= 0) {
              return -population;
            }

            return (
              params.populationGrowthRate *
              population *
              (1 - population / capacity) *
              getNumber("player.populationGrowthMultiplier")
            );
          },
          "population.foodSatisfactionRatio": ({ getNumber }) =>
            clampUnit(getNumber("food.satisfactionRatio")),
          "population.birthFactor": ({ getNumber, params }) => {
            const threshold = clampUnit(params.birthNutritionThreshold);
            if (threshold >= 1) {
              return getNumber("population.foodSatisfactionRatio") >= 1 ? 1 : 0;
            }
            return clampUnit(
              (getNumber("population.foodSatisfactionRatio") - threshold) /
                (1 - threshold),
            );
          },
          "population.deathPressure": ({ getNumber, params }) => {
            const threshold = clampUnit(params.survivalNutritionThreshold);
            if (threshold <= 0) {
              return 0;
            }
            return clampUnit(
              (threshold - getNumber("population.foodSatisfactionRatio")) /
                threshold,
            );
          },
          "population.nutritionHealthDelta": ({ getNumber, params }) => {
            const satisfaction = getNumber("population.foodSatisfactionRatio");
            if (satisfaction >= 1) {
              return params.nutritionRecoveryRate;
            }
            return -(1 - satisfaction) * params.starvationDamageRate;
          },
          "population.births": ({ getNumber }) =>
            Math.max(
              0,
              getNumber("population.logisticGrowth") *
                getNumber("population.birthFactor"),
            ),
          "population.deaths": ({ getNumber, params }) =>
            getNumber("population.current") *
            getNumber("population.deathPressure") *
            (1 - getNumber("population.nutritionHealth")) *
            params.starvationMortalityScale,
          "population.growth": ({ getNumber }) => {
            const population = getNumber("population.current");
            const capacity = getNumber("population.capacity");
            if (population > capacity) {
              return capacity - population;
            }
            const rawGrowth =
              getNumber("population.births") - getNumber("population.deaths");
            return (
              Math.max(0, Math.min(population + rawGrowth, capacity)) -
              population
            );
          },
        },
        flows: {
          "population.growthFlow": {
            stock: "population.current",
            amount: ({ getNumber }) => getNumber("population.growth"),
          },
          "population.nutritionHealthFlow": {
            stock: "population.nutritionHealth",
            amount: ({ getNumber }) =>
              getNumber("population.nutritionHealthDelta"),
          },
        },
      },
    ],
  };
}

export function evaluatePopulationSystem(
  mechanics: PopulationResourceMechanicsConfig,
  inputs: PopulationSystemInputs,
): PopulationSystemResult {
  const result = runStockFlowStep(createPopulationSystemModel(mechanics), {
    stocks: {
      "population.current": inputs.population,
      "population.nutritionHealth": inputs.nutritionHealth ?? 1,
    },
    inputs: {
      "territory.tilesOwned": inputs.tilesOwned,
      "player.maxPopulationOverride": inputs.maxPopulationOverride,
      "population.effectiveCapacityOverride":
        inputs.effectiveCapacityOverride ?? -1,
      "player.capacityMultiplier": inputs.capacityMultiplier,
      "player.populationGrowthMultiplier": inputs.growthMultiplier,
      "food.satisfactionRatio": inputs.foodSatisfactionRatio ?? 1,
    },
  });

  return {
    population: inputs.population,
    capacity: result.outputs["population.capacity"] as number,
    growth: result.flows.find((flow) => flow.id === "population.growthFlow")
      ?.amount as number,
    births: result.outputs["population.births"] as number,
    deaths: result.outputs["population.deaths"] as number,
    nutritionHealth: result.stocks["population.nutritionHealth"],
    foodSatisfactionRatio: result.outputs[
      "population.foodSatisfactionRatio"
    ] as number,
  };
}

function clampUnit(value: number): number {
  return Math.max(0, Math.min(1, value));
}

export function capacityMultiplierForPlayerType(
  playerType: PlayerType,
  mechanics: PopulationResourceMechanicsConfig,
  difficulty: keyof PopulationResourceMechanicsConfig["nationCapacityMultipliers"],
): number {
  if (playerType === PlayerType.Bot) {
    return mechanics.botCapacityMultiplier;
  }
  if (playerType === PlayerType.Human) {
    return 1;
  }
  return mechanics.nationCapacityMultipliers[difficulty];
}

export function growthMultiplierForPlayerType(
  playerType: PlayerType,
  mechanics: PopulationResourceMechanicsConfig,
  difficulty: keyof PopulationResourceMechanicsConfig["nationTroopGrowthMultipliers"],
): number {
  if (playerType === PlayerType.Bot) {
    return mechanics.botTroopGrowthMultiplier;
  }
  if (playerType !== PlayerType.Nation) {
    return 1;
  }
  return mechanics.nationTroopGrowthMultipliers[difficulty];
}

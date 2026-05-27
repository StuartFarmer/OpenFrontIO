import { PopulationResourceMechanicsConfig } from "../../configuration/MechanicsConfig";
import { PlayerType } from "../../game/Game";
import { runStockFlowStep } from "../StockFlowRuntime";
import { StockFlowModel } from "../StockFlowSystem";

export interface PopulationSystemInputs {
  readonly population: number;
  readonly tilesOwned: number;
  readonly maxPopulationOverride: number;
  readonly effectiveCapacityOverride?: number;
  readonly capacityMultiplier: number;
  readonly growthMultiplier: number;
  readonly foodShortageRatio?: number;
}

export interface PopulationSystemResult {
  readonly population: number;
  readonly capacity: number;
  readonly growth: number;
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
      "food.shortageRatio",
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
          "food.shortageRatio",
        ],
        stocks: {
          "population.current": { initial: 0, min: 0 },
        },
        parameters: {
          maxPopulationPerTile: {
            value: mechanics.maxPopulationPerTile,
          },
          populationGrowthRate: {
            value: mechanics.populationGrowthRate,
          },
          foodShortageBirthPenalty: {
            value: mechanics.foodShortageBirthPenalty,
          },
          famineDeathRate: {
            value: mechanics.famineDeathRate,
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
          "population.birthModifier": ({ getNumber, params }) =>
            Math.max(
              0,
              1 -
                getNumber("food.shortageRatio") *
                  params.foodShortageBirthPenalty,
            ),
          "population.famineDeaths": ({ getNumber, params }) =>
            getNumber("population.current") *
            params.famineDeathRate *
            getNumber("food.shortageRatio"),
          "population.growth": ({ getNumber }) => {
            const population = getNumber("population.current");
            const capacity = getNumber("population.capacity");
            const rawGrowth =
              getNumber("population.logisticGrowth") *
                getNumber("population.birthModifier") -
              getNumber("population.famineDeaths");
            return Math.min(population + rawGrowth, capacity) - population;
          },
        },
        flows: {
          "population.growthFlow": {
            stock: "population.current",
            amount: ({ getNumber }) => getNumber("population.growth"),
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
    },
    inputs: {
      "territory.tilesOwned": inputs.tilesOwned,
      "player.maxPopulationOverride": inputs.maxPopulationOverride,
      "population.effectiveCapacityOverride":
        inputs.effectiveCapacityOverride ?? -1,
      "player.capacityMultiplier": inputs.capacityMultiplier,
      "player.populationGrowthMultiplier": inputs.growthMultiplier,
      "food.shortageRatio": inputs.foodShortageRatio ?? 0,
    },
  });

  return {
    population: inputs.population,
    capacity: result.outputs["population.capacity"] as number,
    growth: result.flows.find((flow) => flow.id === "population.growthFlow")
      ?.amount as number,
  };
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

import { PopulationResourceMechanicsConfig } from "../../configuration/MechanicsConfig";
import { PlayerType } from "../../game/Game";
import { ResourceStockpile } from "../../game/Resources";
import { evaluateFoodSystem, FoodSystemResult } from "./FoodSystem";
import {
  evaluatePopulationSystem,
  PopulationSystemInputs,
  PopulationSystemResult,
} from "./PopulationSystem";
import {
  evaluateResourceProductionSystem,
  ResourceProductionSystemInputs,
  ResourceProductionSystemResult,
} from "./ResourceProductionSystem";
import {
  evaluateWarSystem,
  WarSystemInputs,
  WarSystemResult,
} from "./WarSystem";

export interface PlayerEconomyModelInputs {
  readonly mechanics: PopulationResourceMechanicsConfig;
  readonly population: PopulationSystemInputs;
  readonly resources: ResourceProductionSystemInputs;
  readonly war: WarSystemInputs;
  readonly playerType: PlayerType;
}

export interface PlayerEconomyModelResult {
  readonly population: PopulationSystemResult;
  readonly resources: ResourceProductionSystemResult;
  readonly food: FoodSystemResult;
  readonly war: WarSystemResult;
  readonly resourceDelta: ResourceStockpile;
  readonly troopDelta: number;
}

export function evaluatePlayerEconomyModel(
  inputs: PlayerEconomyModelInputs,
): PlayerEconomyModelResult {
  const resources = evaluateResourceProductionSystem(
    inputs.mechanics,
    inputs.resources,
  );
  const war = evaluateWarSystem(inputs.mechanics, inputs.war);
  const food = evaluateFoodSystem(inputs.mechanics, {
    stock: Number(inputs.resources.resources.food),
    produced: Number(resources.delta.food),
    population: inputs.population.population,
    mobilizedPopulation: war.mobilizedPopulation,
    warFoodConsumptionMultiplier: war.foodConsumptionMultiplier,
  });
  const landPopulation = evaluatePopulationSystem(inputs.mechanics, {
    ...inputs.population,
    foodShortageRatio: 0,
  });
  const foodSupportedPopulation = foodSupportedPopulationForProduction(
    inputs.mechanics,
    Number(resources.delta.food),
  );
  const effectiveCapacity =
    inputs.mechanics.populationFoodConstraintMode === "hard-min-cap"
      ? Math.min(landPopulation.capacity, foodSupportedPopulation)
      : undefined;
  const population = evaluatePopulationSystem(inputs.mechanics, {
    ...inputs.population,
    effectiveCapacityOverride:
      effectiveCapacity !== undefined && Number.isFinite(effectiveCapacity)
        ? effectiveCapacity
        : undefined,
    foodShortageRatio:
      inputs.mechanics.populationFoodConstraintMode === "hard-min-cap"
        ? 0
        : food.shortageRatio,
  });

  return {
    population,
    resources,
    food,
    war,
    resourceDelta: {
      food: resources.delta.food - BigInt(Math.floor(food.consumed)),
      energy: resources.delta.energy,
      materials: resources.delta.materials,
    },
    troopDelta: population.growth,
  };
}

function foodSupportedPopulationForProduction(
  mechanics: PopulationResourceMechanicsConfig,
  foodProduced: number,
): number {
  if (mechanics.foodConsumptionPerPopulation <= 0) {
    return Number.POSITIVE_INFINITY;
  }
  return (
    (foodProduced * mechanics.foodAllocationToPopulation) /
    mechanics.foodConsumptionPerPopulation
  );
}

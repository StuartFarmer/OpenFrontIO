import { PopulationResourceMechanicsConfig } from "../../../../core/configuration/MechanicsConfig";
import { PlayerType } from "../../../../core/game/Game";
import { ResourceStockpile } from "../../../../core/game/Resources";
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
  readonly nutritionHealth: number;
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
  readonly nutritionHealth: number;
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
    produced: Number(resources.production.food),
    population: inputs.population.population,
    mobilizedPopulation: war.mobilizedPopulation,
    warFoodConsumptionMultiplier: war.foodConsumptionMultiplier,
  });
  const landPopulation = evaluatePopulationSystem(inputs.mechanics, {
    ...inputs.population,
    foodSatisfactionRatio: 1,
    nutritionHealth: 1,
  });
  const foodSupportedPopulation = foodSupportedPopulationForProduction(
    inputs.mechanics,
    Number(resources.production.food),
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
    foodSatisfactionRatio:
      inputs.mechanics.populationFoodConstraintMode === "hard-min-cap"
        ? 1
        : food.satisfactionRatio,
    nutritionHealth: inputs.nutritionHealth,
  });

  return {
    population,
    resources,
    food,
    war,
    resourceDelta: {
      food: BigInt(
        Math.floor(
          Math.min(
            food.reservedSurplus,
            Math.max(
              0,
              Number(resources.capacity.food - inputs.resources.resources.food),
            ),
          ),
        ),
      ),
      energy: resources.delta.energy,
      materials: resources.delta.materials,
    },
    troopDelta: population.growth,
    nutritionHealth: population.nutritionHealth,
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

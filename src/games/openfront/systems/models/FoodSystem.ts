import { PopulationResourceMechanicsConfig } from "../../../../core/configuration/MechanicsConfig";
import { runStockFlowStep } from "../StockFlowRuntime";
import { StockFlowModel } from "../StockFlowSystem";

export interface FoodSystemInputs {
  readonly stock: number;
  readonly produced: number;
  readonly population: number;
  readonly mobilizedPopulation: number;
  readonly warFoodConsumptionMultiplier: number;
}

export interface FoodSystemResult {
  readonly stock: number;
  readonly produced: number;
  readonly allocatedAvailable: number;
  readonly reservedSurplus: number;
  readonly needed: number;
  readonly consumed: number;
  readonly satisfactionRatio: number;
  readonly shortageRatio: number;
  readonly surplus: number;
  readonly delta: number;
}

export function createFoodSystemModel(
  mechanics: PopulationResourceMechanicsConfig,
): StockFlowModel {
  return {
    id: "food-system",
    externalInputs: [
      "resource.food",
      "resource.production.food",
      "population.current",
      "war.mobilizedPopulation",
      "war.foodConsumptionMultiplier",
    ],
    systems: [
      {
        id: "food",
        reads: [
          "resource.food",
          "resource.production.food",
          "population.current",
          "war.mobilizedPopulation",
          "war.foodConsumptionMultiplier",
        ],
        stocks: {
          "resource.food": { initial: 0, min: 0 },
        },
        parameters: {
          foodConsumptionPerPopulation: {
            value: mechanics.foodConsumptionPerPopulation,
          },
          foodConsumptionPerMobilizedPopulation: {
            value: mechanics.foodConsumptionPerMobilizedPopulation,
          },
          foodAllocationToPopulation: {
            value: mechanics.foodAllocationToPopulation,
          },
        },
        outputs: {
          "food.stock": ({ getNumber }) => getNumber("resource.food"),
          "food.produced": ({ getNumber }) =>
            getNumber("resource.production.food"),
          "food.baseNeeded": ({ getNumber, params }) =>
            getNumber("population.current") *
            params.foodConsumptionPerPopulation,
          "food.warNeeded": ({ getNumber, params }) =>
            getNumber("war.mobilizedPopulation") *
            params.foodConsumptionPerMobilizedPopulation,
          "food.needed": ({ getNumber }) =>
            (getNumber("food.baseNeeded") + getNumber("food.warNeeded")) *
            getNumber("war.foodConsumptionMultiplier"),
          "food.available": ({ getNumber }) =>
            getNumber("food.stock") + getNumber("food.produced"),
          "food.allocatedAvailable": ({ getNumber, params }) =>
            getNumber("food.produced") *
            Math.max(0, Math.min(1, params.foodAllocationToPopulation)),
          "food.reservedSurplus": ({ getNumber }) =>
            Math.max(
              0,
              getNumber("food.produced") - getNumber("food.allocatedAvailable"),
            ),
          "food.consumed": ({ getNumber }) =>
            Math.min(
              getNumber("food.allocatedAvailable"),
              getNumber("food.needed"),
            ),
          "food.shortageRatio": ({ getNumber }) => {
            const needed = getNumber("food.needed");
            if (needed <= 0) {
              return 0;
            }
            return Math.max(0, 1 - getNumber("food.consumed") / needed);
          },
          "food.satisfactionRatio": ({ getNumber }) => {
            const needed = getNumber("food.needed");
            if (needed <= 0) {
              return 1;
            }
            return Math.max(
              0,
              Math.min(1, getNumber("food.consumed") / needed),
            );
          },
          "food.surplus": ({ getNumber }) =>
            Math.max(
              0,
              getNumber("food.stock") + getNumber("food.reservedSurplus"),
            ),
        },
        flows: {
          "food.consume": {
            stock: "resource.food",
            amount: () => 0,
          },
        },
      },
    ],
  };
}

export function evaluateFoodSystem(
  mechanics: PopulationResourceMechanicsConfig,
  inputs: FoodSystemInputs,
): FoodSystemResult {
  const result = runStockFlowStep(createFoodSystemModel(mechanics), {
    stocks: {
      "resource.food": inputs.stock,
    },
    inputs: {
      "resource.production.food": inputs.produced,
      "population.current": inputs.population,
      "war.mobilizedPopulation": inputs.mobilizedPopulation,
      "war.foodConsumptionMultiplier": inputs.warFoodConsumptionMultiplier,
    },
  });
  const delta =
    result.flows.find((flow) => flow.id === "food.consume")?.amount ?? 0;

  return {
    stock: result.outputs["food.stock"] as number,
    produced: result.outputs["food.produced"] as number,
    allocatedAvailable: result.outputs["food.allocatedAvailable"] as number,
    reservedSurplus: result.outputs["food.reservedSurplus"] as number,
    needed: result.outputs["food.needed"] as number,
    consumed: result.outputs["food.consumed"] as number,
    satisfactionRatio: result.outputs["food.satisfactionRatio"] as number,
    shortageRatio: result.outputs["food.shortageRatio"] as number,
    surplus: result.outputs["food.surplus"] as number,
    delta,
  };
}

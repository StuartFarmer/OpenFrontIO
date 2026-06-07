import { PopulationResourceMechanicsConfig } from "../../../../core/configuration/MechanicsConfig";
import { runStockFlowStep } from "../StockFlowRuntime";
import { StockFlowModel } from "../StockFlowSystem";

export interface WarSystemInputs {
  readonly mobilizedPopulation: number;
}

export interface WarSystemResult {
  readonly isAtWar: boolean;
  readonly mobilizedPopulation: number;
  readonly foodConsumptionMultiplier: number;
  readonly casualtyFlow: number;
}

export function createWarSystemModel(
  mechanics: PopulationResourceMechanicsConfig,
): StockFlowModel {
  return {
    id: "war-system",
    externalInputs: ["war.inputMobilizedPopulation"],
    systems: [
      {
        id: "war",
        reads: ["war.inputMobilizedPopulation"],
        parameters: {
          wartimeFoodConsumptionMultiplier: {
            value: mechanics.wartimeFoodConsumptionMultiplier,
          },
        },
        outputs: {
          "war.mobilizedPopulation": ({ getNumber }) =>
            getNumber("war.inputMobilizedPopulation"),
          "war.isAtWar": ({ getNumber }) =>
            getNumber("war.inputMobilizedPopulation") > 0,
          "war.foodConsumptionMultiplier": ({ getNumber, params }) =>
            getNumber("war.inputMobilizedPopulation") > 0
              ? params.wartimeFoodConsumptionMultiplier
              : 1,
          "war.casualtyFlow": () => 0,
        },
      },
    ],
  };
}

export function evaluateWarSystem(
  mechanics: PopulationResourceMechanicsConfig,
  inputs: WarSystemInputs,
): WarSystemResult {
  const result = runStockFlowStep(createWarSystemModel(mechanics), {
    inputs: {
      "war.inputMobilizedPopulation": inputs.mobilizedPopulation,
    },
  });

  return {
    isAtWar: result.outputs["war.isAtWar"] as boolean,
    mobilizedPopulation: result.outputs["war.mobilizedPopulation"] as number,
    foodConsumptionMultiplier: result.outputs[
      "war.foodConsumptionMultiplier"
    ] as number,
    casualtyFlow: result.outputs["war.casualtyFlow"] as number,
  };
}

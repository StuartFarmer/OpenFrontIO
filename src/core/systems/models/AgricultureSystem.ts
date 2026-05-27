import { runStockFlowStep } from "../StockFlowRuntime";
import { StockFlowModel } from "../StockFlowSystem";

export interface AgricultureSystemParams {
  readonly baseFoodPerTile: number;
  readonly optimalTemperature: number;
  readonly coldSensitivity: number;
  readonly heatSensitivity: number;
  readonly technologyMultiplier: number;
}

export interface AgricultureSystemInputs {
  readonly temperature: number;
  readonly tilesOwned: number;
}

export interface AgricultureSystemResult {
  readonly temperature: number;
  readonly temperatureProductivity: number;
  readonly foodPerTile: number;
  readonly foodProduced: number;
}

export const DEFAULT_AGRICULTURE_SYSTEM_PARAMS: AgricultureSystemParams = {
  baseFoodPerTile: 1,
  optimalTemperature: 23,
  coldSensitivity: 0.01,
  heatSensitivity: 0.035,
  technologyMultiplier: 1,
};

export function createAgricultureSystemModel(
  params: AgricultureSystemParams,
): StockFlowModel {
  return {
    id: "agriculture-system",
    externalInputs: ["territory.tilesOwned"],
    systems: [
      {
        id: "agriculture",
        reads: ["territory.tilesOwned"],
        stocks: {
          "climate.temperature": { initial: params.optimalTemperature },
        },
        parameters: {
          baseFoodPerTile: { value: params.baseFoodPerTile },
          optimalTemperature: { value: params.optimalTemperature },
          coldSensitivity: { value: params.coldSensitivity },
          heatSensitivity: { value: params.heatSensitivity },
          technologyMultiplier: { value: params.technologyMultiplier },
        },
        outputs: {
          "climate.currentTemperature": ({ getNumber }) =>
            getNumber("climate.temperature"),
          "agriculture.temperatureProductivity": ({ getNumber, params }) =>
            cropTemperatureProductivity(getNumber("climate.temperature"), {
              optimalTemperature: params.optimalTemperature,
              coldSensitivity: params.coldSensitivity,
              heatSensitivity: params.heatSensitivity,
            }),
          "agriculture.foodPerTile": ({ getNumber, params }) =>
            params.baseFoodPerTile *
            getNumber("agriculture.temperatureProductivity") *
            params.technologyMultiplier,
          "agriculture.foodProduced": ({ getNumber }) =>
            getNumber("territory.tilesOwned") *
            getNumber("agriculture.foodPerTile"),
        },
      },
    ],
  };
}

export function evaluateAgricultureSystem(
  params: AgricultureSystemParams,
  inputs: AgricultureSystemInputs,
): AgricultureSystemResult {
  const result = runStockFlowStep(createAgricultureSystemModel(params), {
    stocks: {
      "climate.temperature": inputs.temperature,
    },
    inputs: {
      "territory.tilesOwned": inputs.tilesOwned,
    },
  });

  return {
    temperature: result.outputs["climate.currentTemperature"] as number,
    temperatureProductivity: result.outputs[
      "agriculture.temperatureProductivity"
    ] as number,
    foodPerTile: result.outputs["agriculture.foodPerTile"] as number,
    foodProduced: result.outputs["agriculture.foodProduced"] as number,
  };
}

export function cropTemperatureProductivity(
  temperature: number,
  params: Pick<
    AgricultureSystemParams,
    "optimalTemperature" | "coldSensitivity" | "heatSensitivity"
  >,
): number {
  const delta = temperature - params.optimalTemperature;
  const sensitivity =
    delta <= 0 ? params.coldSensitivity : params.heatSensitivity;
  return Math.max(0, Math.min(1, Math.exp(-sensitivity * delta * delta)));
}

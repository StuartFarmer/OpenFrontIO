import {
  PopulationResourceMechanicsConfig,
  ResourceWeightConfig,
} from "../../../../core/configuration/MechanicsConfig";
import {
  createZeroResources,
  resourcesFromGoldAmount,
  ResourceStockpile,
} from "../../../../core/game/Resources";
import { runStockFlowStep } from "../StockFlowRuntime";
import { StockFlowModel } from "../StockFlowSystem";

export interface ResourceProductionSystemInputs {
  readonly resources: ResourceStockpile;
  readonly tilesOwned: number;
  readonly siloLevels: number;
  readonly capacityMultiplier: number;
  readonly regenMultiplier: number;
  readonly terrainWeights: ResourceWeightConfig;
}

export interface ResourceProductionSystemResult {
  readonly capacity: ResourceStockpile;
  readonly production: ResourceStockpile;
  readonly delta: ResourceStockpile;
}

export function createResourceProductionSystemModel(
  mechanics: PopulationResourceMechanicsConfig,
): StockFlowModel {
  return {
    id: "resource-production-system",
    externalInputs: [
      "territory.tilesOwned",
      "resource.siloLevels",
      "player.resourceCapacityMultiplier",
      "player.resourceRegenMultiplier",
      "terrain.foodWeight",
      "terrain.energyWeight",
      "terrain.materialsWeight",
    ],
    systems: [
      {
        id: "resource",
        reads: [
          "territory.tilesOwned",
          "resource.siloLevels",
          "player.resourceCapacityMultiplier",
          "player.resourceRegenMultiplier",
          "terrain.foodWeight",
          "terrain.energyWeight",
          "terrain.materialsWeight",
        ],
        stocks: {
          "resource.food": {
            initial: 0,
            min: 0,
          },
          "resource.energy": {
            initial: 0,
            min: 0,
          },
          "resource.materials": {
            initial: 0,
            min: 0,
          },
        },
        parameters: {
          minBaseResourceCapacity: {
            value: mechanics.minBaseResourceCapacity,
          },
          resourceCapacityTerritoryDivisor: {
            value: mechanics.resourceCapacityTerritoryDivisor,
          },
          siloResourceCapacityIncrease: {
            value: mechanics.siloResourceCapacityIncrease,
          },
          resourceRegenBase: {
            value: mechanics.resourceRegenBase,
          },
          resourceRegenExponent: {
            value: mechanics.resourceRegenExponent,
          },
          resourceRegenDivisor: {
            value: mechanics.resourceRegenDivisor,
          },
          passiveResourceRegenMultiplier: {
            value: mechanics.passiveResourceRegenMultiplier,
          },
          foodProductionPerTile: {
            value: mechanics.foodProductionPerTile,
          },
          foodTicksPerYear: {
            value: mechanics.foodTicksPerYear,
          },
          foodProductionTechnologyMultiplier: {
            value: mechanics.foodProductionTechnologyMultiplier,
          },
        },
        outputs: {
          "resource.capacity.value": ({ getNumber, params }) => {
            const tilesOwned = getNumber("territory.tilesOwned");
            const troopStyleTerritoryCapacity =
              2 * (Math.pow(tilesOwned, 0.6) * 1000 + 50000);
            const baseCapacity =
              Math.max(
                params.minBaseResourceCapacity,
                Math.floor(
                  troopStyleTerritoryCapacity /
                    params.resourceCapacityTerritoryDivisor,
                ),
              ) +
              getNumber("resource.siloLevels") *
                params.siloResourceCapacityIncrease;
            return Math.floor(
              baseCapacity * getNumber("player.resourceCapacityMultiplier"),
            );
          },
          "resource.capacity.food": ({ getNumber }) =>
            getNumber("resource.capacity.value"),
          "resource.capacity.energy": ({ getNumber }) =>
            getNumber("resource.capacity.value"),
          "resource.capacity.materials": ({ getNumber }) =>
            getNumber("resource.capacity.value"),
          "resource.equalRegen.food": ({ getNumber, params }) =>
            resourceRegenAmountNumber(
              getNumber("resource.food"),
              getNumber("resource.capacity.food"),
              getNumber("player.resourceRegenMultiplier") *
                params.passiveResourceRegenMultiplier,
              params.resourceRegenBase,
              params.resourceRegenExponent,
              params.resourceRegenDivisor,
            ),
          "resource.equalRegen.energy": ({ getNumber, params }) =>
            resourceRegenAmountNumber(
              getNumber("resource.energy"),
              getNumber("resource.capacity.energy"),
              getNumber("player.resourceRegenMultiplier") *
                params.passiveResourceRegenMultiplier,
              params.resourceRegenBase,
              params.resourceRegenExponent,
              params.resourceRegenDivisor,
            ),
          "resource.equalRegen.materials": ({ getNumber, params }) =>
            resourceRegenAmountNumber(
              getNumber("resource.materials"),
              getNumber("resource.capacity.materials"),
              getNumber("player.resourceRegenMultiplier") *
                params.passiveResourceRegenMultiplier,
              params.resourceRegenBase,
              params.resourceRegenExponent,
              params.resourceRegenDivisor,
            ),
          "resource.production.total": ({ getNumber }) =>
            getNumber("resource.equalRegen.food") +
            getNumber("resource.equalRegen.energy") +
            getNumber("resource.equalRegen.materials"),
          "resource.production.food": ({ getNumber, params }) =>
            agricultureFoodProductionPerTick(
              getNumber("territory.tilesOwned"),
              getNumber("player.resourceRegenMultiplier"),
              params.foodProductionPerTile,
              params.foodTicksPerYear,
              params.foodProductionTechnologyMultiplier,
            ),
          "resource.storedFood": ({ getNumber }) =>
            clampPositiveDelta(
              getNumber("resource.production.food"),
              getNumber("resource.capacity.food") - getNumber("resource.food"),
            ),
          "resource.production.energy": ({ getNumber }) =>
            clampPositiveDelta(
              splitResourceProduction(
                getNumber("resource.production.total"),
                getNumber("terrain.foodWeight"),
                getNumber("terrain.energyWeight"),
                getNumber("terrain.materialsWeight"),
              ).energy,
              getNumber("resource.capacity.energy") -
                getNumber("resource.energy"),
            ),
          "resource.production.materials": ({ getNumber }) =>
            clampPositiveDelta(
              splitResourceProduction(
                getNumber("resource.production.total"),
                getNumber("terrain.foodWeight"),
                getNumber("terrain.energyWeight"),
                getNumber("terrain.materialsWeight"),
              ).materials,
              getNumber("resource.capacity.materials") -
                getNumber("resource.materials"),
            ),
        },
        flows: {
          "resource.produceFood": {
            stock: "resource.food",
            amount: ({ getNumber }) => getNumber("resource.storedFood"),
          },
          "resource.produceEnergy": {
            stock: "resource.energy",
            amount: ({ getNumber }) => getNumber("resource.production.energy"),
          },
          "resource.produceMaterials": {
            stock: "resource.materials",
            amount: ({ getNumber }) =>
              getNumber("resource.production.materials"),
          },
        },
      },
    ],
  };
}

export function evaluateResourceProductionSystem(
  mechanics: PopulationResourceMechanicsConfig,
  inputs: ResourceProductionSystemInputs,
): ResourceProductionSystemResult {
  const result = runStockFlowStep(
    createResourceProductionSystemModel(mechanics),
    {
      stocks: {
        "resource.food": Number(inputs.resources.food),
        "resource.energy": Number(inputs.resources.energy),
        "resource.materials": Number(inputs.resources.materials),
      },
      inputs: {
        "territory.tilesOwned": inputs.tilesOwned,
        "resource.siloLevels": inputs.siloLevels,
        "player.resourceCapacityMultiplier": inputs.capacityMultiplier,
        "player.resourceRegenMultiplier": inputs.regenMultiplier,
        "terrain.foodWeight": inputs.terrainWeights.food,
        "terrain.energyWeight": inputs.terrainWeights.energy,
        "terrain.materialsWeight": inputs.terrainWeights.materials,
      },
    },
  );

  const capacity = resourcesFromGoldAmount(
    BigInt(Math.floor(result.outputs["resource.capacity.value"] as number)),
  );

  return {
    capacity,
    production: {
      food: BigInt(
        Math.floor(result.outputs["resource.production.food"] as number),
      ),
      energy: BigInt(
        Math.floor(result.outputs["resource.production.energy"] as number),
      ),
      materials: BigInt(
        Math.floor(result.outputs["resource.production.materials"] as number),
      ),
    },
    delta: {
      food:
        BigInt(Math.floor(result.stocks["resource.food"])) -
        inputs.resources.food,
      energy:
        BigInt(Math.floor(result.stocks["resource.energy"])) -
        inputs.resources.energy,
      materials:
        BigInt(Math.floor(result.stocks["resource.materials"])) -
        inputs.resources.materials,
    },
  };
}

function agricultureFoodProductionPerTick(
  tilesOwned: number,
  resourceRegenMultiplier: number,
  foodProductionPerTile: number,
  ticksPerYear: number,
  technologyMultiplier: number,
): number {
  if (
    tilesOwned <= 0 ||
    resourceRegenMultiplier <= 0 ||
    foodProductionPerTile <= 0 ||
    ticksPerYear <= 0
  ) {
    return 0;
  }

  return Math.floor(
    (tilesOwned *
      foodProductionPerTile *
      Math.max(1, Math.min(10, technologyMultiplier)) *
      resourceRegenMultiplier) /
      ticksPerYear,
  );
}

export function evaluateResourceCapacity(
  mechanics: PopulationResourceMechanicsConfig,
  tilesOwned: number,
  siloLevels: number,
  capacityMultiplier: number,
): ResourceStockpile {
  return evaluateResourceProductionSystem(mechanics, {
    resources: createZeroResources(),
    tilesOwned,
    siloLevels,
    capacityMultiplier,
    regenMultiplier: 0,
    terrainWeights: {
      food: 0,
      energy: 0,
      materials: 0,
    },
  }).capacity;
}

function resourceRegenAmountNumber(
  current: number,
  capacity: number,
  multiplier: number,
  base: number,
  exponent: number,
  divisor: number,
): number {
  if (capacity <= 0 || current >= capacity || multiplier <= 0) {
    return 0;
  }

  let toAdd = base + Math.pow(current, exponent) / divisor;
  toAdd *= 1 - current / capacity;
  toAdd *= multiplier;

  const cappedDelta = Math.min(Math.max(toAdd, 0), capacity - current);
  if (cappedDelta <= 0) {
    return 0;
  }
  return Math.max(1, Math.floor(cappedDelta));
}

function splitResourceProduction(
  total: number,
  foodWeight: number,
  energyWeight: number,
  materialsWeight: number,
): ResourceWeightConfig {
  const totalWeight = foodWeight + energyWeight + materialsWeight;
  if (total <= 0 || totalWeight <= 0) {
    return {
      food: 0,
      energy: 0,
      materials: 0,
    };
  }

  const food = Math.floor((total * foodWeight) / totalWeight);
  const energy = Math.floor((total * energyWeight) / totalWeight);
  return {
    food,
    energy,
    materials: total - food - energy,
  };
}

function clampPositiveDelta(delta: number, available: number): number {
  if (delta <= 0) {
    return delta;
  }
  return delta < available ? delta : Math.max(available, 0);
}

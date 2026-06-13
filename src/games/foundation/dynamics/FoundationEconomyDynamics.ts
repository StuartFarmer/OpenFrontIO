import {
  DYNAMICS_SCHEMA_VERSION,
  type DynamicsEdgeDefinition,
  type DynamicsInputControl,
  type DynamicsNodeDefinition,
  type DynamicsSavedSystem,
  type DynamicsViewNode,
} from "../../../core/systems/dynamics";
import {
  DEFAULT_FOUNDATION_FOOD_PARAMETERS,
  DEFAULT_FOUNDATION_TROOP_PARAMETERS,
} from "../domain";

export const FOUNDATION_ECONOMY_DYNAMICS_SYSTEM_ID = "foundation-economy-model";

export const FOUNDATION_ECONOMY_NODE_IDS = {
  isPlaced: "foundation-economy-is-placed",
  tilesOwned: "foundation-economy-tiles-owned",
  foodPerTile: "foundation-economy-food-per-tile",
  foodReservePercentage: "foundation-economy-food-reserve-percentage",
  foodPerTroop: "foundation-economy-food-per-troop",
  baseFoodStorageCapacity: "foundation-economy-base-food-storage-capacity",
  baseSilosOwned: "foundation-economy-base-silos-owned",
  addedStorageCapacityPerSilo:
    "foundation-economy-added-storage-capacity-per-silo",
  stockpileGrowthRate: "foundation-economy-stockpile-growth-rate",
  maxPopulationGrowthRate: "foundation-economy-max-population-growth-rate",
  foodStockRead: "foundation-economy-food-stock-read",
  troopsRead: "foundation-economy-troops-read",
  foodProduction: "foundation-economy-food-production",
  producedForPeople: "foundation-economy-produced-for-people",
  producedForStorage: "foundation-economy-produced-for-storage",
  foodDemand: "foundation-economy-food-demand",
  populationCapacity: "foundation-economy-population-capacity",
  foodStockCapacity: "foundation-economy-food-stock-capacity",
  rawFoodStockAfter: "foundation-economy-raw-food-stock-after",
  foodStockAfter: "foundation-economy-food-stock-after",
  foodStockDelta: "foundation-economy-food-stock-delta",
  foodStockOverflow: "foundation-economy-food-stock-overflow",
  troopIncreaseRate: "foundation-economy-troop-increase-rate",
  troopsAfter: "foundation-economy-troops-after",
  foodStock: "foundation-economy-food-stock",
  troops: "foundation-economy-troops",
} as const;

type FoundationEconomyNodeId =
  (typeof FOUNDATION_ECONOMY_NODE_IDS)[keyof typeof FOUNDATION_ECONOMY_NODE_IDS];

export function createFoundationEconomyDynamicsSystem(
  options: {
    readonly inputValues?: Readonly<
      Partial<Record<FoundationEconomyNodeId, number>>
    >;
    readonly sinkInitialStates?: Readonly<
      Partial<Record<FoundationEconomyNodeId, number>>
    >;
  } = {},
): DynamicsSavedSystem {
  const inputValues = {
    ...defaultFoundationEconomyInputValues(),
    ...(options.inputValues ?? {}),
  };
  const sinkInitialStates = {
    [FOUNDATION_ECONOMY_NODE_IDS.foodStock]:
      DEFAULT_FOUNDATION_FOOD_PARAMETERS.startingFoodStorage,
    [FOUNDATION_ECONOMY_NODE_IDS.troops]:
      DEFAULT_FOUNDATION_TROOP_PARAMETERS.startingTroops,
    ...(options.sinkInitialStates ?? {}),
  };
  return {
    version: DYNAMICS_SCHEMA_VERSION,
    definition: {
      version: DYNAMICS_SCHEMA_VERSION,
      id: FOUNDATION_ECONOMY_DYNAMICS_SYSTEM_ID,
      name: "Foundation economy model",
      savedAt: 0,
      nodes: FOUNDATION_ECONOMY_DYNAMICS_NODES,
      edges: FOUNDATION_ECONOMY_DYNAMICS_EDGES,
    },
    scenario: {
      version: DYNAMICS_SCHEMA_VERSION,
      id: `${FOUNDATION_ECONOMY_DYNAMICS_SYSTEM_ID}-default`,
      systemId: FOUNDATION_ECONOMY_DYNAMICS_SYSTEM_ID,
      name: "Default",
      inputValues,
      sinkInitialStates,
    },
    view: {
      version: DYNAMICS_SCHEMA_VERSION,
      systemId: FOUNDATION_ECONOMY_DYNAMICS_SYSTEM_ID,
      nodes: FOUNDATION_ECONOMY_DYNAMICS_VIEW_NODES,
    },
  };
}

function defaultFoundationEconomyInputValues(): Record<
  FoundationEconomyNodeId,
  number
> {
  return {
    [FOUNDATION_ECONOMY_NODE_IDS.isPlaced]: 1,
    [FOUNDATION_ECONOMY_NODE_IDS.tilesOwned]: 52,
    [FOUNDATION_ECONOMY_NODE_IDS.foodPerTile]:
      DEFAULT_FOUNDATION_TROOP_PARAMETERS.foodPerTile,
    [FOUNDATION_ECONOMY_NODE_IDS.foodReservePercentage]:
      DEFAULT_FOUNDATION_TROOP_PARAMETERS.foodReservePercentage,
    [FOUNDATION_ECONOMY_NODE_IDS.foodPerTroop]:
      DEFAULT_FOUNDATION_TROOP_PARAMETERS.foodPerTroop,
    [FOUNDATION_ECONOMY_NODE_IDS.baseFoodStorageCapacity]:
      DEFAULT_FOUNDATION_FOOD_PARAMETERS.baseFoodStorageCapacity,
    [FOUNDATION_ECONOMY_NODE_IDS.baseSilosOwned]:
      DEFAULT_FOUNDATION_FOOD_PARAMETERS.baseSilosOwned,
    [FOUNDATION_ECONOMY_NODE_IDS.addedStorageCapacityPerSilo]:
      DEFAULT_FOUNDATION_FOOD_PARAMETERS.addedStorageCapacityPerSilo,
    [FOUNDATION_ECONOMY_NODE_IDS.stockpileGrowthRate]:
      DEFAULT_FOUNDATION_FOOD_PARAMETERS.stockpileGrowthRate,
    [FOUNDATION_ECONOMY_NODE_IDS.maxPopulationGrowthRate]:
      DEFAULT_FOUNDATION_TROOP_PARAMETERS.maxPopulationGrowthRate,
    [FOUNDATION_ECONOMY_NODE_IDS.foodStockRead]: 0,
    [FOUNDATION_ECONOMY_NODE_IDS.troopsRead]: 0,
    [FOUNDATION_ECONOMY_NODE_IDS.foodProduction]: 0,
    [FOUNDATION_ECONOMY_NODE_IDS.producedForPeople]: 0,
    [FOUNDATION_ECONOMY_NODE_IDS.producedForStorage]: 0,
    [FOUNDATION_ECONOMY_NODE_IDS.foodDemand]: 0,
    [FOUNDATION_ECONOMY_NODE_IDS.populationCapacity]: 0,
    [FOUNDATION_ECONOMY_NODE_IDS.foodStockCapacity]: 0,
    [FOUNDATION_ECONOMY_NODE_IDS.rawFoodStockAfter]: 0,
    [FOUNDATION_ECONOMY_NODE_IDS.foodStockAfter]: 0,
    [FOUNDATION_ECONOMY_NODE_IDS.foodStockDelta]: 0,
    [FOUNDATION_ECONOMY_NODE_IDS.foodStockOverflow]: 0,
    [FOUNDATION_ECONOMY_NODE_IDS.troopIncreaseRate]: 0,
    [FOUNDATION_ECONOMY_NODE_IDS.troopsAfter]: 0,
    [FOUNDATION_ECONOMY_NODE_IDS.foodStock]: 0,
    [FOUNDATION_ECONOMY_NODE_IDS.troops]: 0,
  };
}

const FOUNDATION_ECONOMY_DYNAMICS_NODES: readonly DynamicsNodeDefinition[] = [
  input(FOUNDATION_ECONOMY_NODE_IDS.isPlaced, "isPlaced", "user"),
  input(FOUNDATION_ECONOMY_NODE_IDS.tilesOwned, "tilesOwned", "user"),
  input(FOUNDATION_ECONOMY_NODE_IDS.foodPerTile, "foodPerTile", "constant"),
  input(
    FOUNDATION_ECONOMY_NODE_IDS.foodReservePercentage,
    "foodReservePercentage",
    "constant",
  ),
  input(FOUNDATION_ECONOMY_NODE_IDS.foodPerTroop, "foodPerTroop", "constant"),
  input(
    FOUNDATION_ECONOMY_NODE_IDS.baseFoodStorageCapacity,
    "baseFoodStorageCapacity",
    "constant",
  ),
  input(
    FOUNDATION_ECONOMY_NODE_IDS.baseSilosOwned,
    "baseSilosOwned",
    "constant",
  ),
  input(
    FOUNDATION_ECONOMY_NODE_IDS.addedStorageCapacityPerSilo,
    "addedStorageCapacityPerSilo",
    "constant",
  ),
  input(
    FOUNDATION_ECONOMY_NODE_IDS.stockpileGrowthRate,
    "stockpileGrowthRate",
    "constant",
  ),
  input(
    FOUNDATION_ECONOMY_NODE_IDS.maxPopulationGrowthRate,
    "maxPopulationGrowthRate",
    "constant",
  ),
  input(
    FOUNDATION_ECONOMY_NODE_IDS.foodStockRead,
    "foodStock",
    "read",
    FOUNDATION_ECONOMY_NODE_IDS.foodStock,
  ),
  input(
    FOUNDATION_ECONOMY_NODE_IDS.troopsRead,
    "troops",
    "read",
    FOUNDATION_ECONOMY_NODE_IDS.troops,
  ),
  operator(
    FOUNDATION_ECONOMY_NODE_IDS.foodProduction,
    "foodProduction",
    "isPlaced <= 0 ? 0 : max(0, tilesOwned) * foodPerTile",
  ),
  operator(
    FOUNDATION_ECONOMY_NODE_IDS.producedForPeople,
    "producedForPeople",
    "foodProduction * (1 - foodReservePercentage)",
  ),
  operator(
    FOUNDATION_ECONOMY_NODE_IDS.producedForStorage,
    "producedForStorage",
    "foodProduction * foodReservePercentage",
  ),
  operator(
    FOUNDATION_ECONOMY_NODE_IDS.foodDemand,
    "foodDemand",
    "isPlaced <= 0 ? 0 : troops * foodPerTroop",
  ),
  operator(
    FOUNDATION_ECONOMY_NODE_IDS.populationCapacity,
    "populationCapacity",
    "isPlaced <= 0 || foodPerTroop <= 0 ? 0 : producedForPeople / foodPerTroop",
  ),
  operator(
    FOUNDATION_ECONOMY_NODE_IDS.foodStockCapacity,
    "foodStockCapacity",
    "baseFoodStorageCapacity + baseSilosOwned * addedStorageCapacityPerSilo",
  ),
  operator(
    FOUNDATION_ECONOMY_NODE_IDS.rawFoodStockAfter,
    "rawFoodStockAfter",
    "foodStockCapacity <= 0 ? 0 : foodStock + producedForStorage * stockpileGrowthRate * (1 - foodStock / foodStockCapacity)",
  ),
  operator(
    FOUNDATION_ECONOMY_NODE_IDS.foodStockAfter,
    "foodStockAfter",
    "isPlaced <= 0 ? foodStock : foodStockCapacity <= 0 ? 0 : clamp(max(rawFoodStockAfter, 1), 0, foodStockCapacity)",
  ),
  operator(
    FOUNDATION_ECONOMY_NODE_IDS.foodStockDelta,
    "foodStockDelta",
    "foodStockAfter - foodStock",
  ),
  operator(
    FOUNDATION_ECONOMY_NODE_IDS.foodStockOverflow,
    "foodStockOverflow",
    "isPlaced <= 0 ? 0 : foodStockCapacity <= 0 ? max(0, foodStock) : max(0, rawFoodStockAfter - foodStockCapacity)",
  ),
  operator(
    FOUNDATION_ECONOMY_NODE_IDS.troopIncreaseRate,
    "troopIncreaseRate",
    "isPlaced <= 0 ? 0 : populationCapacity <= 0 ? 1 - troops : max(troops + maxPopulationGrowthRate * troops * (1 - troops / populationCapacity), 1) - troops",
  ),
  operator(
    FOUNDATION_ECONOMY_NODE_IDS.troopsAfter,
    "troopsAfter",
    "isPlaced <= 0 ? troops : max(1, troops + troopIncreaseRate)",
  ),
  sink(FOUNDATION_ECONOMY_NODE_IDS.foodStock, "foodStock", "foodStockAfter"),
  sink(FOUNDATION_ECONOMY_NODE_IDS.troops, "troops", "troopsAfter"),
];

const FOUNDATION_ECONOMY_DYNAMICS_EDGES: readonly DynamicsEdgeDefinition[] = [
  edge("economy-is-placed-to-production", "isPlaced", "foodProduction"),
  edge("economy-tiles-to-production", "tilesOwned", "foodProduction"),
  edge("economy-food-per-tile-to-production", "foodPerTile", "foodProduction"),
  edge("economy-production-to-people", "foodProduction", "producedForPeople"),
  edge(
    "economy-reserve-to-people",
    "foodReservePercentage",
    "producedForPeople",
  ),
  edge("economy-production-to-storage", "foodProduction", "producedForStorage"),
  edge(
    "economy-reserve-to-storage",
    "foodReservePercentage",
    "producedForStorage",
  ),
  edge("economy-is-placed-to-demand", "isPlaced", "foodDemand"),
  edge("economy-troops-to-demand", "troopsRead", "foodDemand"),
  edge("economy-food-per-troop-to-demand", "foodPerTroop", "foodDemand"),
  edge("economy-is-placed-to-capacity", "isPlaced", "populationCapacity"),
  edge("economy-people-to-capacity", "producedForPeople", "populationCapacity"),
  edge(
    "economy-food-per-troop-to-capacity",
    "foodPerTroop",
    "populationCapacity",
  ),
  edge(
    "economy-base-storage-to-stock-capacity",
    "baseFoodStorageCapacity",
    "foodStockCapacity",
  ),
  edge(
    "economy-base-silos-to-stock-capacity",
    "baseSilosOwned",
    "foodStockCapacity",
  ),
  edge(
    "economy-added-storage-to-stock-capacity",
    "addedStorageCapacityPerSilo",
    "foodStockCapacity",
  ),
  edge("economy-food-stock-to-raw-after", "foodStockRead", "rawFoodStockAfter"),
  edge(
    "economy-storage-production-to-raw-after",
    "producedForStorage",
    "rawFoodStockAfter",
  ),
  edge(
    "economy-stockpile-rate-to-raw-after",
    "stockpileGrowthRate",
    "rawFoodStockAfter",
  ),
  edge(
    "economy-stock-capacity-to-raw-after",
    "foodStockCapacity",
    "rawFoodStockAfter",
  ),
  edge("economy-is-placed-to-stock-after", "isPlaced", "foodStockAfter"),
  edge("economy-food-stock-to-stock-after", "foodStockRead", "foodStockAfter"),
  edge(
    "economy-raw-after-to-stock-after",
    "rawFoodStockAfter",
    "foodStockAfter",
  ),
  edge(
    "economy-stock-capacity-to-stock-after",
    "foodStockCapacity",
    "foodStockAfter",
  ),
  edge("economy-stock-after-to-delta", "foodStockAfter", "foodStockDelta"),
  edge("economy-food-stock-to-delta", "foodStockRead", "foodStockDelta"),
  edge("economy-is-placed-to-overflow", "isPlaced", "foodStockOverflow"),
  edge("economy-food-stock-to-overflow", "foodStockRead", "foodStockOverflow"),
  edge(
    "economy-raw-after-to-overflow",
    "rawFoodStockAfter",
    "foodStockOverflow",
  ),
  edge(
    "economy-stock-capacity-to-overflow",
    "foodStockCapacity",
    "foodStockOverflow",
  ),
  edge("economy-is-placed-to-troop-rate", "isPlaced", "troopIncreaseRate"),
  edge("economy-troops-to-troop-rate", "troopsRead", "troopIncreaseRate"),
  edge(
    "economy-population-capacity-to-troop-rate",
    "populationCapacity",
    "troopIncreaseRate",
  ),
  edge(
    "economy-growth-rate-to-troop-rate",
    "maxPopulationGrowthRate",
    "troopIncreaseRate",
  ),
  edge("economy-is-placed-to-troops-after", "isPlaced", "troopsAfter"),
  edge("economy-troops-to-troops-after", "troopsRead", "troopsAfter"),
  edge(
    "economy-troop-rate-to-troops-after",
    "troopIncreaseRate",
    "troopsAfter",
  ),
  edge("economy-stock-after-to-stock-sink", "foodStockAfter", "foodStock"),
  edge("economy-troops-after-to-troops-sink", "troopsAfter", "troops"),
];

const FOUNDATION_ECONOMY_DYNAMICS_VIEW_NODES: readonly DynamicsViewNode[] = [
  view(FOUNDATION_ECONOMY_NODE_IDS.isPlaced, 0, 20, {
    sliderMin: 0,
    sliderMax: 1,
  }),
  view(FOUNDATION_ECONOMY_NODE_IDS.tilesOwned, 0, 95, {
    sliderMin: 0,
    sliderMax: 300,
    actionAmount: 10,
    actionTicks: 10,
  }),
  view(FOUNDATION_ECONOMY_NODE_IDS.foodPerTile, 0, 170, {
    sliderMin: 0,
    sliderMax: 5000,
    actionAmount: 50,
    actionTicks: 10,
  }),
  view(FOUNDATION_ECONOMY_NODE_IDS.foodReservePercentage, 0, 245, {
    sliderMin: 0,
    sliderMax: 1,
    actionAmount: 0.05,
    actionTicks: 10,
  }),
  view(FOUNDATION_ECONOMY_NODE_IDS.foodPerTroop, 0, 320, {
    sliderMin: 0.1,
    sliderMax: 10,
    actionAmount: 0.1,
    actionTicks: 10,
  }),
  view(FOUNDATION_ECONOMY_NODE_IDS.baseFoodStorageCapacity, 0, 395, {
    sliderMin: 0,
    sliderMax: 200000,
    actionAmount: 1000,
    actionTicks: 10,
  }),
  view(FOUNDATION_ECONOMY_NODE_IDS.baseSilosOwned, 0, 470, {
    sliderMin: 0,
    sliderMax: 10,
    actionAmount: 1,
    actionTicks: 10,
  }),
  view(FOUNDATION_ECONOMY_NODE_IDS.addedStorageCapacityPerSilo, 0, 545, {
    sliderMin: 0,
    sliderMax: 200000,
    actionAmount: 1000,
    actionTicks: 10,
  }),
  view(FOUNDATION_ECONOMY_NODE_IDS.stockpileGrowthRate, 0, 620, {
    sliderMin: 0,
    sliderMax: 0.25,
    actionAmount: 0.005,
    actionTicks: 10,
  }),
  view(FOUNDATION_ECONOMY_NODE_IDS.maxPopulationGrowthRate, 0, 695, {
    sliderMin: 0,
    sliderMax: 0.25,
    actionAmount: 0.005,
    actionTicks: 10,
  }),
  view(FOUNDATION_ECONOMY_NODE_IDS.foodStockRead, 280, 545),
  view(FOUNDATION_ECONOMY_NODE_IDS.troopsRead, 280, 320),
  view(FOUNDATION_ECONOMY_NODE_IDS.foodProduction, 280, 105),
  view(FOUNDATION_ECONOMY_NODE_IDS.producedForPeople, 550, 95),
  view(FOUNDATION_ECONOMY_NODE_IDS.producedForStorage, 550, 205),
  view(FOUNDATION_ECONOMY_NODE_IDS.foodDemand, 550, 320),
  view(FOUNDATION_ECONOMY_NODE_IDS.populationCapacity, 820, 250),
  view(FOUNDATION_ECONOMY_NODE_IDS.foodStockCapacity, 550, 545),
  view(FOUNDATION_ECONOMY_NODE_IDS.rawFoodStockAfter, 820, 455),
  view(FOUNDATION_ECONOMY_NODE_IDS.foodStockAfter, 1100, 455),
  view(FOUNDATION_ECONOMY_NODE_IDS.foodStockDelta, 1100, 565),
  view(FOUNDATION_ECONOMY_NODE_IDS.foodStockOverflow, 1100, 675),
  view(FOUNDATION_ECONOMY_NODE_IDS.troopIncreaseRate, 1100, 245),
  view(FOUNDATION_ECONOMY_NODE_IDS.troopsAfter, 1360, 245),
  view(FOUNDATION_ECONOMY_NODE_IDS.foodStock, 1360, 455),
  view(FOUNDATION_ECONOMY_NODE_IDS.troops, 1620, 245),
];

export const FOUNDATION_ECONOMY_DYNAMICS_SYSTEM =
  createFoundationEconomyDynamicsSystem();

function input(
  id: FoundationEconomyNodeId,
  name: string,
  inputKind: "read" | "constant" | "user",
  readSinkId?: FoundationEconomyNodeId,
): DynamicsNodeDefinition {
  return { id, primitive: "input", name, inputKind, readSinkId };
}

function operator(
  id: FoundationEconomyNodeId,
  name: string,
  expression: string,
): DynamicsNodeDefinition {
  return { id, primitive: "operator", name, expression };
}

function sink(
  id: FoundationEconomyNodeId,
  name: string,
  expression: string,
): DynamicsNodeDefinition {
  return { id, primitive: "sink", name, expression };
}

function edge(
  id: string,
  sourceName: keyof typeof FOUNDATION_ECONOMY_NODE_IDS,
  targetName: keyof typeof FOUNDATION_ECONOMY_NODE_IDS,
  label?: string,
): DynamicsEdgeDefinition {
  return {
    id,
    source: FOUNDATION_ECONOMY_NODE_IDS[sourceName],
    target: FOUNDATION_ECONOMY_NODE_IDS[targetName],
    label,
  };
}

function view(
  id: FoundationEconomyNodeId,
  x: number,
  y: number,
  inputControl?: DynamicsInputControl,
): DynamicsViewNode {
  return { id, position: { x, y }, inputControl };
}

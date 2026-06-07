export interface FoundationEconomyFixtureCase {
  readonly id: string;
  readonly parameters: Readonly<Record<string, number>>;
  readonly player: {
    readonly claimedTileCount: number;
    readonly troops: number;
    readonly foodStock: number;
  } | null;
  readonly graph: {
    readonly sinkStates: Readonly<Record<string, number>>;
    readonly operatorValues: Readonly<Record<string, number>>;
  };
  readonly runtime: {
    readonly player: {
      readonly foodStock: number;
      readonly troops: number;
    };
    readonly foodStockMetrics: Readonly<Record<string, number>>;
    readonly metrics: Readonly<Record<string, number>>;
  };
  readonly snapshotMetrics: Readonly<Record<string, number>>;
}

export const FOUNDATION_ECONOMY_FIXTURES: readonly FoundationEconomyFixtureCase[] =
  [
    {
      id: "placed-balanced",
      parameters: {
        foodPerTile: 1250,
        foodReservePercentage: 0.42,
        stockpileGrowthRate: 0.031,
        maxPopulationGrowthRate: 0.047,
        addedStorageCapacityPerSilo: 80000,
      },
      player: { claimedTileCount: 84, troops: 27500, foodStock: 8400 },
      graph: {
        sinkStates: {
          "foundation-economy-food-stock": 9623.5545,
          "foundation-economy-troops": 28208.85878489327,
        },
        operatorValues: {
          "foundation-economy-food-production": 105000,
          "foundation-economy-food-demand": 27500,
          "foundation-economy-food-stock-capacity": 80000,
          "foundation-economy-produced-for-people": 60900.00000000001,
          "foundation-economy-produced-for-storage": 44100,
          "foundation-economy-population-capacity": 60900.00000000001,
          "foundation-economy-food-stock-delta": 1223.5545000000002,
          "foundation-economy-food-stock-overflow": 0,
        },
      },
      runtime: {
        player: { foodStock: 9623.5545, troops: 28208.85878489327 },
        foodStockMetrics: {
          produced: 105000,
          producedForPeople: 60900.00000000001,
          producedForStorage: 44100,
          demanded: 27500,
          populationCapacity: 60900.00000000001,
          stockAfter: 9623.5545,
          stockDelta: 1223.5545000000002,
          overflow: 0,
        },
        metrics: {
          troopIncreaseRate: 711.6986854603565,
          maxTroops: 60900.00000000001,
          foodProduction: 105000,
          foodDemand: 28208.85878489327,
          foodSupportedTroops: 60900.00000000001,
          foodSurplus: 32691.141215106738,
          foodStock: 9623.5545,
          foodStockCapacity: 80000,
          foodStockDelta: 1223.5545000000002,
          foodStockOverflow: 0,
        },
      },
      snapshotMetrics: {
        troopIncreaseRate: 708.8587848932693,
        maxTroops: 60900.00000000001,
        foodProduction: 105000,
        foodDemand: 27500,
        foodSupportedTroops: 60900.00000000001,
        foodSurplus: 33400.00000000001,
        foodStock: 8400,
        foodStockCapacity: 80000,
      },
    },
    {
      id: "unplaced-noop",
      parameters: {},
      player: null,
      graph: {
        sinkStates: {
          "foundation-economy-food-stock": 1750,
          "foundation-economy-troops": 25000,
        },
        operatorValues: {
          "foundation-economy-food-production": 0,
          "foundation-economy-food-demand": 0,
          "foundation-economy-food-stock-delta": 0,
        },
      },
      runtime: {
        player: { foodStock: 1750, troops: 25000 },
        foodStockMetrics: {
          produced: 0,
          producedForPeople: 0,
          producedForStorage: 0,
          demanded: 0,
          populationCapacity: 0,
          stockAfter: 1750,
          stockDelta: 0,
          overflow: 0,
        },
        metrics: {
          troopIncreaseRate: 0,
          maxTroops: 0,
          foodProduction: 0,
          foodDemand: 0,
          foodSupportedTroops: 0,
          foodSurplus: 0,
          foodStock: 1750,
          foodStockCapacity: 50000,
          foodStockDelta: 0,
          foodStockOverflow: 0,
        },
      },
      snapshotMetrics: {
        troopIncreaseRate: 0,
        maxTroops: 0,
        foodProduction: 0,
        foodDemand: 0,
        foodSupportedTroops: 0,
        foodSurplus: 0,
        foodStock: 1750,
        foodStockCapacity: 50000,
      },
    },
    {
      id: "runtime-growth",
      parameters: {
        foodPerTile: 1500,
        foodReservePercentage: 0.35,
        stockpileGrowthRate: 0.04,
        maxPopulationGrowthRate: 0.03,
      },
      player: { claimedTileCount: 100, troops: 31000, foodStock: 10000 },
      graph: {
        sinkStates: {
          "foundation-economy-food-stock": 11680,
          "foundation-economy-troops": 31634.30769230769,
        },
        operatorValues: {
          "foundation-economy-food-production": 150000,
          "foundation-economy-food-demand": 31000,
          "foundation-economy-food-stock-capacity": 50000,
          "foundation-economy-produced-for-people": 97500,
          "foundation-economy-produced-for-storage": 52500,
          "foundation-economy-population-capacity": 97500,
          "foundation-economy-food-stock-delta": 1680,
          "foundation-economy-food-stock-overflow": 0,
        },
      },
      runtime: {
        player: { foodStock: 11680, troops: 31634.30769230769 },
        foodStockMetrics: {
          produced: 150000,
          producedForPeople: 97500,
          producedForStorage: 52500,
          demanded: 31000,
          populationCapacity: 97500,
          stockAfter: 11680,
          stockDelta: 1680,
          overflow: 0,
        },
        metrics: {
          troopIncreaseRate: 641.1124851779714,
          maxTroops: 97500,
          foodProduction: 150000,
          foodDemand: 31634.30769230769,
          foodSupportedTroops: 97500,
          foodSurplus: 65865.69230769231,
          foodStock: 11680,
          foodStockCapacity: 50000,
          foodStockDelta: 1680,
          foodStockOverflow: 0,
        },
      },
      snapshotMetrics: {
        troopIncreaseRate: 634.3076923076915,
        maxTroops: 97500,
        foodProduction: 150000,
        foodDemand: 31000,
        foodSupportedTroops: 97500,
        foodSurplus: 66500,
        foodStock: 10000,
        foodStockCapacity: 50000,
      },
    },
  ];

export function foundationEconomyFixture(
  id: FoundationEconomyFixtureCase["id"],
): FoundationEconomyFixtureCase {
  const fixture = FOUNDATION_ECONOMY_FIXTURES.find((item) => item.id === id);
  if (fixture === undefined) {
    throw new Error(`Missing Foundation economy fixture "${id}".`);
  }
  return fixture;
}

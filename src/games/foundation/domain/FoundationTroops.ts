import type { Player } from "./FoundationPlayer";

export const FOUNDATION_STARTING_TROOPS = 25_000;
export const FOUNDATION_CITY_TROOP_INCREASE = 250_000;
export const FOUNDATION_TROOP_REGEN_BASE = 10;
export const FOUNDATION_TROOP_REGEN_EXPONENT = 0.73;
export const FOUNDATION_TROOP_REGEN_DIVISOR = 4;
export const FOUNDATION_FOOD_PER_TROOP = 1;
export const FOUNDATION_FOOD_PER_TILE = 1_000;
export const FOUNDATION_FOOD_RESERVE_PERCENTAGE = 0.5;
export const FOUNDATION_MAX_POPULATION_GROWTH_RATE = 0.05;

export interface FoundationTroopParameters {
  startingTroops: number;
  foodPerTroop: number;
  foodPerTile: number;
  foodReservePercentage: number;
  maxPopulationGrowthRate: number;
  maxTroopMultiplier: number;
  maxTroopTileExponent: number;
  maxTroopTileScale: number;
  maxTroopBase: number;
  troopRegenBase: number;
  troopRegenExponent: number;
  troopRegenDivisor: number;
}

export const DEFAULT_FOUNDATION_TROOP_PARAMETERS: FoundationTroopParameters = {
  startingTroops: FOUNDATION_STARTING_TROOPS,
  foodPerTroop: FOUNDATION_FOOD_PER_TROOP,
  foodPerTile: FOUNDATION_FOOD_PER_TILE,
  foodReservePercentage: FOUNDATION_FOOD_RESERVE_PERCENTAGE,
  maxPopulationGrowthRate: FOUNDATION_MAX_POPULATION_GROWTH_RATE,
  maxTroopMultiplier: 2,
  maxTroopTileExponent: 0.6,
  maxTroopTileScale: 1000,
  maxTroopBase: 50_000,
  troopRegenBase: FOUNDATION_TROOP_REGEN_BASE,
  troopRegenExponent: FOUNDATION_TROOP_REGEN_EXPONENT,
  troopRegenDivisor: FOUNDATION_TROOP_REGEN_DIVISOR,
};

export function normalizeFoundationTroopParameters(
  parameters: Partial<FoundationTroopParameters> = {},
): FoundationTroopParameters {
  return {
    startingTroops: nonNegativeNumber(
      parameters.startingTroops,
      DEFAULT_FOUNDATION_TROOP_PARAMETERS.startingTroops,
    ),
    foodPerTroop: positiveNumber(
      parameters.foodPerTroop,
      DEFAULT_FOUNDATION_TROOP_PARAMETERS.foodPerTroop,
    ),
    foodPerTile: nonNegativeNumber(
      parameters.foodPerTile,
      DEFAULT_FOUNDATION_TROOP_PARAMETERS.foodPerTile,
    ),
    foodReservePercentage: clampNumber(
      parameters.foodReservePercentage,
      DEFAULT_FOUNDATION_TROOP_PARAMETERS.foodReservePercentage,
      0,
      0.999,
    ),
    maxPopulationGrowthRate: nonNegativeNumber(
      parameters.maxPopulationGrowthRate,
      DEFAULT_FOUNDATION_TROOP_PARAMETERS.maxPopulationGrowthRate,
    ),
    maxTroopMultiplier: positiveNumber(
      parameters.maxTroopMultiplier,
      DEFAULT_FOUNDATION_TROOP_PARAMETERS.maxTroopMultiplier,
    ),
    maxTroopTileExponent: nonNegativeNumber(
      parameters.maxTroopTileExponent,
      DEFAULT_FOUNDATION_TROOP_PARAMETERS.maxTroopTileExponent,
    ),
    maxTroopTileScale: nonNegativeNumber(
      parameters.maxTroopTileScale,
      DEFAULT_FOUNDATION_TROOP_PARAMETERS.maxTroopTileScale,
    ),
    maxTroopBase: nonNegativeNumber(
      parameters.maxTroopBase,
      DEFAULT_FOUNDATION_TROOP_PARAMETERS.maxTroopBase,
    ),
    troopRegenBase: nonNegativeNumber(
      parameters.troopRegenBase,
      DEFAULT_FOUNDATION_TROOP_PARAMETERS.troopRegenBase,
    ),
    troopRegenExponent: nonNegativeNumber(
      parameters.troopRegenExponent,
      DEFAULT_FOUNDATION_TROOP_PARAMETERS.troopRegenExponent,
    ),
    troopRegenDivisor: positiveNumber(
      parameters.troopRegenDivisor,
      DEFAULT_FOUNDATION_TROOP_PARAMETERS.troopRegenDivisor,
    ),
  };
}

export function foodProductionForTileCount(
  tileCount: number,
  parameters: FoundationTroopParameters = DEFAULT_FOUNDATION_TROOP_PARAMETERS,
): number {
  return Math.max(0, tileCount) * parameters.foodPerTile;
}

export function foodProductionForPeopleForTileCount(
  tileCount: number,
  parameters: FoundationTroopParameters = DEFAULT_FOUNDATION_TROOP_PARAMETERS,
): number {
  return (
    foodProductionForTileCount(tileCount, parameters) *
    (1 - parameters.foodReservePercentage)
  );
}

export function foodProductionForStorageForTileCount(
  tileCount: number,
  parameters: FoundationTroopParameters = DEFAULT_FOUNDATION_TROOP_PARAMETERS,
): number {
  return (
    foodProductionForTileCount(tileCount, parameters) *
    parameters.foodReservePercentage
  );
}

export function foodSupportedTroopsForTileCount(
  tileCount: number,
  parameters: FoundationTroopParameters = DEFAULT_FOUNDATION_TROOP_PARAMETERS,
): number {
  if (parameters.foodPerTroop <= 0) {
    return Number.POSITIVE_INFINITY;
  }
  return (
    foodProductionForPeopleForTileCount(tileCount, parameters) /
    parameters.foodPerTroop
  );
}

export function maxTroopsForTileCount(
  tileCount: number,
  parameters: FoundationTroopParameters = DEFAULT_FOUNDATION_TROOP_PARAMETERS,
): number {
  return foodSupportedTroopsForTileCount(tileCount, parameters);
}

export function foodProductionForPlayer(
  player: Player,
  parameters: FoundationTroopParameters = DEFAULT_FOUNDATION_TROOP_PARAMETERS,
): number {
  const tilesOwned = player.placement?.claimedTileCount ?? 0;
  return foodProductionForTileCount(tilesOwned, parameters);
}

export function foodProductionForPeopleForPlayer(
  player: Player,
  parameters: FoundationTroopParameters = DEFAULT_FOUNDATION_TROOP_PARAMETERS,
): number {
  const tilesOwned = player.placement?.claimedTileCount ?? 0;
  return foodProductionForPeopleForTileCount(tilesOwned, parameters);
}

export function foodProductionForStorageForPlayer(
  player: Player,
  parameters: FoundationTroopParameters = DEFAULT_FOUNDATION_TROOP_PARAMETERS,
): number {
  const tilesOwned = player.placement?.claimedTileCount ?? 0;
  return foodProductionForStorageForTileCount(tilesOwned, parameters);
}

export function foodDemandForPlayer(
  player: Player,
  parameters: FoundationTroopParameters = DEFAULT_FOUNDATION_TROOP_PARAMETERS,
): number {
  return player.troops * parameters.foodPerTroop;
}

export function foodSupportedTroopsForPlayer(
  player: Player,
  parameters: FoundationTroopParameters = DEFAULT_FOUNDATION_TROOP_PARAMETERS,
): number {
  const tilesOwned = player.placement?.claimedTileCount ?? 0;
  return foodSupportedTroopsForTileCount(tilesOwned, parameters);
}

export function foodSurplusForPlayer(
  player: Player,
  parameters: FoundationTroopParameters = DEFAULT_FOUNDATION_TROOP_PARAMETERS,
): number {
  return Math.max(
    0,
    foodProductionForPeopleForPlayer(player, parameters) -
      foodDemandForPlayer(player, parameters),
  );
}

export function foodDeficitForPlayer(
  player: Player,
  parameters: FoundationTroopParameters = DEFAULT_FOUNDATION_TROOP_PARAMETERS,
): number {
  return Math.max(
    0,
    foodDemandForPlayer(player, parameters) -
      foodProductionForPeopleForPlayer(player, parameters),
  );
}

export function maxTroopsForPlayer(
  player: Player,
  parameters: FoundationTroopParameters = DEFAULT_FOUNDATION_TROOP_PARAMETERS,
): number {
  return foodSupportedTroopsForPlayer(player, parameters);
}

export function troopIncreaseRate(
  player: Player,
  parameters: FoundationTroopParameters = DEFAULT_FOUNDATION_TROOP_PARAMETERS,
): number {
  if (!player.placement) {
    return 0;
  }
  const max = foodSupportedTroopsForPlayer(player, parameters);
  const troops = player.troops;
  if (max <= 0) {
    return 1 - troops;
  }

  const nextTroops = Math.max(
    troops + parameters.maxPopulationGrowthRate * troops * (1 - troops / max),
    1,
  );
  return nextTroops - troops;
}

export function addTroopGrowth(
  player: Player,
  parameters: FoundationTroopParameters = DEFAULT_FOUNDATION_TROOP_PARAMETERS,
): Player {
  const troopDelta = troopIncreaseRate(player, parameters);
  if (troopDelta === 0) {
    return player;
  }

  return {
    ...player,
    troops: Math.max(0, player.troops + troopDelta),
  };
}

function positiveNumber(value: number | undefined, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) && value > 0
    ? value
    : fallback;
}

function nonNegativeNumber(
  value: number | undefined,
  fallback: number,
): number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0
    ? value
    : fallback;
}

function clampNumber(
  value: number | undefined,
  fallback: number,
  min: number,
  max: number,
): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return fallback;
  }
  return Math.max(min, Math.min(max, value));
}

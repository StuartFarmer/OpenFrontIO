import type { Player } from "./FoundationPlayer";

export const FOUNDATION_STARTING_TROOPS = 25_000;
export const FOUNDATION_CITY_TROOP_INCREASE = 250_000;
export const FOUNDATION_TROOP_REGEN_BASE = 10;
export const FOUNDATION_TROOP_REGEN_EXPONENT = 0.73;
export const FOUNDATION_TROOP_REGEN_DIVISOR = 4;

export interface FoundationTroopParameters {
  startingTroops: number;
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

export function maxTroopsForTileCount(
  tileCount: number,
  parameters: FoundationTroopParameters = DEFAULT_FOUNDATION_TROOP_PARAMETERS,
): number {
  return (
    parameters.maxTroopMultiplier *
    (Math.pow(tileCount, parameters.maxTroopTileExponent) *
      parameters.maxTroopTileScale +
      parameters.maxTroopBase)
  );
}

export function maxTroopsForPlayer(
  player: Player,
  parameters: FoundationTroopParameters = DEFAULT_FOUNDATION_TROOP_PARAMETERS,
): number {
  const tilesOwned = player.placement?.claimedTileCount ?? 0;
  return maxTroopsForTileCount(tilesOwned, parameters);
}

export function troopIncreaseRate(
  player: Player,
  parameters: FoundationTroopParameters = DEFAULT_FOUNDATION_TROOP_PARAMETERS,
): number {
  if (!player.placement) {
    return 0;
  }
  const max = maxTroopsForPlayer(player, parameters);
  const troops = player.troops;
  if (max <= 0) {
    return -troops;
  }

  let toAdd =
    parameters.troopRegenBase +
    Math.pow(troops, parameters.troopRegenExponent) /
      parameters.troopRegenDivisor;
  toAdd *= 1 - troops / max;

  return Math.min(troops + toAdd, max) - troops;
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

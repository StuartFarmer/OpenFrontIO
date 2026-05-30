import type { Player } from "./FoundationPlayer";

export const FOUNDATION_STARTING_TROOPS = 25_000;
export const FOUNDATION_CITY_TROOP_INCREASE = 250_000;
export const FOUNDATION_TROOP_REGEN_BASE = 10;
export const FOUNDATION_TROOP_REGEN_EXPONENT = 0.73;
export const FOUNDATION_TROOP_REGEN_DIVISOR = 4;

export function maxTroopsForTileCount(tileCount: number): number {
  return 2 * (Math.pow(tileCount, 0.6) * 1000 + 50_000);
}

export function maxTroopsForPlayer(player: Player): number {
  const tilesOwned = player.placement?.claimedTileCount ?? 0;
  return maxTroopsForTileCount(tilesOwned);
}

export function troopIncreaseRate(player: Player): number {
  if (!player.placement) {
    return 0;
  }
  const max = maxTroopsForPlayer(player);
  const troops = player.troops;
  if (max <= 0) {
    return -troops;
  }

  let toAdd =
    FOUNDATION_TROOP_REGEN_BASE +
    Math.pow(troops, FOUNDATION_TROOP_REGEN_EXPONENT) /
      FOUNDATION_TROOP_REGEN_DIVISOR;
  toAdd *= 1 - troops / max;

  return Math.min(troops + toAdd, max) - troops;
}

export function addTroopGrowth(player: Player): Player {
  const troopDelta = troopIncreaseRate(player);
  if (troopDelta === 0) {
    return player;
  }

  return {
    ...player,
    troops: Math.max(0, player.troops + troopDelta),
  };
}

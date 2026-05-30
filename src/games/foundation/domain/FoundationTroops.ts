import { Player } from "./FoundationPlayer";

export const FOUNDATION_TROOP_LOGISTIC_GROWTH_RATE = 0.016;

export function maxTroopsForPlayer(player: Player): number {
  const tilesOwned = player.placement?.claimedTileCount ?? 0;
  return 2 * (Math.pow(tilesOwned, 0.6) * 1000 + 50_000);
}

export function troopIncreaseRate(player: Player): number {
  const maxTroops = maxTroopsForPlayer(player);
  const troops = player.troops;
  if (!player.placement) {
    return 0;
  }
  if (maxTroops <= 0) {
    return -troops;
  }

  const toAdd =
    FOUNDATION_TROOP_LOGISTIC_GROWTH_RATE * troops * (1 - troops / maxTroops);

  return Math.min(troops + toAdd, maxTroops) - troops;
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

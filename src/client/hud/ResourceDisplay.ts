import type { ResourceStockpile } from "../../core/game/Resources";
import { renderNumber } from "../Utils";

export function renderResourceCostText(cost: ResourceStockpile): string {
  return `B ${renderNumber(cost.food)} / F ${renderNumber(cost.energy)} / M ${renderNumber(cost.materials)}`;
}

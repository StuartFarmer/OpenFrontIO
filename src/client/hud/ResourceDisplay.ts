import type { ResourceStockpile } from "../../core/game/Resources";
import { renderNumber } from "../Utils";

export function renderResourceCostText(cost: ResourceStockpile): string {
  return `Biomass ${renderNumber(cost.food)} / Fuels ${renderNumber(cost.energy)} / Metals ${renderNumber(cost.materials)}`;
}

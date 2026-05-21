import { renderNumber } from "../../client/Utils";
import type { ResourceStockpile } from "./Resources";

export function renderResourceCapture(resources: ResourceStockpile): string {
  return `Biomass ${renderNumber(resources.food)} / Fuels ${renderNumber(resources.energy)} / Metals ${renderNumber(resources.materials)}`;
}

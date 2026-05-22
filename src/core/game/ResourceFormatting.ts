import { renderNumber } from "../../client/Utils";
import type { ResourceKind, ResourceStockpile } from "./Resources";

const resourceIconPaths: Record<ResourceKind, string> = {
  food: "/icons/biomass-icon.svg",
  energy: "/icons/fuel-icon.svg",
  materials: "/icons/metal-icon.svg",
};

const resourceIconLabels: Record<ResourceKind, string> = {
  food: "Biomass",
  energy: "Fuels",
  materials: "Metals",
};

function renderResourceIconAmount(kind: ResourceKind, amount: bigint): string {
  const iconUrl = resourceIconPaths[kind];
  return `<span class="resource-inline" title="${resourceIconLabels[kind]}"><span aria-label="${resourceIconLabels[kind]}" class="resource-inline-icon" style="width: 1em; height: 1em; display: inline-block; vertical-align: -0.15em; background-color: currentColor; -webkit-mask: url('${iconUrl}') center / contain no-repeat; mask: url('${iconUrl}') center / contain no-repeat;"></span> ${renderNumber(amount)}</span>`;
}

export function renderResourceCapture(resources: ResourceStockpile): string {
  return [
    renderResourceIconAmount("food", resources.food),
    renderResourceIconAmount("energy", resources.energy),
    renderResourceIconAmount("materials", resources.materials),
  ].join(" / ");
}

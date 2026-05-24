export type HudResourceTone = "food" | "energy" | "materials";
export type HudStatusTone = "positive" | "negative" | "warning";
export type HudPillTone = "blue" | "green" | "gold" | "red";

export const HUD_RESOURCE_FILL: Record<HudResourceTone, string> = {
  food: "bg-green-500",
  energy: "bg-cyan-500",
  materials: "bg-stone-300",
};

export const HUD_RESOURCE_TEXT: Record<HudResourceTone, string> = {
  food: "text-green-300",
  energy: "text-cyan-300",
  materials: "text-stone-200",
};

export const HUD_RESOURCE_BORDER: Record<HudResourceTone, string> = {
  food: "border-green-400/80",
  energy: "border-cyan-400/80",
  materials: "border-stone-300/80",
};

export const HUD_STATUS_TEXT: Record<HudStatusTone, string> = {
  positive: "text-green-300",
  negative: "text-red-300",
  warning: "text-orange-300",
};

export const HUD_STATUS_PILL: Record<HudStatusTone, string> = {
  positive: "border-green-400/70 bg-green-500/20 text-green-300",
  negative: "border-red-400/70 bg-red-500/20 text-red-300",
  warning: "border-orange-400/70 bg-orange-500/20 text-orange-300",
};

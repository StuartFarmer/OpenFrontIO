import { html, type TemplateResult } from "lit";
import type { HudPillTone } from "./HudColors";
import "./HudComponents";
import type { HudMeterSegment } from "./HudComponents";

export type { HudMeterSegment };

/**
 * Compatibility helper. Prefer direct `<hud-mask-icon>` usage in new HUD code.
 */
export function renderHudMaskIcon(src: string, sizeClass: string) {
  return html`<hud-mask-icon .src=${src} .size=${sizeClass}></hud-mask-icon>`;
}

/**
 * Compatibility helper. Prefer direct `<hud-pill>` usage in new HUD code.
 */
export function renderHudIconPill(options: {
  icon: TemplateResult;
  value: string;
  tone?: HudPillTone;
  className?: string;
  valueClassName?: string;
}) {
  return html`<hud-icon-pill
    .icon=${options.icon}
    .value=${options.value}
    .tone=${options.tone ?? ""}
    .contentClass=${options.className ?? ""}
    .valueClass=${options.valueClassName ?? ""}
  ></hud-icon-pill>`;
}

/**
 * Compatibility helper. Prefer direct `<hud-meter>` usage in new HUD code.
 */
export function renderHudMeter(options: {
  segments: HudMeterSegment[];
  label: string | TemplateResult;
  className?: string;
  labelClassName?: string;
  variant?: "default" | "mini";
}) {
  return html`<hud-meter
    class=${options.className ?? ""}
    .segments=${options.segments}
    .label=${options.label}
    .labelClass=${options.labelClassName ?? "justify-center"}
    .variant=${options.variant ?? "default"}
  ></hud-meter>`;
}

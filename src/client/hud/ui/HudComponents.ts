import {
  css,
  html,
  LitElement,
  nothing,
  type CSSResultGroup,
  type TemplateResult,
} from "lit";
import { customElement, property } from "lit/decorators.js";
import { type HudPillTone, type HudResourceTone } from "./HudColors";

type HudAtomSize = "sm" | "md" | "lg" | "xl";
type HudAtomTone =
  | "inherit"
  | "default"
  | "muted"
  | "active"
  | "danger"
  | "success"
  | "gold"
  | "warning";
export type HudMeterTone = "blue" | "cyan" | "slate" | "green" | "gold" | "red";

const atomSizePx: Record<HudAtomSize, number> = {
  sm: 16,
  md: 20,
  lg: 24,
  xl: 28,
};

const toneColor: Record<HudAtomTone, string> = {
  inherit: "currentColor",
  default: "#f8fafc",
  muted: "#94a3b8",
  active: "#7dd3fc",
  danger: "#fca5a5",
  success: "#86efac",
  gold: "#fde68a",
  warning: "#fdba74",
};

const pillIconTone: Record<HudPillTone, HudAtomTone> = {
  blue: "active",
  green: "success",
  gold: "gold",
  orange: "warning",
  red: "danger",
};

const meterToneColor: Record<HudMeterTone, string> = {
  blue: "#38bdf8",
  cyan: "#22d3ee",
  slate: "#0369a1",
  green: "#22c55e",
  gold: "#fde047",
  red: "#ef4444",
};

const resourceFillColor: Record<HudResourceTone, string> = {
  food: "#22c55e",
  energy: "#06b6d4",
  materials: "#d6d3d1",
};

const hudScopedStyles = css`
  :host {
    box-sizing: border-box;
    color: var(--hud-color, #f8fafc);
    font-family:
      ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono",
      "Courier New", monospace;
    font-variant-numeric: tabular-nums;
  }

  *,
  *::before,
  *::after {
    box-sizing: border-box;
  }
`;

const hudButtonStyles = [
  hudScopedStyles,
  css`
    :host {
      display: inline-block;
    }

    button {
      min-height: 24px;
      border: 1px solid rgba(148, 163, 184, 0.6);
      border-radius: 3px;
      background: rgba(15, 23, 42, 0.72);
      color: var(--hud-button-color, #e2e8f0);
      cursor: pointer;
      font: inherit;
      font-size: 10px;
      font-weight: 700;
      line-height: 1;
      padding: 4px 8px;
    }

    button:hover:not(:disabled) {
      background: rgba(30, 41, 59, 0.9);
    }

    button:disabled {
      cursor: default;
      opacity: 0.45;
    }

    :host([variant="active"]) button {
      border-color: rgba(125, 211, 252, 0.7);
      background: rgba(14, 165, 233, 0.25);
      color: #e0f2fe;
    }

    :host([variant="danger"]) button {
      border-color: rgba(248, 113, 113, 0.7);
      color: #fca5a5;
    }
  `,
] satisfies CSSResultGroup;

export interface HudMeterSegment {
  width: number;
  tone?: HudMeterTone;
  color?: string;
}

export interface HudBlendSegment {
  tone: HudResourceTone;
  width: number;
  iconSrc: string;
  label: string;
}

export interface HudSegmentedItem {
  id: string;
  label: string;
  value?: string;
  iconSrc?: string;
  tone?: HudAtomTone;
  disabled?: boolean;
}

export class HudScopedElement extends LitElement {
  static styles: CSSResultGroup = hudScopedStyles;
}

export class HudElement extends HudScopedElement {}

export function formatHudQuantity(value: number): string {
  const sign = value < 0 ? "-" : "";
  const amount = Math.abs(value);
  const units = [
    { suffix: "b", factor: 1_000_000_000 },
    { suffix: "m", factor: 1_000_000 },
    { suffix: "k", factor: 1_000 },
  ];
  const unitIndex = units.findIndex((unit) => amount >= unit.factor);

  if (unitIndex === -1) {
    return `${sign}${Math.round(amount)}`.padStart(5);
  }

  let index = unitIndex;
  let scaled = amount / units[index].factor;

  const decimalsFor = (next: number) => (next < 10 ? 2 : next < 100 ? 1 : 0);
  let decimals = decimalsFor(scaled);
  let rounded = Math.round(scaled * 10 ** decimals) / 10 ** decimals;

  if (rounded >= 1000 && index > 0) {
    index -= 1;
    scaled = amount / units[index].factor;
    decimals = decimalsFor(scaled);
    rounded = Math.round(scaled * 10 ** decimals) / 10 ** decimals;
  }

  return `${sign}${rounded.toFixed(decimals)}${units[index].suffix}`;
}

@customElement("hud-surface")
export class HudSurface extends HudScopedElement {
  static styles = [
    hudScopedStyles,
    css`
      :host {
        display: block;
      }

      .surface {
        overflow: hidden;
        border-radius: var(--hud-radius, 3px);
        background: rgba(31, 41, 55, 0.88);
        box-shadow: 0 1px 2px rgba(0, 0, 0, 0.18);
        color: #fff;
      }
    `,
  ];

  render() {
    return html`<section class="surface" part="surface">
      <slot></slot>
    </section>`;
  }
}

@customElement("hud-surface-header")
export class HudSurfaceHeader extends HudScopedElement {
  static styles = [
    hudScopedStyles,
    css`
      :host {
        display: block;
      }

      header {
        display: flex;
        min-height: 30px;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        background: rgba(15, 23, 42, 0.72);
        padding: 4px 8px;
        font-size: 11px;
        font-weight: 700;
        letter-spacing: 0;
        line-height: 1;
        text-transform: uppercase;
      }
    `,
  ];

  render() {
    return html`<header part="header"><slot></slot></header>`;
  }
}

@customElement("hud-surface-body")
export class HudSurfaceBody extends HudScopedElement {
  static styles = [
    hudScopedStyles,
    css`
      :host {
        display: block;
      }

      .body {
        padding: var(--hud-surface-body-padding, 8px);
      }
    `,
  ];

  render() {
    return html`<div class="body" part="body"><slot></slot></div>`;
  }
}

@customElement("hud-icon")
export class HudIcon extends HudScopedElement {
  static styles = [
    hudScopedStyles,
    css`
      :host {
        display: inline-grid;
        flex: 0 0 auto;
        place-items: center;
        vertical-align: middle;
      }

      .icon {
        display: block;
        width: var(--hud-icon-size, 20px);
        height: var(--hud-icon-size, 20px);
        background: currentColor;
        mask: var(--hud-icon-src) center / contain no-repeat;
        -webkit-mask: var(--hud-icon-src) center / contain no-repeat;
      }
    `,
  ];

  @property() src = "";
  @property() size: HudAtomSize = "md";
  @property() tone: HudAtomTone = "default";
  @property() label = "";

  render() {
    const size = atomSizePx[this.size] ?? atomSizePx.md;
    const color = toneColor[this.tone] ?? toneColor.default;
    const colorStyle = this.tone === "inherit" ? "" : ` color: ${color};`;
    const iconStyle = `--hud-icon-size: ${size}px; --hud-icon-src: url('${this.src}');${colorStyle}`;

    return html`<span
      class="icon"
      style=${iconStyle}
      role=${this.label ? "img" : "presentation"}
      aria-label=${this.label || nothing}
    ></span>`;
  }
}

@customElement("hud-label")
export class HudLabel extends HudScopedElement {
  static styles = [
    hudScopedStyles,
    css`
      :host {
        display: inline-block;
        min-width: 0;
        color: var(--hud-label-color, #e2e8f0);
        font-size: var(--hud-label-size, 10px);
        font-weight: var(--hud-label-weight, 600);
        line-height: 1;
      }

      .label {
        display: block;
        min-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
    `,
  ];

  @property() tone: HudAtomTone = "default";

  render() {
    const color = toneColor[this.tone] ?? toneColor.default;

    return html`<span class="label" style="color: ${color}" part="label">
      <slot></slot>
    </span>`;
  }
}

@customElement("hud-number")
export class HudNumber extends HudScopedElement {
  static styles = [
    hudScopedStyles,
    css`
      :host {
        display: inline-block;
        width: var(--hud-number-width, 5ch);
        color: var(--hud-number-color, #f8fafc);
        font-size: var(--hud-number-size, 10px);
        font-weight: var(--hud-number-weight, 700);
        line-height: 1;
        text-align: var(--hud-number-align, left);
        white-space: pre;
      }
    `,
  ];

  @property() value = "";
  @property({ type: Boolean }) format = false;
  @property({ type: Number }) chars = 5;
  @property() align: "left" | "right" = "left";
  @property() tone: HudAtomTone = "default";

  render() {
    const color = toneColor[this.tone] ?? toneColor.default;
    const raw = this.format
      ? formatHudQuantity(Number(this.value))
      : this.value;
    const display = raw.length < this.chars ? raw.padStart(this.chars) : raw;

    return html`<span
      style="--hud-number-width: ${this.chars}ch; --hud-number-align: ${this
        .align}; color: ${color};"
      part="number"
      >${display}</span
    >`;
  }
}

@customElement("hud-button")
export class HudButton extends HudScopedElement {
  static styles = hudButtonStyles;

  @property({ reflect: true }) variant: "default" | "active" | "danger" =
    "default";
  @property({ type: Boolean, reflect: true }) disabled = false;

  render() {
    return html`<button part="button" ?disabled=${this.disabled}>
      <slot></slot>
    </button>`;
  }
}

@customElement("hud-icon-button")
export class HudIconButton extends HudButton {
  static styles = [
    ...hudButtonStyles,
    css`
      button {
        display: inline-grid;
        width: var(--hud-icon-button-size, 24px);
        min-width: var(--hud-icon-button-size, 24px);
        height: var(--hud-icon-button-size, 24px);
        min-height: var(--hud-icon-button-size, 24px);
        place-items: center;
        padding: 0;
      }
    `,
  ];

  @property() label = "";

  render() {
    return html`<button
      part="button"
      ?disabled=${this.disabled}
      aria-label=${this.label || nothing}
    >
      <slot></slot>
    </button>`;
  }
}

@customElement("hud-pill")
export class HudPill extends HudScopedElement {
  static styles = [
    hudScopedStyles,
    css`
      :host {
        display: inline-flex;
        min-width: 0;
      }

      .pill {
        display: inline-flex;
        min-height: 20px;
        min-width: 0;
        width: 100%;
        align-items: center;
        gap: 4px;
        justify-content: var(--hud-pill-justify, flex-start);
        border: 1px solid rgba(148, 163, 184, 0.6);
        border-radius: 3px;
        background: rgba(15, 23, 42, 0.72);
        color: #e2e8f0;
        font-size: 10px;
        font-weight: 700;
        line-height: 1;
        padding: 3px 6px;
        white-space: nowrap;
      }

      :host([tone="blue"]) .pill {
        border-color: rgba(125, 211, 252, 0.7);
        background: rgba(14, 165, 233, 0.25);
        color: #e0f2fe;
      }

      :host([tone="green"]) .pill {
        border-color: rgba(74, 222, 128, 0.7);
        background: rgba(34, 197, 94, 0.2);
        color: #bbf7d0;
      }

      :host([tone="gold"]) .pill {
        border-color: rgba(251, 191, 36, 0.75);
        background: rgba(245, 158, 11, 0.2);
        color: #fde68a;
      }

      :host([tone="orange"]) .pill {
        border-color: rgba(251, 146, 60, 0.7);
        background: rgba(249, 115, 22, 0.2);
        color: #fdba74;
      }

      :host([tone="red"]) .pill {
        border-color: rgba(248, 113, 113, 0.7);
        background: rgba(239, 68, 68, 0.2);
        color: #fca5a5;
      }

      .value {
        min-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
      }
    `,
  ];

  @property() value = "";
  @property({ reflect: true }) tone: HudPillTone | "" = "";
  @property({ attribute: "icon-src" }) iconSrc = "";

  render() {
    return html`<span class="pill" part="pill" translate="no">
      <slot name="icon">
        ${this.iconSrc
          ? html`<hud-icon
              .src=${this.iconSrc}
              size="sm"
              .tone=${this.iconTone}
            ></hud-icon>`
          : nothing}
      </slot>
      <span class="value" part="value"><slot>${this.value}</slot></span>
    </span>`;
  }

  private get iconTone() {
    return this.tone === "" ? "inherit" : pillIconTone[this.tone];
  }
}

@customElement("hud-mask-icon")
export class HudMaskIcon extends HudScopedElement {
  static styles = [
    hudScopedStyles,
    css`
      :host {
        display: inline-grid;
        flex: 0 0 auto;
        place-items: center;
        color: currentColor;
        vertical-align: middle;
      }

      .mask {
        display: block;
        width: var(--hud-mask-icon-size, 16px);
        height: var(--hud-mask-icon-size, 16px);
        background: currentColor;
        mask: var(--hud-mask-icon-src) center / contain no-repeat;
        -webkit-mask: var(--hud-mask-icon-src) center / contain no-repeat;
      }
    `,
  ];

  @property() src = "";
  @property() size = "h-4 w-4";

  render() {
    const pixels = this.sizePixels();
    return html`<span
      class="mask"
      style="--hud-mask-icon-src: url('${this
        .src}'); --hud-mask-icon-size: ${pixels}px;"
      aria-hidden="true"
    ></span>`;
  }

  private sizePixels() {
    const arbitrarySize = this.size.match(/h-\[(\d+)px\]/);
    if (arbitrarySize?.[1] !== undefined) return Number(arbitrarySize[1]);

    if (this.size.includes("h-2.5")) return 10;
    if (this.size.includes("h-3")) return 12;
    if (this.size.includes("h-4")) return 16;
    if (this.size.includes("h-5")) return 20;
    if (this.size.includes("h-6")) return 24;
    if (this.size.includes("h-7")) return 28;
    return 16;
  }
}

@customElement("hud-meter")
export class HudMeter extends HudScopedElement {
  static styles = [
    hudScopedStyles,
    css`
      :host {
        display: block;
        min-width: 0;
        width: 100%;
      }

      .meter {
        position: relative;
        min-height: 20px;
        overflow: hidden;
        border: 1px solid rgba(255, 255, 255, 0.2);
        border-radius: 3px;
        background: rgba(15, 23, 42, 0.7);
      }

      .meter.mini {
        height: 20px;
      }

      .stack {
        display: flex;
        height: 100%;
      }

      .fill {
        height: 100%;
        transition: width 200ms ease;
      }

      .text {
        position: absolute;
        inset: 0;
        display: flex;
        align-items: center;
        color: #fff;
        font-size: var(--hud-meter-label-size, 10px);
        font-weight: 700;
        line-height: 1;
        text-shadow: 0 1px 1px rgba(0, 0, 0, 0.8);
      }

      .text.center {
        justify-content: center;
      }

      .text.between {
        justify-content: space-between;
        padding: 0 6px;
        font-size: 10px;
      }
    `,
  ];

  @property({ attribute: false }) segments: HudMeterSegment[] = [];
  @property({ attribute: false }) label?: string | TemplateResult;
  @property() variant: "default" | "mini" = "default";
  @property({ attribute: "label-align" }) labelAlign: "center" | "between" =
    "center";

  render() {
    return html`
      <div class="meter ${this.variant === "mini" ? "mini" : ""}">
        <div class="stack">
          ${this.segments.map(
            (segment) =>
              html`<div
                class="fill"
                style="width: ${segment.width}%; background: ${this.meterSegmentColor(
                  segment,
                )};"
              ></div>`,
          )}
        </div>
        <div class="text ${this.labelAlign}">
          ${this.label ?? html`<slot></slot>`}
        </div>
      </div>
    `;
  }

  private meterSegmentColor(segment: HudMeterSegment) {
    if (segment.color !== undefined) return segment.color;
    if (segment.tone !== undefined) return meterToneColor[segment.tone];
    return "transparent";
  }
}

@customElement("hud-dual-range")
export class HudDualRange extends HudScopedElement {
  static styles = [
    hudScopedStyles,
    css`
      :host {
        display: block;
        min-width: 0;
        width: 100%;
      }

      .range {
        position: relative;
        width: 100%;
        height: 24px;
        min-width: 0;
      }

      .track,
      .fill {
        position: absolute;
        left: 0;
        right: 0;
        top: 50%;
        height: 6px;
        transform: translateY(-50%);
        border-radius: 9999px;
      }

      .track {
        border: 1px solid rgba(255, 255, 255, 0.2);
        background: rgba(15, 23, 42, 0.5);
      }

      .fill {
        background: #38bdf8;
      }

      .range-input {
        pointer-events: none;
        position: absolute;
        inset: 0;
        z-index: 1;
        width: 100%;
        height: 24px;
        margin: 0;
        appearance: none;
        -webkit-appearance: none;
        background: transparent;
      }

      .range-input::-webkit-slider-runnable-track {
        height: 24px;
        border: 0;
        background: transparent;
      }

      .range-input::-webkit-slider-thumb {
        pointer-events: auto;
        width: 18px;
        height: 18px;
        margin-top: 3px;
        border: 3px solid rgba(255, 255, 255, 0.86);
        border-radius: 9999px;
        background: #38bdf8;
        box-shadow: 0 1px 2px rgba(0, 0, 0, 0.45);
        transition:
          transform 120ms ease,
          box-shadow 120ms ease;
        appearance: none;
        -webkit-appearance: none;
      }

      .range-input:active::-webkit-slider-thumb {
        transform: scale(1.1);
        box-shadow:
          0 0 0 3px rgba(56, 189, 248, 0.24),
          0 1px 2px rgba(0, 0, 0, 0.45);
      }

      .range-input::-moz-range-track {
        height: 24px;
        border: 0;
        background: transparent;
      }

      .range-input::-moz-range-thumb {
        pointer-events: auto;
        width: 18px;
        height: 18px;
        border: 3px solid rgba(255, 255, 255, 0.86);
        border-radius: 9999px;
        background: #38bdf8;
        box-shadow: 0 1px 2px rgba(0, 0, 0, 0.45);
      }
    `,
  ];

  @property({ type: Number }) start = 0;
  @property({ type: Number }) end = 100;
  @property({ attribute: "start-label" }) startLabel = "Range start";
  @property({ attribute: "end-label" }) endLabel = "Range end";

  render() {
    return html`
      <div class="range" translate="no">
        <div class="track"></div>
        <div
          class="fill"
          style="left: ${this.start}%; right: ${100 - this.end}%"
        ></div>
        ${this.renderRangeInput(this.start, this.startLabel, "hud-start-input")}
        ${this.renderRangeInput(this.end, this.endLabel, "hud-end-input")}
        <slot></slot>
      </div>
    `;
  }

  private renderRangeInput(value: number, label: string, eventName: string) {
    return html`<input
      class="range-input"
      type="range"
      min="0"
      max="100"
      .value=${String(value)}
      @input=${(event: Event) => this.emitValue(eventName, event)}
      aria-label=${label}
    />`;
  }

  private emitValue(eventName: string, event: Event) {
    const value = Number((event.target as HTMLInputElement).value);
    const changed = eventName === "hud-start-input" ? "start" : "end";

    this.dispatchEvent(
      new CustomEvent(eventName, {
        detail: { value },
        bubbles: true,
        composed: true,
      }),
    );
    this.dispatchEvent(
      new CustomEvent("range-change", {
        detail: {
          start: changed === "start" ? value : this.start,
          end: changed === "end" ? value : this.end,
          changed,
        },
        bubbles: true,
        composed: true,
      }),
    );
  }
}

@customElement("hud-blend-slider")
export class HudBlendSlider extends HudScopedElement {
  static styles = [
    hudScopedStyles,
    css`
      :host {
        display: block;
        min-width: 0;
        width: 100%;
      }

      .blend {
        position: relative;
        width: 100%;
        height: 36px;
        min-width: 0;
      }

      .bar {
        position: absolute;
        left: 0;
        right: 0;
        top: 12px;
        height: 6px;
        overflow: hidden;
        transform: translateY(-50%);
        border: 1px solid rgba(255, 255, 255, 0.2);
        border-radius: 9999px;
        background: rgba(15, 23, 42, 0.5);
      }

      .segments {
        display: flex;
        height: 100%;
      }

      .segment {
        height: 100%;
      }

      .range-input {
        pointer-events: none;
        position: absolute;
        inset: 0 0 auto;
        z-index: 1;
        width: 100%;
        height: 24px;
        margin: 0;
        appearance: none;
        -webkit-appearance: none;
        background: transparent;
      }

      .range-input::-webkit-slider-runnable-track {
        height: 24px;
        border: 0;
        background: transparent;
      }

      .range-input::-webkit-slider-thumb {
        pointer-events: auto;
        width: 18px;
        height: 18px;
        margin-top: 3px;
        border: 3px solid rgba(255, 255, 255, 0.86);
        border-radius: 9999px;
        background: #cbd5e1;
        box-shadow:
          0 0 0 2px rgba(15, 23, 42, 0.8),
          0 1px 2px rgba(0, 0, 0, 0.45);
        transition:
          transform 120ms ease,
          box-shadow 120ms ease;
        appearance: none;
        -webkit-appearance: none;
      }

      .range-input:active::-webkit-slider-thumb {
        transform: scale(1.1);
        box-shadow:
          0 0 0 3px rgba(203, 213, 225, 0.25),
          0 1px 2px rgba(0, 0, 0, 0.45);
      }

      .range-input::-moz-range-track {
        height: 24px;
        border: 0;
        background: transparent;
      }

      .range-input::-moz-range-thumb {
        pointer-events: auto;
        width: 18px;
        height: 18px;
        border: 3px solid rgba(255, 255, 255, 0.86);
        border-radius: 9999px;
        background: #cbd5e1;
        box-shadow:
          0 0 0 2px rgba(15, 23, 42, 0.8),
          0 1px 2px rgba(0, 0, 0, 0.45);
      }

      .labels {
        pointer-events: none;
        position: absolute;
        right: 0;
        bottom: 0;
        left: 0;
        display: flex;
        overflow: hidden;
        color: #e2e8f0;
        font-size: 10px;
        font-weight: 700;
        line-height: 1;
        font-variant-numeric: tabular-nums;
      }

      .label {
        display: flex;
        min-width: 0;
        align-items: center;
        justify-content: center;
        gap: 2px;
        overflow: hidden;
        white-space: nowrap;
      }
    `,
  ];

  @property({ type: Number }) first = 0;
  @property({ type: Number }) second = 100;
  @property({ attribute: false }) segments: HudBlendSegment[] = [];
  @property({ type: Boolean, reflect: true }) readonly = false;

  render() {
    return html`
      <div class="blend" translate="no">
        <div class="bar">
          <div class="segments">
            ${this.segments.map(
              (segment) =>
                html`<div
                  class="segment"
                  style="width: ${segment.width}%; background: ${resourceFillColor[
                    segment.tone
                  ]};"
                ></div>`,
            )}
          </div>
        </div>
        ${this.readonly
          ? nothing
          : html`${this.renderRangeInput(
              this.first,
              "First split",
              "hud-first-input",
            )}
            ${this.renderRangeInput(
              this.second,
              "Second split",
              "hud-second-input",
            )}`}
        <div class="labels">
          ${this.segments.map(
            (segment) =>
              html`<span class="label" style="width: ${segment.width}%">
                ${segment.width >= 8
                  ? html`<hud-mask-icon
                        .src=${segment.iconSrc}
                        size="h-3 w-3"
                      ></hud-mask-icon>
                      <span>${segment.label}</span>`
                  : nothing}
              </span>`,
          )}
        </div>
      </div>
    `;
  }

  private renderRangeInput(value: number, label: string, eventName: string) {
    return html`<input
      class="range-input"
      type="range"
      min="0"
      max="100"
      .value=${String(value)}
      @input=${(event: Event) => this.emitValue(eventName, event)}
      aria-label=${label}
    />`;
  }

  private emitValue(eventName: string, event: Event) {
    const value = Number((event.target as HTMLInputElement).value);
    const changed = eventName === "hud-first-input" ? "first" : "second";

    this.dispatchEvent(
      new CustomEvent(eventName, {
        detail: { value },
        bubbles: true,
        composed: true,
      }),
    );
    this.dispatchEvent(
      new CustomEvent("blend-change", {
        detail: {
          first: changed === "first" ? value : this.first,
          second: changed === "second" ? value : this.second,
          changed,
        },
        bubbles: true,
        composed: true,
      }),
    );
  }
}

@customElement("hud-segmented-control")
export class HudSegmentedControl extends HudScopedElement {
  static styles = [
    hudScopedStyles,
    css`
      :host {
        display: block;
      }

      .group {
        display: flex;
        min-width: 0;
        overflow: hidden;
        border: 1px solid rgba(148, 163, 184, 0.55);
        border-radius: 3px;
        background: rgba(15, 23, 42, 0.72);
      }

      button {
        display: flex;
        min-width: 0;
        flex: 1 1 0;
        align-items: center;
        justify-content: space-between;
        gap: 6px;
        border: 0;
        border-right: 1px solid rgba(148, 163, 184, 0.24);
        background: transparent;
        color: #cbd5e1;
        cursor: pointer;
        font: inherit;
        font-size: 10px;
        font-weight: 700;
        line-height: 1;
        padding: 4px 6px;
      }

      button:last-child {
        border-right: 0;
      }

      button:hover:not(:disabled) {
        background: rgba(255, 255, 255, 0.06);
      }

      button[aria-pressed="true"] {
        background: rgba(125, 211, 252, 0.18);
        color: #f8fafc;
      }

      button:disabled {
        cursor: default;
        opacity: 0.45;
      }

      .main {
        display: inline-flex;
        min-width: 0;
        align-items: center;
        gap: 4px;
      }

      .label,
      .value {
        min-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .value {
        color: currentColor;
        opacity: 0.88;
      }
    `,
  ];

  @property({ attribute: false }) items: HudSegmentedItem[] = [];
  @property() selected = "";

  render() {
    return html`<div class="group" part="group">
      ${this.items.map((item) => {
        const selected = item.id === this.selected;
        return html`<button
          type="button"
          part="segment"
          ?disabled=${item.disabled}
          aria-pressed=${selected ? "true" : "false"}
          @click=${() => this.selectItem(item)}
        >
          <span class="main">
            ${item.iconSrc
              ? html`<hud-icon
                  .src=${item.iconSrc}
                  size="sm"
                  .tone=${item.tone ?? "default"}
                ></hud-icon>`
              : nothing}
            <span class="label">${item.label}</span>
          </span>
          ${item.value
            ? html`<span class="value">${item.value}</span>`
            : nothing}
        </button>`;
      })}
    </div>`;
  }

  private selectItem(item: HudSegmentedItem) {
    if (item.disabled || item.id === this.selected) return;

    this.dispatchEvent(
      new CustomEvent("selection-change", {
        detail: { id: item.id },
        bubbles: true,
        composed: true,
      }),
    );
  }
}

@customElement("hud-build-item")
export class HudBuildItem extends HudScopedElement {
  static styles = [
    hudScopedStyles,
    css`
      :host {
        display: inline-block;
      }

      button {
        position: relative;
        display: grid;
        width: 44px;
        grid-template-columns: auto 1fr auto;
        align-items: center;
        gap: 2px;
        border: 1px solid rgba(148, 163, 184, 0.55);
        border-radius: 3px;
        background: rgba(15, 23, 42, 0.72);
        color: #f8fafc;
        cursor: pointer;
        font: inherit;
        padding: 3px;
      }

      button:hover:not(:disabled) {
        background: rgba(255, 255, 255, 0.08);
      }

      button:disabled {
        cursor: default;
        opacity: 0.45;
      }

      :host([selected]) button {
        background: rgba(148, 163, 184, 0.2);
      }

      .hotkey {
        align-self: start;
        color: #cbd5e1;
        font-size: 9px;
        font-weight: 700;
        line-height: 1;
      }

      .fallback {
        display: inline-grid;
        width: 18px;
        height: 18px;
        place-items: center;
        font-size: 11px;
      }
    `,
  ];

  @property() hotkey = "";
  @property({ attribute: "icon-src" }) iconSrc = "";
  @property() fallback = "R";
  @property() count = "";
  @property({ type: Boolean, reflect: true }) selected = false;
  @property({ type: Boolean, reflect: true }) disabled = false;

  render() {
    return html`<button part="button" ?disabled=${this.disabled}>
      <span class="hotkey">${this.hotkey}</span>
      ${this.iconSrc
        ? html`<hud-icon .src=${this.iconSrc} size="md"></hud-icon>`
        : html`<span class="fallback" aria-hidden="true"
            >${this.fallback}</span
          >`}
      <hud-number .value=${this.count} chars="3"></hud-number>
    </button>`;
  }
}

@customElement("hud-tooltip")
export class HudTooltip extends HudScopedElement {
  static styles = [
    hudScopedStyles,
    css`
      :host {
        display: block;
      }

      .tooltip {
        max-width: 220px;
        border: 1px solid rgba(148, 163, 184, 0.55);
        border-radius: 3px;
        background: rgba(15, 23, 42, 0.94);
        color: #e2e8f0;
        font-size: 11px;
        line-height: 1.25;
        padding: 6px 8px;
      }

      .title {
        margin-bottom: 4px;
        color: #f8fafc;
        font-size: 12px;
        font-weight: 700;
      }
    `,
  ];

  @property() title = "";

  render() {
    return html`<div class="tooltip" part="tooltip">
      ${this.title
        ? html`<div class="title" part="title">${this.title}</div>`
        : nothing}
      <slot></slot>
    </div>`;
  }
}

@customElement("hud-attack-row")
export class HudAttackRow extends HudScopedElement {
  static styles = [
    hudScopedStyles,
    css`
      :host {
        display: block;
      }

      .row {
        display: flex;
        min-width: 0;
        align-items: center;
        gap: 4px;
      }

      .main {
        display: flex;
        min-width: 0;
        flex: 1 1 auto;
        align-items: center;
        gap: 4px;
        border: 0;
        border-radius: 3px;
        background: rgba(15, 23, 42, 0.72);
        color: var(--hud-attack-color, #7dd3fc);
        cursor: pointer;
        font: inherit;
        padding: 2px 4px;
      }

      .main:hover {
        background: rgba(30, 41, 59, 0.9);
      }

      :host([tone="red"]) .main {
        --hud-attack-color: #f87171;
      }

      :host([tone="blue"]) .main {
        --hud-attack-color: #7dd3fc;
      }

      .icon-slot {
        display: inline-flex;
        flex: 0 0 auto;
      }

      hud-label {
        flex: 1 1 auto;
        --hud-label-color: currentColor;
      }

      .action {
        display: inline-flex;
        flex: 0 0 auto;
      }
    `,
  ];

  @property({ reflect: true }) tone: "blue" | "red" = "blue";
  @property() amount = "";
  @property() label = "";

  render() {
    return html`<div class="row" part="row">
      <button
        class="main"
        part="main"
        type="button"
        @click=${this.emitRowClick}
        translate="no"
      >
        <span class="icon-slot"><slot name="primary-icon"></slot></span>
        <span class="icon-slot"><slot name="direction-icon"></slot></span>
        <hud-number .value=${this.amount} chars="5"></hud-number>
        <hud-label>${this.label}</hud-label>
      </button>
      <span class="action"><slot name="action"></slot></span>
    </div>`;
  }

  private emitRowClick() {
    this.dispatchEvent(
      new CustomEvent("row-click", { bubbles: true, composed: true }),
    );
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "hud-surface": HudSurface;
    "hud-surface-header": HudSurfaceHeader;
    "hud-surface-body": HudSurfaceBody;
    "hud-icon": HudIcon;
    "hud-label": HudLabel;
    "hud-number": HudNumber;
    "hud-button": HudButton;
    "hud-icon-button": HudIconButton;
    "hud-pill": HudPill;
    "hud-mask-icon": HudMaskIcon;
    "hud-meter": HudMeter;
    "hud-dual-range": HudDualRange;
    "hud-blend-slider": HudBlendSlider;
    "hud-segmented-control": HudSegmentedControl;
    "hud-build-item": HudBuildItem;
    "hud-tooltip": HudTooltip;
    "hud-attack-row": HudAttackRow;
  }
}

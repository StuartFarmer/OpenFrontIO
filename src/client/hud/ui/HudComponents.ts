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
export type HudAtomTone =
  | "inherit"
  | "default"
  | "muted"
  | "active"
  | "danger"
  | "success"
  | "gold"
  | "warning";
type HudFeedbackTone = "neutral" | "info" | "success" | "warning" | "danger";
export type HudMeterTone = "blue" | "cyan" | "slate" | "green" | "gold" | "red";
type HudAlign = "left" | "center" | "right";
type HudControlValue = string | number;

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
      width: var(--hud-button-width, auto);
      min-width: var(--hud-button-min-width, 0);
      height: var(--hud-button-height, auto);
      min-height: var(--hud-button-min-height, 24px);
      border: 1px solid var(--hud-button-border-color, rgba(148, 163, 184, 0.6));
      border-radius: var(--hud-button-radius, 3px);
      background: var(--hud-button-background, rgba(15, 23, 42, 0.72));
      color: var(--hud-button-color, #e2e8f0);
      cursor: pointer;
      font: inherit;
      font-size: 10px;
      font-weight: 700;
      line-height: 1;
      padding: var(--hud-button-padding, 4px 8px);
    }

    button:hover:not(:disabled) {
      background: var(--hud-button-hover-background, rgba(30, 41, 59, 0.9));
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

export interface HudSelectOption {
  label: string;
  value: string;
  disabled?: boolean;
}

export interface HudCommandChoiceItem {
  id: string;
  label: string;
  value?: string;
  iconSrc?: string;
  disabled?: boolean;
  locked?: boolean;
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
        min-height: var(--hud-surface-header-min-height, 30px);
        align-items: center;
        justify-content: space-between;
        gap: 8px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        background: rgba(15, 23, 42, 0.72);
        padding: var(--hud-surface-header-padding, 4px 8px);
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

@customElement("hud-kit-catalog")
export class HudKitCatalog extends HudScopedElement {
  static styles = [
    hudScopedStyles,
    css`
      :host {
        display: block;
      }

      .catalog {
        display: grid;
        width: min(100%, 1440px);
        grid-template-columns: repeat(auto-fit, minmax(min(100%, 390px), 1fr));
        align-items: start;
        gap: 18px;
        margin: 0 auto;
        padding-bottom: 56px;
      }

      slot {
        display: contents;
      }

      ::slotted(hud-kit-heading) {
        grid-column: 1 / -1;
      }
    `,
  ];

  render() {
    return html`<div class="catalog"><slot></slot></div>`;
  }
}

@customElement("hud-kit-page")
export class HudKitPage extends HudScopedElement {
  static styles = [
    hudScopedStyles,
    css`
      :host {
        display: block;
        min-height: 100vh;
        width: 100%;
        background: #0f172a;
        color: #f8fafc;
        font-family:
          Inter,
          ui-sans-serif,
          system-ui,
          -apple-system,
          BlinkMacSystemFont,
          "Segoe UI",
          sans-serif;
      }

      .page {
        min-height: 100vh;
        padding: clamp(24px, 4vw, 56px);
      }
    `,
  ];

  render() {
    return html`<main class="page"><slot></slot></main>`;
  }
}

@customElement("hud-kit-topbar")
export class HudKitTopbar extends HudScopedElement {
  static styles = [
    hudScopedStyles,
    css`
      :host {
        display: block;
        width: min(100%, 1440px);
        margin: 0 auto 26px;
        padding: 2px 2px 0;
        color: #f8fafc;
        font-family:
          Inter,
          ui-sans-serif,
          system-ui,
          -apple-system,
          BlinkMacSystemFont,
          "Segoe UI",
          sans-serif;
      }

      .title,
      .detail {
        margin: 0;
      }

      .title {
        font-size: clamp(24px, 2.2vw, 34px);
        font-weight: 700;
        letter-spacing: 0;
        line-height: 1.08;
      }

      .detail {
        max-width: 720px;
        margin-top: 8px;
        color: rgba(226, 232, 240, 0.66);
        font-size: 13px;
        line-height: 1.4;
      }
    `,
  ];

  @property() title = "";
  @property() detail = "";

  render() {
    return html`
      <h1 class="title"><slot name="title">${this.title}</slot></h1>
      <p class="detail"><slot name="detail">${this.detail}</slot></p>
    `;
  }
}

@customElement("hud-kit-heading")
export class HudKitHeading extends HudScopedElement {
  static styles = [
    hudScopedStyles,
    css`
      :host {
        display: block;
        min-width: 0;
        margin-top: 16px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.12);
        color: rgba(226, 232, 240, 0.86);
        font-size: 11px;
        font-weight: 700;
        line-height: 1.2;
        padding: 10px 2px 7px;
        text-transform: uppercase;
      }

      .heading {
        display: flex;
        align-items: baseline;
        gap: 10px;
        min-width: 0;
      }

      hud-label {
        min-width: 0;
      }
    `,
  ];

  @property() title = "";
  @property() detail = "";

  render() {
    return html`<div class="heading">
      <hud-label>${this.title}</hud-label>
      <hud-label
        tone="muted"
        style="text-transform: none; font-weight: 500; white-space: normal"
      >
        ${this.detail}
      </hud-label>
    </div>`;
  }
}

@customElement("hud-kit-section")
export class HudKitSection extends HudScopedElement {
  static styles = [
    hudScopedStyles,
    css`
      :host {
        display: block;
        min-width: 0;
      }

      hud-surface {
        height: 100%;
        --hud-radius: 6px;
        --hud-surface-header-min-height: 34px;
        --hud-surface-header-padding: 7px 10px;
      }

      .section-title {
        min-width: 0;
        flex: 0 1 auto;
      }

      .section-detail {
        min-width: 0;
        margin-left: auto;
        text-align: right;
      }

      @media (max-width: 640px) {
        .section-detail {
          display: none;
        }
      }
    `,
  ];

  @property() title = "";
  @property() detail = "";

  render() {
    return html`<hud-surface>
      <hud-surface-header>
        <hud-label class="section-title">${this.title}</hud-label>
        <hud-label
          class="section-detail"
          tone="muted"
          style="text-transform: none; font-weight: 500; white-space: normal"
        >
          ${this.detail}
        </hud-label>
      </hud-surface-header>
      <slot></slot>
    </hud-surface>`;
  }
}

@customElement("hud-kit-stage")
export class HudKitStage extends HudScopedElement {
  static styles = [
    hudScopedStyles,
    css`
      :host {
        display: block;
      }

      .stage {
        min-height: var(--hud-kit-stage-height, 132px);
        overflow: hidden;
        padding: var(--hud-kit-stage-padding, 16px);
        background: var(--hud-kit-stage-background, #172033);
      }

      .stage.preview {
        position: relative;
        min-height: var(--hud-kit-stage-height, 96px);
        background:
          linear-gradient(rgba(2, 6, 23, 0.12), rgba(2, 6, 23, 0.36)), #172033;
        transform: translateZ(0);
      }

      .stage.stack {
        display: grid;
        align-content: start;
        gap: 12px;
      }

      .stage.center {
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .stage.top {
        display: flex;
        align-items: flex-start;
        justify-content: flex-start;
      }

      slot {
        display: contents;
      }
    `,
  ];

  @property({ type: Boolean, reflect: true }) stack = false;
  @property({ type: Boolean, reflect: true }) preview = false;
  @property({ reflect: true }) align: "default" | "center" | "top" = "default";

  render() {
    return html`<div
      class="stage ${this.stack ? "stack" : ""} ${this.preview
        ? "preview"
        : ""} ${this.align === "center"
        ? "center"
        : this.align === "top"
          ? "top"
          : ""}"
    >
      <slot></slot>
    </div>`;
  }
}

@customElement("hud-kit-row")
export class HudKitRow extends HudScopedElement {
  static styles = [
    hudScopedStyles,
    css`
      :host {
        display: block;
        min-width: 0;
      }

      .row {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 10px;
        min-width: 0;
      }

      slot {
        display: contents;
      }
    `,
  ];

  render() {
    return html`<div class="row"><slot></slot></div>`;
  }
}

@customElement("hud-kit-caption")
export class HudKitCaption extends HudScopedElement {
  static styles = [
    hudScopedStyles,
    css`
      :host {
        display: inline-block;
        min-width: 78px;
        color: rgba(226, 232, 240, 0.68);
        font-size: 10px;
        font-weight: 700;
        line-height: 1;
        text-transform: uppercase;
      }
    `,
  ];

  render() {
    return html`<slot></slot>`;
  }
}

@customElement("hud-kit-frame")
export class HudKitFrame extends HudScopedElement {
  static styles = [
    hudScopedStyles,
    css`
      :host {
        display: block;
        position: relative;
        min-width: 0;
        width: min(100%, var(--hud-kit-frame-width, 100%));
      }

      :host([shell]) {
        overflow: hidden;
        border-radius: var(--hud-radius, 3px);
        background: rgba(31, 41, 55, 0.88);
        box-shadow: 0 10px 15px rgba(0, 0, 0, 0.22);
        color: white;
      }
    `,
  ];

  @property({ type: Boolean, reflect: true }) shell = false;

  render() {
    return html`<slot></slot>`;
  }
}

@customElement("hud-kit-icon-gallery")
export class HudKitIconGallery extends HudScopedElement {
  static styles = [
    hudScopedStyles,
    css`
      :host {
        display: block;
      }

      .gallery {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(112px, 1fr));
        gap: 8px;
      }

      slot {
        display: contents;
      }
    `,
  ];

  render() {
    return html`<div class="gallery"><slot></slot></div>`;
  }
}

@customElement("hud-kit-icon-sample")
export class HudKitIconSample extends HudScopedElement {
  static styles = [
    hudScopedStyles,
    css`
      :host {
        display: grid;
        min-width: 0;
        grid-template-columns: 26px minmax(0, 1fr);
        align-items: center;
        gap: 8px;
        border: 1px solid rgba(255, 255, 255, 0.12);
        border-radius: 4px;
        background: rgba(2, 6, 23, 0.28);
        color: rgba(226, 232, 240, 0.78);
        line-height: 1;
        padding: 7px 8px;
      }

      hud-label {
        min-width: 0;
      }
    `,
  ];

  @property() label = "";
  @property({ attribute: "icon-src" }) iconSrc = "";

  render() {
    return html`
      <hud-icon .src=${this.iconSrc} size="lg" .label=${this.label}></hud-icon>
      <hud-label tone="muted">${this.label}</hud-label>
    `;
  }
}

@customElement("hud-range-readout")
export class HudRangeReadout extends HudScopedElement {
  static styles = [
    hudScopedStyles,
    css`
      :host {
        pointer-events: none;
        position: absolute;
        inset: 0;
      }

      .readout {
        position: absolute;
        bottom: -12px;
        left: var(--hud-range-readout-left, 50%);
        display: inline-flex;
        transform: translateX(-50%);
        color: #cbd5e1;
        font-size: 10px;
        line-height: 1;
      }
    `,
  ];

  @property({ type: Number }) start = 0;
  @property({ type: Number }) end = 100;

  render() {
    const left = (this.start + this.end) / 2;
    return html`<hud-label
      class="readout"
      style="--hud-range-readout-left: ${left}%"
      >${this.start}-${this.end}</hud-label
    >`;
  }
}

@customElement("hud-color-swatch")
export class HudColorSwatch extends HudScopedElement {
  static styles = [
    hudScopedStyles,
    css`
      :host {
        display: inline-block;
        flex: 0 0 auto;
        width: var(--hud-color-swatch-width, 24px);
        height: var(--hud-color-swatch-height, 16px);
        border-radius: 1px;
        background: var(--hud-color-swatch-color, #0ea5e9);
      }
    `,
  ];

  @property() color = "#0ea5e9";

  render() {
    return html`<style>
      :host {
        --hud-color-swatch-color: ${this.color};
      }
    </style>`;
  }
}

@customElement("hud-player-identity")
export class HudPlayerIdentity extends HudScopedElement {
  static styles = [
    hudScopedStyles,
    css`
      :host {
        display: flex;
        min-width: 0;
        flex: 1 1 auto;
        align-items: center;
        gap: 6px;
        color: var(--hud-player-identity-color, #67e8f9);
      }

      hud-label {
        flex: 1 1 auto;
      }

      hud-action-group {
        flex: 0 0 auto;
      }
    `,
  ];

  @property() name = "";
  @property({ attribute: "icon-src" }) iconSrc = "";
  @property() emoji = "";
  @property({ attribute: "swatch-color" }) swatchColor = "#0ea5e9";

  render() {
    return html`
      <hud-color-swatch .color=${this.swatchColor}></hud-color-swatch>
      <hud-label tone="active">${this.name}</hud-label>
      <hud-action-group>
        ${this.iconSrc
          ? html`<hud-icon .src=${this.iconSrc} size="sm"></hud-icon>`
          : nothing}
        ${this.emoji ? html`<hud-label>${this.emoji}</hud-label>` : nothing}
      </hud-action-group>
    `;
  }
}

@customElement("hud-toolbar")
export class HudToolbar extends HudScopedElement {
  static styles = [
    hudScopedStyles,
    css`
      :host {
        display: inline-flex;
        width: fit-content;
        align-items: center;
        gap: var(--hud-toolbar-gap, 8px);
        border-radius: var(--hud-radius, 3px);
        background: rgba(31, 41, 55, 0.88);
        box-shadow: 0 1px 2px rgba(0, 0, 0, 0.18);
        color: #fff;
        padding: var(--hud-toolbar-padding, 4px 8px);
      }
    `,
  ];

  render() {
    return html`<slot></slot>`;
  }
}

@customElement("hud-timer-label")
export class HudTimerLabel extends HudScopedElement {
  static styles = [
    hudScopedStyles,
    css`
      :host {
        display: inline-block;
        min-width: var(--hud-timer-width, 5ch);
        color: #f8fafc;
        font-size: 12px;
        font-weight: 700;
        line-height: 1;
        text-align: center;
      }

      :host([tone="danger"]) {
        color: #f87171;
      }
    `,
  ];

  @property() value = "";
  @property({ reflect: true }) tone: "default" | "danger" = "default";

  render() {
    return html`<span part="label" translate="no"
      ><slot>${this.value}</slot></span
    >`;
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

@customElement("hud-action-group")
export class HudActionGroup extends HudScopedElement {
  static styles = [
    hudScopedStyles,
    css`
      :host {
        display: inline-flex;
        align-items: center;
        gap: var(--hud-action-group-gap, 4px);
        white-space: nowrap;
      }
    `,
  ];

  render() {
    return html`<slot></slot>`;
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

@customElement("hud-table")
export class HudTable extends HudScopedElement {
  static styles = [
    hudScopedStyles,
    css`
      :host {
        display: table;
        width: 100%;
        border-collapse: separate;
        border-spacing: 0;
        color: #f8fafc;
        font-size: 10px;
        line-height: 1.2;
      }
    `,
  ];

  render() {
    return html`<slot></slot>`;
  }
}

@customElement("hud-table-row")
export class HudTableRow extends HudScopedElement {
  static styles = [
    hudScopedStyles,
    css`
      :host {
        display: table-row;
      }

      :host([interactive]) {
        cursor: pointer;
      }

      :host([interactive]:hover) {
        background: rgba(255, 255, 255, 0.08);
      }

      :host([selected]) {
        color: #22d3ee;
        font-weight: 700;
      }
    `,
  ];

  @property({ type: Boolean, reflect: true }) interactive = false;
  @property({ type: Boolean, reflect: true }) selected = false;

  render() {
    return html`<slot></slot>`;
  }
}

@customElement("hud-table-cell")
export class HudTableCell extends HudScopedElement {
  static styles = [
    hudScopedStyles,
    css`
      :host {
        display: table-cell;
        height: 24px;
        vertical-align: middle;
        color: inherit;
        text-align: right;
        white-space: nowrap;
      }

      .cell {
        display: flex;
        min-height: 24px;
        align-items: center;
        justify-content: flex-end;
        padding: var(--hud-table-cell-padding, 5px 12px);
        border-right: 1px solid rgba(255, 255, 255, 0.18);
        border-bottom: 1px solid rgba(255, 255, 255, 0.14);
        color: inherit;
      }

      :host(:last-child) .cell {
        border-right: 0;
      }

      :host([align="left"]) .cell {
        justify-content: flex-start;
      }

      :host([align="center"]) .cell {
        justify-content: center;
      }

      :host([header]) .cell {
        background: rgba(15, 23, 42, 0.3);
        color: rgba(203, 213, 225, 0.7);
        font-weight: 700;
      }

      :host([header]:not(:last-child)) .cell {
        border-right-color: rgba(255, 255, 255, 0.16);
      }

      :host([truncate]) .cell {
        overflow: hidden;
        text-overflow: ellipsis;
      }
    `,
  ];

  @property({ reflect: true }) align: HudAlign = "right";
  @property({ type: Boolean, reflect: true }) header = false;
  @property({ type: Boolean, reflect: true }) truncate = false;

  render() {
    return html`<span class="cell" part="cell"><slot></slot></span>`;
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

@customElement("hud-stat-grid")
export class HudStatGrid extends HudScopedElement {
  static styles = [
    hudScopedStyles,
    css`
      :host {
        display: block;
      }

      .grid {
        display: grid;
        grid-template-columns: repeat(
          var(--hud-stat-columns, 4),
          minmax(0, 1fr)
        );
        gap: var(--hud-stat-gap, 8px);
        color: #e2e8f0;
        font-size: 11px;
        line-height: 1.2;
      }
    `,
  ];

  @property({ type: Number, reflect: true }) columns = 4;

  render() {
    return html`<div class="grid" style="--hud-stat-columns: ${this.columns};">
      <slot></slot>
    </div>`;
  }
}

@customElement("hud-stat")
export class HudStat extends HudScopedElement {
  static styles = [
    hudScopedStyles,
    css`
      :host {
        display: block;
        min-width: 0;
      }

      .label {
        color: #94a3b8;
      }

      .value {
        min-width: 0;
        color: #cbd5e1;
        font-variant-numeric: tabular-nums;
      }

      :host([tone="success"]) .value {
        color: #86efac;
      }

      :host([tone="danger"]) .value {
        color: #fca5a5;
      }

      :host([tone="warning"]) .value {
        color: #fdba74;
      }

      :host([tone="active"]) .value {
        color: #7dd3fc;
      }
    `,
  ];

  @property() label = "";
  @property() value = "";
  @property({ reflect: true }) tone: HudAtomTone = "default";

  render() {
    return html`<div class="label" part="label">
        <slot name="label">${this.label}</slot>
      </div>
      <div class="value" part="value">
        <slot>${this.value}</slot>
      </div>`;
  }
}

@customElement("hud-form-row")
export class HudFormRow extends HudScopedElement {
  static styles = [
    hudScopedStyles,
    css`
      :host {
        display: grid;
        grid-template-columns: var(--hud-form-label-width, 5rem) minmax(0, 1fr);
        align-items: center;
        gap: var(--hud-form-gap, 8px);
      }
    `,
  ];

  render() {
    return html`<slot></slot>`;
  }
}

@customElement("hud-field-label")
export class HudFieldLabel extends HudScopedElement {
  static styles = [
    hudScopedStyles,
    css`
      :host {
        display: inline-block;
        color: rgba(203, 213, 225, 0.8);
        font-size: 10px;
        font-weight: 700;
        line-height: 1;
      }
    `,
  ];

  @property() value = "";

  render() {
    return html`<label part="label"><slot>${this.value}</slot></label>`;
  }
}

@customElement("hud-input")
export class HudInput extends HudScopedElement {
  static styles = [
    hudScopedStyles,
    css`
      :host {
        display: block;
        min-width: 0;
      }

      input {
        width: 100%;
        min-width: 0;
        height: 24px;
        border: 1px solid rgba(255, 255, 255, 0.2);
        border-radius: 3px;
        outline: 0;
        background: rgba(15, 23, 42, 0.5);
        color: #fff;
        font: inherit;
        font-size: 10px;
        line-height: 1;
        padding: 0 6px;
        transition: border-color 120ms ease;
      }

      input:focus {
        border-color: rgba(34, 211, 238, 0.7);
      }

      input:disabled {
        cursor: default;
        opacity: 0.45;
      }
    `,
  ];

  @property() type = "text";
  @property() value = "";
  @property() placeholder = "";
  @property({ type: Boolean, reflect: true }) disabled = false;

  render() {
    return html`<input
      part="input"
      .type=${this.type}
      .value=${this.value}
      .placeholder=${this.placeholder}
      ?disabled=${this.disabled}
      @input=${this.emitValueChange}
    />`;
  }

  private emitValueChange(event: Event) {
    const value = (event.target as HTMLInputElement).value;
    this.value = value;
    this.dispatchValueChange(value);
  }

  protected dispatchValueChange(value: HudControlValue) {
    this.dispatchEvent(
      new CustomEvent("value-change", {
        detail: { value },
        bubbles: true,
        composed: true,
      }),
    );
  }
}

@customElement("hud-select")
export class HudSelect extends HudScopedElement {
  static styles = [
    hudScopedStyles,
    css`
      :host {
        display: block;
        min-width: 0;
      }

      select {
        width: 100%;
        min-width: 0;
        height: 24px;
        border: 1px solid rgba(255, 255, 255, 0.2);
        border-radius: 3px;
        outline: 0;
        background: rgba(15, 23, 42, 0.5);
        color: #fff;
        font: inherit;
        font-size: 10px;
        line-height: 1;
        padding: 0 6px;
        transition: border-color 120ms ease;
      }

      select:focus {
        border-color: rgba(34, 211, 238, 0.7);
      }

      select:disabled {
        cursor: default;
        opacity: 0.45;
      }
    `,
  ];

  @property({ attribute: false }) options: HudSelectOption[] = [];
  @property() value = "";
  @property({ type: Boolean, reflect: true }) disabled = false;

  render() {
    return html`<select
      part="select"
      .value=${this.value}
      ?disabled=${this.disabled}
      @change=${this.emitValueChange}
    >
      ${this.options.map(
        (option) =>
          html`<option .value=${option.value} ?disabled=${option.disabled}>
            ${option.label}
          </option>`,
      )}
    </select>`;
  }

  private emitValueChange(event: Event) {
    const value = (event.target as HTMLSelectElement).value;
    this.value = value;
    this.dispatchEvent(
      new CustomEvent("value-change", {
        detail: { value },
        bubbles: true,
        composed: true,
      }),
    );
  }
}

@customElement("hud-range")
export class HudRange extends HudScopedElement {
  static styles = [
    hudScopedStyles,
    css`
      :host {
        display: block;
        min-width: 0;
        width: 100%;
      }

      input {
        width: 100%;
        height: 18px;
        margin: 0;
        accent-color: #22d3ee;
        cursor: pointer;
      }

      input:disabled {
        cursor: default;
        opacity: 0.45;
      }
    `,
  ];

  @property({ type: Number }) min = 0;
  @property({ type: Number }) max = 100;
  @property({ type: Number }) step = 1;
  @property({ type: Number }) value = 0;
  @property() label = "Range";
  @property({ type: Boolean, reflect: true }) disabled = false;

  render() {
    return html`<input
      part="range"
      type="range"
      .min=${String(this.min)}
      .max=${String(this.max)}
      .step=${String(this.step)}
      .value=${String(this.value)}
      ?disabled=${this.disabled}
      aria-label=${this.label}
      @input=${this.emitValueChange}
    />`;
  }

  private emitValueChange(event: Event) {
    const value = Number((event.target as HTMLInputElement).value);
    this.value = value;
    this.dispatchEvent(
      new CustomEvent("value-change", {
        detail: { value },
        bubbles: true,
        composed: true,
      }),
    );
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

@customElement("hud-unit-display")
export class HudUnitDisplay extends HudScopedElement {
  static styles = [
    hudScopedStyles,
    css`
      :host {
        display: flex;
        width: 100%;
        justify-content: center;
        gap: var(--hud-unit-display-gap, 2px);
        border-top: 1px solid rgba(255, 255, 255, 0.1);
        padding: var(--hud-unit-display-padding, 2px);
      }
    `,
  ];

  render() {
    return html`<slot></slot>`;
  }
}

@customElement("hud-unit-button")
export class HudUnitButton extends HudScopedElement {
  static styles = [
    hudScopedStyles,
    css`
      :host {
        display: inline-block;
        position: relative;
      }

      hud-button {
        --hud-button-width: var(--hud-unit-button-width, 56px);
        --hud-button-height: var(--hud-unit-button-height, 30px);
        --hud-button-min-height: var(--hud-unit-button-height, 30px);
        --hud-button-padding: 0;
        --hud-button-border-color: rgba(148, 163, 184, 0.55);
        --hud-button-background: rgba(15, 23, 42, 0.72);
        --hud-button-hover-background: rgba(255, 255, 255, 0.08);
      }

      :host([selected]) hud-button {
        --hud-button-background: rgba(148, 163, 184, 0.2);
      }

      .content {
        display: grid;
        height: var(--hud-unit-button-height, 30px);
        width: 100%;
        grid-template-columns: 1ch minmax(16px, 1fr) 3ch;
        align-items: center;
        justify-items: center;
        column-gap: 2px;
        color: currentColor;
        padding: 0 4px;
      }

      hud-label.hotkey {
        align-self: center;
        justify-self: start;
        --hud-label-color: #cbd5e1;
        --hud-label-size: 8px;
        --hud-label-weight: 700;
      }

      hud-label.fallback {
        display: inline-grid;
        width: 18px;
        height: 18px;
        place-items: center;
        --hud-label-size: 11px;
        --hud-label-weight: 700;
        line-height: 1;
        text-align: center;
      }

      hud-icon {
        display: inline-grid;
        width: 18px;
        height: 18px;
        place-items: center;
        justify-self: center;
      }

      hud-number {
        justify-self: end;
        --hud-number-size: 10px;
        --hud-number-weight: 700;
      }

      ::slotted(hud-tooltip) {
        position: absolute;
        bottom: 100%;
        left: 50%;
        z-index: 100;
        margin-bottom: 4px;
        pointer-events: none;
        transform: translateX(-50%);
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
    return html`
      <slot name="tooltip"></slot>
      <hud-button ?disabled=${this.disabled}>
        <div class="content" part="content">
          <hud-label class="hotkey" tone="muted">
            <slot name="hotkey">${this.hotkey}</slot>
          </hud-label>
          <slot name="icon">
            ${this.iconSrc
              ? html`<hud-icon .src=${this.iconSrc} size="sm"></hud-icon>`
              : html`<hud-label class="fallback">${this.fallback}</hud-label>`}
          </slot>
          <hud-number .value=${this.count} chars="3" align="right"></hud-number>
        </div>
      </hud-button>
    `;
  }
}

@customElement("hud-control-panel")
export class HudControlPanel extends HudScopedElement {
  static styles = [
    hudScopedStyles,
    css`
      :host {
        display: block;
        min-width: 0;
        width: 100%;
        border-radius: var(--hud-radius, 3px);
        background: rgba(31, 41, 55, 0.88);
        color: #fff;
        padding: var(--hud-control-panel-padding, 4px 8px);
      }

      .panel {
        display: grid;
        gap: var(--hud-control-panel-gap, 4px);
      }
    `,
  ];

  render() {
    return html`<div class="panel" part="panel"><slot></slot></div>`;
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

@customElement("hud-event-row")
export class HudEventRow extends HudScopedElement {
  static styles = [
    hudScopedStyles,
    css`
      :host {
        display: grid;
        grid-template-columns: var(
          --hud-event-columns,
          7ch minmax(0, 1fr) auto
        );
        align-items: center;
        color: #e2e8f0;
        font-size: 10px;
        line-height: 1.2;
      }

      .cell {
        display: flex;
        height: var(--hud-event-row-height, 32px);
        min-width: 0;
        align-items: center;
        border-right: 1px solid rgba(255, 255, 255, 0.14);
        border-bottom: 1px solid rgba(255, 255, 255, 0.13);
        padding: var(--hud-event-cell-padding, 5px 8px);
      }

      .cell:last-child {
        border-right: 0;
      }

      .meta {
        justify-content: flex-end;
        color: #94a3b8;
        font-variant-numeric: tabular-nums;
      }

      .meta.empty {
        overflow: hidden;
        border-right: 0;
        padding: 0;
      }

      .text {
        justify-content: flex-start;
        min-width: 0;
        overflow: hidden;
        color: inherit;
        text-align: left;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      :host([tone="success"]) .text {
        color: #86efac;
      }

      :host([tone="danger"]) .text {
        color: #fca5a5;
      }

      :host([tone="warning"]) .text {
        color: #fdba74;
      }

      :host([tone="active"]) .text {
        color: #7dd3fc;
      }

      .actions {
        justify-content: flex-end;
        gap: 4px;
        padding-right: var(--hud-event-actions-padding-right, 8px);
      }

      .actions slot {
        display: inline-flex;
        align-items: center;
        justify-content: flex-end;
      }
    `,
  ];

  @property() meta = "";
  @property() text = "";
  @property({ reflect: true }) tone: HudAtomTone = "default";

  render() {
    const hasMeta = this.meta.trim().length > 0;

    return html`<span class="cell meta ${hasMeta ? "" : "empty"}" part="meta"
        ><slot name="meta">${this.meta}</slot></span
      >
      <span class="cell text" part="text"><slot>${this.text}</slot></span>
      <span class="cell actions" part="actions"
        ><slot name="actions"></slot
      ></span>`;
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

@customElement("hud-surface-footer")
export class HudSurfaceFooter extends HudScopedElement {
  static styles = [
    hudScopedStyles,
    css`
      :host {
        display: flex;
        min-height: 30px;
        align-items: center;
        justify-content: flex-end;
        gap: 6px;
        border-top: 1px solid rgba(255, 255, 255, 0.1);
        background: rgba(15, 23, 42, 0.45);
        padding: 5px 8px;
      }
    `,
  ];

  render() {
    return html`<slot></slot>`;
  }
}

@customElement("hud-stack")
export class HudStack extends HudScopedElement {
  static styles = [
    hudScopedStyles,
    css`
      :host {
        display: grid;
        gap: var(--hud-stack-gap, 8px);
      }

      :host([density="compact"]) {
        --hud-stack-gap: 4px;
      }

      :host([density="loose"]) {
        --hud-stack-gap: 12px;
      }
    `,
  ];

  @property({ reflect: true }) density: "compact" | "default" | "loose" =
    "default";

  render() {
    return html`<slot></slot>`;
  }
}

@customElement("hud-row")
export class HudRow extends HudScopedElement {
  static styles = [
    hudScopedStyles,
    css`
      :host {
        display: flex;
        min-width: 0;
        align-items: center;
        gap: var(--hud-row-gap, 8px);
      }

      :host([wrap]) {
        flex-wrap: wrap;
      }

      :host([align="start"]) {
        align-items: flex-start;
      }

      :host([align="end"]) {
        align-items: flex-end;
      }

      :host([justify="between"]) {
        justify-content: space-between;
      }

      :host([justify="end"]) {
        justify-content: flex-end;
      }
    `,
  ];

  @property({ reflect: true }) align: "center" | "start" | "end" = "center";
  @property({ reflect: true }) justify: "start" | "between" | "end" = "start";
  @property({ type: Boolean, reflect: true }) wrap = false;

  render() {
    return html`<slot></slot>`;
  }
}

@customElement("hud-grid")
export class HudGrid extends HudScopedElement {
  static styles = [
    hudScopedStyles,
    css`
      :host {
        display: block;
      }

      .grid {
        display: grid;
        grid-template-columns: repeat(
          var(--hud-grid-columns, 2),
          minmax(0, 1fr)
        );
        gap: var(--hud-grid-gap, 8px);
      }

      @media (max-width: 560px) {
        .grid {
          grid-template-columns: 1fr;
        }
      }
    `,
  ];

  @property({ type: Number }) columns = 2;

  render() {
    return html`<div class="grid" style="--hud-grid-columns: ${this.columns};">
      <slot></slot>
    </div>`;
  }
}

@customElement("hud-split")
export class HudSplit extends HudScopedElement {
  static styles = [
    hudScopedStyles,
    css`
      :host {
        display: grid;
        grid-template-columns: minmax(0, 1fr) auto;
        align-items: center;
        gap: var(--hud-split-gap, 8px);
      }
    `,
  ];

  render() {
    return html`<slot></slot>`;
  }
}

@customElement("hud-scroll-area")
export class HudScrollArea extends HudScopedElement {
  static styles = [
    hudScopedStyles,
    css`
      :host {
        display: block;
        max-height: var(--hud-scroll-area-max-height, 220px);
        overflow: auto;
      }
    `,
  ];

  render() {
    return html`<slot></slot>`;
  }
}

@customElement("hud-safe-area")
export class HudSafeArea extends HudScopedElement {
  static styles = [
    hudScopedStyles,
    css`
      :host {
        display: block;
        padding-bottom: env(safe-area-inset-bottom);
        padding-left: env(safe-area-inset-left);
        padding-right: env(safe-area-inset-right);
      }
    `,
  ];

  render() {
    return html`<slot></slot>`;
  }
}

@customElement("hud-list-row")
export class HudListRow extends HudScopedElement {
  static styles = [
    hudScopedStyles,
    css`
      :host {
        display: grid;
        grid-template-columns: auto minmax(0, 1fr) auto auto;
        align-items: center;
        gap: 6px;
        min-height: 26px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.08);
        color: #e2e8f0;
        font-size: 10px;
        line-height: 1.2;
        padding: 4px 8px;
      }

      :host([interactive]) {
        cursor: pointer;
      }

      :host([interactive]:hover) {
        background: rgba(255, 255, 255, 0.06);
      }

      :host([selected]) {
        color: #7dd3fc;
        font-weight: 700;
      }

      :host([tone="danger"]) {
        color: #fca5a5;
      }

      :host([tone="success"]) {
        color: #86efac;
      }

      .content,
      .meta {
        min-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .meta {
        color: #94a3b8;
        font-variant-numeric: tabular-nums;
      }
    `,
  ];

  @property({ type: Boolean, reflect: true }) interactive = false;
  @property({ type: Boolean, reflect: true }) selected = false;
  @property({ reflect: true }) tone: HudAtomTone = "default";

  render() {
    return html`<span><slot name="leading"></slot></span>
      <span class="content"><slot></slot></span>
      <span class="meta"><slot name="meta"></slot></span>
      <span><slot name="actions"></slot></span>`;
  }
}

@customElement("hud-command-choice")
export class HudCommandChoice extends HudScopedElement {
  static styles = [
    hudScopedStyles,
    css`
      :host {
        display: inline-block;
      }

      button {
        display: grid;
        min-width: var(--hud-command-choice-min-width, 72px);
        grid-template-columns: auto minmax(0, 1fr) auto;
        align-items: center;
        gap: 6px;
        border: 1px solid rgba(148, 163, 184, 0.55);
        border-radius: 3px;
        background: rgba(15, 23, 42, 0.72);
        color: #e2e8f0;
        cursor: pointer;
        font: inherit;
        font-size: 10px;
        font-weight: 700;
        line-height: 1;
        padding: 5px 7px;
      }

      button:hover:not(:disabled) {
        background: rgba(255, 255, 255, 0.08);
      }

      button:disabled {
        cursor: default;
        opacity: 0.45;
      }

      :host([selected]) button {
        border-color: rgba(125, 211, 252, 0.7);
        background: rgba(14, 165, 233, 0.22);
        color: #e0f2fe;
      }

      :host([locked]) button {
        border-color: rgba(251, 191, 36, 0.5);
        color: #fde68a;
      }

      .label,
      .meta {
        min-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .meta {
        color: currentColor;
        opacity: 0.78;
      }
    `,
  ];

  @property() value = "";
  @property({ type: Boolean, reflect: true }) selected = false;
  @property({ type: Boolean, reflect: true }) locked = false;
  @property({ type: Boolean, reflect: true }) disabled = false;

  render() {
    return html`<button
      part="button"
      type="button"
      ?disabled=${this.disabled}
      aria-pressed=${this.selected ? "true" : "false"}
      @click=${this.emitChoice}
    >
      <span><slot name="icon"></slot></span>
      <span class="label"><slot></slot></span>
      <span class="meta"><slot name="meta">${this.value}</slot></span>
    </button>`;
  }

  private emitChoice() {
    if (this.disabled || this.locked) return;
    this.dispatchEvent(
      new CustomEvent("choice", { bubbles: true, composed: true }),
    );
  }
}

@customElement("hud-tabs")
export class HudTabs extends HudScopedElement {
  static styles = [
    hudScopedStyles,
    css`
      :host {
        display: block;
      }

      .tabs {
        display: flex;
        gap: 2px;
        border-bottom: 1px solid rgba(148, 163, 184, 0.34);
      }

      button {
        min-width: 0;
        border: 0;
        border-bottom: 2px solid transparent;
        background: transparent;
        color: #94a3b8;
        cursor: pointer;
        font: inherit;
        font-size: 10px;
        font-weight: 700;
        line-height: 1;
        padding: 6px 8px;
      }

      button:hover:not(:disabled) {
        color: #e2e8f0;
      }

      button[aria-selected="true"] {
        border-bottom-color: #38bdf8;
        color: #f8fafc;
      }

      button:disabled {
        cursor: default;
        opacity: 0.45;
      }
    `,
  ];

  @property({ attribute: false }) items: HudSegmentedItem[] = [];
  @property() selected = "";

  render() {
    return html`<div class="tabs" role="tablist">
      ${this.items.map(
        (item) =>
          html`<button
            role="tab"
            type="button"
            ?disabled=${item.disabled}
            aria-selected=${item.id === this.selected ? "true" : "false"}
            @click=${() => this.selectItem(item)}
          >
            ${item.label}
          </button>`,
      )}
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

@customElement("hud-empty-state")
export class HudEmptyState extends HudScopedElement {
  static styles = [
    hudScopedStyles,
    css`
      :host {
        display: grid;
        min-height: var(--hud-empty-state-min-height, 72px);
        place-items: center;
        color: #94a3b8;
        font-size: 11px;
        line-height: 1.25;
        padding: 12px;
        text-align: center;
      }

      :host([tone="warning"]) {
        color: #fdba74;
      }

      :host([tone="danger"]) {
        color: #fca5a5;
      }
    `,
  ];

  @property() message = "";
  @property({ reflect: true }) tone: "muted" | "warning" | "danger" = "muted";

  render() {
    return html`<div part="message"><slot>${this.message}</slot></div>`;
  }
}

@customElement("hud-loading-state")
export class HudLoadingState extends HudScopedElement {
  static styles = [
    hudScopedStyles,
    css`
      :host {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        color: #cbd5e1;
        font-size: 11px;
        line-height: 1;
      }

      .dot {
        width: 6px;
        height: 6px;
        border-radius: 9999px;
        animation: pulse 900ms ease-in-out infinite alternate;
        background: #38bdf8;
      }

      @keyframes pulse {
        from {
          opacity: 0.35;
          transform: scale(0.75);
        }
        to {
          opacity: 1;
          transform: scale(1);
        }
      }
    `,
  ];

  @property() label = "Loading";

  render() {
    return html`<span class="dot" aria-hidden="true"></span>
      <span><slot>${this.label}</slot></span>`;
  }
}

@customElement("hud-modal-shell")
export class HudModalShell extends HudScopedElement {
  static styles = [
    hudScopedStyles,
    css`
      :host {
        display: contents;
      }

      .overlay {
        position: fixed;
        inset: 0;
        z-index: var(--hud-modal-z-index, 2000);
        display: grid;
        place-items: center;
        padding: 16px;
        background: rgba(2, 6, 23, 0.62);
      }

      .dialog {
        width: min(var(--hud-modal-width, 420px), 100%);
        max-height: min(90vh, var(--hud-modal-max-height, 720px));
        overflow: hidden;
        border: 1px solid rgba(148, 163, 184, 0.38);
        border-radius: var(--hud-modal-radius, 6px);
        background: rgba(15, 23, 42, 0.96);
        box-shadow: 0 20px 40px rgba(0, 0, 0, 0.38);
        color: #f8fafc;
      }
    `,
  ];

  @property({ type: Boolean, reflect: true }) open = false;
  @property({ type: Boolean, reflect: true }) dismissible = true;

  connectedCallback() {
    super.connectedCallback();
    this.addEventListener("keydown", this.handleKeydown);
  }

  disconnectedCallback() {
    this.removeEventListener("keydown", this.handleKeydown);
    super.disconnectedCallback();
  }

  render() {
    if (!this.open) return nothing;
    return html`<div class="overlay" part="overlay" @click=${this.onBackdrop}>
      <section
        class="dialog"
        part="dialog"
        role="dialog"
        aria-modal="true"
        @click=${(event: Event) => event.stopPropagation()}
      >
        <slot></slot>
      </section>
    </div>`;
  }

  private onBackdrop() {
    if (this.dismissible) this.emitDismiss();
  }

  private handleKeydown = (event: Event) => {
    const keyEvent = event as KeyboardEvent;
    if (this.open && this.dismissible && keyEvent.key === "Escape") {
      this.emitDismiss();
    }
  };

  private emitDismiss() {
    this.dispatchEvent(
      new CustomEvent("dismiss", { bubbles: true, composed: true }),
    );
  }
}

@customElement("hud-modal-header")
export class HudModalHeader extends HudScopedElement {
  static styles = HudSurfaceHeader.styles;
  render() {
    return html`<header part="header"><slot></slot></header>`;
  }
}

@customElement("hud-modal-body")
export class HudModalBody extends HudScopedElement {
  static styles = HudSurfaceBody.styles;
  render() {
    return html`<div class="body" part="body"><slot></slot></div>`;
  }
}

@customElement("hud-modal-footer")
export class HudModalFooter extends HudSurfaceFooter {}

@customElement("hud-popover")
export class HudPopover extends HudScopedElement {
  static styles = [
    hudScopedStyles,
    css`
      :host {
        display: block;
        width: var(--hud-popover-width, 280px);
        max-width: 100%;
        overflow: hidden;
        border: 1px solid rgba(148, 163, 184, 0.4);
        border-radius: 4px;
        background: rgba(15, 23, 42, 0.96);
        box-shadow: 0 10px 20px rgba(0, 0, 0, 0.28);
        color: #f8fafc;
      }
    `,
  ];

  render() {
    return html`<slot></slot>`;
  }
}

@customElement("hud-alert")
export class HudAlert extends HudScopedElement {
  static styles = [
    hudScopedStyles,
    css`
      :host {
        display: grid;
        grid-template-columns: auto minmax(0, 1fr) auto;
        align-items: center;
        gap: 8px;
        border: 1px solid var(--hud-alert-border, rgba(148, 163, 184, 0.36));
        border-radius: 4px;
        background: var(--hud-alert-background, rgba(15, 23, 42, 0.72));
        color: var(--hud-alert-color, #e2e8f0);
        font-size: 11px;
        line-height: 1.25;
        padding: 8px;
      }

      :host([tone="info"]) {
        --hud-alert-border: rgba(56, 189, 248, 0.4);
        --hud-alert-background: rgba(14, 165, 233, 0.12);
        --hud-alert-color: #bae6fd;
      }

      :host([tone="success"]) {
        --hud-alert-border: rgba(34, 197, 94, 0.4);
        --hud-alert-background: rgba(22, 163, 74, 0.12);
        --hud-alert-color: #bbf7d0;
      }

      :host([tone="warning"]) {
        --hud-alert-border: rgba(251, 191, 36, 0.42);
        --hud-alert-background: rgba(217, 119, 6, 0.14);
        --hud-alert-color: #fde68a;
      }

      :host([tone="danger"]) {
        --hud-alert-border: rgba(248, 113, 113, 0.42);
        --hud-alert-background: rgba(220, 38, 38, 0.14);
        --hud-alert-color: #fecaca;
      }

      :host([compact]) {
        padding: 5px 7px;
      }

      .message {
        min-width: 0;
      }
    `,
  ];

  @property({ reflect: true }) tone: HudFeedbackTone = "neutral";
  @property({ type: Boolean, reflect: true }) compact = false;

  render() {
    return html`<span><slot name="icon"></slot></span>
      <span class="message"><slot></slot></span>
      <span><slot name="actions"></slot></span>`;
  }
}

@customElement("hud-toast")
export class HudToast extends HudScopedElement {
  static styles = [
    hudScopedStyles,
    css`
      :host {
        display: grid;
        grid-template-columns: auto minmax(0, 1fr) auto;
        align-items: center;
        gap: 8px;
        min-width: var(--hud-toast-min-width, 220px);
        border: 1px solid var(--hud-alert-border, rgba(148, 163, 184, 0.36));
        border-radius: 4px;
        background: var(--hud-alert-background, rgba(15, 23, 42, 0.72));
        box-shadow: 0 10px 22px rgba(0, 0, 0, 0.28);
        color: var(--hud-alert-color, #e2e8f0);
        font-size: 11px;
        line-height: 1.25;
        padding: 8px;
      }

      :host([tone="info"]) {
        --hud-alert-border: rgba(56, 189, 248, 0.4);
        --hud-alert-background: rgba(14, 165, 233, 0.12);
        --hud-alert-color: #bae6fd;
      }

      :host([tone="success"]) {
        --hud-alert-border: rgba(34, 197, 94, 0.4);
        --hud-alert-background: rgba(22, 163, 74, 0.12);
        --hud-alert-color: #bbf7d0;
      }

      :host([tone="warning"]) {
        --hud-alert-border: rgba(251, 191, 36, 0.42);
        --hud-alert-background: rgba(217, 119, 6, 0.14);
        --hud-alert-color: #fde68a;
      }

      :host([tone="danger"]) {
        --hud-alert-border: rgba(248, 113, 113, 0.42);
        --hud-alert-background: rgba(220, 38, 38, 0.14);
        --hud-alert-color: #fecaca;
      }

      .message {
        min-width: 0;
      }
    `,
  ];

  @property({ reflect: true }) tone: HudFeedbackTone = "neutral";

  render() {
    return html`<span><slot name="icon"></slot></span>
      <span class="message"><slot></slot></span>
      <span><slot name="actions"></slot></span>`;
  }
}

@customElement("hud-notice")
export class HudNotice extends HudAlert {}

@customElement("hud-confirm-actions")
export class HudConfirmActions extends HudScopedElement {
  static styles = [
    hudScopedStyles,
    css`
      :host {
        display: flex;
        flex-wrap: wrap;
        justify-content: flex-end;
        gap: 6px;
      }
    `,
  ];

  render() {
    return html`<slot name="secondary"></slot>
      <slot></slot>
      <slot name="danger"></slot>`;
  }
}

@customElement("hud-menu")
export class HudMenu extends HudScopedElement {
  static styles = [
    hudScopedStyles,
    css`
      :host {
        display: block;
        min-width: var(--hud-menu-min-width, 180px);
        overflow: hidden;
        border: 1px solid rgba(148, 163, 184, 0.42);
        border-radius: 4px;
        background: rgba(15, 23, 42, 0.96);
        box-shadow: 0 10px 18px rgba(0, 0, 0, 0.28);
        color: #e2e8f0;
      }

      ::slotted(hud-surface-header) {
        --hud-surface-header-min-height: 34px;
        --hud-surface-header-padding: 7px 10px;
      }
    `,
  ];

  render() {
    return html`<div role="menu"><slot></slot></div>`;
  }
}

@customElement("hud-menu-item")
export class HudMenuItem extends HudScopedElement {
  static styles = [
    hudScopedStyles,
    css`
      :host {
        display: block;
      }

      button {
        display: grid;
        width: 100%;
        grid-template-columns: auto minmax(0, 1fr) auto;
        align-items: center;
        gap: 8px;
        border: 0;
        border-radius: 3px;
        background: transparent;
        color: inherit;
        cursor: pointer;
        font: inherit;
        font-size: 11px;
        line-height: 1;
        padding: 6px 7px;
        text-align: left;
      }

      button:hover:not(:disabled) {
        background: rgba(255, 255, 255, 0.08);
      }

      button:disabled {
        cursor: default;
        opacity: 0.45;
      }

      :host([selected]) button {
        background: rgba(14, 165, 233, 0.18);
        color: #e0f2fe;
      }

      .label,
      .meta {
        min-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .meta {
        color: #94a3b8;
        font-size: 10px;
      }
    `,
  ];

  @property({ type: Boolean, reflect: true }) disabled = false;
  @property({ type: Boolean, reflect: true }) selected = false;

  render() {
    return html`<button
      type="button"
      role="menuitem"
      ?disabled=${this.disabled}
      @click=${this.emitSelect}
    >
      <span><slot name="icon"></slot></span>
      <span class="label"><slot></slot></span>
      <span class="meta"><slot name="meta"></slot></span>
    </button>`;
  }

  private emitSelect() {
    if (this.disabled) return;
    this.dispatchEvent(
      new CustomEvent("menu-select", { bubbles: true, composed: true }),
    );
  }
}

@customElement("hud-menu-divider")
export class HudMenuDivider extends HudScopedElement {
  static styles = [
    hudScopedStyles,
    css`
      :host {
        display: block;
        height: 1px;
        margin: 4px;
        background: rgba(148, 163, 184, 0.24);
      }
    `,
  ];

  render() {
    return nothing;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "hud-surface": HudSurface;
    "hud-surface-header": HudSurfaceHeader;
    "hud-surface-body": HudSurfaceBody;
    "hud-surface-footer": HudSurfaceFooter;
    "hud-kit-catalog": HudKitCatalog;
    "hud-kit-page": HudKitPage;
    "hud-kit-topbar": HudKitTopbar;
    "hud-kit-heading": HudKitHeading;
    "hud-kit-section": HudKitSection;
    "hud-kit-stage": HudKitStage;
    "hud-kit-row": HudKitRow;
    "hud-kit-caption": HudKitCaption;
    "hud-kit-frame": HudKitFrame;
    "hud-kit-icon-gallery": HudKitIconGallery;
    "hud-kit-icon-sample": HudKitIconSample;
    "hud-range-readout": HudRangeReadout;
    "hud-color-swatch": HudColorSwatch;
    "hud-player-identity": HudPlayerIdentity;
    "hud-toolbar": HudToolbar;
    "hud-timer-label": HudTimerLabel;
    "hud-icon": HudIcon;
    "hud-label": HudLabel;
    "hud-number": HudNumber;
    "hud-button": HudButton;
    "hud-icon-button": HudIconButton;
    "hud-action-group": HudActionGroup;
    "hud-pill": HudPill;
    "hud-mask-icon": HudMaskIcon;
    "hud-table": HudTable;
    "hud-table-row": HudTableRow;
    "hud-table-cell": HudTableCell;
    "hud-meter": HudMeter;
    "hud-stat-grid": HudStatGrid;
    "hud-stat": HudStat;
    "hud-form-row": HudFormRow;
    "hud-field-label": HudFieldLabel;
    "hud-input": HudInput;
    "hud-select": HudSelect;
    "hud-range": HudRange;
    "hud-dual-range": HudDualRange;
    "hud-blend-slider": HudBlendSlider;
    "hud-segmented-control": HudSegmentedControl;
    "hud-unit-display": HudUnitDisplay;
    "hud-unit-button": HudUnitButton;
    "hud-control-panel": HudControlPanel;
    "hud-tooltip": HudTooltip;
    "hud-event-row": HudEventRow;
    "hud-attack-row": HudAttackRow;
    "hud-stack": HudStack;
    "hud-row": HudRow;
    "hud-grid": HudGrid;
    "hud-split": HudSplit;
    "hud-scroll-area": HudScrollArea;
    "hud-safe-area": HudSafeArea;
    "hud-list-row": HudListRow;
    "hud-command-choice": HudCommandChoice;
    "hud-tabs": HudTabs;
    "hud-empty-state": HudEmptyState;
    "hud-loading-state": HudLoadingState;
    "hud-modal-shell": HudModalShell;
    "hud-modal-header": HudModalHeader;
    "hud-modal-body": HudModalBody;
    "hud-modal-footer": HudModalFooter;
    "hud-popover": HudPopover;
    "hud-alert": HudAlert;
    "hud-toast": HudToast;
    "hud-notice": HudNotice;
    "hud-confirm-actions": HudConfirmActions;
    "hud-menu": HudMenu;
    "hud-menu-item": HudMenuItem;
    "hud-menu-divider": HudMenuDivider;
  }
}

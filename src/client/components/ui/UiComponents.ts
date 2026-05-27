import {
  css,
  html,
  LitElement,
  nothing,
  type CSSResultGroup,
  type TemplateResult,
} from "lit";
import { customElement, property } from "lit/decorators.js";

type UiSize = "xs" | "sm" | "md" | "lg";
type UiTone =
  | "default"
  | "muted"
  | "primary"
  | "success"
  | "warning"
  | "danger"
  | "gold";
type UiVariant = "default" | "primary" | "secondary" | "ghost" | "danger";
type UiAlign = "left" | "center" | "right" | "between";

export interface UiSelectOption {
  label: string;
  value: string;
  disabled?: boolean;
}

const scopedStyles = css`
  :host {
    box-sizing: border-box;
    color: var(--ui-color, #f8fafc);
    font-family:
      Inter,
      ui-sans-serif,
      system-ui,
      -apple-system,
      BlinkMacSystemFont,
      "Segoe UI",
      sans-serif;
    font-variant-numeric: tabular-nums;
  }

  *,
  *::before,
  *::after {
    box-sizing: border-box;
  }

  button,
  input,
  select,
  textarea {
    font: inherit;
  }
`;

const controlFocus = css`
  :focus-visible {
    outline: 2px solid rgba(56, 189, 248, 0.65);
    outline-offset: 2px;
  }
`;

const toneText: Record<UiTone, string> = {
  default: "#f8fafc",
  muted: "#cbd5e1",
  primary: "#bae6fd",
  success: "#bbf7d0",
  warning: "#fed7aa",
  danger: "#fecaca",
  gold: "#fef3c7",
};

const toneBorder: Record<UiTone, string> = {
  default: "rgba(148, 163, 184, 0.35)",
  muted: "rgba(148, 163, 184, 0.22)",
  primary: "rgba(56, 189, 248, 0.45)",
  success: "rgba(34, 197, 94, 0.45)",
  warning: "rgba(251, 146, 60, 0.45)",
  danger: "rgba(248, 113, 113, 0.48)",
  gold: "rgba(250, 204, 21, 0.5)",
};

const toneBackground: Record<UiTone, string> = {
  default: "rgba(15, 23, 42, 0.72)",
  muted: "rgba(51, 65, 85, 0.42)",
  primary: "rgba(14, 165, 233, 0.18)",
  success: "rgba(34, 197, 94, 0.14)",
  warning: "rgba(251, 146, 60, 0.14)",
  danger: "rgba(239, 68, 68, 0.14)",
  gold: "rgba(234, 179, 8, 0.16)",
};

function classMap(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export class UiScopedElement extends LitElement {
  static styles: CSSResultGroup = scopedStyles;
}

@customElement("ui-surface")
export class UiSurface extends UiScopedElement {
  @property({ reflect: true }) tone: UiTone = "default";

  static styles = [
    scopedStyles,
    css`
      :host {
        display: block;
      }

      section {
        overflow: hidden;
        border: 1px solid var(--ui-surface-border, rgba(148, 163, 184, 0.2));
        border-radius: var(--ui-radius, 8px);
        background: var(--ui-surface-bg, rgba(15, 23, 42, 0.82));
        box-shadow: var(--ui-surface-shadow, 0 12px 40px rgba(0, 0, 0, 0.24));
        color: var(--ui-surface-color, #f8fafc);
      }

      :host([tone="muted"]) section {
        background: rgba(30, 41, 59, 0.68);
      }
    `,
  ];

  render() {
    return html`<section part="surface"><slot></slot></section>`;
  }
}

@customElement("ui-surface-header")
export class UiSurfaceHeader extends UiScopedElement {
  static styles = [
    scopedStyles,
    css`
      :host {
        display: block;
      }

      header {
        display: flex;
        min-height: var(--ui-surface-header-min-height, 44px);
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        border-bottom: 1px solid rgba(148, 163, 184, 0.18);
        background: rgba(15, 23, 42, 0.64);
        padding: var(--ui-surface-header-padding, 10px 14px);
      }
    `,
  ];

  render() {
    return html`<header part="header"><slot></slot></header>`;
  }
}

@customElement("ui-surface-body")
export class UiSurfaceBody extends UiScopedElement {
  static styles = [
    scopedStyles,
    css`
      :host {
        display: block;
      }

      div {
        padding: var(--ui-surface-body-padding, 14px);
      }
    `,
  ];

  render() {
    return html`<div part="body"><slot></slot></div>`;
  }
}

@customElement("ui-surface-footer")
export class UiSurfaceFooter extends UiScopedElement {
  static styles = [
    scopedStyles,
    css`
      :host {
        display: block;
      }

      footer {
        display: flex;
        align-items: center;
        justify-content: var(--ui-footer-justify, flex-end);
        gap: 8px;
        border-top: 1px solid rgba(148, 163, 184, 0.18);
        background: rgba(15, 23, 42, 0.48);
        padding: var(--ui-surface-footer-padding, 10px 14px);
      }
    `,
  ];

  render() {
    return html`<footer part="footer"><slot></slot></footer>`;
  }
}

@customElement("ui-button")
export class UiButton extends UiScopedElement {
  @property({ reflect: true }) variant: UiVariant = "default";
  @property({ reflect: true }) size: UiSize = "md";
  @property({ reflect: true }) width: "auto" | "block" | "fill" = "auto";
  @property({ type: Boolean, reflect: true }) disabled = false;
  @property({ type: Boolean }) submit = false;
  @property({ type: Boolean, reflect: true }) stacked = false;
  @property() label = "";

  static styles = [
    scopedStyles,
    controlFocus,
    css`
      :host {
        display: inline-block;
      }

      :host([width="block"]),
      :host([width="fill"]) {
        display: block;
      }

      button {
        display: inline-flex;
        width: var(--ui-button-width, auto);
        min-width: var(--ui-button-min-width, 0);
        min-height: var(--ui-button-min-height, 36px);
        align-items: center;
        justify-content: center;
        gap: 8px;
        border: 1px solid rgba(148, 163, 184, 0.32);
        border-radius: var(--ui-button-radius, 8px);
        background: rgba(30, 41, 59, 0.74);
        color: #f8fafc;
        cursor: pointer;
        font-weight: 700;
        letter-spacing: 0;
        line-height: 1;
        padding: 8px 12px;
        text-align: center;
        transition:
          background 120ms ease,
          border-color 120ms ease,
          color 120ms ease,
          transform 120ms ease;
      }

      :host([width="block"]) button,
      :host([width="fill"]) button {
        width: 100%;
      }

      :host([width="fill"]) button {
        height: 100%;
      }

      :host([stacked]) button {
        flex-direction: column;
        gap: 4px;
      }

      button:hover:not(:disabled) {
        background: rgba(51, 65, 85, 0.9);
      }

      button:active:not(:disabled) {
        transform: translateY(1px);
      }

      button:disabled {
        cursor: not-allowed;
        opacity: 0.5;
      }

      :host([size="xs"]) button {
        min-height: 24px;
        padding: 4px 8px;
        font-size: 11px;
      }

      :host([size="sm"]) button {
        min-height: 30px;
        padding: 6px 10px;
        font-size: 12px;
      }

      :host([size="lg"]) button {
        min-height: 44px;
        padding: 10px 16px;
        font-size: 16px;
      }

      :host([variant="primary"]) button {
        border-color: rgba(56, 189, 248, 0.55);
        background: rgba(2, 132, 199, 0.84);
      }

      :host([variant="primary"]) button:hover:not(:disabled) {
        background: rgba(14, 165, 233, 0.92);
      }

      :host([variant="secondary"]) button {
        border-color: rgba(148, 163, 184, 0.28);
        background: rgba(51, 65, 85, 0.72);
      }

      :host([variant="ghost"]) button {
        border-color: transparent;
        background: transparent;
        color: #bae6fd;
      }

      :host([variant="ghost"]) button:hover:not(:disabled) {
        background: rgba(255, 255, 255, 0.08);
      }

      :host([variant="danger"]) button {
        border-color: rgba(248, 113, 113, 0.55);
        background: rgba(185, 28, 28, 0.86);
      }

      .label {
        min-width: 0;
        overflow-wrap: anywhere;
      }
    `,
  ];

  render() {
    return html`
      <button
        part="button"
        type=${this.submit ? "submit" : "button"}
        ?disabled=${this.disabled}
        aria-label=${this.label || nothing}
      >
        <slot name="icon"></slot>
        <span class="label"><slot>${this.label}</slot></span>
      </button>
    `;
  }
}

@customElement("ui-icon-button")
export class UiIconButton extends UiScopedElement {
  @property({ reflect: true }) variant: UiVariant = "default";
  @property({ reflect: true }) size: UiSize = "md";
  @property({ type: Boolean, reflect: true }) disabled = false;
  @property() label = "";

  static styles = [
    scopedStyles,
    controlFocus,
    css`
      :host {
        display: inline-block;
      }

      button {
        display: inline-flex;
        width: var(--ui-icon-button-size, 34px);
        height: var(--ui-icon-button-size, 34px);
        align-items: center;
        justify-content: center;
        border: 1px solid rgba(148, 163, 184, 0.32);
        border-radius: var(--ui-icon-button-radius, 8px);
        background: rgba(30, 41, 59, 0.74);
        color: #f8fafc;
        cursor: pointer;
        padding: 0;
        transition:
          background 120ms ease,
          color 120ms ease,
          transform 120ms ease;
      }

      button:hover:not(:disabled) {
        background: rgba(51, 65, 85, 0.9);
      }

      button:disabled {
        cursor: not-allowed;
        opacity: 0.5;
      }

      :host([size="xs"]) button {
        --ui-icon-button-size: 24px;
      }

      :host([size="sm"]) button {
        --ui-icon-button-size: 30px;
      }

      :host([size="lg"]) button {
        --ui-icon-button-size: 42px;
      }

      :host([variant="primary"]) button {
        border-color: rgba(56, 189, 248, 0.55);
        background: rgba(2, 132, 199, 0.84);
      }

      :host([variant="danger"]) button {
        border-color: rgba(248, 113, 113, 0.55);
        background: rgba(185, 28, 28, 0.86);
      }

      :host([variant="ghost"]) button {
        border-color: transparent;
        background: transparent;
      }
    `,
  ];

  render() {
    return html`
      <button
        part="button"
        type="button"
        ?disabled=${this.disabled}
        aria-label=${this.label}
        title=${this.label}
      >
        <slot></slot>
      </button>
    `;
  }
}

@customElement("ui-action-group")
export class UiActionGroup extends UiScopedElement {
  @property({ reflect: true }) align: UiAlign = "left";

  static styles = [
    scopedStyles,
    css`
      :host {
        display: flex;
        min-width: 0;
      }

      div {
        display: flex;
        width: 100%;
        min-width: 0;
        align-items: center;
        justify-content: flex-start;
        gap: var(--ui-action-gap, 8px);
      }

      :host([align="center"]) div {
        justify-content: center;
      }

      :host([align="right"]) div {
        justify-content: flex-end;
      }

      :host([align="between"]) div {
        justify-content: space-between;
      }
    `,
  ];

  render() {
    return html`<div part="group"><slot></slot></div>`;
  }
}

@customElement("ui-pill")
export class UiPill extends UiScopedElement {
  @property({ reflect: true }) tone: UiTone = "default";

  static styles = [
    scopedStyles,
    css`
      :host {
        display: inline-flex;
      }

      span {
        display: inline-flex;
        min-width: 0;
        align-items: center;
        justify-content: var(--ui-pill-justify, center);
        gap: 6px;
        border: 1px solid var(--ui-pill-border, rgba(148, 163, 184, 0.35));
        border-radius: var(--ui-pill-radius, 999px);
        background: var(--ui-pill-bg, rgba(15, 23, 42, 0.72));
        color: var(--ui-pill-color, #f8fafc);
        font-size: var(--ui-pill-font-size, 12px);
        font-weight: 700;
        line-height: 1;
        padding: var(--ui-pill-padding, 5px 8px);
      }
    `,
  ];

  updated() {
    this.style.setProperty("--ui-pill-color", toneText[this.tone]);
    this.style.setProperty("--ui-pill-border", toneBorder[this.tone]);
    this.style.setProperty("--ui-pill-bg", toneBackground[this.tone]);
  }

  render() {
    return html`<span part="pill">
      <slot name="icon"></slot>
      <slot></slot>
    </span>`;
  }
}

@customElement("ui-label")
export class UiLabel extends UiScopedElement {
  @property({ reflect: true }) tone: UiTone = "muted";

  static styles = [
    scopedStyles,
    css`
      :host {
        display: inline;
        color: var(--ui-label-color, #cbd5e1);
        font-size: var(--ui-label-size, 12px);
        font-weight: var(--ui-label-weight, 700);
        letter-spacing: 0;
      }
    `,
  ];

  updated() {
    this.style.setProperty("--ui-label-color", toneText[this.tone]);
  }

  render() {
    return html`<slot></slot>`;
  }
}

@customElement("ui-alert")
export class UiAlert extends UiScopedElement {
  @property({ reflect: true }) tone: UiTone = "default";

  static styles = [
    scopedStyles,
    css`
      :host {
        display: block;
      }

      div {
        border: 1px solid var(--ui-alert-border, rgba(148, 163, 184, 0.35));
        border-radius: var(--ui-radius, 8px);
        background: var(--ui-alert-bg, rgba(15, 23, 42, 0.72));
        color: var(--ui-alert-color, #f8fafc);
        padding: var(--ui-alert-padding, 10px 12px);
      }
    `,
  ];

  updated() {
    this.style.setProperty("--ui-alert-color", toneText[this.tone]);
    this.style.setProperty("--ui-alert-border", toneBorder[this.tone]);
    this.style.setProperty("--ui-alert-bg", toneBackground[this.tone]);
  }

  render() {
    return html`<div part="alert" role="status"><slot></slot></div>`;
  }
}

@customElement("ui-form-row")
export class UiFormRow extends UiScopedElement {
  @property() label = "";
  @property() description = "";

  static styles = [
    scopedStyles,
    css`
      :host {
        display: block;
      }

      label {
        display: grid;
        grid-template-columns: var(
            --ui-form-label-width,
            minmax(9rem, 0.42fr)
          ) minmax(0, 1fr);
        gap: 10px;
        align-items: center;
      }

      .copy {
        min-width: 0;
      }

      .label {
        color: #f8fafc;
        font-size: 13px;
        font-weight: 700;
      }

      .description {
        margin-top: 3px;
        color: #94a3b8;
        font-size: 12px;
        line-height: 1.35;
      }

      @media (max-width: 640px) {
        label {
          grid-template-columns: 1fr;
          align-items: stretch;
        }
      }
    `,
  ];

  render() {
    return html`<label part="row">
      <span class="copy">
        <span class="label"><slot name="label">${this.label}</slot></span>
        ${this.description
          ? html`<span class="description">${this.description}</span>`
          : nothing}
      </span>
      <span><slot></slot></span>
    </label>`;
  }
}

const fieldStyles = [
  scopedStyles,
  controlFocus,
  css`
    :host {
      display: block;
    }

    input,
    select,
    textarea {
      width: 100%;
      min-width: 0;
      border: 1px solid rgba(148, 163, 184, 0.32);
      border-radius: var(--ui-input-radius, 8px);
      background: rgba(15, 23, 42, 0.72);
      color: #f8fafc;
      min-height: 36px;
      padding: 8px 10px;
    }

    input::placeholder,
    textarea::placeholder {
      color: #64748b;
    }

    input:disabled,
    select:disabled,
    textarea:disabled {
      cursor: not-allowed;
      opacity: 0.5;
    }

    textarea {
      min-height: var(--ui-textarea-min-height, 84px);
      resize: vertical;
    }
  `,
] satisfies CSSResultGroup;

@customElement("ui-input")
export class UiInput extends UiScopedElement {
  static styles = fieldStyles;

  @property() type = "text";
  @property() value = "";
  @property() placeholder = "";
  @property() label = "";
  @property({ type: Boolean, reflect: true }) disabled = false;

  private handleInput(event: Event) {
    this.value = (event.target as HTMLInputElement).value;
    this.dispatchEvent(new Event("input", { bubbles: true, composed: true }));
  }

  private handleChange() {
    this.dispatchEvent(new Event("change", { bubbles: true, composed: true }));
  }

  render() {
    return html`<input
      part="input"
      type=${this.type}
      .value=${this.value}
      placeholder=${this.placeholder}
      aria-label=${this.label || nothing}
      ?disabled=${this.disabled}
      @input=${this.handleInput}
      @change=${this.handleChange}
    />`;
  }
}

@customElement("ui-textarea")
export class UiTextarea extends UiScopedElement {
  static styles = fieldStyles;

  @property() value = "";
  @property() placeholder = "";
  @property() label = "";
  @property({ type: Boolean, reflect: true }) disabled = false;

  private handleInput(event: Event) {
    this.value = (event.target as HTMLTextAreaElement).value;
    this.dispatchEvent(new Event("input", { bubbles: true, composed: true }));
  }

  private handleChange() {
    this.dispatchEvent(new Event("change", { bubbles: true, composed: true }));
  }

  render() {
    return html`<textarea
      part="textarea"
      .value=${this.value}
      placeholder=${this.placeholder}
      aria-label=${this.label || nothing}
      ?disabled=${this.disabled}
      @input=${this.handleInput}
      @change=${this.handleChange}
    ></textarea>`;
  }
}

@customElement("ui-select")
export class UiSelect extends UiScopedElement {
  static styles = fieldStyles;

  @property() value = "";
  @property() label = "";
  @property({ attribute: false }) options: UiSelectOption[] = [];
  @property({ type: Boolean, reflect: true }) disabled = false;

  private handleChange(event: Event) {
    this.value = (event.target as HTMLSelectElement).value;
    this.dispatchEvent(new Event("change", { bubbles: true, composed: true }));
  }

  render() {
    return html`<select
      part="select"
      .value=${this.value}
      aria-label=${this.label || nothing}
      ?disabled=${this.disabled}
      @change=${this.handleChange}
    >
      ${this.options.length
        ? this.options.map(
            (option) =>
              html`<option value=${option.value} ?disabled=${option.disabled}>
                ${option.label}
              </option>`,
          )
        : html`<slot></slot>`}
    </select>`;
  }
}

@customElement("ui-range")
export class UiRange extends UiScopedElement {
  @property({ type: Number }) min = 0;
  @property({ type: Number }) max = 100;
  @property({ type: Number }) step = 1;
  @property({ type: Number }) value = 0;
  @property() label = "";
  @property({ type: Boolean, reflect: true }) disabled = false;

  static styles = [
    scopedStyles,
    controlFocus,
    css`
      :host {
        display: block;
      }

      .wrap {
        display: grid;
        gap: 6px;
      }

      .meta {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
        color: #cbd5e1;
        font-size: 12px;
        font-weight: 700;
      }

      input {
        width: 100%;
        accent-color: var(--ui-range-color, #38bdf8);
      }

      input:disabled {
        cursor: not-allowed;
        opacity: 0.5;
      }
    `,
  ];

  private handleInput(event: Event) {
    this.value = Number((event.target as HTMLInputElement).value);
    this.dispatchEvent(new Event("input", { bubbles: true, composed: true }));
  }

  private handleChange() {
    this.dispatchEvent(new Event("change", { bubbles: true, composed: true }));
  }

  render() {
    return html`<label class="wrap" part="range">
      <span class="meta">
        <span><slot name="label">${this.label}</slot></span>
        <span><slot name="value">${this.value}</slot></span>
      </span>
      <input
        type="range"
        .min=${String(this.min)}
        .max=${String(this.max)}
        .step=${String(this.step)}
        .value=${String(this.value)}
        ?disabled=${this.disabled}
        @input=${this.handleInput}
        @change=${this.handleChange}
      />
    </label>`;
  }
}

@customElement("ui-toggle")
export class UiToggle extends UiScopedElement {
  @property({ type: Boolean, reflect: true }) checked = false;
  @property({ type: Boolean, reflect: true }) disabled = false;
  @property() label = "";

  static styles = [
    scopedStyles,
    controlFocus,
    css`
      :host {
        display: inline-block;
      }

      label {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        color: #f8fafc;
        cursor: pointer;
        font-size: 13px;
        font-weight: 700;
      }

      input {
        position: absolute;
        opacity: 0;
        pointer-events: none;
      }

      .track {
        display: inline-flex;
        width: 42px;
        height: 24px;
        align-items: center;
        border: 1px solid rgba(148, 163, 184, 0.36);
        border-radius: 999px;
        background: rgba(51, 65, 85, 0.82);
        padding: 2px;
        transition: background 120ms ease;
      }

      .thumb {
        width: 18px;
        height: 18px;
        border-radius: 999px;
        background: #e2e8f0;
        transition: transform 120ms ease;
      }

      input:checked + .track {
        border-color: rgba(56, 189, 248, 0.56);
        background: rgba(14, 165, 233, 0.72);
      }

      input:checked + .track .thumb {
        transform: translateX(18px);
      }

      label:has(input:disabled) {
        cursor: not-allowed;
        opacity: 0.5;
      }
    `,
  ];

  private handleChange(event: Event) {
    this.checked = (event.target as HTMLInputElement).checked;
    this.dispatchEvent(new Event("change", { bubbles: true, composed: true }));
  }

  render() {
    return html`<label part="toggle">
      <input
        type="checkbox"
        .checked=${this.checked}
        ?disabled=${this.disabled}
        aria-label=${this.label || nothing}
        @change=${this.handleChange}
      />
      <span class="track" aria-hidden="true"><span class="thumb"></span></span>
      <slot>${this.label}</slot>
    </label>`;
  }
}

@customElement("ui-checkbox")
export class UiCheckbox extends UiScopedElement {
  @property({ type: Boolean, reflect: true }) checked = false;
  @property({ type: Boolean, reflect: true }) disabled = false;
  @property() label = "";

  static styles = [
    scopedStyles,
    controlFocus,
    css`
      :host {
        display: inline-block;
      }

      label {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        color: #f8fafc;
        cursor: pointer;
        font-size: 13px;
        font-weight: 700;
      }

      input {
        width: 16px;
        height: 16px;
        accent-color: #38bdf8;
      }

      label:has(input:disabled) {
        cursor: not-allowed;
        opacity: 0.5;
      }
    `,
  ];

  private handleChange(event: Event) {
    this.checked = (event.target as HTMLInputElement).checked;
    this.dispatchEvent(new Event("change", { bubbles: true, composed: true }));
  }

  render() {
    return html`<label part="checkbox">
      <input
        type="checkbox"
        .checked=${this.checked}
        ?disabled=${this.disabled}
        aria-label=${this.label || nothing}
        @change=${this.handleChange}
      />
      <slot>${this.label}</slot>
    </label>`;
  }
}

@customElement("ui-stat-grid")
export class UiStatGrid extends UiScopedElement {
  @property({ type: Number }) columns = 3;

  static styles = [
    scopedStyles,
    css`
      :host {
        display: block;
      }

      div {
        display: grid;
        grid-template-columns: repeat(
          var(--ui-stat-grid-columns, 3),
          minmax(0, 1fr)
        );
        gap: var(--ui-stat-grid-gap, 8px);
      }

      @media (max-width: 720px) {
        div {
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }
      }
    `,
  ];

  render() {
    return html`<div
      part="grid"
      style="--ui-stat-grid-columns:${Math.max(1, this.columns)}"
    >
      <slot></slot>
    </div>`;
  }
}

@customElement("ui-stat")
export class UiStat extends UiScopedElement {
  @property() label = "";
  @property() value = "";
  @property({ reflect: true }) tone: UiTone = "default";

  static styles = [
    scopedStyles,
    css`
      :host {
        display: block;
      }

      div {
        min-width: 0;
        border: 1px solid var(--ui-stat-border, rgba(148, 163, 184, 0.22));
        border-radius: var(--ui-radius, 8px);
        background: var(--ui-stat-bg, rgba(15, 23, 42, 0.58));
        padding: var(--ui-stat-padding, 8px 10px);
      }

      .label {
        color: #94a3b8;
        font-size: 11px;
        font-weight: 700;
        line-height: 1.2;
      }

      .value {
        margin-top: 3px;
        color: var(--ui-stat-color, #f8fafc);
        font-size: var(--ui-stat-value-size, 16px);
        font-weight: 800;
        line-height: 1.1;
        overflow-wrap: anywhere;
      }
    `,
  ];

  updated() {
    this.style.setProperty("--ui-stat-color", toneText[this.tone]);
    this.style.setProperty("--ui-stat-border", toneBorder[this.tone]);
    this.style.setProperty("--ui-stat-bg", toneBackground[this.tone]);
  }

  render() {
    return html`<div part="stat">
      <div class="label"><slot name="label">${this.label}</slot></div>
      <div class="value"><slot>${this.value}</slot></div>
    </div>`;
  }
}

@customElement("ui-table")
export class UiTable extends UiScopedElement {
  static styles = [
    scopedStyles,
    css`
      :host {
        display: block;
        overflow: hidden;
        border: 1px solid rgba(148, 163, 184, 0.18);
        border-radius: var(--ui-radius, 8px);
      }

      div {
        display: grid;
      }
    `,
  ];

  render() {
    return html`<div part="table"><slot></slot></div>`;
  }
}

@customElement("ui-table-row")
export class UiTableRow extends UiScopedElement {
  @property({ reflect: true }) tone: UiTone = "default";

  static styles = [
    scopedStyles,
    css`
      :host {
        display: grid;
        grid-template-columns: var(--ui-table-columns, minmax(0, 1fr));
        align-items: center;
        min-height: var(--ui-table-row-min-height, 34px);
        border-bottom: 1px solid rgba(148, 163, 184, 0.12);
        background: var(--ui-table-row-bg, rgba(15, 23, 42, 0.38));
        color: var(--ui-table-row-color, #f8fafc);
      }

      :host(:last-child) {
        border-bottom: 0;
      }
    `,
  ];

  updated() {
    this.style.setProperty("--ui-table-row-color", toneText[this.tone]);
    this.style.setProperty("--ui-table-row-bg", toneBackground[this.tone]);
  }

  render() {
    return html`<slot></slot>`;
  }
}

@customElement("ui-table-cell")
export class UiTableCell extends UiScopedElement {
  @property({ reflect: true }) align: UiAlign = "left";

  static styles = [
    scopedStyles,
    css`
      :host {
        display: block;
        min-width: 0;
        padding: var(--ui-table-cell-padding, 8px 10px);
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      :host([align="center"]) {
        text-align: center;
      }

      :host([align="right"]) {
        text-align: right;
      }
    `,
  ];

  render() {
    return html`<slot></slot>`;
  }
}

@customElement("ui-list-row")
export class UiListRow extends UiScopedElement {
  static styles = [
    scopedStyles,
    css`
      :host {
        display: flex;
        min-width: 0;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
        border-bottom: 1px solid rgba(148, 163, 184, 0.12);
        padding: var(--ui-list-row-padding, 9px 10px);
      }

      :host(:last-child) {
        border-bottom: 0;
      }
    `,
  ];

  render() {
    return html`<slot></slot>`;
  }
}

@customElement("ui-empty-state")
export class UiEmptyState extends UiScopedElement {
  @property() label = "";
  @property() description = "";

  static styles = [
    scopedStyles,
    css`
      :host {
        display: block;
      }

      div {
        color: #cbd5e1;
        padding: var(--ui-empty-padding, 24px);
        text-align: center;
      }

      .label {
        color: #f8fafc;
        font-weight: 800;
      }

      .description {
        margin-top: 6px;
        color: #94a3b8;
        font-size: 13px;
        line-height: 1.4;
      }
    `,
  ];

  render() {
    return html`<div part="empty">
      <div class="label"><slot name="label">${this.label}</slot></div>
      ${this.description
        ? html`<div class="description">${this.description}</div>`
        : nothing}
      <slot></slot>
    </div>`;
  }
}

@customElement("ui-loading-state")
export class UiLoadingState extends UiScopedElement {
  @property() label = "Loading";

  static styles = [
    scopedStyles,
    css`
      :host {
        display: block;
      }

      div {
        color: #cbd5e1;
        padding: var(--ui-loading-padding, 18px);
        text-align: center;
      }
    `,
  ];

  render() {
    return html`<div part="loading" role="status">
      <slot>${this.label}</slot>
    </div>`;
  }
}

@customElement("ui-modal-shell")
export class UiModalShell extends UiScopedElement {
  @property({ type: Boolean, reflect: true }) open = false;
  @property({ type: Boolean, reflect: true }) inline = false;
  @property({ type: Boolean, reflect: true }) hideCloseButton = false;
  @property() maxWidth = "";
  @property() label = "";

  static styles = [
    scopedStyles,
    css`
      :host {
        display: contents;
      }

      .backdrop {
        position: fixed;
        inset: 0;
        z-index: var(--ui-modal-z-index, 9999);
        display: flex;
        align-items: center;
        justify-content: center;
        overflow: hidden;
        background: rgba(0, 0, 0, 0.6);
        padding: var(--ui-modal-padding, 16px);
      }

      :host([inline]) .backdrop {
        position: relative;
        z-index: auto;
        width: 100%;
        height: 100%;
        align-items: stretch;
        background: transparent;
        padding: 0;
      }

      .dialog {
        position: relative;
        display: flex;
        width: min(100%, var(--ui-modal-max-width, 900px));
        max-height: calc(100vh - 32px);
        min-height: 0;
        flex-direction: column;
        overflow: hidden;
        border: 1px solid rgba(148, 163, 184, 0.18);
        border-radius: var(--ui-modal-radius, 12px);
        background: rgba(15, 23, 42, 0.92);
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.45);
        color: #f8fafc;
      }

      :host([inline]) .dialog {
        width: 100%;
        max-height: none;
        border-radius: 0;
        box-shadow: none;
      }

      .close {
        position: absolute;
        top: 10px;
        right: 10px;
        z-index: 1;
      }
    `,
  ];

  private close() {
    this.dispatchEvent(
      new CustomEvent("close", { bubbles: true, composed: true }),
    );
  }

  private handleBackdropClick() {
    if (!this.inline) {
      this.close();
    }
  }

  private handleKeydown(event: KeyboardEvent) {
    if (event.key === "Escape" && !this.inline) {
      event.preventDefault();
      this.close();
    }
  }

  render() {
    if (!this.open && !this.inline) return html``;

    const modalStyle = this.maxWidth
      ? `--ui-modal-max-width:${this.maxWidth};`
      : "";

    return html`<aside
      class="backdrop"
      @click=${this.handleBackdropClick}
      @keydown=${this.handleKeydown}
    >
      <section
        class="dialog"
        part="dialog"
        role="dialog"
        aria-modal=${this.inline ? "false" : "true"}
        aria-label=${this.label || nothing}
        tabindex="0"
        style=${modalStyle}
        @click=${(event: Event) => event.stopPropagation()}
      >
        ${this.hideCloseButton
          ? nothing
          : html`<ui-icon-button
              class="close"
              label="Close"
              variant="ghost"
              size="sm"
              @click=${this.close}
              >x</ui-icon-button
            >`}
        <slot></slot>
      </section>
    </aside>`;
  }
}

@customElement("ui-modal-header")
export class UiModalHeader extends UiScopedElement {
  @property() title = "";

  static styles = [
    scopedStyles,
    css`
      :host {
        display: block;
      }

      header {
        display: flex;
        min-height: 52px;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        border-bottom: 1px solid rgba(148, 163, 184, 0.18);
        padding: var(--ui-modal-header-padding, 14px 18px);
      }

      h2 {
        min-width: 0;
        margin: 0;
        color: #f8fafc;
        font-size: var(--ui-modal-title-size, 20px);
        font-weight: 800;
        letter-spacing: 0;
        line-height: 1.15;
        overflow-wrap: anywhere;
      }
    `,
  ];

  render() {
    return html`<header part="header">
      <h2><slot name="title">${this.title}</slot></h2>
      <slot name="actions"></slot>
    </header>`;
  }
}

@customElement("ui-modal-body")
export class UiModalBody extends UiScopedElement {
  static styles = [
    scopedStyles,
    css`
      :host {
        display: block;
        min-height: 0;
        overflow: auto;
      }

      div {
        padding: var(--ui-modal-body-padding, 16px 18px);
      }
    `,
  ];

  render() {
    return html`<div part="body"><slot></slot></div>`;
  }
}

@customElement("ui-modal-footer")
export class UiModalFooter extends UiScopedElement {
  static styles = [
    scopedStyles,
    css`
      :host {
        display: block;
      }

      footer {
        display: flex;
        align-items: center;
        justify-content: flex-end;
        gap: 8px;
        border-top: 1px solid rgba(148, 163, 184, 0.18);
        padding: var(--ui-modal-footer-padding, 12px 18px);
      }
    `,
  ];

  render() {
    return html`<footer part="footer"><slot></slot></footer>`;
  }
}

@customElement("ui-menu")
export class UiMenu extends UiScopedElement {
  static styles = [
    scopedStyles,
    css`
      :host {
        display: block;
        overflow: hidden;
        border: 1px solid rgba(148, 163, 184, 0.22);
        border-radius: var(--ui-radius, 8px);
        background: rgba(15, 23, 42, 0.94);
        box-shadow: 0 12px 40px rgba(0, 0, 0, 0.34);
      }
    `,
  ];

  render() {
    return html`<slot></slot>`;
  }
}

@customElement("ui-menu-item")
export class UiMenuItem extends UiScopedElement {
  @property({ type: Boolean, reflect: true }) disabled = false;

  static styles = [
    scopedStyles,
    controlFocus,
    css`
      :host {
        display: block;
      }

      button {
        display: flex;
        width: 100%;
        align-items: center;
        gap: 8px;
        border: 0;
        background: transparent;
        color: #f8fafc;
        cursor: pointer;
        padding: 9px 10px;
        text-align: left;
      }

      button:hover:not(:disabled) {
        background: rgba(255, 255, 255, 0.08);
      }

      button:disabled {
        cursor: not-allowed;
        opacity: 0.5;
      }
    `,
  ];

  render() {
    return html`<button type="button" ?disabled=${this.disabled}>
      <slot></slot>
    </button>`;
  }
}

@customElement("ui-row")
export class UiRow extends UiScopedElement {
  @property({ reflect: true }) align: UiAlign = "left";

  static styles = [
    scopedStyles,
    css`
      :host {
        display: flex;
        min-width: 0;
        align-items: center;
        justify-content: flex-start;
        gap: var(--ui-row-gap, 8px);
      }

      :host([align="center"]) {
        justify-content: center;
      }

      :host([align="right"]) {
        justify-content: flex-end;
      }

      :host([align="between"]) {
        justify-content: space-between;
      }
    `,
  ];

  render() {
    return html`<slot></slot>`;
  }
}

@customElement("ui-stack")
export class UiStack extends UiScopedElement {
  static styles = [
    scopedStyles,
    css`
      :host {
        display: grid;
        gap: var(--ui-stack-gap, 10px);
      }
    `,
  ];

  render() {
    return html`<slot></slot>`;
  }
}

@customElement("ui-grid")
export class UiGrid extends UiScopedElement {
  @property({ type: Number }) columns = 2;

  static styles = [
    scopedStyles,
    css`
      :host {
        display: grid;
        grid-template-columns: repeat(
          var(--ui-grid-columns, 2),
          minmax(0, 1fr)
        );
        gap: var(--ui-grid-gap, 10px);
      }

      @media (max-width: 720px) {
        :host {
          grid-template-columns: 1fr;
        }
      }
    `,
  ];

  render() {
    this.style.setProperty(
      "--ui-grid-columns",
      String(Math.max(1, this.columns)),
    );
    return html`<slot></slot>`;
  }
}

export const ui = {
  classMap,
};

export type UiTemplate = TemplateResult;

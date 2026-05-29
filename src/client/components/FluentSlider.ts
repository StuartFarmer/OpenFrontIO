import { LitElement, html } from "lit";
import { customElement, property, query, state } from "lit/decorators.js";
import { translateText } from "../Utils";
import "../hud/ui";

@customElement("fluent-slider")
export class FluentSlider extends LitElement {
  createRenderRoot() {
    return this;
  }

  @property({ type: Number }) value = 0;
  @property({ type: Number }) min = 0;
  @property({ type: Number }) max = 400;
  @property({ type: Number }) step = 1;
  @property({ type: String }) labelKey = "";
  @property({ type: String }) disabledKey = "";
  @property({ type: Number }) defaultValue: number | undefined = undefined;
  @property({ type: String }) defaultLabelKey = "";

  @state() private isEditing = false;

  @query("hud-input") private numberInput!: HTMLElement & {
    shadowRoot: ShadowRoot | null;
  };

  private dispatchValueChange() {
    this.dispatchEvent(
      new CustomEvent("value-changed", {
        detail: { value: this.value },
        bubbles: true,
        composed: true,
      }),
    );
  }

  private readNumberControl(event: Event): number {
    const target = event.target as HTMLElement & {
      value?: string | number;
      valueAsNumber?: number;
    };
    return typeof target.valueAsNumber === "number"
      ? target.valueAsNumber
      : Number(target.value ?? this.min);
  }

  private handleSliderInput(e: Event) {
    this.value = this.readNumberControl(e);
  }

  private handleSliderChange(e: Event) {
    this.value = this.readNumberControl(e);
    this.dispatchValueChange();
  }

  private handleNumberInput(e: Event) {
    let val = this.readNumberControl(e);
    if (isNaN(val)) {
      val = this.min;
    }
    if (val < this.min) val = this.min;
    if (val > this.max) val = this.max;
    this.value = val;
    // Don't dispatch value change on every input - only on blur/enter
  }

  private handleNumberComplete() {
    // Dispatch the value change when editing is complete
    this.dispatchValueChange();
  }

  private handleNumberKeyDown(e: KeyboardEvent) {
    if (e.key === "Enter") {
      this.isEditing = false;
      this.handleNumberComplete();
    }
  }

  private enableEditing() {
    this.isEditing = true;
    this.updateComplete.then(() =>
      this.numberInput?.shadowRoot?.querySelector("input")?.focus(),
    );
  }

  render() {
    const percentage =
      this.max === this.min
        ? 0
        : ((this.value - this.min) / (this.max - this.min)) * 100;
    return html`
      <div
        class="flex flex-col items-center justify-center gap-1 w-full text-center"
      >
        <hud-range
          .min=${this.min}
          .max=${this.max}
          .step=${this.step}
          .value=${this.value}
          label=${this.labelKey ? translateText(this.labelKey) : "Value"}
          style="--hud-range-fill-percent: ${percentage}%;"
          @input=${this.handleSliderInput}
          @change=${this.handleSliderChange}
        ></hud-range>
        <div
          class="text-xs uppercase font-bold tracking-wider text-center w-full leading-tight mb-1 flex flex-col items-center ${this
            .value > 0
            ? "text-white"
            : "text-white/60"}"
        >
          <span>${this.labelKey ? translateText(this.labelKey) : ""}</span>
          ${this.isEditing
            ? html`<hud-input
                type="number"
                .min=${this.min}
                .max=${this.max}
                .value=${String(this.value)}
                class="w-[60px] mt-1"
                style="--hud-input-height: 28px; --hud-input-font-size: 14px; --hud-input-text-align: center; --hud-input-background: rgba(0,0,0,0.6); --hud-input-border-color: rgba(255,255,255,0.2);"
                @input=${this.handleNumberInput}
                @change=${() => {
                  this.isEditing = false;
                  this.handleNumberComplete();
                }}
                @keydown=${this.handleNumberKeyDown}
              ></hud-input>`
            : html`<span
                class="cursor-pointer min-w-[60px] inline-block text-center text-sm font-bold select-none hover:text-white transition-colors mt-1 ${this
                  .value > 0
                  ? "text-white"
                  : "text-white/60"}"
                role="button"
                tabindex="0"
                @click=${this.enableEditing}
                @keydown=${(e: KeyboardEvent) => {
                  if (e.key === "Enter" || e.key === " ") {
                    this.enableEditing();
                    e.preventDefault();
                  }
                }}
              >
                ${this.value === 0 && this.disabledKey
                  ? translateText(this.disabledKey)
                  : this.defaultValue !== undefined &&
                      this.value === this.defaultValue &&
                      this.defaultLabelKey
                    ? html`${this.value}
                        <span class="text-white/40 uppercase"
                          >(${translateText(this.defaultLabelKey)})</span
                        >`
                    : this.value}
              </span>`}
        </div>
      </div>
    `;
  }
}

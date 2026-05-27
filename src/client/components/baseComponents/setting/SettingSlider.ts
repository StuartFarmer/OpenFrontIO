import { LitElement, html } from "lit";
import { customElement, property } from "lit/decorators.js";
import "../../ui";

@customElement("setting-slider")
export class SettingSlider extends LitElement {
  @property() label = "Setting";
  @property() description = "";
  @property({ type: Number }) value = 0;
  @property({ type: Number }) min = 0;
  @property({ type: Number }) max = 100;
  @property({ type: Boolean }) easter = false;

  createRenderRoot() {
    return this;
  }

  private handleInput(e: Event) {
    const input = e.target as HTMLElement & { value?: number | string };
    this.value = Number(input.value);

    this.dispatchEvent(
      new CustomEvent("change", {
        detail: { value: this.value },
        bubbles: true,
        composed: true,
      }),
    );
  }

  private stopNestedChange(e: Event) {
    e.stopPropagation();
  }

  render() {
    const rainbowClass = this.easter
      ? "bg-[linear-gradient(270deg,#990033,#996600,#336600,#008080,#1c3f99,#5e0099,#990033)] bg-[length:1400%_1400%] animate-rainbow-bg text-white hover:bg-[linear-gradient(270deg,#990033,#996600,#336600,#008080,#1c3f99,#5e0099,#990033)]"
      : "";

    return html`
      <div
        class="flex flex-col sm:flex-row sm:items-center sm:justify-between w-full p-4 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all gap-3 sm:gap-4 ${rainbowClass}"
      >
        <div class="flex flex-col flex-1 min-w-0 sm:mr-4">
          <label class="text-white font-bold text-base block mb-1"
            >${this.label}</label
          >
          <div class="text-white/50 text-sm leading-snug">
            ${this.description}
          </div>
        </div>

        <div
          class="flex flex-col items-start sm:items-end gap-2 shrink-0 sm:w-auto sm:w-[200px]"
        >
          <div class="flex items-center gap-2 w-full">
            <span
              class="text-white font-bold text-sm shrink-0 text-right min-w-[3ch]"
              >${this.value}%</span
            >
            <ui-range
              class="flex-1"
              style="--ui-range-color: var(--color-malibu-blue, #38bdf8)"
              .min=${this.min}
              .max=${this.max}
              .value=${this.value}
              label=${this.label}
              @input=${this.handleInput}
              @change=${this.stopNestedChange}
            >
              <span slot="label"></span>
              <span slot="value"></span>
            </ui-range>
          </div>
        </div>
      </div>
    `;
  }
}

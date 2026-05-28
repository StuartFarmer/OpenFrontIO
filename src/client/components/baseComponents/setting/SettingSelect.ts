import { LitElement, html } from "lit";
import { customElement, property } from "lit/decorators.js";
import "../../../hud/ui";

type SelectOption = {
  value: number | string;
  label: string;
};

@customElement("setting-select")
export class SettingSelect extends LitElement {
  @property() label = "Setting";
  @property() description = "";
  @property({ type: Array }) options: SelectOption[] = [];
  @property({ type: String }) value = "";

  createRenderRoot() {
    return this;
  }

  private handleChange(e: Event) {
    e.stopPropagation();
    const input = e.target as HTMLElement & { value?: string };
    const selected = this.options.find(
      (option) => String(option.value) === String(input.value),
    );
    const selectedValue = selected?.value ?? String(input.value ?? "");
    this.value = String(selectedValue);

    this.dispatchEvent(
      new CustomEvent("change", {
        detail: { value: selectedValue },
        bubbles: true,
        composed: true,
      }),
    );
  }

  render() {
    return html`
      <div
        class="flex flex-col w-full p-4 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all gap-3"
      >
        <div class="flex flex-col min-w-0">
          <label
            class="text-white font-bold text-base block mb-1"
            for="setting-select-input"
            >${this.label}</label
          >
          <div class="text-white/50 text-sm leading-snug">
            ${this.description}
          </div>
        </div>
        <hud-select
          id="setting-select-input"
          label=${this.label}
          .value=${String(this.value)}
          .options=${this.options.map((option) => ({
            label: option.label,
            value: String(option.value),
          }))}
          @change=${this.handleChange}
        ></hud-select>
      </div>
    `;
  }
}

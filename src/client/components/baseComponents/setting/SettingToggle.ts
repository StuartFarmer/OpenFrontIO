import { LitElement, html } from "lit";
import { customElement, property } from "lit/decorators.js";
import "../../ui";

@customElement("setting-toggle")
export class SettingToggle extends LitElement {
  @property() label = "Setting";
  @property() description = "";
  @property() id = "";
  @property({ type: Boolean, reflect: true }) checked = false;
  @property({ type: Boolean }) easter = false;

  createRenderRoot() {
    return this;
  }

  private handleChange(e: Event) {
    const input = e.target as HTMLElement & { checked?: boolean };
    this.checked = Boolean(input.checked);
  }

  render() {
    const rainbowClass = this.easter
      ? "bg-[linear-gradient(270deg,#990033,#996600,#336600,#008080,#1c3f99,#5e0099,#990033)] bg-[length:1400%_1400%] animate-rainbow-bg text-white hover:bg-[linear-gradient(270deg,#990033,#996600,#336600,#008080,#1c3f99,#5e0099,#990033)]"
      : "";

    return html`
      <div
        class="flex flex-row items-center justify-between w-full p-4 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all gap-4 ${rainbowClass}"
      >
        <div class="flex flex-col flex-1 min-w-0 mr-4">
          <div class="text-white font-bold text-base block mb-1">
            ${this.label}
          </div>
          <div class="text-white/50 text-sm leading-snug">
            ${this.description}
          </div>
        </div>

        <ui-toggle
          id=${this.id}
          class="shrink-0"
          label=${this.label}
          .checked=${this.checked}
          @change=${this.handleChange}
        ></ui-toggle>
      </div>
    `;
  }
}

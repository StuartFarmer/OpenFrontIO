import { LitElement, TemplateResult, html } from "lit";
import { customElement, property } from "lit/decorators.js";
import "../hud/ui";

@customElement("lobby-config-item")
export class LobbyConfigItem extends LitElement {
  @property({ type: String }) label = "";
  @property({ attribute: false }) value: string | TemplateResult = "";

  createRenderRoot() {
    return this;
  }

  render() {
    return html`
      <hud-stat
        class="block min-w-[100px] text-center"
        style="--hud-stat-padding: 0.75rem; --hud-stat-value-size: 0.875rem;"
      >
        <span
          slot="label"
          class="text-white/40 text-[10px] font-bold uppercase tracking-wider"
          >${this.label}</span
        >
        <span
          class="text-white font-bold text-sm w-full break-words hyphens-auto"
          >${this.value}</span
        >
      </hud-stat>
    `;
  }
}

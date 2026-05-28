import { LitElement, html } from "lit";
import { customElement, property } from "lit/decorators.js";
import "../../../hud/ui";

@customElement("player-stats-grid")
export class PlayerStatsGrid extends LitElement {
  createRenderRoot() {
    return this;
  }

  @property({ type: Array }) titles: string[] = [];
  @property({ type: Array }) values: Array<string | number> = [];

  // Currently fixed to display 4 stats (can be changed if needed)
  private readonly VISIBLE_STATS_COUNT = 4;

  render() {
    return html`
      <hud-stat-grid columns="4" style="--hud-stat-grid-gap: 16px" class="mb-2">
        ${Array(this.VISIBLE_STATS_COUNT)
          .fill(0)
          .map(
            (_, i) => html`
              <hud-stat
                style="--hud-stat-padding: 16px; --hud-stat-radius: 12px; --hud-stat-value-size: 24px"
              >
                <span slot="label"> ${this.titles[i] ?? ""} </span>
                ${this.values[i] ?? ""}
              </hud-stat>
            `,
          )}
      </hud-stat-grid>
    `;
  }
}

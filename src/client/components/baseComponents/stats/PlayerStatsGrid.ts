import { LitElement, html } from "lit";
import { customElement, property } from "lit/decorators.js";
import "../../ui";

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
      <ui-stat-grid columns="4" style="--ui-stat-grid-gap: 16px" class="mb-2">
        ${Array(this.VISIBLE_STATS_COUNT)
          .fill(0)
          .map(
            (_, i) => html`
              <ui-stat
                style="--ui-stat-padding: 16px; --ui-stat-radius: 12px; --ui-stat-value-size: 24px"
              >
                <span slot="label"> ${this.titles[i] ?? ""} </span>
                ${this.values[i] ?? ""}
              </ui-stat>
            `,
          )}
      </ui-stat-grid>
    `;
  }
}

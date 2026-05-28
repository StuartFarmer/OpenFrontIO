import { LitElement, TemplateResult, html } from "lit";
import { customElement, property } from "lit/decorators.js";
import {
  PlayerStats,
  boatUnits,
  bombUnits,
  otherUnits,
} from "../../../../core/StatsSchemas";
import { renderNumber, translateText } from "../../../Utils";
import "../../../hud/ui";

@customElement("player-stats-table")
export class PlayerStatsTable extends LitElement {
  createRenderRoot() {
    return this;
  }

  @property({ type: Object }) stats: PlayerStats;

  private renderSection(
    title: string,
    headers: string[],
    rows: TemplateResult[][],
    firstColumnLeft = true,
  ) {
    return html`
      <div class="w-full">
        <div
          class="text-gray-400 text-sm font-bold uppercase tracking-wider mb-2"
        >
          ${title}
        </div>
        <div class="overflow-x-auto">
          <hud-table>
            <hud-table-row>
              ${headers.map(
                (header, index) => html`
                  <hud-table-cell
                    header
                    align=${firstColumnLeft && index === 0 ? "left" : "center"}
                  >
                    ${header}
                  </hud-table-cell>
                `,
              )}
            </hud-table-row>
            ${rows.map(
              (row) => html`
                <hud-table-row interactive>
                  ${row.map(
                    (cell, index) => html`
                      <hud-table-cell
                        align=${firstColumnLeft && index === 0
                          ? "left"
                          : "center"}
                      >
                        ${cell}
                      </hud-table-cell>
                    `,
                  )}
                </hud-table-row>
              `,
            )}
          </hud-table>
        </div>
      </div>
    `;
  }

  render() {
    const buildingRows = otherUnits.map((key) => {
      const built = this.stats?.units?.[key]?.[0] ?? 0n;
      const destroyed = this.stats?.units?.[key]?.[1] ?? 0n;
      const captured = this.stats?.units?.[key]?.[2] ?? 0n;
      const lost = this.stats?.units?.[key]?.[3] ?? 0n;
      return [
        html`${translateText(`player_stats_table.unit.${key}`)}`,
        html`${renderNumber(built)}`,
        html`${renderNumber(destroyed)}`,
        html`${renderNumber(captured)}`,
        html`${renderNumber(lost)}`,
      ];
    });

    const boatRows = boatUnits.map((key) => {
      const sent = this.stats?.boats?.[key]?.[0] ?? 0n;
      const arrived = this.stats?.boats?.[key]?.[1] ?? 0n;
      const destroyed = this.stats?.boats?.[key]?.[3] ?? 0n;
      return [
        html`${translateText(`player_stats_table.unit.${key}`)}`,
        html`${renderNumber(sent)}`,
        html`${renderNumber(destroyed)}`,
        html`${renderNumber(arrived)}`,
      ];
    });

    const bombRows = bombUnits.map((bomb) => {
      const launched = this.stats?.bombs?.[bomb]?.[0] ?? 0n;
      const landed = this.stats?.bombs?.[bomb]?.[1] ?? 0n;
      const intercepted = this.stats?.bombs?.[bomb]?.[2] ?? 0n;
      return [
        html`${translateText(`player_stats_table.unit.${bomb}`)}`,
        html`${renderNumber(launched)}`,
        html`${renderNumber(landed)}`,
        html`${renderNumber(intercepted)}`,
      ];
    });

    return html`
      <div class="grid grid-cols-1 gap-6 w-full">
        ${this.renderSection(
          translateText("player_stats_table.building_stats"),
          [
            translateText("player_stats_table.building"),
            translateText("player_stats_table.built"),
            translateText("player_stats_table.destroyed"),
            translateText("player_stats_table.captured"),
            translateText("player_stats_table.lost"),
          ],
          buildingRows,
        )}
        ${this.renderSection(
          translateText("player_stats_table.ship_arrivals"),
          [
            translateText("player_stats_table.ship_type"),
            translateText("player_stats_table.sent"),
            translateText("player_stats_table.destroyed"),
            translateText("player_stats_table.arrived"),
          ],
          boatRows,
        )}
        ${this.renderSection(
          translateText("player_stats_table.nuke_stats"),
          [
            translateText("player_stats_table.weapon"),
            translateText("player_stats_table.launched"),
            translateText("player_stats_table.landed"),
            translateText("player_stats_table.hits"),
          ],
          bombRows,
        )}

        <div class="w-full">
          <div
            class="text-gray-400 text-sm font-bold uppercase tracking-wider mb-2"
          >
            ${translateText("player_stats_table.player_metrics")}
          </div>
          <div class="overflow-x-auto mb-4">
            <hud-table>
              <hud-table-row>
                <hud-table-cell header>
                  ${translateText("player_stats_table.attack")}
                </hud-table-cell>
                <hud-table-cell header>
                  ${translateText("player_stats_table.sent")}
                </hud-table-cell>
                <hud-table-cell header>
                  ${translateText("player_stats_table.received")}
                </hud-table-cell>
                <hud-table-cell header>
                  ${translateText("player_stats_table.cancelled")}
                </hud-table-cell>
              </hud-table-row>
              <hud-table-row interactive>
                <hud-table-cell>
                  ${translateText("player_stats_table.count")}
                </hud-table-cell>
                <hud-table-cell>
                  ${renderNumber(this.stats?.attacks?.[0] ?? 0n)}
                </hud-table-cell>
                <hud-table-cell>
                  ${renderNumber(this.stats?.attacks?.[1] ?? 0n)}
                </hud-table-cell>
                <hud-table-cell>
                  ${renderNumber(this.stats?.attacks?.[2] ?? 0n)}
                </hud-table-cell>
              </hud-table-row>
            </hud-table>
          </div>

          <div class="overflow-x-auto">
            <hud-table>
              <hud-table-row>
                ${["gold", "workers", "war", "trade", "steal"].map(
                  (key) => html`
                    <hud-table-cell header>
                      ${translateText(`player_stats_table.${key}`)}
                    </hud-table-cell>
                  `,
                )}
              </hud-table-row>
              <hud-table-row interactive>
                ${[0, 1, 2, 3, 4].map(
                  (index) => html`
                    <hud-table-cell>
                      ${renderNumber(this.stats?.gold?.[index] ?? 0n)}
                    </hud-table-cell>
                  `,
                )}
              </hud-table-row>
            </hud-table>
          </div>
        </div>
      </div>
    `;
  }
}

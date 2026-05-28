import { LitElement, html } from "lit";
import { customElement, property } from "lit/decorators.js";
import { translateText } from "../../../Utils";
import "../../../hud/ui";
import { RankType } from "./GameInfoRanking";

const economyRankings = new Set([
  RankType.TotalGold,
  RankType.StolenGold,
  RankType.ConqueredGold,
  RankType.NavalTrade,
  RankType.TrainTrade,
]);
const warRankings = new Set([
  RankType.ConquestHumans,
  RankType.ConquestBots,
  RankType.Atoms,
  RankType.Hydros,
  RankType.MIRV,
]);
const tradeRankings = new Set([RankType.NavalTrade, RankType.TrainTrade]);
const bombRankings = new Set([RankType.Atoms, RankType.Hydros, RankType.MIRV]);
const conquestRankings = new Set([
  RankType.ConquestHumans,
  RankType.ConquestBots,
]);

const isEconomyRanking = (t: RankType) => economyRankings.has(t);
const isTradeRanking = (t: RankType) => tradeRankings.has(t);
const isBombRanking = (t: RankType) => bombRankings.has(t);
const isWarRanking = (t: RankType) => warRankings.has(t);
const isConquestRanking = (t: RankType) => conquestRankings.has(t);

@customElement("ranking-controls")
export class RankingControls extends LitElement {
  @property({ type: String }) rankType = RankType.Lifetime;

  private onSort(type: RankType) {
    this.dispatchEvent(new CustomEvent("sort", { detail: type }));
  }

  private renderMainButtons() {
    return html`
      <div class="flex items-end justify-center p-6 pb-2 gap-5">
        ${this.renderButton(
          RankType.Lifetime,
          this.rankType === RankType.Lifetime,
          "game_info_modal.duration",
        )}
        ${this.renderButton(
          RankType.ConquestHumans,
          isWarRanking(this.rankType),
          "game_info_modal.war",
        )}
        ${this.renderButton(
          RankType.TotalGold,
          isEconomyRanking(this.rankType),
          "game_info_modal.economy",
        )}
      </div>
    `;
  }

  private renderButton(type: RankType, active: boolean, label: string) {
    return html`
      <hud-button
        size="sm"
        variant=${active ? "primary" : "ghost"}
        @click=${() => this.onSort(type)}
      >
        ${translateText(label)}
      </hud-button>
    `;
  }

  private renderWarSubranking() {
    if (!isWarRanking(this.rankType)) return "";

    return html`
      <div class="flex justify-center gap-3 pb-1">
        ${this.renderSubButton(
          RankType.MIRV,
          isBombRanking(this.rankType),
          "game_info_modal.bombs",
        )}
        ${this.renderSubButton(
          RankType.ConquestHumans,
          isConquestRanking(this.rankType),
          "game_info_modal.conquests",
        )}
      </div>
    `;
  }

  private renderEconomySubranking() {
    if (!isEconomyRanking(this.rankType)) return "";

    const econButtons = [
      [RankType.StolenGold, "game_info_modal.pirate"],
      [RankType.ConqueredGold, "game_info_modal.conquered"],
      [RankType.TotalGold, "game_info_modal.total_gold"],
    ];

    return html`
      <div class="flex justify-center gap-3 pb-1">
        ${this.renderSubButton(
          RankType.NavalTrade,
          isTradeRanking(this.rankType),
          "game_info_modal.trade",
        )}
        ${econButtons.map(([type, label]) =>
          this.renderSubButton(type as RankType, this.rankType === type, label),
        )}
      </div>
    `;
  }

  private renderSubButton(type: RankType, active: boolean, label: string) {
    return html`
      <hud-button
        size="xs"
        variant=${active ? "primary" : "ghost"}
        @click=${() => this.onSort(type)}
      >
        ${translateText(label)}
      </hud-button>
    `;
  }

  render() {
    return html`
      ${this.renderMainButtons()} ${this.renderWarSubranking()}
      ${this.renderEconomySubranking()}
    `;
  }

  createRenderRoot() {
    return this;
  }
}

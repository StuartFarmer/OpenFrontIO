import { html, LitElement } from "lit";
import { customElement, state } from "lit/decorators.js";
import {
  ClanLeaderboardEntry,
  ClanLeaderboardResponse,
} from "../../../core/ClanApiSchemas";
import { fetchClanLeaderboard } from "../../ClanApi";
import { translateText } from "../../Utils";
import "../../hud/ui";

export type ClanSortColumn =
  | "rank"
  | "games"
  | "winScore"
  | "lossScore"
  | "ratio";
export type ClanSortOrder = "asc" | "desc";

@customElement("leaderboard-clan-table")
export class LeaderboardClanTable extends LitElement {
  @state() private clanData: ClanLeaderboardResponse | null = null;
  @state() private isLoading = false;
  @state() private error: string | null = null;
  @state() private sortBy: ClanSortColumn = "rank";
  @state() private sortOrder: ClanSortOrder = "asc";

  private hasLoaded = false;

  createRenderRoot() {
    return this;
  }

  public async ensureLoaded() {
    if (this.hasLoaded || this.isLoading) return;
    await this.loadClanLeaderboard();
  }

  public async loadClanLeaderboard() {
    this.isLoading = true;
    this.error = null;

    try {
      const data = await fetchClanLeaderboard();
      if (!data) throw new Error("Failed to load clan leaderboard");

      this.clanData = data;
      this.hasLoaded = true;
      this.dispatchEvent(
        new CustomEvent<{ start: string; end: string }>("date-range-change", {
          detail: { start: data.start, end: data.end },
          bubbles: true,
          composed: true,
        }),
      );
    } catch (error) {
      console.error("loadClanLeaderboard: request failed", error);
      this.error = translateText("leaderboard_modal.error");
    } finally {
      this.isLoading = false;
    }
  }

  private handleSort(column: ClanSortColumn) {
    if (this.sortBy === column) {
      this.sortOrder = this.sortOrder === "asc" ? "desc" : "asc";
    } else {
      this.sortBy = column;
      this.sortOrder = column === "rank" ? "asc" : "desc";
    }
  }

  private getSortedClans(clans: ClanLeaderboardEntry[]) {
    if (this.sortBy === "rank") {
      const base = [...clans];
      return this.sortOrder === "asc" ? base : base.reverse();
    }

    const sorted = [...clans];
    sorted.sort((a, b) => {
      let aVal: number, bVal: number;
      switch (this.sortBy) {
        case "games":
          aVal = a.games;
          bVal = b.games;
          break;
        case "winScore":
          aVal = a.weightedWins;
          bVal = b.weightedWins;
          break;
        case "lossScore":
          aVal = a.weightedLosses;
          bVal = b.weightedLosses;
          break;
        case "ratio":
          aVal = a.weightedWLRatio;
          bVal = b.weightedWLRatio;
          break;
        default:
          return 0;
      }
      return this.sortOrder === "asc" ? aVal - bVal : bVal - aVal;
    });
    return sorted;
  }

  private renderLoading() {
    return html`
      <hud-loading-state
        class="h-full"
        style="--hud-loading-padding: 48px"
        label=${translateText("leaderboard_modal.loading")}
      >
        <span
          class="text-blue-200/80 text-sm font-bold tracking-widest uppercase"
        >
          ${translateText("leaderboard_modal.loading")}
        </span>
      </hud-loading-state>
    `;
  }

  private renderError() {
    return html`
      <div
        class="flex flex-col items-center justify-center p-12 text-white h-full"
      >
        <div
          class="bg-red-500/10 p-6 rounded-full mb-6 border border-red-500/20 shadow-lg shadow-red-500/10"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-12 w-12 text-red-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="1.5"
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>
        <p class="mb-8 text-center text-red-100/80 font-medium">
          ${this.error ?? translateText("leaderboard_modal.error")}
        </p>
        <hud-button variant="danger" @click=${() => this.loadClanLeaderboard()}>
          ${translateText("leaderboard_modal.try_again")}
        </hud-button>
      </div>
    `;
  }

  private renderNoData() {
    return html`
      <hud-empty-state class="h-full" style="--hud-empty-padding: 48px">
        <span slot="label">
          ${translateText("leaderboard_modal.no_data_yet")}
        </span>
        <span class="text-white/30 text-sm">
          ${translateText("leaderboard_modal.no_stats")}
        </span>
      </hud-empty-state>
    `;
  }

  private renderSortButton(label: string, column: ClanSortColumn) {
    const active = this.sortBy === column;
    const direction = active ? (this.sortOrder === "asc" ? "↑" : "↓") : "↕";
    return html`
      <hud-button
        variant=${active ? "active" : "default"}
        style="--hud-button-min-height: 22px; --hud-button-radius: 3px; --hud-button-padding: 3px 6px; --hud-button-background: transparent; --hud-button-border-color: transparent;"
        @click=${() => this.handleSort(column)}
        aria-sort=${active
          ? this.sortOrder === "asc"
            ? "ascending"
            : "descending"
          : "none"}
      >
        ${label} ${direction}
      </hud-button>
    `;
  }

  private renderClanRow(
    clan: ClanLeaderboardEntry,
    displayRank: number,
    maxGames: number,
  ) {
    const rankColor =
      displayRank === 1
        ? "text-yellow-400 bg-yellow-400/10 ring-1 ring-yellow-400/20"
        : displayRank === 2
          ? "text-slate-300 bg-slate-400/10 ring-1 ring-slate-400/20"
          : displayRank === 3
            ? "text-amber-600 bg-amber-600/10 ring-1 ring-amber-600/20"
            : "text-white/40 bg-white/5";
    const rankIcon =
      displayRank === 1
        ? "👑"
        : displayRank === 2
          ? "🥈"
          : displayRank === 3
            ? "🥉"
            : String(displayRank);

    return html`
      <hud-table-row interactive>
        <hud-table-cell align="center" style="width: 4rem">
          <div
            class="w-10 h-10 mx-auto flex items-center justify-center rounded-lg font-bold font-mono text-lg ${rankColor}"
          >
            ${rankIcon}
          </div>
        </hud-table-cell>
        <hud-table-cell align="left" style="width: 5rem">
          <div
            class="px-2.5 py-1 rounded bg-blue-500/10 border border-blue-500/20 inline-block font-bold text-blue-300"
          >
            ${clan.clanTag}
          </div>
        </hud-table-cell>
        <hud-table-cell style="width: 8rem">
          <div class="flex flex-col items-end gap-1">
            <span class="text-white font-mono font-medium"
              >${clan.games.toLocaleString()}</span
            >
            <div class="w-24 h-1 bg-white/10 rounded-full overflow-hidden">
              <div
                class="h-full bg-blue-500/50 rounded-full"
                style="width: ${(clan.games / maxGames) * 100}%"
              ></div>
            </div>
          </div>
        </hud-table-cell>
        <hud-table-cell style="width: 6rem">
          <span class="font-mono text-green-400/90">
            ${clan.weightedWins.toLocaleString(undefined, {
              maximumFractionDigits: 1,
            })}
          </span>
        </hud-table-cell>
        <hud-table-cell style="width: 6rem">
          <span class="font-mono text-red-400/90">
            ${clan.weightedLosses.toLocaleString(undefined, {
              maximumFractionDigits: 1,
            })}
          </span>
        </hud-table-cell>
        <hud-table-cell style="width: 6rem">
          <div class="inline-flex flex-col items-end">
            <span
              class="font-mono font-bold ${clan.weightedWLRatio >= 1
                ? "text-green-400"
                : "text-red-400"}"
              >${clan.weightedWLRatio.toLocaleString(undefined, {
                maximumFractionDigits: 2,
              })}</span
            >
            <span
              class="text-[10px] uppercase text-white/30 font-bold tracking-wider"
            >
              ${translateText("leaderboard_modal.ratio")}
            </span>
          </div>
        </hud-table-cell>
      </hud-table-row>
    `;
  }

  render() {
    if (this.isLoading) return this.renderLoading();
    if (this.error) return this.renderError();
    if (!this.clanData || this.clanData.clans.length === 0)
      return this.renderNoData();

    const { clans } = this.clanData;
    const sorted = this.getSortedClans(clans);
    const maxGames = Math.max(...clans.map((c) => c.games), 1);

    return html`
      <div class="h-full">
        <div class="h-full border border-white/5 bg-black/20">
          <div
            class="h-full overflow-y-auto overflow-x-auto scrollbar-thin scrollbar-thumb-white/20"
          >
            <hud-table class="text-sm table-fixed">
              <hud-table-row class="sticky top-0 z-10 bg-[#1e2433]">
                <hud-table-cell header align="center" style="width: 4rem">
                  ${translateText("leaderboard_modal.rank")}
                </hud-table-cell>
                <hud-table-cell header align="left" style="width: 5rem">
                  ${translateText("leaderboard_modal.clan")}
                </hud-table-cell>
                <hud-table-cell header style="width: 8rem">
                  ${this.renderSortButton(
                    translateText("leaderboard_modal.games"),
                    "games",
                  )}
                </hud-table-cell>
                <hud-table-cell
                  header
                  style="width: 6rem"
                  title=${translateText("leaderboard_modal.win_score_tooltip")}
                >
                  ${this.renderSortButton(
                    translateText("leaderboard_modal.win_score"),
                    "winScore",
                  )}
                </hud-table-cell>
                <hud-table-cell
                  header
                  style="width: 6rem"
                  title=${translateText("leaderboard_modal.loss_score_tooltip")}
                >
                  ${this.renderSortButton(
                    translateText("leaderboard_modal.loss_score"),
                    "lossScore",
                  )}
                </hud-table-cell>
                <hud-table-cell header style="width: 6rem">
                  ${this.renderSortButton(
                    translateText("leaderboard_modal.win_loss_ratio"),
                    "ratio",
                  )}
                </hud-table-cell>
              </hud-table-row>
              ${sorted.map((clan, index) =>
                this.renderClanRow(clan, index + 1, maxGames),
              )}
            </hud-table>
          </div>
        </div>
      </div>
    `;
  }
}

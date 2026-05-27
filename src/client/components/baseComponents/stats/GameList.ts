import { LitElement, html } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { PlayerGame } from "../../../../core/ApiSchemas";
import { GameMode } from "../../../../core/game/Game";
import { GameInfoModal } from "../../../GameInfoModal";
import { translateText } from "../../../Utils";
import "../../CopyButton";
import "../../ui";

@customElement("game-list")
export class GameList extends LitElement {
  createRenderRoot() {
    return this;
  }

  @property({ type: Array }) games: PlayerGame[] = [];
  @property({ attribute: false }) onViewGame?: (id: string) => void;

  @state() private expandedGameId: string | null = null;

  private toggle(gameId: string) {
    this.expandedGameId = this.expandedGameId === gameId ? null : gameId;
  }

  private showRanking(gameId: string) {
    const gameInfoModal = document.querySelector(
      "game-info-modal",
    ) as GameInfoModal;

    if (!gameInfoModal) {
      console.warn("Game info modal element not found");
    } else {
      gameInfoModal.loadGame(gameId);
      gameInfoModal.open();
    }
  }

  render() {
    return html` <div class="w-full">
      <div class="flex flex-col gap-3">
        ${this.games.map(
          (game) => html`
            <ui-surface
              tone="muted"
              style="--ui-radius: 12px; --ui-surface-shadow: none"
            >
              <ui-surface-body style="--ui-surface-body-padding: 12px 16px">
                <div
                  class="flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div class="flex items-center gap-4">
                    <ui-icon-button
                      variant="active"
                      @click=${() => this.onViewGame?.(game.gameId)}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        class="w-5 h-5"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                      >
                        <circle cx="12" cy="12" r="10"></circle>
                        <polygon points="10 8 16 12 10 16 10 8"></polygon>
                      </svg>
                    </ui-icon-button>
                    <div>
                      <div class="text-sm font-bold text-white tracking-wide">
                        ${new Date(game.start).toLocaleDateString()}
                      </div>
                      <div
                        class="text-xs text-blue-200/60 font-semibold uppercase tracking-wider"
                      >
                        ${translateText("game_list.mode")}:
                        ${game.mode === GameMode.FFA
                          ? translateText("game_mode.ffa")
                          : html`${translateText("game_mode.teams")}`}
                      </div>
                    </div>
                  </div>

                  <div class="flex gap-2 self-end sm:self-auto">
                    <ui-button
                      size="sm"
                      variant="primary"
                      @click=${() => this.onViewGame?.(game.gameId)}
                    >
                      ${translateText("game_list.replay")}
                    </ui-button>
                    <ui-button
                      size="sm"
                      variant="secondary"
                      @click=${() => this.toggle(game.gameId)}
                    >
                      ${translateText("game_list.details")}
                    </ui-button>
                    <ui-button
                      size="sm"
                      variant="secondary"
                      @click=${() => this.showRanking(game.gameId)}
                    >
                      ${translateText("game_list.ranking")}
                    </ui-button>
                  </div>
                </div>
              </ui-surface-body>

              <div
                class="bg-black/20 border-t border-white/5 px-4 text-xs text-gray-400 transition-all duration-300 overflow-hidden"
                style="max-height:${this.expandedGameId === game.gameId
                  ? "200px"
                  : "0"}; opacity:${this.expandedGameId === game.gameId
                  ? "1"
                  : "0"}"
              >
                <ui-stat-grid
                  columns="4"
                  style="--ui-stat-grid-gap: 16px"
                  class="py-3"
                >
                  <ui-stat>
                    <span slot="label"
                      >${translateText("game_list.game_id")}</span
                    >
                    <copy-button
                      .copyText="${game.gameId}"
                      compact
                    ></copy-button>
                  </ui-stat>
                  <ui-stat>
                    <span slot="label">${translateText("game_list.map")}</span>
                    ${game.map}
                  </ui-stat>
                  <ui-stat>
                    <span slot="label"
                      >${translateText("game_list.difficulty")}</span
                    >
                    ${game.difficulty}
                  </ui-stat>
                  <ui-stat>
                    <span slot="label">${translateText("game_list.type")}</span>
                    ${game.type}
                  </ui-stat>
                </ui-stat-grid>
              </div>
            </ui-surface>
          `,
        )}
      </div>
    </div>`;
  }
}

import { LitElement, html } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { PlayerGame } from "../../../../core/ApiSchemas";
import { GameMode } from "../../../../core/game/Game";
import { GameInfoModal } from "../../../GameInfoModal";
import "../../../hud/ui";
import { translateText } from "../../../Utils";
import "../../CopyButton";

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
            <hud-surface
              tone="muted"
              style="--hud-radius: 12px; --hud-surface-shadow: none"
            >
              <hud-surface-body style="--hud-surface-body-padding: 12px 16px">
                <div
                  class="flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div class="flex items-center gap-4">
                    <hud-icon-button
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
                    </hud-icon-button>
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
                    <hud-button
                      size="sm"
                      variant="active"
                      @click=${() => this.onViewGame?.(game.gameId)}
                    >
                      ${translateText("game_list.replay")}
                    </hud-button>
                    <hud-button
                      size="sm"
                      variant="default"
                      @click=${() => this.toggle(game.gameId)}
                    >
                      ${translateText("game_list.details")}
                    </hud-button>
                    <hud-button
                      size="sm"
                      variant="default"
                      @click=${() => this.showRanking(game.gameId)}
                    >
                      ${translateText("game_list.ranking")}
                    </hud-button>
                  </div>
                </div>
              </hud-surface-body>

              <div
                class="bg-black/20 border-t border-white/5 px-4 text-xs text-gray-400 transition-all duration-300 overflow-hidden"
                style="max-height:${this.expandedGameId === game.gameId
                  ? "200px"
                  : "0"}; opacity:${this.expandedGameId === game.gameId
                  ? "1"
                  : "0"}"
              >
                <hud-stat-grid
                  columns="4"
                  style="--hud-stat-grid-gap: 16px"
                  class="py-3"
                >
                  <hud-stat>
                    <span slot="label"
                      >${translateText("game_list.game_id")}</span
                    >
                    <copy-button
                      .copyText="${game.gameId}"
                      compact
                    ></copy-button>
                  </hud-stat>
                  <hud-stat>
                    <span slot="label">${translateText("game_list.map")}</span>
                    ${game.map}
                  </hud-stat>
                  <hud-stat>
                    <span slot="label"
                      >${translateText("game_list.difficulty")}</span
                    >
                    ${game.difficulty}
                  </hud-stat>
                  <hud-stat>
                    <span slot="label">${translateText("game_list.type")}</span>
                    ${game.type}
                  </hud-stat>
                </hud-stat-grid>
              </div>
            </hud-surface>
          `,
        )}
      </div>
    </div>`;
  }
}

import { html, LitElement, TemplateResult } from "lit";
import { customElement, state } from "lit/decorators.js";
import {
  getGamesPlayed,
  isInIframe,
  translateText,
  TUTORIAL_VIDEO_URL,
} from "../../../client/Utils";
import { EventBus } from "../../../core/EventBus";
import { RankedType } from "../../../core/game/Game";
import { GameUpdateType } from "../../../core/game/GameUpdates";
import { GameView } from "../../../core/game/GameView";
import { getUserMe } from "../../Api";
import "../../components/CosmeticButton";
import { Controller } from "../../Controller";
import {
  fetchCosmetics,
  purchaseCosmetic,
  resolveCosmetics,
} from "../../Cosmetics";
import { crazyGamesSDK } from "../../CrazyGamesSDK";
import { Platform } from "../../Platform";
import { SendWinnerEvent } from "../../Transport";
import "../ui";

@customElement("win-modal")
export class WinModal extends LitElement implements Controller {
  public game: GameView;
  public eventBus: EventBus;

  private hasShownDeathModal = false;

  @state()
  isVisible = false;

  @state()
  showButtons = false;

  @state()
  private isWin = false;

  @state()
  private isRankedGame = false;

  @state()
  private patternContent: TemplateResult | null = null;

  private _title: string;

  private rand = Math.random();

  // Override to prevent shadow DOM creation
  createRenderRoot() {
    return this;
  }

  constructor() {
    super();
  }

  render() {
    if (!this.isVisible) {
      return html``;
    }

    return html`
      <hud-surface
        class="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 shrink-0 z-[10010] text-white w-87.5 max-w-[90%] md:w-175"
        style="--hud-surface-bg: rgba(31,41,55,0.72); --hud-radius: 8px; --hud-surface-body-padding: 24px;"
      >
        <hud-surface-body style="--hud-surface-body-padding: 24px;">
          <h2 class="m-0 mb-4 text-[26px] text-center text-white">
            ${this._title || ""}
          </h2>
          ${this.innerHtml()}
          <hud-action-group
            align="center"
            class="${this.showButtons ? "block" : "hidden"}"
            style="--hud-action-gap: 10px;"
          >
            <hud-button
              variant="active"
              class="flex-1"
              style="--hud-button-host-width: 100%; --hud-button-width: 100%;"
              @click=${this._handleExit}
            >
              ${translateText("win_modal.exit")}
            </hud-button>
            ${this.isRankedGame
              ? html`
                  <hud-button
                    variant="active"
                    class="flex-1"
                    style="--hud-button-host-width: 100%; --hud-button-width: 100%;"
                    @click=${this._handleRequeue}
                  >
                    ${translateText("win_modal.requeue")}
                  </hud-button>
                `
              : null}
            <hud-button
              variant="active"
              class="flex-1"
              style="--hud-button-host-width: 100%; --hud-button-width: 100%;"
              @click=${this.hide}
            >
              ${this.game?.myPlayer()?.isAlive()
                ? translateText("win_modal.keep")
                : translateText("win_modal.spectate")}
            </hud-button>
          </hud-action-group>
        </hud-surface-body>
      </hud-surface>
    `;
  }

  innerHtml() {
    if (isInIframe()) {
      return this.steamWishlist();
    }

    if (!this.isWin && getGamesPlayed() < 3) {
      return this.renderYoutubeTutorial();
    }
    if (this.rand < 0.25) {
      return this.steamWishlist();
    } else if (this.rand < 0.5) {
      return this.discordDisplay();
    } else {
      return this.renderPatternButton();
    }
  }

  renderYoutubeTutorial() {
    return html`
      <hud-surface tone="muted" class="text-center mb-6">
        <hud-surface-body style="--hud-surface-body-padding: 10px;">
          <h3 class="text-xl font-semibold text-white mb-3">
            ${translateText("win_modal.youtube_tutorial")}
          </h3>
          <!-- 56.25% = 9:16 -->
          <div class="relative w-full pb-[56.25%]">
            <iframe
              class="absolute top-0 left-0 w-full h-full rounded-sm"
              src="${this.isVisible ? TUTORIAL_VIDEO_URL : ""}"
              title="YouTube video player"
              frameborder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowfullscreen
            ></iframe>
          </div>
        </hud-surface-body>
      </hud-surface>
    `;
  }

  renderPatternButton() {
    return html`
      <hud-surface tone="muted" class="text-center mb-6">
        <hud-surface-body style="--hud-surface-body-padding: 10px;">
          <h3 class="text-xl font-semibold text-white mb-3">
            ${translateText("win_modal.support_openfront")}
          </h3>
          <p class="text-white mb-3">
            ${translateText("win_modal.territory_pattern")}
          </p>
          <div class="flex justify-center">${this.patternContent}</div>
        </hud-surface-body>
      </hud-surface>
    `;
  }

  async loadPatternContent() {
    const me = await getUserMe();
    const cosmetics = await fetchCosmetics();

    const purchasable = resolveCosmetics(cosmetics, me, null).filter(
      (r) => r.type === "pattern" && r.relationship === "purchasable",
    );

    if (purchasable.length === 0) {
      this.patternContent = html``;
      return;
    }

    // Shuffle the array and take patterns based on screen size
    const shuffled = [...purchasable].sort(() => Math.random() - 0.5);
    const maxPatterns = Platform.isMobileWidth ? 1 : 3;
    const selected = shuffled.slice(0, Math.min(maxPatterns, shuffled.length));

    this.patternContent = html`
      <div class="flex gap-4 flex-wrap justify-start">
        ${selected.map(
          (r) => html`
            <cosmetic-button
              .resolved=${r}
              .onPurchase=${purchaseCosmetic}
            ></cosmetic-button>
          `,
        )}
      </div>
    `;
  }

  steamWishlist(): TemplateResult {
    return html`<hud-surface tone="muted" class="block mb-5 text-center">
      <hud-surface-body style="--hud-surface-body-padding: 10px;">
        <a
          href="https://store.steampowered.com/app/3560670"
          target="_blank"
          rel="noopener noreferrer"
          class="text-[#4a9eff] underline font-medium transition-colors duration-200 text-2xl hover:text-[#6db3ff]"
        >
          ${translateText("win_modal.wishlist")}
        </a>
      </hud-surface-body>
    </hud-surface>`;
  }

  discordDisplay(): TemplateResult {
    return html`
      <hud-surface tone="muted" class="text-center mb-6">
        <hud-surface-body style="--hud-surface-body-padding: 10px;">
          <h3 class="text-xl font-semibold text-white mb-3">
            ${translateText("win_modal.join_discord")}
          </h3>
          <p class="text-white mb-3">
            ${translateText("win_modal.discord_description")}
          </p>
          <a
            href="https://discord.com/invite/openfront"
            target="_blank"
            rel="noopener noreferrer"
            class="inline-block px-6 py-3 bg-indigo-600 text-white rounded-sm font-semibold transition-all duration-200 hover:bg-indigo-700 hover:-translate-y-px no-underline"
          >
            ${translateText("win_modal.join_server")}
          </a>
        </hud-surface-body>
      </hud-surface>
    `;
  }

  async show() {
    crazyGamesSDK.gameplayStop();
    await this.loadPatternContent();
    // Check if this is a ranked game
    this.isRankedGame =
      this.game.config().gameConfig().rankedType === RankedType.OneVOne;
    this.isVisible = true;
    this.requestUpdate();
    setTimeout(() => {
      this.showButtons = true;
      this.requestUpdate();
    }, 3000);
  }

  hide() {
    this.isVisible = false;
    this.showButtons = false;
    this.requestUpdate();
  }

  private _handleExit() {
    this.hide();
    window.location.href = "/";
  }

  private _handleRequeue() {
    this.hide();
    // Navigate to homepage and open matchmaking modal
    window.location.href = "/?requeue";
  }

  init() {}

  tick() {
    const myPlayer = this.game.myPlayer();
    if (
      !this.hasShownDeathModal &&
      myPlayer &&
      !myPlayer.isAlive() &&
      !this.game.inSpawnPhase() &&
      myPlayer.hasSpawned()
    ) {
      this.hasShownDeathModal = true;
      this._title = translateText("win_modal.died");
      this.show();
    }
    const updates = this.game.updatesSinceLastTick();
    const winUpdates = updates !== null ? updates[GameUpdateType.Win] : [];
    winUpdates.forEach((wu) => {
      if (wu.winner === undefined) {
        // ...
      } else if (wu.winner[0] === "team") {
        this.eventBus.emit(new SendWinnerEvent(wu.winner, wu.allPlayersStats));
        if (wu.winner[1] === this.game.myPlayer()?.team()) {
          this._title = translateText("win_modal.your_team");
          this.isWin = true;
          crazyGamesSDK.happytime();
        } else {
          this._title = translateText("win_modal.other_team", {
            team: wu.winner[1],
          });
          this.isWin = false;
        }
        history.replaceState(null, "", `${window.location.pathname}?replay`);
        this.show();
      } else if (wu.winner[0] === "nation") {
        this._title = translateText("win_modal.nation_won", {
          nation: wu.winner[1],
        });
        this.isWin = false;
        this.show();
      } else {
        const winner = this.game.playerByClientID(wu.winner[1]);
        if (!winner?.isPlayer()) return;
        const winnerClient = winner.clientID();
        if (winnerClient !== null) {
          this.eventBus.emit(
            new SendWinnerEvent(["player", winnerClient], wu.allPlayersStats),
          );
        }
        if (
          winnerClient !== null &&
          winnerClient === this.game.myPlayer()?.clientID()
        ) {
          this._title = translateText("win_modal.you_won");
          this.isWin = true;
          crazyGamesSDK.happytime();
        } else {
          this._title = translateText("win_modal.other_won", {
            player: winner.displayName(),
          });
          this.isWin = false;
        }
        history.replaceState(null, "", `${window.location.pathname}?replay`);
        this.show();
      }
    });
  }
}

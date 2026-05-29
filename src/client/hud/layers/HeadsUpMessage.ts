import { LitElement, html } from "lit";
import { customElement, state } from "lit/decorators.js";
import { GameType } from "../../../core/game/Game";
import { GameUpdateType } from "../../../core/game/GameUpdates";
import { GameView } from "../../../core/game/GameView";
import { Controller } from "../../Controller";
import { translateText } from "../../Utils";
import "../ui";

@customElement("heads-up-message")
export class HeadsUpMessage extends LitElement implements Controller {
  public game: GameView;

  @state()
  private isVisible = false;

  @state()
  private isPaused = false;

  @state()
  private isImmunityActive = false;

  @state()
  private isCatchingUp = false;
  private catchingUpTicks = 0;

  private static readonly CATCHING_UP_SHOW_THRESHOLD = 10;

  @state()
  private toastMessage: string | import("lit").TemplateResult | null = null;
  @state()
  private toastColor: "green" | "red" = "green";
  private toastTimeout: number | null = null;

  createRenderRoot() {
    return this;
  }

  connectedCallback() {
    super.connectedCallback();
    window.addEventListener(
      "show-message",
      this.handleShowMessage as EventListener,
    );
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    window.removeEventListener(
      "show-message",
      this.handleShowMessage as EventListener,
    );
    if (this.toastTimeout) {
      clearTimeout(this.toastTimeout);
    }
  }

  private handleShowMessage = (event: CustomEvent) => {
    const { message, duration, color } = event.detail ?? {};
    if (
      typeof message === "string" ||
      (message && typeof message.values === "object")
    ) {
      this.toastMessage = message;
      this.toastColor = color === "red" ? "red" : "green";
      this.requestUpdate();
      if (this.toastTimeout) {
        clearTimeout(this.toastTimeout);
      }
      this.toastTimeout = window.setTimeout(
        () => {
          this.toastMessage = null;
          this.requestUpdate();
        },
        typeof duration === "number" ? (duration ?? 2000) : 2000,
      );
    }
  };

  init() {
    this.isVisible = true;
    this.requestUpdate();
  }

  tick() {
    const updates = this.game.updatesSinceLastTick();
    if (updates && updates[GameUpdateType.GamePaused].length > 0) {
      const pauseUpdate = updates[GameUpdateType.GamePaused][0];
      this.isPaused = pauseUpdate.paused;
    }

    const showImmunityHudDuration = 10 * 10;
    const spawnEnd = this.game.config().numSpawnPhaseTurns();
    const ticksSinceSpawnEnd = this.game.ticks() - spawnEnd;

    this.isImmunityActive =
      this.game.config().hasExtendedSpawnImmunity() &&
      !this.game.inSpawnPhase() &&
      this.game.isSpawnImmunityActive() &&
      ticksSinceSpawnEnd < showImmunityHudDuration;

    const currentlyCatchingUp =
      !this.game.config().isReplay() && this.game.isCatchingUp();

    if (currentlyCatchingUp) {
      this.catchingUpTicks++;
    } else {
      this.catchingUpTicks = 0;
    }

    this.isCatchingUp =
      this.catchingUpTicks >= HeadsUpMessage.CATCHING_UP_SHOW_THRESHOLD;

    this.isVisible =
      this.game.inSpawnPhase() ||
      this.isPaused ||
      this.isImmunityActive ||
      this.isCatchingUp;
    this.requestUpdate();
  }

  private getMessage(): string {
    if (this.isCatchingUp) {
      return translateText("heads_up_message.catching_up");
    }
    if (this.isPaused) {
      if (this.game.config().gameConfig().gameType === GameType.Singleplayer) {
        return translateText("heads_up_message.singleplayer_game_paused");
      } else {
        return translateText("heads_up_message.multiplayer_game_paused");
      }
    }
    if (this.isImmunityActive) {
      return translateText("heads_up_message.pvp_immunity_active", {
        seconds: Math.round(this.game.config().spawnImmunityDuration() / 10),
      });
    }
    return this.game.config().isRandomSpawn()
      ? translateText("heads_up_message.random_spawn")
      : translateText("heads_up_message.choose_spawn");
  }

  render() {
    return html`
      <div style="pointer-events: none;">
        ${this.toastMessage
          ? html`
              <div
                class="fixed top-6 left-1/2 -translate-x-1/2 z-[800] transition-all duration-300 animate-fade-in-out"
                @contextmenu=${(e: MouseEvent) => e.preventDefault()}
              >
                <hud-toast
                  tone=${this.toastColor === "red" ? "red" : "green"}
                  style="max-width: 90vw; min-width: 200px; text-align: center; --hud-toast-min-width: 200px;"
                >
                  ${typeof this.toastMessage === "string"
                    ? html`<span class="font-medium"
                        >${this.toastMessage}</span
                      >`
                    : this.toastMessage}
                </hud-toast>
              </div>
            `
          : null}
        ${this.isVisible
          ? html`
              <div
                class="fixed top-[15%] left-1/2 -translate-x-1/2 z-[799]"
                @contextmenu=${(e: MouseEvent) => e.preventDefault()}
              >
                <hud-notice
                  compact
                  tone="info"
                  style="display: inline-grid; min-height: 2rem; max-width: 90vw; text-align: center; word-wrap: break-word; hyphens: auto; backdrop-filter: blur(4px);"
                >
                  ${this.getMessage()}
                </hud-notice>
              </div>
            `
          : null}
      </div>
    `;
  }
}

import { html, LitElement } from "lit";
import { customElement, property } from "lit/decorators.js";
import { assetUrl } from "../../../core/AssetUrls";
import { EventBus } from "../../../core/EventBus";
import { PlayerType } from "../../../core/game/Game";
import { PlayerView } from "../../../core/game/GameView";
import { SendKickPlayerIntentEvent } from "../../Transport";
import { translateText } from "../../Utils";
import "../ui";
const kickIcon = assetUrl("images/ExitIconWhite.svg");
const shieldIcon = assetUrl("images/ShieldIconWhite.svg");

@customElement("player-moderation-modal")
export class PlayerModerationModal extends LitElement {
  @property({ attribute: false }) eventBus: EventBus | null = null;
  @property({ attribute: false }) myPlayer: PlayerView | null = null;
  @property({ attribute: false }) target: PlayerView | null = null;

  @property({ type: Boolean }) open: boolean = false;
  @property({ type: Boolean }) inline: boolean = false;
  @property({ type: Boolean }) alreadyKicked: boolean = false;
  @property({ type: Boolean }) isAdmin: boolean = false;

  createRenderRoot() {
    return this;
  }

  updated(changed: Map<string, unknown>) {
    if (changed.has("open") && this.open) {
      queueMicrotask(() =>
        (this.querySelector('[role="dialog"]') as HTMLElement | null)?.focus(),
      );
    }
  }

  private closeModal() {
    this.dispatchEvent(new CustomEvent("close"));
  }

  private handleKeydown = (e: KeyboardEvent) => {
    if (e.key === "Escape") {
      e.preventDefault();
      this.closeModal();
    }
  };

  private canKick(my: PlayerView, other: PlayerView): boolean {
    return (
      (my.isLobbyCreator() || this.isAdmin) &&
      other !== my &&
      other.type() === PlayerType.Human &&
      !!other.clientID()
    );
  }

  private t(key: string, fallback: string): string {
    const value = translateText(key);
    return value === key ? fallback : value;
  }

  private handleKickClick = (e: MouseEvent) => {
    e.stopPropagation();

    const my = this.myPlayer;
    const other = this.target;
    const eventBus = this.eventBus;

    if (!my || !other) return;
    if (!this.canKick(my, other) || this.alreadyKicked) return;
    if (!eventBus) return;

    const targetClientID = other.clientID();
    if (!targetClientID || targetClientID.length === 0) return;

    const confirmed = confirm(
      translateText("player_panel.kick_confirm", { name: other.displayName() }),
    );
    if (!confirmed) return;

    eventBus.emit(new SendKickPlayerIntentEvent(targetClientID));
    this.dispatchEvent(
      new CustomEvent("kicked", { detail: { playerId: String(other.id()) } }),
    );
    this.closeModal();
  };

  render() {
    if (!this.open) return html``;

    const my = this.myPlayer;
    const other = this.target;
    if (!my || !other) return html``;

    const canKick = this.canKick(my, other);
    const alreadyKicked = this.alreadyKicked;

    const moderationTitle = this.t("player_panel.moderation", "Moderation");
    const kickTitle = alreadyKicked
      ? this.t("player_panel.kicked", "Kicked")
      : this.t("player_panel.kick", "Kick");
    const closeTitle = this.t("common.close", "Close");
    const statusTone = alreadyKicked ? "orange" : canKick ? "green" : "red";
    const statusLabel = alreadyKicked
      ? this.t("player_panel.kicked", "Kicked")
      : canKick
        ? this.t("common.available", "Available")
        : "Unavailable";

    return html`
      <div tabindex="0" @keydown=${this.handleKeydown}>
        <hud-modal-shell
          .open=${this.open}
          .inline=${this.inline}
          hideCloseButton
          label=${moderationTitle}
          maxWidth="28rem"
          @close=${() => this.closeModal()}
        >
          <hud-modal-header>
            <hud-row>
              <hud-icon .src=${shieldIcon} size="sm" tone="active"></hud-icon>
              <hud-label id="moderation-title" tone="default">
                ${moderationTitle}
              </hud-label>
            </hud-row>
            <hud-icon-button
              label=${closeTitle}
              variant="danger"
              title=${closeTitle}
              @click=${() => this.closeModal()}
            >
              x
            </hud-icon-button>
          </hud-modal-header>

          <hud-modal-body>
            <hud-stack>
              <hud-list-row>
                <hud-icon
                  slot="leading"
                  .src=${shieldIcon}
                  size="sm"
                  tone="active"
                ></hud-icon>
                <hud-player-identity
                  .name=${other.displayName()}
                  .iconSrc=${shieldIcon}
                ></hud-player-identity>
                <hud-pill slot="meta" tone=${statusTone}>
                  ${statusLabel}
                </hud-pill>
              </hud-list-row>

              <hud-alert
                compact
                tone=${alreadyKicked ? "warning" : canKick ? "info" : "danger"}
              >
                ${alreadyKicked
                  ? this.t("player_panel.kicked", "Kicked")
                  : canKick
                    ? kickTitle
                    : "Unavailable"}
              </hud-alert>
            </hud-stack>
          </hud-modal-body>

          <hud-modal-footer>
            <hud-button variant="default" @click=${() => this.closeModal()}>
              ${this.t("common.cancel", "Cancel")}
            </hud-button>
            <hud-button
              variant="danger"
              ?disabled=${alreadyKicked || !canKick}
              title=${kickTitle}
              @click=${this.handleKickClick}
            >
              <hud-icon
                slot="icon"
                .src=${kickIcon}
                size="sm"
                tone="inherit"
              ></hud-icon>
              ${kickTitle}
            </hud-button>
          </hud-modal-footer>
        </hud-modal-shell>
      </div>
    `;
  }
}

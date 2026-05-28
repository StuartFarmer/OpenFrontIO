import { LitElement, html } from "lit";
import { customElement, state } from "lit/decorators.js";
import { EventBus } from "../../../core/EventBus";
import { AllPlayers } from "../../../core/game/Game";
import { GameView, PlayerView } from "../../../core/game/GameView";
import { TerraNulliusImpl } from "../../../core/game/TerraNulliusImpl";
import { Emoji, flattenedEmojiTable } from "../../../core/Util";
import { CloseViewEvent, ShowEmojiMenuEvent } from "../../InputHandler";
import { TransformHandler } from "../../TransformHandler";
import { SendEmojiIntentEvent } from "../../Transport";
import "../ui";

@customElement("emoji-table")
export class EmojiTable extends LitElement {
  @state() public isVisible = false;
  public transformHandler: TransformHandler;
  public game: GameView;

  initEventBus(eventBus: EventBus) {
    eventBus.on(ShowEmojiMenuEvent, (e) => {
      this.isVisible = true;
      const cell = this.transformHandler.screenToWorldCoordinates(e.x, e.y);
      if (!this.game.isValidCoord(cell.x, cell.y)) {
        return;
      }

      const tile = this.game.ref(cell.x, cell.y);
      if (!this.game.hasOwner(tile)) {
        return;
      }

      const targetPlayer = this.game.owner(tile);
      // maybe redundant due to owner check but better safe than sorry
      if (targetPlayer instanceof TerraNulliusImpl) {
        return;
      }

      this.showTable((emoji) => {
        const recipient =
          targetPlayer === this.game.myPlayer()
            ? AllPlayers
            : (targetPlayer as PlayerView);
        eventBus.emit(
          new SendEmojiIntentEvent(
            recipient,
            flattenedEmojiTable.indexOf(emoji as Emoji),
          ),
        );
        this.hideTable();
      });
    });
    eventBus.on(CloseViewEvent, (e) => {
      if (!this.hidden) {
        this.hideTable();
      }
    });
  }

  private onEmojiClicked: (emoji: string) => void = () => {};

  private handleBackdropClick = (e: MouseEvent) => {
    const panelContent = this.querySelector("hud-surface") as HTMLElement;
    if (panelContent && !panelContent.contains(e.target as Node)) {
      this.hideTable();
    }
  };

  render() {
    if (!this.isVisible) {
      return null;
    }

    return html`
      <div
        class="fixed inset-0 bg-black/15 backdrop-brightness-110 flex items-start sm:items-center justify-center z-10002 pt-4 sm:pt-0"
        @click=${this.handleBackdropClick}
      >
        <div class="relative">
          <!-- Close button -->
          <hud-icon-button
            class="absolute -top-3 -right-3 z-10004"
            style="--hud-icon-button-size: 28px; --hud-icon-button-radius: 9999px;"
            variant="danger"
            size="sm"
            label="Close"
            @click=${this.hideTable}
          >
            ✕
          </hud-icon-button>

          <hud-surface
            class="block z-10003 w-[calc(100vw-32px)] sm:w-100 max-h-[calc(100vh-60px)] overflow-y-auto"
            style="--hud-radius: 10px; --hud-surface-bg: rgba(24,24,27,0.95); --hud-surface-body-padding: 8px;"
            @contextmenu=${(e: MouseEvent) => e.preventDefault()}
            @wheel=${(e: WheelEvent) => e.stopPropagation()}
            @click=${(e: MouseEvent) => e.stopPropagation()}
          >
            <hud-surface-body style="--hud-surface-body-padding: 8px;">
              <div class="grid grid-cols-5 gap-1 sm:gap-2">
                ${flattenedEmojiTable.map(
                  (emoji) => html`
                    <hud-button
                      width="fill"
                      class="aspect-square text-3xl sm:text-4xl transition-transform duration-300 hover:scale-110 active:scale-95"
                      style="--hud-button-min-height: 0; --hud-button-radius: 8px; --hud-button-width: 100%;"
                      label=${emoji}
                      @click=${() => this.onEmojiClicked(emoji)}
                    >
                      ${emoji}
                    </hud-button>
                  `,
                )}
              </div>
            </hud-surface-body>
          </hud-surface>
        </div>
      </div>
    `;
  }

  hideTable() {
    this.isVisible = false;
    this.requestUpdate();
  }

  showTable(oneEmojiClicked: (emoji: string) => void) {
    this.onEmojiClicked = oneEmojiClicked;
    this.isVisible = true;
    this.requestUpdate();
  }

  createRenderRoot() {
    return this; // Disable shadow DOM to allow Tailwind styles
  }
}

import { html, LitElement } from "lit";
import { customElement, state } from "lit/decorators.js";
import { DirectiveResult } from "lit/directive.js";
import { unsafeHTML, UnsafeHTMLDirective } from "lit/directives/unsafe-html.js";
import { EventBus } from "../../../core/EventBus";
import { MessageType } from "../../../core/game/Game";
import {
  DisplayMessageUpdate,
  GameUpdateType,
} from "../../../core/game/GameUpdates";
import { GameView } from "../../../core/game/GameView";
import { onlyImages } from "../../../core/Util";
import { Controller } from "../../Controller";
import "../ui";

interface ChatEvent {
  description: string;
  unsafeDescription?: boolean;
  createdAt: number;
  highlight?: boolean;
}

@customElement("chat-display")
export class ChatDisplay extends LitElement implements Controller {
  public eventBus: EventBus;
  public game: GameView;

  private active: boolean = false;

  @state() private _hidden: boolean = false;
  @state() private newEvents: number = 0;
  @state() private chatEvents: ChatEvent[] = [];

  private toggleHidden() {
    this._hidden = !this._hidden;
    if (this._hidden) {
      this.newEvents = 0;
    }
    this.requestUpdate();
  }

  private addEvent(event: ChatEvent) {
    this.chatEvents = [...this.chatEvents, event];
    if (this._hidden) {
      this.newEvents++;
    }
    this.requestUpdate();
  }

  private removeEvent(index: number) {
    this.chatEvents = [
      ...this.chatEvents.slice(0, index),
      ...this.chatEvents.slice(index + 1),
    ];
  }

  onDisplayMessageEvent(event: DisplayMessageUpdate) {
    if (event.messageType !== MessageType.CHAT) return;
    const myPlayer = this.game.myPlayer();
    if (
      event.playerID !== null &&
      (!myPlayer || myPlayer.smallID() !== event.playerID)
    ) {
      return;
    }

    this.addEvent({
      description: event.message,
      createdAt: this.game.ticks(),
      highlight: true,
      unsafeDescription: true,
    });
  }

  init() {}

  tick() {
    // this.active = true;
    const updates = this.game.updatesSinceLastTick();
    if (updates === null) return;
    const messages = updates[GameUpdateType.DisplayEvent] as
      | DisplayMessageUpdate[]
      | undefined;

    if (messages) {
      for (const msg of messages) {
        if (msg.messageType === MessageType.CHAT) {
          const myPlayer = this.game.myPlayer();
          if (
            msg.playerID !== null &&
            (!myPlayer || myPlayer.smallID() !== msg.playerID)
          ) {
            continue;
          }

          this.chatEvents = [
            ...this.chatEvents,
            {
              description: msg.message,
              unsafeDescription: true,
              createdAt: this.game.ticks(),
            },
          ];
        }
      }
    }

    if (this.chatEvents.length > 100) {
      this.chatEvents = this.chatEvents.slice(-100);
    }

    this.requestUpdate();
  }

  private getChatContent(
    chat: ChatEvent,
  ): string | DirectiveResult<typeof UnsafeHTMLDirective> {
    return chat.unsafeDescription
      ? unsafeHTML(onlyImages(chat.description))
      : chat.description;
  }

  render() {
    if (!this.active) {
      return html``;
    }
    return html`
      <hud-surface
        class="pointer-events-auto ${this._hidden
          ? "w-fit"
          : ""} relative max-h-[30vh] flex flex-col-reverse overflow-y-auto w-full lg:bottom-2.5 lg:right-2.5 z-50 lg:max-w-[30vw] lg:w-full lg:w-auto"
        style="--hud-radius: 6px; --hud-surface-bg: rgba(0,0,0,0.60); --hud-surface-body-padding: ${this
          ._hidden
          ? "5px 10px"
          : "0"};"
      >
        <hud-surface-body
          style="--hud-surface-body-padding: ${this._hidden
            ? "5px 10px"
            : "0"};"
        >
          <div class="w-full bg-black/80 sticky top-0 px-2.5">
            <hud-button
              variant="default"
              size="xs"
              class="${this._hidden ? "hidden" : ""}"
              label="Hide"
              @click=${this.toggleHidden}
            >
              Hide
            </hud-button>
          </div>

          <hud-button
            variant="default"
            size="xs"
            class="${this._hidden ? "" : "hidden"}"
            label="Chat"
            @click=${this.toggleHidden}
          >
            Chat
            <span
              class="${this.newEvents
                ? ""
                : "hidden"} inline-block px-2 bg-red-500 rounded-xs"
              >${this.newEvents}</span
            >
          </hud-button>

          <div
            class="w-full text-white shadow-lg lg:text-xl text-xs pointer-events-none ${this
              ._hidden
              ? "hidden"
              : ""}"
          >
            ${this.chatEvents.map(
              (chat) => html`
                <hud-list-row
                  style="--hud-list-row-padding: 4px 8px; grid-template-columns: minmax(0, 1fr);"
                >
                  ${this.getChatContent(chat)}
                </hud-list-row>
              `,
            )}
          </div>
        </hud-surface-body>
      </hud-surface>
    `;
  }

  createRenderRoot() {
    return this;
  }
}

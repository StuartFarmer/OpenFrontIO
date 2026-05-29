import { html } from "lit";
import { customElement } from "lit/decorators.js";

import { PlayerType } from "../../../core/game/Game";
import { GameView, PlayerView } from "../../../core/game/GameView";

import quickChatData from "resources/QuickChat.json";
import { EventBus } from "../../../core/EventBus";
import { BaseModal, ModalConfig } from "../../components/BaseModal";
import { CloseViewEvent } from "../../InputHandler";
import { SendQuickChatEvent } from "../../Transport";
import { translateText } from "../../Utils";
import "../ui";

export type QuickChatPhrase = {
  key: string;
  requiresPlayer: boolean;
};

export type QuickChatPhrases = Record<string, QuickChatPhrase[]>;

export const quickChatPhrases: QuickChatPhrases = quickChatData;

@customElement("chat-modal")
export class ChatModal extends BaseModal {
  protected modalConfig(): ModalConfig {
    return {
      title: translateText("chat.title"),
      hideHeader: false,
      hideCloseButton: false,
      maxWidth: "900px",
    };
  }

  private players: PlayerView[] = [];

  private playerSearchQuery: string = "";
  private previewText: string | null = null;
  private requiresPlayerSelection: boolean = false;
  private selectedCategory: string | null = null;
  private selectedPhraseText: string | null = null;
  private selectedPhraseTemplate: string | null = null;
  private selectedQuickChatKey: string | null = null;
  private selectedPlayer: PlayerView | null = null;

  private recipient: PlayerView;
  private sender: PlayerView;
  public eventBus: EventBus;

  public g: GameView;

  quickChatPhrases: Record<
    string,
    Array<{ text: string; requiresPlayer: boolean }>
  > = {
    help: [{ text: "Please give me troops!", requiresPlayer: false }],
    attack: [{ text: "Attack [P1]!", requiresPlayer: true }],
    defend: [{ text: "Defend [P1]!", requiresPlayer: true }],
    greet: [{ text: "Hello!", requiresPlayer: false }],
    misc: [{ text: "Let's go!", requiresPlayer: false }],
  };

  public categories = [
    { id: "help" },
    { id: "attack" },
    { id: "defend" },
    { id: "greet" },
    { id: "misc" },
    { id: "warnings" },
  ];

  private getPhrasesForCategory(categoryId: string) {
    return quickChatPhrases[categoryId] ?? [];
  }

  protected renderBody() {
    return html`
      <div class="chat-columns">
        <div class="chat-column">
          <div class="column-title">${translateText("chat.category")}</div>
          ${this.categories.map(
            (category) => html`
              <hud-button
                class="chat-option-button"
                variant=${this.selectedCategory === category.id
                  ? "active"
                  : "default"}
                style="display: block; --hud-button-width: 100%; --hud-button-min-height: 34px; --hud-button-radius: 4px; --hud-button-padding: 8px 12px;"
                @click=${() => this.selectCategory(category.id)}
              >
                ${translateText(`chat.cat.${category.id}`)}
              </hud-button>
            `,
          )}
        </div>

        ${this.selectedCategory
          ? html`
              <div class="chat-column">
                <div class="column-title">${translateText("chat.phrase")}</div>
                <div class="phrase-scroll-area">
                  ${this.getPhrasesForCategory(this.selectedCategory).map(
                    (phrase) => html`
                      <hud-button
                        class="chat-option-button"
                        variant=${this.selectedPhraseText ===
                        translateText(
                          `chat.${this.selectedCategory}.${phrase.key}`,
                        )
                          ? "active"
                          : "default"}
                        style="display: block; --hud-button-width: 100%; --hud-button-min-height: 34px; --hud-button-radius: 4px; --hud-button-padding: 8px 12px;"
                        @click=${() => this.selectPhrase(phrase)}
                      >
                        ${this.renderPhrasePreview(phrase)}
                      </hud-button>
                    `,
                  )}
                </div>
              </div>
            `
          : null}
        ${this.requiresPlayerSelection || this.selectedPlayer
          ? html`
              <div class="chat-column">
                <div class="column-title">${translateText("chat.player")}</div>

                <hud-input
                  class="player-search-input"
                  type="text"
                  placeholder="${translateText("chat.search")}"
                  .value=${this.playerSearchQuery}
                  @input=${this.onPlayerSearchInput}
                ></hud-input>

                <div class="player-scroll-area">
                  ${this.getSortedFilteredPlayers().map(
                    (player) => html`
                      <hud-button
                        class="chat-option-button"
                        variant=${this.selectedPlayer === player
                          ? "active"
                          : "default"}
                        style="display: block; --hud-button-width: 100%; --hud-button-min-height: 34px; --hud-button-radius: 4px; --hud-button-padding: 8px 12px; --hud-button-border-color: ${player
                          .territoryColor()
                          .toHex()};"
                        @click=${() => this.selectPlayer(player)}
                      >
                        ${player.displayName()}
                      </hud-button>
                    `,
                  )}
                </div>
              </div>
            `
          : null}
      </div>

      <div class="chat-preview">
        ${this.previewText
          ? translateText(this.previewText)
          : translateText("chat.build")}
      </div>
      <div class="chat-send">
        <hud-button
          class="chat-send-button"
          variant="active"
          @click=${this.sendChatMessage}
          ?disabled=${!this.previewText ||
          (this.requiresPlayerSelection && !this.selectedPlayer)}
        >
          ${translateText("chat.send")}
        </hud-button>
      </div>
    `;
  }

  initEventBus(eventBus: EventBus) {
    this.eventBus = eventBus;
    eventBus.on(CloseViewEvent, (e) => {
      if (!this.hidden) {
        this.close();
      }
    });
  }

  private selectCategory(categoryId: string) {
    this.selectedCategory = categoryId;
    this.selectedPhraseText = null;
    this.previewText = null;
    this.requiresPlayerSelection = false;
    this.requestUpdate();
  }

  private selectPhrase(phrase: QuickChatPhrase) {
    this.selectedQuickChatKey = this.getFullQuickChatKey(
      this.selectedCategory!,
      phrase.key,
    );
    this.selectedPhraseTemplate = translateText(
      `chat.${this.selectedCategory}.${phrase.key}`,
    );
    this.selectedPhraseText = translateText(
      `chat.${this.selectedCategory}.${phrase.key}`,
    );
    this.previewText = `chat.${this.selectedCategory}.${phrase.key}`;
    this.requiresPlayerSelection = phrase.requiresPlayer;
    this.requestUpdate();
  }

  private renderPhrasePreview(phrase: { key: string }) {
    return translateText(`chat.${this.selectedCategory}.${phrase.key}`);
  }

  private selectPlayer(player: PlayerView) {
    if (this.previewText) {
      this.previewText =
        this.selectedPhraseTemplate?.replace("[P1]", player.displayName()) ??
        null;
      this.selectedPlayer = player;
      this.requiresPlayerSelection = false;
      this.requestUpdate();
    }
  }

  private sendChatMessage() {
    console.log("Sent message:", this.previewText);
    console.log("Sender:", this.sender);
    console.log("Recipient:", this.recipient);
    console.log("Key:", this.selectedQuickChatKey);

    if (this.sender && this.recipient && this.selectedQuickChatKey) {
      this.eventBus.emit(
        new SendQuickChatEvent(
          this.recipient,
          this.selectedQuickChatKey,
          this.selectedPlayer?.id(),
        ),
      );
    }

    this.previewText = null;
    this.selectedCategory = null;
    this.requiresPlayerSelection = false;
    this.close();

    this.requestUpdate();
  }

  private onPlayerSearchInput(e: Event) {
    const target = e.target as HTMLElement & { value: string };
    this.playerSearchQuery = target.value.toLowerCase();
    this.requestUpdate();
  }

  private getSortedFilteredPlayers(): PlayerView[] {
    const sorted = [...this.players].sort((a, b) =>
      a.displayName().localeCompare(b.displayName()),
    );
    const filtered = sorted.filter((p) =>
      p.displayName().toLowerCase().includes(this.playerSearchQuery),
    );
    const others = sorted.filter(
      (p) => !p.displayName().toLowerCase().includes(this.playerSearchQuery),
    );
    return [...filtered, ...others];
  }

  private getFullQuickChatKey(category: string, phraseKey: string): string {
    return `${category}.${phraseKey}`;
  }

  public open(args?: Record<string, unknown>): void;
  public open(sender?: PlayerView, recipient?: PlayerView): void;
  public open(
    senderOrArgs?: PlayerView | Record<string, unknown>,
    recipient?: PlayerView,
  ) {
    const sender =
      senderOrArgs && "displayName" in senderOrArgs
        ? (senderOrArgs as PlayerView)
        : undefined;
    if (sender && recipient) {
      console.log("Sent message:", recipient);
      console.log("Sent message:", sender);
      this.players = this.g
        .players()
        .filter((p) => p.isAlive() && p.type() !== PlayerType.Bot);

      this.recipient = recipient;
      this.sender = sender;
    }
    this.requestUpdate();
    super.open();
  }

  public close() {
    this.selectedCategory = null;
    this.selectedPhraseText = null;
    this.previewText = null;
    this.requiresPlayerSelection = false;
    super.close();
  }

  public setRecipient(value: PlayerView) {
    this.recipient = value;
  }

  public setSender(value: PlayerView) {
    this.sender = value;
  }

  public openWithSelection(
    categoryId: string,
    phraseKey: string,
    sender?: PlayerView,
    recipient?: PlayerView,
  ) {
    if (sender && recipient) {
      this.players = this.g
        .players()
        .filter((p) => p.isAlive() && p.type() !== PlayerType.Bot);

      this.recipient = recipient;
      this.sender = sender;
    }

    this.selectCategory(categoryId);

    const phrase = this.getPhrasesForCategory(categoryId).find(
      (p) => p.key === phraseKey,
    );

    if (phrase) {
      this.selectPhrase(phrase);
    }

    this.requestUpdate();
    super.open();
  }
}

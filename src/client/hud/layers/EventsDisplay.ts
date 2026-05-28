import { html, LitElement } from "lit";
import { customElement, query, state } from "lit/decorators.js";
import { DirectiveResult } from "lit/directive.js";
import { unsafeHTML, UnsafeHTMLDirective } from "lit/directives/unsafe-html.js";
import { assetUrl } from "../../../core/AssetUrls";
import { EventBus } from "../../../core/EventBus";
import {
  AllPlayers,
  getMessageCategory,
  MessageCategory,
  MessageType,
  Tick,
} from "../../../core/game/Game";
import {
  AllianceExpiredUpdate,
  AllianceExtensionUpdate,
  AllianceRequestReplyUpdate,
  AllianceRequestUpdate,
  BrokeAllianceUpdate,
  DisplayChatMessageUpdate,
  DisplayMessageUpdate,
  EmojiUpdate,
  GameUpdateType,
  TargetPlayerUpdate,
  UnitIncomingUpdate,
} from "../../../core/game/GameUpdates";
import { Controller } from "../../Controller";
import {
  SendAllianceExtensionIntentEvent,
  SendAllianceRejectIntentEvent,
  SendAllianceRequestIntentEvent,
} from "../../Transport";

import { GameView, PlayerView, UnitView } from "../../../core/game/GameView";
import { onlyImages } from "../../../core/Util";
import { GoToPlayerEvent, GoToUnitEvent } from "../../TransformHandler";
import { renderNumber } from "../../Utils";

import { PlaySoundEffectEvent } from "../../sound/Sounds";
import { UIState } from "../../UIState";
import { translateText } from "../../Utils";
import "../ui/HudComponents";
const allianceIcon = assetUrl("images/AllianceIconWhite.svg");
const chatIcon = assetUrl("images/ChatIconWhite.svg");
const donateGoldIcon = assetUrl("images/DonateGoldIconWhite.svg");
const nukeIcon = assetUrl("images/NukeIconWhite.svg");
const swordIcon = assetUrl("images/SwordIconWhite.svg");

interface GameEvent {
  description: string;
  unsafeDescription?: boolean;
  buttons?: {
    text: string;
    className: string;
    action: () => void;
    preventClose?: boolean;
  }[];
  type: MessageType;
  highlight?: boolean;
  createdAt: number;
  onDelete?: () => void;
  // lower number: lower on the display
  priority?: number;
  duration?: Tick;
  focusID?: number;
  unitView?: UnitView;
  shouldDelete?: (game: GameView) => boolean;
  allianceID?: number;
}

@customElement("events-display")
export class EventsDisplay extends LitElement implements Controller {
  public eventBus: EventBus;
  public game: GameView;
  public uiState: UIState;

  private active: boolean = false;
  private events: GameEvent[] = [];

  // allianceID -> last checked at tick
  private alliancesCheckedAt = new Map<number, Tick>();
  @state() private _hidden: boolean = false;
  @state() private _isVisible: boolean = false;
  @state() private newEvents: number = 0;
  @state() private latestGoldAmount: bigint | null = null;
  @state() private goldAmountAnimating: boolean = false;
  private goldAmountTimeoutId: ReturnType<typeof setTimeout> | null = null;
  @state() private eventsFilters: Map<MessageCategory, boolean> = new Map([
    [MessageCategory.ATTACK, false],
    [MessageCategory.NUKE, false],
    [MessageCategory.TRADE, false],
    [MessageCategory.ALLIANCE, false],
    [MessageCategory.CHAT, false],
  ]);

  @query(".events-container")
  private _eventsContainer?: HTMLDivElement;
  private _shouldScrollToBottom = true;

  updated(changed: Map<string, unknown>) {
    super.updated(changed);
    if (this._eventsContainer && this._shouldScrollToBottom) {
      this._eventsContainer.scrollTop = this._eventsContainer.scrollHeight;
    }
  }

  private renderButton(options: {
    content: any; // Can be string, TemplateResult, or other renderable content
    onClick?: () => void;
    className?: string;
    disabled?: boolean;
    translate?: boolean;
    hidden?: boolean;
  }) {
    const {
      content,
      onClick,
      className = "",
      disabled = false,
      translate = true,
      hidden = false,
    } = options;

    if (hidden) {
      return html``;
    }

    return html`
      <hud-button
        class="${className}"
        @click=${onClick}
        ?disabled=${disabled}
        ?translate=${translate}
      >
        ${content}
      </hud-button>
    `;
  }

  private renderToggleButton(src: string, category: MessageCategory) {
    const isFiltered = this.eventsFilters.get(category);
    return html`<hud-icon-button
      .variant=${isFiltered ? "default" : "active"}
      .label=${String(category)}
      @click=${() => this.toggleEventFilter(category)}
    >
      <hud-icon
        .src=${src}
        size="sm"
        .tone=${isFiltered ? "muted" : "default"}
      ></hud-icon>
    </hud-icon-button>`;
  }

  private toggleHidden() {
    this._hidden = !this._hidden;
    if (this._hidden) {
      this.newEvents = 0;
    }
    this.requestUpdate();
  }

  private toggleEventFilter(filterName: MessageCategory) {
    const currentState = this.eventsFilters.get(filterName) ?? false;
    this.eventsFilters.set(filterName, !currentState);
    this.requestUpdate();
  }

  private updateMap = [
    [GameUpdateType.DisplayEvent, this.onDisplayMessageEvent.bind(this)],
    [GameUpdateType.DisplayChatEvent, this.onDisplayChatEvent.bind(this)],
    [GameUpdateType.AllianceRequest, this.onAllianceRequestEvent.bind(this)],
    [
      GameUpdateType.AllianceRequestReply,
      this.onAllianceRequestReplyEvent.bind(this),
    ],
    [GameUpdateType.BrokeAlliance, this.onBrokeAllianceEvent.bind(this)],
    [GameUpdateType.TargetPlayer, this.onTargetPlayerEvent.bind(this)],
    [GameUpdateType.Emoji, this.onEmojiMessageEvent.bind(this)],
    [GameUpdateType.UnitIncoming, this.onUnitIncomingEvent.bind(this)],
    [GameUpdateType.AllianceExpired, this.onAllianceExpiredEvent.bind(this)],
    [
      GameUpdateType.AllianceExtension,
      this.onAllianceExtensionEvent.bind(this),
    ],
  ] as const;

  constructor() {
    super();
    this.events = [];
  }

  init() {
    this.eventBus.on(
      SendAllianceRequestIntentEvent,
      this.onAllianceRequestSentConfirmation.bind(this),
    );
  }

  private onAllianceRequestSentConfirmation(e: SendAllianceRequestIntentEvent) {
    const myPlayer = this.game.myPlayer();
    if (!myPlayer || e.requestor.id() !== myPlayer.id()) {
      return;
    }
    this.addEvent({
      description: translateText("events_display.alliance_request_sent", {
        name: e.recipient.name(),
      }),
      type: MessageType.ALLIANCE_REQUEST,
      createdAt: this.game.ticks(),
    });
  }

  tick() {
    this.active = true;

    if (this._eventsContainer) {
      const el = this._eventsContainer;
      this._shouldScrollToBottom =
        el.scrollHeight - el.scrollTop - el.clientHeight < 5;
    } else {
      this._shouldScrollToBottom = true;
    }

    if (!this._isVisible && !this.game.inSpawnPhase()) {
      this._isVisible = true;
      this.requestUpdate();
    }

    const myPlayer = this.game.myPlayer();
    if (!myPlayer || !myPlayer.isAlive()) {
      if (this._isVisible) {
        this._isVisible = false;
        this.requestUpdate();
      }
      return;
    }

    this.checkForAllianceExpirations();

    const updates = this.game.updatesSinceLastTick();
    if (updates) {
      for (const [ut, fn] of this.updateMap) {
        updates[ut]?.forEach(fn as (event: unknown) => void);
      }
    }

    let remainingEvents = this.events.filter((event) => {
      const shouldKeep =
        this.game.ticks() - event.createdAt < (event.duration ?? 600) &&
        !event.shouldDelete?.(this.game);
      if (!shouldKeep && event.onDelete) {
        event.onDelete();
      }
      return shouldKeep;
    });

    if (remainingEvents.length > 30) {
      remainingEvents = remainingEvents.slice(-30);
    }

    if (this.events.length !== remainingEvents.length) {
      this.events = remainingEvents;
      this.requestUpdate();
    }

    this.requestUpdate();
  }

  disconnectedCallback() {
    if (this.goldAmountTimeoutId !== null) {
      clearTimeout(this.goldAmountTimeoutId);
      this.goldAmountTimeoutId = null;
    }
  }

  private checkForAllianceExpirations() {
    const myPlayer = this.game.myPlayer();
    if (!myPlayer?.isAlive()) return;

    const currentAllianceIds = new Set<number>();

    for (const alliance of myPlayer.alliances()) {
      currentAllianceIds.add(alliance.id);

      if (
        alliance.expiresAt >
        this.game.ticks() + this.game.config().allianceExtensionPromptOffset()
      ) {
        continue;
      }

      if (
        (this.alliancesCheckedAt.get(alliance.id) ?? 0) >=
        this.game.ticks() - this.game.config().allianceExtensionPromptOffset()
      ) {
        // We've already displayed a message for this alliance.
        continue;
      }

      this.alliancesCheckedAt.set(alliance.id, this.game.ticks());

      const other = this.game.player(alliance.other) as PlayerView;

      this.addEvent({
        description: translateText("events_display.about_to_expire", {
          name: other.displayName(),
        }),
        type: MessageType.RENEW_ALLIANCE,
        duration: this.game.config().allianceExtensionPromptOffset() - 3 * 10, // 3 second buffer
        buttons: [
          {
            text: translateText("events_display.focus"),
            className: "btn-gray",
            action: () => this.eventBus.emit(new GoToPlayerEvent(other)),
            preventClose: true,
          },
          {
            text: translateText("events_display.renew_alliance", {
              name: other.displayName(),
            }),
            className: "btn",
            action: () =>
              this.eventBus.emit(new SendAllianceExtensionIntentEvent(other)),
          },
          {
            text: translateText("events_display.ignore"),
            className: "btn-info",
            action: () => {},
          },
        ],
        highlight: true,
        createdAt: this.game.ticks(),
        focusID: other.smallID(),
        allianceID: alliance.id,
      });
    }

    for (const [allianceId] of this.alliancesCheckedAt) {
      if (!currentAllianceIds.has(allianceId)) {
        this.removeAllianceRenewalEvents(allianceId);
        this.alliancesCheckedAt.delete(allianceId);
      }
    }
  }

  private addEvent(event: GameEvent) {
    this.events = [...this.events, event];
    if (this._hidden === true) {
      this.newEvents++;
    }
    this.requestUpdate();
  }

  private removeEvent(index: number) {
    this.events = [
      ...this.events.slice(0, index),
      ...this.events.slice(index + 1),
    ];
  }

  private removeAllianceRenewalEvents(allianceID: number) {
    this.events = this.events.filter(
      (event) =>
        !(
          event.type === MessageType.RENEW_ALLIANCE &&
          event.allianceID === allianceID
        ),
    );
  }

  onDisplayMessageEvent(event: DisplayMessageUpdate) {
    const myPlayer = this.game.myPlayer();
    if (
      event.playerID !== null &&
      (!myPlayer || myPlayer.smallID() !== event.playerID)
    ) {
      return;
    }

    if (event.goldAmount !== undefined) {
      const hasChanged = this.latestGoldAmount !== event.goldAmount;
      this.latestGoldAmount = event.goldAmount;

      if (this.goldAmountTimeoutId !== null) {
        clearTimeout(this.goldAmountTimeoutId);
      }

      this.goldAmountTimeoutId = setTimeout(() => {
        this.latestGoldAmount = null;
        this.goldAmountTimeoutId = null;
        this.requestUpdate();
      }, 5000);

      if (hasChanged) {
        this.goldAmountAnimating = true;
        setTimeout(() => {
          this.goldAmountAnimating = false;
          this.requestUpdate();
        }, 600);
      }
    }

    let description: string = event.message;
    if (event.message.startsWith("events_display.")) {
      description = translateText(event.message, event.params ?? {});
    }

    this.addEvent({
      description: description,
      createdAt: this.game.ticks(),
      highlight: true,
      type: event.messageType,
      unsafeDescription: true,
    });
  }

  onDisplayChatEvent(event: DisplayChatMessageUpdate) {
    const myPlayer = this.game.myPlayer();
    if (
      event.playerID === null ||
      !myPlayer ||
      myPlayer.smallID() !== event.playerID
    ) {
      return;
    }

    const baseMessage = translateText(`chat.${event.category}.${event.key}`);
    let translatedMessage = baseMessage;
    if (event.target) {
      try {
        const targetPlayer = this.game.player(event.target);
        const targetName = targetPlayer?.displayName() ?? event.target;
        translatedMessage = baseMessage.replace("[P1]", targetName);
      } catch (e) {
        console.warn(
          `Failed to resolve player for target ID '${event.target}'`,
          e,
        );
        return;
      }
    }

    let otherPlayerDiplayName: string = "";
    if (event.recipient !== null) {
      //'recipient' parameter contains sender ID or recipient ID
      const player = this.game.player(event.recipient);
      otherPlayerDiplayName = player ? player.displayName() : "";
    }

    this.addEvent({
      description: translateText(event.isFrom ? "chat.from" : "chat.to", {
        user: otherPlayerDiplayName,
        msg: translatedMessage,
      }),
      createdAt: this.game.ticks(),
      highlight: true,
      type: MessageType.CHAT,
      unsafeDescription: false,
    });
    this.eventBus.emit(new PlaySoundEffectEvent("message"));
  }

  onAllianceRequestEvent(update: AllianceRequestUpdate) {
    const myPlayer = this.game.myPlayer();
    if (!myPlayer || update.recipientID !== myPlayer.smallID()) {
      return;
    }

    const requestor = this.game.playerBySmallID(
      update.requestorID,
    ) as PlayerView;
    const recipient = this.game.playerBySmallID(
      update.recipientID,
    ) as PlayerView;

    if (!requestor.isAlliedWith(recipient)) {
      this.eventBus.emit(new PlaySoundEffectEvent("alliance-suggested"));
    }
    this.addEvent({
      description: translateText("events_display.request_alliance", {
        name: requestor.displayName(),
      }),
      buttons: [
        {
          text: translateText("events_display.focus"),
          className: "btn-gray",
          action: () => this.eventBus.emit(new GoToPlayerEvent(requestor)),
          preventClose: true,
        },
        {
          text: translateText("events_display.accept_alliance"),
          className: "btn",
          action: () =>
            this.eventBus.emit(
              new SendAllianceRequestIntentEvent(recipient, requestor),
            ),
        },
        {
          text: translateText("events_display.reject_alliance"),
          className: "btn-info",
          action: () =>
            this.eventBus.emit(new SendAllianceRejectIntentEvent(requestor)),
        },
      ],
      highlight: true,
      type: MessageType.ALLIANCE_REQUEST,
      createdAt: this.game.ticks(),
      priority: 0,
      duration: this.game.config().allianceRequestDuration() - 20, // 2 second buffer
      shouldDelete: (game) => {
        // Recipient sent a separate request, so they became allied without the recipient responding.
        return requestor.isAlliedWith(recipient);
      },
      focusID: update.requestorID,
    });
  }

  onAllianceRequestReplyEvent(update: AllianceRequestReplyUpdate) {
    const myPlayer = this.game.myPlayer();
    if (!myPlayer) {
      return;
    }
    // myPlayer can deny alliances without clicking on the button
    if (update.request.recipientID === myPlayer.smallID()) {
      // Remove alliance requests whose requestors are the same as the reply's requestor
      // Noop unless the request was denied through other means (e.g attacking the requestor)
      this.events = this.events.filter(
        (event) =>
          !(
            event.type === MessageType.ALLIANCE_REQUEST &&
            event.focusID === update.request.requestorID
          ),
      );
      this.requestUpdate();
      return;
    }
    if (update.request.requestorID !== myPlayer.smallID()) {
      return;
    }

    const recipient = this.game.playerBySmallID(
      update.request.recipientID,
    ) as PlayerView;
    this.addEvent({
      description: translateText("events_display.alliance_request_status", {
        name: recipient.displayName(),
        status: update.accepted
          ? translateText("events_display.alliance_accepted")
          : translateText("events_display.alliance_rejected"),
      }),
      type: update.accepted
        ? MessageType.ALLIANCE_ACCEPTED
        : MessageType.ALLIANCE_REJECTED,
      highlight: true,
      createdAt: this.game.ticks(),
      focusID: update.request.recipientID,
    });
  }

  onBrokeAllianceEvent(update: BrokeAllianceUpdate) {
    const myPlayer = this.game.myPlayer();
    if (!myPlayer) return;

    this.removeAllianceRenewalEvents(update.allianceID);
    this.alliancesCheckedAt.delete(update.allianceID);
    this.requestUpdate();

    const betrayed = this.game.playerBySmallID(update.betrayedID) as PlayerView;
    const traitor = this.game.playerBySmallID(update.traitorID) as PlayerView;

    if (betrayed.isDisconnected()) return; // Do not send the message if betraying a disconnected player

    if (!betrayed.isTraitor() && traitor === myPlayer) {
      this.eventBus.emit(new PlaySoundEffectEvent("alliance-broken"));
      const malusPercent = Math.round(
        (1 - this.game.config().traitorDefenseDebuff()) * 100,
      );

      const traitorDuration = Math.floor(
        this.game.config().traitorDuration() * 0.1,
      );
      const durationText =
        traitorDuration === 1
          ? translateText("events_display.duration_second")
          : translateText("events_display.duration_seconds_plural", {
              seconds: traitorDuration,
            });

      this.addEvent({
        description: translateText("events_display.betrayal_description", {
          name: betrayed.displayName(),
          malusPercent: malusPercent,
          durationText: durationText,
        }),
        type: MessageType.ALLIANCE_BROKEN,
        highlight: true,
        createdAt: this.game.ticks(),
        focusID: update.betrayedID,
      });
    } else if (betrayed === myPlayer) {
      this.eventBus.emit(new PlaySoundEffectEvent("alliance-broken"));
      const buttons = [
        {
          text: translateText("events_display.focus"),
          className: "btn-gray",
          action: () => this.eventBus.emit(new GoToPlayerEvent(traitor)),
          preventClose: true,
        },
      ];
      this.addEvent({
        description: translateText("events_display.betrayed_you", {
          name: traitor.displayName(),
        }),
        type: MessageType.ALLIANCE_BROKEN,
        highlight: true,
        createdAt: this.game.ticks(),
        focusID: update.traitorID,
        buttons,
      });
    }
  }

  onAllianceExpiredEvent(update: AllianceExpiredUpdate) {
    const myPlayer = this.game.myPlayer();
    if (!myPlayer) return;

    const otherID =
      update.player1ID === myPlayer.smallID()
        ? update.player2ID
        : update.player2ID === myPlayer.smallID()
          ? update.player1ID
          : null;
    if (otherID === null) return;
    const other = this.game.playerBySmallID(otherID) as PlayerView;
    if (!other || !myPlayer.isAlive() || !other.isAlive()) return;

    this.addEvent({
      description: translateText("events_display.alliance_expired", {
        name: other.displayName(),
      }),
      type: MessageType.ALLIANCE_EXPIRED,
      highlight: true,
      createdAt: this.game.ticks(),
      focusID: otherID,
    });
  }

  private onAllianceExtensionEvent(update: AllianceExtensionUpdate) {
    const myPlayer = this.game.myPlayer();
    if (!myPlayer || myPlayer.smallID() !== update.playerID) return;
    this.removeAllianceRenewalEvents(update.allianceID);
    this.requestUpdate();
  }

  onTargetPlayerEvent(event: TargetPlayerUpdate) {
    const other = this.game.playerBySmallID(event.playerID) as PlayerView;
    const myPlayer = this.game.myPlayer() as PlayerView;
    if (!myPlayer || !myPlayer.isFriendly(other)) return;

    const target = this.game.playerBySmallID(event.targetID) as PlayerView;

    this.addEvent({
      description: translateText("events_display.attack_request", {
        name: other.displayName(),
        target: target.displayName(),
      }),
      type: MessageType.ATTACK_REQUEST,
      highlight: true,
      createdAt: this.game.ticks(),
      focusID: event.targetID,
    });
  }

  emitGoToPlayerEvent(attackerID: number) {
    const attacker = this.game.playerBySmallID(attackerID) as PlayerView;
    if (!attacker) return;
    this.eventBus.emit(new GoToPlayerEvent(attacker));
  }

  emitGoToUnitEvent(unit: UnitView) {
    this.eventBus.emit(new GoToUnitEvent(unit));
  }

  onEmojiMessageEvent(update: EmojiUpdate) {
    const myPlayer = this.game.myPlayer();
    if (!myPlayer) return;

    const recipient =
      update.emoji.recipientID === AllPlayers
        ? AllPlayers
        : this.game.playerBySmallID(update.emoji.recipientID);
    const sender = this.game.playerBySmallID(
      update.emoji.senderID,
    ) as PlayerView;

    if (recipient === myPlayer) {
      this.addEvent({
        description: `${sender.displayName()}: ${update.emoji.message}`,
        unsafeDescription: true,
        type: MessageType.CHAT,
        highlight: true,
        createdAt: this.game.ticks(),
        focusID: update.emoji.senderID,
      });
    } else if (sender === myPlayer && recipient !== AllPlayers) {
      this.addEvent({
        description: translateText("events_display.sent_emoji", {
          name: (recipient as PlayerView).displayName(),
          emoji: update.emoji.message,
        }),
        unsafeDescription: true,
        type: MessageType.CHAT,
        highlight: true,
        createdAt: this.game.ticks(),
        focusID: recipient.smallID(),
      });
    }
  }

  onUnitIncomingEvent(event: UnitIncomingUpdate) {
    const myPlayer = this.game.myPlayer();

    if (!myPlayer || myPlayer.smallID() !== event.playerID) {
      return;
    }

    const unitView = this.game.unit(event.unitID);

    this.addEvent({
      description: event.message,
      type: event.messageType,
      unsafeDescription: false,
      highlight: true,
      createdAt: this.game.ticks(),
      unitView: unitView,
    });
  }

  private getEventDescription(
    event: GameEvent,
  ): string | DirectiveResult<typeof UnsafeHTMLDirective> {
    return event.unsafeDescription
      ? unsafeHTML(onlyImages(event.description))
      : event.description;
  }

  private renderBetrayalDebuffTimer() {
    const myPlayer = this.game.myPlayer();
    if (!myPlayer || !myPlayer.isTraitor()) {
      return html``;
    }

    const remainingTicks = myPlayer.getTraitorRemainingTicks();
    const remainingSeconds = Math.ceil(remainingTicks / 10);

    if (remainingSeconds <= 0) {
      return html``;
    }

    return html`
      ${this.renderButton({
        content: html`${translateText("events_display.betrayal_debuff_ends", {
          time: remainingSeconds,
        })}`,
        className: "text-left text-yellow-400",
        translate: false,
      })}
    `;
  }

  render() {
    if (!this.active || !this._isVisible) {
      return html``;
    }

    const styles = html`
      <style>
        @keyframes goldBounce {
          0% {
            transform: scale(1);
          }
          30% {
            transform: scale(1.3);
          }
          50% {
            transform: scale(1.1);
          }
          70% {
            transform: scale(1.2);
          }
          100% {
            transform: scale(1);
          }
        }
      </style>
    `;

    const filteredEvents = this.events.filter((event) => {
      const category = getMessageCategory(event.type);
      return !this.eventsFilters.get(category);
    });

    filteredEvents.sort((a, b) => {
      const aPrior = a.priority ?? 100000;
      const bPrior = b.priority ?? 100000;
      if (aPrior === bPrior) {
        return a.createdAt - b.createdAt;
      }
      return bPrior - aPrior;
    });

    return html`
      ${styles}
      <!-- Events Toggle (when hidden) -->
      ${this._hidden
        ? html`
            <div class="relative w-fit z-50">
              <hud-button
                class="pointer-events-auto"
                @click=${this.toggleHidden}
              >
                <span class="flex items-center gap-2">
                  ${translateText("events_display.events")}
                  ${this.newEvents > 0
                    ? html`<hud-pill
                        tone="red"
                        .value=${String(this.newEvents)}
                      ></hud-pill>`
                    : ""}
                </span>
              </hud-button>
            </div>
          `
        : html`
            <!-- Main Events Display -->
            <hud-surface
              class="relative w-full z-50 min-[1200px]:w-96"
              @contextmenu=${(e: Event) => e.preventDefault()}
            >
              <!-- Button Bar -->
              <hud-surface-header>
                <hud-action-group>
                  ${this.renderToggleButton(swordIcon, MessageCategory.ATTACK)}
                  ${this.renderToggleButton(nukeIcon, MessageCategory.NUKE)}
                  ${this.renderToggleButton(
                    donateGoldIcon,
                    MessageCategory.TRADE,
                  )}
                  ${this.renderToggleButton(
                    allianceIcon,
                    MessageCategory.ALLIANCE,
                  )}
                  ${this.renderToggleButton(chatIcon, MessageCategory.CHAT)}
                </hud-action-group>
                <hud-action-group>
                  ${this.latestGoldAmount !== null
                    ? html`<hud-pill
                        tone="green"
                        .value=${`+${renderNumber(this.latestGoldAmount)}`}
                        class="transition-all duration-300 ${this
                          .goldAmountAnimating
                          ? "animate-pulse scale-110"
                          : "scale-100"}"
                        style="animation: ${this.goldAmountAnimating
                          ? "goldBounce 0.6s ease-out"
                          : "none"}"
                      ></hud-pill>`
                    : ""}
                  <hud-button @click=${this.toggleHidden}>
                    ${translateText("leaderboard.hide")}
                  </hud-button>
                </hud-action-group>
              </hud-surface-header>

              <!-- Content Area -->
              <hud-surface-body>
                <div
                  class="max-h-[15vh] lg:max-h-[30vh] overflow-y-auto w-full h-full events-container pointer-events-auto"
                >
                  ${filteredEvents.map((event) => this.renderEventRow(event))}
                  ${this.hasActiveBetrayalDebuff()
                    ? html`<hud-event-row
                        style="--hud-event-columns: 0 minmax(0, 1fr) auto"
                        tone="orange"
                      >
                        ${this.renderBetrayalDebuffTimer()}
                      </hud-event-row>`
                    : ""}
                  ${filteredEvents.length === 0 &&
                  !this.hasActiveBetrayalDebuff()
                    ? html`<hud-event-row
                        style="--hud-event-columns: 0 minmax(0, 1fr) auto"
                      >
                        <span class="inline-block min-w-72">&nbsp;</span>
                      </hud-event-row>`
                    : ""}
                </div>
              </hud-surface-body>
            </hud-surface>
          `}
    `;
  }

  private renderEventRow(event: GameEvent) {
    return html`<hud-event-row
      style="--hud-event-columns: 0 minmax(0, 1fr) auto"
      .tone=${this.eventTone(event)}
    >
      ${this.renderEventContent(event)}
      ${event.buttons
        ? html`<hud-action-group slot="actions">
            ${event.buttons.map(
              (button) =>
                html`<hud-button
                  .variant=${button.className.includes("btn-gray")
                    ? "default"
                    : "active"}
                  @click=${() => this.handleEventButton(event, button)}
                >
                  ${button.text}
                </hud-button>`,
            )}
          </hud-action-group>`
        : ""}
    </hud-event-row>`;
  }

  private renderEventContent(event: GameEvent) {
    if (event.focusID) {
      return this.renderButton({
        content: this.getEventDescription(event),
        onClick: () => {
          if (event.focusID) this.emitGoToPlayerEvent(event.focusID);
        },
        className: "text-left text-inherit hover:text-white",
      });
    }

    if (event.unitView) {
      return this.renderButton({
        content: this.getEventDescription(event),
        onClick: () => {
          if (event.unitView) this.emitGoToUnitEvent(event.unitView);
        },
        className: "text-left text-inherit hover:text-white",
      });
    }

    return this.getEventDescription(event);
  }

  private handleEventButton(
    event: GameEvent,
    button: NonNullable<GameEvent["buttons"]>[number],
  ) {
    button.action();
    if (!button.preventClose) {
      const originalIndex = this.events.findIndex(
        (candidate) => candidate === event,
      );
      if (originalIndex !== -1) {
        this.removeEvent(originalIndex);
      }
    }
    this.requestUpdate();
  }

  private eventTone(event: GameEvent) {
    switch (getMessageCategory(event.type)) {
      case MessageCategory.ATTACK:
      case MessageCategory.NUKE:
        return "danger";
      case MessageCategory.ALLIANCE:
        return "success";
      case MessageCategory.TRADE:
        return "warning";
      case MessageCategory.CHAT:
        return "active";
      default:
        return "default";
    }
  }

  private hasActiveBetrayalDebuff() {
    const myPlayer = this.game.myPlayer();
    return (
      myPlayer !== null &&
      myPlayer.isTraitor() &&
      myPlayer.getTraitorRemainingTicks() > 0
    );
  }

  createRenderRoot() {
    return this;
  }
}

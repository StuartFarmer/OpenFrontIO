import { html, LitElement } from "lit";
import { customElement, state } from "lit/decorators.js";
import { ChevronDown, ChevronUp, X } from "lucide";
import { assetUrl } from "../../../core/AssetUrls";
import { EventBus } from "../../../core/EventBus";
import { MessageType, PlayerType, UnitType } from "../../../core/game/Game";
import {
  AttackUpdate,
  GameUpdateType,
  UnitIncomingUpdate,
} from "../../../core/game/GameUpdates";
import { GameView, PlayerView, UnitView } from "../../../core/game/GameView";
import { Controller } from "../../Controller";
import {
  GoToPlayerEvent,
  GoToPositionEvent,
  GoToUnitEvent,
} from "../../TransformHandler";
import {
  CancelAttackIntentEvent,
  CancelBoatIntentEvent,
  SendAttackIntentEvent,
} from "../../Transport";
import { UIState } from "../../UIState";
import { renderTroops, translateText } from "../../Utils";
import { getColoredSprite } from "../SpriteLoader";
import "../ui/HudComponents";
import { renderLucideIcon } from "../ui/LucideIcon";
const soldierIcon = assetUrl("images/SoldierIcon.svg");
const swordIcon = assetUrl("images/SwordIcon.svg");

const redIconFilter =
  "brightness(0) saturate(100%) invert(27%) sepia(91%) saturate(4551%) hue-rotate(348deg) brightness(89%) contrast(97%)";
const blueIconFilter =
  "brightness(0) saturate(100%) invert(62%) sepia(80%) saturate(500%) hue-rotate(175deg) brightness(100%)";

@customElement("attacks-display")
export class AttacksDisplay extends LitElement implements Controller {
  public eventBus: EventBus;
  public game: GameView;
  public uiState: UIState;

  private active: boolean = false;
  private incomingBoatIDs: Set<number> = new Set();
  private spriteDataURLCache: Map<string, string> = new Map();
  @state() private _isVisible: boolean = false;
  @state() private incomingAttacks: AttackUpdate[] = [];
  @state() private outgoingAttacks: AttackUpdate[] = [];
  @state() private outgoingLandAttacks: AttackUpdate[] = [];
  @state() private outgoingBoats: UnitView[] = [];
  @state() private incomingBoats: UnitView[] = [];

  createRenderRoot() {
    return this;
  }

  init() {}

  tick() {
    this.active = true;

    if (!this._isVisible && !this.game.inSpawnPhase()) {
      this._isVisible = true;
    }

    const myPlayer = this.game.myPlayer();
    if (!myPlayer || !myPlayer.isAlive()) {
      if (this._isVisible) {
        this._isVisible = false;
      }
      return;
    }

    // Track incoming boat unit IDs from UnitIncoming events
    const updates = this.game.updatesSinceLastTick();
    if (updates) {
      for (const event of updates[
        GameUpdateType.UnitIncoming
      ] as UnitIncomingUpdate[]) {
        if (
          event.playerID === myPlayer.smallID() &&
          event.messageType === MessageType.NAVAL_INVASION_INBOUND
        ) {
          this.incomingBoatIDs.add(event.unitID);
        }
      }
    }

    // Resolve incoming boats from tracked IDs, remove inactive ones
    const resolvedIncomingBoats: UnitView[] = [];
    for (const unitID of this.incomingBoatIDs) {
      const unit = this.game.unit(unitID);
      if (unit && unit.isActive() && unit.type() === UnitType.TransportShip) {
        resolvedIncomingBoats.push(unit);
      } else {
        this.incomingBoatIDs.delete(unitID);
      }
    }
    this.incomingBoats = resolvedIncomingBoats;

    this.incomingAttacks = myPlayer.incomingAttacks().filter((a) => {
      const t = (this.game.playerBySmallID(a.attackerID) as PlayerView).type();
      return t !== PlayerType.Bot;
    });

    this.outgoingAttacks = myPlayer
      .outgoingAttacks()
      .filter((a) => a.targetID !== 0);

    this.outgoingLandAttacks = myPlayer
      .outgoingAttacks()
      .filter((a) => a.targetID === 0);

    this.outgoingBoats = myPlayer
      .units()
      .filter((u) => u.type() === UnitType.TransportShip);

    this.requestUpdate();
  }

  private renderButton(options: {
    content: any;
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
      <hud-icon-button
        class="${className}"
        style="--hud-icon-button-size: 20px; --hud-icon-button-radius: 3px;"
        variant=${className.includes("red") ? "danger" : "default"}
        label=""
        @click=${onClick}
        ?disabled=${disabled}
        ?translate=${translate}
      >
        ${content}
      </hud-icon-button>
    `;
  }

  private emitCancelAttackIntent(id: string) {
    const myPlayer = this.game.myPlayer();
    if (!myPlayer) return;
    this.eventBus.emit(new CancelAttackIntentEvent(id));
  }

  private emitBoatCancelIntent(id: number) {
    const myPlayer = this.game.myPlayer();
    if (!myPlayer) return;
    this.eventBus.emit(new CancelBoatIntentEvent(id));
  }

  private emitGoToPlayerEvent(attackerID: number) {
    const attacker = this.game.playerBySmallID(attackerID) as PlayerView;
    this.eventBus.emit(new GoToPlayerEvent(attacker));
  }

  private getBoatSpriteDataURL(unit: UnitView): string {
    const owner = unit.owner();
    const key = `boat-${owner.id()}`;
    const cached = this.spriteDataURLCache.get(key);
    if (cached) return cached;
    try {
      const canvas = getColoredSprite(unit, this.game.config().theme());
      const dataURL = canvas.toDataURL();
      this.spriteDataURLCache.set(key, dataURL);
      return dataURL;
    } catch {
      return "";
    }
  }

  private async attackWarningOnClick(attack: AttackUpdate) {
    const playerView = this.game.playerBySmallID(attack.attackerID);
    if (playerView !== undefined) {
      if (playerView instanceof PlayerView) {
        const attacks = await playerView.attackClusteredPositions(attack.id);
        const pos = attacks[0]?.positions[0];

        if (!pos) {
          this.emitGoToPlayerEvent(attack.attackerID);
        } else {
          this.eventBus.emit(new GoToPositionEvent(pos.x, pos.y));
        }
      }
    } else {
      this.emitGoToPlayerEvent(attack.attackerID);
    }
  }

  private handleRetaliate(attack: AttackUpdate) {
    const attacker = this.game.playerBySmallID(attack.attackerID) as PlayerView;
    if (!attacker) return;

    const myPlayer = this.game.myPlayer();
    if (!myPlayer) return;

    const counterTroops = Math.min(
      attack.troops,
      this.uiState.attackRatio * myPlayer.troops(),
    );
    this.eventBus.emit(new SendAttackIntentEvent(attacker.id(), counterTroops));
  }

  private iconToneClass(tone: "blue" | "red") {
    return tone === "red"
      ? "border-red-700/50 bg-red-900/35 text-red-300"
      : "border-aquarius/45 bg-aquarius/15 text-aquarius";
  }

  private iconBoxClass(tone: "blue" | "red") {
    return `inline-grid aspect-square shrink-0 place-items-center rounded-[3px] border ${this.iconToneClass(tone)}`;
  }

  private attackActionClass(tone: "blue" | "red") {
    return `inline-grid aspect-square h-5 w-5 shrink-0 place-items-center rounded-[3px] border p-0 leading-none ${this.iconToneClass(tone)}`;
  }

  private iconFilter(tone: "blue" | "red") {
    return tone === "red" ? redIconFilter : blueIconFilter;
  }

  private renderSpriteIcon(
    src: string,
    tone: "blue" | "red",
    pixelated = false,
  ) {
    if (!pixelated) {
      return html`
        <span class="${this.iconBoxClass(tone)} h-5 w-5">
          <hud-icon
            .src=${src}
            size="sm"
            tone=${tone === "red" ? "danger" : "active"}
          ></hud-icon>
        </span>
      `;
    }

    return html`
      <span class="${this.iconBoxClass(tone)} h-5 w-5">
        <img
          src="${src}"
          class="h-3.5 w-3.5"
          style="filter: ${this.iconFilter(tone)}; ${pixelated
            ? "image-rendering: pixelated"
            : ""}"
        />
      </span>
    `;
  }

  private renderGlyphIcon(label: string, tone: "blue" | "red") {
    return html`
      <span
        class="${this.iconBoxClass(
          tone,
        )} h-5 w-5 font-mono text-[10px] font-bold"
        translate="no"
      >
        ${label}
      </span>
    `;
  }

  private renderDirectionIcon(direction: "up" | "down", tone: "blue" | "red") {
    return html`
      <span class="${this.iconBoxClass(tone)} h-5 w-5">
        ${renderLucideIcon(
          direction === "up" ? ChevronUp : ChevronDown,
          "h-3.5 w-3.5",
        )}
      </span>
    `;
  }

  private renderBoatSquareIcon(boat: UnitView, tone: "blue" | "red") {
    const dataURL = this.getBoatSpriteDataURL(boat);
    if (!dataURL) return this.renderGlyphIcon("B", tone);
    return this.renderSpriteIcon(dataURL, tone, true);
  }

  private renderAttackRow(options: {
    tone: "blue" | "red";
    primaryIcon: unknown;
    directionIcon: unknown;
    amount: string;
    label: string;
    onClick?: () => void;
    action?: unknown;
    retreating?: boolean;
  }) {
    const label = options.retreating
      ? `${options.label} (${translateText("events_display.retreating")}...)`
      : options.label;

    return html`
      <hud-attack-row
        .tone=${options.tone}
        .amount=${options.amount}
        .label=${label}
        @row-click=${options.onClick}
        style="--hud-attack-color: ${options.tone === "red"
          ? "#f87171"
          : "#7dd3fc"}"
      >
        <span slot="primary-icon">${options.primaryIcon}</span>
        <span slot="direction-icon">${options.directionIcon}</span>
        ${options.action
          ? html`<span slot="action">${options.action}</span>`
          : html``}
      </hud-attack-row>
    `;
  }

  private renderCancelAction(onClick: () => void, tone: "blue" | "red") {
    const textClass = tone === "red" ? "text-red-300" : "text-aquarius";
    return this.renderButton({
      content: renderLucideIcon(X, "h-3.5 w-3.5"),
      onClick,
      className: `${this.attackActionClass(tone)} ${textClass}`,
      translate: false,
    });
  }

  private renderIncomingAttacks() {
    if (this.incomingAttacks.length === 0) return html``;

    return this.incomingAttacks.map((attack) =>
      this.renderAttackRow({
        tone: "red",
        primaryIcon: this.renderSpriteIcon(soldierIcon, "red"),
        directionIcon: this.renderDirectionIcon("down", "red"),
        amount: renderTroops(attack.troops),
        label:
          (
            this.game.playerBySmallID(attack.attackerID) as PlayerView
          )?.displayName() ?? "",
        onClick: () => this.attackWarningOnClick(attack),
        retreating: attack.retreating,
        action: !attack.retreating
          ? this.renderButton({
              content: html`<hud-icon
                .src=${swordIcon}
                size="sm"
                tone="danger"
              ></hud-icon>`,
              onClick: () => this.handleRetaliate(attack),
              className: `${this.attackActionClass("red")} text-red-300`,
              translate: false,
            })
          : html``,
      }),
    );
  }

  private renderOutgoingAttacks() {
    if (this.outgoingAttacks.length === 0) return html``;

    return this.outgoingAttacks.map((attack) =>
      this.renderAttackRow({
        tone: "blue",
        primaryIcon: this.renderSpriteIcon(soldierIcon, "blue"),
        directionIcon: this.renderDirectionIcon("up", "blue"),
        amount: renderTroops(attack.troops),
        label:
          (
            this.game.playerBySmallID(attack.targetID) as PlayerView
          )?.displayName() ?? "",
        onClick: async () => this.attackWarningOnClick(attack),
        retreating: attack.retreating,
        action: !attack.retreating
          ? this.renderCancelAction(
              () => this.emitCancelAttackIntent(attack.id),
              "blue",
            )
          : html``,
      }),
    );
  }

  private renderOutgoingLandAttacks() {
    if (this.outgoingLandAttacks.length === 0) return html``;

    return this.outgoingLandAttacks.map((landAttack) =>
      this.renderAttackRow({
        tone: "blue",
        primaryIcon: this.renderSpriteIcon(soldierIcon, "blue"),
        directionIcon: this.renderDirectionIcon("up", "blue"),
        amount: renderTroops(landAttack.troops),
        label: translateText("help_modal.ui_wilderness"),
        retreating: landAttack.retreating,
        action: !landAttack.retreating
          ? this.renderCancelAction(
              () => this.emitCancelAttackIntent(landAttack.id),
              "blue",
            )
          : html``,
      }),
    );
  }

  private getBoatTargetName(boat: UnitView): string {
    const target = boat.targetTile();
    if (target === undefined) return "";
    const ownerID = this.game.ownerID(target);
    if (ownerID === 0) return "";
    const player = this.game.playerBySmallID(ownerID) as PlayerView;
    return player?.displayName() ?? "";
  }

  private renderBoats() {
    if (this.outgoingBoats.length === 0) return html``;

    return this.outgoingBoats.map((boat) =>
      this.renderAttackRow({
        tone: "blue",
        primaryIcon: this.renderBoatSquareIcon(boat, "blue"),
        directionIcon: this.renderDirectionIcon("up", "blue"),
        amount: renderTroops(boat.troops()),
        label: this.getBoatTargetName(boat),
        onClick: () => this.eventBus.emit(new GoToUnitEvent(boat)),
        retreating: boat.transportShipState().isRetreating,
        action: !boat.transportShipState().isRetreating
          ? this.renderCancelAction(
              () => this.emitBoatCancelIntent(boat.id()),
              "blue",
            )
          : html``,
      }),
    );
  }

  private renderIncomingBoats() {
    if (this.incomingBoats.length === 0) return html``;

    return this.incomingBoats.map((boat) =>
      this.renderAttackRow({
        tone: "red",
        primaryIcon: this.renderBoatSquareIcon(boat, "red"),
        directionIcon: this.renderDirectionIcon("down", "red"),
        amount: renderTroops(boat.troops()),
        label: boat.owner()?.displayName() ?? "",
        onClick: () => this.eventBus.emit(new GoToUnitEvent(boat)),
      }),
    );
  }

  render() {
    if (!this.active || !this._isVisible) {
      return html``;
    }

    const hasAnything =
      this.outgoingAttacks.length > 0 ||
      this.outgoingLandAttacks.length > 0 ||
      this.outgoingBoats.length > 0 ||
      this.incomingAttacks.length > 0 ||
      this.incomingBoats.length > 0;

    if (!hasAnything) {
      return html``;
    }

    return html`
      <div
        class="font-mono tabular-nums w-full mb-1 mt-1 sm:mt-0 pointer-events-auto grid grid-cols-1 min-[560px]:grid-cols-2 gap-1 text-white text-[10px] max-h-[7rem] overflow-y-auto"
      >
        ${this.renderOutgoingAttacks()} ${this.renderOutgoingLandAttacks()}
        ${this.renderBoats()} ${this.renderIncomingAttacks()}
        ${this.renderIncomingBoats()}
      </div>
    `;
  }
}

import { html, LitElement, TemplateResult } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { assetUrl } from "../../../core/AssetUrls";
import { EventBus } from "../../../core/EventBus";
import {
  PlayerProfile,
  PlayerType,
  Relation,
  Unit,
  UnitType,
} from "../../../core/game/Game";
import { TileRef } from "../../../core/game/GameMap";
import { AllianceView } from "../../../core/game/GameUpdates";
import { GameView, PlayerView, UnitView } from "../../../core/game/GameView";
import { Controller } from "../../Controller";
import {
  ContextMenuEvent,
  MouseMoveEvent,
  TouchEvent,
} from "../../InputHandler";
import { TransformHandler } from "../../TransformHandler";
import {
  getTranslatedPlayerTeamLabel,
  renderDuration,
  renderNumber,
  renderTroops,
  translateText,
} from "../../Utils";
import {
  EMOJI_ICON_KIND,
  getFirstPlacePlayer,
  getPlayerIcons,
  IMAGE_ICON_KIND,
} from "../PlayerIcons";
import "../ui/HudComponents";
import { ImmunityBarVisibleEvent } from "./ImmunityTimer";
import { CloseRadialMenuEvent } from "./RadialMenu";
import "./RelationSmiley";
import { SpawnBarVisibleEvent } from "./SpawnTimer";
const soldierIconAquarius = assetUrl("images/SoldierIconAquarius.svg");
const allianceIcon = assetUrl("images/AllianceIcon.svg");
const warshipIcon = assetUrl("images/BattleshipIconWhite.svg");
const cityIcon = assetUrl("images/CityIconWhite.svg");
const factoryIcon = assetUrl("images/FactoryIconWhite.svg");
const goldCoinIcon = assetUrl("images/GoldCoinIcon.svg");
const missileSiloIcon = assetUrl("images/MissileSiloIconWhite.svg");
const portIcon = assetUrl("images/PortIcon.svg");
const samLauncherIcon = assetUrl("images/SamLauncherIconWhite.svg");
const soldierIcon = assetUrl("images/SoldierIcon.svg");

function euclideanDistWorld(
  coord: { x: number; y: number },
  tileRef: TileRef,
  game: GameView,
): number {
  const x = game.x(tileRef);
  const y = game.y(tileRef);
  const dx = coord.x - x;
  const dy = coord.y - y;
  return Math.sqrt(dx * dx + dy * dy);
}

function distSortUnitWorld(coord: { x: number; y: number }, game: GameView) {
  return (a: Unit | UnitView, b: Unit | UnitView) => {
    const distA = euclideanDistWorld(coord, a.tile(), game);
    const distB = euclideanDistWorld(coord, b.tile(), game);
    return distA - distB;
  };
}

@customElement("player-info-overlay")
export class PlayerInfoOverlay extends LitElement implements Controller {
  @property({ type: Object })
  public game!: GameView;

  @property({ type: Object })
  public eventBus!: EventBus;

  @property({ type: Object })
  public transform!: TransformHandler;

  @state()
  private player: PlayerView | null = null;

  @state()
  private playerProfile: PlayerProfile | null = null;

  @state()
  private unit: UnitView | null = null;

  @state()
  private _isInfoVisible: boolean = false;

  @state()
  private spawnBarVisible = false;
  @state()
  private immunityBarVisible = false;

  private _isActive = false;

  private get barOffset(): number {
    return (this.spawnBarVisible ? 7 : 0) + (this.immunityBarVisible ? 7 : 0);
  }

  private lastMouseUpdate = 0;

  init() {
    this.eventBus.on(MouseMoveEvent, (e: MouseMoveEvent) =>
      this.onMouseEvent(e),
    );
    this.eventBus.on(ContextMenuEvent, (e: ContextMenuEvent) =>
      this.maybeShow(e.x, e.y),
    );
    this.eventBus.on(TouchEvent, (e: TouchEvent) => this.maybeShow(e.x, e.y));
    this.eventBus.on(CloseRadialMenuEvent, () => this.hide());
    this.eventBus.on(SpawnBarVisibleEvent, (e) => {
      this.spawnBarVisible = e.visible;
    });
    this.eventBus.on(ImmunityBarVisibleEvent, (e) => {
      this.immunityBarVisible = e.visible;
    });
    this._isActive = true;
  }

  private onMouseEvent(event: MouseMoveEvent) {
    const now = Date.now();
    if (now - this.lastMouseUpdate < 100) {
      return;
    }
    this.lastMouseUpdate = now;
    this.maybeShow(event.x, event.y);
  }

  public hide() {
    this.setVisible(false);
    this.unit = null;
    this.player = null;
  }

  public maybeShow(x: number, y: number) {
    this.hide();
    const worldCoord = this.transform.screenToWorldCoordinates(x, y);
    if (!this.game.isValidCoord(worldCoord.x, worldCoord.y)) {
      return;
    }

    const tile = this.game.ref(worldCoord.x, worldCoord.y);
    if (!tile) return;

    const owner = this.game.owner(tile);

    if (owner && owner.isPlayer()) {
      this.player = owner as PlayerView;
      this.player.profile().then((p) => {
        this.playerProfile = p;
      });
      this.setVisible(true);
    } else if (!this.game.isLand(tile)) {
      const units = this.game
        .units(UnitType.Warship, UnitType.TradeShip, UnitType.TransportShip)
        .filter((u) => euclideanDistWorld(worldCoord, u.tile(), this.game) < 50)
        .sort(distSortUnitWorld(worldCoord, this.game));

      if (units.length > 0) {
        this.unit = units[0];
        this.setVisible(true);
      }
    }
  }

  tick() {
    this.requestUpdate();
  }

  setVisible(visible: boolean) {
    this._isInfoVisible = visible;
    this.requestUpdate();
  }

  private getPlayerNameColor(isFriendly: boolean): string {
    if (isFriendly) return "text-green-500";
    return "text-white";
  }

  private getRelationSmiley(
    player: PlayerView,
    myPlayer: PlayerView | null | undefined,
  ): TemplateResult | string {
    if (!myPlayer || myPlayer === player || player.type() !== PlayerType.Nation)
      return "";
    const relation =
      this.playerProfile?.relations[myPlayer.smallID()] ?? Relation.Neutral;
    if (relation === Relation.Neutral) return "";
    return html`<relation-smiley .relation=${relation}></relation-smiley>`;
  }

  private getRelationName(relation: Relation): string {
    switch (relation) {
      case Relation.Hostile:
        return translateText("relation.hostile");
      case Relation.Distrustful:
        return translateText("relation.distrustful");
      case Relation.Neutral:
        return translateText("relation.neutral");
      case Relation.Friendly:
        return translateText("relation.friendly");
      default:
        return translateText("relation.default");
    }
  }

  private displayUnitCount(player: PlayerView, type: UnitType, icon: string) {
    return !this.game.config().isUnitDisabled(type)
      ? html`<hud-pill
          tone="blue"
          .value=${String(player.totalUnitLevels(type))}
          icon-src=${icon}
        ></hud-pill>`
      : "";
  }

  private allianceExpirationText(alliance: AllianceView) {
    const { expiresAt } = alliance;
    const remainingTicks = expiresAt - this.game.ticks();
    let remainingSeconds = 0;
    if (remainingTicks > 0) {
      remainingSeconds = Math.max(0, Math.floor(remainingTicks / 10)); // 10 ticks per second
    }
    return renderDuration(remainingSeconds);
  }

  private renderPlayerNameIcons(player: PlayerView) {
    const firstPlace = getFirstPlacePlayer(this.game);
    const icons = getPlayerIcons({
      game: this.game,
      player,
      // Because we already show the alliance icon next to the alliance expiration timer, we don't need to show it a second time in this render
      includeAllianceIcon: false,
      firstPlace,
      alliancesDisabled: this.game.config().disableAlliances(),
    });

    if (icons.length === 0) {
      return html``;
    }

    return html`<span class="flex items-center gap-1 ml-1 shrink-0">
      ${icons.map((icon) =>
        icon.kind === EMOJI_ICON_KIND && icon.text
          ? html`<span class="text-sm shrink-0" translate="no"
              >${icon.text}</span
            >`
          : icon.kind === IMAGE_ICON_KIND && icon.src
            ? html`<hud-icon
                .src=${icon.src}
                size="sm"
                tone="inherit"
              ></hud-icon>`
            : html``,
      )}
    </span>`;
  }

  private renderPlayerInfo(player: PlayerView) {
    const myPlayer = this.game.myPlayer();
    const isFriendly = myPlayer?.isFriendly(player);
    const isAllied = myPlayer?.isAlliedWith(player);
    let allianceHtml: TemplateResult | null = null;
    const maxTroops = this.game.config().maxTroops(player);
    const attackingTroops = player
      .outgoingAttacks()
      .map((a) => a.troops)
      .reduce((a, b) => a + b, 0);
    const totalTroops = player.troops();

    if (isAllied) {
      const alliance = myPlayer
        ?.alliances()
        .find((alliance) => alliance.other === player.id());
      if (alliance !== undefined) {
        allianceHtml = html`<hud-pill
          tone="blue"
          .value=${this.allianceExpirationText(alliance)}
          icon-src=${allianceIcon}
        ></hud-pill>`;
      }
    }
    let playerType = "";
    switch (player.type()) {
      case PlayerType.Bot:
        playerType = translateText("player_type.bot");
        break;
      case PlayerType.Nation:
        playerType = translateText("player_type.nation");
        break;
      case PlayerType.Human:
        playerType = translateText("player_type.player");
        break;
    }
    const playerTeam = getTranslatedPlayerTeamLabel(player.team());

    return html`
      <div class="p-2 space-y-2">
        <div class="flex items-center gap-2 min-w-0">
          <div
            class="flex min-w-0 flex-1 items-center gap-2 font-bold text-xs ${this.getPlayerNameColor(
              isFriendly ?? false,
            )}"
          >
            ${player.cosmetics.flag
              ? html`<img
                  class="h-4 object-contain"
                  src=${assetUrl(player.cosmetics.flag!)}
                />`
              : html``}
            <span class="truncate">${player.displayName()}</span>
            ${this.getRelationSmiley(player, myPlayer)}
            ${this.renderPlayerNameIcons(player)}
          </div>
          ${allianceHtml ?? ""}
        </div>

        <hud-table>
          <hud-table-row>
            <hud-table-cell align="left">
              ${translateText("leaderboard.player")}
            </hud-table-cell>
            <hud-table-cell>
              ${playerTeam !== "" && player.type() !== PlayerType.Bot
                ? html`${playerType}
                    <span
                      style="color: ${this.game
                        .config()
                        .theme()
                        .teamColor(player.team()!)
                        .toHex()}"
                      >${playerTeam}</span
                    >`
                : playerType}
            </hud-table-cell>
          </hud-table-row>
          <hud-table-row>
            <hud-table-cell align="left">
              ${translateText("leaderboard.gold")}
            </hud-table-cell>
            <hud-table-cell>
              <hud-pill
                tone="gold"
                .value=${renderNumber(player.gold())}
                icon-src=${goldCoinIcon}
              ></hud-pill>
            </hud-table-cell>
          </hud-table-row>
          <hud-table-row>
            <hud-table-cell align="left">
              ${translateText("leaderboard.maxtroops")}
            </hud-table-cell>
            <hud-table-cell translate="no">
              ${this.renderTroopBar(totalTroops, attackingTroops, maxTroops)}
            </hud-table-cell>
          </hud-table-row>
          <hud-table-row>
            <hud-table-cell align="left">Attack</hud-table-cell>
            <hud-table-cell>
              <hud-pill
                tone="blue"
                .value=${renderTroops(attackingTroops)}
                icon-src=${attackingTroops > 0
                  ? soldierIconAquarius
                  : soldierIcon}
              ></hud-pill>
            </hud-table-cell>
          </hud-table-row>
        </hud-table>

        <div class="flex flex-wrap gap-1 items-center">
          ${this.displayUnitCount(player, UnitType.City, cityIcon)}
          ${this.displayUnitCount(player, UnitType.Factory, factoryIcon)}
          ${this.displayUnitCount(player, UnitType.Port, portIcon)}
          ${this.displayUnitCount(
            player,
            UnitType.MissileSilo,
            missileSiloIcon,
          )}
          ${this.displayUnitCount(
            player,
            UnitType.SAMLauncher,
            samLauncherIcon,
          )}
          ${this.displayUnitCount(player, UnitType.Warship, warshipIcon)}
        </div>
      </div>
    `;
  }

  private renderTroopBar(
    totalTroops: number,
    attackingTroops: number,
    maxTroops: number,
  ) {
    const base = Math.max(maxTroops, 1);
    const greenPercentRaw = (totalTroops / base) * 100;
    const orangePercentRaw = (attackingTroops / base) * 100;

    const greenPercent = Math.max(0, Math.min(100, greenPercentRaw));
    const orangePercent = Math.max(
      0,
      Math.min(100 - greenPercent, orangePercentRaw),
    );

    return html`
      <span class="relative inline-block">
        <hud-meter
          variant="mini"
          .segments=${[
            { width: greenPercent, tone: "slate" },
            { width: orangePercent, tone: "blue" },
          ].filter((segment) => segment.width > 0)}
          .label=${html`
            <span class="text-white drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)]"
              >${renderTroops(totalTroops)}</span
            >
            <span class="text-white drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)]"
              >${renderTroops(maxTroops)}</span
            >
          `}
          label-align="between"
        ></hud-meter>
        <hud-icon
          .src=${soldierIcon}
          size="sm"
          tone="default"
          class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)] pointer-events-none"
        ></hud-icon>
      </span>
    `;
  }

  private renderUnitInfo(unit: UnitView) {
    const isAlly =
      (unit.owner() === this.game.myPlayer() ||
        this.game.myPlayer()?.isFriendly(unit.owner())) ??
      false;

    return html`
      <div class="p-2">
        <hud-table>
          <hud-table-row>
            <hud-table-cell align="left">
              ${translateText("leaderboard.player")}
            </hud-table-cell>
            <hud-table-cell>
              <span class=${isAlly ? "font-bold text-green-500" : "font-bold"}>
                ${unit.owner().displayName()}
              </span>
            </hud-table-cell>
          </hud-table-row>
          <hud-table-row>
            <hud-table-cell align="left">Unit</hud-table-cell>
            <hud-table-cell>${unit.type()}</hud-table-cell>
          </hud-table-row>
          ${unit.hasHealth()
            ? html`<hud-table-row>
                <hud-table-cell align="left">Health</hud-table-cell>
                <hud-table-cell>${unit.health()}</hud-table-cell>
              </hud-table-row>`
            : ""}
          ${unit.type() === UnitType.TransportShip
            ? html`
                <hud-table-row>
                  <hud-table-cell align="left">Troops</hud-table-cell>
                  <hud-table-cell
                    >${renderTroops(unit.troops())}</hud-table-cell
                  >
                </hud-table-row>
              `
            : ""}
        </hud-table>
      </div>
    `;
  }

  render() {
    if (!this._isActive) {
      return html``;
    }

    const containerClasses = this._isInfoVisible
      ? "opacity-100 visible"
      : "opacity-0 invisible pointer-events-none";

    return html`
      <div
        class="fixed top-0 left-0 right-0 sm:left-1/2 sm:right-auto sm:-translate-x-1/2 z-[1001]"
        style="margin-top: ${this.barOffset}px;"
        @click=${() => this.hide()}
        @contextmenu=${(e: MouseEvent) => e.preventDefault()}
      >
        <div
          class="font-mono tabular-nums text-white bg-gray-800/88 backdrop-blur-sm shadow-xs rounded-[3px] shadow-lg w-full sm:w-[500px] overflow-hidden ${containerClasses}"
        >
          ${this.player !== null ? this.renderPlayerInfo(this.player) : ""}
          ${this.unit !== null ? this.renderUnitInfo(this.unit) : ""}
        </div>
      </div>
    `;
  }

  createRenderRoot() {
    return this; // Disable shadow DOM to allow Tailwind styles
  }
}

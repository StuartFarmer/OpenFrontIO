import { css, html, LitElement } from "lit";
import { customElement, state } from "lit/decorators.js";
import { translateText } from "../../../client/Utils";
import { assetUrl } from "../../../core/AssetUrls";
import { EventBus } from "../../../core/EventBus";
import {
  BuildableUnit,
  BuildMenus,
  Gold,
  PlayerBuildableUnitType,
  UnitType,
} from "../../../core/game/Game";
import { TileRef } from "../../../core/game/GameMap";
import { GameView } from "../../../core/game/GameView";
import {
  createZeroResources,
  ResourceStockpile,
} from "../../../core/game/Resources";
import { Controller } from "../../Controller";
import {
  CloseViewEvent,
  MouseDownEvent,
  ShowBuildMenuEvent,
  ShowEmojiMenuEvent,
} from "../../InputHandler";
import { TransformHandler } from "../../TransformHandler";
import {
  BuildUnitIntentEvent,
  SendUpgradeStructureIntentEvent,
} from "../../Transport";
import { UIState } from "../../UIState";
import { renderNumber } from "../../Utils";
import { renderResourceCostText } from "../ResourceDisplay";
import "../ui";
const warshipIcon = assetUrl("images/BattleshipIconWhite.svg");
const cityIcon = assetUrl("images/CityIconWhite.svg");
const factoryIcon = assetUrl("images/FactoryIconWhite.svg");
const mirvIcon = assetUrl("images/MIRVIcon.svg");
const hydrogenBombIcon = assetUrl("images/MushroomCloudIconWhite.svg");
const atomBombIcon = assetUrl("images/NukeIconWhite.svg");
const portIcon = assetUrl("images/PortIcon.svg");
const shieldIcon = assetUrl("images/ShieldIconWhite.svg");

export interface BuildItemDisplay {
  unitType: PlayerBuildableUnitType;
  icon?: string;
  label?: string;
  description?: string;
  key?: string;
  countable?: boolean;
}

export const buildTable: BuildItemDisplay[][] = [
  [
    {
      unitType: UnitType.AtomBomb,
      icon: atomBombIcon,
      description: "build_menu.desc.atom_bomb",
      key: "unit_type.atom_bomb",
      countable: false,
    },
    {
      unitType: UnitType.MIRV,
      icon: mirvIcon,
      description: "build_menu.desc.mirv",
      key: "unit_type.mirv",
      countable: false,
    },
    {
      unitType: UnitType.HydrogenBomb,
      icon: hydrogenBombIcon,
      description: "build_menu.desc.hydrogen_bomb",
      key: "unit_type.hydrogen_bomb",
      countable: false,
    },
    {
      unitType: UnitType.Warship,
      icon: warshipIcon,
      description: "build_menu.desc.warship",
      key: "unit_type.warship",
      countable: true,
    },
    {
      unitType: UnitType.Port,
      icon: portIcon,
      description: "build_menu.desc.port",
      key: "unit_type.port",
      countable: true,
    },
    {
      unitType: UnitType.RailStation,
      label: "R",
      description: "build_menu.desc.rail_station",
      key: "unit_type.rail_station",
      countable: true,
    },
    {
      unitType: UnitType.Silo,
      label: "S",
      description: "build_menu.desc.silo",
      key: "unit_type.silo",
      countable: true,
    },
    {
      unitType: UnitType.DefensePost,
      icon: shieldIcon,
      description: "build_menu.desc.defense_post",
      key: "unit_type.defense_post",
      countable: true,
    },
    {
      unitType: UnitType.City,
      icon: cityIcon,
      description: "build_menu.desc.city",
      key: "unit_type.city",
      countable: true,
    },
    {
      unitType: UnitType.Factory,
      icon: factoryIcon,
      description: "build_menu.desc.factory",
      key: "unit_type.factory",
      countable: true,
    },
  ],
];

export const flattenedBuildTable = buildTable.flat();

@customElement("build-menu")
export class BuildMenu extends LitElement implements Controller {
  public game: GameView;
  public eventBus: EventBus;
  public uiState: UIState;
  private clickedTile: TileRef;
  public playerBuildables: BuildableUnit[] | null = null;
  private filteredBuildTable: BuildItemDisplay[][] = buildTable;
  public transformHandler: TransformHandler;

  init() {
    this.eventBus.on(ShowBuildMenuEvent, (e) => {
      if (!this.game.myPlayer()?.isAlive()) {
        return;
      }
      if (!this._hidden) {
        // Players sometimes hold control while building a unit,
        // so if the menu is already open, ignore the event.
        return;
      }
      const clickedCell = this.transformHandler.screenToWorldCoordinates(
        e.x,
        e.y,
      );
      if (!this.game.isValidCoord(clickedCell.x, clickedCell.y)) {
        return;
      }
      const tile = this.game.ref(clickedCell.x, clickedCell.y);
      this.showMenu(tile);
    });
    this.eventBus.on(CloseViewEvent, () => this.hideMenu());
    this.eventBus.on(ShowEmojiMenuEvent, () => this.hideMenu());
    this.eventBus.on(MouseDownEvent, () => this.hideMenu());
  }

  tick() {
    if (!this._hidden) {
      this.refresh();
    }
  }

  static styles = css`
    :host {
      display: block;
    }
    .build-menu {
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      z-index: 9999;
      background-color: #1e1e1e;
      padding: 15px;
      box-shadow: 0 0 20px rgba(0, 0, 0, 0.5);
      border-radius: 10px;
      display: flex;
      flex-direction: column;
      align-items: center;
      max-width: 95vw;
      max-height: 95vh;
      overflow-y: auto;
    }
    .build-description {
      font-size: 0.6rem;
    }
    .letter-icon {
      width: 40px;
      height: 40px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: 28px;
      font-weight: 800;
      line-height: 1;
    }
    .build-row {
      display: flex;
      justify-content: center;
      flex-wrap: wrap;
      width: 100%;
    }
    hud-button.build-button {
      position: relative;
      margin: 8px;
    }
    hud-button.build-button::part(button) {
      width: 120px;
      height: 140px;
      border: 2px solid #444;
      background-color: #2c2c2c;
      color: white;
      border-radius: 12px;
      cursor: pointer;
      transition: all 0.3s ease;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      padding: 10px;
      gap: 5px;
    }
    hud-button.build-button:not([disabled]):hover::part(button) {
      background-color: #3a3a3a;
      transform: scale(1.05);
      border-color: #666;
    }
    hud-button.build-button:not([disabled]):active::part(button) {
      background-color: #4a4a4a;
      transform: scale(0.95);
    }
    hud-button.build-button[disabled]::part(button) {
      background-color: #1a1a1a;
      border-color: #333;
      cursor: not-allowed;
      opacity: 0.7;
    }
    hud-button.build-button[disabled] hud-mask-icon {
      opacity: 0.5;
    }
    hud-button.build-button[disabled] .build-cost {
      color: #ff4444;
    }
    .build-icon {
      font-size: 40px;
      margin-bottom: 5px;
    }
    .build-name {
      font-size: 14px;
      font-weight: bold;
      margin-bottom: 5px;
      text-align: center;
    }
    .build-cost {
      font-size: 14px;
    }
    .hidden {
      display: none !important;
    }
    .build-count-chip {
      position: absolute;
      top: -10px;
      right: -10px;
      background-color: #2c2c2c;
      color: white;
      padding: 2px 10px;
      border-radius: 10000px;
      transition: all 0.3s ease;
      font-size: 12px;
      display: flex;
      justify-content: center;
      align-content: center;
      border: 1px solid #444;
    }
    hud-button.build-button:not([disabled]):hover > .build-count-chip {
      background-color: #3a3a3a;
      border-color: #666;
    }
    hud-button.build-button:not([disabled]):active > .build-count-chip {
      background-color: #4a4a4a;
    }
    hud-button.build-button[disabled] > .build-count-chip {
      background-color: #1a1a1a;
      border-color: #333;
      cursor: not-allowed;
    }
    .build-count {
      font-weight: bold;
      font-size: 14px;
    }

    @media (max-width: 768px) {
      .build-menu {
        padding: 10px;
        max-height: 80vh;
        width: 80vw;
      }
      hud-button.build-button::part(button) {
        width: 140px;
        height: 120px;
        padding: 6px;
        gap: 5px;
      }
      hud-button.build-button {
        margin: 4px;
      }
      .build-icon {
        font-size: 28px;
      }
      .build-name {
        font-size: 12px;
        margin-bottom: 3px;
      }
      .build-cost {
        font-size: 11px;
      }
      .build-count {
        font-weight: bold;
        font-size: 10px;
      }
      .build-count-chip {
        padding: 1px 5px;
      }
    }

    @media (max-width: 480px) {
      .build-menu {
        padding: 8px;
        max-height: 70vh;
      }
      hud-button.build-button::part(button) {
        width: calc(50% - 6px);
        height: 100px;
        padding: 4px;
        border-width: 1px;
      }
      hud-button.build-button {
        margin: 3px;
      }
      .build-icon {
        font-size: 24px;
      }
      .build-name {
        font-size: 10px;
        margin-bottom: 2px;
      }
      .build-cost {
        font-size: 9px;
      }
      .build-count {
        font-weight: bold;
        font-size: 8px;
      }
      .build-count-chip {
        padding: 0 3px;
      }
      hud-button.build-button hud-mask-icon {
        --hud-mask-icon-size: 24px;
      }
      .build-cost img {
        width: 10px;
        height: 10px;
      }
    }
  `;

  @state()
  private _hidden = true;

  public canBuildOrUpgrade(item: BuildItemDisplay): boolean {
    if (this.game?.myPlayer() === null || this.playerBuildables === null) {
      return false;
    }
    const unit = this.playerBuildables.find((u) => u.type === item.unitType);
    return unit ? unit.canBuild !== false || unit.canUpgrade !== false : false;
  }

  public cost(item: BuildItemDisplay): Gold {
    for (const bu of this.playerBuildables ?? []) {
      if (bu.type === item.unitType) {
        return bu.cost;
      }
    }
    return 0n;
  }

  public resourceCost(item: BuildItemDisplay): ResourceStockpile {
    for (const bu of this.playerBuildables ?? []) {
      if (bu.type === item.unitType) {
        return bu.resourceCost;
      }
    }
    return createZeroResources();
  }

  public count(item: BuildItemDisplay): string {
    const player = this.game?.myPlayer();
    if (!player) {
      return "?";
    }

    return player.totalUnitLevels(item.unitType).toString();
  }

  public sendBuildOrUpgrade(buildableUnit: BuildableUnit, tile: TileRef): void {
    if (buildableUnit.canUpgrade !== false) {
      this.eventBus.emit(
        new SendUpgradeStructureIntentEvent(
          buildableUnit.canUpgrade,
          buildableUnit.type,
        ),
      );
    } else if (buildableUnit.canBuild) {
      const rocketDirectionUp =
        buildableUnit.type === UnitType.AtomBomb ||
        buildableUnit.type === UnitType.HydrogenBomb
          ? this.uiState.rocketDirectionUp
          : undefined;
      this.eventBus.emit(
        new BuildUnitIntentEvent(buildableUnit.type, tile, rocketDirectionUp),
      );
    }
    this.hideMenu();
  }

  render() {
    return html`
      <hud-surface
        class="build-menu ${this._hidden ? "hidden" : ""}"
        style="--hud-surface-bg: #1e1e1e; --hud-radius: 10px; --hud-surface-body-padding: 0;"
        @contextmenu=${(e: MouseEvent) => e.preventDefault()}
      >
        <hud-surface-body style="--hud-surface-body-padding: 0;">
          ${this.filteredBuildTable.map(
            (row) => html`
              <div class="build-row">
                ${row.map((item) => {
                  const buildableUnit = this.playerBuildables?.find(
                    (bu) => bu.type === item.unitType,
                  );
                  if (buildableUnit === undefined) {
                    return html``;
                  }
                  const enabled =
                    buildableUnit.canBuild !== false ||
                    buildableUnit.canUpgrade !== false;
                  return html`
                    <hud-button
                      class="build-button"
                      @click=${() =>
                        this.sendBuildOrUpgrade(
                          buildableUnit,
                          this.clickedTile,
                        )}
                      ?disabled=${!enabled}
                      title=${!enabled
                        ? translateText("build_menu.not_enough_money")
                        : ""}
                    >
                      ${item.icon
                        ? html`<hud-mask-icon
                            .src=${item.icon}
                            size="h-[40px]"
                          ></hud-mask-icon>`
                        : html`<span class="letter-icon" aria-hidden="true"
                            >${item.label}</span
                          >`}
                      <span class="build-name"
                        >${item.key && translateText(item.key)}</span
                      >
                      <span class="build-description"
                        >${item.description &&
                        translateText(item.description)}</span
                      >
                      <span class="build-cost" translate="no">
                        ${this.game && this.game.myPlayer()
                          ? renderResourceCostText(this.resourceCost(item))
                          : renderNumber(0)}
                      </span>
                      ${item.countable
                        ? html`<div class="build-count-chip">
                            <span class="build-count">${this.count(item)}</span>
                          </div>`
                        : ""}
                    </hud-button>
                  `;
                })}
              </div>
            `,
          )}
        </hud-surface-body>
      </hud-surface>
    `;
  }

  hideMenu() {
    this._hidden = true;
    this.requestUpdate();
  }

  showMenu(clickedTile: TileRef) {
    this.clickedTile = clickedTile;
    this._hidden = false;
    this.refresh();
  }

  private refresh() {
    this.game
      .myPlayer()
      ?.buildables(this.clickedTile, BuildMenus.types)
      .then((buildables) => {
        this.playerBuildables = buildables;
        this.requestUpdate();
      });

    // remove disabled buildings from the buildtable
    this.filteredBuildTable = this.getBuildableUnits();
  }

  private getBuildableUnits(): BuildItemDisplay[][] {
    return buildTable.map((row) =>
      row.filter((item) => !this.game?.config()?.isUnitDisabled(item.unitType)),
    );
  }

  get isVisible() {
    return !this._hidden;
  }
}

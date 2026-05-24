import { html, LitElement } from "lit";
import { customElement } from "lit/decorators.js";
import { assetUrl } from "../../../core/AssetUrls";
import { EventBus } from "../../../core/EventBus";
import {
  BuildableUnit,
  PlayerBuildableUnitType,
  UnitType,
} from "../../../core/game/Game";
import { GameView } from "../../../core/game/GameView";
import {
  createZeroResources,
  ResourceStockpile,
} from "../../../core/game/Resources";
import { UserSettings } from "../../../core/game/UserSettings";
import { Controller } from "../../Controller";
import { ToggleStructureEvent } from "../../InputHandler";
import { UIState } from "../../UIState";
import { translateText } from "../../Utils";
import { renderResourceCostText } from "../ResourceDisplay";
import "../ui/HudComponents";
import {
  HUD_BUILD_STRIP,
  HUD_TOOLTIP,
  HUD_TOOLTIP_TITLE,
} from "../ui/HudTheme";
const warshipIcon = assetUrl("images/BattleshipIconWhite.svg");
const cityIcon = assetUrl("images/CityIconWhite.svg");
const factoryIcon = assetUrl("images/FactoryIconWhite.svg");
const mirvIcon = assetUrl("images/MIRVIcon.svg");
const hydrogenBombIcon = assetUrl("images/MushroomCloudIconWhite.svg");
const atomBombIcon = assetUrl("images/NukeIconWhite.svg");
const portIcon = assetUrl("images/PortIcon.svg");
const defensePostIcon = assetUrl("images/ShieldIconWhite.svg");

const visibleBuildTypes: PlayerBuildableUnitType[] = [
  UnitType.City,
  UnitType.Factory,
  UnitType.Port,
  UnitType.DefensePost,
  UnitType.RailStation,
  UnitType.Silo,
  UnitType.Warship,
  UnitType.AtomBomb,
  UnitType.HydrogenBomb,
  UnitType.MIRV,
];

@customElement("unit-display")
export class UnitDisplay extends LitElement implements Controller {
  public game: GameView;
  public eventBus: EventBus;
  public uiState: UIState;
  private playerBuildables: BuildableUnit[] | null = null;
  private keybinds: Record<string, { value: string; key: string }> = {};
  private _cities = 0;
  private _warships = 0;
  private _factories = 0;
  private _railStations = 0;
  private _port = 0;
  private _defensePost = 0;
  private _silos = 0;
  private allDisabled = false;
  private _hoveredUnit: PlayerBuildableUnitType | null = null;

  createRenderRoot() {
    return this;
  }

  init() {
    const config = this.game.config();
    const userSettings = new UserSettings();

    this.keybinds = userSettings.parsedUserKeybinds();

    this.allDisabled = visibleBuildTypes.every((u) => config.isUnitDisabled(u));
    this.requestUpdate();
  }

  private resourceCost(item: UnitType): ResourceStockpile {
    for (const bu of this.playerBuildables ?? []) {
      if (bu.type === item) {
        return bu.resourceCost;
      }
    }
    return createZeroResources();
  }

  private canAfford(item: UnitType): boolean {
    const player = this.game?.myPlayer();
    if (!player) return false;
    const resources = player.resources();
    const cost = this.resourceCost(item);
    return (
      resources.food >= cost.food &&
      resources.energy >= cost.energy &&
      resources.materials >= cost.materials
    );
  }

  private canBuild(item: UnitType): boolean {
    if (this.game?.config().isUnitDisabled(item)) return false;
    const player = this.game?.myPlayer();
    switch (item) {
      case UnitType.AtomBomb:
      case UnitType.HydrogenBomb:
      case UnitType.MIRV:
        return (
          this.canAfford(item) &&
          (player?.units(UnitType.MissileSilo).length ?? 0) > 0
        );
      case UnitType.Warship:
        return (
          this.canAfford(item) && (player?.units(UnitType.Port).length ?? 0) > 0
        );
      default:
        return this.canAfford(item);
    }
  }

  tick() {
    const player = this.game?.myPlayer();
    if (!player) return;
    player.buildables(undefined, visibleBuildTypes).then((buildables) => {
      this.playerBuildables = buildables;
    });
    this._cities = player.totalUnitLevels(UnitType.City);
    this._railStations = player.totalUnitLevels(UnitType.RailStation);
    this._port = player.totalUnitLevels(UnitType.Port);
    this._defensePost = player.totalUnitLevels(UnitType.DefensePost);
    this._silos = player.totalUnitLevels(UnitType.Silo);
    this._factories = player.totalUnitLevels(UnitType.Factory);
    this._warships = player.totalUnitLevels(UnitType.Warship);
    this.requestUpdate();
  }

  render() {
    const myPlayer = this.game?.myPlayer();
    if (
      !this.game ||
      !myPlayer ||
      this.game.inSpawnPhase() ||
      !myPlayer.isAlive()
    ) {
      return null;
    }
    if (this.allDisabled) {
      return null;
    }

    return html`
      <div class="border-t border-white/10 p-0.5 w-full">
        <div class="${HUD_BUILD_STRIP} mx-auto">
          ${this.renderUnitItem(
            cityIcon,
            this._cities,
            UnitType.City,
            "city",
            this.keybinds["buildCity"]?.key ?? "1",
          )}
          ${this.renderUnitItem(
            factoryIcon,
            this._factories,
            UnitType.Factory,
            "factory",
            this.keybinds["buildFactory"]?.key ?? "2",
          )}
          ${this.renderUnitItem(
            portIcon,
            this._port,
            UnitType.Port,
            "port",
            this.keybinds["buildPort"]?.key ?? "3",
          )}
          ${this.renderUnitItem(
            defensePostIcon,
            this._defensePost,
            UnitType.DefensePost,
            "defense_post",
            this.keybinds["buildDefensePost"]?.key ?? "4",
          )}
          ${this.renderUnitItem(
            null,
            this._railStations,
            UnitType.RailStation,
            "rail_station",
            this.keybinds["buildRailStation"]?.key ?? "5",
            "R",
          )}
          ${this.renderUnitItem(
            null,
            this._silos,
            UnitType.Silo,
            "silo",
            this.keybinds["buildSilo"]?.key ?? "6",
            "S",
          )}
          ${this.renderUnitItem(
            warshipIcon,
            this._warships,
            UnitType.Warship,
            "warship",
            this.keybinds["buildWarship"]?.key ?? "7",
          )}
          ${this.renderUnitItem(
            atomBombIcon,
            null,
            UnitType.AtomBomb,
            "atom_bomb",
            this.keybinds["buildAtomBomb"]?.key ?? "8",
          )}
          ${this.renderUnitItem(
            hydrogenBombIcon,
            null,
            UnitType.HydrogenBomb,
            "hydrogen_bomb",
            this.keybinds["buildHydrogenBomb"]?.key ?? "9",
          )}
          ${this.renderUnitItem(
            mirvIcon,
            null,
            UnitType.MIRV,
            "mirv",
            this.keybinds["buildMIRV"]?.key ?? "0",
          )}
        </div>
      </div>
    `;
  }

  private renderUnitItem(
    icon: string | null,
    number: number | null,
    unitType: PlayerBuildableUnitType,
    structureKey: string,
    hotkey: string,
    label?: string,
  ) {
    if (this.game.config().isUnitDisabled(unitType)) {
      return html``;
    }
    const selected = this.uiState.ghostStructure === unitType;
    const hovered = this._hoveredUnit === unitType;
    const displayHotkey = hotkey
      .replace("Digit", "")
      .replace("Key", "")
      .toUpperCase();

    return html`
      <div
        class="flex flex-col items-center relative"
        @mouseenter=${() => {
          this._hoveredUnit = unitType;
          this.requestUpdate();
        }}
        @mouseleave=${() => {
          this._hoveredUnit = null;
          this.requestUpdate();
        }}
      >
        ${hovered
          ? html`
              <div
                class="${HUD_TOOLTIP} absolute bottom-full left-1/2 -translate-x-1/2 mb-1 z-[100] pointer-events-none"
              >
                <div class="${HUD_TOOLTIP_TITLE}">
                  ${translateText(
                    "unit_type." + structureKey,
                  )}${` [${displayHotkey}]`}
                </div>
                <div class="p-2">
                  ${translateText("build_menu.desc." + structureKey)}
                </div>
                ${unitType === UnitType.Warship
                  ? html`<div
                      class="mt-1 px-2 py-1 text-[10px] text-cyan-300 border-t border-white/10"
                    >
                      ⇧ ${translateText("build_menu.warship_shift_hint")}
                    </div>`
                  : null}
                <div class="flex items-center justify-center gap-1">
                  <span class="text-yellow-300"
                    >${renderResourceCostText(
                      this.resourceCost(unitType),
                    )}</span
                  >
                </div>
              </div>
            `
          : null}
        <hud-build-item
          hotkey=${displayHotkey}
          icon-src=${icon ?? ""}
          fallback=${label}
          count=${number ?? ""}
          ?selected=${selected}
          ?disabled=${!this.canBuild(unitType)}
          @click=${() => {
            if (selected) {
              this.uiState.ghostStructure = null;
            } else if (this.canBuild(unitType)) {
              this.uiState.ghostStructure = unitType;
            }
            this.requestUpdate();
          }}
          @mouseenter=${() => {
            switch (unitType) {
              case UnitType.AtomBomb:
              case UnitType.HydrogenBomb:
                this.eventBus?.emit(
                  new ToggleStructureEvent([
                    UnitType.MissileSilo,
                    UnitType.SAMLauncher,
                  ]),
                );
                break;
              case UnitType.Warship:
                this.eventBus?.emit(new ToggleStructureEvent([UnitType.Port]));
                break;
              default:
                this.eventBus?.emit(new ToggleStructureEvent([unitType]));
            }
          }}
          @mouseleave=${() =>
            this.eventBus?.emit(new ToggleStructureEvent(null))}
        ></hud-build-item>
      </div>
    `;
  }
}

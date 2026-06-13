import { html, LitElement } from "lit";
import { customElement } from "lit/decorators.js";
import { EventBus } from "../../../core/EventBus";
import {
  BuildableUnit,
  BuildMenus,
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
import { BuildItemDisplay, flattenedBuildTable } from "./BuildMenu";

export interface BuildBarConfig {
  isUnitDisabled(unitType: PlayerBuildableUnitType): boolean;
}

const farmlandBuildItem: BuildItemDisplay = {
  unitType: UnitType.Farmland,
  label: "F",
  description: "build_menu.desc.farmland",
  key: "unit_type.farmland",
  countable: true,
};

export function buildBarItems(config: BuildBarConfig): BuildItemDisplay[] {
  const menuItems = flattenedBuildTable.filter(
    (item) =>
      BuildMenus.has(item.unitType) && !config.isUnitDisabled(item.unitType),
  );
  if (config.isUnitDisabled(UnitType.Farmland)) {
    return menuItems;
  }
  return [...menuItems, farmlandBuildItem];
}

function buildKeybindKey(
  unitType: PlayerBuildableUnitType,
): string | undefined {
  switch (unitType) {
    case UnitType.City:
      return "buildCity";
    case UnitType.Factory:
      return "buildFactory";
    case UnitType.Port:
      return "buildPort";
    case UnitType.DefensePost:
      return "buildDefensePost";
    case UnitType.RailStation:
      return "buildRailStation";
    case UnitType.Silo:
      return "buildSilo";
    case UnitType.Warship:
      return "buildWarship";
    case UnitType.AtomBomb:
      return "buildAtomBomb";
    case UnitType.HydrogenBomb:
      return "buildHydrogenBomb";
    case UnitType.MIRV:
      return "buildMIRV";
    default:
      return undefined;
  }
}

function buildFallbackLabel(item: BuildItemDisplay): string {
  if (item.label) {
    return item.label;
  }
  return item.key ? translateText(item.key).slice(0, 1).toUpperCase() : "?";
}

function displayHotkey(value: string | undefined): string {
  return (value ?? "").replace("Digit", "").replace("Key", "").toUpperCase();
}

@customElement("build-bar")
export class BuildBar extends LitElement implements Controller {
  public game: GameView;
  public eventBus: EventBus;
  public uiState: UIState;

  private playerBuildables: BuildableUnit[] | null = null;
  private keybinds: Record<string, { value: string; key: string }> = {};
  private hoveredUnit: PlayerBuildableUnitType | null = null;

  createRenderRoot() {
    return this;
  }

  init() {
    this.keybinds = new UserSettings().parsedUserKeybinds();
    this.requestUpdate();
  }

  tick() {
    const player = this.game?.myPlayer();
    if (!player) {
      return;
    }

    const itemTypes = buildBarItems(this.game.config()).map(
      (item) => item.unitType,
    );
    if (itemTypes.length === 0) {
      return;
    }

    player.buildables(undefined, itemTypes).then((buildables) => {
      this.playerBuildables = buildables;
      this.requestUpdate();
    });
  }

  render() {
    const player = this.game?.myPlayer();
    if (
      !this.game ||
      !player ||
      this.game.inSpawnPhase() ||
      !player.isAlive()
    ) {
      return null;
    }

    const items = buildBarItems(this.game.config());
    if (items.length === 0) {
      return null;
    }

    return html`
      <hud-unit-display
        data-build-bar
        @pointerdown=${this.stopHudEvent}
        @mousedown=${this.stopHudEvent}
        @click=${this.stopHudEvent}
        @contextmenu=${this.stopHudEvent}
      >
        ${items.map((item) => this.renderBuildButton(item))}
      </hud-unit-display>
    `;
  }

  private renderBuildButton(item: BuildItemDisplay) {
    const unitType = item.unitType;
    const selected = this.uiState?.ghostStructure === unitType;
    const hovered = this.hoveredUnit === unitType;
    const keybindKey = buildKeybindKey(unitType);
    const hotkey = displayHotkey(
      keybindKey ? this.keybinds[keybindKey]?.key : undefined,
    );
    const count = item.countable ? this.count(unitType).toString() : "";

    return html`
      <hud-unit-button
        data-build-unit=${unitType}
        hotkey=${hotkey}
        icon-src=${item.icon ?? ""}
        .fallback=${buildFallbackLabel(item)}
        count=${count}
        ?selected=${selected}
        ?disabled=${!this.canSelect(unitType)}
        @click=${(event: Event) => this.selectUnit(event, unitType)}
        @mouseenter=${() => this.onHover(unitType)}
        @mouseleave=${() => this.onLeave()}
      >
        ${hovered
          ? html`
              <hud-tooltip
                slot="tooltip"
                .title=${`${item.key ? translateText(item.key) : unitType} ${
                  hotkey ? `[${hotkey}]` : ""
                }`}
              >
                <hud-label style="display: block; padding: 8px">
                  ${item.description ? translateText(item.description) : ""}
                </hud-label>
                <hud-kit-row style="justify-content: center">
                  <hud-label tone="gold">
                    ${renderResourceCostText(this.resourceCost(unitType))}
                  </hud-label>
                </hud-kit-row>
              </hud-tooltip>
            `
          : null}
      </hud-unit-button>
    `;
  }

  private selectUnit(event: Event, unitType: PlayerBuildableUnitType) {
    this.stopHudEvent(event);
    if (!this.canSelect(unitType)) {
      return;
    }
    this.uiState.ghostStructure =
      this.uiState.ghostStructure === unitType ? null : unitType;
    this.requestUpdate();
  }

  private onHover(unitType: PlayerBuildableUnitType) {
    this.hoveredUnit = unitType;
    this.requestUpdate();

    if (unitType === UnitType.AtomBomb || unitType === UnitType.HydrogenBomb) {
      this.eventBus?.emit(
        new ToggleStructureEvent([UnitType.MissileSilo, UnitType.SAMLauncher]),
      );
    } else if (unitType === UnitType.Warship) {
      this.eventBus?.emit(new ToggleStructureEvent([UnitType.Port]));
    } else {
      this.eventBus?.emit(new ToggleStructureEvent([unitType]));
    }
  }

  private onLeave() {
    this.hoveredUnit = null;
    this.requestUpdate();
    this.eventBus?.emit(new ToggleStructureEvent(null));
  }

  private canSelect(unitType: PlayerBuildableUnitType): boolean {
    if (!this.game || this.game.config().isUnitDisabled(unitType)) {
      return false;
    }
    const player = this.game.myPlayer();
    if (!player || !player.isAlive() || this.game.inSpawnPhase()) {
      return false;
    }
    if (!this.canAfford(unitType)) {
      return false;
    }
    if (
      unitType === UnitType.AtomBomb ||
      unitType === UnitType.HydrogenBomb ||
      unitType === UnitType.MIRV
    ) {
      return player.units(UnitType.MissileSilo).length > 0;
    }
    if (unitType === UnitType.Warship) {
      return player.units(UnitType.Port).length > 0;
    }
    return true;
  }

  private canAfford(unitType: PlayerBuildableUnitType): boolean {
    const player = this.game?.myPlayer();
    if (!player) return false;
    const resources = player.resources();
    const cost = this.resourceCost(unitType);
    return (
      resources.food >= cost.food &&
      resources.energy >= cost.energy &&
      resources.materials >= cost.materials
    );
  }

  private resourceCost(unitType: PlayerBuildableUnitType): ResourceStockpile {
    for (const buildable of this.playerBuildables ?? []) {
      if (buildable.type === unitType) {
        return buildable.resourceCost;
      }
    }
    return createZeroResources();
  }

  private count(unitType: PlayerBuildableUnitType): number {
    return this.game?.myPlayer()?.totalUnitLevels(unitType) ?? 0;
  }

  private stopHudEvent(event: Event) {
    event.preventDefault();
    event.stopPropagation();
  }
}

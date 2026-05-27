import { css, html, LitElement, svg, type TemplateResult } from "lit";
import { customElement, state } from "lit/decorators.js";
import {
  createWarBattleState,
  DEFAULT_WAR_BATTLE_PARAMS,
  evaluateWarBattleTick,
  startWarBattleAttack,
  type TerrainProfile,
  type WarBattleParams,
  type WarBattleSideState,
  type WarBattleState,
  type WarBattleTickResult,
} from "../../core/systems/models/WarBattleSystem";
import "../hud/ui";
import type {
  HudSegmentedItem,
  HudSelectOption,
} from "../hud/ui/HudComponents";

type Side = "attacker" | "defender";
type SideKey = keyof WarBattleSideState;
type ParamKey = keyof WarBattleParams;
type MechanicsTab = ParamControl["section"] | "growth";

interface SideControl {
  side: Side;
  key: SideKey;
  label: string;
  description: string;
  min: number;
  max: number;
  step: number;
}

interface ParamControl {
  key: ParamKey;
  section: "combat" | "upkeep" | "production" | "devastation" | "conquest";
  label: string;
  description: string;
  min: number;
  max: number;
  step: number;
}

interface BattleFrame {
  tick: number;
  attackerTroops: number;
  attackerTroopGrowth: number;
  attackerTroopCapacity: number;
  activeAttackers: number;
  activeAttackerPush: number;
  activeDefenderPush: number;
  defenderTroops: number;
  defenderTroopGrowth: number;
  defenderTroopCapacity: number;
  defenderTiles: number;
  attackerTiles: number;
  attackerFood: number;
  attackerEnergy: number;
  attackerMaterials: number;
  defenderFood: number;
  defenderEnergy: number;
  defenderMaterials: number;
  attackerSupply: number;
  defenderSupply: number;
  combatIntensity: number;
  tilesCaptured: number;
  attackerLosses: number;
  defenderLosses: number;
  attackerDevastation: number;
  devastation: number;
}

interface SeriesPoint {
  x: number;
  y: number;
}

interface TroopGrowthParams {
  readonly growthRate: number;
  readonly maxTroopsPerTile: number;
}

interface PersistedWarBattleSandboxState {
  readonly version: 1;
  readonly battle: WarBattleState;
  readonly params: WarBattleParams;
  readonly troopGrowthParams: TroopGrowthParams;
  readonly troopGrowthMultipliers: Record<Side, number>;
  readonly pushCommitments: Record<Side, number>;
  readonly activeMechanicsTab: MechanicsTab;
  readonly activePushSide: Side | null;
  readonly attackerDevastation: number;
  readonly tick: number;
}

const HISTORY_LIMIT = 500;
const STEP_INTERVAL_MS = 120;
const STORAGE_KEY = "openfront.warBattleSandbox.v1";

const DEFAULT_ATTACKER: WarBattleSideState = {
  troops: 50_000,
  food: 20_000,
  energy: 10_000,
  materials: 15_000,
  tiles: 2_500,
};

const DEFAULT_DEFENDER: WarBattleSideState = {
  troops: 40_000,
  food: 20_000,
  energy: 10_000,
  materials: 15_000,
  tiles: 2_500,
};

const DEFAULT_TROOP_GROWTH_PARAMS: TroopGrowthParams = {
  growthRate: 0.016,
  maxTroopsPerTile: 40,
};

const terrainOptions: HudSelectOption[] = [
  { value: "plains", label: "Plains" },
  { value: "highland", label: "Highland" },
  { value: "mountain", label: "Mountain" },
];

const mechanicsTabItems: HudSegmentedItem[] = [
  { id: "growth", label: "Growth", value: "troops" },
  { id: "combat", label: "Combat", value: "front" },
  { id: "upkeep", label: "Upkeep", value: "supply" },
  { id: "production", label: "Production", value: "econ" },
  { id: "devastation", label: "Devastation", value: "damage" },
  { id: "conquest", label: "Conquest", value: "spoils" },
];

const sideControls: SideControl[] = [
  {
    side: "attacker",
    key: "troops",
    label: "Left troops",
    description:
      "Left-side home troops not currently active. Pushing right moves committed troops out of this stock.",
    min: 0,
    max: 500_000,
    step: 100,
  },
  {
    side: "attacker",
    key: "food",
    label: "Left food",
    description: "Food stock available for left-side war upkeep.",
    min: 0,
    max: 500_000,
    step: 100,
  },
  {
    side: "attacker",
    key: "energy",
    label: "Left energy",
    description: "Energy/fuel stock available for left-side operational tempo.",
    min: 0,
    max: 500_000,
    step: 100,
  },
  {
    side: "attacker",
    key: "materials",
    label: "Left materials",
    description: "Materials/ammo stock consumed by left-side combat pressure.",
    min: 0,
    max: 500_000,
    step: 100,
  },
  {
    side: "attacker",
    key: "tiles",
    label: "Left tiles",
    description: "Left-side territory. Production scales from this stock.",
    min: 0,
    max: 1_000_000,
    step: 100,
  },
  {
    side: "defender",
    key: "troops",
    label: "Right troops",
    description:
      "Right-side home troop stock. Pushing left moves committed troops out of this stock.",
    min: 0,
    max: 500_000,
    step: 100,
  },
  {
    side: "defender",
    key: "food",
    label: "Right food",
    description: "Food stock available for right-side war upkeep.",
    min: 0,
    max: 500_000,
    step: 100,
  },
  {
    side: "defender",
    key: "energy",
    label: "Right energy",
    description: "Energy/fuel stock available for right-side operations.",
    min: 0,
    max: 500_000,
    step: 100,
  },
  {
    side: "defender",
    key: "materials",
    label: "Right materials",
    description: "Materials/ammo stock consumed by right-side combat pressure.",
    min: 0,
    max: 500_000,
    step: 100,
  },
  {
    side: "defender",
    key: "tiles",
    label: "Right tiles",
    description: "Right-side territory. Production scales from this stock.",
    min: 0,
    max: 1_000_000,
    step: 100,
  },
];

const paramControls: ParamControl[] = [
  {
    key: "borderWidth",
    section: "combat",
    label: "Border width",
    description:
      "Abstract front width. Wider borders allow the current attack formula to process more tile pressure per tick.",
    min: 1,
    max: 200,
    step: 1,
  },
  {
    key: "defenseMobilizationResponse",
    section: "combat",
    label: "Defense response",
    description:
      "How many defenders are economically mobilized per active attacker before the defender cap is applied.",
    min: 0,
    max: 3,
    step: 0.05,
  },
  {
    key: "maxDefensiveMobilizationFraction",
    section: "combat",
    label: "Max defense mobilized",
    description:
      "Maximum share of defender troops that can be charged defensive upkeep during a tick.",
    min: 0,
    max: 1,
    step: 0.01,
  },
  {
    key: "warUpkeepScalePer1000Troops",
    section: "upkeep",
    label: "Upkeep scale",
    description:
      "Global resource-unit scale applied to every per-1,000-troops upkeep coefficient.",
    min: 0,
    max: 100,
    step: 0.5,
  },
  {
    key: "attackerFoodCost",
    section: "upkeep",
    label: "Atk food / 1K",
    description:
      "Attacker food coefficient per 1,000 active soldiers before the upkeep scale.",
    min: 0,
    max: 10,
    step: 0.05,
  },
  {
    key: "attackerEnergyCost",
    section: "upkeep",
    label: "Atk energy / 1K",
    description:
      "Attacker energy coefficient per 1,000 active soldiers, multiplied by combat intensity.",
    min: 0,
    max: 10,
    step: 0.05,
  },
  {
    key: "attackerMaterialsCost",
    section: "upkeep",
    label: "Atk materials / 1K",
    description:
      "Attacker materials/ammo coefficient per 1,000 active soldiers, multiplied by combat intensity.",
    min: 0,
    max: 10,
    step: 0.05,
  },
  {
    key: "defenderFoodCost",
    section: "upkeep",
    label: "Def food / 1K",
    description:
      "Defender food coefficient. The default is cheaper than attacking.",
    min: 0,
    max: 10,
    step: 0.05,
  },
  {
    key: "defenderEnergyCost",
    section: "upkeep",
    label: "Def energy / 1K",
    description:
      "Defender energy coefficient. The default is cheaper than attacking because there is no power projection.",
    min: 0,
    max: 10,
    step: 0.05,
  },
  {
    key: "defenderMaterialsCost",
    section: "upkeep",
    label: "Def materials / 1K",
    description:
      "Defender materials/ammo coefficient. The default gives defense an economic advantage.",
    min: 0,
    max: 10,
    step: 0.05,
  },
  {
    key: "minSupplyMultiplier",
    section: "upkeep",
    label: "Min supply",
    description:
      "Lowest combat multiplier when resources are exhausted. Raise it for forgiving logistics; lower it for sharper collapses.",
    min: 0,
    max: 1,
    step: 0.01,
  },
  {
    key: "attackerFoodProductionPerTile",
    section: "production",
    label: "Atk food / tile",
    description: "Attacker food production per tile per tick.",
    min: 0,
    max: 10,
    step: 0.05,
  },
  {
    key: "attackerEnergyProductionPerTile",
    section: "production",
    label: "Atk energy / tile",
    description: "Attacker energy production per tile per tick.",
    min: 0,
    max: 10,
    step: 0.05,
  },
  {
    key: "attackerMaterialsProductionPerTile",
    section: "production",
    label: "Atk materials / tile",
    description: "Attacker materials production per tile per tick.",
    min: 0,
    max: 10,
    step: 0.05,
  },
  {
    key: "defenderFoodProductionPerTile",
    section: "production",
    label: "Def food / tile",
    description:
      "Defender food production per tile per tick before devastation.",
    min: 0,
    max: 10,
    step: 0.05,
  },
  {
    key: "defenderEnergyProductionPerTile",
    section: "production",
    label: "Def energy / tile",
    description:
      "Defender energy production per tile per tick before devastation.",
    min: 0,
    max: 10,
    step: 0.05,
  },
  {
    key: "defenderMaterialsProductionPerTile",
    section: "production",
    label: "Def materials / tile",
    description:
      "Defender materials production per tile per tick before devastation.",
    min: 0,
    max: 10,
    step: 0.05,
  },
  {
    key: "conqueredTileDevastation",
    section: "devastation",
    label: "Tile devastation",
    description:
      "Devastation added from territory captured as a share of defender starting territory.",
    min: 0,
    max: 2,
    step: 0.01,
  },
  {
    key: "casualtyDevastation",
    section: "devastation",
    label: "Casualty devastation",
    description:
      "Devastation added from casualties as a share of total troops involved.",
    min: 0,
    max: 2,
    step: 0.01,
  },
  {
    key: "devastationRecoveryPerTick",
    section: "devastation",
    label: "Recovery / tick",
    description:
      "Devastation recovery when there is no active fighting. Active fighting does not recover.",
    min: 0,
    max: 0.01,
    step: 0.00001,
  },
  {
    key: "maxDevastation",
    section: "devastation",
    label: "Max devastation",
    description:
      "Maximum production penalty on defender territory from warfare.",
    min: 0,
    max: 1,
    step: 0.01,
  },
  {
    key: "foodCaptureRatio",
    section: "conquest",
    label: "Food captured",
    description: "Share of defender food transferred to attacker on conquest.",
    min: 0,
    max: 1,
    step: 0.01,
  },
  {
    key: "foodDestroyRatio",
    section: "conquest",
    label: "Food destroyed",
    description: "Share of defender food destroyed on conquest.",
    min: 0,
    max: 1,
    step: 0.01,
  },
  {
    key: "energyCaptureRatio",
    section: "conquest",
    label: "Energy captured",
    description: "Share of defender energy transferred on conquest.",
    min: 0,
    max: 1,
    step: 0.01,
  },
  {
    key: "energyDestroyRatio",
    section: "conquest",
    label: "Energy destroyed",
    description: "Share of defender energy destroyed on conquest.",
    min: 0,
    max: 1,
    step: 0.01,
  },
  {
    key: "materialsCaptureRatio",
    section: "conquest",
    label: "Materials captured",
    description: "Share of defender materials transferred on conquest.",
    min: 0,
    max: 1,
    step: 0.01,
  },
  {
    key: "materialsDestroyRatio",
    section: "conquest",
    label: "Materials destroyed",
    description: "Share of defender materials destroyed on conquest.",
    min: 0,
    max: 1,
    step: 0.01,
  },
];

@customElement("war-battle-systems-sandbox")
export class WarBattleSystemsSandbox extends LitElement {
  static styles = css`
    :host {
      min-height: 100vh;
      display: block;
      color: #e7e5df;
      background:
        linear-gradient(135deg, rgba(127, 29, 29, 0.22), transparent 30rem),
        #0b1120;
      font-family:
        Inter,
        ui-sans-serif,
        system-ui,
        -apple-system,
        BlinkMacSystemFont,
        "Segoe UI",
        sans-serif;
    }

    .shell {
      height: 100vh;
      display: grid;
      grid-template-columns:
        minmax(290px, 360px)
        minmax(460px, 1fr)
        minmax(290px, 360px);
      gap: 12px;
      padding: 12px;
      box-sizing: border-box;
      overflow: hidden;
    }

    .side-column,
    .stage {
      display: grid;
      align-content: start;
      gap: 10px;
      min-width: 0;
      min-height: 0;
    }

    .side-column,
    .stage {
      max-height: calc(100vh - 24px);
      overflow: auto;
    }

    .side-column {
      grid-auto-rows: max-content;
    }

    .control-pair {
      display: grid;
      grid-template-columns: minmax(0, 1fr) 92px;
      gap: 6px;
      align-items: center;
    }

    .side-summary {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 6px;
    }

    .side-stat {
      border: 1px solid rgba(148, 163, 184, 0.2);
      border-radius: 4px;
      background: rgba(15, 23, 42, 0.4);
      padding: 6px;
      min-width: 0;
    }

    .side-stat-label {
      color: #94a3b8;
      font-size: 9px;
      font-weight: 700;
      line-height: 1.2;
      text-transform: uppercase;
    }

    .side-stat-value {
      color: #f8fafc;
      font-size: 12px;
      font-weight: 800;
      line-height: 1.3;
      margin-top: 2px;
    }

    .control-label {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      min-width: 0;
    }

    .help {
      position: relative;
      display: inline-grid;
      width: 16px;
      height: 16px;
      flex: 0 0 auto;
      place-items: center;
      border: 1px solid rgba(148, 163, 184, 0.45);
      border-radius: 50%;
      color: #cbd5e1;
      font-size: 10px;
      font-weight: 700;
      line-height: 1;
      cursor: help;
    }

    .help:hover .tip,
    .help:focus .tip {
      display: block;
    }

    .tip {
      position: absolute;
      left: 0;
      bottom: calc(100% + 6px);
      z-index: 10;
      display: none;
      width: min(300px, calc(100vw - 32px));
      border: 1px solid rgba(148, 163, 184, 0.55);
      border-radius: 4px;
      background: rgba(15, 23, 42, 0.96);
      color: #e2e8f0;
      padding: 7px 8px;
      font-size: 11px;
      font-weight: 500;
      line-height: 1.35;
      white-space: normal;
      box-shadow: 0 10px 20px rgba(0, 0, 0, 0.35);
    }

    .summary {
      color: #cbd5e1;
      font-size: 11px;
      line-height: 1.4;
    }

    .graph {
      border: 1px solid rgba(148, 163, 184, 0.24);
      border-radius: 4px;
      background: rgba(15, 23, 42, 0.52);
      padding: 8px;
    }

    .graph-title {
      display: flex;
      align-items: baseline;
      justify-content: space-between;
      gap: 8px;
      color: #f8fafc;
      font-size: 11px;
      font-weight: 700;
    }

    .graph-readout {
      color: #bae6fd;
      font-size: 10px;
      font-weight: 600;
      text-align: right;
    }

    svg.curve {
      display: block;
      width: 100%;
      height: 210px;
      margin-top: 6px;
      overflow: visible;
      touch-action: none;
    }

    .axis,
    .grid,
    .tick,
    .series {
      vector-effect: non-scaling-stroke;
    }

    .axis {
      stroke: rgba(226, 232, 240, 0.82);
      stroke-width: 1.25;
    }

    .grid {
      stroke: rgba(203, 213, 225, 0.28);
      stroke-width: 1.1;
    }

    .tick {
      stroke: rgba(226, 232, 240, 0.75);
      stroke-width: 1.2;
    }

    .series {
      fill: none;
      stroke-width: 2;
    }

    .tick-label {
      fill: #f8fafc;
      font-size: 8.5px;
      font-weight: 650;
    }

    .axis-label {
      fill: #94a3b8;
      font-size: 9px;
    }

    .legend {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
      margin-top: 3px;
      color: #cbd5e1;
      font-size: 10px;
    }

    .legend span::before {
      content: "";
      display: inline-block;
      width: 8px;
      height: 8px;
      margin-right: 4px;
      border-radius: 50%;
      background: var(--dot);
    }

    @media (max-width: 980px) {
      .shell {
        height: auto;
        min-height: 100vh;
        grid-template-columns: 1fr;
        overflow: visible;
      }

      .side-column {
        max-height: none;
        overflow: visible;
      }

      .stage {
        max-height: none;
        overflow: visible;
      }
    }
  `;

  @state() private battle: WarBattleState = createWarBattleState(
    DEFAULT_ATTACKER,
    DEFAULT_DEFENDER,
  );
  @state() private params: WarBattleParams = { ...DEFAULT_WAR_BATTLE_PARAMS };
  @state() private troopGrowthParams: TroopGrowthParams = {
    ...DEFAULT_TROOP_GROWTH_PARAMS,
  };
  @state() private troopGrowthMultipliers: Record<Side, number> = {
    attacker: 1,
    defender: 1,
  };
  @state() private pushCommitments: Record<Side, number> = {
    attacker: 15_000,
    defender: 15_000,
  };
  @state() private activeMechanicsTab: MechanicsTab = "growth";
  @state() private activePushSide: Side | null = null;
  @state() private attackerDevastation = 0;
  @state() private tick = 0;
  @state() private running = false;
  @state() private history: BattleFrame[] = [];
  @state() private lastResult: WarBattleTickResult | null = null;

  private intervalID: number | null = null;

  connectedCallback() {
    super.connectedCallback();
    this.loadPersistedState();
    this.recordCurrentFrame();
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.stop();
  }

  render() {
    const frame = this.currentFrame();
    return html`
      <main class="shell">
        <div class="side-column">
          ${this.renderSidePanel("attacker", frame)}
          ${this.renderMechanicsPanel()}
        </div>
        <div class="stage">
          ${this.renderRunPanel()} ${this.renderStats(frame)}
          ${this.renderTroopGraph()} ${this.renderResourceGraph()}
          ${this.renderCombatGraph()}
        </div>
        <div class="side-column">
          ${this.renderSidePanel("defender", frame)}
        </div>
      </main>
    `;
  }

  private renderRunPanel(): TemplateResult {
    return html`
      <hud-surface>
        <hud-surface-header>
          <hud-label>War Battle Systems Sandbox</hud-label>
          <hud-pill
            tone=${this.battle.outcome === "fighting" ? "green" : "blue"}
          >
            T${this.tick}
          </hud-pill>
        </hud-surface-header>
        <hud-surface-body>
          <hud-stack>
            <div class="summary">${this.battleStatusText()}</div>
            <hud-action-group>
              <hud-button
                data-action="run"
                variant=${this.running ? "active" : "default"}
                ?disabled=${this.runButtonDisabled()}
                @click=${this.toggleRunState}
              >
                ${this.runButtonLabel()}
              </hud-button>
              <hud-button
                data-action="step"
                ?disabled=${this.running || this.isTerminalOutcome()}
                @click=${this.step}
                >Step</hud-button
              >
              <hud-button data-action="reset" @click=${this.reset}
                >Restart</hud-button
              >
            </hud-action-group>
          </hud-stack>
        </hud-surface-body>
      </hud-surface>
    `;
  }

  private renderSidePanel(side: Side, frame: BattleFrame): TemplateResult {
    const controls = sideControls.filter((control) => control.side === side);
    const sideFrame = this.sideFrame(side, frame);
    return html`
      <hud-surface>
        <hud-surface-header>
          <hud-label>${sideTitle(side)}</hud-label>
          <hud-pill tone=${side === "attacker" ? "blue" : "gold"}>
            ${side === "attacker" ? "left" : "right"}
          </hud-pill>
        </hud-surface-header>
        <hud-surface-body>
          <hud-stack>
            <div class="side-summary">
              ${this.renderSideStat("Troops", sideFrame.troops)}
              ${this.renderSideStat("Growth/tick", sideFrame.troopGrowth)}
              ${this.renderSideStat("Capacity", sideFrame.troopCapacity)}
              ${this.renderSideStat("Active push", sideFrame.activePush)}
              ${this.renderSideStat("Tiles", sideFrame.tiles)}
              ${this.renderSideStat("Supply", sideFrame.supply * 100, "%")}
              ${this.renderSideStat("Food", sideFrame.food)}
              ${this.renderSideStat("Energy", sideFrame.energy)}
              ${this.renderSideStat("Materials", sideFrame.materials)}
              ${this.renderSideStat(
                "Devastation",
                sideFrame.devastation * 100,
                "%",
              )}
            </div>
            ${this.renderPushControl(side)}
            ${this.renderSideGrowthControl(side)}
            ${controls.map((control) => this.renderSideControl(control))}
          </hud-stack>
        </hud-surface-body>
      </hud-surface>
    `;
  }

  private renderSideStat(
    label: string,
    value: number,
    suffix: string = "",
  ): TemplateResult {
    return html`
      <div class="side-stat">
        <div class="side-stat-label">${label}</div>
        <div class="side-stat-value">
          ${formatSideStat(label, value)}${suffix}
        </div>
      </div>
    `;
  }

  private renderPushControl(side: Side): TemplateResult {
    const label = side === "attacker" ? "Push right" : "Push left";
    const description =
      side === "attacker"
        ? "Move left-side troops into an active push against the right side."
        : "Move right-side troops into an active push against the left side.";
    return html`
      <hud-form-row>
        <hud-field-label>
          <span class="control-label">
            ${label} ${this.renderHelp(description)}
          </span>
        </hud-field-label>
        <div class="control-pair">
          <hud-range
            data-control=${`${side}.push`}
            .min=${0}
            .max=${250_000}
            .step=${100}
            .value=${this.pushCommitments[side]}
            .label=${label}
            @value-change=${(event: CustomEvent<{ value: string | number }>) =>
              this.setPushCommitment(side, numberFromEvent(event))}
          ></hud-range>
          <hud-input
            data-control-input=${`${side}.push`}
            type="number"
            .value=${String(roundForDisplay(this.pushCommitments[side]))}
            @value-change=${(event: CustomEvent<{ value: string | number }>) =>
              this.setPushCommitment(side, numberFromEvent(event))}
          ></hud-input>
        </div>
      </hud-form-row>
      <hud-action-group>
        <hud-button
          data-action=${`${side}-push`}
          ?disabled=${this.pushButtonDisabled(side)}
          @click=${() => this.startSidePush(side)}
        >
          ${label}
        </hud-button>
      </hud-action-group>
    `;
  }

  private renderSideGrowthControl(side: Side): TemplateResult {
    const label = "Growth multiplier";
    return html`
      <hud-form-row>
        <hud-field-label>
          <span class="control-label">
            ${label}
            ${this.renderHelp(
              "Side-specific multiplier applied to global logistic troop growth.",
            )}
          </span>
        </hud-field-label>
        <div class="control-pair">
          <hud-range
            data-control=${`${side}.growthMultiplier`}
            .min=${0}
            .max=${5}
            .step=${0.05}
            .value=${this.troopGrowthMultipliers[side]}
            .label=${label}
            @value-change=${(event: CustomEvent<{ value: string | number }>) =>
              this.setTroopGrowthMultiplier(side, numberFromEvent(event))}
          ></hud-range>
          <hud-input
            data-control-input=${`${side}.growthMultiplier`}
            type="number"
            .value=${String(roundForDisplay(this.troopGrowthMultipliers[side]))}
            @value-change=${(event: CustomEvent<{ value: string | number }>) =>
              this.setTroopGrowthMultiplier(side, numberFromEvent(event))}
          ></hud-input>
        </div>
      </hud-form-row>
    `;
  }

  private renderSideControl(control: SideControl): TemplateResult {
    const value = this.battle[control.side][control.key];
    const id = `${control.side}.${control.key}`;
    return html`
      <hud-form-row>
        <hud-field-label>
          <span class="control-label">
            ${control.label} ${this.renderHelp(control.description)}
          </span>
        </hud-field-label>
        <div class="control-pair">
          <hud-range
            data-control=${id}
            .min=${control.min}
            .max=${control.max}
            .step=${control.step}
            .value=${value}
            .label=${control.label}
            @value-change=${(event: CustomEvent<{ value: string | number }>) =>
              this.setSideValue(
                control.side,
                control.key,
                numberFromEvent(event),
              )}
          ></hud-range>
          <hud-input
            data-control-input=${id}
            type="number"
            .value=${String(roundForDisplay(value))}
            @value-change=${(event: CustomEvent<{ value: string | number }>) =>
              this.setSideValue(
                control.side,
                control.key,
                numberFromEvent(event),
              )}
          ></hud-input>
        </div>
      </hud-form-row>
    `;
  }

  private renderMechanicsPanel(): TemplateResult {
    return html`
      <hud-surface>
        <hud-surface-header>
          <hud-label>Global Mechanics</hud-label>
        </hud-surface-header>
        <hud-surface-body>
          <hud-stack>
            <hud-tabs
              data-mechanics-tabs
              .items=${mechanicsTabItems}
              .selected=${this.activeMechanicsTab}
              @selection-change=${(event: CustomEvent<{ id: MechanicsTab }>) =>
                this.setMechanicsTab(event.detail.id)}
            ></hud-tabs>
            ${this.renderMechanicsTab()}
          </hud-stack>
        </hud-surface-body>
      </hud-surface>
    `;
  }

  private renderMechanicsTab(): TemplateResult {
    if (this.activeMechanicsTab === "growth") {
      return this.renderGrowthControls();
    }
    if (this.activeMechanicsTab === "combat") {
      return this.renderCombatControls();
    }
    return this.renderParamControls(this.activeMechanicsTab);
  }

  private renderGrowthControls(): TemplateResult {
    return html`
      <hud-stack>
        ${this.renderTroopGrowthControl(
          "growthRate",
          "Growth rate",
          "Base logistic troop growth rate per tick. Growth = rate * troops * (1 - troops / capacity).",
          0,
          0.1,
          0.0005,
        )}
        ${this.renderTroopGrowthControl(
          "maxTroopsPerTile",
          "Max troops / tile",
          "Troop capacity each owned tile contributes. Each side capacity = tiles * this value.",
          1,
          500,
          1,
        )}
      </hud-stack>
    `;
  }

  private renderTroopGrowthControl(
    key: keyof TroopGrowthParams,
    label: string,
    description: string,
    min: number,
    max: number,
    step: number,
  ): TemplateResult {
    const value = this.troopGrowthParams[key];
    return html`
      <hud-form-row>
        <hud-field-label>
          <span class="control-label">
            ${label} ${this.renderHelp(description)}
          </span>
        </hud-field-label>
        <div class="control-pair">
          <hud-range
            data-control=${`growth.${key}`}
            .min=${min}
            .max=${max}
            .step=${step}
            .value=${value}
            .label=${label}
            @value-change=${(event: CustomEvent<{ value: string | number }>) =>
              this.setTroopGrowthParam(key, numberFromEvent(event), min, max)}
          ></hud-range>
          <hud-input
            data-control-input=${`growth.${key}`}
            type="number"
            .value=${String(roundForDisplay(value))}
            @value-change=${(event: CustomEvent<{ value: string | number }>) =>
              this.setTroopGrowthParam(key, numberFromEvent(event), min, max)}
          ></hud-input>
        </div>
      </hud-form-row>
    `;
  }

  private renderCombatControls(): TemplateResult {
    return html`
      <hud-stack>
        <hud-form-row>
          <hud-field-label>Terrain</hud-field-label>
          <hud-select
            data-terrain
            .options=${terrainOptions}
            .value=${this.params.terrain}
            @value-change=${(event: CustomEvent<{ value: TerrainProfile }>) =>
              this.setParamValue("terrain", event.detail.value)}
          ></hud-select>
        </hud-form-row>
        ${this.renderParamControls("combat")}
      </hud-stack>
    `;
  }

  private renderParamControls(
    section: ParamControl["section"],
  ): TemplateResult {
    const controls = paramControls.filter(
      (control) => control.section === section,
    );
    return html`<hud-stack>
      ${controls.map((control) => this.renderParamControl(control))}
    </hud-stack>`;
  }

  private renderParamControl(control: ParamControl): TemplateResult {
    const value = this.params[control.key] as number;
    return html`
      <hud-form-row>
        <hud-field-label>
          <span class="control-label">
            ${control.label} ${this.renderHelp(control.description)}
          </span>
        </hud-field-label>
        <div class="control-pair">
          <hud-range
            data-control=${control.key}
            .min=${control.min}
            .max=${control.max}
            .step=${control.step}
            .value=${value}
            .label=${control.label}
            @value-change=${(event: CustomEvent<{ value: string | number }>) =>
              this.setParamValue(control.key, numberFromEvent(event))}
          ></hud-range>
          <hud-input
            data-control-input=${control.key}
            type="number"
            .value=${String(roundForDisplay(value))}
            @value-change=${(event: CustomEvent<{ value: string | number }>) =>
              this.setParamValue(control.key, numberFromEvent(event))}
          ></hud-input>
        </div>
      </hud-form-row>
    `;
  }

  private renderHelp(description: string): TemplateResult {
    return html`<span class="help" tabindex="0" aria-label=${description}>
      ?
      <span class="tip">${description}</span>
    </span>`;
  }

  private renderStats(frame: BattleFrame): TemplateResult {
    return html`
      <hud-surface>
        <hud-surface-header>
          <hud-label>Current Battle State</hud-label>
          <hud-pill tone=${this.outcomeTone()}>${this.battle.outcome}</hud-pill>
        </hud-surface-header>
        <hud-surface-body>
          <hud-stat-grid columns="4">
            <hud-stat
              label="Left troops"
              value=${formatValue(frame.attackerTroops)}
            ></hud-stat>
            <hud-stat
              label="Left growth"
              value=${formatValue(frame.attackerTroopGrowth)}
            ></hud-stat>
            <hud-stat
              label="Left capacity"
              value=${formatValue(frame.attackerTroopCapacity)}
            ></hud-stat>
            <hud-stat
              label="Left push"
              value=${formatValue(frame.activeAttackerPush)}
            ></hud-stat>
            <hud-stat
              label="Right troops"
              value=${formatValue(frame.defenderTroops)}
            ></hud-stat>
            <hud-stat
              label="Right growth"
              value=${formatValue(frame.defenderTroopGrowth)}
            ></hud-stat>
            <hud-stat
              label="Right capacity"
              value=${formatValue(frame.defenderTroopCapacity)}
            ></hud-stat>
            <hud-stat
              label="Right push"
              value=${formatValue(frame.activeDefenderPush)}
            ></hud-stat>
            <hud-stat
              label="Left tiles"
              value=${formatValue(frame.attackerTiles)}
            ></hud-stat>
            <hud-stat
              label="Right tiles"
              value=${formatValue(frame.defenderTiles)}
            ></hud-stat>
            <hud-stat
              label="Left supply"
              value=${`${formatValue(frame.attackerSupply * 100)}%`}
            ></hud-stat>
            <hud-stat
              label="Right supply"
              value=${`${formatValue(frame.defenderSupply * 100)}%`}
            ></hud-stat>
            <hud-stat
              label="Intensity"
              value=${`${formatValue(frame.combatIntensity * 100)}%`}
            ></hud-stat>
            <hud-stat
              label="Left devastation"
              value=${`${formatValue(frame.attackerDevastation * 100)}%`}
            ></hud-stat>
            <hud-stat
              label="Right devastation"
              value=${`${formatValue(frame.devastation * 100)}%`}
            ></hud-stat>
            <hud-stat
              label="Tiles / tick"
              value=${formatValue(frame.tilesCaptured)}
            ></hud-stat>
            <hud-stat
              label="Push losses"
              value=${formatValue(frame.attackerLosses)}
            ></hud-stat>
            <hud-stat
              label="Target losses"
              value=${formatValue(frame.defenderLosses)}
            ></hud-stat>
          </hud-stat-grid>
        </hud-surface-body>
      </hud-surface>
    `;
  }

  private renderTroopGraph(): TemplateResult {
    const frames = this.frames();
    return html`
      <div class="graph">
        <div class="graph-title">
          <span>Troops And Territory</span>
          <span class="graph-readout">${frames.length} samples</span>
        </div>
        ${renderSeriesGraph(
          [
            {
              label: "Left troops",
              color: "#38bdf8",
              points: frames.map((frame) => ({
                x: frame.tick,
                y: frame.attackerTroops,
              })),
            },
            {
              label: "Left active push",
              color: "#fb7185",
              points: frames.map((frame) => ({
                x: frame.tick,
                y: frame.activeAttackerPush,
              })),
            },
            {
              label: "Left capacity",
              color: "#7dd3fc",
              points: frames.map((frame) => ({
                x: frame.tick,
                y: frame.attackerTroopCapacity,
              })),
            },
            {
              label: "Right troops",
              color: "#facc15",
              points: frames.map((frame) => ({
                x: frame.tick,
                y: frame.defenderTroops,
              })),
            },
            {
              label: "Right capacity",
              color: "#fde68a",
              points: frames.map((frame) => ({
                x: frame.tick,
                y: frame.defenderTroopCapacity,
              })),
            },
            {
              label: "Right active push",
              color: "#e879f9",
              points: frames.map((frame) => ({
                x: frame.tick,
                y: frame.activeDefenderPush,
              })),
            },
            {
              label: "Left tiles",
              color: "#4ade80",
              points: frames.map((frame) => ({
                x: frame.tick,
                y: frame.attackerTiles,
              })),
            },
            {
              label: "Right tiles",
              color: "#86efac",
              points: frames.map((frame) => ({
                x: frame.tick,
                y: frame.defenderTiles,
              })),
            },
          ],
          "Tick",
          "Count",
        )}
      </div>
    `;
  }

  private renderResourceGraph(): TemplateResult {
    const frames = this.frames();
    return html`
      <div class="graph">
        <div class="graph-title">
          <span>Resource Stocks</span>
          <span class="graph-readout">food / energy / materials</span>
        </div>
        ${renderSeriesGraph(
          [
            {
              label: "Left food",
              color: "#22c55e",
              points: frames.map((frame) => ({
                x: frame.tick,
                y: frame.attackerFood,
              })),
            },
            {
              label: "Left energy",
              color: "#38bdf8",
              points: frames.map((frame) => ({
                x: frame.tick,
                y: frame.attackerEnergy,
              })),
            },
            {
              label: "Left materials",
              color: "#a78bfa",
              points: frames.map((frame) => ({
                x: frame.tick,
                y: frame.attackerMaterials,
              })),
            },
            {
              label: "Right food",
              color: "#84cc16",
              points: frames.map((frame) => ({
                x: frame.tick,
                y: frame.defenderFood,
              })),
            },
            {
              label: "Right energy",
              color: "#0ea5e9",
              points: frames.map((frame) => ({
                x: frame.tick,
                y: frame.defenderEnergy,
              })),
            },
            {
              label: "Right materials",
              color: "#c084fc",
              points: frames.map((frame) => ({
                x: frame.tick,
                y: frame.defenderMaterials,
              })),
            },
          ],
          "Tick",
          "Resources",
        )}
      </div>
    `;
  }

  private renderCombatGraph(): TemplateResult {
    const frames = this.frames();
    return html`
      <div class="graph">
        <div class="graph-title">
          <span>Supply, Losses, And Devastation</span>
          <span class="graph-readout">
            ${formatValue(frames[frames.length - 1].tilesCaptured)} tiles/tick
          </span>
        </div>
        ${renderSeriesGraph(
          [
            {
              label: "Left supply %",
              color: "#38bdf8",
              points: frames.map((frame) => ({
                x: frame.tick,
                y: frame.attackerSupply * 100,
              })),
            },
            {
              label: "Right supply %",
              color: "#facc15",
              points: frames.map((frame) => ({
                x: frame.tick,
                y: frame.defenderSupply * 100,
              })),
            },
            {
              label: "Right devastation %",
              color: "#fb7185",
              points: frames.map((frame) => ({
                x: frame.tick,
                y: frame.devastation * 100,
              })),
            },
            {
              label: "Left devastation %",
              color: "#f97316",
              points: frames.map((frame) => ({
                x: frame.tick,
                y: frame.attackerDevastation * 100,
              })),
            },
            {
              label: "Tiles captured",
              color: "#4ade80",
              points: frames.map((frame) => ({
                x: frame.tick,
                y: frame.tilesCaptured,
              })),
            },
            {
              label: "Push losses",
              color: "#fdba74",
              points: frames.map((frame) => ({
                x: frame.tick,
                y: frame.attackerLosses,
              })),
            },
            {
              label: "Target losses",
              color: "#e879f9",
              points: frames.map((frame) => ({
                x: frame.tick,
                y: frame.defenderLosses,
              })),
            },
          ],
          "Tick",
          "Value",
        )}
      </div>
    `;
  }

  private outcomeTone(): "green" | "red" | "gold" | "blue" {
    switch (this.battle.outcome) {
      case "fighting":
        return "gold";
      case "attacker-defeated":
        return "red";
      case "defender-conquered":
        return "green";
      case "idle":
        return "blue";
    }
  }

  private frames(): BattleFrame[] {
    return this.history.length > 0 ? this.history : [this.currentFrame()];
  }

  private runButtonLabel(): string {
    if (this.running) {
      return "Pause";
    }
    if (this.battle.outcome === "fighting") {
      return "Resume";
    }
    if (this.isTerminalOutcome()) {
      return "Complete";
    }
    return "Start";
  }

  private runButtonDisabled(): boolean {
    if (this.running || this.battle.outcome === "fighting") {
      return false;
    }
    return this.isTerminalOutcome();
  }

  private isTerminalOutcome(): boolean {
    return (
      this.battle.outcome === "attacker-defeated" ||
      this.battle.outcome === "defender-conquered"
    );
  }

  private toggleRunState = () => {
    if (this.running) {
      this.stop();
      return;
    }

    this.start();
  };

  private pushButtonDisabled(side: Side): boolean {
    return (
      this.isTerminalOutcome() ||
      this.pushCommitments[side] <= 0 ||
      this.battle[side].troops <= 0
    );
  }

  private startSidePush(side: Side) {
    if (this.pushButtonDisabled(side)) {
      return;
    }
    if (
      this.battle.outcome === "fighting" &&
      this.activePushSide !== null &&
      this.activePushSide !== side
    ) {
      this.resolveCounterPush(side);
      this.recordCurrentFrame();
      if (this.battle.outcome === "fighting") {
        this.start();
      } else {
        this.stop();
      }
      return;
    }
    const perspective = this.battleForPerspective(side);
    const next = startWarBattleAttack(perspective, this.pushCommitments[side]);
    this.applyPerspectiveState(side, next);
    if (next.outcome === "fighting") {
      this.activePushSide = side;
      this.recordCurrentFrame();
      this.start();
    }
  }

  private resolveCounterPush(side: Side) {
    const committed = Math.max(
      0,
      Math.min(this.battle[side].troops, this.pushCommitments[side]),
    );
    if (committed <= 0) {
      return;
    }
    const currentPush = this.battle.activeAttackers;
    const remainingPush = Math.abs(currentPush - committed);
    this.battle = {
      ...this.battle,
      [side]: {
        ...this.battle[side],
        troops: this.battle[side].troops - committed,
      },
      activeAttackers: remainingPush,
      outcome: remainingPush > 0 ? "fighting" : "idle",
    };
    if (committed > currentPush) {
      this.activePushSide = side;
      return;
    }
    if (committed === currentPush) {
      this.activePushSide = null;
    }
  }

  private start() {
    if (this.intervalID !== null) {
      return;
    }
    this.running = true;
    this.intervalID = window.setInterval(() => this.step(), STEP_INTERVAL_MS);
  }

  private stop() {
    this.running = false;
    if (this.intervalID !== null) {
      window.clearInterval(this.intervalID);
      this.intervalID = null;
    }
  }

  private step = () => {
    const result = this.evaluateCurrentTick();
    this.lastResult = result;
    this.tick += 1;
    this.recordCurrentFrame();
    if (this.isTerminalOutcome()) {
      this.stop();
    }
  };

  private reset = () => {
    this.stop();
    this.battle = createWarBattleState(DEFAULT_ATTACKER, DEFAULT_DEFENDER);
    this.params = { ...DEFAULT_WAR_BATTLE_PARAMS };
    this.troopGrowthParams = { ...DEFAULT_TROOP_GROWTH_PARAMS };
    this.troopGrowthMultipliers = {
      attacker: 1,
      defender: 1,
    };
    this.pushCommitments = {
      attacker: 15_000,
      defender: 15_000,
    };
    this.activeMechanicsTab = "growth";
    this.activePushSide = null;
    this.attackerDevastation = 0;
    this.tick = 0;
    this.history = [];
    this.lastResult = null;
    this.recordCurrentFrame();
  };

  private setPushCommitment(side: Side, value: number) {
    if (!Number.isFinite(value)) {
      return;
    }
    this.pushCommitments = {
      ...this.pushCommitments,
      [side]: clamp(value, 0, 250_000),
    };
    this.persistCurrentState();
  }

  private setTroopGrowthMultiplier(side: Side, value: number) {
    if (!Number.isFinite(value)) {
      return;
    }
    this.troopGrowthMultipliers = {
      ...this.troopGrowthMultipliers,
      [side]: clamp(value, 0, 5),
    };
    this.recordCurrentFrame();
  }

  private setSideValue(side: Side, key: SideKey, value: number) {
    if (!Number.isFinite(value)) {
      return;
    }
    const control = sideControls.find(
      (candidate) => candidate.side === side && candidate.key === key,
    );
    if (!control) {
      return;
    }
    const next = clamp(value, control.min, control.max);
    this.battle = {
      ...this.battle,
      [side]: {
        ...this.battle[side],
        [key]: next,
      },
    };
    this.recordCurrentFrame();
  }

  private setMechanicsTab(tab: MechanicsTab) {
    this.activeMechanicsTab = tab;
    this.persistCurrentState();
  }

  private setTroopGrowthParam(
    key: keyof TroopGrowthParams,
    value: number,
    min: number,
    max: number,
  ) {
    if (!Number.isFinite(value)) {
      return;
    }
    this.troopGrowthParams = {
      ...this.troopGrowthParams,
      [key]: clamp(value, min, max),
    };
    this.recordCurrentFrame();
  }

  private setParamValue<K extends ParamKey>(key: K, value: WarBattleParams[K]) {
    if (key !== "terrain" && !Number.isFinite(Number(value))) {
      return;
    }
    const control = paramControls.find((candidate) => candidate.key === key);
    const next =
      control && typeof value === "number"
        ? clamp(value, control.min, control.max)
        : value;
    this.params = {
      ...this.params,
      [key]: next,
    };
    this.recordCurrentFrame();
  }

  private recordCurrentFrame() {
    this.history = [...this.history, this.currentFrame()].slice(-HISTORY_LIMIT);
    this.persistCurrentState();
  }

  private loadPersistedState() {
    const persisted = readPersistedState();
    if (!persisted) {
      return;
    }
    this.stop();
    this.battle = persisted.battle;
    this.params = persisted.params;
    this.troopGrowthParams = persisted.troopGrowthParams;
    this.troopGrowthMultipliers = persisted.troopGrowthMultipliers;
    this.pushCommitments = persisted.pushCommitments;
    this.activeMechanicsTab = persisted.activeMechanicsTab;
    this.activePushSide = persisted.activePushSide;
    this.attackerDevastation = persisted.attackerDevastation;
    this.tick = persisted.tick;
    this.history = [];
    this.lastResult = null;
  }

  private persistCurrentState() {
    writePersistedState({
      version: 1,
      battle: this.battle,
      params: this.params,
      troopGrowthParams: this.troopGrowthParams,
      troopGrowthMultipliers: this.troopGrowthMultipliers,
      pushCommitments: this.pushCommitments,
      activeMechanicsTab: this.activeMechanicsTab,
      activePushSide: this.activePushSide,
      attackerDevastation: this.attackerDevastation,
      tick: this.tick,
    });
  }

  private currentFrame(): BattleFrame {
    const activeAttackerPush =
      this.activePushSide === "attacker" ? this.battle.activeAttackers : 0;
    const activeDefenderPush =
      this.activePushSide === "defender" ? this.battle.activeAttackers : 0;
    const leftSupply =
      this.activePushSide === "defender"
        ? (this.lastResult?.defenderSupply ?? 1)
        : (this.lastResult?.attackerSupply ?? 1);
    const rightSupply =
      this.activePushSide === "defender"
        ? (this.lastResult?.attackerSupply ?? 1)
        : (this.lastResult?.defenderSupply ?? 1);
    const attackerTroopCapacity = this.troopCapacity("attacker");
    const defenderTroopCapacity = this.troopCapacity("defender");
    return {
      tick: this.tick,
      attackerTroops: this.battle.attacker.troops,
      attackerTroopGrowth: this.troopGrowthForSide("attacker"),
      attackerTroopCapacity,
      activeAttackers: this.battle.activeAttackers,
      activeAttackerPush,
      activeDefenderPush,
      defenderTroops: this.battle.defender.troops,
      defenderTroopGrowth: this.troopGrowthForSide("defender"),
      defenderTroopCapacity,
      defenderTiles: this.battle.defender.tiles,
      attackerTiles: this.battle.attacker.tiles,
      attackerFood: this.battle.attacker.food,
      attackerEnergy: this.battle.attacker.energy,
      attackerMaterials: this.battle.attacker.materials,
      defenderFood: this.battle.defender.food,
      defenderEnergy: this.battle.defender.energy,
      defenderMaterials: this.battle.defender.materials,
      attackerSupply: leftSupply,
      defenderSupply: rightSupply,
      combatIntensity: this.lastResult?.combatIntensity ?? 0,
      tilesCaptured: this.lastResult?.tilesCaptured ?? 0,
      attackerLosses: this.lastResult?.attackerLosses ?? 0,
      defenderLosses: this.lastResult?.defenderLosses ?? 0,
      attackerDevastation: this.attackerDevastation,
      devastation: this.battle.defenderDevastation,
    };
  }

  private evaluateCurrentTick(): WarBattleTickResult {
    const side = this.activePushSide ?? "attacker";
    const result = evaluateWarBattleTick(
      this.battleForPerspective(side),
      this.params,
    );
    this.applyPerspectiveState(side, result.state);
    this.applyTroopGrowth();
    return {
      ...result,
      state: this.battle,
    };
  }

  private battleForPerspective(side: Side): WarBattleState {
    if (side === "attacker") {
      return this.battle;
    }
    return {
      attacker: this.battle.defender,
      defender: this.battle.attacker,
      activeAttackers: this.battle.activeAttackers,
      defenderDevastation: this.attackerDevastation,
      outcome: this.battle.outcome,
    };
  }

  private applyPerspectiveState(side: Side, state: WarBattleState) {
    if (side === "attacker") {
      this.battle = state;
      return;
    }
    this.attackerDevastation = state.defenderDevastation;
    this.battle = {
      attacker: state.defender,
      defender: state.attacker,
      activeAttackers: state.activeAttackers,
      defenderDevastation: this.battle.defenderDevastation,
      outcome: state.outcome,
    };
  }

  private battleStatusText(): string {
    if (this.battle.outcome === "idle") {
      return "Adjust either side, then use Push right or Push left to start the front. Home troops regrow each tick from the Growth mechanics tab.";
    }
    const side = this.activePushSide;
    if (this.battle.outcome === "fighting" && side !== null) {
      return `${sideTitle(side)} is actively pushing ${targetSideTitle(side)}.`;
    }
    if (this.battle.outcome === "attacker-defeated" && side !== null) {
      return `${sideTitle(side)} push was defeated. Restart to run another setup.`;
    }
    if (this.battle.outcome === "defender-conquered" && side !== null) {
      return `${sideTitle(side)} conquered ${targetSideTitle(side)}. Restart to run another setup.`;
    }
    return this.battle.outcome;
  }

  private sideFrame(side: Side, frame: BattleFrame) {
    return side === "attacker"
      ? {
          troops: frame.attackerTroops,
          troopGrowth: frame.attackerTroopGrowth,
          troopCapacity: frame.attackerTroopCapacity,
          activePush: frame.activeAttackerPush,
          tiles: frame.attackerTiles,
          supply: frame.attackerSupply,
          food: frame.attackerFood,
          energy: frame.attackerEnergy,
          materials: frame.attackerMaterials,
          devastation: frame.attackerDevastation,
        }
      : {
          troops: frame.defenderTroops,
          troopGrowth: frame.defenderTroopGrowth,
          troopCapacity: frame.defenderTroopCapacity,
          activePush: frame.activeDefenderPush,
          tiles: frame.defenderTiles,
          supply: frame.defenderSupply,
          food: frame.defenderFood,
          energy: frame.defenderEnergy,
          materials: frame.defenderMaterials,
          devastation: frame.devastation,
        };
  }

  private applyTroopGrowth() {
    this.battle = {
      ...this.battle,
      attacker: this.growthSuppressedForSide("attacker")
        ? this.battle.attacker
        : this.addTroopGrowth("attacker", this.battle.attacker),
      defender: this.growthSuppressedForSide("defender")
        ? this.battle.defender
        : this.addTroopGrowth("defender", this.battle.defender),
    };
  }

  private addTroopGrowth(
    side: Side,
    state: WarBattleSideState,
  ): WarBattleSideState {
    const capacity = this.troopCapacityForTiles(state.tiles);
    const growth = troopGrowth(
      state.troops,
      capacity,
      this.troopGrowthParams.growthRate,
      this.troopGrowthMultipliers[side],
    );
    return {
      ...state,
      troops: clamp(state.troops + growth, 0, Math.max(capacity, state.troops)),
    };
  }

  private troopGrowthForSide(side: Side): number {
    if (this.growthSuppressedForSide(side)) {
      return 0;
    }
    return troopGrowth(
      this.battle[side].troops,
      this.troopCapacity(side),
      this.troopGrowthParams.growthRate,
      this.troopGrowthMultipliers[side],
    );
  }

  private troopCapacity(side: Side): number {
    return this.troopCapacityForTiles(this.battle[side].tiles);
  }

  private troopCapacityForTiles(tiles: number): number {
    return Math.max(0, tiles * this.troopGrowthParams.maxTroopsPerTile);
  }

  private growthSuppressedForSide(side: Side): boolean {
    return (
      this.battle.outcome === "fighting" &&
      this.activePushSide !== null &&
      targetSide(this.activePushSide) === side
    );
  }
}

interface Series {
  label: string;
  color: string;
  points: SeriesPoint[];
}

function renderSeriesGraph(
  series: Series[],
  xLabel: string,
  yLabel: string,
): TemplateResult {
  const width = 560;
  const height = 210;
  const bounds = graphBounds(width, height);
  const allPoints = series.flatMap((item) => item.points);
  const minX = Math.min(...allPoints.map((point) => point.x));
  const maxX = Math.max(...allPoints.map((point) => point.x), minX + 1);
  const maxY = Math.max(
    ...allPoints
      .map((point) => point.y)
      .filter((value) => Number.isFinite(value)),
    1,
  );
  const toX = (x: number) =>
    bounds.left + ((x - minX) / Math.max(1, maxX - minX)) * bounds.plotW;
  const toY = (y: number) =>
    bounds.top +
    bounds.plotH -
    (Math.min(y, maxY) / Math.max(1, maxY)) * bounds.plotH;
  const toPath = (points: SeriesPoint[]) =>
    points
      .map((point, index) => {
        const y = Number.isFinite(point.y) ? point.y : maxY;
        return `${index === 0 ? "M" : "L"} ${toX(point.x)} ${toY(y)}`;
      })
      .join(" ");

  return html`
    <svg class="curve" viewBox="0 0 ${width} ${height}" role="img">
      ${renderGrid(width, height, bounds, minX, maxX, 0, maxY)}
      ${series.map(
        (item) => svg`
          <path
            class="series"
            stroke=${item.color}
            d=${toPath(item.points)}
          ></path>
        `,
      )}
      <text class="axis-label" x=${bounds.left} y=${height - 7}>${xLabel}</text>
      <text class="axis-label" x=${bounds.left} y=${bounds.top - 3}>
        ${yLabel}
      </text>
    </svg>
    <div class="legend">
      ${series.map(
        (item) =>
          html`<span style=${`--dot:${item.color}`}>${item.label}</span>`,
      )}
    </div>
  `;
}

function renderGrid(
  width: number,
  height: number,
  bounds: ReturnType<typeof graphBounds>,
  minX: number,
  maxX: number,
  minY: number,
  maxY: number,
): TemplateResult {
  const xTicks = [0, 0.25, 0.5, 0.75, 1].map((pct) => {
    const value = minX + (maxX - minX) * pct;
    return {
      x: bounds.left + pct * bounds.plotW,
      label: formatValue(value),
    };
  });
  const yTicks = [0, 0.25, 0.5, 0.75, 1].map((pct) => {
    const value = minY + (maxY - minY) * pct;
    return {
      y: bounds.top + bounds.plotH - pct * bounds.plotH,
      label: formatValue(value),
    };
  });

  return svg`
    ${yTicks.map(
      (tick) => svg`
        <line class="grid" x1=${bounds.left} x2=${width - bounds.right} y1=${tick.y} y2=${tick.y}></line>
        <line class="tick" x1=${bounds.left - 3} x2=${bounds.left} y1=${tick.y} y2=${tick.y}></line>
        <text class="tick-label" x=${bounds.left - 5} y=${tick.y + 3} text-anchor="end">${tick.label}</text>
      `,
    )}
    ${xTicks.map(
      (tick) => svg`
        <line class="grid" x1=${tick.x} x2=${tick.x} y1=${bounds.top} y2=${bounds.top + bounds.plotH}></line>
        <line class="tick" x1=${tick.x} x2=${tick.x} y1=${bounds.top + bounds.plotH} y2=${bounds.top + bounds.plotH + 3}></line>
        <text class="tick-label" x=${tick.x} y=${bounds.top + bounds.plotH + 12} text-anchor="middle">${tick.label}</text>
      `,
    )}
    <line class="axis" x1=${bounds.left} x2=${bounds.left} y1=${bounds.top} y2=${bounds.top + bounds.plotH}></line>
    <line class="axis" x1=${bounds.left} x2=${width - bounds.right} y1=${bounds.top + bounds.plotH} y2=${bounds.top + bounds.plotH}></line>
  `;
}

function graphBounds(width: number, height: number) {
  const left = 46;
  const right = 10;
  const top = 14;
  const bottom = 30;
  return {
    left,
    right,
    top,
    bottom,
    plotW: width - left - right,
    plotH: height - top - bottom,
  };
}

function sideTitle(side: Side): string {
  return side === "attacker" ? "Left side" : "Right side";
}

function targetSideTitle(side: Side): string {
  return sideTitle(targetSide(side));
}

function targetSide(side: Side): Side {
  return side === "attacker" ? "defender" : "attacker";
}

function readPersistedState(): PersistedWarBattleSandboxState | null {
  if (typeof window === "undefined") {
    return null;
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return null;
    }
    return persistedStateFromUnknown(JSON.parse(raw));
  } catch {
    return null;
  }
}

function writePersistedState(state: PersistedWarBattleSandboxState) {
  if (typeof window === "undefined") {
    return;
  }
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Storage can be unavailable in private contexts; the sandbox still works.
  }
}

function persistedStateFromUnknown(
  value: unknown,
): PersistedWarBattleSandboxState | null {
  if (!isRecord(value)) {
    return null;
  }
  return {
    version: 1,
    battle: battleStateFromUnknown(value.battle),
    params: paramsFromUnknown(value.params),
    troopGrowthParams: troopGrowthParamsFromUnknown(value.troopGrowthParams),
    troopGrowthMultipliers: sideNumberRecordFromUnknown(
      value.troopGrowthMultipliers,
      { attacker: 1, defender: 1 },
      0,
      5,
    ),
    pushCommitments: sideNumberRecordFromUnknown(
      value.pushCommitments,
      { attacker: 15_000, defender: 15_000 },
      0,
      250_000,
    ),
    activeMechanicsTab: mechanicsTabFromUnknown(value.activeMechanicsTab),
    activePushSide: sideOrNullFromUnknown(value.activePushSide),
    attackerDevastation: clamp(
      finiteNumber(value.attackerDevastation, 0),
      0,
      1,
    ),
    tick: Math.max(0, Math.floor(finiteNumber(value.tick, 0))),
  };
}

function battleStateFromUnknown(value: unknown): WarBattleState {
  const record = isRecord(value) ? value : {};
  const outcome = battleOutcomeFromUnknown(record.outcome);
  return {
    attacker: sideStateFromUnknown(record.attacker, DEFAULT_ATTACKER),
    defender: sideStateFromUnknown(record.defender, DEFAULT_DEFENDER),
    activeAttackers: Math.max(0, finiteNumber(record.activeAttackers, 0)),
    defenderDevastation: clamp(
      finiteNumber(record.defenderDevastation, 0),
      0,
      1,
    ),
    outcome,
  };
}

function sideStateFromUnknown(
  value: unknown,
  fallback: WarBattleSideState,
): WarBattleSideState {
  const record = isRecord(value) ? value : {};
  return {
    troops: Math.max(0, finiteNumber(record.troops, fallback.troops)),
    food: Math.max(0, finiteNumber(record.food, fallback.food)),
    energy: Math.max(0, finiteNumber(record.energy, fallback.energy)),
    materials: Math.max(0, finiteNumber(record.materials, fallback.materials)),
    tiles: Math.max(0, finiteNumber(record.tiles, fallback.tiles)),
  };
}

function paramsFromUnknown(value: unknown): WarBattleParams {
  const record = isRecord(value) ? value : {};
  const params = {
    ...DEFAULT_WAR_BATTLE_PARAMS,
    terrain: terrainFromUnknown(record.terrain),
  } as Record<keyof WarBattleParams, unknown>;
  for (const control of paramControls) {
    params[control.key] = clamp(
      finiteNumber(
        record[control.key],
        DEFAULT_WAR_BATTLE_PARAMS[control.key] as number,
      ),
      control.min,
      control.max,
    );
  }
  return params as unknown as WarBattleParams;
}

function troopGrowthParamsFromUnknown(value: unknown): TroopGrowthParams {
  const record = isRecord(value) ? value : {};
  return {
    growthRate: clamp(
      finiteNumber(record.growthRate, DEFAULT_TROOP_GROWTH_PARAMS.growthRate),
      0,
      0.1,
    ),
    maxTroopsPerTile: clamp(
      finiteNumber(
        record.maxTroopsPerTile,
        DEFAULT_TROOP_GROWTH_PARAMS.maxTroopsPerTile,
      ),
      1,
      500,
    ),
  };
}

function sideNumberRecordFromUnknown(
  value: unknown,
  fallback: Record<Side, number>,
  min: number,
  max: number,
): Record<Side, number> {
  const record = isRecord(value) ? value : {};
  return {
    attacker: clamp(finiteNumber(record.attacker, fallback.attacker), min, max),
    defender: clamp(finiteNumber(record.defender, fallback.defender), min, max),
  };
}

function terrainFromUnknown(value: unknown): TerrainProfile {
  return value === "highland" || value === "mountain" || value === "plains"
    ? value
    : DEFAULT_WAR_BATTLE_PARAMS.terrain;
}

function mechanicsTabFromUnknown(value: unknown): MechanicsTab {
  return value === "growth" ||
    value === "combat" ||
    value === "upkeep" ||
    value === "production" ||
    value === "devastation" ||
    value === "conquest"
    ? value
    : "growth";
}

function sideOrNullFromUnknown(value: unknown): Side | null {
  return value === "attacker" || value === "defender" ? value : null;
}

function battleOutcomeFromUnknown(value: unknown): WarBattleState["outcome"] {
  return value === "idle" ||
    value === "fighting" ||
    value === "attacker-defeated" ||
    value === "defender-conquered"
    ? value
    : "idle";
}

function finiteNumber(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function troopGrowth(
  troops: number,
  capacity: number,
  growthRate: number,
  multiplier: number,
): number {
  if (capacity <= 0) {
    return -troops;
  }
  return growthRate * troops * (1 - troops / capacity) * multiplier;
}

function numberFromEvent(
  event: CustomEvent<{ value: string | number }>,
): number {
  return Number(event.detail.value);
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function roundForDisplay(value: number): number {
  return Math.round(value * 100000) / 100000;
}

function formatValue(value: number): string {
  if (!Number.isFinite(value)) {
    return "unlimited";
  }
  const abs = Math.abs(value);
  if (abs >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M`;
  }
  if (abs >= 10000) {
    return `${Math.round(value / 1000)}K`;
  }
  if (abs >= 1000) {
    return `${(value / 1000).toFixed(1)}K`;
  }
  if (abs >= 10) {
    return value.toFixed(1).replace(/\.0$/, "");
  }
  return value.toFixed(3).replace(/0+$/, "").replace(/\.$/, "");
}

function formatSideStat(label: string, value: number): string {
  if (
    label === "Troops" ||
    label === "Active push" ||
    label === "Capacity" ||
    label === "Growth/tick"
  ) {
    return formatWholeNumber(value);
  }
  return formatValue(value);
}

function formatWholeNumber(value: number): string {
  if (!Number.isFinite(value)) {
    return "unlimited";
  }
  const rounded = String(Math.round(value));
  return rounded.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

declare global {
  interface HTMLElementTagNameMap {
    "war-battle-systems-sandbox": WarBattleSystemsSandbox;
  }
}

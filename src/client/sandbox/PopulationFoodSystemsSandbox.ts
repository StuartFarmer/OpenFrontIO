import { css, html, LitElement, svg, type TemplateResult } from "lit";
import { customElement, state } from "lit/decorators.js";
import {
  DEFAULT_MECHANICS_CONFIG,
  type PopulationResourceMechanicsConfig,
} from "../../core/configuration/MechanicsConfig";
import {
  DEFAULT_AGRICULTURE_SYSTEM_PARAMS,
  evaluateAgricultureSystem,
  type AgricultureSystemParams,
} from "../../games/openfront/systems/models/AgricultureSystem";
import { evaluateFoodSystem } from "../../games/openfront/systems/models/FoodSystem";
import { evaluatePopulationSystem } from "../../games/openfront/systems/models/PopulationSystem";
import "../hud/ui";
import type { HudSelectOption } from "../hud/ui/HudComponents";

type CapacityMode = "dynamic-shortage" | "hard-min-cap";
type Section = "stocks" | "land" | "crop" | "food" | "population";
type ControlKey =
  | "temperature"
  | "food"
  | "population"
  | "tilesOwned"
  | "tileExpansionPerTick"
  | "maxTiles"
  | keyof AgricultureSystemParams
  | "foodAllocationToPopulation"
  | "foodConsumptionPerPopulation"
  | "populationGrowthRate"
  | "maxPopulationPerTile"
  | "birthNutritionThreshold"
  | "survivalNutritionThreshold"
  | "starvationDamageRate"
  | "nutritionRecoveryRate"
  | "starvationMortalityScale";

interface SimulatorState {
  temperature: number;
  food: number;
  population: number;
  tilesOwned: number;
  tileExpansionPerTick: number;
  maxTiles: number;
  baseFoodPerTile: number;
  optimalTemperature: number;
  coldSensitivity: number;
  heatSensitivity: number;
  technologyMultiplier: number;
  foodAllocationToPopulation: number;
  foodConsumptionPerPopulation: number;
  populationGrowthRate: number;
  maxPopulationPerTile: number;
  nutritionHealth: number;
  birthNutritionThreshold: number;
  survivalNutritionThreshold: number;
  starvationDamageRate: number;
  nutritionRecoveryRate: number;
  starvationMortalityScale: number;
}

interface SimulatorFrame {
  tick: number;
  temperature: number;
  tilesOwned: number;
  productivity: number;
  foodPerTile: number;
  foodProduced: number;
  foodNeeded: number;
  foodConsumed: number;
  foodShortageRatio: number;
  nutritionHealth: number;
  food: number;
  population: number;
  populationGrowth: number;
  landCapacity: number;
  foodSupportedPopulation: number;
  effectiveCapacity: number;
}

interface NumberControl {
  key: ControlKey;
  section: Section;
  label: string;
  description: string;
  min: number;
  max: number;
  step: number;
}

interface SeriesPoint {
  x: number;
  y: number;
}

const HISTORY_LIMIT = 420;
const STEP_INTERVAL_MS = 120;

const DEFAULT_STATE: SimulatorState = {
  temperature: DEFAULT_AGRICULTURE_SYSTEM_PARAMS.optimalTemperature,
  food: 20,
  population: 100,
  tilesOwned: 1,
  tileExpansionPerTick: 0,
  maxTiles: 50,
  baseFoodPerTile: DEFAULT_AGRICULTURE_SYSTEM_PARAMS.baseFoodPerTile,
  optimalTemperature: DEFAULT_AGRICULTURE_SYSTEM_PARAMS.optimalTemperature,
  coldSensitivity: DEFAULT_AGRICULTURE_SYSTEM_PARAMS.coldSensitivity,
  heatSensitivity: DEFAULT_AGRICULTURE_SYSTEM_PARAMS.heatSensitivity,
  technologyMultiplier: DEFAULT_AGRICULTURE_SYSTEM_PARAMS.technologyMultiplier,
  foodAllocationToPopulation: 0.5,
  foodConsumptionPerPopulation: 0.01,
  populationGrowthRate: 0.04,
  maxPopulationPerTile: 250,
  nutritionHealth: 1,
  birthNutritionThreshold: 0.8,
  survivalNutritionThreshold: 0.5,
  starvationDamageRate: 0.005,
  nutritionRecoveryRate: 0.01,
  starvationMortalityScale: 0.002,
};

const capacityModeOptions: HudSelectOption[] = [
  {
    value: "dynamic-shortage",
    label: "Dynamic shortage pressure",
  },
  {
    value: "hard-min-cap",
    label: "Hard min capacity",
  },
];

const controls: NumberControl[] = [
  {
    key: "temperature",
    section: "stocks",
    label: "Temperature",
    description:
      "Climate stock. Change it while the simulation runs to force crop collapses and recoveries.",
    min: -5,
    max: 45,
    step: 0.1,
  },
  {
    key: "food",
    section: "stocks",
    label: "Food stock",
    description:
      "Stored food. Reserves delay shortage after production drops and smooth recovery after production returns.",
    min: 0,
    max: 10000,
    step: 5,
  },
  {
    key: "population",
    section: "stocks",
    label: "Population",
    description:
      "Population stock. It grows toward land capacity and is pressured by food shortage.",
    min: 0,
    max: 50000,
    step: 10,
  },
  {
    key: "tilesOwned",
    section: "stocks",
    label: "Tiles owned",
    description:
      "Land stock. More tiles increase land max population and total food production.",
    min: 1,
    max: 10000,
    step: 1,
  },
  {
    key: "tileExpansionPerTick",
    section: "land",
    label: "Expansion / tick",
    description:
      "Automatic tile growth per tick. Use this to test what happens when territory keeps expanding.",
    min: 0,
    max: 50,
    step: 0.1,
  },
  {
    key: "maxTiles",
    section: "land",
    label: "Max tiles",
    description:
      "Upper bound for automatic expansion. Raise it to approximate unlimited expansion.",
    min: 1,
    max: 10000,
    step: 1,
  },
  {
    key: "baseFoodPerTile",
    section: "crop",
    label: "Base food / tile",
    description:
      "Food produced by one tile at perfect temperature before technology scaling.",
    min: 0,
    max: 20,
    step: 0.05,
  },
  {
    key: "optimalTemperature",
    section: "crop",
    label: "Optimal temp",
    description: "Temperature where the crop productivity curve peaks.",
    min: 0,
    max: 40,
    step: 0.1,
  },
  {
    key: "coldSensitivity",
    section: "crop",
    label: "Cold sensitivity",
    description:
      "How quickly productivity falls below optimal temperature. Higher values make cold years harsher.",
    min: 0,
    max: 0.08,
    step: 0.001,
  },
  {
    key: "heatSensitivity",
    section: "crop",
    label: "Heat sensitivity",
    description:
      "How quickly productivity falls above optimal temperature. Higher values create sharper heat-collapse behavior.",
    min: 0,
    max: 0.16,
    step: 0.001,
  },
  {
    key: "technologyMultiplier",
    section: "crop",
    label: "Technology x",
    description:
      "Yield multiplier after temperature productivity. Technology helps, but cannot rescue a crop at near-zero productivity.",
    min: 0,
    max: 8,
    step: 0.05,
  },
  {
    key: "foodAllocationToPopulation",
    section: "food",
    label: "Food allocation",
    description:
      "Share of available food allowed to feed population. Unallocated food remains in stock for building/spending.",
    min: 0,
    max: 1,
    step: 0.01,
  },
  {
    key: "foodConsumptionPerPopulation",
    section: "food",
    label: "Food / person",
    description:
      "Per-tick food demand. Higher values lower food-supported population.",
    min: 0,
    max: 0.2,
    step: 0.001,
  },
  {
    key: "populationGrowthRate",
    section: "population",
    label: "Growth rate",
    description:
      "Maximum per-tick logistic growth rate before shortage pressure is applied.",
    min: 0,
    max: 0.25,
    step: 0.001,
  },
  {
    key: "maxPopulationPerTile",
    section: "population",
    label: "Max pop / tile",
    description:
      "Land carrying capacity. Land max population equals tiles owned times this value.",
    min: 0,
    max: 2000,
    step: 1,
  },
  {
    key: "birthNutritionThreshold",
    section: "population",
    label: "Birth nutrition threshold",
    description:
      "Minimum food satisfaction needed before population can reproduce.",
    min: 0,
    max: 1,
    step: 0.01,
  },
  {
    key: "survivalNutritionThreshold",
    section: "population",
    label: "Survival nutrition threshold",
    description:
      "Food satisfaction below this value starts applying starvation death pressure.",
    min: 0,
    max: 1,
    step: 0.01,
  },
  {
    key: "starvationDamageRate",
    section: "population",
    label: "Starvation damage",
    description: "How quickly nutrition health falls while underfed.",
    min: 0,
    max: 0.1,
    step: 0.001,
  },
  {
    key: "nutritionRecoveryRate",
    section: "population",
    label: "Nutrition recovery",
    description: "How quickly nutrition health recovers when fully fed.",
    min: 0,
    max: 0.1,
    step: 0.001,
  },
  {
    key: "starvationMortalityScale",
    section: "population",
    label: "Starvation mortality",
    description: "Maximum death pressure once nutrition health is depleted.",
    min: 0,
    max: 0.02,
    step: 0.0001,
  },
];

@customElement("population-food-systems-sandbox")
export class PopulationFoodSystemsSandbox extends LitElement {
  static styles = css`
    :host {
      min-height: 100vh;
      display: block;
      color: #e7e5df;
      background:
        linear-gradient(135deg, rgba(20, 83, 45, 0.2), transparent 32rem),
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
      min-height: 100vh;
      display: grid;
      grid-template-columns: minmax(340px, 460px) minmax(0, 1fr);
      gap: 12px;
      padding: 12px;
      box-sizing: border-box;
    }

    .panel-stack,
    .stage {
      display: grid;
      align-content: start;
      gap: 10px;
      min-width: 0;
    }

    .panel-stack {
      max-height: calc(100vh - 24px);
      overflow: auto;
    }

    .control-pair {
      display: grid;
      grid-template-columns: minmax(0, 1fr) 86px;
      gap: 6px;
      align-items: center;
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
      width: min(280px, calc(100vw - 32px));
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

    .constraint {
      color: #f8fafc;
      font-size: 12px;
      font-weight: 700;
    }

    @media (max-width: 980px) {
      .shell {
        grid-template-columns: 1fr;
      }

      .panel-stack {
        max-height: none;
      }
    }
  `;

  @state() private simulator: SimulatorState = { ...DEFAULT_STATE };
  @state() private tick = 0;
  @state() private running = false;
  @state() private capacityMode: CapacityMode = "hard-min-cap";
  @state() private history: SimulatorFrame[] = [];

  private intervalID: number | null = null;

  connectedCallback() {
    super.connectedCallback();
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
        <div class="panel-stack">
          ${this.renderRunPanel()} ${this.renderModePanel(frame)}
          ${this.renderControlPanel("stocks")}
          ${this.renderControlPanel("land")} ${this.renderControlPanel("crop")}
          ${this.renderControlPanel("food")}
          ${this.renderControlPanel("population")}
        </div>
        <div class="stage">
          ${this.renderCapacityStats(frame)} ${this.renderCapacityGraph()}
          ${this.renderFoodGraph()} ${this.renderFlowPanel(frame)}
        </div>
      </main>
    `;
  }

  private renderRunPanel(): TemplateResult {
    return html`
      <hud-surface>
        <hud-surface-header>
          <hud-label>Population Food Dynamics</hud-label>
          <hud-pill tone=${this.running ? "green" : "blue"}>
            T${this.tick}
          </hud-pill>
        </hud-surface-header>
        <hud-surface-body>
          <hud-stack>
            <div class="summary">
              This combines land max population, temperature-driven crop yield,
              food stock, food-supported population, and shortage-driven
              birth/death pressure.
            </div>
            <hud-action-group>
              <hud-button
                data-action="toggle"
                variant=${this.running ? "active" : "default"}
                @click=${this.toggleRunning}
              >
                ${this.running ? "Pause" : "Play"}
              </hud-button>
              <hud-button data-action="step" @click=${this.step}
                >Step</hud-button
              >
              <hud-button data-action="reset" @click=${this.reset}
                >Reset</hud-button
              >
            </hud-action-group>
          </hud-stack>
        </hud-surface-body>
      </hud-surface>
    `;
  }

  private renderModePanel(frame: SimulatorFrame): TemplateResult {
    return html`
      <hud-surface>
        <hud-surface-header>
          <hud-label>Reconciliation</hud-label>
        </hud-surface-header>
        <hud-surface-body>
          <hud-stack>
            <hud-form-row>
              <hud-field-label>Mode</hud-field-label>
              <hud-select
                data-capacity-mode
                .options=${capacityModeOptions}
                .value=${this.capacityMode}
                @value-change=${this.handleCapacityModeChange}
              ></hud-select>
            </hud-form-row>
            <div class="summary">${this.modeDescription()}</div>
            <div class="constraint">
              Limiting now:
              ${frame.landCapacity <= frame.foodSupportedPopulation
                ? "land"
                : "food"}
            </div>
          </hud-stack>
        </hud-surface-body>
      </hud-surface>
    `;
  }

  private renderControlPanel(section: Section): TemplateResult {
    const sectionControls = controls.filter(
      (control) => control.section === section,
    );
    return html`
      <hud-surface>
        <hud-surface-header>
          <hud-label>${sectionTitle(section)}</hud-label>
        </hud-surface-header>
        <hud-surface-body>
          <hud-stack>
            ${sectionControls.map((control) => this.renderControl(control))}
          </hud-stack>
        </hud-surface-body>
      </hud-surface>
    `;
  }

  private renderControl(control: NumberControl): TemplateResult {
    const value = this.simulator[control.key as keyof SimulatorState];
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
              this.setValue(control.key, numberFromEvent(event))}
          ></hud-range>
          <hud-input
            data-control-input=${control.key}
            type="number"
            .value=${String(roundForDisplay(value))}
            @value-change=${(event: CustomEvent<{ value: string | number }>) =>
              this.setValue(control.key, numberFromEvent(event))}
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

  private renderCapacityStats(frame: SimulatorFrame): TemplateResult {
    return html`
      <hud-surface>
        <hud-surface-header>
          <hud-label>Current System State</hud-label>
        </hud-surface-header>
        <hud-surface-body>
          <hud-stat-grid columns="4">
            <hud-stat
              label="Current pop"
              value=${formatValue(frame.population)}
            ></hud-stat>
            <hud-stat
              label="Land max pop"
              value=${formatValue(frame.landCapacity)}
            ></hud-stat>
            <hud-stat
              label="Food-supported pop"
              value=${formatValue(frame.foodSupportedPopulation)}
            ></hud-stat>
            <hud-stat
              label="Effective cap"
              value=${formatValue(frame.effectiveCapacity)}
            ></hud-stat>
            <hud-stat
              label="Tiles"
              value=${formatValue(frame.tilesOwned)}
            ></hud-stat>
            <hud-stat
              label="Food stock"
              value=${formatValue(frame.food)}
            ></hud-stat>
            <hud-stat
              label="Food allocation"
              value=${`${formatValue(
                this.simulator.foodAllocationToPopulation * 100,
              )}%`}
            ></hud-stat>
            <hud-stat
              label="Food shortage"
              value=${`${formatValue(frame.foodShortageRatio * 100)}%`}
            ></hud-stat>
            <hud-stat
              label="Pop delta"
              value=${formatValue(frame.populationGrowth)}
            ></hud-stat>
          </hud-stat-grid>
        </hud-surface-body>
      </hud-surface>
    `;
  }

  private renderCapacityGraph(): TemplateResult {
    const frames =
      this.history.length > 0 ? this.history : [this.currentFrame()];
    return html`
      <div class="graph">
        <div class="graph-title">
          <span>Population And Carrying Capacities</span>
          <span class="graph-readout">${frames.length} samples</span>
        </div>
        ${renderSeriesGraph(
          [
            {
              label: "Population",
              color: "#4ade80",
              points: frames.map((frame) => ({
                x: frame.tick,
                y: frame.population,
              })),
            },
            {
              label: "Land max pop",
              color: "#38bdf8",
              points: frames.map((frame) => ({
                x: frame.tick,
                y: frame.landCapacity,
              })),
            },
            {
              label: "Food-supported pop",
              color: "#facc15",
              points: frames.map((frame) => ({
                x: frame.tick,
                y: frame.foodSupportedPopulation,
              })),
            },
          ],
          "Tick",
          "Population",
        )}
      </div>
    `;
  }

  private renderFoodGraph(): TemplateResult {
    const frames =
      this.history.length > 0 ? this.history : [this.currentFrame()];
    return html`
      <div class="graph">
        <div class="graph-title">
          <span>Food Stock And Flow</span>
          <span class="graph-readout">
            ${formatValue(frames[frames.length - 1].foodProduced)} in/tick
          </span>
        </div>
        ${renderSeriesGraph(
          [
            {
              label: "Food stock",
              color: "#facc15",
              points: frames.map((frame) => ({
                x: frame.tick,
                y: frame.food,
              })),
            },
            {
              label: "Food produced",
              color: "#22c55e",
              points: frames.map((frame) => ({
                x: frame.tick,
                y: frame.foodProduced,
              })),
            },
            {
              label: "Food needed",
              color: "#fb7185",
              points: frames.map((frame) => ({
                x: frame.tick,
                y: frame.foodNeeded,
              })),
            },
          ],
          "Tick",
          "Food",
        )}
      </div>
    `;
  }

  private renderFlowPanel(frame: SimulatorFrame): TemplateResult {
    return html`
      <hud-surface>
        <hud-surface-header>
          <hud-label>Tick Flow</hud-label>
        </hud-surface-header>
        <hud-surface-body>
          <hud-stat-grid columns="4">
            <hud-stat
              label="Crop productivity"
              value=${`${formatValue(frame.productivity * 100)}%`}
            ></hud-stat>
            <hud-stat
              label="Food / tile"
              value=${formatValue(frame.foodPerTile)}
            ></hud-stat>
            <hud-stat
              label="Food in"
              value=${formatValue(frame.foodProduced)}
            ></hud-stat>
            <hud-stat
              label="Food out"
              value=${formatValue(frame.foodConsumed)}
            ></hud-stat>
          </hud-stat-grid>
        </hud-surface-body>
      </hud-surface>
    `;
  }

  private handleCapacityModeChange = (
    event: CustomEvent<{ value: CapacityMode }>,
  ) => {
    this.capacityMode = event.detail.value;
    this.recordCurrentFrame();
  };

  private modeDescription(): string {
    if (this.capacityMode === "hard-min-cap") {
      return "Population growth targets min(land max population, food-supported population). This removes most overshoot and makes food a hard capacity.";
    }
    return "Population growth targets land max population. Food shortage separately suppresses births and adds famine deaths, so overshoot and recovery can emerge.";
  }

  private toggleRunning = () => {
    if (this.running) {
      this.stop();
      return;
    }
    this.running = true;
    this.intervalID = window.setInterval(() => this.step(), STEP_INTERVAL_MS);
  };

  private stop() {
    this.running = false;
    if (this.intervalID !== null) {
      window.clearInterval(this.intervalID);
      this.intervalID = null;
    }
  }

  private step = () => {
    const frame = this.currentFrame();
    const nextState: SimulatorState = {
      ...this.simulator,
      food: Math.max(
        0,
        this.simulator.food + frame.foodProduced - frame.foodConsumed,
      ),
      population: Math.max(
        0,
        this.simulator.population + frame.populationGrowth,
      ),
      nutritionHealth: frame.nutritionHealth,
      tilesOwned: Math.min(
        this.simulator.maxTiles,
        this.simulator.tilesOwned + this.simulator.tileExpansionPerTick,
      ),
    };
    this.simulator = nextState;
    this.tick += 1;
    this.recordFrame({
      ...this.currentFrameFromState(nextState),
      tick: this.tick,
    });
  };

  private reset = () => {
    this.stop();
    this.simulator = { ...DEFAULT_STATE };
    this.tick = 0;
    this.capacityMode = "hard-min-cap";
    this.history = [];
    this.recordCurrentFrame();
  };

  private setValue(key: ControlKey, value: number) {
    const control = controls.find((candidate) => candidate.key === key);
    if (!control || !Number.isFinite(value)) {
      return;
    }
    const next = clamp(value, control.min, control.max);
    this.simulator = {
      ...this.simulator,
      [key]: next,
    };
    if (key === "tilesOwned" && next > this.simulator.maxTiles) {
      this.simulator = {
        ...this.simulator,
        maxTiles: next,
      };
    }
    if (key === "maxTiles" && next < this.simulator.tilesOwned) {
      this.simulator = {
        ...this.simulator,
        tilesOwned: next,
      };
    }
    this.recordCurrentFrame();
  }

  private recordCurrentFrame() {
    this.recordFrame(this.currentFrame());
  }

  private recordFrame(frame: SimulatorFrame) {
    this.history = [...this.history, frame].slice(-HISTORY_LIMIT);
  }

  private currentFrame(): SimulatorFrame {
    return this.currentFrameFromState(this.simulator);
  }

  private currentFrameFromState(state: SimulatorState): SimulatorFrame {
    const agriculture = evaluateAgricultureSystem(
      this.agricultureParams(state),
      {
        temperature: state.temperature,
        tilesOwned: state.tilesOwned,
      },
    );
    const mechanics = this.mechanics(state);
    const food = evaluateFoodSystem(mechanics, {
      stock: state.food,
      produced: agriculture.foodProduced,
      population: state.population,
      mobilizedPopulation: 0,
      warFoodConsumptionMultiplier: 1,
    });
    const landCapacity = state.tilesOwned * state.maxPopulationPerTile;
    const foodSupportedPopulation =
      state.foodConsumptionPerPopulation <= 0
        ? Number.POSITIVE_INFINITY
        : (agriculture.foodProduced * state.foodAllocationToPopulation) /
          state.foodConsumptionPerPopulation;
    const effectiveCapacity = Math.min(landCapacity, foodSupportedPopulation);
    const population = evaluatePopulationSystem(mechanics, {
      population: state.population,
      tilesOwned: state.tilesOwned,
      maxPopulationOverride:
        this.capacityMode === "hard-min-cap" ? effectiveCapacity : 0,
      capacityMultiplier: 1,
      growthMultiplier: 1,
      foodSatisfactionRatio:
        this.capacityMode === "hard-min-cap" ? 1 : food.satisfactionRatio,
      nutritionHealth: state.nutritionHealth,
    });

    return {
      tick: this.tick,
      temperature: agriculture.temperature,
      tilesOwned: state.tilesOwned,
      productivity: agriculture.temperatureProductivity,
      foodPerTile: agriculture.foodPerTile,
      foodProduced: agriculture.foodProduced,
      foodNeeded: food.needed,
      foodConsumed: food.consumed,
      foodShortageRatio: food.shortageRatio,
      nutritionHealth: population.nutritionHealth,
      food: state.food,
      population: state.population,
      populationGrowth: population.growth,
      landCapacity,
      foodSupportedPopulation,
      effectiveCapacity,
    };
  }

  private agricultureParams(
    state: SimulatorState = this.simulator,
  ): AgricultureSystemParams {
    return {
      baseFoodPerTile: state.baseFoodPerTile,
      optimalTemperature: state.optimalTemperature,
      coldSensitivity: state.coldSensitivity,
      heatSensitivity: state.heatSensitivity,
      technologyMultiplier: state.technologyMultiplier,
    };
  }

  private mechanics(
    state: SimulatorState = this.simulator,
  ): PopulationResourceMechanicsConfig {
    return {
      ...DEFAULT_MECHANICS_CONFIG.populationResources,
      populationFoodConstraintMode: this.capacityMode,
      foodAllocationToPopulation: state.foodAllocationToPopulation,
      foodConsumptionPerPopulation: state.foodConsumptionPerPopulation,
      populationGrowthRate: state.populationGrowthRate,
      maxPopulationPerTile: state.maxPopulationPerTile,
      birthNutritionThreshold: state.birthNutritionThreshold,
      survivalNutritionThreshold: state.survivalNutritionThreshold,
      starvationDamageRate: state.starvationDamageRate,
      nutritionRecoveryRate: state.nutritionRecoveryRate,
      starvationMortalityScale: state.starvationMortalityScale,
    };
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

function sectionTitle(section: Section): string {
  switch (section) {
    case "stocks":
      return "Live Stocks";
    case "land":
      return "Land Dynamics";
    case "crop":
      return "Crop Yield";
    case "food":
      return "Food Consumption";
    case "population":
      return "Population";
  }
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
  return Math.round(value * 1000) / 1000;
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

declare global {
  interface HTMLElementTagNameMap {
    "population-food-systems-sandbox": PopulationFoodSystemsSandbox;
  }
}

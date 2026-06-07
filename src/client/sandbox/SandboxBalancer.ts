import { css, html, LitElement, nothing, svg, type TemplateResult } from "lit";
import { customElement, state } from "lit/decorators.js";
import { z } from "zod";
import type {
  MechanicsConfig,
  PopulationResourceMechanicsConfig,
} from "../../core/configuration/MechanicsConfig";
import {
  DEFAULT_MECHANICS_CONFIG,
  MechanicsConfigSchema,
  resolveMechanicsConfig,
} from "../../core/configuration/MechanicsConfig";
import { Difficulty, GameMapType, GameMode } from "../../core/game/Game";
import { createZeroResources } from "../../core/game/Resources";
import { GameStartInfoSchema } from "../../core/Schemas";
import { generateID } from "../../core/Util";
import { evaluateFoodSystem } from "../../games/openfront/systems/models/FoodSystem";
import { evaluatePopulationSystem } from "../../games/openfront/systems/models/PopulationSystem";
import { evaluateResourceProductionSystem } from "../../games/openfront/systems/models/ResourceProductionSystem";
import "../hud/ui";
import type {
  HudSegmentedItem,
  HudSelectOption,
} from "../hud/ui/HudComponents";
import type { JoinLobbyEvent } from "../Main";
import { MS_PER_TICK } from "../render/GameConstants";
import { createSinglePlayerGameStartInfo } from "../utilities/SinglePlayerGameStart";

type PopulationNumberKey = Exclude<
  keyof PopulationResourceMechanicsConfig,
  | "terrainWeights"
  | "populationFoodConstraintMode"
  | "nationCapacityMultipliers"
  | "nationTroopGrowthMultipliers"
  | "nationResourceRegenMultipliers"
>;
type TerrainKey = keyof PopulationResourceMechanicsConfig["terrainWeights"];
type ResourceKey =
  keyof PopulationResourceMechanicsConfig["terrainWeights"]["plains"];
type LaunchMode = "isolated" | "scenario";
type PopulationTab = "growth" | "resources" | "food" | "terrain" | "ai";
type ControlScale = "linear" | "log";
type GraphId =
  | "max-population"
  | "population-growth"
  | "population-over-time"
  | "resource-regen"
  | "food-shortage"
  | "food-wartime"
  | "capacity";

interface SandboxSettings {
  mechanics: MechanicsConfig;
  launchMode: LaunchMode;
  bots: number;
  nations: number;
  difficulty: Difficulty;
  autoStart: boolean;
}

interface NumberControl {
  key: PopulationNumberKey;
  tab: PopulationTab;
  label: string;
  description: string;
  min: number;
  max: number;
  step: number;
  scale?: ControlScale;
  logMin?: number;
  integer?: boolean;
}

interface GraphPoint {
  x: number;
  y: number;
  label: string;
}

interface GraphMarker {
  x: number;
  label: string;
}

interface GraphHover {
  id: GraphId;
  index: number;
}

interface SandboxDiagnostics {
  gameID: string;
  tick: number;
  troops: number;
  troopIncreaseRate: number;
  effectiveTroopCapacity: number;
  biomassSupportedTroopCapacity: number;
  resources: Record<ResourceKey, number>;
  resourceCapacity: Record<ResourceKey, number>;
}

const populationControls: NumberControl[] = [
  {
    key: "populationGrowthRate",
    tab: "growth",
    label: "Growth rate (r)",
    description:
      "Maximum per-capita population growth rate in dN/dt = rN(1 - N / max population). Higher values refill population faster below the cap; lower values slow recovery.",
    min: 0,
    max: 1,
    step: 0.0001,
    scale: "log",
    logMin: 0.0001,
  },
  {
    key: "initialPopulation",
    tab: "growth",
    label: "Initial population (N0)",
    description:
      "Population at game start. Higher values start players closer to max population; values above max population shrink until they fall under the cap.",
    min: 0,
    max: 500000,
    step: 5000,
    scale: "log",
    logMin: 1,
    integer: true,
  },
  {
    key: "maxPopulationPerTile",
    tab: "growth",
    label: "Max population / tile",
    description:
      "Population each owned tile can support. Max population = tiles owned * this value. Higher values make land support larger populations; lower values make the cap tighter.",
    min: 0,
    max: 250000,
    step: 5000,
    scale: "log",
    logMin: 1,
    integer: true,
  },
  {
    key: "foodAllocationToPopulation",
    tab: "food",
    label: "Food allocation",
    description:
      "Share of current food production made available for feeding population this tick. Lower values reserve more new production as surplus but create shortages sooner.",
    min: 0,
    max: 1,
    step: 0.01,
  },
  {
    key: "foodConsumptionPerPopulation",
    tab: "food",
    label: "Food / population",
    description:
      "Food consumed by each population unit per tick. Higher values make food shortages happen earlier; zero disables baseline food consumption.",
    min: 0,
    max: 20,
    step: 0.1,
    scale: "log",
    logMin: 0.0001,
  },
  {
    key: "foodConsumptionPerMobilizedPopulation",
    tab: "food",
    label: "Food / mobilized",
    description:
      "Extra food consumed by mobilized population per tick. Higher values make active wars strain food faster.",
    min: 0,
    max: 60,
    step: 0.1,
    scale: "log",
    logMin: 0.0001,
  },
  {
    key: "wartimeFoodConsumptionMultiplier",
    tab: "food",
    label: "Wartime food x",
    description:
      "Multiplier applied to total food need while population is mobilized. Higher values make wars more expensive to feed.",
    min: 0,
    max: 5,
    step: 0.01,
  },
  {
    key: "birthNutritionThreshold",
    tab: "food",
    label: "Birth nutrition threshold",
    description:
      "Minimum food satisfaction needed before population can reproduce.",
    min: 0,
    max: 1,
    step: 0.01,
  },
  {
    key: "survivalNutritionThreshold",
    tab: "food",
    label: "Survival nutrition threshold",
    description:
      "Food satisfaction below this value starts applying starvation death pressure.",
    min: 0,
    max: 1,
    step: 0.01,
  },
  {
    key: "starvationDamageRate",
    tab: "food",
    label: "Starvation damage",
    description:
      "How quickly nutrition health falls while population is underfed.",
    min: 0,
    max: 0.1,
    step: 0.001,
  },
  {
    key: "nutritionRecoveryRate",
    tab: "food",
    label: "Nutrition recovery",
    description:
      "How quickly nutrition health recovers when population is fully fed.",
    min: 0,
    max: 0.1,
    step: 0.001,
  },
  {
    key: "starvationMortalityScale",
    tab: "food",
    label: "Starvation mortality",
    description:
      "Maximum per-tick death pressure once nutrition health is depleted.",
    min: 0,
    max: 0.02,
    step: 0.0001,
  },
  {
    key: "minBaseResourceCapacity",
    tab: "resources",
    label: "Base capacity",
    description:
      "Minimum storage for each resource before territory scaling is considered.",
    min: 0,
    max: 250000,
    step: 5000,
  },
  {
    key: "resourceCapacityTerritoryDivisor",
    tab: "resources",
    label: "Territory divisor",
    description:
      "Divides the territory-derived capacity. Higher values reduce storage from land ownership.",
    min: 0.25,
    max: 12,
    step: 0.25,
  },
  {
    key: "siloResourceCapacityIncrease",
    tab: "resources",
    label: "Silo capacity",
    description:
      "Additional storage added by each completed silo level for every resource.",
    min: 0,
    max: 1000000,
    step: 10000,
  },
  {
    key: "resourceRegenBase",
    tab: "resources",
    label: "Regen base",
    description:
      "Flat resource generation term before stockpile scaling and cap slowdown are applied.",
    min: 0,
    max: 50,
    step: 0.5,
  },
  {
    key: "resourceRegenExponent",
    tab: "resources",
    label: "Regen exponent",
    description:
      "Exponent applied to current stockpile in the resource generation curve. Higher values make stored resources amplify production more strongly.",
    min: 0.05,
    max: 2,
    step: 0.01,
  },
  {
    key: "resourceRegenDivisor",
    tab: "resources",
    label: "Regen divisor",
    description:
      "Divides the stockpile-powered part of the regen curve. Higher values flatten resource growth.",
    min: 0.25,
    max: 12,
    step: 0.25,
  },
  {
    key: "passiveResourceRegenMultiplier",
    tab: "resources",
    label: "Passive regen",
    description:
      "Final multiplier on passive resource generation before terrain splits total production into food, energy, and materials.",
    min: 0,
    max: 2,
    step: 0.01,
  },
  {
    key: "botCapacityMultiplier",
    tab: "ai",
    label: "Bot capacity",
    description:
      "Multiplier applied to bot troop and resource capacity relative to the normal player formula.",
    min: 0,
    max: 2,
    step: 0.01,
  },
  {
    key: "botTroopGrowthMultiplier",
    tab: "ai",
    label: "Bot growth",
    description:
      "Multiplier applied to bot troop growth after the logistic troop formula is calculated.",
    min: 0,
    max: 2,
    step: 0.01,
  },
  {
    key: "botResourceRegenMultiplier",
    tab: "ai",
    label: "Bot regen",
    description:
      "Multiplier applied to bot passive resource generation before terrain splits production by resource type.",
    min: 0,
    max: 2,
    step: 0.01,
  },
];

const terrainKeys: TerrainKey[] = ["plains", "highland", "mountain"];
const resourceKeys: ResourceKey[] = ["food", "energy", "materials"];

const difficultyOptions: HudSelectOption[] = Object.values(Difficulty).map(
  (difficulty) => ({
    label: difficulty,
    value: difficulty,
  }),
);

const launchModeItems: HudSegmentedItem[] = [
  { id: "isolated", label: "Isolated", value: "0 bots" },
  { id: "scenario", label: "Scenario", value: "bots" },
];
const populationTabItems: HudSegmentedItem[] = [
  { id: "growth", label: "Growth", value: "troops" },
  { id: "resources", label: "Resources", value: "stock" },
  { id: "food", label: "Food", value: "flows" },
  { id: "terrain", label: "Terrain", value: "yield" },
  { id: "ai", label: "AI", value: "bots" },
];
const populationTabOptions: HudSelectOption[] = populationTabItems.map(
  (item) => ({
    label: `${item.label}${item.value ? ` - ${item.value}` : ""}`,
    value: item.id,
  }),
);
const populationFoodConstraintOptions: HudSelectOption[] = [
  {
    label: "Hard min capacity",
    value: "hard-min-cap",
  },
  {
    label: "Dynamic shortage pressure",
    value: "dynamic-shortage",
  },
];
const SANDBOX_SETTINGS_STORAGE_KEY = "openfront.sandbox.settings.v1";
const AVERAGE_STARTING_TILES = 2_500;
const LATE_GAME_TILES = 562_500;
const DEFAULT_SANDBOX_SETTINGS: SandboxSettings = {
  mechanics: cloneMechanics(DEFAULT_MECHANICS_CONFIG),
  launchMode: "isolated",
  bots: 0,
  nations: 0,
  difficulty: Difficulty.Easy,
  autoStart: false,
};

const SandboxSettingsSchema = z.object({
  mechanics: MechanicsConfigSchema,
  launchMode: z.enum(["isolated", "scenario"]).default("isolated"),
  bots: z.number().int().min(0).max(400).default(0),
  nations: z.number().int().min(0).max(400).default(0),
  difficulty: z.enum(Difficulty).default(Difficulty.Easy),
  autoStart: z.boolean().default(false),
});

function mechanicsToJson(mechanics: MechanicsConfig): string {
  return JSON.stringify(mechanics, null, 2);
}

function cloneMechanics(mechanics: MechanicsConfig): MechanicsConfig {
  return resolveMechanicsConfig(mechanics);
}

function formatValue(value: number): string {
  if (Math.abs(value) >= 1000) {
    return Math.round(value).toLocaleString("en-US");
  }
  return Number.isInteger(value) ? String(value) : value.toFixed(3);
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function numberFromEvent(event: CustomEvent<{ value: string | number }>) {
  const value = Number(event.detail.value);
  return Number.isFinite(value) ? value : 0;
}

function readPersistedSettings(): SandboxSettings {
  try {
    const raw = window.localStorage.getItem(SANDBOX_SETTINGS_STORAGE_KEY);
    if (!raw) {
      return { ...DEFAULT_SANDBOX_SETTINGS };
    }

    const parsed = SandboxSettingsSchema.safeParse(JSON.parse(raw));
    if (!parsed.success) {
      return { ...DEFAULT_SANDBOX_SETTINGS };
    }

    return {
      ...parsed.data,
      mechanics: resolveMechanicsConfig(parsed.data.mechanics),
    };
  } catch {
    return { ...DEFAULT_SANDBOX_SETTINGS };
  }
}

function writePersistedSettings(settings: SandboxSettings): void {
  try {
    window.localStorage.setItem(
      SANDBOX_SETTINGS_STORAGE_KEY,
      JSON.stringify(settings),
    );
  } catch {
    // Ignore storage failures; the sandbox still works for the current page.
  }
}

@customElement("sandbox-balancer")
export class SandboxBalancer extends LitElement {
  static styles = css`
    :host {
      position: fixed;
      inset: 0;
      z-index: 1200;
      display: block;
      pointer-events: none;
      color: #e7e5df;
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
      grid-template-columns: minmax(320px, 420px) minmax(0, 1fr);
      gap: 12px;
      padding: 12px;
      pointer-events: none;
    }

    .panel-stack {
      position: relative;
      z-index: 20;
      pointer-events: auto;
      display: grid;
      align-self: start;
      gap: 10px;
      max-height: calc(100vh - 24px);
      overflow: auto;
    }

    .stage {
      min-height: calc(100vh - 24px);
      pointer-events: none;
    }

    .control-pair {
      display: grid;
      grid-template-columns: minmax(0, 1fr) 76px;
      gap: 6px;
      align-items: center;
    }

    .terrain-grid {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 6px;
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
      width: min(260px, calc(100vw - 32px));
      transform: none;
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

    .tab-copy {
      color: #cbd5e1;
      font-size: 11px;
      line-height: 1.4;
    }

    .graph-stack {
      display: grid;
      gap: 8px;
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

    .graph-subtitle {
      margin-top: 2px;
      color: #94a3b8;
      font-size: 10px;
      line-height: 1.35;
    }

    svg.curve {
      display: block;
      width: 100%;
      height: 150px;
      margin-top: 6px;
      overflow: visible;
      touch-action: none;
    }

    .axis {
      stroke: rgba(226, 232, 240, 0.8);
      stroke-width: 1.25;
    }

    .grid {
      stroke: rgba(203, 213, 225, 0.34);
      stroke-width: 1.2;
    }

    .tick {
      stroke: rgba(226, 232, 240, 0.75);
      stroke-width: 1.2;
    }

    .curve-line {
      fill: none;
      stroke: #38bdf8;
      stroke-width: 2.4;
      vector-effect: non-scaling-stroke;
    }

    .curve-fill {
      fill: rgba(56, 189, 248, 0.12);
    }

    .hover-line {
      stroke: rgba(250, 204, 21, 0.75);
      stroke-width: 1;
      vector-effect: non-scaling-stroke;
    }

    .hover-dot {
      fill: #facc15;
      stroke: #0f172a;
      stroke-width: 2;
    }

    .marker-line {
      stroke: rgba(251, 146, 60, 0.85);
      stroke-dasharray: 3 3;
      stroke-width: 1.25;
      vector-effect: non-scaling-stroke;
    }

    .marker-label {
      fill: #fed7aa;
      font-size: 8.5px;
      font-weight: 700;
    }

    .axis-label {
      fill: #94a3b8;
      font-size: 9px;
    }

    .tick-label {
      fill: #f8fafc;
      font-size: 8.5px;
      font-weight: 650;
    }

    .mix-grid {
      display: grid;
      gap: 7px;
    }

    .mix-row {
      display: grid;
      grid-template-columns: 5.5rem minmax(0, 1fr);
      align-items: center;
      gap: 8px;
      color: #cbd5e1;
      font-size: 11px;
      text-transform: capitalize;
    }

    .mix-bar {
      display: grid;
      grid-template-columns: var(--food) var(--energy) var(--materials);
      height: 12px;
      overflow: hidden;
      border-radius: 3px;
      background: rgba(15, 23, 42, 0.7);
    }

    .mix-food {
      background: #65a30d;
    }

    .mix-energy {
      background: #0284c7;
    }

    .mix-materials {
      background: #a16207;
    }

    .json-error {
      color: #fca5a5;
      font-size: 10px;
      line-height: 1.35;
      white-space: pre-wrap;
    }

    @media (max-width: 900px) {
      .shell {
        grid-template-columns: 1fr;
      }

      .panel-stack {
        max-height: none;
      }
    }
  `;

  @state() private pendingMechanics: MechanicsConfig = cloneMechanics(
    DEFAULT_MECHANICS_CONFIG,
  );
  @state() private activeMechanics: MechanicsConfig | null = null;
  @state() private jsonText = mechanicsToJson(DEFAULT_MECHANICS_CONFIG);
  @state() private jsonError = "";
  @state() private launchMode: LaunchMode = "isolated";
  @state() private bots = 0;
  @state() private nations = 0;
  @state() private difficulty: Difficulty = Difficulty.Easy;
  @state() private running = false;
  @state() private paused = false;
  @state() private diagnostics: SandboxDiagnostics | null = null;
  @state() private activePopulationTab: PopulationTab = "growth";
  @state() private graphHover: GraphHover | null = null;

  connectedCallback() {
    super.connectedCallback();
    const settings = readPersistedSettings();
    this.applySettings(settings);
    window.addEventListener(
      "sandbox-diagnostics",
      this.handleDiagnostics as EventListener,
    );
    if (settings.autoStart) {
      this.updateComplete.then(() => window.setTimeout(() => this.startRun()));
    }
  }

  disconnectedCallback() {
    window.removeEventListener(
      "sandbox-diagnostics",
      this.handleDiagnostics as EventListener,
    );
    super.disconnectedCallback();
  }

  render() {
    const dirty =
      this.activeMechanics !== null &&
      mechanicsToJson(this.pendingMechanics) !==
        mechanicsToJson(this.activeMechanics);

    return html`
      <div class="shell">
        <div class="panel-stack">
          ${this.renderRunPanel(dirty)} ${this.renderMechanicsPanel()}
          ${this.renderJsonPanel()} ${this.renderDiagnosticsPanel()}
        </div>
        <div class="stage" aria-label="Sandbox game stage"></div>
      </div>
    `;
  }

  private renderRunPanel(dirty: boolean): TemplateResult {
    return html`
      <hud-surface>
        <hud-surface-header>
          <hud-label size="lg">Mechanics Sandbox</hud-label>
          <hud-pill tone=${dirty ? "orange" : this.running ? "green" : "blue"}>
            ${dirty ? "Pending" : this.running ? "Active" : "Ready"}
          </hud-pill>
        </hud-surface-header>
        <hud-surface-body>
          <hud-stack density="loose">
            <hud-form-row>
              <hud-field-label>Mode</hud-field-label>
              <hud-segmented-control
                .items=${launchModeItems}
                .selected=${this.launchMode}
                @selection-change=${this.handleLaunchModeChange}
              ></hud-segmented-control>
            </hud-form-row>
            <hud-form-row>
              <hud-field-label>Difficulty</hud-field-label>
              <hud-select
                .options=${difficultyOptions}
                .value=${this.difficulty}
                @value-change=${this.handleDifficultyChange}
              ></hud-select>
            </hud-form-row>
            <hud-form-row>
              <hud-field-label>Bots</hud-field-label>
              <div class="control-pair">
                <hud-range
                  min="0"
                  max="400"
                  step="1"
                  .value=${this.bots}
                  label="Bots"
                  ?disabled=${this.launchMode === "isolated"}
                  @value-change=${this.handleBotsChange}
                ></hud-range>
                <hud-input
                  type="number"
                  .value=${String(this.bots)}
                  ?disabled=${this.launchMode === "isolated"}
                  @value-change=${this.handleBotsChange}
                ></hud-input>
              </div>
            </hud-form-row>
            <hud-form-row>
              <hud-field-label>Nations</hud-field-label>
              <div class="control-pair">
                <hud-range
                  min="0"
                  max="400"
                  step="1"
                  .value=${this.nations}
                  label="Nations"
                  ?disabled=${this.launchMode === "isolated"}
                  @value-change=${this.handleNationsChange}
                ></hud-range>
                <hud-input
                  type="number"
                  .value=${String(this.nations)}
                  ?disabled=${this.launchMode === "isolated"}
                  @value-change=${this.handleNationsChange}
                ></hud-input>
              </div>
            </hud-form-row>
            <hud-action-group>
              <hud-button
                data-action="start"
                variant="active"
                @click=${this.startRun}
              >
                ${this.running ? "Refresh" : "Start"}
              </hud-button>
              <hud-button
                data-action="pause"
                ?disabled=${!this.running}
                @click=${this.togglePause}
              >
                ${this.paused ? "Resume" : "Pause"}
              </hud-button>
              <hud-button data-action="reset" @click=${this.resetPending}>
                Defaults
              </hud-button>
            </hud-action-group>
          </hud-stack>
        </hud-surface-body>
      </hud-surface>
    `;
  }

  private renderMechanicsPanel(): TemplateResult {
    const controls = populationControls.filter(
      (control) => control.tab === this.activePopulationTab,
    );
    return html`
      <hud-surface>
        <hud-surface-header>
          <hud-label>Population And Resources</hud-label>
        </hud-surface-header>
        <hud-surface-body>
          <hud-stack density="loose">
            <hud-form-row>
              <hud-field-label>Section</hud-field-label>
              <hud-select
                data-population-tabs
                .options=${populationTabOptions}
                .value=${this.activePopulationTab}
                @value-change=${this.handlePopulationTabChange}
              ></hud-select>
            </hud-form-row>
            <div class="tab-copy">${this.populationTabDescription()}</div>
            ${this.renderPopulationTabVisual()}
            ${this.activePopulationTab === "terrain"
              ? this.renderTerrainControls()
              : html`${this.activePopulationTab === "food"
                  ? this.renderFoodConstraintModeControl()
                  : nothing}
                ${controls.map((control) => this.renderNumberControl(control))}`}
          </hud-stack>
        </hud-surface-body>
      </hud-surface>
    `;
  }

  private renderFoodConstraintModeControl(): TemplateResult {
    return html`
      <hud-form-row>
        <hud-field-label>
          <span class="control-label">
            Food constraint
            ${this.renderHelp(
              "Hard min capacity makes food-supported population a real population cap. Dynamic shortage pressure keeps land as the cap and applies shortage as birth/death pressure.",
            )}
          </span>
        </hud-field-label>
        <hud-select
          data-food-constraint-mode
          .options=${populationFoodConstraintOptions}
          .value=${this.pendingMechanics.populationResources
            .populationFoodConstraintMode}
          @value-change=${this.handleFoodConstraintModeChange}
        ></hud-select>
      </hud-form-row>
    `;
  }

  private renderNumberControl(control: NumberControl): TemplateResult {
    const value = this.pendingMechanics.populationResources[control.key];
    const sliderValue = this.sliderValueForControl(control, value);
    return html`
      <hud-form-row>
        <hud-field-label>
          <span class="control-label">
            ${control.label} ${this.renderHelp(control.description)}
          </span>
        </hud-field-label>
        <div class="control-pair">
          <hud-range
            data-mechanic=${control.key}
            .min=${this.sliderMinForControl(control)}
            .max=${this.sliderMaxForControl(control)}
            .step=${this.sliderStepForControl(control)}
            .value=${sliderValue}
            .label=${control.label}
            @value-change=${(event: CustomEvent<{ value: string | number }>) =>
              this.setPopulationValue(
                control.key,
                this.valueFromSlider(control, numberFromEvent(event)),
              )}
          ></hud-range>
          <hud-input
            data-mechanic-input=${control.key}
            type="number"
            .value=${String(value)}
            @value-change=${(event: CustomEvent<{ value: string | number }>) =>
              this.setPopulationValue(control.key, numberFromEvent(event))}
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

  private sliderMinForControl(control: NumberControl): number {
    return control.scale === "log" ? 0 : control.min;
  }

  private sliderMaxForControl(control: NumberControl): number {
    return control.scale === "log" ? 1000 : control.max;
  }

  private sliderStepForControl(control: NumberControl): number {
    return control.scale === "log" ? 1 : control.step;
  }

  private sliderValueForControl(control: NumberControl, value: number): number {
    if (control.scale !== "log") return value;

    const min = control.logMin ?? Math.max(control.min, Number.EPSILON);
    const max = Math.max(min, control.max);
    const clamped = clamp(value <= 0 ? min : value, min, max);
    const minLog = Math.log10(min);
    const maxLog = Math.log10(max);
    return ((Math.log10(clamped) - minLog) / (maxLog - minLog)) * 1000;
  }

  private valueFromSlider(control: NumberControl, sliderValue: number): number {
    if (control.scale !== "log") {
      return this.normalizeControlValue(control, sliderValue);
    }

    const min = control.logMin ?? Math.max(control.min, Number.EPSILON);
    const max = Math.max(min, control.max);
    const minLog = Math.log10(min);
    const maxLog = Math.log10(max);
    const pct = clamp(sliderValue, 0, 1000) / 1000;
    return this.normalizeControlValue(
      control,
      10 ** (minLog + (maxLog - minLog) * pct),
    );
  }

  private normalizeControlValue(control: NumberControl, value: number): number {
    const clamped = clamp(value, control.min, control.max);
    if (control.integer) return Math.round(clamped);
    if (control.key === "populationGrowthRate") {
      return Number(clamped.toFixed(6));
    }
    return clamped;
  }

  private populationTabDescription(): string {
    switch (this.activePopulationTab) {
      case "growth":
        return "Controls the land-based population model before cities or biomass. Max population = tiles owned * max population / tile. Population changes by dN/dt = rN(1 - N / max population).";
      case "resources":
        return "Controls storage capacity and passive resource regeneration before terrain yield weights split output.";
      case "food":
        return "Controls explicit food consumption, war-driven food demand, and how food shortages affect population growth.";
      case "terrain":
        return "Controls how terrain composition splits generated resources between food, energy, and materials.";
      case "ai":
        return "Controls bot-specific multipliers applied after the human formulas are calculated.";
    }
  }

  private renderPopulationTabVisual(): TemplateResult {
    switch (this.activePopulationTab) {
      case "growth":
        return html`<div class="graph-stack">
          ${this.renderMaxPopulationGraph()}
          ${this.renderPopulationGrowthGraph()}
          ${this.renderPopulationOverTimeGraph()}
        </div>`;
      case "resources":
        return html`<div class="graph-stack">
          ${this.renderResourceRegenGraph()} ${this.renderCapacityGraph()}
        </div>`;
      case "food":
        return html`<div class="graph-stack">
          ${this.renderFoodShortageGraph()} ${this.renderWartimeFoodGraph()}
        </div>`;
      case "terrain":
        return this.renderTerrainMixPreview();
      case "ai":
        return this.renderAiPreview();
    }
  }

  private renderPopulationGrowthGraph(): TemplateResult {
    const mechanics = this.pendingMechanics.populationResources;
    const capacity = this.maxPopulationForTiles(AVERAGE_STARTING_TILES);
    const points: GraphPoint[] = Array.from({ length: 61 }, (_, index) => {
      const pct = index / 60;
      const population = pct * capacity;
      const growth = evaluatePopulationSystem(mechanics, {
        population,
        tilesOwned: AVERAGE_STARTING_TILES,
        maxPopulationOverride: 0,
        capacityMultiplier: 1,
        growthMultiplier: 1,
      }).growth;
      return {
        x: pct * 100,
        y: Math.max(0, growth),
        label: `${Math.round(pct * 100)}% max: +${formatValue(
          Math.max(0, growth),
        )} population/tick`,
      };
    });
    const n0Pct =
      capacity > 0 ? (mechanics.initialPopulation / capacity) * 100 : 0;

    return this.renderCurveGraph(
      "population-growth",
      "Population Growth Curve",
      `At ${formatValue(AVERAGE_STARTING_TILES)} tiles, max population is ${formatValue(
        capacity,
      )}. N0 is ${formatValue(mechanics.initialPopulation)} (${formatValue(
        n0Pct,
      )}% of max).`,
      points,
      "Current population (% of max)",
      "Population/tick",
      [{ x: n0Pct, label: "N0" }],
    );
  }

  private renderMaxPopulationGraph(): TemplateResult {
    const points: GraphPoint[] = this.logTileSamples().map((tiles) => {
      const capacity = this.maxPopulationForTiles(tiles);
      return {
        x: tiles,
        y: capacity,
        label: `${Math.round(tiles)} tiles: ${formatValue(
          capacity,
        )} max population`,
      };
    });

    return this.renderCurveGraph(
      "max-population",
      "Max Population / Tiles Owned",
      `Formula: max population = tiles owned * max population / tile. X-axis is logarithmic from ${formatValue(
        AVERAGE_STARTING_TILES,
      )} average starting tiles to ${formatValue(LATE_GAME_TILES)} late-game tiles.`,
      points,
      "Owned tiles",
      "Max population",
    );
  }

  private renderPopulationOverTimeGraph(): TemplateResult {
    const mechanics = this.pendingMechanics.populationResources;
    const capacity = this.maxPopulationForTiles(AVERAGE_STARTING_TILES);
    const maxTicks = this.populationSaturationTicks(
      mechanics.initialPopulation,
      capacity,
      mechanics.populationGrowthRate,
      0.9,
    );
    const sampleEveryTicks = Math.max(1, Math.ceil(maxTicks / 60));
    let population = Math.max(0, mechanics.initialPopulation);
    const points: GraphPoint[] = [];

    for (let tick = 0; tick <= maxTicks; tick += sampleEveryTicks) {
      points.push({
        x: tick,
        y: population,
        label: `T${tick} (${formatValue(
          (tick * MS_PER_TICK) / 1000,
        )}s): ${formatValue(population)} population`,
      });

      for (
        let step = 0;
        step < sampleEveryTicks && tick + step < maxTicks;
        step++
      ) {
        const delta = evaluatePopulationSystem(mechanics, {
          population,
          tilesOwned: AVERAGE_STARTING_TILES,
          maxPopulationOverride: 0,
          capacityMultiplier: 1,
          growthMultiplier: 1,
        }).growth;
        population = clamp(population + delta, 0, capacity);
      }
    }

    return this.renderCurveGraph(
      "population-over-time",
      "Population Over Time",
      `Discrete game ticks from N0=${formatValue(
        mechanics.initialPopulation,
      )} toward 90% of max population=${formatValue(
        capacity * 0.9,
      )} at ${formatValue(AVERAGE_STARTING_TILES)} owned tiles. ${formatValue(
        maxTicks / (1000 / MS_PER_TICK),
      )} seconds shown.`,
      points,
      "Ticks",
      "Population",
    );
  }

  private populationSaturationTicks(
    initialPopulation: number,
    capacity: number,
    growthRate: number,
    saturation: number,
  ): number {
    if (capacity <= 0 || growthRate <= 0 || initialPopulation <= 0) {
      return 1800;
    }

    const targetPopulation = capacity * saturation;
    const clampedInitial = clamp(initialPopulation, 0, capacity);
    if (clampedInitial >= targetPopulation) {
      return 120;
    }

    const initialOdds = (capacity - clampedInitial) / clampedInitial;
    const targetOdds = (capacity - targetPopulation) / targetPopulation;
    const ticks = Math.ceil(Math.log(initialOdds / targetOdds) / growthRate);
    return Math.max(120, ticks);
  }

  private renderResourceRegenGraph(): TemplateResult {
    const mechanics = this.pendingMechanics.populationResources;
    const capacity = 100_000;
    const points: GraphPoint[] = Array.from({ length: 61 }, (_, index) => {
      const pct = index / 60;
      const current = pct * capacity;
      const regenResult = evaluateResourceProductionSystem(mechanics, {
        resources: {
          food: BigInt(Math.floor(current)),
          energy: BigInt(Math.floor(current)),
          materials: BigInt(Math.floor(current)),
        },
        tilesOwned: AVERAGE_STARTING_TILES,
        siloLevels: 0,
        capacityMultiplier: 1,
        regenMultiplier: 1,
        terrainWeights: {
          food: 1,
          energy: 1,
          materials: 1,
        },
      });
      const regen =
        Number(regenResult.delta.food) +
        Number(regenResult.delta.energy) +
        Number(regenResult.delta.materials);
      return {
        x: pct * 100,
        y: Math.max(0, regen),
        label: `${Math.round(pct * 100)}% full: +${formatValue(
          Math.max(0, regen),
        )} total resources/tick`,
      };
    });

    return this.renderCurveGraph(
      "resource-regen",
      "Passive Resource Regen",
      "Shown before terrain splitting at a 100k resource cap.",
      points,
      "Current stockpile (% of cap)",
      "Resources/tick",
    );
  }

  private renderFoodShortageGraph(): TemplateResult {
    const mechanics = this.pendingMechanics.populationResources;
    const population = mechanics.initialPopulation;
    const produced = Number(
      evaluateResourceProductionSystem(mechanics, {
        resources: createZeroResources(),
        tilesOwned: AVERAGE_STARTING_TILES,
        siloLevels: 0,
        capacityMultiplier: 1,
        regenMultiplier: 1,
        terrainWeights: {
          food: 1,
          energy: 0,
          materials: 0,
        },
      }).delta.food,
    );
    const maxFood = Math.max(produced * 2, population, 100);
    const points: GraphPoint[] = Array.from({ length: 61 }, (_, index) => {
      const foodStock = (index / 60) * maxFood;
      const result = evaluateFoodSystem(mechanics, {
        stock: foodStock,
        produced,
        population,
        mobilizedPopulation: 0,
        warFoodConsumptionMultiplier: 1,
      });
      return {
        x: foodStock,
        y: result.shortageRatio * 100,
        label: `${formatValue(foodStock)} food: ${formatValue(
          result.shortageRatio * 100,
        )}% shortage, ${formatValue(result.consumed)} consumed`,
      };
    });

    return this.renderCurveGraph(
      "food-shortage",
      "Food Shortage From Stock",
      `Uses model outputs at ${formatValue(
        AVERAGE_STARTING_TILES,
      )} tiles and N=${formatValue(population)}. Higher food stock reduces shortage.`,
      points,
      "Food stock",
      "Shortage %",
    );
  }

  private renderWartimeFoodGraph(): TemplateResult {
    const mechanics = this.pendingMechanics.populationResources;
    const population = mechanics.initialPopulation;
    const foodStock = Math.max(population * 2, 100);
    const points: GraphPoint[] = Array.from({ length: 61 }, (_, index) => {
      const mobilized = population * (index / 60);
      const result = evaluateFoodSystem(mechanics, {
        stock: foodStock,
        produced: 0,
        population,
        mobilizedPopulation: mobilized,
        warFoodConsumptionMultiplier:
          mobilized > 0 ? mechanics.wartimeFoodConsumptionMultiplier : 1,
      });
      return {
        x: mobilized,
        y: result.needed,
        label: `${formatValue(mobilized)} mobilized: ${formatValue(
          result.needed,
        )} food needed/tick`,
      };
    });

    return this.renderCurveGraph(
      "food-wartime",
      "Wartime Food Need",
      "Shows how mobilized population and wartime multiplier increase total food demand.",
      points,
      "Mobilized population",
      "Food needed/tick",
    );
  }

  private maxPopulationForTiles(tiles: number): number {
    const mechanics = this.pendingMechanics.populationResources;
    return evaluatePopulationSystem(mechanics, {
      population: mechanics.initialPopulation,
      tilesOwned: Math.max(0, tiles),
      maxPopulationOverride: 0,
      capacityMultiplier: 1,
      growthMultiplier: 1,
    }).capacity;
  }

  private logTileSamples(): number[] {
    const minLog = Math.log10(AVERAGE_STARTING_TILES);
    const maxLog = Math.log10(LATE_GAME_TILES);
    return Array.from(
      { length: 61 },
      (_, index) => 10 ** (minLog + (maxLog - minLog) * (index / 60)),
    );
  }

  private renderCapacityGraph(): TemplateResult {
    const mechanics = this.pendingMechanics.populationResources;
    const points: GraphPoint[] = this.logTileSamples().map((tiles) => {
      const capacity = Number(
        evaluateResourceProductionSystem(mechanics, {
          resources: createZeroResources(),
          tilesOwned: tiles,
          siloLevels: 0,
          capacityMultiplier: 1,
          regenMultiplier: 0,
          terrainWeights: {
            food: 0,
            energy: 0,
            materials: 0,
          },
        }).capacity.food,
      );
      return {
        x: tiles,
        y: capacity,
        label: `${Math.round(tiles)} tiles: ${formatValue(
          capacity,
        )} resource cap before silos`,
      };
    });

    return this.renderCurveGraph(
      "capacity",
      "Territory Resource Capacity",
      `Per-resource capacity from owned land before silo bonuses and AI/nation multipliers. X-axis is logarithmic from ${formatValue(
        AVERAGE_STARTING_TILES,
      )} to ${formatValue(LATE_GAME_TILES)} tiles.`,
      points,
      "Owned tiles",
      "Capacity",
    );
  }

  private renderCurveGraph(
    id: GraphId,
    title: string,
    subtitle: string,
    points: GraphPoint[],
    xLabel: string,
    yLabel: string,
    markers: GraphMarker[] = [],
  ): TemplateResult {
    const width = 320;
    const height = 150;
    const left = 36;
    const right = 8;
    const top = 10;
    const bottom = 28;
    const plotW = width - left - right;
    const plotH = height - top - bottom;
    const maxY = Math.max(...points.map((point) => point.y), 1);
    const minX = points[0]?.x ?? 0;
    const maxX = points[points.length - 1]?.x ?? 1;
    const toX = (x: number) =>
      left + ((x - minX) / Math.max(1, maxX - minX)) * plotW;
    const toY = (y: number) => top + plotH - (y / maxY) * plotH;
    const path = points
      .map(
        (point, index) =>
          `${index === 0 ? "M" : "L"} ${toX(point.x)} ${toY(point.y)}`,
      )
      .join(" ");
    const fillPath = `${path} L ${toX(points[points.length - 1].x)} ${
      top + plotH
    } L ${toX(points[0].x)} ${top + plotH} Z`;
    const hoverIndex =
      this.graphHover?.id === id
        ? clamp(this.graphHover.index, 0, points.length - 1)
        : Math.floor(points.length / 2);
    const hoverPoint = points[hoverIndex];
    const hoverX = toX(hoverPoint.x);
    const hoverY = toY(hoverPoint.y);
    const xTicks = [0, 0.25, 0.5, 0.75, 1].map((pct) => {
      const value = minX + (maxX - minX) * pct;
      return {
        value,
        x: toX(value),
        label: maxX <= 100 ? `${Math.round(value)}%` : formatValue(value),
      };
    });
    const yTicks = [0, 0.25, 0.5, 0.75, 1].map((pct) => {
      const value = maxY * pct;
      return {
        value,
        y: toY(value),
        label: formatValue(value),
      };
    });
    const visibleMarkers = markers.map((marker) => ({
      ...marker,
      x: toX(clamp(marker.x, minX, maxX)),
    }));

    return html`
      <div class="graph">
        <div class="graph-title">
          <span>${title}</span>
          <span class="graph-readout">${hoverPoint.label}</span>
        </div>
        <div class="graph-subtitle">${subtitle}</div>
        <svg
          class="curve"
          viewBox="0 0 ${width} ${height}"
          role="img"
          aria-label=${`${title}. ${subtitle}`}
          @pointermove=${(event: PointerEvent) =>
            this.handleGraphPointerMove(event, id, points.length)}
          @pointerleave=${() => (this.graphHover = null)}
        >
          <path class="curve-fill" d=${fillPath}></path>
          ${yTicks.map(
            (tick) => svg`
              <line
                class="grid"
                stroke="rgba(203, 213, 225, 0.38)"
                stroke-width="1.2"
                x1=${left}
                x2=${width - right}
                y1=${tick.y}
                y2=${tick.y}
              ></line>
              <line
                class="tick"
                stroke="rgba(226, 232, 240, 0.85)"
                stroke-width="1.2"
                x1=${left - 3}
                x2=${left}
                y1=${tick.y}
                y2=${tick.y}
              ></line>
              <text
                class="tick-label"
                fill="#f8fafc"
                font-size="8.5"
                font-weight="650"
                x=${left - 5}
                y=${tick.y + 3}
                text-anchor="end"
              >
                ${tick.label}
              </text>
            `,
          )}
          ${xTicks.map(
            (tick) => svg`
              <line
                class="grid"
                stroke="rgba(203, 213, 225, 0.38)"
                stroke-width="1.2"
                x1=${tick.x}
                x2=${tick.x}
                y1=${top}
                y2=${top + plotH}
              ></line>
              <line
                class="tick"
                stroke="rgba(226, 232, 240, 0.85)"
                stroke-width="1.2"
                x1=${tick.x}
                x2=${tick.x}
                y1=${top + plotH}
                y2=${top + plotH + 3}
              ></line>
              <text
                class="tick-label"
                fill="#f8fafc"
                font-size="8.5"
                font-weight="650"
                x=${tick.x}
                y=${top + plotH + 12}
                text-anchor="middle"
              >
                ${tick.label}
              </text>
            `,
          )}
          <line
            class="axis"
            stroke="rgba(226, 232, 240, 0.9)"
            stroke-width="1.25"
            x1=${left}
            x2=${left}
            y1=${top}
            y2=${top + plotH}
          ></line>
          <line
            class="axis"
            stroke="rgba(226, 232, 240, 0.9)"
            stroke-width="1.25"
            x1=${left}
            x2=${width - right}
            y1=${top + plotH}
            y2=${top + plotH}
          ></line>
          <path class="curve-line" d=${path}></path>
          ${visibleMarkers.map(
            (marker) => svg`
              <line
                class="marker-line"
                x1=${marker.x}
                x2=${marker.x}
                y1=${top}
                y2=${top + plotH}
              ></line>
              <text
                class="marker-label"
                x=${marker.x + 4}
                y=${top + 10}
              >
                ${marker.label}
              </text>
            `,
          )}
          <line
            class="hover-line"
            x1=${hoverX}
            x2=${hoverX}
            y1=${top}
            y2=${top + plotH}
          ></line>
          <circle class="hover-dot" cx=${hoverX} cy=${hoverY} r="4"></circle>
          <text class="axis-label" x=${left} y=${height - 7}>${xLabel}</text>
          <text class="axis-label" x=${left} y=${top - 3}>${yLabel}</text>
        </svg>
      </div>
    `;
  }

  private handleGraphPointerMove(
    event: PointerEvent,
    id: GraphId,
    pointCount: number,
  ) {
    const svg = event.currentTarget as SVGSVGElement;
    const rect = svg.getBoundingClientRect();
    const left = 36;
    const right = 8;
    const pct = clamp(
      (event.clientX - rect.left - (left / 320) * rect.width) /
        (((320 - left - right) / 320) * rect.width),
      0,
      1,
    );
    this.graphHover = {
      id,
      index: Math.round(pct * (pointCount - 1)),
    };
  }

  private renderTerrainMixPreview(): TemplateResult {
    const weights = this.pendingMechanics.populationResources.terrainWeights;
    return html`
      <div class="graph">
        <div class="graph-title">
          <span>Terrain Yield Split</span>
          <span class="graph-readout">relative weights</span>
        </div>
        <div class="graph-subtitle">
          Each row shows how one tile of that terrain splits total generated
          resources. Bigger segments receive more of the same production pool.
        </div>
        <div class="mix-grid">
          ${terrainKeys.map((terrain) => {
            const row = weights[terrain];
            const total = Math.max(row.food + row.energy + row.materials, 1);
            return html`
              <div class="mix-row">
                <span>${terrain}</span>
                <div
                  class="mix-bar"
                  style=${`--food:${row.food}fr;--energy:${row.energy}fr;--materials:${row.materials}fr`}
                  title=${`food ${Math.round(
                    (row.food / total) * 100,
                  )}%, energy ${Math.round(
                    (row.energy / total) * 100,
                  )}%, materials ${Math.round((row.materials / total) * 100)}%`}
                >
                  <span class="mix-food"></span>
                  <span class="mix-energy"></span>
                  <span class="mix-materials"></span>
                </div>
              </div>
            `;
          })}
        </div>
      </div>
    `;
  }

  private renderAiPreview(): TemplateResult {
    const mechanics = this.pendingMechanics.populationResources;
    return html`
      <hud-stat-grid columns="3">
        <hud-stat
          label="Bot capacity"
          value=${`${formatValue(mechanics.botCapacityMultiplier * 100)}%`}
        ></hud-stat>
        <hud-stat
          label="Bot growth"
          value=${`${formatValue(mechanics.botTroopGrowthMultiplier * 100)}%`}
        ></hud-stat>
        <hud-stat
          label="Bot regen"
          value=${`${formatValue(mechanics.botResourceRegenMultiplier * 100)}%`}
        ></hud-stat>
      </hud-stat-grid>
    `;
  }

  private renderTerrainControls(): TemplateResult {
    return html`
      <hud-stack>
        ${terrainKeys.map(
          (terrain) => html`
            <hud-form-row>
              <hud-field-label>
                <span class="control-label">
                  ${terrain}
                  ${this.renderHelp(
                    "Relative production weights for tiles of this terrain. The weights do not create more total resources by themselves; they split total passive production into food, energy, and materials.",
                  )}
                </span>
              </hud-field-label>
              <div class="terrain-grid">
                ${resourceKeys.map((resource) =>
                  this.renderTerrainWeightInput(terrain, resource),
                )}
              </div>
            </hud-form-row>
          `,
        )}
      </hud-stack>
    `;
  }

  private renderTerrainWeightInput(
    terrain: TerrainKey,
    resource: ResourceKey,
  ): TemplateResult {
    const value =
      this.pendingMechanics.populationResources.terrainWeights[terrain][
        resource
      ];
    return html`<hud-input
      data-terrain=${terrain}
      data-resource=${resource}
      type="number"
      .value=${String(value)}
      .placeholder=${resource}
      @value-change=${(event: CustomEvent<{ value: string | number }>) =>
        this.setTerrainWeight(terrain, resource, numberFromEvent(event))}
    ></hud-input>`;
  }

  private renderJsonPanel(): TemplateResult {
    return html`
      <hud-surface>
        <hud-surface-header>
          <hud-label>Mechanics JSON</hud-label>
        </hud-surface-header>
        <hud-surface-body>
          <hud-stack>
            <hud-textarea
              data-json
              rows="10"
              .value=${this.jsonText}
              @value-change=${this.handleJsonTextChange}
            ></hud-textarea>
            ${this.jsonError
              ? html`<div class="json-error">${this.jsonError}</div>`
              : nothing}
            <hud-action-group>
              <hud-button data-action="export-json" @click=${this.exportJson}>
                Export
              </hud-button>
              <hud-button
                data-action="import-json"
                variant="active"
                @click=${this.importJson}
              >
                Import
              </hud-button>
            </hud-action-group>
          </hud-stack>
        </hud-surface-body>
      </hud-surface>
    `;
  }

  private renderDiagnosticsPanel(): TemplateResult {
    const active = this.activeMechanics?.populationResources;
    return html`
      <hud-surface>
        <hud-surface-header>
          <hud-label>Diagnostics</hud-label>
          <hud-pill tone=${this.diagnostics ? "green" : "blue"}>
            ${this.diagnostics ? `T${this.diagnostics.tick}` : "Idle"}
          </hud-pill>
        </hud-surface-header>
        <hud-surface-body>
          <hud-stack>
            <hud-stat-grid columns="2">
              <hud-stat
                label="Active r"
                value=${active ? formatValue(active.populationGrowthRate) : "-"}
              ></hud-stat>
              <hud-stat
                label="N0"
                value=${active ? formatValue(active.initialPopulation) : "-"}
              ></hud-stat>
              <hud-stat
                label="Max pop / tile"
                value=${active ? formatValue(active.maxPopulationPerTile) : "-"}
              ></hud-stat>
            </hud-stat-grid>
            ${this.diagnostics ? this.renderLiveDiagnostics() : nothing}
          </hud-stack>
        </hud-surface-body>
      </hud-surface>
    `;
  }

  private renderLiveDiagnostics(): TemplateResult {
    const diagnostics = this.diagnostics!;
    return html`
      <hud-stat-grid columns="2">
        <hud-stat
          label="Population"
          value=${formatValue(diagnostics.troops)}
        ></hud-stat>
        <hud-stat
          label="Pop delta"
          value=${formatValue(diagnostics.troopIncreaseRate)}
        ></hud-stat>
        <hud-stat
          label="Max population"
          value=${formatValue(diagnostics.effectiveTroopCapacity)}
        ></hud-stat>
        <hud-stat
          label="Food"
          value=${`${formatValue(diagnostics.resources.food)} / ${formatValue(
            diagnostics.resourceCapacity.food,
          )}`}
        ></hud-stat>
        <hud-stat
          label="Energy"
          value=${`${formatValue(diagnostics.resources.energy)} / ${formatValue(
            diagnostics.resourceCapacity.energy,
          )}`}
        ></hud-stat>
        <hud-stat
          label="Materials"
          value=${`${formatValue(
            diagnostics.resources.materials,
          )} / ${formatValue(diagnostics.resourceCapacity.materials)}`}
        ></hud-stat>
      </hud-stat-grid>
    `;
  }

  private setPopulationValue(key: PopulationNumberKey, value: number) {
    const next = cloneMechanics(this.pendingMechanics);
    const control = populationControls.find(
      (candidate) => candidate.key === key,
    );
    next.populationResources[key] = control
      ? this.normalizeControlValue(control, value)
      : value;
    this.setPendingMechanics(next);
  }

  private setTerrainWeight(
    terrain: TerrainKey,
    resource: ResourceKey,
    value: number,
  ) {
    const next = cloneMechanics(this.pendingMechanics);
    next.populationResources.terrainWeights[terrain][resource] = Math.max(
      0,
      Math.round(value),
    );
    this.setPendingMechanics(next);
  }

  private setPendingMechanics(next: MechanicsConfig) {
    this.pendingMechanics = cloneMechanics(next);
    this.jsonText = mechanicsToJson(this.pendingMechanics);
    this.jsonError = "";
    this.persistSettings();
  }

  private resetPending = () => {
    this.applySettings(DEFAULT_SANDBOX_SETTINGS);
    this.diagnostics = null;
    this.persistSettings(this.running);
  };

  private exportJson = () => {
    this.jsonText = mechanicsToJson(this.pendingMechanics);
    this.jsonError = "";
  };

  private importJson = () => {
    let parsed: unknown;
    try {
      parsed = JSON.parse(this.jsonText);
    } catch (error) {
      this.jsonError = error instanceof Error ? error.message : "Invalid JSON";
      return;
    }

    const result = MechanicsConfigSchema.safeParse(parsed);
    if (!result.success) {
      this.jsonError = z.prettifyError(result.error);
      return;
    }

    this.setPendingMechanics(resolveMechanicsConfig(result.data));
  };

  private startRun = () => {
    this.persistSettings(true);
    if (this.running) {
      window.location.reload();
      return;
    }

    const gameID = generateID();
    const clientID = generateID();
    const activeMechanics = cloneMechanics(this.pendingMechanics);
    const scenario = this.launchMode === "scenario";
    const gameStartInfo = createSinglePlayerGameStartInfo({
      gameID,
      clientID,
      username: "Sandbox",
      clanTag: null,
      cosmetics: {},
      selectedMap: GameMapType.World,
      compactMap: false,
      gameMode: GameMode.FFA,
      teamCount: 2,
      difficulty: this.difficulty,
      bots: scenario ? this.bots : 0,
      infiniteGold: false,
      infiniteTroops: false,
      instantBuild: false,
      randomSpawn: false,
      disabledUnits: [],
      nations: scenario && this.nations > 0 ? this.nations : "disabled",
      mechanics: activeMechanics,
      isSandbox: true,
    });

    GameStartInfoSchema.parse(gameStartInfo);
    this.activeMechanics = activeMechanics;
    this.running = true;
    this.paused = false;
    this.diagnostics = null;
    this.dispatchEvent(
      new CustomEvent("join-lobby", {
        detail: {
          gameID,
          gameStartInfo,
          source: "sandbox",
        } satisfies JoinLobbyEvent,
        bubbles: true,
        composed: true,
      }),
    );
  };

  private togglePause = () => {
    if (!this.running) {
      return;
    }

    this.paused = !this.paused;
    this.dispatchEvent(
      new CustomEvent("sandbox-pause-game", {
        detail: { paused: this.paused },
        bubbles: true,
        composed: true,
      }),
    );
  };

  private handlePopulationTabChange = (
    event: CustomEvent<{ value: PopulationTab }>,
  ) => {
    this.activePopulationTab = event.detail.value;
    this.graphHover = null;
  };

  private handleFoodConstraintModeChange = (
    event: CustomEvent<{
      value: PopulationResourceMechanicsConfig["populationFoodConstraintMode"];
    }>,
  ) => {
    const next = cloneMechanics(this.pendingMechanics);
    next.populationResources.populationFoodConstraintMode = event.detail.value;
    this.setPendingMechanics(next);
  };

  private handleLaunchModeChange = (event: CustomEvent<{ id: LaunchMode }>) => {
    this.launchMode = event.detail.id;
    if (this.launchMode === "isolated") {
      this.bots = 0;
      this.nations = 0;
    }
    this.persistSettings();
  };

  private handleDifficultyChange = (
    event: CustomEvent<{ value: Difficulty }>,
  ) => {
    this.difficulty = event.detail.value;
    this.persistSettings();
  };

  private handleBotsChange = (
    event: CustomEvent<{ value: string | number }>,
  ) => {
    this.bots = Math.max(0, Math.min(400, Math.round(numberFromEvent(event))));
    this.persistSettings();
  };

  private handleNationsChange = (
    event: CustomEvent<{ value: string | number }>,
  ) => {
    this.nations = Math.max(
      0,
      Math.min(400, Math.round(numberFromEvent(event))),
    );
    this.persistSettings();
  };

  private handleJsonTextChange = (
    event: CustomEvent<{ value: string | number }>,
  ) => {
    this.jsonText = String(event.detail.value);
    this.jsonError = "";
  };

  private handleDiagnostics = (event: CustomEvent<SandboxDiagnostics>) => {
    if (this.activeMechanics === null) {
      return;
    }
    this.diagnostics = event.detail;
  };

  private applySettings(settings: SandboxSettings) {
    this.pendingMechanics = cloneMechanics(settings.mechanics);
    this.jsonText = mechanicsToJson(this.pendingMechanics);
    this.jsonError = "";
    this.launchMode = settings.launchMode;
    this.bots = settings.launchMode === "isolated" ? 0 : settings.bots;
    this.nations = settings.launchMode === "isolated" ? 0 : settings.nations;
    this.difficulty = settings.difficulty;
  }

  private currentSettings(autoStart = this.running): SandboxSettings {
    return {
      mechanics: cloneMechanics(this.pendingMechanics),
      launchMode: this.launchMode,
      bots: this.launchMode === "isolated" ? 0 : this.bots,
      nations: this.launchMode === "isolated" ? 0 : this.nations,
      difficulty: this.difficulty,
      autoStart,
    };
  }

  private persistSettings(autoStart = this.running): void {
    writePersistedSettings(this.currentSettings(autoStart));
  }
}

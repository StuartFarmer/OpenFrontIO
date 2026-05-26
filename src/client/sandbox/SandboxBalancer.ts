import { css, html, LitElement, nothing, type TemplateResult } from "lit";
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
import { GameStartInfoSchema } from "../../core/Schemas";
import { generateID } from "../../core/Util";
import "../hud/ui";
import type {
  HudSegmentedItem,
  HudSelectOption,
} from "../hud/ui/HudComponents";
import type { JoinLobbyEvent } from "../Main";
import { createSinglePlayerGameStartInfo } from "../utilities/SinglePlayerGameStart";

type PopulationNumberKey = Exclude<
  keyof PopulationResourceMechanicsConfig,
  | "terrainWeights"
  | "nationCapacityMultipliers"
  | "nationTroopGrowthMultipliers"
  | "nationResourceRegenMultipliers"
>;
type TerrainKey = keyof PopulationResourceMechanicsConfig["terrainWeights"];
type ResourceKey =
  keyof PopulationResourceMechanicsConfig["terrainWeights"]["plains"];
type LaunchMode = "isolated" | "scenario";

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
  label: string;
  min: number;
  max: number;
  step: number;
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
    key: "troopLogisticGrowthRate",
    label: "Troop growth",
    min: 0,
    max: 0.05,
    step: 0.001,
  },
  {
    key: "baselineBiomassProductionShare",
    label: "Biomass baseline",
    min: 0.01,
    max: 1,
    step: 0.01,
  },
  {
    key: "minBaseResourceCapacity",
    label: "Base capacity",
    min: 0,
    max: 250000,
    step: 5000,
  },
  {
    key: "resourceCapacityTerritoryDivisor",
    label: "Territory divisor",
    min: 0.25,
    max: 12,
    step: 0.25,
  },
  {
    key: "siloResourceCapacityIncrease",
    label: "Silo capacity",
    min: 0,
    max: 1000000,
    step: 10000,
  },
  {
    key: "resourceRegenBase",
    label: "Regen base",
    min: 0,
    max: 50,
    step: 0.5,
  },
  {
    key: "resourceRegenExponent",
    label: "Regen exponent",
    min: 0.05,
    max: 2,
    step: 0.01,
  },
  {
    key: "resourceRegenDivisor",
    label: "Regen divisor",
    min: 0.25,
    max: 12,
    step: 0.25,
  },
  {
    key: "passiveResourceRegenMultiplier",
    label: "Passive regen",
    min: 0,
    max: 2,
    step: 0.01,
  },
  {
    key: "botCapacityMultiplier",
    label: "Bot capacity",
    min: 0,
    max: 2,
    step: 0.01,
  },
  {
    key: "botTroopGrowthMultiplier",
    label: "Bot growth",
    min: 0,
    max: 2,
    step: 0.01,
  },
  {
    key: "botResourceRegenMultiplier",
    label: "Bot regen",
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
const SANDBOX_SETTINGS_STORAGE_KEY = "openfront.sandbox.settings.v1";
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
          ${this.renderTerrainPanel()} ${this.renderJsonPanel()}
          ${this.renderDiagnosticsPanel()}
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
    return html`
      <hud-surface>
        <hud-surface-header>
          <hud-label>Population And Resources</hud-label>
        </hud-surface-header>
        <hud-surface-body>
          <hud-stack>
            ${populationControls.map((control) =>
              this.renderNumberControl(control),
            )}
          </hud-stack>
        </hud-surface-body>
      </hud-surface>
    `;
  }

  private renderNumberControl(control: NumberControl): TemplateResult {
    const value = this.pendingMechanics.populationResources[control.key];
    return html`
      <hud-form-row>
        <hud-field-label>${control.label}</hud-field-label>
        <div class="control-pair">
          <hud-range
            data-mechanic=${control.key}
            .min=${control.min}
            .max=${control.max}
            .step=${control.step}
            .value=${value}
            .label=${control.label}
            @value-change=${(event: CustomEvent<{ value: string | number }>) =>
              this.setPopulationValue(control.key, numberFromEvent(event))}
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

  private renderTerrainPanel(): TemplateResult {
    return html`
      <hud-surface>
        <hud-surface-header>
          <hud-label>Terrain Yield Weights</hud-label>
        </hud-surface-header>
        <hud-surface-body>
          <hud-stack>
            ${terrainKeys.map(
              (terrain) => html`
                <hud-form-row>
                  <hud-field-label>${terrain}</hud-field-label>
                  <div class="terrain-grid">
                    ${resourceKeys.map((resource) =>
                      this.renderTerrainWeightInput(terrain, resource),
                    )}
                  </div>
                </hud-form-row>
              `,
            )}
          </hud-stack>
        </hud-surface-body>
      </hud-surface>
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
                label="Active growth"
                value=${active
                  ? formatValue(active.troopLogisticGrowthRate)
                  : "-"}
              ></hud-stat>
              <hud-stat
                label="Biomass baseline"
                value=${active
                  ? formatValue(active.baselineBiomassProductionShare)
                  : "-"}
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
          label="Troops"
          value=${formatValue(diagnostics.troops)}
        ></hud-stat>
        <hud-stat
          label="Troop delta"
          value=${formatValue(diagnostics.troopIncreaseRate)}
        ></hud-stat>
        <hud-stat
          label="Effective cap"
          value=${formatValue(diagnostics.effectiveTroopCapacity)}
        ></hud-stat>
        <hud-stat
          label="Biomass cap"
          value=${formatValue(diagnostics.biomassSupportedTroopCapacity)}
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
    next.populationResources[key] = value;
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

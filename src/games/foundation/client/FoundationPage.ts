import { LitElement, css, html } from "lit";
import { customElement, query, state } from "lit/decorators.js";
import {
  BaseMapWebGLAdapter,
  type BaseMapPalette,
  type BaseMapTileStateDelta,
} from "../../../client/render/base-map";
import { renderTroops } from "../../../client/Utils";
import { createFoundationMap, createWorldEngineFoundationMap } from "../domain";
import {
  FoundationRuntime,
  createFoundationRuntime,
  createGrowTerritoryCommand,
  createPlacePlayerCommand,
  type FoundationMapUpdate,
  type FoundationRuntimeSnapshot,
} from "../runtime";
import {
  DEFAULT_FOUNDATION_TUNING_SETTINGS,
  FoundationTuningSettings,
  loadFoundationTuningSettings,
  normalizeFoundationTuningSettings,
  saveFoundationTuningSettings,
} from "./FoundationTuningSettings";

interface FoundationClientStatus {
  tone: "idle" | "ok" | "error";
  text: string;
}

type FoundationControlTab = "world" | "mechanics";

const FOUNDATION_RESTART_SETTING_KEYS = new Set<keyof FoundationTuningSettings>(
  [
    "seed",
    "width",
    "height",
    "seaLevel",
    "continentScale",
    "mountainStrength",
    "coastFalloff",
    "coastRoughness",
    "startingTroops",
    "placementRadius",
  ],
);

const FOUNDATION_PLAYER_PALETTE: BaseMapPalette = {
  entries: [
    {
      ownerId: 1,
      fill: [0.13, 0.62, 0.43, 0.78],
      border: [0.73, 0.95, 0.63, 0.95],
    },
  ],
};

@customElement("foundation-page")
export class FoundationPage extends LitElement {
  @query("canvas")
  private canvas!: HTMLCanvasElement;

  @state()
  private snapshot: FoundationRuntimeSnapshot | null = null;

  @state()
  private status: FoundationClientStatus = {
    tone: "idle",
    text: "Click a tile to place the player.",
  };

  @state()
  private paused = false;

  @state()
  private tuningSettings: FoundationTuningSettings =
    DEFAULT_FOUNDATION_TUNING_SETTINGS;

  @state()
  private activeControlTab: FoundationControlTab = "world";

  private runtime: FoundationRuntime | null = null;
  private renderer: BaseMapWebGLAdapter | null = null;
  private resizeObserver: ResizeObserver | null = null;
  private tickTimer: number | null = null;

  static styles = css`
    :host {
      display: block;
      position: fixed;
      inset: 0;
      z-index: 50000;
      overflow: auto;
      color-scheme: dark;
      --bg: #101416;
      --panel: #181d20;
      --panel-2: #20262a;
      --line: #30383d;
      --text: #e7ecef;
      --muted: #9daab1;
      --accent: #7dc8a6;
      --accent-2: #e6bf63;
      --danger: #de786b;
      background: var(--bg);
      color: var(--text);
      font-family:
        Inter,
        ui-sans-serif,
        system-ui,
        -apple-system,
        BlinkMacSystemFont,
        "Segoe UI",
        sans-serif;
    }

    * {
      box-sizing: border-box;
    }

    button,
    input {
      font: inherit;
    }

    .app {
      min-height: 100vh;
      display: grid;
      grid-template-columns: 320px minmax(0, 1fr);
    }

    .controls {
      border-right: 1px solid var(--line);
      background: var(--panel);
      padding: 20px;
      overflow-y: auto;
      max-height: 100vh;
    }

    .brand {
      margin-bottom: 22px;
    }

    .brand h1 {
      margin: 0;
      font-size: 24px;
      line-height: 1.1;
    }

    .brand p {
      margin: 6px 0 0;
      color: var(--muted);
      font-size: 14px;
    }

    .control-tabs {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 6px;
      padding: 4px;
      margin-bottom: 14px;
      border: 1px solid var(--line);
      border-radius: 8px;
      background: var(--panel-2);
    }

    button.control-tab {
      min-height: 32px;
      border-color: transparent;
      background: transparent;
      color: var(--muted);
    }

    button.control-tab.active {
      border-color: rgb(125 200 166 / 0.6);
      background: rgb(125 200 166 / 0.14);
      color: var(--text);
    }

    .control-panel[hidden] {
      display: none;
    }

    .control-section {
      border-top: 1px solid var(--line);
      padding: 18px 0 4px;
    }

    .control-section h2 {
      margin: 0 0 14px;
      color: var(--accent);
      font-size: 13px;
      letter-spacing: 0;
      text-transform: uppercase;
    }

    label {
      display: grid;
      gap: 7px;
      margin-bottom: 14px;
      color: var(--muted);
      font-size: 13px;
    }

    label span {
      display: flex;
      justify-content: space-between;
      gap: 12px;
    }

    output {
      color: var(--text);
      font-variant-numeric: tabular-nums;
    }

    input[type="number"] {
      width: 100%;
      height: 36px;
      border: 1px solid var(--line);
      border-radius: 6px;
      background: var(--panel-2);
      color: var(--text);
      padding: 0 10px;
    }

    input[type="range"] {
      width: 100%;
      accent-color: var(--accent);
    }

    .split {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
    }

    .actions {
      display: grid;
      grid-template-columns: 1fr;
      gap: 10px;
      position: sticky;
      bottom: 0;
      background: linear-gradient(180deg, rgb(24 29 32 / 0), var(--panel) 22%);
      padding-top: 24px;
    }

    button {
      min-height: 38px;
      border: 1px solid rgb(125 200 166 / 0.55);
      border-radius: 6px;
      background: var(--accent);
      color: #09100d;
      cursor: pointer;
      font-weight: 700;
    }

    button.secondary {
      border-color: var(--line);
      background: transparent;
      color: var(--text);
    }

    .workspace {
      min-width: 0;
      min-height: 100vh;
      display: grid;
      grid-template-rows: auto minmax(0, 1fr);
      padding: 20px;
    }

    .statusbar {
      min-height: 44px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 18px;
      border-bottom: 1px solid var(--line);
      margin-bottom: 20px;
      color: var(--muted);
      font-size: 14px;
    }

    .statusbar div {
      display: flex;
      gap: 16px;
      flex-wrap: wrap;
    }

    .statusbar strong {
      color: var(--text);
    }

    .map-panel {
      min-height: 0;
      display: grid;
      grid-template-rows: auto minmax(0, 1fr);
      border: 1px solid var(--line);
      border-radius: 8px;
      background: var(--panel);
      overflow: hidden;
    }

    .panel-head {
      min-height: 50px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      padding: 12px 14px;
      border-bottom: 1px solid var(--line);
    }

    .panel-head h2 {
      margin: 0;
      font-size: 16px;
    }

    .panel-head span {
      color: var(--muted);
      font-size: 13px;
    }

    .canvas-frame {
      position: relative;
      min-height: 0;
    }

    .runtime-overlay {
      position: absolute;
      top: 12px;
      left: 12px;
      z-index: 2;
      width: min(280px, calc(100% - 24px));
      border: 1px solid rgb(48 56 61 / 0.86);
      border-radius: 8px;
      background: rgb(24 29 32 / 0.88);
      box-shadow: 0 18px 48px rgb(0 0 0 / 0.28);
      padding: 12px;
      pointer-events: none;
      backdrop-filter: blur(8px);
    }

    .runtime-overlay .metric-grid {
      gap: 7px 12px;
    }

    .runtime-overlay dt,
    .runtime-overlay dd {
      font-size: 12px;
    }

    .runtime-overlay .status {
      margin-top: 10px;
      padding-top: 10px;
      border-top: 1px solid var(--line);
    }

    canvas {
      display: block;
      width: 100%;
      height: 100%;
      cursor: crosshair;
      touch-action: none;
      image-rendering: pixelated;
      background: #050708;
    }

    .metric-grid {
      display: grid;
      grid-template-columns: 1fr auto;
      gap: 8px 12px;
      margin: 0;
    }

    dt,
    dd {
      margin: 0;
      min-width: 0;
      font-size: 13px;
      line-height: 1.25;
    }

    dt {
      color: var(--muted);
    }

    dd {
      color: var(--text);
      font-variant-numeric: tabular-nums;
      text-align: right;
    }

    .status {
      margin: 0;
      color: var(--muted);
      font-size: 13px;
      line-height: 1.4;
    }

    .tone {
      color: var(--muted);
      text-transform: uppercase;
    }

    .tone.ok {
      color: var(--accent);
    }

    .tone.error {
      color: var(--danger);
    }

    @media (max-width: 820px) {
      :host {
        position: static;
      }

      .app {
        grid-template-columns: 1fr;
      }

      .controls {
        max-height: none;
        border-right: 0;
        border-bottom: 1px solid var(--line);
      }

      .workspace {
        min-height: 70vh;
      }

      .statusbar {
        align-items: flex-start;
        flex-direction: column;
      }
    }
  `;

  firstUpdated(): void {
    this.tuningSettings = loadFoundationTuningSettings(
      foundationTuningOverridesFromLocation(),
    );
    this.resetRuntime("Click a tile to place the player.");

    this.canvas.addEventListener("click", this.handleCanvasClick);
    this.resizeObserver = new ResizeObserver(() => this.resizeRenderer());
    this.resizeObserver.observe(this.canvas);
    this.configureTickTimer();
  }

  disconnectedCallback(): void {
    this.canvas?.removeEventListener("click", this.handleCanvasClick);
    this.resizeObserver?.disconnect();
    if (this.tickTimer !== null) {
      window.clearInterval(this.tickTimer);
    }
    this.renderer?.dispose();
    this.resizeObserver = null;
    this.tickTimer = null;
    this.renderer = null;
    this.runtime = null;
    super.disconnectedCallback();
  }

  render() {
    const snapshot = this.snapshot;
    return html`
      <main class="app">
        <aside class="controls" aria-label="Foundation world controls">
          <div class="brand">
            <h1>Foundation</h1>
            <p>WorldEngine terrain and growth mechanics</p>
          </div>

          <nav class="control-tabs" aria-label="Control groups">
            <button
              class=${this.controlTabClass("world")}
              type="button"
              @click=${() => this.setControlTab("world")}
            >
              World
            </button>
            <button
              class=${this.controlTabClass("mechanics")}
              type="button"
              @click=${() => this.setControlTab("mechanics")}
            >
              Mechanics
            </button>
          </nav>

          <div
            class="control-panel"
            ?hidden=${this.activeControlTab !== "world"}
          >
            <section class="control-section">
              <h2>World</h2>
              ${this.numberInput("Seed", "seed", -2147483648, 2147483647, 1)}
              <div class="split">
                ${this.numberInput("Width", "width", 32, 1024, 1)}
                ${this.numberInput("Height", "height", 32, 1024, 1)}
              </div>
              ${this.rangeInput("Sea level", "seaLevel", 0.2, 0.75, 0.01, 2)}
            </section>

            <section class="control-section">
              <h2>Elevation</h2>
              ${this.rangeInput(
                "Continent scale",
                "continentScale",
                0.35,
                1.6,
                0.01,
                2,
              )}
              ${this.rangeInput(
                "Mountain strength",
                "mountainStrength",
                0,
                1,
                0.01,
                2,
              )}
              ${this.rangeInput(
                "Edge water bias",
                "coastFalloff",
                0,
                1.4,
                0.01,
                2,
              )}
              ${this.rangeInput(
                "Coast roughness",
                "coastRoughness",
                0,
                1,
                0.01,
                2,
              )}
            </section>
          </div>

          <div
            class="control-panel"
            ?hidden=${this.activeControlTab !== "mechanics"}
          >
            <section class="control-section">
              <h2>Simulation</h2>
              ${this.rangeInput("Tick ms", "tickIntervalMs", 20, 1000, 10, 0)}
              ${this.percentRangeInput("Attack", "attackRatio", 1, 100, 1)}
              ${this.rangeInput(
                "Starting troops",
                "startingTroops",
                0,
                100000,
                500,
                0,
              )}
              ${this.rangeInput(
                "Placement radius",
                "placementRadius",
                0,
                16,
                1,
                0,
              )}
            </section>

            <section class="control-section">
              <h2>Troop Growth</h2>
              ${this.rangeInput("Regen base", "troopRegenBase", 0, 200, 1, 0)}
              ${this.rangeInput(
                "Regen exponent",
                "troopRegenExponent",
                0,
                1.5,
                0.01,
                2,
              )}
              ${this.rangeInput(
                "Regen divisor",
                "troopRegenDivisor",
                0.5,
                20,
                0.5,
                1,
              )}
              ${this.rangeInput(
                "Max multiplier",
                "maxTroopMultiplier",
                0.1,
                6,
                0.1,
                1,
              )}
              ${this.rangeInput(
                "Max tile exponent",
                "maxTroopTileExponent",
                0,
                1.5,
                0.01,
                2,
              )}
              ${this.rangeInput(
                "Max tile scale",
                "maxTroopTileScale",
                0,
                5000,
                100,
                0,
              )}
              ${this.rangeInput("Max base", "maxTroopBase", 0, 200000, 1000, 0)}
            </section>

            <section class="control-section">
              <h2>Wilderness</h2>
              ${this.rangeInput(
                "Base speed",
                "wildernessBaseSpeed",
                1,
                80,
                0.5,
                1,
              )}
              ${this.rangeInput(
                "Slope scale",
                "elevationSlopeScale",
                0,
                2,
                0.05,
                2,
              )}
              ${this.rangeInput(
                "Min speed mult",
                "minToblerSpeedMultiplier",
                0.01,
                2,
                0.01,
                2,
              )}
              ${this.rangeInput(
                "Max speed mult",
                "maxToblerSpeedMultiplier",
                0.01,
                3,
                0.05,
                2,
              )}
              ${this.rangeInput(
                "Priority scale",
                "terrainPriorityElevationScale",
                0,
                4,
                0.1,
                1,
              )}
              ${this.rangeInput(
                "Loss per tile",
                "wildernessAttackerLossPerTile",
                0,
                100,
                1,
                0,
              )}
              ${this.rangeInput(
                "Tile budget mult",
                "wildernessTilesPerTickMultiplier",
                0.1,
                8,
                0.1,
                1,
              )}
            </section>
          </div>

          <div class="actions">
            <button type="button" @click=${this.handleGenerate}>
              Generate Map
            </button>
            <button
              type="button"
              class="secondary"
              @click=${this.randomizeSeed}
            >
              Random Seed
            </button>
            <button
              type="button"
              class="secondary"
              @click=${this.togglePlayPause}
            >
              ${this.paused ? "Play" : "Pause"}
            </button>
            <button
              type="button"
              class="secondary"
              @click=${this.handleRestartSimulation}
            >
              Restart
            </button>
            <button
              type="button"
              class="secondary"
              @click=${this.resetDefaults}
            >
              Reset Defaults
            </button>
            <button
              type="button"
              class="secondary"
              @click=${this.copyParameters}
            >
              Copy JSON
            </button>
          </div>
        </aside>

        <section class="workspace" aria-label="Foundation generated game board">
          <header class="statusbar">
            <div>
              <strong
                >${snapshot
                  ? `${snapshot.map.width} x ${snapshot.map.height}`
                  : "pending"}</strong
              >
              <span>seed ${this.tuningSettings.seed}</span>
            </div>
            <div>
              <span>${this.status.text}</span>
              <span>${formatTroops(snapshot?.player.troops)} troops</span>
            </div>
          </header>

          <article class="map-panel">
            <div class="panel-head">
              <h2>Foundation</h2>
              <span>live game board</span>
            </div>
            <div class="canvas-frame">
              ${this.renderRuntimeOverlay(snapshot)}
              <canvas aria-label="Foundation generated game board"></canvas>
            </div>
          </article>
        </section>
      </main>
    `;
  }

  private renderRuntimeOverlay(snapshot: FoundationRuntimeSnapshot | null) {
    return html`
      <aside class="runtime-overlay" aria-label="Foundation runtime state">
        <dl class="metric-grid">
          <dt>State</dt>
          <dd class=${`tone ${this.status.tone}`}>${this.status.tone}</dd>
          <dt>Player</dt>
          <dd>${snapshot?.player.placed ? "placed" : "unplaced"}</dd>
          <dt>Selected tile</dt>
          <dd>${formatSelectedTile(snapshot)}</dd>
          <dt>Claimed tiles</dt>
          <dd>${snapshot?.player.claimedTileCount.toLocaleString() ?? "0"}</dd>
          <dt>Troops</dt>
          <dd>${formatTroops(snapshot?.player.troops)}</dd>
          <dt>Max troops</dt>
          <dd>${formatTroops(snapshot?.player.maxTroops)}</dd>
          <dt>Troop rate</dt>
          <dd>${formatTroopRate(snapshot?.player.troopIncreaseRate)}</dd>
          <dt>Exploring</dt>
          <dd>${formatTroops(snapshot?.player.exploringTroops)}</dd>
          <dt>Tick</dt>
          <dd>${snapshot?.tick.toLocaleString() ?? "0"}</dd>
          <dt>Updates</dt>
          <dd>${snapshot?.updateCount.toLocaleString() ?? "0"}</dd>
        </dl>
        <p class="status">${this.status.text}</p>
      </aside>
    `;
  }

  private readonly handleCanvasClick = (event: MouseEvent): void => {
    if (!this.runtime || !this.renderer) return;

    const rect = this.canvas.getBoundingClientRect();
    const tile = this.renderer.screenToTile({
      screenX: event.clientX - rect.left,
      screenY: event.clientY - rect.top,
    });

    if (tile === null) {
      this.status = {
        tone: "error",
        text: "Click landed outside the map bounds.",
      };
      return;
    }

    const currentSnapshot = this.snapshot ?? this.runtime.snapshot();
    const result = this.runtime.dispatch(
      currentSnapshot.player.placed
        ? createGrowTerritoryCommand({
            targetTileRef: tile.ref,
            turnNumber: currentSnapshot.tick,
            troopRatio: this.tuningSettings.attackRatio,
          })
        : createPlacePlayerCommand({
            tileRef: tile.ref,
            turnNumber: currentSnapshot.tick,
          }),
    );

    this.applyMapUpdate(result.update.map);
    this.snapshot = this.runtime.snapshot();
    this.status = this.statusFromCommandResult(result, tile);
  };

  private readonly advanceRuntimeTick = (): void => {
    if (this.paused || !this.runtime || !this.renderer) return;
    const update = this.runtime.advanceTick();
    this.applyMapUpdate(update.map);
    this.snapshot = this.runtime.snapshot();

    const growthEvent = update.events.find(
      (event) => event.type === "foundation.territory_grown",
    );
    if (growthEvent) {
      const claimedTileCount =
        typeof growthEvent.payload === "object" &&
        growthEvent.payload !== null &&
        "claimedTileCount" in growthEvent.payload
          ? Number(growthEvent.payload.claimedTileCount)
          : 0;
      const exploringTroops = renderTroops(
        update.metrics?.exploringTroops ?? 0,
      );
      this.status = {
        tone: "ok",
        text: `Expanded ${claimedTileCount.toLocaleString()} tiles. Exploring troops: ${exploringTroops}.`,
      };
      return;
    }

    if (
      update.events.some(
        (event) => event.type === "foundation.wilderness_exploration_completed",
      )
    ) {
      this.status = {
        tone: "idle",
        text: "Wilderness exploration completed.",
      };
    }
  };

  private readonly togglePlayPause = (): void => {
    this.paused = !this.paused;
    this.status = {
      tone: this.paused ? "idle" : "ok",
      text: this.paused ? "Simulation paused." : "Simulation running.",
    };
  };

  private readonly handleRestartSimulation = (): void => {
    this.paused = false;
    this.resetRuntime("Simulation restarted with current parameters.");
    this.configureTickTimer();
  };

  private readonly handleGenerate = (): void => {
    this.paused = false;
    this.resetRuntime("Generated world with current parameters.");
    this.configureTickTimer();
  };

  private readonly resetDefaults = (): void => {
    this.tuningSettings = {
      ...DEFAULT_FOUNDATION_TUNING_SETTINGS,
      mapGenerator: "world-engine",
    };
    saveFoundationTuningSettings(this.tuningSettings);
    this.paused = false;
    this.resetRuntime("Parameters reset to defaults.");
    this.configureTickTimer();
  };

  private readonly randomizeSeed = (): void => {
    const seed = Math.floor(Math.random() * 2_000_000_000);
    this.updateSettings(
      { seed, mapGenerator: "world-engine" },
      { reset: true, status: `Generated random seed ${seed}.` },
    );
  };

  private readonly copyParameters = async (): Promise<void> => {
    try {
      await navigator.clipboard.writeText(
        JSON.stringify(this.tuningSettings, null, 2),
      );
      this.status = {
        tone: "ok",
        text: "Parameters copied as JSON.",
      };
    } catch {
      this.status = {
        tone: "error",
        text: "Could not copy parameters.",
      };
    }
  };

  private setControlTab(tab: FoundationControlTab): void {
    this.activeControlTab = tab;
  }

  private controlTabClass(tab: FoundationControlTab): string {
    return `control-tab ${this.activeControlTab === tab ? "active" : ""}`;
  }

  private numberInput(
    label: string,
    key: keyof FoundationTuningSettings,
    min: number,
    max: number,
    step: number,
  ) {
    return html`
      <label>
        <span>${label}</span>
        <input
          type="number"
          min=${min}
          max=${max}
          step=${step}
          .value=${String(this.tuningSettings[key])}
          @change=${(event: Event) => this.handleNumberInput(event, key)}
        />
      </label>
    `;
  }

  private rangeInput(
    label: string,
    key: keyof FoundationTuningSettings,
    min: number,
    max: number,
    step: number,
    precision: number,
  ) {
    const value = Number(this.tuningSettings[key]);
    return html`
      <label>
        <span>${label} <output>${value.toFixed(precision)}</output></span>
        <input
          type="range"
          min=${min}
          max=${max}
          step=${step}
          .value=${String(value)}
          @input=${(event: Event) => this.handleNumberInput(event, key)}
        />
      </label>
    `;
  }

  private percentRangeInput(
    label: string,
    key: keyof FoundationTuningSettings,
    min: number,
    max: number,
    step: number,
  ) {
    const value = Math.round(Number(this.tuningSettings[key]) * 100);
    return html`
      <label>
        <span>${label} <output>${value}%</output></span>
        <input
          type="range"
          min=${min}
          max=${max}
          step=${step}
          .value=${String(value)}
          @input=${(event: Event) => this.handlePercentInput(event, key)}
        />
      </label>
    `;
  }

  private handleNumberInput(
    event: Event,
    key: keyof FoundationTuningSettings,
  ): void {
    const target = event.currentTarget as HTMLInputElement;
    this.updateSettings({
      [key]: Number(target.value),
      mapGenerator: "world-engine",
    });
  }

  private handlePercentInput(
    event: Event,
    key: keyof FoundationTuningSettings,
  ): void {
    const target = event.currentTarget as HTMLInputElement;
    this.updateSettings({
      [key]: Number(target.value) / 100,
      mapGenerator: "world-engine",
    });
  }

  private updateSettings(
    patch: Partial<FoundationTuningSettings>,
    options: { reset?: boolean; status?: string } = {},
  ): void {
    const changedKeys = Object.keys(
      patch,
    ) as (keyof FoundationTuningSettings)[];
    this.tuningSettings = normalizeFoundationTuningSettings({
      ...this.tuningSettings,
      ...patch,
    });
    saveFoundationTuningSettings(this.tuningSettings);
    this.configureTickTimer();
    this.runtime?.updateParameters(this.tuningSettings);

    if (options.reset) {
      this.paused = false;
      this.resetRuntime(options.status ?? "Generated world.");
      this.configureTickTimer();
      return;
    }

    const requiresRestart = changedKeys.some((key) =>
      FOUNDATION_RESTART_SETTING_KEYS.has(key),
    );
    this.status = {
      tone: "idle",
      text: requiresRestart
        ? "Setup parameters saved. Generate Map or Restart to apply."
        : "Mechanics applied to the running simulation.",
    };
  }

  private statusFromCommandResult(
    result: ReturnType<FoundationRuntime["dispatch"]>,
    tile: { x: number; y: number },
  ): FoundationClientStatus {
    if (result.ok) {
      const explorationStartedEvent = result.update.events.find(
        (event) => event.type === "foundation.wilderness_exploration_started",
      );
      if (explorationStartedEvent) {
        const committedTroops =
          typeof explorationStartedEvent.payload === "object" &&
          explorationStartedEvent.payload !== null &&
          "committedTroops" in explorationStartedEvent.payload
            ? Number(explorationStartedEvent.payload.committedTroops)
            : 0;
        return {
          tone: "ok",
          text: `Exploring toward ${tile.x}, ${tile.y} with ${renderTroops(
            committedTroops,
          )} troops.`,
        };
      }

      return {
        tone: "ok",
        text: `Placed player at ${tile.x}, ${tile.y}.`,
      };
    }

    return {
      tone: "error",
      text:
        result.error === "exploration_already_active"
          ? "Wilderness exploration is already active."
          : result.error === "target_already_owned"
            ? "Click unclaimed wilderness to explore."
            : `Command rejected: ${result.error ?? "unknown"}.`,
    };
  }

  private applyMapUpdate(mapUpdate: FoundationMapUpdate | undefined): void {
    if (!this.runtime || !this.renderer || !mapUpdate) return;
    const changedTiles = mapUpdate.changedTiles;
    const changedTileStates = mapUpdate.changedTileStates;
    if (!changedTiles || !changedTileStates || changedTiles.length === 0) {
      return;
    }

    const deltas: BaseMapTileStateDelta[] = [];
    for (let i = 0; i < changedTiles.length; i++) {
      deltas.push({
        ref: changedTiles[i],
        state: changedTileStates[i],
      });
    }
    this.renderer.applyTileStateDeltas(
      this.runtime.map().stateBuffer(),
      deltas,
    );
  }

  private resizeRenderer(): void {
    if (!this.renderer) return;
    const rect = this.canvas.getBoundingClientRect();
    this.renderer.resize(rect.width, rect.height);
  }

  private resetRuntime(statusText: string): void {
    this.renderer?.dispose();
    this.renderer = null;
    const foundationMap =
      this.tuningSettings.mapGenerator === "world-engine"
        ? createWorldEngineFoundationMap(this.tuningSettings)
        : {
            map: createFoundationMap({
              width: this.tuningSettings.width,
              height: this.tuningSettings.height,
              elevation: this.tuningSettings.elevation,
            }),
            terrainColors: undefined,
          };
    this.runtime = createFoundationRuntime({
      map: foundationMap.map,
      parameters: this.tuningSettings,
    });
    this.snapshot = this.runtime.snapshot();

    const map = this.runtime.map();
    this.renderer = new BaseMapWebGLAdapter({
      width: map.width(),
      height: map.height(),
      terrainBytes: map.terrainBuffer(),
      terrainColors: foundationMap.terrainColors,
      tileState: map.stateBuffer(),
      palette: FOUNDATION_PLAYER_PALETTE,
      canvas: this.canvas,
    });
    this.resizeRenderer();
    this.renderer.fitMap();
    this.status = {
      tone: "idle",
      text: statusText,
    };
  }

  private configureTickTimer(): void {
    if (this.tickTimer !== null) {
      window.clearInterval(this.tickTimer);
    }
    this.tickTimer = window.setInterval(
      this.advanceRuntimeTick,
      this.tuningSettings.tickIntervalMs,
    );
  }
}

function foundationTuningOverridesFromLocation(): {
  elevation?: "flat" | "rolling";
  mapGenerator?: "foundation" | "world-engine";
} {
  const params = new URLSearchParams(window.location.search);
  const overrides: {
    elevation?: "flat" | "rolling";
    mapGenerator?: "foundation" | "world-engine";
  } = { mapGenerator: "world-engine" };
  const elevation = params.get("elevation");
  if (elevation === "rolling" || elevation === "flat") {
    overrides.elevation = elevation;
  }
  const generator = params.get("generator") ?? params.get("map");
  if (generator === "foundation" || generator === "world-engine") {
    overrides.mapGenerator = generator;
  }
  return overrides;
}

function formatSelectedTile(
  snapshot: FoundationRuntimeSnapshot | null,
): string {
  if (
    snapshot?.player.selectedTile === null ||
    snapshot?.player.selectedTile === undefined
  ) {
    return "none";
  }
  return snapshot.player.selectedTile.toLocaleString();
}

function formatTroops(value: number | undefined): string {
  return renderTroops(value ?? 0);
}

function formatTroopRate(value: number | undefined): string {
  return `${renderTroops((value ?? 0) * 10)}/s`;
}

declare global {
  interface HTMLElementTagNameMap {
    "foundation-page": FoundationPage;
  }
}

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
import "./FoundationDebugPanel";
import type { FoundationClientStatus } from "./FoundationDebugPanel";
import "./FoundationTuningPanel";
import {
  DEFAULT_FOUNDATION_TUNING_SETTINGS,
  FoundationTuningSettings,
  loadFoundationTuningSettings,
  saveFoundationTuningSettings,
} from "./FoundationTuningSettings";

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
      overflow: hidden;
      background: #0e1813;
      color: #edf7f3;
      font-family:
        Inter,
        ui-sans-serif,
        system-ui,
        -apple-system,
        BlinkMacSystemFont,
        "Segoe UI",
        sans-serif;
    }

    .stage {
      position: fixed;
      inset: 0;
      min-width: 100%;
      min-height: 100%;
    }

    canvas {
      display: block;
      width: 100%;
      height: 100%;
      cursor: crosshair;
      touch-action: none;
      background: #213722;
    }

    .overlay {
      position: fixed;
      top: 12px;
      left: 12px;
      z-index: 2;
      pointer-events: none;
    }

    @media (max-width: 520px) {
      .overlay {
        right: 12px;
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
    return html`
      <div class="stage">
        <canvas aria-label="Foundation all-grass map"></canvas>
      </div>
      <div class="overlay">
        <foundation-debug-panel
          .snapshot=${this.snapshot}
          .status=${this.status}
          .paused=${this.paused}
          @foundation-play-pause=${this.togglePlayPause}
          @foundation-reset-simulation=${this.handleResetSimulation}
        ></foundation-debug-panel>
        <foundation-tuning-panel
          .settings=${this.tuningSettings}
          @foundation-tuning-change=${this.handleTuningChange}
          @foundation-tuning-reset=${this.handleTuningReset}
          @foundation-tuning-copy=${this.handleTuningCopy}
        ></foundation-tuning-panel>
      </div>
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

  private readonly handleResetSimulation = (): void => {
    this.paused = false;
    this.resetRuntime("Simulation reset with current parameters.");
    this.configureTickTimer();
  };

  private readonly handleTuningChange = (
    event: CustomEvent<FoundationTuningSettings>,
  ): void => {
    this.tuningSettings = event.detail;
    saveFoundationTuningSettings(this.tuningSettings);
    this.configureTickTimer();
    this.status = {
      tone: "idle",
      text: "Parameters saved. Reset simulation to apply map and mechanics.",
    };
  };

  private readonly handleTuningReset = (
    event: CustomEvent<FoundationTuningSettings>,
  ): void => {
    this.tuningSettings = event.detail;
    saveFoundationTuningSettings(this.tuningSettings);
    this.paused = false;
    this.resetRuntime("Parameters reset to defaults.");
    this.configureTickTimer();
  };

  private readonly handleTuningCopy = (
    event: CustomEvent<{ ok: boolean }>,
  ): void => {
    this.status = {
      tone: event.detail.ok ? "ok" : "error",
      text: event.detail.ok
        ? "Parameters copied as JSON."
        : "Could not copy parameters.",
    };
  };

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
  } = {};
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

declare global {
  interface HTMLElementTagNameMap {
    "foundation-page": FoundationPage;
  }
}

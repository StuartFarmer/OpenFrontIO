import { Controller } from "../Controller";
import { TransformHandler } from "../TransformHandler";
import { UIState } from "../UIState";
import { FrameProfiler } from "./FrameProfiler";
import { PerformanceOverlay } from "./layers/PerformanceOverlay";

export class GameRenderer {
  private layerTickState = new Map<Controller, { lastTickAtMs: number }>();

  constructor(
    public transformHandler: TransformHandler,
    public uiState: UIState,
    private layers: Controller[],
    private performanceOverlay: PerformanceOverlay,
  ) {}

  initialize() {
    this.layers.forEach((l) => l.init?.());

    window.addEventListener("resize", () =>
      this.transformHandler.updateCanvasBoundingRect(),
    );

    //show whole map on startup
    this.transformHandler.centerAll(0.9);
  }

  tick() {
    const nowMs = performance.now();
    const shouldProfileTick = FrameProfiler.isEnabled();

    const tickLayerDurations: Record<string, number> = {};

    for (const layer of this.layers) {
      if (!layer.tick) {
        continue;
      }

      const state = this.layerTickState.get(layer) ?? {
        lastTickAtMs: -Infinity,
      };

      const intervalMs = layer.getTickIntervalMs?.() ?? 0;
      if (intervalMs > 0 && nowMs - state.lastTickAtMs < intervalMs) {
        this.layerTickState.set(layer, state);
        continue;
      }

      state.lastTickAtMs = nowMs;
      this.layerTickState.set(layer, state);

      const tickStart = shouldProfileTick ? performance.now() : 0;
      layer.tick();
      if (shouldProfileTick && tickStart !== 0) {
        const duration = performance.now() - tickStart;
        const label = layer.constructor?.name ?? "UnknownLayer";
        tickLayerDurations[label] = (tickLayerDurations[label] ?? 0) + duration;
      }
    }

    if (shouldProfileTick) {
      this.performanceOverlay.updateTickLayerMetrics(tickLayerDurations);
    }
  }
}

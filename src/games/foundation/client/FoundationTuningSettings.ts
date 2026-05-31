import {
  DEFAULT_FOUNDATION_SIMULATION_PARAMETERS,
  DEFAULT_FOUNDATION_WORLD_ENGINE_MAP_CONFIG,
  FoundationElevationPreset,
  FoundationSimulationParameters,
  FoundationWorldEngineMapConfig,
  normalizeFoundationSimulationParameters,
  normalizeFoundationWorldEngineMapConfig,
} from "../domain";

export type FoundationMapGenerator = "foundation" | "world-engine";

export interface FoundationTuningSettings
  extends FoundationSimulationParameters, FoundationWorldEngineMapConfig {
  mapGenerator: FoundationMapGenerator;
  elevation: FoundationElevationPreset;
  tickIntervalMs: number;
  attackRatio: number;
  autoGenerateWorld: boolean;
}

export const FOUNDATION_TUNING_STORAGE_KEY = "foundation.tuning.v1";

export const DEFAULT_FOUNDATION_TUNING_SETTINGS: FoundationTuningSettings = {
  mapGenerator: "world-engine",
  elevation: "flat",
  tickIntervalMs: 100,
  attackRatio: 0.2,
  autoGenerateWorld: true,
  ...DEFAULT_FOUNDATION_WORLD_ENGINE_MAP_CONFIG,
  ...DEFAULT_FOUNDATION_SIMULATION_PARAMETERS,
};

export interface FoundationTuningUrlOverrides {
  elevation?: FoundationElevationPreset;
  mapGenerator?: FoundationMapGenerator;
}

export function loadFoundationTuningSettings(
  urlOverrides: FoundationTuningUrlOverrides = {},
): FoundationTuningSettings {
  if (typeof window === "undefined") {
    return {
      ...DEFAULT_FOUNDATION_TUNING_SETTINGS,
      ...urlOverrides,
    };
  }

  const stored = window.localStorage.getItem(FOUNDATION_TUNING_STORAGE_KEY);
  if (stored === null) {
    return {
      ...DEFAULT_FOUNDATION_TUNING_SETTINGS,
      ...urlOverrides,
    };
  }

  try {
    return normalizeFoundationTuningSettings({
      ...JSON.parse(stored),
      ...urlOverrides,
    });
  } catch {
    return {
      ...DEFAULT_FOUNDATION_TUNING_SETTINGS,
      ...urlOverrides,
    };
  }
}

export function saveFoundationTuningSettings(
  settings: FoundationTuningSettings,
): void {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.setItem(
    FOUNDATION_TUNING_STORAGE_KEY,
    JSON.stringify(settings),
  );
}

export function normalizeFoundationTuningSettings(
  settings: Partial<FoundationTuningSettings> = {},
): FoundationTuningSettings {
  const simulation = normalizeFoundationSimulationParameters(settings);
  const worldMap = normalizeFoundationWorldEngineMapConfig(settings);
  return {
    ...simulation,
    ...worldMap,
    mapGenerator:
      settings.mapGenerator === "foundation" ? "foundation" : "world-engine",
    elevation: settings.elevation === "rolling" ? "rolling" : "flat",
    tickIntervalMs: clampNumber(
      settings.tickIntervalMs,
      DEFAULT_FOUNDATION_TUNING_SETTINGS.tickIntervalMs,
      20,
      1000,
    ),
    attackRatio: clampNumber(
      settings.attackRatio,
      DEFAULT_FOUNDATION_TUNING_SETTINGS.attackRatio,
      0.01,
      1,
    ),
    autoGenerateWorld: settings.autoGenerateWorld !== false,
  };
}

function clampNumber(
  value: number | undefined,
  fallback: number,
  min: number,
  max: number,
): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return fallback;
  }
  return Math.max(min, Math.min(max, value));
}

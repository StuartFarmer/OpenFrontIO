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
  foodYieldMin: number;
  foodYieldMax: number;
  foodYieldK: number;
  oilYieldMin: number;
  oilYieldMax: number;
  oilYieldK: number;
  metalYieldMin: number;
  metalYieldMax: number;
  metalYieldK: number;
}

export const FOUNDATION_TUNING_STORAGE_KEY = "foundation.tuning.v1";

export const DEFAULT_FOUNDATION_TUNING_SETTINGS: FoundationTuningSettings = {
  mapGenerator: "world-engine",
  elevation: "flat",
  tickIntervalMs: 100,
  attackRatio: 0.2,
  autoGenerateWorld: true,
  foodYieldMin: 1,
  foodYieldMax: 3,
  foodYieldK: 10,
  oilYieldMin: 1,
  oilYieldMax: 1,
  oilYieldK: 0,
  metalYieldMin: 1,
  metalYieldMax: 1,
  metalYieldK: 0,
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
  const legacySettings = settings as Partial<FoundationTuningSettings> & {
    cropFoodMinYield?: number;
    cropFoodMaxYield?: number;
    cropFoodYieldK?: number;
  };
  const foodYieldMin = normalizeYieldSetting(
    settings.foodYieldMin ?? legacySettings.cropFoodMinYield,
    DEFAULT_FOUNDATION_TUNING_SETTINGS.foodYieldMin,
  );
  const oilYieldMin = normalizeYieldSetting(
    settings.oilYieldMin,
    DEFAULT_FOUNDATION_TUNING_SETTINGS.oilYieldMin,
  );
  const metalYieldMin = normalizeYieldSetting(
    settings.metalYieldMin,
    DEFAULT_FOUNDATION_TUNING_SETTINGS.metalYieldMin,
  );
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
    foodYieldMin,
    foodYieldMax: Math.max(
      normalizeYieldSetting(
        settings.foodYieldMax ?? legacySettings.cropFoodMaxYield,
        DEFAULT_FOUNDATION_TUNING_SETTINGS.foodYieldMax,
      ),
      foodYieldMin,
    ),
    foodYieldK: clampNumber(
      settings.foodYieldK ?? legacySettings.cropFoodYieldK,
      DEFAULT_FOUNDATION_TUNING_SETTINGS.foodYieldK,
      0,
      30,
    ),
    oilYieldMin,
    oilYieldMax: Math.max(
      normalizeYieldSetting(
        settings.oilYieldMax,
        DEFAULT_FOUNDATION_TUNING_SETTINGS.oilYieldMax,
      ),
      oilYieldMin,
    ),
    oilYieldK: clampNumber(
      settings.oilYieldK,
      DEFAULT_FOUNDATION_TUNING_SETTINGS.oilYieldK,
      0,
      30,
    ),
    metalYieldMin,
    metalYieldMax: Math.max(
      normalizeYieldSetting(
        settings.metalYieldMax,
        DEFAULT_FOUNDATION_TUNING_SETTINGS.metalYieldMax,
      ),
      metalYieldMin,
    ),
    metalYieldK: clampNumber(
      settings.metalYieldK,
      DEFAULT_FOUNDATION_TUNING_SETTINGS.metalYieldK,
      0,
      30,
    ),
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

function normalizeYieldSetting(
  value: number | undefined,
  fallback: number,
): number {
  return clampNumber(value, fallback, 0, 100000);
}

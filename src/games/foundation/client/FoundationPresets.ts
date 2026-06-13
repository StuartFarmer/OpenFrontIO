import {
  FoundationTuningSettings,
  normalizeFoundationTuningSettings,
} from "./FoundationTuningSettings";

export type FoundationPresetKind =
  | "world-generation"
  | "world-map"
  | "game-mechanics";

export interface FoundationPreset<TKind extends FoundationPresetKind, TData> {
  id: string;
  kind: TKind;
  name: string;
  createdAt: number;
  updatedAt: number;
  version: 1;
  data: TData;
}

export type FoundationWorldGenerationPresetData = Pick<
  FoundationTuningSettings,
  | "mapGenerator"
  | "elevation"
  | "seaLevel"
  | "continentScale"
  | "mountainStrength"
  | "coastFalloff"
  | "coastRoughness"
  | "latitudeEffect"
  | "elevationCooling"
  | "rainNoise"
  | "warmthRainfall"
  | "riverFlowRetention"
  | "lakeWaterThreshold"
  | "lakeElevationRange"
  | "riverWeakThreshold"
  | "riverStrongThreshold"
>;

export type FoundationWorldMapPresetData = Pick<
  FoundationTuningSettings,
  "seed" | "width" | "height" | keyof FoundationWorldGenerationPresetData
>;

export type FoundationGameMechanicPresetData = Pick<
  FoundationTuningSettings,
  | "tickIntervalMs"
  | "attackRatio"
  | "startingTroops"
  | "startingFoodStorage"
  | "baseFoodStorageCapacity"
  | "baseSilosOwned"
  | "addedStorageCapacityPerSilo"
  | "stockpileGrowthRate"
  | "placementRadius"
  | "foodPerTroop"
  | "foodPerTile"
  | "foodReservePercentage"
  | "maxPopulationGrowthRate"
  | "maxTroopMultiplier"
  | "maxTroopTileExponent"
  | "maxTroopTileScale"
  | "maxTroopBase"
  | "troopRegenBase"
  | "troopRegenExponent"
  | "troopRegenDivisor"
  | "wildernessMechanics"
  | "wildernessBaseSpeed"
  | "elevationSlopeScale"
  | "minToblerSpeedMultiplier"
  | "maxToblerSpeedMultiplier"
  | "terrainPriorityElevationScale"
  | "wildernessDistanceFocus"
  | "wildernessFrontCapacity"
  | "wildernessAttackerLossPerTile"
  | "wildernessTilesPerTickMultiplier"
  | "foodYieldMin"
  | "foodYieldMax"
  | "foodYieldK"
  | "oilYieldMin"
  | "oilYieldMax"
  | "oilYieldK"
  | "metalYieldMin"
  | "metalYieldMax"
  | "metalYieldK"
>;

export type FoundationStoredPreset =
  | FoundationPreset<"world-generation", FoundationWorldGenerationPresetData>
  | FoundationPreset<"world-map", FoundationWorldMapPresetData>
  | FoundationPreset<"game-mechanics", FoundationGameMechanicPresetData>;

export const FOUNDATION_PRESETS_STORAGE_KEY = "foundation.presets.v1";

export const FOUNDATION_WORLD_GENERATION_PRESET_KEYS = [
  "mapGenerator",
  "elevation",
  "seaLevel",
  "continentScale",
  "mountainStrength",
  "coastFalloff",
  "coastRoughness",
  "latitudeEffect",
  "elevationCooling",
  "rainNoise",
  "warmthRainfall",
  "riverFlowRetention",
  "lakeWaterThreshold",
  "lakeElevationRange",
  "riverWeakThreshold",
  "riverStrongThreshold",
] as const satisfies readonly (keyof FoundationWorldGenerationPresetData)[];

export const FOUNDATION_WORLD_MAP_PRESET_KEYS = [
  "seed",
  "width",
  "height",
  ...FOUNDATION_WORLD_GENERATION_PRESET_KEYS,
] as const satisfies readonly (keyof FoundationWorldMapPresetData)[];

export const FOUNDATION_GAME_MECHANIC_PRESET_KEYS = [
  "tickIntervalMs",
  "attackRatio",
  "startingTroops",
  "startingFoodStorage",
  "baseFoodStorageCapacity",
  "baseSilosOwned",
  "addedStorageCapacityPerSilo",
  "stockpileGrowthRate",
  "placementRadius",
  "foodPerTroop",
  "foodPerTile",
  "foodReservePercentage",
  "maxPopulationGrowthRate",
  "maxTroopMultiplier",
  "maxTroopTileExponent",
  "maxTroopTileScale",
  "maxTroopBase",
  "troopRegenBase",
  "troopRegenExponent",
  "troopRegenDivisor",
  "wildernessMechanics",
  "wildernessBaseSpeed",
  "elevationSlopeScale",
  "minToblerSpeedMultiplier",
  "maxToblerSpeedMultiplier",
  "terrainPriorityElevationScale",
  "wildernessDistanceFocus",
  "wildernessFrontCapacity",
  "wildernessAttackerLossPerTile",
  "wildernessTilesPerTickMultiplier",
  "foodYieldMin",
  "foodYieldMax",
  "foodYieldK",
  "oilYieldMin",
  "oilYieldMax",
  "oilYieldK",
  "metalYieldMin",
  "metalYieldMax",
  "metalYieldK",
] as const satisfies readonly (keyof FoundationGameMechanicPresetData)[];

export function loadFoundationPresets(): FoundationStoredPreset[] {
  if (typeof window === "undefined") {
    return [];
  }

  const stored = window.localStorage.getItem(FOUNDATION_PRESETS_STORAGE_KEY);
  if (stored === null) {
    return [];
  }

  try {
    const parsed = JSON.parse(stored);
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed.flatMap((value) => normalizeStoredPreset(value));
  } catch {
    return [];
  }
}

export function saveFoundationPresets(
  presets: readonly FoundationStoredPreset[],
): void {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.setItem(
    FOUNDATION_PRESETS_STORAGE_KEY,
    JSON.stringify(presets),
  );
}

export function upsertFoundationPreset(
  presets: readonly FoundationStoredPreset[],
  preset: FoundationStoredPreset,
): FoundationStoredPreset[] {
  const index = presets.findIndex((candidate) => candidate.id === preset.id);
  if (index === -1) {
    return [...presets, preset];
  }
  return presets.map((candidate, candidateIndex) =>
    candidateIndex === index ? preset : candidate,
  );
}

export function createFoundationPreset(
  kind: "world-generation",
  name: string,
  settings: FoundationTuningSettings,
): FoundationPreset<"world-generation", FoundationWorldGenerationPresetData>;
export function createFoundationPreset(
  kind: "world-map",
  name: string,
  settings: FoundationTuningSettings,
): FoundationPreset<"world-map", FoundationWorldMapPresetData>;
export function createFoundationPreset(
  kind: "game-mechanics",
  name: string,
  settings: FoundationTuningSettings,
): FoundationPreset<"game-mechanics", FoundationGameMechanicPresetData>;
export function createFoundationPreset(
  kind: FoundationPresetKind,
  name: string,
  settings: FoundationTuningSettings,
): FoundationStoredPreset;
export function createFoundationPreset(
  kind: FoundationPresetKind,
  name: string,
  settings: FoundationTuningSettings,
): FoundationStoredPreset {
  const now = Date.now();
  return {
    id: createPresetId(kind, now),
    kind,
    name: normalizePresetName(name, kind),
    createdAt: now,
    updatedAt: now,
    version: 1,
    data:
      kind === "world-generation"
        ? extractWorldGenerationPresetData(settings)
        : kind === "world-map"
          ? extractWorldMapPresetData(settings)
          : extractGameMechanicPresetData(settings),
  } as FoundationStoredPreset;
}

export function extractWorldGenerationPresetData(
  settings: FoundationTuningSettings,
): FoundationWorldGenerationPresetData {
  return pickPresetData(settings, FOUNDATION_WORLD_GENERATION_PRESET_KEYS);
}

export function extractWorldMapPresetData(
  settings: FoundationTuningSettings,
): FoundationWorldMapPresetData {
  return pickPresetData(settings, FOUNDATION_WORLD_MAP_PRESET_KEYS);
}

export function extractGameMechanicPresetData(
  settings: FoundationTuningSettings,
): FoundationGameMechanicPresetData {
  return pickPresetData(settings, FOUNDATION_GAME_MECHANIC_PRESET_KEYS);
}

export function applyWorldGenerationPresetData(
  settings: FoundationTuningSettings,
  data: FoundationWorldGenerationPresetData,
): FoundationTuningSettings {
  return normalizeFoundationTuningSettings({
    ...settings,
    ...data,
    seed: settings.seed,
    width: settings.width,
    height: settings.height,
  });
}

export function applyWorldMapPresetData(
  settings: FoundationTuningSettings,
  data: FoundationWorldMapPresetData,
): FoundationTuningSettings {
  return normalizeFoundationTuningSettings({
    ...settings,
    ...data,
  });
}

export function applyGameMechanicPresetData(
  settings: FoundationTuningSettings,
  data: FoundationGameMechanicPresetData,
): FoundationTuningSettings {
  return normalizeFoundationTuningSettings({
    ...settings,
    ...data,
  });
}

function normalizeStoredPreset(value: unknown): FoundationStoredPreset[] {
  if (!isRecord(value)) {
    return [];
  }
  const kind = value.kind;
  if (
    kind !== "world-generation" &&
    kind !== "world-map" &&
    kind !== "game-mechanics"
  ) {
    return [];
  }
  if (value.version !== 1) {
    return [];
  }
  const id = typeof value.id === "string" && value.id ? value.id : null;
  if (!id) {
    return [];
  }

  const normalizedSettings = normalizeFoundationTuningSettings(
    isRecord(value.data) ? value.data : {},
  );
  const createdAt = finiteTimestamp(value.createdAt);
  const updatedAt = finiteTimestamp(value.updatedAt);
  const base = {
    id,
    kind,
    name: normalizePresetName(
      typeof value.name === "string" ? value.name : "",
      kind,
    ),
    createdAt,
    updatedAt,
    version: 1 as const,
  };

  if (kind === "world-generation") {
    return [
      {
        ...base,
        kind,
        data: extractWorldGenerationPresetData(normalizedSettings),
      },
    ];
  }

  if (kind === "world-map") {
    return [
      {
        ...base,
        kind,
        data: extractWorldMapPresetData(normalizedSettings),
      },
    ];
  }

  return [
    {
      ...base,
      kind,
      data: extractGameMechanicPresetData(normalizedSettings),
    },
  ];
}

function pickPresetData<
  TKey extends keyof FoundationTuningSettings,
  TData extends Pick<FoundationTuningSettings, TKey>,
>(settings: FoundationTuningSettings, keys: readonly TKey[]): TData {
  const data: Partial<Pick<FoundationTuningSettings, TKey>> = {};
  for (const key of keys) {
    data[key] = settings[key];
  }
  return data as TData;
}

function createPresetId(kind: FoundationPresetKind, now: number): string {
  const random =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2);
  return `${kind}.${now}.${random}`;
}

function normalizePresetName(name: string, kind: FoundationPresetKind): string {
  const trimmed = name.trim();
  if (trimmed) {
    return trimmed.slice(0, 80);
  }
  if (kind === "world-generation") {
    return "Generation preset";
  }
  if (kind === "world-map") {
    return "Saved map";
  }
  return "Mechanic preset";
}

function finiteTimestamp(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value)
    ? value
    : Date.now();
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

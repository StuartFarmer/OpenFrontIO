export interface FoundationWildernessParameters {
  wildernessBaseSpeed: number;
  elevationSlopeScale: number;
  minToblerSpeedMultiplier: number;
  maxToblerSpeedMultiplier: number;
  terrainPriorityElevationScale: number;
  wildernessVectorSharpness: number;
  wildernessDirectionalPreviewDistance: number;
  wildernessDirectionalPreviewSharpness: number;
  wildernessDirectionalPreviewContrast: number;
  wildernessDirectionalPreviewFalloff: number;
  wildernessFrontCapacity: number;
  wildernessAttackerLossPerTile: number;
  wildernessTilesPerTickMultiplier: number;
}

export const DEFAULT_FOUNDATION_WILDERNESS_PARAMETERS: FoundationWildernessParameters =
  {
    wildernessBaseSpeed: 16.5,
    elevationSlopeScale: 0.3,
    minToblerSpeedMultiplier: 0.1,
    maxToblerSpeedMultiplier: 1.25,
    terrainPriorityElevationScale: 1,
    wildernessVectorSharpness: 1,
    wildernessDirectionalPreviewDistance: 32,
    wildernessDirectionalPreviewSharpness: 1,
    wildernessDirectionalPreviewContrast: 2.8,
    wildernessDirectionalPreviewFalloff: 8,
    wildernessFrontCapacity: 5_000,
    wildernessAttackerLossPerTile: 16,
    wildernessTilesPerTickMultiplier: 2,
  };

export function normalizeFoundationWildernessParameters(
  parameters: Partial<FoundationWildernessParameters> = {},
): FoundationWildernessParameters {
  return {
    wildernessBaseSpeed: positiveNumber(
      parameters.wildernessBaseSpeed,
      DEFAULT_FOUNDATION_WILDERNESS_PARAMETERS.wildernessBaseSpeed,
    ),
    elevationSlopeScale: nonNegativeNumber(
      parameters.elevationSlopeScale,
      DEFAULT_FOUNDATION_WILDERNESS_PARAMETERS.elevationSlopeScale,
    ),
    minToblerSpeedMultiplier: positiveNumber(
      parameters.minToblerSpeedMultiplier,
      DEFAULT_FOUNDATION_WILDERNESS_PARAMETERS.minToblerSpeedMultiplier,
    ),
    maxToblerSpeedMultiplier: positiveNumber(
      parameters.maxToblerSpeedMultiplier,
      DEFAULT_FOUNDATION_WILDERNESS_PARAMETERS.maxToblerSpeedMultiplier,
    ),
    terrainPriorityElevationScale: nonNegativeNumber(
      parameters.terrainPriorityElevationScale,
      DEFAULT_FOUNDATION_WILDERNESS_PARAMETERS.terrainPriorityElevationScale,
    ),
    wildernessVectorSharpness: nonNegativeNumber(
      parameters.wildernessVectorSharpness,
      DEFAULT_FOUNDATION_WILDERNESS_PARAMETERS.wildernessVectorSharpness,
    ),
    wildernessDirectionalPreviewDistance: positiveNumber(
      parameters.wildernessDirectionalPreviewDistance,
      DEFAULT_FOUNDATION_WILDERNESS_PARAMETERS.wildernessDirectionalPreviewDistance,
    ),
    wildernessDirectionalPreviewSharpness: nonNegativeNumber(
      parameters.wildernessDirectionalPreviewSharpness,
      DEFAULT_FOUNDATION_WILDERNESS_PARAMETERS.wildernessDirectionalPreviewSharpness,
    ),
    wildernessDirectionalPreviewContrast: nonNegativeNumber(
      parameters.wildernessDirectionalPreviewContrast,
      DEFAULT_FOUNDATION_WILDERNESS_PARAMETERS.wildernessDirectionalPreviewContrast,
    ),
    wildernessDirectionalPreviewFalloff: nonNegativeNumber(
      parameters.wildernessDirectionalPreviewFalloff,
      DEFAULT_FOUNDATION_WILDERNESS_PARAMETERS.wildernessDirectionalPreviewFalloff,
    ),
    wildernessFrontCapacity: positiveNumber(
      parameters.wildernessFrontCapacity,
      DEFAULT_FOUNDATION_WILDERNESS_PARAMETERS.wildernessFrontCapacity,
    ),
    wildernessAttackerLossPerTile: nonNegativeNumber(
      parameters.wildernessAttackerLossPerTile,
      DEFAULT_FOUNDATION_WILDERNESS_PARAMETERS.wildernessAttackerLossPerTile,
    ),
    wildernessTilesPerTickMultiplier: positiveNumber(
      parameters.wildernessTilesPerTickMultiplier,
      DEFAULT_FOUNDATION_WILDERNESS_PARAMETERS.wildernessTilesPerTickMultiplier,
    ),
  };
}

function positiveNumber(value: number | undefined, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) && value > 0
    ? value
    : fallback;
}

function nonNegativeNumber(
  value: number | undefined,
  fallback: number,
): number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0
    ? value
    : fallback;
}

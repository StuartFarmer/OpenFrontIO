export interface FoundationWildernessParameters {
  wildernessBaseSpeed: number;
  elevationSlopeScale: number;
  minToblerSpeedMultiplier: number;
  maxToblerSpeedMultiplier: number;
  terrainPriorityElevationScale: number;
}

export const DEFAULT_FOUNDATION_WILDERNESS_PARAMETERS: FoundationWildernessParameters =
  {
    wildernessBaseSpeed: 16.5,
    elevationSlopeScale: 0.3,
    minToblerSpeedMultiplier: 0.1,
    maxToblerSpeedMultiplier: 1.25,
    terrainPriorityElevationScale: 1,
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

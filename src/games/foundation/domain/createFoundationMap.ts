import { FoundationEngineTileMap } from "./EngineTileMap";
import {
  FOUNDATION_GRASS_TERRAIN_BYTE,
  foundationTerrainByteForElevation,
} from "./FoundationTerrain";

export const FOUNDATION_MAP_WIDTH = 256;
export const FOUNDATION_MAP_HEIGHT = 256;
export type FoundationElevationPreset = "flat" | "rolling";

export interface FoundationMapConfig {
  width?: number;
  height?: number;
  elevation?:
    | FoundationElevationPreset
    | ((x: number, y: number, width: number, height: number) => number);
}

export function createFoundationMap(
  config: FoundationMapConfig = {},
): FoundationEngineTileMap {
  const width = config.width ?? FOUNDATION_MAP_WIDTH;
  const height = config.height ?? FOUNDATION_MAP_HEIGHT;
  const terrain = new Uint8Array(width * height);
  const elevation = new Float32Array(width * height);
  const elevationSource = config.elevation ?? "flat";

  if (elevationSource === "flat") {
    terrain.fill(FOUNDATION_GRASS_TERRAIN_BYTE);
  } else {
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const ref = y * width + x;
        const value =
          typeof elevationSource === "function"
            ? elevationSource(x, y, width, height)
            : rollingElevation(x, y, width, height);
        elevation[ref] = clampElevation(value);
        terrain[ref] = foundationTerrainByteForElevation(elevation[ref]);
      }
    }
  }

  return new FoundationEngineTileMap(
    width,
    height,
    terrain,
    undefined,
    elevation,
  );
}

function rollingElevation(
  x: number,
  y: number,
  width: number,
  height: number,
): number {
  const nx = width <= 1 ? 0 : x / (width - 1);
  const ny = height <= 1 ? 0 : y / (height - 1);
  const ridge = 0.5 + 0.28 * Math.sin((nx * 2.1 + ny * 0.35) * Math.PI * 2);
  const folds = 0.18 * Math.cos((ny * 2.7 - nx * 0.45) * Math.PI * 2);
  const saddle = 0.12 * Math.sin((nx - ny) * Math.PI * 3);
  return ridge + folds + saddle;
}

function clampElevation(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }
  return Math.max(0, Math.min(1, value));
}

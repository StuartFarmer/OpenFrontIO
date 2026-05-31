import { FoundationEngineTileMap } from "./EngineTileMap";
import {
  foundationLandTerrainByteForElevation,
  foundationWaterTerrainByteForElevation,
} from "./FoundationTerrain";

export interface FoundationWorldEngineMapConfig {
  seed: number;
  width: number;
  height: number;
  seaLevel: number;
  continentScale: number;
  mountainStrength: number;
  coastFalloff: number;
  coastRoughness: number;
}

export const DEFAULT_FOUNDATION_WORLD_ENGINE_MAP_CONFIG: FoundationWorldEngineMapConfig =
  {
    seed: 1337,
    width: 256,
    height: 256,
    seaLevel: 0.46,
    continentScale: 0.92,
    mountainStrength: 0.56,
    coastFalloff: 0.78,
    coastRoughness: 0.42,
  };

type Color = readonly [r: number, g: number, b: number];

const ELEVATION_STOPS: readonly (readonly [number, Color])[] = [
  [0, [13, 45, 72]],
  [0.28, [38, 78, 92]],
  [0.42, [85, 120, 74]],
  [0.62, [133, 133, 82]],
  [0.8, [128, 112, 103]],
  [1, [232, 235, 226]],
];

const WORLD_ENGINE_GRASSLAND: Color = [134, 145, 78];
const WORLD_ENGINE_COAST: Color = [191, 171, 105];
const WORLD_ENGINE_OCEAN_SHALLOW: Color = [77, 151, 171];
const WORLD_ENGINE_OCEAN_SHELF: Color = [38, 115, 155];
const WORLD_ENGINE_OCEAN_DEEP: Color = [18, 74, 125];
const WORLD_ENGINE_OCEAN_ABYSS: Color = [7, 38, 83];
const WORLD_ENGINE_ALTITUDE_STOPS: readonly (readonly [number, Color])[] = [
  [0, [191, 171, 105]],
  [0.22, [96, 135, 72]],
  [0.48, [126, 127, 78]],
  [0.7, [133, 103, 78]],
  [0.88, [143, 134, 126]],
  [1, [226, 230, 222]],
];

export function createWorldEngineFoundationMap(
  config: Partial<FoundationWorldEngineMapConfig> = {},
): {
  map: FoundationEngineTileMap;
  terrainColors: Uint8Array;
} {
  const normalized = normalizeFoundationWorldEngineMapConfig(config);
  const elevation = generateWorldEngineElevation(normalized);
  const ocean = deriveWorldEngineOcean(elevation, normalized);
  const seaDepth = deriveWorldEngineSeaDepth(elevation, ocean, normalized);
  const terrain = new Uint8Array(normalized.width * normalized.height);

  for (let i = 0; i < elevation.length; i++) {
    terrain[i] = ocean[i]
      ? foundationWaterTerrainByteForElevation(elevation[i])
      : foundationLandTerrainByteForElevation(elevation[i]);
  }

  return {
    map: new FoundationEngineTileMap(
      normalized.width,
      normalized.height,
      terrain,
      undefined,
      elevation,
    ),
    terrainColors: buildWorldEngineTerrainColors(
      elevation,
      ocean,
      seaDepth,
      normalized,
    ),
  };
}

export function normalizeFoundationWorldEngineMapConfig(
  config: Partial<FoundationWorldEngineMapConfig> = {},
): FoundationWorldEngineMapConfig {
  return {
    seed: integer(
      config.seed,
      DEFAULT_FOUNDATION_WORLD_ENGINE_MAP_CONFIG.seed,
      -2147483648,
      2147483647,
    ),
    width: integer(
      config.width,
      DEFAULT_FOUNDATION_WORLD_ENGINE_MAP_CONFIG.width,
      32,
      1024,
    ),
    height: integer(
      config.height,
      DEFAULT_FOUNDATION_WORLD_ENGINE_MAP_CONFIG.height,
      32,
      1024,
    ),
    seaLevel: number(
      config.seaLevel,
      DEFAULT_FOUNDATION_WORLD_ENGINE_MAP_CONFIG.seaLevel,
      0.2,
      0.75,
    ),
    continentScale: number(
      config.continentScale,
      DEFAULT_FOUNDATION_WORLD_ENGINE_MAP_CONFIG.continentScale,
      0.35,
      1.6,
    ),
    mountainStrength: number(
      config.mountainStrength,
      DEFAULT_FOUNDATION_WORLD_ENGINE_MAP_CONFIG.mountainStrength,
      0,
      1,
    ),
    coastFalloff: number(
      config.coastFalloff,
      DEFAULT_FOUNDATION_WORLD_ENGINE_MAP_CONFIG.coastFalloff,
      0,
      1.4,
    ),
    coastRoughness: number(
      config.coastRoughness,
      DEFAULT_FOUNDATION_WORLD_ENGINE_MAP_CONFIG.coastRoughness,
      0,
      1,
    ),
  };
}

export function generateWorldEngineElevation(
  params: FoundationWorldEngineMapConfig,
): Float32Array {
  const { width, height, seed } = params;
  const data = new Float32Array(width * height);
  const continentFrequency = 2.15 / params.continentScale;
  const broadFrequency = 0.92 / params.continentScale;
  const detailFrequency = 7.5 / params.continentScale;
  const warpFrequency = 1.1 / params.continentScale;
  const warpStrength = 0.34 * params.continentScale;

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const nx = x / width;
      const ny = y / height;
      const warpX =
        (fbm(seed + 501, nx, ny, warpFrequency, 3, 0.55) - 0.5) * warpStrength;
      const warpY =
        (fbm(seed + 907, nx, ny, warpFrequency, 3, 0.55) - 0.5) * warpStrength;
      const sx = nx + warpX;
      const sy = ny + warpY;
      const continent = fbm(seed + 11, sx, sy, continentFrequency, 5, 0.58);
      const broad = fbm(seed + 37, sx + 8.3, sy - 3.1, broadFrequency, 3, 0.55);
      const landform = continent * 0.74 + broad * 0.26;
      const ridgeBase = fbm(seed + 97, sx, sy, detailFrequency, 5, 0.48);
      const ridges = 1 - Math.abs(ridgeBase * 2 - 1);
      const edgeDistance = Math.min(nx, 1 - nx, ny, 1 - ny);
      const edgeWaterBias =
        Math.pow(clamp((0.1 - edgeDistance) / 0.1), 2.2) *
        params.coastFalloff *
        0.24;
      const baseHeight =
        landform * 0.88 +
        Math.pow(ridges, 2.2) * params.mountainStrength * 0.48 -
        edgeWaterBias -
        0.14;
      const coastBand = Math.pow(
        clamp(1 - Math.abs(baseHeight - params.seaLevel) / 0.2),
        1.7,
      );
      const shoreNoise =
        (fbm(
          seed + 1601,
          sx + 4.7,
          sy - 2.9,
          18 / params.continentScale,
          3,
          0.56,
        ) -
          0.5) *
          0.7 +
        (fbm(
          seed + 2203,
          sx - 7.2,
          sy + 5.1,
          42 / params.continentScale,
          2,
          0.5,
        ) -
          0.5) *
          0.3;
      const shoreDetail = shoreNoise * params.coastRoughness * coastBand * 0.14;
      data[y * width + x] = clamp(baseHeight + shoreDetail);
    }
  }

  return data;
}

export function deriveWorldEngineOcean(
  elevation: Float32Array,
  params: Pick<FoundationWorldEngineMapConfig, "width" | "height" | "seaLevel">,
): Uint8Array {
  const { width, height, seaLevel } = params;
  const ocean = new Uint8Array(width * height);
  const queue: number[] = [];
  const enqueue = (x: number, y: number): void => {
    const ref = y * width + x;
    if (ocean[ref] !== 0 || elevation[ref] > seaLevel) {
      return;
    }
    ocean[ref] = 1;
    queue.push(ref);
  };

  for (let x = 0; x < width; x += 1) {
    enqueue(x, 0);
    enqueue(x, height - 1);
  }
  for (let y = 0; y < height; y += 1) {
    enqueue(0, y);
    enqueue(width - 1, y);
  }

  for (let head = 0; head < queue.length; head += 1) {
    const ref = queue[head];
    const x = ref % width;
    const y = Math.floor(ref / width);
    if (x > 0) enqueue(x - 1, y);
    if (x < width - 1) enqueue(x + 1, y);
    if (y > 0) enqueue(x, y - 1);
    if (y < height - 1) enqueue(x, y + 1);
  }

  return ocean;
}

export function deriveWorldEngineSeaDepth(
  elevation: Float32Array,
  ocean: Uint8Array,
  params: Pick<FoundationWorldEngineMapConfig, "seaLevel">,
): Float32Array {
  const seaDepth = new Float32Array(elevation.length);
  for (let i = 0; i < elevation.length; i += 1) {
    seaDepth[i] =
      ocean[i] !== 0
        ? clamp(
            (params.seaLevel - elevation[i]) / Math.max(0.01, params.seaLevel),
          )
        : 0;
  }
  return seaDepth;
}

export function buildWorldEngineElevationTerrainColors(
  elevation: Float32Array,
): Uint8Array {
  const pixels = new Uint8Array(elevation.length * 4);
  for (let i = 0; i < elevation.length; i++) {
    const [r, g, b] = worldEngineElevationPalette(elevation[i]);
    const offset = i * 4;
    pixels[offset] = r;
    pixels[offset + 1] = g;
    pixels[offset + 2] = b;
    pixels[offset + 3] = 255;
  }
  return pixels;
}

export function buildWorldEngineLandTerrainColors(
  elevation: Float32Array,
  params: Pick<
    FoundationWorldEngineMapConfig,
    "width" | "height" | "seed" | "seaLevel"
  >,
): Uint8Array {
  const pixels = new Uint8Array(elevation.length * 4);
  const { width, height, seed, seaLevel } = params;

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const i = y * width + x;
      const altitude = clamp(
        (elevation[i] - seaLevel) / Math.max(0.01, 1 - seaLevel),
      );
      const altitudeColor = colorRamp(altitude, WORLD_ENGINE_ALTITUDE_STOPS);
      let color = mixColor(WORLD_ENGINE_GRASSLAND, altitudeColor, 0.42);

      const west = elevationAt(elevation, x - 1, y, width, height);
      const east = elevationAt(elevation, x + 1, y, width, height);
      const north = elevationAt(elevation, x, y - 1, width, height);
      const south = elevationAt(elevation, x, y + 1, width, height);
      const light = clamp(1 + (west - east + north - south) * 3.6, 0.66, 1.34);
      color = shadeColor(color, light * (0.9 + altitude * 0.18));

      const contour = Math.abs(((altitude * 13) % 1) - 0.5);
      if (altitude > 0.12 && contour > 0.46) {
        color = shadeColor(color, 0.88);
      }

      const dither = hash(seed + 3907, x, y) - 0.5;
      color = [
        clampByte(color[0] + dither * 10),
        clampByte(color[1] + dither * 10),
        clampByte(color[2] + dither * 10),
      ];

      const offset = i * 4;
      pixels[offset] = color[0];
      pixels[offset + 1] = color[1];
      pixels[offset + 2] = color[2];
      pixels[offset + 3] = 255;
    }
  }

  return pixels;
}

export function buildWorldEngineTerrainColors(
  elevation: Float32Array,
  ocean: Uint8Array,
  seaDepth: Float32Array,
  params: Pick<
    FoundationWorldEngineMapConfig,
    "width" | "height" | "seed" | "seaLevel"
  >,
): Uint8Array {
  const pixels = new Uint8Array(elevation.length * 4);
  const { width, height, seed, seaLevel } = params;
  const blurredSeaDepth = blurOceanValues(seaDepth, ocean, width, height, 4);

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const i = y * width + x;
      let color: Color;

      if (ocean[i] !== 0) {
        const visibleDepth = lerp(blurredSeaDepth[i], seaDepth[i], 0.12);
        color = colorRamp(visibleDepth, [
          [0, WORLD_ENGINE_OCEAN_SHALLOW],
          [0.32, WORLD_ENGINE_OCEAN_SHELF],
          [0.7, WORLD_ENGINE_OCEAN_DEEP],
          [1, WORLD_ENGINE_OCEAN_ABYSS],
        ]);
      } else {
        const altitude = clamp(
          (elevation[i] - seaLevel) / Math.max(0.01, 1 - seaLevel),
        );
        const altitudeColor = colorRamp(altitude, WORLD_ENGINE_ALTITUDE_STOPS);
        color = mixColor(WORLD_ENGINE_GRASSLAND, altitudeColor, 0.42);

        if (
          hasOceanNeighbor(ocean, x, y, width, height) ||
          elevation[i] <= seaLevel + 0.055
        ) {
          const coastAmount = hasOceanNeighbor(ocean, x, y, width, height)
            ? 0.72
            : clamp(1 - (elevation[i] - seaLevel) / 0.055) * 0.48;
          color = mixColor(color, WORLD_ENGINE_COAST, coastAmount);
        }

        const west = elevationAt(elevation, x - 1, y, width, height);
        const east = elevationAt(elevation, x + 1, y, width, height);
        const north = elevationAt(elevation, x, y - 1, width, height);
        const south = elevationAt(elevation, x, y + 1, width, height);
        const light = clamp(
          1 + (west - east + north - south) * 3.6,
          0.66,
          1.34,
        );
        color = shadeColor(color, light * (0.9 + altitude * 0.18));

        const contour = Math.abs(((altitude * 13) % 1) - 0.5);
        if (altitude > 0.12 && contour > 0.46) {
          color = shadeColor(color, 0.88);
        }

        const dither = hash(seed + 3907, x, y) - 0.5;
        color = [
          clampByte(color[0] + dither * 10),
          clampByte(color[1] + dither * 10),
          clampByte(color[2] + dither * 10),
        ];
      }

      const offset = i * 4;
      pixels[offset] = color[0];
      pixels[offset + 1] = color[1];
      pixels[offset + 2] = color[2];
      pixels[offset + 3] = 255;
    }
  }

  return pixels;
}

export function worldEngineElevationPalette(value: number): Color {
  return colorRamp(value, ELEVATION_STOPS);
}

function hash(seed: number, x: number, y: number): number {
  let h = seed | 0;
  h ^= Math.imul(x | 0, 374761393);
  h ^= Math.imul(y | 0, 668265263);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967295;
}

function valueNoise(
  seed: number,
  x: number,
  y: number,
  frequency: number,
): number {
  const sx = x * frequency;
  const sy = y * frequency;
  const x0 = Math.floor(sx);
  const y0 = Math.floor(sy);
  const tx = smoothstep(sx - x0);
  const ty = smoothstep(sy - y0);
  const a = hash(seed, x0, y0);
  const b = hash(seed, x0 + 1, y0);
  const c = hash(seed, x0, y0 + 1);
  const d = hash(seed, x0 + 1, y0 + 1);
  return lerp(lerp(a, b, tx), lerp(c, d, tx), ty);
}

function fbm(
  seed: number,
  x: number,
  y: number,
  baseFrequency: number,
  octaves: number,
  persistence: number,
): number {
  let total = 0;
  let amplitude = 1;
  let max = 0;
  let frequency = baseFrequency;
  for (let i = 0; i < octaves; i += 1) {
    total += valueNoise(seed + i * 1013, x, y, frequency) * amplitude;
    max += amplitude;
    amplitude *= persistence;
    frequency *= 2;
  }
  return total / max;
}

function colorRamp(
  value: number,
  stops: readonly (readonly [number, Color])[],
): Color {
  const v = clamp(value);
  for (let i = 0; i < stops.length - 1; i += 1) {
    const left = stops[i];
    const right = stops[i + 1];
    if (v <= right[0]) {
      const t = (v - left[0]) / Math.max(0.0001, right[0] - left[0]);
      return [
        Math.round(lerp(left[1][0], right[1][0], t)),
        Math.round(lerp(left[1][1], right[1][1], t)),
        Math.round(lerp(left[1][2], right[1][2], t)),
      ];
    }
  }
  return stops[stops.length - 1][1];
}

function mixColor(a: Color, b: Color, t: number): Color {
  const amount = clamp(t);
  return [
    Math.round(lerp(a[0], b[0], amount)),
    Math.round(lerp(a[1], b[1], amount)),
    Math.round(lerp(a[2], b[2], amount)),
  ];
}

function shadeColor(color: Color, factor: number): Color {
  return [
    clampByte(color[0] * factor),
    clampByte(color[1] * factor),
    clampByte(color[2] * factor),
  ];
}

function elevationAt(
  elevation: Float32Array,
  x: number,
  y: number,
  width: number,
  height: number,
): number {
  const cx = clamp(x, 0, width - 1);
  const cy = clamp(y, 0, height - 1);
  return elevation[cy * width + cx];
}

function hasOceanNeighbor(
  ocean: Uint8Array,
  x: number,
  y: number,
  width: number,
  height: number,
): boolean {
  for (let dy = -1; dy <= 1; dy += 1) {
    for (let dx = -1; dx <= 1; dx += 1) {
      if (dx === 0 && dy === 0) continue;
      const nx = x + dx;
      const ny = y + dy;
      if (nx < 0 || nx >= width || ny < 0 || ny >= height) continue;
      if (ocean[ny * width + nx] !== 0) return true;
    }
  }
  return false;
}

function blurOceanValues(
  values: Float32Array,
  ocean: Uint8Array,
  width: number,
  height: number,
  radius: number,
): Float32Array {
  const blurred = new Float32Array(values.length);
  const radiusSquared = radius * radius;
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const ref = y * width + x;
      if (ocean[ref] === 0) continue;
      let total = 0;
      let weightTotal = 0;
      for (let dy = -radius; dy <= radius; dy += 1) {
        for (let dx = -radius; dx <= radius; dx += 1) {
          const distanceSquared = dx * dx + dy * dy;
          if (distanceSquared > radiusSquared) continue;
          const nx = x + dx;
          const ny = y + dy;
          if (nx < 0 || nx >= width || ny < 0 || ny >= height) continue;
          const neighbor = ny * width + nx;
          if (ocean[neighbor] === 0) continue;
          const weight = 1 / (1 + Math.sqrt(distanceSquared));
          total += values[neighbor] * weight;
          weightTotal += weight;
        }
      }
      blurred[ref] = weightTotal > 0 ? total / weightTotal : values[ref];
    }
  }
  return blurred;
}

function smoothstep(t: number): number {
  return t * t * (3 - 2 * t);
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function clamp(value: number, min = 0, max = 1): number {
  return Math.max(min, Math.min(max, value));
}

function clampByte(value: number): number {
  return Math.round(clamp(value, 0, 255));
}

function number(
  value: number | undefined,
  fallback: number,
  min: number,
  max: number,
): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return fallback;
  }
  return clamp(value, min, max);
}

function integer(
  value: number | undefined,
  fallback: number,
  min: number,
  max: number,
): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return fallback;
  }
  return Math.round(clamp(value, min, max));
}

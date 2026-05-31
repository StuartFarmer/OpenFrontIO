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
  latitudeEffect: number;
  elevationCooling: number;
  rainNoise: number;
  warmthRainfall: number;
  riverFlowRetention: number;
  lakeWaterThreshold: number;
  lakeElevationRange: number;
  riverWeakThreshold: number;
  riverStrongThreshold: number;
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
    latitudeEffect: 0.72,
    elevationCooling: 0.35,
    rainNoise: 0.62,
    warmthRainfall: 0.42,
    riverFlowRetention: 0.82,
    lakeWaterThreshold: 1.2,
    lakeElevationRange: 0.03,
    riverWeakThreshold: 0.28,
    riverStrongThreshold: 0.48,
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
const WORLD_ENGINE_LAND_DRY: Color = [205, 167, 88];
const WORLD_ENGINE_LAND_WET: Color = [35, 112, 67];
const WORLD_ENGINE_LAND_WARM_DRY: Color = [194, 122, 70];
const WORLD_ENGINE_LAND_COLD: Color = [190, 211, 216];
const WORLD_ENGINE_LAKE: Color = [55, 132, 153];
const WORLD_ENGINE_RIVER_STRONG: Color = [72, 160, 190];
const WORLD_ENGINE_RIVER_WEAK: Color = [63, 130, 142];
const WORLD_ENGINE_OCEAN_SHALLOW: Color = [77, 151, 171];
const WORLD_ENGINE_OCEAN_SHELF: Color = [38, 115, 155];
const WORLD_ENGINE_OCEAN_DEEP: Color = [18, 74, 125];
const WORLD_ENGINE_OCEAN_ABYSS: Color = [7, 38, 83];
const WORLD_ENGINE_OCEAN_WARM: Color = [49, 197, 184];
const WORLD_ENGINE_OCEAN_COLD: Color = [116, 164, 187];
const WORLD_ENGINE_BIOME_COLORS: readonly Color[] = [
  [18, 69, 108],
  [220, 234, 233],
  [143, 156, 145],
  [111, 139, 132],
  [153, 142, 88],
  [87, 119, 82],
  [52, 103, 82],
  [190, 154, 82],
  [134, 145, 78],
  [55, 117, 72],
  [178, 146, 74],
  [49, 114, 67],
  [31, 91, 57],
];
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
  const { data: temperature } = generateWorldEngineTemperature(
    elevation,
    ocean,
    normalized,
  );
  const precipitation = generateWorldEnginePrecipitation(
    elevation,
    ocean,
    temperature,
    normalized,
  );
  const seaDepth = deriveWorldEngineSeaDepth(elevation, ocean, normalized);
  const { watermap, lakes } = generateWorldEngineWatermap(
    elevation,
    ocean,
    precipitation,
    normalized,
  );
  const normalizedWatermap = normalizeWorldEngineLand(watermap, ocean);
  const irrigation = generateWorldEngineIrrigation(watermap, ocean, normalized);
  const humidity = generateWorldEngineHumidity(
    precipitation,
    irrigation,
    ocean,
  );
  const biome = generateWorldEngineBiome(ocean, temperature, humidity);
  const terrain = new Uint8Array(normalized.width * normalized.height);

  for (let i = 0; i < elevation.length; i++) {
    terrain[i] =
      ocean[i] || lakes[i]
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
      temperature,
      precipitation,
      seaDepth,
      normalizedWatermap,
      humidity,
      biome,
      lakes,
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
    latitudeEffect: number(
      config.latitudeEffect,
      DEFAULT_FOUNDATION_WORLD_ENGINE_MAP_CONFIG.latitudeEffect,
      0,
      1,
    ),
    elevationCooling: number(
      config.elevationCooling,
      DEFAULT_FOUNDATION_WORLD_ENGINE_MAP_CONFIG.elevationCooling,
      0,
      0.8,
    ),
    rainNoise: number(
      config.rainNoise,
      DEFAULT_FOUNDATION_WORLD_ENGINE_MAP_CONFIG.rainNoise,
      0,
      1,
    ),
    warmthRainfall: number(
      config.warmthRainfall,
      DEFAULT_FOUNDATION_WORLD_ENGINE_MAP_CONFIG.warmthRainfall,
      0,
      1,
    ),
    riverFlowRetention: number(
      config.riverFlowRetention,
      DEFAULT_FOUNDATION_WORLD_ENGINE_MAP_CONFIG.riverFlowRetention,
      0,
      1,
    ),
    lakeWaterThreshold: number(
      config.lakeWaterThreshold,
      DEFAULT_FOUNDATION_WORLD_ENGINE_MAP_CONFIG.lakeWaterThreshold,
      0.1,
      5,
    ),
    lakeElevationRange: number(
      config.lakeElevationRange,
      DEFAULT_FOUNDATION_WORLD_ENGINE_MAP_CONFIG.lakeElevationRange,
      0,
      0.5,
    ),
    riverWeakThreshold: number(
      config.riverWeakThreshold,
      DEFAULT_FOUNDATION_WORLD_ENGINE_MAP_CONFIG.riverWeakThreshold,
      0,
      1,
    ),
    riverStrongThreshold: number(
      config.riverStrongThreshold,
      DEFAULT_FOUNDATION_WORLD_ENGINE_MAP_CONFIG.riverStrongThreshold,
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

export function generateWorldEngineTemperature(
  elevation: Float32Array,
  ocean: Uint8Array,
  params: Pick<
    FoundationWorldEngineMapConfig,
    "width" | "height" | "seed" | "latitudeEffect" | "elevationCooling"
  >,
): { data: Float32Array; mountainThreshold: number } {
  const { width, height, seed } = params;
  const data = new Float32Array(width * height);
  const mountainThreshold = landQuantile(elevation, ocean, 0.9);

  for (let y = 0; y < height; y += 1) {
    const latitude = Math.abs((y / Math.max(1, height - 1)) * 2 - 1);
    const equatorWarmth = 1 - latitude;
    for (let x = 0; x < width; x += 1) {
      const i = y * width + x;
      const nx = x / width;
      const ny = y / height;
      const thermalNoise = fbm(seed + 211, nx, ny, 3.2, 4, 0.5) - 0.5;
      const altitude = Math.max(0, elevation[i] - mountainThreshold);
      const value =
        0.5 +
        (equatorWarmth - 0.5) * params.latitudeEffect +
        thermalNoise * 0.28 -
        altitude * params.elevationCooling * 1.9 +
        (ocean[i] ? 0.04 : 0);
      data[i] = clamp(value);
    }
  }

  return { data, mountainThreshold };
}

export function generateWorldEnginePrecipitation(
  elevation: Float32Array,
  ocean: Uint8Array,
  temperature: Float32Array,
  params: Pick<
    FoundationWorldEngineMapConfig,
    "width" | "height" | "seed" | "seaLevel" | "rainNoise" | "warmthRainfall"
  >,
): Float32Array {
  const { width, height, seed } = params;
  const data = new Float32Array(width * height);

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const i = y * width + x;
      const nx = x / width;
      const ny = y / height;
      const rainField = fbm(seed + 419, nx, ny, 4.2, 5, 0.52);
      const stormBand = fbm(seed + 727, nx + y * 0.002, ny, 1.8, 3, 0.6);
      const orographic = clamp(elevation[i] - params.seaLevel, 0, 1) * 0.24;
      const coastalMoisture = ocean[i] ? 0.18 : 0;
      const warmRain = temperature[i] * params.warmthRainfall;
      const value =
        rainField * params.rainNoise +
        stormBand * (1 - params.rainNoise) +
        warmRain +
        coastalMoisture +
        orographic;
      data[i] = clamp(value / (1.18 + params.warmthRainfall * 0.35));
    }
  }

  return data;
}

export interface WorldEngineDrainage {
  filled: Float32Array;
  flowTarget: Int32Array;
  visitOrder: Int32Array;
  orderLength: number;
}

export function buildWorldEngineDrainage(
  elevation: Float32Array,
  ocean: Uint8Array,
  params: Pick<FoundationWorldEngineMapConfig, "width" | "height" | "seaLevel">,
): WorldEngineDrainage {
  const { width, height, seaLevel } = params;
  const filled = new Float32Array(elevation);
  const flowTarget = new Int32Array(elevation.length);
  const visitOrder = new Int32Array(elevation.length);
  const visited = new Uint8Array(elevation.length);
  const heap: number[] = [];
  let orderLength = 0;
  flowTarget.fill(-1);

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const i = y * width + x;
      if (ocean[i] === 0) continue;
      visited[i] = 1;
      filled[i] = Math.min(elevation[i], seaLevel);
      if (isCoastalOcean(ocean, x, y, width, height)) {
        pushHeap(heap, filled, i);
        visitOrder[orderLength] = i;
        orderLength += 1;
      }
    }
  }

  while (heap.length > 0) {
    const current = popHeap(heap, filled);
    const x = current % width;
    const y = Math.floor(current / width);
    for (let dy = -1; dy <= 1; dy += 1) {
      for (let dx = -1; dx <= 1; dx += 1) {
        if (dx === 0 && dy === 0) continue;
        const nx = x + dx;
        const ny = y + dy;
        if (nx < 0 || nx >= width || ny < 0 || ny >= height) continue;
        const ni = ny * width + nx;
        if (visited[ni] !== 0) continue;
        visited[ni] = 1;
        filled[ni] = Math.max(elevation[ni], filled[current]);
        flowTarget[ni] = current;
        visitOrder[orderLength] = ni;
        orderLength += 1;
        pushHeap(heap, filled, ni);
      }
    }
  }

  return { filled, flowTarget, visitOrder, orderLength };
}

export function generateWorldEngineWatermap(
  elevation: Float32Array,
  ocean: Uint8Array,
  precipitation: Float32Array,
  params: Pick<
    FoundationWorldEngineMapConfig,
    | "width"
    | "height"
    | "seaLevel"
    | "riverFlowRetention"
    | "lakeWaterThreshold"
    | "lakeElevationRange"
  >,
): { watermap: Float32Array; lakes: Uint8Array } {
  const { width, height } = params;
  const watermap = new Float32Array(elevation.length);
  const lakes = new Uint8Array(elevation.length);
  const lakeCandidates = new Uint8Array(elevation.length);
  const lakeQueue: number[] = [];
  const { filled, flowTarget, visitOrder, orderLength } =
    buildWorldEngineDrainage(elevation, ocean, params);

  for (let i = 0; i < elevation.length; i += 1) {
    watermap[i] = ocean[i] ? 0 : precipitation[i];
  }

  for (let orderIndex = orderLength - 1; orderIndex >= 0; orderIndex -= 1) {
    const i = visitOrder[orderIndex];
    if (ocean[i] || watermap[i] <= 0) continue;
    const target = flowTarget[i];
    if (target >= 0) {
      const moved = watermap[i] * params.riverFlowRetention;
      if (!ocean[target]) watermap[target] += moved;
    }
  }

  for (let i = 0; i < elevation.length; i += 1) {
    if (ocean[i]) continue;
    const lakeDepth = filled[i] - elevation[i];
    if (lakeDepth <= params.lakeElevationRange) continue;
    lakeCandidates[i] = 1;
    if (watermap[i] > params.lakeWaterThreshold) {
      lakes[i] = 1;
      lakeQueue.push(i);
    }
  }

  for (let head = 0; head < lakeQueue.length; head += 1) {
    const current = lakeQueue[head];
    const x = current % width;
    const y = Math.floor(current / width);
    for (let dy = -1; dy <= 1; dy += 1) {
      for (let dx = -1; dx <= 1; dx += 1) {
        if (dx === 0 && dy === 0) continue;
        const nx = x + dx;
        const ny = y + dy;
        if (nx < 0 || nx >= width || ny < 0 || ny >= height) continue;
        const ni = ny * width + nx;
        if (!lakeCandidates[ni] || lakes[ni]) continue;
        if (Math.abs(filled[ni] - filled[current]) > 0.01) continue;
        lakes[ni] = 1;
        lakeQueue.push(ni);
      }
    }
  }

  return { watermap, lakes };
}

export function normalizeWorldEngineLand(
  values: Float32Array,
  ocean: Uint8Array,
): Float32Array {
  let max = 0;
  for (let i = 0; i < values.length; i += 1) {
    if (!ocean[i] && values[i] > max) max = values[i];
  }
  const normalized = new Float32Array(values.length);
  if (max <= 0) return normalized;
  for (let i = 0; i < values.length; i += 1) {
    normalized[i] = ocean[i] ? 0 : clamp(values[i] / max);
  }
  return normalized;
}

export function generateWorldEngineIrrigation(
  watermap: Float32Array,
  ocean: Uint8Array,
  params: Pick<FoundationWorldEngineMapConfig, "width" | "height">,
): Float32Array {
  const { width, height } = params;
  const source = normalizeWorldEngineLand(watermap, ocean);
  let current = new Float32Array(source);
  let next = new Float32Array(source.length);

  for (let pass = 0; pass < 8; pass += 1) {
    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        const i = y * width + x;
        if (ocean[i]) {
          next[i] = 0;
          continue;
        }
        let total = current[i] * 1.8;
        let weight = 1.8;
        for (let dy = -1; dy <= 1; dy += 1) {
          for (let dx = -1; dx <= 1; dx += 1) {
            if (dx === 0 && dy === 0) continue;
            const nx = x + dx;
            const ny = y + dy;
            if (nx < 0 || nx >= width || ny < 0 || ny >= height) continue;
            const ni = ny * width + nx;
            if (ocean[ni]) continue;
            total += current[ni] * 0.72;
            weight += 0.72;
          }
        }
        next[i] = Math.max(source[i], total / weight);
      }
    }
    [current, next] = [next, current];
  }

  return current;
}

export function generateWorldEngineHumidity(
  precipitation: Float32Array,
  irrigation: Float32Array,
  ocean: Uint8Array,
): Float32Array {
  const data = new Float32Array(precipitation.length);
  for (let i = 0; i < data.length; i += 1) {
    data[i] = ocean[i]
      ? 0
      : clamp(precipitation[i] * 0.68 + irrigation[i] * 0.55);
  }
  return data;
}

export function generateWorldEngineBiome(
  ocean: Uint8Array,
  temperature: Float32Array,
  humidity: Float32Array,
): Uint8Array {
  const biome = new Uint8Array(ocean.length);
  for (let i = 0; i < biome.length; i += 1) {
    if (ocean[i]) {
      biome[i] = 0;
      continue;
    }

    const t = temperature[i];
    const h = humidity[i];
    if (t < 0.2) biome[i] = h < 0.28 ? 2 : 3;
    else if (t < 0.38) biome[i] = h < 0.25 ? 4 : h < 0.58 ? 5 : 6;
    else if (t < 0.64) biome[i] = h < 0.2 ? 7 : h < 0.5 ? 8 : 9;
    else biome[i] = h < 0.18 ? 7 : h < 0.46 ? 10 : h < 0.72 ? 11 : 12;
  }
  return biome;
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
  temperature: Float32Array,
  precipitation: Float32Array,
  seaDepth: Float32Array,
  watermap: Float32Array,
  humidity: Float32Array,
  biome: Uint8Array,
  lakes: Uint8Array,
  params: Pick<
    FoundationWorldEngineMapConfig,
    | "width"
    | "height"
    | "seed"
    | "seaLevel"
    | "riverWeakThreshold"
    | "riverStrongThreshold"
  >,
): Uint8Array {
  const pixels = new Uint8Array(elevation.length * 4);
  const { width, height, seed, seaLevel } = params;
  const weakRiverThreshold = Math.min(
    params.riverWeakThreshold,
    params.riverStrongThreshold,
  );
  const strongRiverThreshold = Math.max(
    params.riverWeakThreshold,
    params.riverStrongThreshold,
  );
  const blurredSeaDepth = blurOceanValues(seaDepth, ocean, width, height, 4);
  const shallowWarmth = new Float32Array(seaDepth.length);

  for (let i = 0; i < seaDepth.length; i += 1) {
    if (ocean[i] === 0) continue;
    const shallow = clamp((0.68 - seaDepth[i]) / 0.68);
    const warm = clamp((temperature[i] - 0.48) / 0.38);
    shallowWarmth[i] = Math.pow(shallow, 0.7) * Math.pow(warm, 0.75);
  }

  const blurredShallowWarmth = blurOceanValues(
    shallowWarmth,
    ocean,
    width,
    height,
    2,
  );

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
        color = mixColor(
          color,
          WORLD_ENGINE_OCEAN_WARM,
          blurredShallowWarmth[i] * 0.58,
        );
        const coldWater = clamp((0.3 - temperature[i]) / 0.3);
        if (coldWater > 0) {
          color = mixColor(color, WORLD_ENGINE_OCEAN_COLD, coldWater * 0.35);
        }
      } else {
        color = WORLD_ENGINE_BIOME_COLORS[biome[i]] ?? WORLD_ENGINE_GRASSLAND;

        const warm = clamp((temperature[i] - 0.58) / 0.42);
        const cold = clamp((0.34 - temperature[i]) / 0.34);
        const wet = clamp((humidity[i] - 0.52) / 0.48);
        const dry = clamp((0.34 - humidity[i]) / 0.34);
        color = mixColor(color, WORLD_ENGINE_LAND_DRY, dry * 0.36);
        color = mixColor(color, WORLD_ENGINE_LAND_WET, wet * 0.34);
        color = mixColor(color, WORLD_ENGINE_LAND_WARM_DRY, warm * dry * 0.24);
        color = mixColor(color, WORLD_ENGINE_LAND_COLD, cold * 0.28);

        const altitude = clamp(
          (elevation[i] - seaLevel) / Math.max(0.01, 1 - seaLevel),
        );
        const altitudeColor = colorRamp(altitude, WORLD_ENGINE_ALTITUDE_STOPS);
        color = mixColor(color, altitudeColor, 0.42);

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

        const coldLand = clamp((0.36 - temperature[i]) / 0.36);
        if (coldLand > 0) {
          color = mixColor(color, WORLD_ENGINE_LAND_COLD, coldLand * 0.38);
        }

        const dither = hash(seed + 3907, x, y) - 0.5;
        const climateTexture = (precipitation[i] - 0.5) * 7 + dither * 10;
        color = [
          clampByte(color[0] + climateTexture),
          clampByte(color[1] + climateTexture),
          clampByte(color[2] + climateTexture),
        ];

        if (lakes[i]) {
          color = mixColor(color, WORLD_ENGINE_LAKE, 0.94);
        } else if (watermap[i] > weakRiverThreshold) {
          const riverSpan = Math.max(
            0.01,
            strongRiverThreshold - weakRiverThreshold,
          );
          const riverStrength = clamp(
            (watermap[i] - weakRiverThreshold) / riverSpan,
          );
          const riverColor = mixColor(
            WORLD_ENGINE_RIVER_WEAK,
            WORLD_ENGINE_RIVER_STRONG,
            riverStrength,
          );
          color = mixColor(color, riverColor, lerp(0.58, 0.9, riverStrength));
        }
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

function landQuantile(
  values: Float32Array,
  ocean: Uint8Array,
  quantile: number,
): number {
  const land: number[] = [];
  for (let i = 0; i < values.length; i += 1) {
    if (!ocean[i]) land.push(values[i]);
  }
  if (land.length === 0) return 1;
  land.sort((a, b) => a - b);
  return land[Math.floor((land.length - 1) * clamp(quantile))];
}

function pushHeap(
  heap: number[],
  priorities: Float32Array,
  value: number,
): void {
  heap.push(value);
  let child = heap.length - 1;
  while (child > 0) {
    const parent = (child - 1) >> 1;
    if (priorities[heap[parent]] <= priorities[value]) break;
    heap[child] = heap[parent];
    child = parent;
  }
  heap[child] = value;
}

function popHeap(heap: number[], priorities: Float32Array): number {
  const value = heap[0];
  const last = heap.pop();
  if (heap.length > 0 && last !== undefined) {
    let parent = 0;
    while (true) {
      let child = parent * 2 + 1;
      if (child >= heap.length) break;
      if (
        child + 1 < heap.length &&
        priorities[heap[child + 1]] < priorities[heap[child]]
      ) {
        child += 1;
      }
      if (priorities[last] <= priorities[heap[child]]) break;
      heap[parent] = heap[child];
      parent = child;
    }
    heap[parent] = last;
  }
  return value;
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

function isCoastalOcean(
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
      if (ocean[ny * width + nx] === 0) return true;
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

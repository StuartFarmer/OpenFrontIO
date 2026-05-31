import { describe, expect, it } from "vitest";
import {
  DEFAULT_FOUNDATION_WORLD_ENGINE_MAP_CONFIG,
  buildWorldEngineDrainage,
  buildWorldEngineElevationTerrainColors,
  buildWorldEngineTerrainColors,
  createWorldEngineFoundationMap,
  deriveFoundationWorldEngineResourceConfig,
  deriveWorldEngineOcean,
  deriveWorldEngineSeaDepth,
  generateWorldEngineBiome,
  generateWorldEngineElevation,
  generateWorldEngineHumidity,
  generateWorldEngineIrrigation,
  generateWorldEnginePermeability,
  generateWorldEnginePrecipitation,
  generateWorldEngineResourceMaps,
  generateWorldEngineRuggedness,
  generateWorldEngineTemperature,
  generateWorldEngineWatermap,
  isFoundationLandTerrainByte,
  normalizeWorldEngineLand,
  worldEngineElevationPalette,
} from "../../../src/games/foundation";

describe("WorldEngine elevation map generation", () => {
  it("generates deterministic normalized elevation values", () => {
    const config = {
      ...DEFAULT_FOUNDATION_WORLD_ENGINE_MAP_CONFIG,
      seed: 42,
      width: 16,
      height: 12,
    };

    const first = generateWorldEngineElevation(config);
    const second = generateWorldEngineElevation(config);

    expect(Array.from(first)).toEqual(Array.from(second));
    expect(first).toHaveLength(16 * 12);
    expect(Math.min(...first)).toBeGreaterThanOrEqual(0);
    expect(Math.max(...first)).toBeLessThanOrEqual(1);
  });

  it("builds a Foundation map with WorldEngine water-aware colors", () => {
    const { map, terrainColors, layers } = createWorldEngineFoundationMap({
      seed: 7,
      width: 32,
      height: 32,
    });

    expect(map.width()).toBe(32);
    expect(map.height()).toBe(32);
    expect(map.elevationBuffer()).toHaveLength(32 * 32);
    expect(terrainColors).toHaveLength(32 * 32 * 4);
    expect(layers.resources.crop).toHaveLength(32 * 32);
    expect(layers.resources.basin).toHaveLength(32 * 32);
    expect(layers.resources.oil).toHaveLength(32 * 32);
    expect(layers.resources.metal).toHaveLength(32 * 32);

    const ocean = deriveWorldEngineOcean(map.elevationBuffer(), {
      width: 32,
      height: 32,
      seaLevel: DEFAULT_FOUNDATION_WORLD_ENGINE_MAP_CONFIG.seaLevel,
    });
    const seaDepth = deriveWorldEngineSeaDepth(map.elevationBuffer(), ocean, {
      seaLevel: DEFAULT_FOUNDATION_WORLD_ENGINE_MAP_CONFIG.seaLevel,
    });
    const { data: temperature } = generateWorldEngineTemperature(
      map.elevationBuffer(),
      ocean,
      {
        width: 32,
        height: 32,
        seed: 7,
        latitudeEffect:
          DEFAULT_FOUNDATION_WORLD_ENGINE_MAP_CONFIG.latitudeEffect,
        elevationCooling:
          DEFAULT_FOUNDATION_WORLD_ENGINE_MAP_CONFIG.elevationCooling,
      },
    );
    const precipitation = generateWorldEnginePrecipitation(
      map.elevationBuffer(),
      ocean,
      temperature,
      {
        width: 32,
        height: 32,
        seed: 7,
        seaLevel: DEFAULT_FOUNDATION_WORLD_ENGINE_MAP_CONFIG.seaLevel,
        rainNoise: DEFAULT_FOUNDATION_WORLD_ENGINE_MAP_CONFIG.rainNoise,
        warmthRainfall:
          DEFAULT_FOUNDATION_WORLD_ENGINE_MAP_CONFIG.warmthRainfall,
      },
    );
    const renderConfig = {
      ...DEFAULT_FOUNDATION_WORLD_ENGINE_MAP_CONFIG,
      width: 32,
      height: 32,
      seed: 7,
    };
    const { watermap, lakes } = generateWorldEngineWatermap(
      map.elevationBuffer(),
      ocean,
      precipitation,
      renderConfig,
    );
    const normalizedWatermap = normalizeWorldEngineLand(watermap, ocean);
    const irrigation = generateWorldEngineIrrigation(
      watermap,
      ocean,
      renderConfig,
    );
    const humidity = generateWorldEngineHumidity(
      precipitation,
      irrigation,
      ocean,
    );
    const biome = generateWorldEngineBiome(ocean, temperature, humidity);

    expect(Array.from(terrainColors.slice(0, 4))).toEqual(
      Array.from(
        buildWorldEngineTerrainColors(
          map.elevationBuffer(),
          ocean,
          temperature,
          precipitation,
          seaDepth,
          normalizedWatermap,
          humidity,
          biome,
          lakes,
          {
            width: 32,
            height: 32,
            seed: 7,
            seaLevel: DEFAULT_FOUNDATION_WORLD_ENGINE_MAP_CONFIG.seaLevel,
            riverWeakThreshold:
              DEFAULT_FOUNDATION_WORLD_ENGINE_MAP_CONFIG.riverWeakThreshold,
            riverStrongThreshold:
              DEFAULT_FOUNDATION_WORLD_ENGINE_MAP_CONFIG.riverStrongThreshold,
          },
        ).slice(0, 4),
      ),
    );
  });

  it("marks only edge-connected below-sea-level tiles as ocean", () => {
    const width = 5;
    const height = 5;
    const elevation = new Float32Array(width * height).fill(0.8);
    elevation[0] = 0.1;
    elevation[1] = 0.1;
    elevation[6] = 0.1;
    elevation[12] = 0.1;

    const ocean = deriveWorldEngineOcean(elevation, {
      width,
      height,
      seaLevel: 0.2,
    });

    expect(ocean[0]).toBe(1);
    expect(ocean[1]).toBe(1);
    expect(ocean[6]).toBe(1);
    expect(ocean[12]).toBe(0);
  });

  it("derives sea depth only for ocean tiles", () => {
    const elevation = new Float32Array([0.1, 0.2, 0.7]);
    const ocean = new Uint8Array([1, 1, 0]);

    expect(
      Array.from(
        deriveWorldEngineSeaDepth(elevation, ocean, { seaLevel: 0.5 }),
      ),
    ).toEqual([0.800000011920929, 0.6000000238418579, 0]);
  });

  it("builds priority-flood drainage from coastal ocean into enclosed basins", () => {
    const width = 5;
    const height = 5;
    const elevation = new Float32Array(width * height).fill(0.8);
    for (let x = 0; x < width; x += 1) {
      elevation[x] = 0.1;
      elevation[(height - 1) * width + x] = 0.1;
    }
    for (let y = 0; y < height; y += 1) {
      elevation[y * width] = 0.1;
      elevation[y * width + width - 1] = 0.1;
    }
    elevation[12] = 0.3;
    const ocean = deriveWorldEngineOcean(elevation, {
      width,
      height,
      seaLevel: 0.2,
    });

    const drainage = buildWorldEngineDrainage(elevation, ocean, {
      width,
      height,
      seaLevel: 0.2,
    });

    expect(drainage.flowTarget[12]).toBeGreaterThanOrEqual(0);
    expect(drainage.filled[12]).toBeCloseTo(0.8);
  });

  it("detects lakes from filled depression depth and accumulated water", () => {
    const width = 5;
    const height = 5;
    const elevation = new Float32Array(width * height).fill(0.8);
    for (let x = 0; x < width; x += 1) {
      elevation[x] = 0.1;
      elevation[(height - 1) * width + x] = 0.1;
    }
    for (let y = 0; y < height; y += 1) {
      elevation[y * width] = 0.1;
      elevation[y * width + width - 1] = 0.1;
    }
    elevation[12] = 0.3;
    const ocean = deriveWorldEngineOcean(elevation, {
      width,
      height,
      seaLevel: 0.2,
    });
    const precipitation = new Float32Array(width * height).fill(1);

    const { watermap, lakes } = generateWorldEngineWatermap(
      elevation,
      ocean,
      precipitation,
      {
        width,
        height,
        seaLevel: 0.2,
        riverFlowRetention: 0.82,
        lakeWaterThreshold: 0.1,
        lakeElevationRange: 0.03,
      },
    );

    expect(watermap[12]).toBeGreaterThan(0.1);
    expect(lakes[12]).toBe(1);
  });

  it("normalizes accumulated land water and keeps ocean at zero", () => {
    const normalized = normalizeWorldEngineLand(
      new Float32Array([0, 2, 4]),
      new Uint8Array([1, 0, 0]),
    );

    expect(Array.from(normalized)).toEqual([0, 0.5, 1]);
  });

  it("clears the Foundation land bit on generated ocean terrain", () => {
    const lowSea = createWorldEngineFoundationMap({
      seed: 10,
      width: 64,
      height: 64,
      seaLevel: 0.2,
    });
    const highSea = createWorldEngineFoundationMap({
      seed: 10,
      width: 64,
      height: 64,
      seaLevel: 0.75,
    });

    const lowSeaWater = Array.from(lowSea.map.terrainBuffer()).filter(
      (terrain) => !isFoundationLandTerrainByte(terrain),
    ).length;
    const highSeaWater = Array.from(highSea.map.terrainBuffer()).filter(
      (terrain) => !isFoundationLandTerrainByte(terrain),
    ).length;

    expect(highSeaWater).toBeGreaterThanOrEqual(lowSeaWater);
    expect(highSeaWater).toBeGreaterThan(0);
  });

  it("uses the WorldEngine elevation color ramp endpoints", () => {
    expect(worldEngineElevationPalette(0)).toEqual([13, 45, 72]);
    expect(worldEngineElevationPalette(1)).toEqual([232, 235, 226]);
    expect(
      Array.from(
        buildWorldEngineElevationTerrainColors(new Float32Array([0, 1])),
      ),
    ).toEqual([13, 45, 72, 255, 232, 235, 226, 255]);
  });

  it("generates deterministic permeability with ocean tiles cleared", () => {
    const ocean = new Uint8Array([1, 0, 0, 1]);
    const params = {
      width: 2,
      height: 2,
      seed: 99,
    };

    const first = generateWorldEnginePermeability(ocean, params);
    const second = generateWorldEnginePermeability(ocean, params);

    expect(Array.from(first)).toEqual(Array.from(second));
    expect(first[0]).toBe(0);
    expect(first[3]).toBe(0);
    expect(first[1]).toBeGreaterThanOrEqual(0);
    expect(first[1]).toBeLessThanOrEqual(1);
  });

  it("generates ruggedness from local elevation differences", () => {
    const ruggedness = generateWorldEngineRuggedness(
      new Float32Array([0.5, 0.6, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5]),
      { width: 3, height: 3 },
    );

    expect(ruggedness[4]).toBeCloseTo(0.75);
    expect(Math.min(...ruggedness)).toBeGreaterThanOrEqual(0);
    expect(Math.max(...ruggedness)).toBeLessThanOrEqual(1);
  });

  it("generates bounded WorldEngine resource potentials", () => {
    const config = {
      ...DEFAULT_FOUNDATION_WORLD_ENGINE_MAP_CONFIG,
      seed: 123,
      width: 24,
      height: 18,
    };
    const resourceConfig = deriveFoundationWorldEngineResourceConfig(
      config.seed,
    );
    const elevation = generateWorldEngineElevation(config);
    const ocean = deriveWorldEngineOcean(elevation, config);
    const { data: temperature, mountainThreshold } =
      generateWorldEngineTemperature(elevation, ocean, config);
    const precipitation = generateWorldEnginePrecipitation(
      elevation,
      ocean,
      temperature,
      config,
    );
    const seaDepth = deriveWorldEngineSeaDepth(elevation, ocean, config);
    const { watermap } = generateWorldEngineWatermap(
      elevation,
      ocean,
      precipitation,
      config,
    );
    const normalizedWatermap = normalizeWorldEngineLand(watermap, ocean);
    const irrigation = generateWorldEngineIrrigation(watermap, ocean, config);
    const humidity = generateWorldEngineHumidity(
      precipitation,
      irrigation,
      ocean,
    );
    const permeability = generateWorldEnginePermeability(ocean, config);

    const first = generateWorldEngineResourceMaps(
      {
        elevation,
        ocean,
        temperature,
        precipitation,
        seaDepth,
        normalizedWatermap,
        irrigation,
        humidity,
        permeability,
        mountainThreshold,
      },
      {
        ...config,
        ...resourceConfig,
      },
    );
    const second = generateWorldEngineResourceMaps(
      {
        elevation,
        ocean,
        temperature,
        precipitation,
        seaDepth,
        normalizedWatermap,
        irrigation,
        humidity,
        permeability,
        mountainThreshold,
      },
      {
        ...config,
        ...resourceConfig,
      },
    );

    for (const key of ["crop", "basin", "oil", "metal"] as const) {
      expect(Array.from(first[key])).toEqual(Array.from(second[key]));
      expect(first[key]).toHaveLength(config.width * config.height);
      expect(Math.min(...first[key])).toBeGreaterThanOrEqual(0);
      expect(Math.max(...first[key])).toBeLessThanOrEqual(1);
    }

    for (let i = 0; i < ocean.length; i += 1) {
      if (ocean[i] === 0) continue;
      expect(first.crop[i]).toBe(0);
      expect(first.metal[i]).toBe(0);
    }
  });
});

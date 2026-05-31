import { describe, expect, it } from "vitest";
import {
  DEFAULT_FOUNDATION_WORLD_ENGINE_MAP_CONFIG,
  buildWorldEngineElevationTerrainColors,
  buildWorldEngineTerrainColors,
  createWorldEngineFoundationMap,
  deriveWorldEngineOcean,
  deriveWorldEngineSeaDepth,
  generateWorldEngineElevation,
  isFoundationLandTerrainByte,
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
    const { map, terrainColors } = createWorldEngineFoundationMap({
      seed: 7,
      width: 32,
      height: 32,
    });

    expect(map.width()).toBe(32);
    expect(map.height()).toBe(32);
    expect(map.elevationBuffer()).toHaveLength(32 * 32);
    expect(terrainColors).toHaveLength(32 * 32 * 4);

    const ocean = deriveWorldEngineOcean(map.elevationBuffer(), {
      width: 32,
      height: 32,
      seaLevel: DEFAULT_FOUNDATION_WORLD_ENGINE_MAP_CONFIG.seaLevel,
    });
    const seaDepth = deriveWorldEngineSeaDepth(map.elevationBuffer(), ocean, {
      seaLevel: DEFAULT_FOUNDATION_WORLD_ENGINE_MAP_CONFIG.seaLevel,
    });

    expect(Array.from(terrainColors.slice(0, 4))).toEqual(
      Array.from(
        buildWorldEngineTerrainColors(map.elevationBuffer(), ocean, seaDepth, {
          width: 32,
          height: 32,
          seed: 7,
          seaLevel: DEFAULT_FOUNDATION_WORLD_ENGINE_MAP_CONFIG.seaLevel,
        }).slice(0, 4),
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
});

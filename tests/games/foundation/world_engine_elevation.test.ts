import { describe, expect, it } from "vitest";
import {
  DEFAULT_FOUNDATION_WORLD_ENGINE_MAP_CONFIG,
  buildWorldEngineElevationTerrainColors,
  buildWorldEngineLandTerrainColors,
  createWorldEngineFoundationMap,
  generateWorldEngineElevation,
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

  it("builds a Foundation map with WorldEngine elevation colors", () => {
    const { map, terrainColors } = createWorldEngineFoundationMap({
      seed: 7,
      width: 32,
      height: 32,
    });

    expect(map.width()).toBe(32);
    expect(map.height()).toBe(32);
    expect(map.elevationBuffer()).toHaveLength(32 * 32);
    expect(terrainColors).toHaveLength(32 * 32 * 4);

    expect(Array.from(terrainColors.slice(0, 4))).toEqual(
      Array.from(
        buildWorldEngineLandTerrainColors(map.elevationBuffer(), {
          width: 32,
          height: 32,
          seed: 7,
          seaLevel: DEFAULT_FOUNDATION_WORLD_ENGINE_MAP_CONFIG.seaLevel,
        }).slice(0, 4),
      ),
    );
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

import { describe, expect, it } from "vitest";
import {
  FOUNDATION_GRASS_TERRAIN_BYTE,
  FOUNDATION_MAP_HEIGHT,
  FOUNDATION_MAP_WIDTH,
  FoundationEngineTileMap,
  FoundationTerrain,
  createFoundationMap,
  foundationElevationFromTerrainByte,
  foundationTerrainByteForElevation,
} from "../../../src/games/foundation";

describe("Foundation map", () => {
  it("generates the first blank grass map with raw terrain and state buffers", () => {
    const map = createFoundationMap();

    expect(map.width()).toBe(FOUNDATION_MAP_WIDTH);
    expect(map.height()).toBe(FOUNDATION_MAP_HEIGHT);
    expect(map.terrainBuffer()).toBeInstanceOf(Uint8Array);
    expect(map.elevationBuffer()).toBeInstanceOf(Float32Array);
    expect(map.stateBuffer()).toBeInstanceOf(Uint16Array);
    expect(map.terrainBuffer()).toHaveLength(
      FOUNDATION_MAP_WIDTH * FOUNDATION_MAP_HEIGHT,
    );
    expect(map.elevationBuffer()).toHaveLength(
      FOUNDATION_MAP_WIDTH * FOUNDATION_MAP_HEIGHT,
    );
    expect(map.stateBuffer()).toHaveLength(
      FOUNDATION_MAP_WIDTH * FOUNDATION_MAP_HEIGHT,
    );
    expect(new Set(map.terrainBuffer())).toEqual(
      new Set([FOUNDATION_GRASS_TERRAIN_BYTE]),
    );
    expect(new Set(map.elevationBuffer())).toEqual(new Set([0]));
    expect(new Set(map.stateBuffer())).toEqual(new Set([0]));
  });

  it("can generate a rolling elevation test map", () => {
    const map = createFoundationMap({
      width: 32,
      height: 32,
      elevation: "rolling",
    });

    const elevations = Array.from(map.elevationBuffer());
    expect(Math.min(...elevations)).toBeGreaterThanOrEqual(0);
    expect(Math.max(...elevations)).toBeLessThanOrEqual(1);
    expect(new Set(map.terrainBuffer()).size).toBeGreaterThan(1);
    expect(
      new Set(elevations.map((value) => value.toFixed(2))).size,
    ).toBeGreaterThan(1);
  });

  it("round-trips tile refs and rejects invalid bounds", () => {
    const map = createFoundationMap({ width: 8, height: 6 });
    const tile = map.ref(3, 4);

    expect(tile).toBe(35);
    expect(map.x(tile)).toBe(3);
    expect(map.y(tile)).toBe(4);
    expect(map.isValidRef(0)).toBe(true);
    expect(map.isValidRef(47)).toBe(true);
    expect(map.isValidRef(-1)).toBe(false);
    expect(map.isValidRef(48)).toBe(false);
    expect(() => map.ref(8, 0)).toThrow("Invalid tile coordinates");
    expect(() => map.x(48)).toThrow("Invalid tile ref");
  });

  it("keeps terrain semantics in the Foundation terrain query layer", () => {
    const map = new FoundationEngineTileMap(2, 1, new Uint8Array([128, 0]));
    const terrain = new FoundationTerrain(map);

    expect("isLand" in map).toBe(false);
    expect("isGrass" in map).toBe(false);
    expect(terrain.isGrass(map.ref(0, 0))).toBe(true);
    expect(terrain.isGrass(map.ref(1, 0))).toBe(false);
    expect(terrain.terrainByte(map.ref(0, 0))).toBe(
      FOUNDATION_GRASS_TERRAIN_BYTE,
    );
  });

  it("round-trips normalized elevation through Foundation terrain bytes", () => {
    const terrainByte = foundationTerrainByteForElevation(0.5);

    expect(foundationElevationFromTerrainByte(terrainByte)).toBeCloseTo(
      16 / 31,
      5,
    );
  });
});

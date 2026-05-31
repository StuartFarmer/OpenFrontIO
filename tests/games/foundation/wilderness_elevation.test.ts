import { describe, expect, it } from "vitest";
import {
  createFoundationMap,
  directionalFrontWeight,
  setOwnerId,
  toblerSpeedMultiplier,
  wildernessSpeedForTile,
  wildernessTerrainPriorityWeight,
} from "../../../src/games/foundation";

describe("Foundation wilderness elevation speed", () => {
  it("keeps the original wilderness speed on flat elevation", () => {
    const map = createFoundationMap({ width: 3, height: 1 });
    const sourceTile = map.ref(0, 0);
    const targetTile = map.ref(1, 0);
    setOwnerId(map.stateBuffer(), sourceTile, 1);

    expect(toblerSpeedMultiplier(0)).toBeCloseTo(1, 5);
    expect(wildernessSpeedForTile(map, 1, targetTile)).toBeCloseTo(16.5, 5);
  });

  it("slows wilderness expansion uphill", () => {
    const map = createFoundationMap({
      width: 3,
      height: 1,
      elevation: (x) => (x === 0 ? 0 : 1),
    });
    const sourceTile = map.ref(0, 0);
    const targetTile = map.ref(1, 0);
    setOwnerId(map.stateBuffer(), sourceTile, 1);

    expect(wildernessSpeedForTile(map, 1, targetTile)).toBeGreaterThan(16.5);
  });

  it("speeds wilderness expansion on a slight downhill", () => {
    const map = createFoundationMap({
      width: 3,
      height: 1,
      elevation: (x) => (x === 0 ? 0.5 : 1 / 3),
    });
    const sourceTile = map.ref(0, 0);
    const targetTile = map.ref(1, 0);
    setOwnerId(map.stateBuffer(), sourceTile, 1);

    expect(wildernessSpeedForTile(map, 1, targetTile)).toBeLessThan(16.5);
  });

  it("uses an OpenFront-style continuous terrain priority weight", () => {
    expect(wildernessTerrainPriorityWeight(0)).toBe(1);
    expect(wildernessTerrainPriorityWeight(0.5)).toBe(1.5);
    expect(wildernessTerrainPriorityWeight(1)).toBe(2);
  });

  it("uses a normal front distribution for directional sharpness", () => {
    expect(directionalFrontWeight(0, 1)).toBe(1);
    expect(directionalFrontWeight(1, 1)).toBeCloseTo(Math.exp(-0.5), 5);
    expect(directionalFrontWeight(2, 1)).toBeLessThan(
      directionalFrontWeight(1, 1),
    );
    expect(directionalFrontWeight(2, 4)).toBeGreaterThan(
      directionalFrontWeight(2, 1),
    );
    expect(directionalFrontWeight(1, 0)).toBe(0);
  });

  it("expands easier terrain before high elevation terrain", () => {
    const map = createFoundationMap({
      width: 5,
      height: 5,
      elevation: (x, y) => {
        if (x === 1 && y === 2) return 1;
        return 0;
      },
    });
    const runtimeMap = map;
    const center = runtimeMap.ref(2, 2);
    setOwnerId(runtimeMap.stateBuffer(), center, 1);

    const highTile = runtimeMap.ref(1, 2);
    const flatTile = runtimeMap.ref(3, 2);

    expect(
      wildernessTerrainPriorityWeight(runtimeMap.elevation(highTile)),
    ).toBeGreaterThan(
      wildernessTerrainPriorityWeight(runtimeMap.elevation(flatTile)),
    );
  });
});

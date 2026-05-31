import { describe, expect, it } from "vitest";
import {
  createFoundationMap,
  setOwnerId,
  toblerSpeedMultiplier,
  vectorSharpnessFocus,
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

  it("uses inverse-log distance focus for directional sharpness", () => {
    const shortFocus = vectorSharpnessFocus(10, 1);
    const mediumFocus = vectorSharpnessFocus(80, 1);
    const longFocus = vectorSharpnessFocus(1000, 1);

    expect(shortFocus).toBeGreaterThan(0);
    expect(mediumFocus).toBeGreaterThan(shortFocus);
    expect(longFocus).toBeGreaterThan(mediumFocus);
    expect(longFocus - mediumFocus).toBeLessThan(mediumFocus - shortFocus);
    expect(vectorSharpnessFocus(80, 0)).toBe(0);
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

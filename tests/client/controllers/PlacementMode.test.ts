import { describe, expect, test } from "vitest";
import {
  isPaintableBuildUnit,
  placementModeFor,
} from "../../../src/client/controllers/PlacementMode";
import { UnitType } from "../../../src/core/game/Game";

describe("placement mode metadata", () => {
  test("marks Farmland as a paintable build unit", () => {
    expect(isPaintableBuildUnit(UnitType.Farmland)).toBe(true);
    expect(placementModeFor(UnitType.Farmland)).toBe("paint");
  });

  test("keeps existing structures in single placement mode", () => {
    expect(isPaintableBuildUnit(UnitType.City)).toBe(false);
    expect(placementModeFor(UnitType.City)).toBe("single");
    expect(placementModeFor(UnitType.Factory)).toBe("single");
  });

  test("has no placement mode without a selected unit", () => {
    expect(isPaintableBuildUnit(null)).toBe(false);
    expect(placementModeFor(null)).toBeNull();
  });
});

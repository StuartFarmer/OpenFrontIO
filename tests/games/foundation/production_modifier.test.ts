import { describe, expect, it } from "vitest";
import {
  applyLogisticProductionModifier,
  normalizedLogistic01,
} from "../../../src/games/foundation";

describe("production modifiers", () => {
  it("maps normalized input linearly when k is zero", () => {
    expect(
      applyLogisticProductionModifier(0.25, { min: 2, max: 10, k: 0 }),
    ).toBeCloseTo(4);
    expect(
      applyLogisticProductionModifier(0.75, { min: 2, max: 10, k: 0 }),
    ).toBeCloseTo(8);
  });

  it("preserves exact min and max endpoints for logistic curves", () => {
    expect(
      applyLogisticProductionModifier(0, { min: 2, max: 10, k: 8 }),
    ).toBeCloseTo(2);
    expect(
      applyLogisticProductionModifier(1, { min: 2, max: 10, k: 8 }),
    ).toBeCloseTo(10);
  });

  it("keeps midpoint input at the midpoint between min and max", () => {
    expect(
      applyLogisticProductionModifier(0.5, { min: 1, max: 3, k: 1 }),
    ).toBeCloseTo(2);
  });

  it("makes larger k values create a steeper midpoint bend", () => {
    expect(normalizedLogistic01(0.25, 8)).toBeLessThan(
      normalizedLogistic01(0.25, 0),
    );
    expect(normalizedLogistic01(0.75, 8)).toBeGreaterThan(
      normalizedLogistic01(0.75, 0),
    );
  });
});

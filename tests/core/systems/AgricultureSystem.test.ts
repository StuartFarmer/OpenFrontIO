import { describe, expect, it } from "vitest";
import {
  DEFAULT_AGRICULTURE_SYSTEM_PARAMS,
  cropTemperatureProductivity,
  evaluateAgricultureSystem,
} from "../../../src/core/systems/models/AgricultureSystem";

describe("AgricultureSystem", () => {
  it("peaks at the optimal temperature", () => {
    const result = evaluateAgricultureSystem(
      DEFAULT_AGRICULTURE_SYSTEM_PARAMS,
      {
        temperature: DEFAULT_AGRICULTURE_SYSTEM_PARAMS.optimalTemperature,
        tilesOwned: 1,
      },
    );

    expect(result.temperatureProductivity).toBeCloseTo(1);
    expect(result.foodPerTile).toBeCloseTo(1);
    expect(result.foodProduced).toBeCloseTo(1);
  });

  it("uses a steeper hot-side productivity decline", () => {
    const params = {
      optimalTemperature: 23,
      coldSensitivity: 0.01,
      heatSensitivity: 0.04,
    };

    const cold = cropTemperatureProductivity(18, params);
    const hot = cropTemperatureProductivity(28, params);

    expect(hot).toBeLessThan(cold);
  });

  it("scales food production by owned tiles and technology", () => {
    const result = evaluateAgricultureSystem(
      {
        ...DEFAULT_AGRICULTURE_SYSTEM_PARAMS,
        baseFoodPerTile: 2,
        technologyMultiplier: 3,
      },
      {
        temperature: DEFAULT_AGRICULTURE_SYSTEM_PARAMS.optimalTemperature,
        tilesOwned: 4,
      },
    );

    expect(result.foodPerTile).toBeCloseTo(6);
    expect(result.foodProduced).toBeCloseTo(24);
  });
});

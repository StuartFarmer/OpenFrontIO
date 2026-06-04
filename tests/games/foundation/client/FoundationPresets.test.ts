import { afterEach, describe, expect, it } from "vitest";
import {
  applyGameMechanicPresetData,
  applyWorldGenerationPresetData,
  applyWorldMapPresetData,
  createFoundationPreset,
  extractGameMechanicPresetData,
  extractWorldGenerationPresetData,
  extractWorldMapPresetData,
  FOUNDATION_PRESETS_STORAGE_KEY,
  loadFoundationPresets,
} from "../../../../src/games/foundation/client/FoundationPresets";
import { DEFAULT_FOUNDATION_TUNING_SETTINGS } from "../../../../src/games/foundation/client/FoundationTuningSettings";

describe("Foundation presets", () => {
  afterEach(() => {
    window.localStorage.clear();
  });

  it("extracts world generation presets without seed or map size", () => {
    const data = extractWorldGenerationPresetData({
      ...DEFAULT_FOUNDATION_TUNING_SETTINGS,
      seed: 99,
      width: 512,
      height: 384,
      seaLevel: 0.52,
    });

    expect(data.seaLevel).toBe(0.52);
    expect(data.riverFlowRetention).toBe(
      DEFAULT_FOUNDATION_TUNING_SETTINGS.riverFlowRetention,
    );
    expect("seed" in data).toBe(false);
    expect("width" in data).toBe(false);
    expect("height" in data).toBe(false);
  });

  it("applies world generation presets while preserving seed and map size", () => {
    const current = {
      ...DEFAULT_FOUNDATION_TUNING_SETTINGS,
      seed: 99,
      width: 512,
      height: 384,
    };
    const data = extractWorldGenerationPresetData({
      ...DEFAULT_FOUNDATION_TUNING_SETTINGS,
      seed: 1234,
      width: 64,
      height: 64,
      seaLevel: 0.53,
      continentScale: 1.2,
    });

    const next = applyWorldGenerationPresetData(current, data);

    expect(next.seed).toBe(99);
    expect(next.width).toBe(512);
    expect(next.height).toBe(384);
    expect(next.seaLevel).toBe(0.53);
    expect(next.continentScale).toBe(1.2);
  });

  it("stores exact saved map presets with seed and map size", () => {
    const current = {
      ...DEFAULT_FOUNDATION_TUNING_SETTINGS,
      seed: 99,
      width: 512,
      height: 384,
      seaLevel: 0.53,
      riverStrongThreshold: 0.62,
    };

    const data = extractWorldMapPresetData(current);
    const next = applyWorldMapPresetData(
      {
        ...DEFAULT_FOUNDATION_TUNING_SETTINGS,
        seed: 1,
        width: 128,
        height: 128,
      },
      data,
    );

    expect(data.seed).toBe(99);
    expect(data.width).toBe(512);
    expect(data.height).toBe(384);
    expect(next.seed).toBe(99);
    expect(next.width).toBe(512);
    expect(next.height).toBe(384);
    expect(next.seaLevel).toBe(0.53);
    expect(next.riverStrongThreshold).toBe(0.62);
  });

  it("applies mechanic presets without changing world generation settings", () => {
    const current = {
      ...DEFAULT_FOUNDATION_TUNING_SETTINGS,
      seaLevel: 0.53,
      attackRatio: 0.2,
      wildernessFrontCapacity: 3_000,
    };
    const data = extractGameMechanicPresetData({
      ...DEFAULT_FOUNDATION_TUNING_SETTINGS,
      seaLevel: 0.31,
      attackRatio: 0.42,
      wildernessFrontCapacity: 9_000,
    });

    const next = applyGameMechanicPresetData(current, data);

    expect(next.seaLevel).toBe(0.53);
    expect(next.attackRatio).toBe(0.42);
    expect(next.wildernessFrontCapacity).toBe(9_000);
  });

  it("loads only valid versioned presets from storage", () => {
    const preset = createFoundationPreset(
      "world-generation",
      "Archipelago",
      DEFAULT_FOUNDATION_TUNING_SETTINGS,
    );
    window.localStorage.setItem(
      FOUNDATION_PRESETS_STORAGE_KEY,
      JSON.stringify([
        preset,
        { ...preset, id: "bad-kind", kind: "other" },
        { ...preset, id: "bad-version", version: 999 },
      ]),
    );

    const presets = loadFoundationPresets();

    expect(presets).toHaveLength(1);
    expect(presets[0].name).toBe("Archipelago");
    expect(presets[0].kind).toBe("world-generation");
  });
});

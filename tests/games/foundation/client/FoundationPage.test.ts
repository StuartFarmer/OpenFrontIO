import { afterEach, describe, expect, it, vi } from "vitest";
import { createFoundationMap } from "../../../../src/games/foundation";
import {
  FOUNDATION_GENERATED_MAP_STORAGE_KEY,
  foundationGeneratedMapSignature,
  loadGeneratedMapCache,
} from "../../../../src/games/foundation/client/FoundationPage";
import {
  DEFAULT_FOUNDATION_TUNING_SETTINGS,
  FOUNDATION_TUNING_STORAGE_KEY,
  type FoundationTuningSettings,
} from "../../../../src/games/foundation/client/FoundationTuningSettings";

interface FoundationPageHarness {
  inputDrafts: Record<string, string>;
  tuningSettings: FoundationTuningSettings;
  commitNumberInput: (key: string) => void;
  maybeAutoGenerateWorld: () => Promise<void>;
}

describe("FoundationPage client tuning", () => {
  afterEach(() => {
    document.body.innerHTML = "";
    window.localStorage.clear();
    vi.restoreAllMocks();
  });

  it("does not auto-generate the map when committing a mechanics-only number", () => {
    const page = document.createElement(
      "foundation-page",
    ) as unknown as FoundationPageHarness;
    const autoGenerate = vi.fn(async () => undefined);
    page.maybeAutoGenerateWorld = autoGenerate;
    page.inputDrafts = { attackRatio: "0.35" };

    page.commitNumberInput("attackRatio");

    expect(autoGenerate).not.toHaveBeenCalled();
  });

  it("keeps generated map signatures scoped to world-generation settings", () => {
    const baseline = foundationGeneratedMapSignature(
      DEFAULT_FOUNDATION_TUNING_SETTINGS,
    );
    const mechanicsOnly = foundationGeneratedMapSignature({
      ...DEFAULT_FOUNDATION_TUNING_SETTINGS,
      attackRatio: 0.75,
      startingTroops: 90_000,
      wildernessFrontCapacity: 12_000,
    });
    const worldChanged = foundationGeneratedMapSignature({
      ...DEFAULT_FOUNDATION_TUNING_SETTINGS,
      seaLevel: DEFAULT_FOUNDATION_TUNING_SETTINGS.seaLevel + 0.01,
    });

    expect(mechanicsOnly).toBe(baseline);
    expect(worldChanged).not.toBe(baseline);
  });

  it("loads older local terrain cache entries without stored elevation", () => {
    const map = createFoundationMap({ width: 4, height: 4 });
    const signature = foundationGeneratedMapSignature(
      DEFAULT_FOUNDATION_TUNING_SETTINGS,
    );
    window.localStorage.setItem(
      FOUNDATION_GENERATED_MAP_STORAGE_KEY,
      JSON.stringify({
        version: 1,
        signature,
        width: map.width(),
        height: map.height(),
        terrain: uint8ArrayToBase64(map.terrainBuffer()),
      }),
    );

    const cached = loadGeneratedMapCache(signature);

    expect(cached).not.toBeNull();
    expect(cached?.map.width()).toBe(4);
    expect(cached?.map.height()).toBe(4);
    expect(cached?.map.elevationBuffer()).toHaveLength(16);
  });

  it("loads cached WorldEngine resource debug layers", () => {
    const map = createFoundationMap({ width: 2, height: 2 });
    const signature = foundationGeneratedMapSignature(
      DEFAULT_FOUNDATION_TUNING_SETTINGS,
    );
    window.localStorage.setItem(
      FOUNDATION_GENERATED_MAP_STORAGE_KEY,
      JSON.stringify({
        version: 2,
        signature,
        width: map.width(),
        height: map.height(),
        terrain: uint8ArrayToBase64(map.terrainBuffer()),
        resourceLayers8: {
          crop: uint8ArrayToBase64(new Uint8Array([0, 64, 128, 255])),
          basin: uint8ArrayToBase64(new Uint8Array([255, 128, 64, 0])),
          oil: uint8ArrayToBase64(new Uint8Array([0, 0, 128, 255])),
          metal: uint8ArrayToBase64(new Uint8Array([255, 128, 0, 0])),
        },
      }),
    );

    const cached = loadGeneratedMapCache(signature);

    expect(cached?.resourceLayers?.crop).toHaveLength(4);
    expect(cached?.resourceLayers?.crop[0]).toBe(0);
    expect(cached?.resourceLayers?.crop[2]).toBeCloseTo(128 / 255);
    expect(cached?.resourceLayers?.crop[3]).toBe(1);
    expect(cached?.resourceLayers?.metal[1]).toBeCloseTo(128 / 255);
  });

  it("persists mechanics commits without adding map generator churn", () => {
    const page = document.createElement(
      "foundation-page",
    ) as unknown as FoundationPageHarness;
    page.tuningSettings = {
      ...DEFAULT_FOUNDATION_TUNING_SETTINGS,
      mapGenerator: "foundation",
    };
    page.inputDrafts = { attackRatio: "0.35" };

    page.commitNumberInput("attackRatio");

    const stored = JSON.parse(
      window.localStorage.getItem(FOUNDATION_TUNING_STORAGE_KEY) ?? "{}",
    );
    expect(stored.attackRatio).toBe(0.35);
    expect(stored.mapGenerator).toBe("foundation");
  });
});

function uint8ArrayToBase64(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i += 1) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

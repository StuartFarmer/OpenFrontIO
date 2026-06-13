import { render } from "lit";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  createFoundationMap,
  createFoundationRuntime,
  createPlacePlayerCommand,
} from "../../../../src/games/foundation";
import "../../../../src/games/foundation/client/FoundationDynamicPage";
import {
  FOUNDATION_GENERATED_MAP_STORAGE_KEY,
  foundationAttackDragFocus,
  foundationAttackDragMaxDistance,
  foundationGeneratedMapSignature,
  loadGeneratedMapCache,
} from "../../../../src/games/foundation/client/FoundationPage";
import {
  DEFAULT_FOUNDATION_TUNING_SETTINGS,
  FOUNDATION_TUNING_STORAGE_KEY,
  normalizeFoundationTuningSettings,
  type FoundationTuningSettings,
} from "../../../../src/games/foundation/client/FoundationTuningSettings";

interface FoundationPageHarness {
  inputDrafts: Record<string, string>;
  tuningSettings: FoundationTuningSettings;
  commitNumberInput: (key: string) => void;
  generateWorld: (statusText: string, options?: { force?: boolean }) => void;
  handleGenerate: () => void;
  maybeAutoGenerateWorld: () => Promise<void>;
}

interface FoundationPageInternals extends FoundationPageHarness {
  runtime: ReturnType<typeof createFoundationRuntime> | null;
  renderer: unknown;
  snapshot: ReturnType<ReturnType<typeof createFoundationRuntime>["snapshot"]>;
  selectedContextBuilding: string;
  activeBuildPlacementItem: { id: string; label: string } | null;
  contextMenuOpen: boolean;
  contextMenuX: number;
  contextMenuY: number;
  canvas: HTMLCanvasElement;
  suppressNextCanvasClick: boolean;
  renderContextMenu: () => unknown;
  renderBuildBar: () => unknown;
  tileFromClientPoint: (
    clientX: number,
    clientY: number,
  ) => { x: number; y: number; ref: number } | null;
  handleCanvasClick: (event: MouseEvent) => void;
  handleCanvasPointerDown: (event: PointerEvent) => void;
  handleCanvasPointerMove: (event: PointerEvent) => void;
  handleCanvasPointerUp: (event: PointerEvent) => void;
  updateDirectionalBorderPreviewForPointer: (event: PointerEvent) => void;
  clearDirectionalBorderPreview: () => void;
  requestUpdate: () => void;
}

describe("FoundationPage client tuning", () => {
  afterEach(() => {
    document.body.innerHTML = "";
    window.localStorage.clear();
    vi.restoreAllMocks();
  });

  it("uses the default resource yield profiles", () => {
    expect(DEFAULT_FOUNDATION_TUNING_SETTINGS).toMatchObject({
      foodYieldMin: 1,
      foodYieldMax: 3,
      foodYieldK: 10,
      oilYieldMin: 1,
      oilYieldMax: 1,
      oilYieldK: 0,
      metalYieldMin: 1,
      metalYieldMax: 1,
      metalYieldK: 0,
      wildernessMechanics: "foundation",
    });
  });

  it("normalizes OpenFront wilderness mechanics mode", () => {
    expect(
      normalizeFoundationTuningSettings({
        wildernessMechanics: "openfront",
      }).wildernessMechanics,
    ).toBe("openfront");
    expect(
      normalizeFoundationTuningSettings({
        wildernessMechanics: "other" as "openfront",
      }).wildernessMechanics,
    ).toBe("foundation");
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

  it("generates or loads the map after committing a seed change", () => {
    const page = document.createElement(
      "foundation-page",
    ) as unknown as FoundationPageHarness;
    const generateWorld = vi.fn();
    page.generateWorld = generateWorld;
    page.tuningSettings = {
      ...DEFAULT_FOUNDATION_TUNING_SETTINGS,
      autoGenerateWorld: false,
      seed: 1337,
    };
    page.inputDrafts = { seed: "42" };

    page.commitNumberInput("seed");

    expect(page.tuningSettings.seed).toBe(42);
    expect(generateWorld).toHaveBeenCalledWith(
      "Generated world with current parameters.",
      { force: true },
    );
  });

  it("renders dynamic systems controls on the dynamic page copy", () => {
    const page = document.createElement(
      "foundation-dynamic-page",
    ) as unknown as HTMLElement & {
      activeControlTab: string;
      render: () => unknown;
    };
    page.activeControlTab = "combat";
    const container = document.createElement("div");

    render(page.render(), container);

    const text = container.textContent ?? "";
    expect(text).toContain("System: Foundation economy model");
    expect(text).toContain("Base Food Storage Capacity");
    expect(text).toContain("Added Storage Capacity Per Silo");
    expect(text).not.toContain("Troop Growth");
  });

  it("renders dynamic systems controls in the main systems tab", () => {
    const page = document.createElement(
      "foundation-page",
    ) as unknown as HTMLElement & {
      activeControlTab: string;
      render: () => unknown;
    };
    page.activeControlTab = "systems";
    const container = document.createElement("div");

    render(page.render(), container);

    const text = container.textContent ?? "";
    expect(text).toContain("System: Foundation economy model");
    expect(text).toContain("Food Per Troop");
    expect(text).toContain("Stockpile Growth Rate");
  });

  it("selects the systems tab from the tab event", () => {
    const page = document.createElement(
      "foundation-page",
    ) as unknown as HTMLElement & {
      activeControlTab: string;
      handleControlTabChange: (event: CustomEvent<{ id: string }>) => void;
    };

    page.handleControlTabChange(
      new CustomEvent("selection-change", { detail: { id: "systems" } }),
    );

    expect(page.activeControlTab).toBe("systems");
  });

  it("commits pending dimensions before manual world generation", () => {
    const page = document.createElement(
      "foundation-page",
    ) as unknown as FoundationPageHarness;
    const generateWorld = vi.fn();
    page.generateWorld = generateWorld;
    page.tuningSettings = {
      ...DEFAULT_FOUNDATION_TUNING_SETTINGS,
      autoGenerateWorld: false,
      width: 256,
      height: 256,
    };
    page.inputDrafts = { width: "1024", height: "1024" };

    page.handleGenerate();

    expect(page.tuningSettings.width).toBe(1024);
    expect(page.tuningSettings.height).toBe(1024);
    expect(page.inputDrafts).toEqual({});
    expect(generateWorld).toHaveBeenCalledWith(
      "Generated world with current parameters.",
      { force: true },
    );
  });

  it("normalizes attack drag focus with a capped sigmoid", () => {
    const maxDistance = foundationAttackDragMaxDistance(16);

    expect(maxDistance).toBe(8);
    expect(foundationAttackDragFocus(0, maxDistance)).toBe(0);
    expect(foundationAttackDragFocus(maxDistance / 2, maxDistance)).toBeCloseTo(
      0.5,
      5,
    );
    expect(foundationAttackDragFocus(maxDistance, maxDistance)).toBe(1);
    expect(foundationAttackDragFocus(maxDistance * 2, maxDistance)).toBe(1);
    expect(foundationAttackDragFocus(Number.NaN, maxDistance)).toBe(0);
  });

  it("dispatches uniform front controls for plain post-placement clicks", () => {
    const map = createFoundationMap({ width: 64, height: 64 });
    const runtime = createFoundationRuntime({ map });
    runtime.dispatch(createPlacePlayerCommand({ tileRef: map.ref(16, 16) }));
    const page = createPageHarness(runtime);
    const targetTile = map.ref(40, 16);
    page.tileFromClientPoint = () => ({
      x: map.x(targetTile),
      y: map.y(targetTile),
      ref: targetTile,
    });
    const dispatch = vi.spyOn(runtime, "dispatch");

    page.handleCanvasClick(new MouseEvent("click"));

    expect(dispatch).toHaveBeenCalledTimes(1);
    expect(dispatch.mock.calls[0][0].payload).toMatchObject({
      type: "foundation.grow_territory",
      targetTileRef: targetTile,
      frontMode: "uniform",
      frontFocus: 0,
    });
  });

  it("dispatches focused front controls after dragging from owned territory", () => {
    const map = createFoundationMap({ width: 64, height: 64 });
    const runtime = createFoundationRuntime({ map });
    const startTile = map.ref(16, 16);
    const targetTile = map.ref(40, 16);
    runtime.dispatch(createPlacePlayerCommand({ tileRef: startTile }));
    const page = createPageHarness(runtime);
    page.updateDirectionalBorderPreviewForPointer = vi.fn();
    page.clearDirectionalBorderPreview = vi.fn();
    page.requestUpdate = vi.fn();
    page.tileFromClientPoint = (clientX: number) =>
      clientX < 100
        ? { x: map.x(startTile), y: map.y(startTile), ref: startTile }
        : { x: map.x(targetTile), y: map.y(targetTile), ref: targetTile };
    const dispatch = vi.spyOn(runtime, "dispatch");

    page.handleCanvasPointerDown(pointerEvent("pointerdown", 1, 10, 10));
    page.handleCanvasPointerMove(pointerEvent("pointermove", 1, 140, 10));
    page.handleCanvasPointerUp(pointerEvent("pointerup", 1, 140, 10));

    expect(dispatch).toHaveBeenCalledTimes(1);
    expect(dispatch.mock.calls[0][0].payload).toMatchObject({
      type: "foundation.grow_territory",
      targetTileRef: targetTile,
      frontMode: "focused",
    });
    const payload = dispatch.mock.calls[0][0].payload;
    expect(payload.type).toBe("foundation.grow_territory");
    if (payload.type !== "foundation.grow_territory") {
      throw new Error("expected grow territory payload");
    }
    expect(payload.frontFocus).toBeGreaterThan(0);
    expect(payload.frontFocus).toBeLessThanOrEqual(1);
    expect(page.suppressNextCanvasClick).toBe(true);
  });

  it("keeps non-owned drags as camera pans", () => {
    const map = createFoundationMap({ width: 64, height: 64 });
    const runtime = createFoundationRuntime({ map });
    runtime.dispatch(createPlacePlayerCommand({ tileRef: map.ref(16, 16) }));
    const panBy = vi.fn();
    const page = createPageHarness(runtime, {
      getCameraState: () => ({ zoom: 2 }),
      panBy,
    });
    const targetTile = map.ref(40, 16);
    page.tileFromClientPoint = () => ({
      x: map.x(targetTile),
      y: map.y(targetTile),
      ref: targetTile,
    });

    page.handleCanvasPointerDown(pointerEvent("pointerdown", 1, 120, 10));
    page.handleCanvasPointerMove(pointerEvent("pointermove", 1, 160, 10));
    page.handleCanvasPointerUp(pointerEvent("pointerup", 1, 160, 10));

    expect(panBy).toHaveBeenCalled();
  });

  it("renders a Foundation build bar that starts storage placement", () => {
    const map = createFoundationMap({ width: 64, height: 64 });
    const runtime = createFoundationRuntime({ map });
    runtime.dispatch(createPlacePlayerCommand({ tileRef: map.ref(16, 16) }));
    const page = createPageHarness(runtime, {
      screenToTile: () => ({ x: 16, y: 16, ref: map.ref(16, 16) }),
    });
    const container = document.createElement("div");

    render(page.renderBuildBar(), container);

    expect(container.textContent).toContain("Farmland");
    expect(container.textContent).toContain("Grain Silo");
    expect(container.textContent).toContain("Oil Tank");
    expect(container.textContent).not.toContain("Mineral Stockpile");

    const grainButton = Array.from(
      container.querySelectorAll<HTMLButtonElement>(".foundation-build-button"),
    ).find((button) => button.textContent?.includes("Grain Silo"));
    expect(grainButton).toBeDefined();

    grainButton!.dispatchEvent(new MouseEvent("click", { bubbles: true }));

    expect(page.activeBuildPlacementItem?.id).toBe("grain-silo");
    expect(page.selectedContextBuilding).toBe("Grain Silo");
  });

  it("keeps Farmland selected while painting 1x1 build tiles", () => {
    const map = createFoundationMap({ width: 64, height: 64 });
    const runtime = createFoundationRuntime({ map });
    runtime.dispatch(createPlacePlayerCommand({ tileRef: map.ref(16, 16) }));
    const firstTile = runtime.player().placement!.claimedTiles[0];
    const secondTile = runtime.player().placement!.claimedTiles[1];
    const page = createPageHarness(runtime, {
      screenToTile: () => ({
        x: map.x(firstTile),
        y: map.y(firstTile),
        ref: firstTile,
      }),
    });
    page.tileFromClientPoint = (clientX: number) => {
      const ref = clientX < 100 ? firstTile : secondTile;
      return { x: map.x(ref), y: map.y(ref), ref };
    };
    const container = document.createElement("div");
    render(page.renderBuildBar(), container);
    const farmlandButton = Array.from(
      container.querySelectorAll<HTMLButtonElement>(".foundation-build-button"),
    ).find((button) => button.textContent?.includes("Farmland"));
    expect(farmlandButton).toBeDefined();

    farmlandButton!.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    page.handleCanvasPointerDown(pointerEvent("pointerdown", 8, 10, 10));
    page.handleCanvasPointerMove(pointerEvent("pointermove", 8, 140, 10));
    page.handleCanvasPointerUp(pointerEvent("pointerup", 8, 140, 10));

    expect(page.activeBuildPlacementItem?.id).toBe("farmland");
    expect(runtime.snapshot().player.buildings).toEqual([
      expect.objectContaining({ type: "farmland", tileRef: firstTile }),
      expect.objectContaining({ type: "farmland", tileRef: secondTile }),
    ]);
  });

  it("cancels Farmland paint into camera pan on the first unbuildable stroke tile", () => {
    const map = createFoundationMap({ width: 64, height: 64 });
    const runtime = createFoundationRuntime({ map });
    runtime.dispatch(createPlacePlayerCommand({ tileRef: map.ref(16, 16) }));
    const firstTile = runtime.player().placement!.claimedTiles[0];
    const unownedTile = map.ref(0, 0);
    const panBy = vi.fn();
    const page = createPageHarness(runtime, {
      screenToTile: () => ({
        x: map.x(firstTile),
        y: map.y(firstTile),
        ref: firstTile,
      }),
      getCameraState: () => ({ zoom: 2 }),
      panBy,
    });
    page.tileFromClientPoint = (clientX: number) => {
      const ref = clientX < 100 ? firstTile : unownedTile;
      return { x: map.x(ref), y: map.y(ref), ref };
    };
    const container = document.createElement("div");
    render(page.renderBuildBar(), container);
    const farmlandButton = Array.from(
      container.querySelectorAll<HTMLButtonElement>(".foundation-build-button"),
    ).find((button) => button.textContent?.includes("Farmland"));

    farmlandButton!.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    page.handleCanvasPointerDown(pointerEvent("pointerdown", 9, 10, 10));
    page.handleCanvasPointerMove(pointerEvent("pointermove", 9, 140, 10));
    page.handleCanvasPointerMove(pointerEvent("pointermove", 9, 180, 10));

    expect(page.activeBuildPlacementItem).toBeNull();
    expect(runtime.snapshot().player.buildings).toEqual([
      expect.objectContaining({ type: "farmland", tileRef: firstTile }),
    ]);
    expect(panBy).toHaveBeenCalled();
  });

  it("cancels Farmland paint into camera pan when the stroke starts unbuildable", () => {
    const map = createFoundationMap({ width: 64, height: 64 });
    const runtime = createFoundationRuntime({ map });
    runtime.dispatch(createPlacePlayerCommand({ tileRef: map.ref(16, 16) }));
    const firstTile = runtime.player().placement!.claimedTiles[0];
    const unownedTile = map.ref(0, 0);
    const panBy = vi.fn();
    const page = createPageHarness(runtime, {
      screenToTile: () => ({
        x: map.x(firstTile),
        y: map.y(firstTile),
        ref: firstTile,
      }),
      getCameraState: () => ({ zoom: 2 }),
      panBy,
    });
    page.tileFromClientPoint = () => ({
      x: map.x(unownedTile),
      y: map.y(unownedTile),
      ref: unownedTile,
    });
    const container = document.createElement("div");
    render(page.renderBuildBar(), container);
    const farmlandButton = Array.from(
      container.querySelectorAll<HTMLButtonElement>(".foundation-build-button"),
    ).find((button) => button.textContent?.includes("Farmland"));

    farmlandButton!.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    page.handleCanvasPointerDown(pointerEvent("pointerdown", 10, 140, 10));
    page.handleCanvasPointerMove(pointerEvent("pointermove", 10, 180, 10));

    expect(page.activeBuildPlacementItem).toBeNull();
    expect(runtime.snapshot().player.buildings).toEqual([]);
    expect(panBy).toHaveBeenCalled();
  });

  it("keeps Foundation construction out of the right-click context menu", () => {
    const map = createFoundationMap({ width: 64, height: 64 });
    const runtime = createFoundationRuntime({ map });
    runtime.dispatch(createPlacePlayerCommand({ tileRef: map.ref(16, 16) }));
    const page = createPageHarness(runtime);
    page.contextMenuOpen = true;
    page.contextMenuX = 12;
    page.contextMenuY = 12;
    const container = document.createElement("div");

    render(page.renderContextMenu(), container);

    expect(container.textContent).not.toContain("Build");
    expect(container.textContent).not.toContain("Grain Silo");
    expect(container.textContent).not.toContain("Oil Tank");
  });
});

function uint8ArrayToBase64(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i += 1) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

function createPageHarness(
  runtime: ReturnType<typeof createFoundationRuntime>,
  renderer: unknown = {},
): FoundationPageInternals {
  const page = document.createElement(
    "foundation-page",
  ) as unknown as FoundationPageInternals;
  page.runtime = runtime;
  page.renderer = renderer;
  page.snapshot = runtime.snapshot();
  page.tuningSettings = { ...DEFAULT_FOUNDATION_TUNING_SETTINGS };
  const canvas = document.createElement("canvas");
  canvas.getBoundingClientRect = () =>
    ({
      left: 0,
      top: 0,
      width: 400,
      height: 300,
      right: 400,
      bottom: 300,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    }) as DOMRect;
  Object.defineProperty(page, "canvas", {
    configurable: true,
    value: canvas,
  });
  page.clearDirectionalBorderPreview = vi.fn();
  page.requestUpdate = vi.fn();
  return page;
}

function pointerEvent(
  type: string,
  pointerId: number,
  clientX: number,
  clientY: number,
): PointerEvent {
  return {
    type,
    pointerId,
    button: 0,
    clientX,
    clientY,
    preventDefault: vi.fn(),
  } as unknown as PointerEvent;
}

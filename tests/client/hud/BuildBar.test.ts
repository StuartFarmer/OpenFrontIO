import { afterEach, describe, expect, it, vi } from "vitest";
import {
  BuildBar,
  buildBarItems,
} from "../../../src/client/hud/layers/BuildBar";
import type { UIState } from "../../../src/client/UIState";
import { UnitType } from "../../../src/core/game/Game";

vi.mock("../../../src/client/Utils", () => ({
  translateText: vi.fn((key: string) => key),
  renderNumber: vi.fn((num: number | bigint) => num.toString()),
}));

function makeUiState(): UIState {
  return {
    attackRatio: 0.2,
    ghostStructure: null,
    overlappingRailroads: [],
    ghostRailPaths: [],
    rocketDirectionUp: true,
  };
}

function makePlayer() {
  return {
    isAlive: () => true,
    resources: () => ({
      food: 1_000_000n,
      energy: 1_000_000n,
      materials: 1_000_000n,
    }),
    units: (type: UnitType) =>
      type === UnitType.Port || type === UnitType.MissileSilo ? [{}] : [],
    totalUnitLevels: (type: UnitType) => (type === UnitType.City ? 2 : 0),
    buildables: vi.fn(async (_tile, units: UnitType[]) =>
      units.map((type) => ({
        type,
        canBuild: true,
        canUpgrade: false,
        cost: 100n,
        resourceCost: { food: 10n, energy: 20n, materials: 30n },
        overlappingRailroads: [],
        ghostRailPaths: [],
      })),
    ),
  };
}

function makeGame(disabled: UnitType[] = []) {
  const player = makePlayer();
  return {
    inSpawnPhase: () => false,
    myPlayer: () => player,
    config: () => ({
      isUnitDisabled: (unitType: UnitType) => disabled.includes(unitType),
    }),
  };
}

describe("build-bar", () => {
  afterEach(() => {
    document.body.replaceChildren();
    vi.restoreAllMocks();
  });

  it("filters existing build metadata through disabled-unit config", () => {
    const items = buildBarItems({
      isUnitDisabled: (unitType) => unitType === UnitType.City,
    });

    expect(items.map((item) => item.unitType)).not.toContain(UnitType.City);
    expect(items.map((item) => item.unitType)).toContain(UnitType.Factory);
    expect(items.map((item) => item.unitType)).toContain(UnitType.Silo);
    expect(items.map((item) => item.unitType)).toContain(UnitType.Farmland);
    expect(
      items.every((item) => Object.values(UnitType).includes(item.unitType)),
    ).toBe(true);
  });

  it("filters Farmland through disabled-unit config", () => {
    const items = buildBarItems({
      isUnitDisabled: (unitType) => unitType === UnitType.Farmland,
    });

    expect(items.map((item) => item.unitType)).not.toContain(UnitType.Farmland);
  });

  it("sets and clears ghost structure from build buttons", async () => {
    const bar = new BuildBar();
    bar.game = makeGame() as never;
    bar.eventBus = { emit: vi.fn() } as never;
    bar.uiState = makeUiState();
    document.body.append(bar);

    await bar.updateComplete;

    const cityButton = bar.querySelector<HTMLElement>(
      `hud-unit-button[data-build-unit="${UnitType.City}"]`,
    );
    expect(cityButton).toBeTruthy();

    cityButton!.dispatchEvent(
      new MouseEvent("click", { bubbles: true, composed: true }),
    );
    expect(bar.uiState.ghostStructure).toBe(UnitType.City);

    cityButton!.dispatchEvent(
      new MouseEvent("click", { bubbles: true, composed: true }),
    );
    expect(bar.uiState.ghostStructure).toBeNull();
  });

  it("selects Farmland from the bottom build bar", async () => {
    const bar = new BuildBar();
    bar.game = makeGame() as never;
    bar.eventBus = { emit: vi.fn() } as never;
    bar.uiState = makeUiState();
    document.body.append(bar);

    await bar.updateComplete;

    const farmlandButton = bar.querySelector<HTMLElement>(
      `hud-unit-button[data-build-unit="${UnitType.Farmland}"]`,
    );
    expect(farmlandButton).toBeTruthy();

    farmlandButton!.dispatchEvent(
      new MouseEvent("click", { bubbles: true, composed: true }),
    );

    expect(bar.uiState.ghostStructure).toBe(UnitType.Farmland);
  });

  it("does not leak build button clicks to ancestor map handlers", async () => {
    const shell = document.createElement("div");
    const leakedClick = vi.fn();
    shell.addEventListener("click", leakedClick);

    const bar = new BuildBar();
    bar.game = makeGame() as never;
    bar.eventBus = { emit: vi.fn() } as never;
    bar.uiState = makeUiState();
    shell.append(bar);
    document.body.append(shell);

    await bar.updateComplete;

    bar
      .querySelector<HTMLElement>(
        `hud-unit-button[data-build-unit="${UnitType.City}"]`,
      )!
      .dispatchEvent(
        new MouseEvent("click", { bubbles: true, composed: true }),
      );

    expect(leakedClick).not.toHaveBeenCalled();
    expect(bar.uiState.ghostStructure).toBe(UnitType.City);
  });
});

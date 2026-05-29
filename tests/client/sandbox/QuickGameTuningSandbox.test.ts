import { afterEach, describe, expect, it, vi } from "vitest";
import { QUICK_GAME_PARAMETER_DESCRIPTORS } from "../../../src/client/sandbox/QuickGameTuningParameters";
import "../../../src/client/sandbox/QuickGameTuningSandbox";
import { QuickGameTuningSandbox } from "../../../src/client/sandbox/QuickGameTuningSandbox";
import { DEFAULT_MECHANICS_CONFIG } from "../../../src/core/configuration/MechanicsConfig";

describe("quick-game-tuning-sandbox", () => {
  afterEach(() => {
    document.body.innerHTML = "";
    window.localStorage.clear();
    vi.restoreAllMocks();
  });

  it("auto-starts a sandbox quick game with tunable mechanics", async () => {
    const events: CustomEvent[] = [];
    const el = await renderSandbox(events);
    await nextTick();

    expect(el.shadowRoot?.querySelector("hud-surface")).toBeTruthy();
    expect(events).toHaveLength(1);
    expect(events[0].detail.source).toBe("sandbox");
    expect(events[0].detail.gameStartInfo.config.isSandbox).toBe(true);
    expect(events[0].detail.gameStartInfo.config.nations).toBe(24);
    expect(
      events[0].detail.gameStartInfo.config.mechanics.populationResources
        .initialPopulation,
    ).toBe(250);
    expect(
      events[0].detail.gameStartInfo.config.mechanics.populationResources
        .populationFoodConstraintMode,
    ).toBe("dynamic-shortage");
    expect(
      events[0].detail.gameStartInfo.config.mechanics.expansionCombat
        .wildernessTilesPerTickMultiplier,
    ).toBe(0.5);
    expect(parameterRange(el, "population.growthRate")).toBeTruthy();
    expect(parameterRange(el, "population.maxPerTile")).toBeTruthy();
    expect(parameterRange(el, "expansion.wildernessLoss")).toBeTruthy();
    expect(parameterRange(el, "expansion.wildernessSpeed")).toBeTruthy();
  });

  it("persists tuning values for refresh-started quick games", async () => {
    const events: CustomEvent[] = [];
    const el = await renderSandbox(events);
    await nextTick();

    dispatchParameterInput(el, "population.growthRate", 0.012);
    dispatchParameterInput(el, "expansion.wildernessLoss", 3.5);
    await el.updateComplete;

    document.body.innerHTML = "";
    const reloadedEvents: CustomEvent[] = [];
    await renderSandbox(reloadedEvents);
    await nextTick();

    const mechanics = reloadedEvents[0].detail.gameStartInfo.config.mechanics;
    expect(mechanics.populationResources.populationGrowthRate).toBe(0.012);
    expect(mechanics.expansionCombat.wildernessAttackerLossMultiplier).toBe(
      3.5,
    );
  });

  it("adds and removes parameter rows from the HUD tuning table", async () => {
    const events: CustomEvent[] = [];
    const el = await renderSandbox(events);
    await nextTick();

    el.shadowRoot?.querySelector("[data-add-parameter]")?.dispatchEvent(
      new CustomEvent("value-change", {
        detail: { value: "nutrition.mortality" },
        bubbles: true,
        composed: true,
      }),
    );
    await el.updateComplete;

    expect(parameterRange(el, "nutrition.mortality")).toBeTruthy();

    el.shadowRoot
      ?.querySelector('[data-remove-parameter="nutrition.mortality"]')
      ?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    await el.updateComplete;

    expect(parameterRange(el, "nutrition.mortality")).toBeFalsy();
  });

  it("exposes every current mechanics config leaf in the add dropdown", () => {
    const descriptorPaths = new Set(
      QUICK_GAME_PARAMETER_DESCRIPTORS.map((descriptor) =>
        descriptor.path.join("."),
      ),
    );
    const configLeafPaths = leafPaths(DEFAULT_MECHANICS_CONFIG).filter(
      (path) => path !== "version",
    );

    expect(descriptorPaths.size).toBe(QUICK_GAME_PARAMETER_DESCRIPTORS.length);
    expect(configLeafPaths.sort()).toEqual([...descriptorPaths].sort());
  });

  it("persists nested and select parameters for refresh-started quick games", async () => {
    const events: CustomEvent[] = [];
    const el = await renderSandbox(events);
    await nextTick();

    addParameter(el, "terrain.plains.food");
    addParameter(el, "population.foodConstraintMode");
    await el.updateComplete;

    dispatchParameterInput(el, "terrain.plains.food", 7);
    dispatchParameterSelect(
      el,
      "population.foodConstraintMode",
      "dynamic-shortage",
    );
    await el.updateComplete;

    document.body.innerHTML = "";
    const reloadedEvents: CustomEvent[] = [];
    await renderSandbox(reloadedEvents);
    await nextTick();

    const mechanics = reloadedEvents[0].detail.gameStartInfo.config.mechanics;
    expect(mechanics.populationResources.terrainWeights.plains.food).toBe(7);
    expect(mechanics.populationResources.populationFoodConstraintMode).toBe(
      "dynamic-shortage",
    );
  });

  it("renders sliders and visible trash icons for selected parameters", async () => {
    const events: CustomEvent[] = [];
    const el = await renderSandbox(events);
    await nextTick();

    expect(parameterRange(el, "population.growthRate")).toBeTruthy();
    expect(
      el.shadowRoot?.querySelector(
        'hud-input[data-parameter-input="population.growthRate"]',
      ),
    ).toBeTruthy();
    expect(
      el.shadowRoot?.querySelector("[data-remove-parameter]")?.textContent,
    ).toBe("×");
  });
});

async function renderSandbox(
  events: CustomEvent[],
): Promise<QuickGameTuningSandbox> {
  const el = document.createElement(
    "quick-game-tuning-sandbox",
  ) as QuickGameTuningSandbox;
  el.addEventListener("join-lobby", (event) => {
    events.push(event as CustomEvent);
  });
  document.body.append(el);
  await el.updateComplete;
  return el;
}

function addParameter(el: QuickGameTuningSandbox, parameterId: string) {
  el.shadowRoot?.querySelector("[data-add-parameter]")?.dispatchEvent(
    new CustomEvent("value-change", {
      detail: { value: parameterId },
      bubbles: true,
      composed: true,
    }),
  );
}

function dispatchParameterInput(
  el: QuickGameTuningSandbox,
  parameterId: string,
  value: number,
) {
  const input = el.shadowRoot?.querySelector(
    `hud-input[data-parameter-input="${parameterId}"]`,
  );
  expect(input).toBeTruthy();
  input!.dispatchEvent(
    new CustomEvent("value-change", {
      detail: { value: String(value) },
      bubbles: true,
      composed: true,
    }),
  );
}

function dispatchParameterSelect(
  el: QuickGameTuningSandbox,
  parameterId: string,
  value: string,
) {
  const select = el.shadowRoot?.querySelector(
    `hud-select[data-parameter-select="${parameterId}"]`,
  );
  expect(select).toBeTruthy();
  select!.dispatchEvent(
    new CustomEvent("value-change", {
      detail: { value },
      bubbles: true,
      composed: true,
    }),
  );
}

function parameterRange(el: QuickGameTuningSandbox, parameterId: string) {
  return el.shadowRoot?.querySelector(
    `hud-range[data-parameter-range="${parameterId}"]`,
  );
}

function leafPaths(value: unknown, prefix: string[] = []): string[] {
  if (typeof value !== "object" || value === null) {
    return [prefix.join(".")];
  }
  return Object.entries(value).flatMap(([key, child]) =>
    leafPaths(child, [...prefix, key]),
  );
}

function nextTick() {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

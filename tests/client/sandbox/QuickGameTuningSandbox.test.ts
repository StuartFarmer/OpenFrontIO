import { afterEach, describe, expect, it, vi } from "vitest";
import "../../../src/client/sandbox/QuickGameTuningSandbox";
import { QuickGameTuningSandbox } from "../../../src/client/sandbox/QuickGameTuningSandbox";

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
      events[0].detail.gameStartInfo.config.mechanics.expansionCombat
        .wildernessTilesPerTickMultiplier,
    ).toBe(2);
    expect(tuningTable(el).selectedParameterIds).toEqual([
      "population.growthRate",
      "population.maxPerTile",
      "expansion.wildernessLoss",
      "expansion.wildernessSpeed",
    ]);
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

    const table = tuningTable(el);
    table.shadowRoot?.querySelector("[data-add-parameter]")?.dispatchEvent(
      new CustomEvent("value-change", {
        detail: { value: "food.famineDeathRate" },
        bubbles: true,
        composed: true,
      }),
    );
    await el.updateComplete;

    expect(tuningTable(el).selectedParameterIds).toContain(
      "food.famineDeathRate",
    );

    tuningTable(el)
      .shadowRoot?.querySelector(
        '[data-remove-parameter="food.famineDeathRate"]',
      )
      ?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    await el.updateComplete;

    expect(tuningTable(el).selectedParameterIds).not.toContain(
      "food.famineDeathRate",
    );
  });

  it("renders sliders and visible trash icons for selected parameters", async () => {
    const events: CustomEvent[] = [];
    const el = await renderSandbox(events);
    await nextTick();

    const table = tuningTable(el);
    expect(
      table.shadowRoot?.querySelector(
        'hud-range[data-parameter-range="population.growthRate"]',
      ),
    ).toBeTruthy();
    expect(
      table.shadowRoot?.querySelector(
        'hud-input[data-parameter-input="population.growthRate"]',
      ),
    ).toBeTruthy();
    expect(table.shadowRoot?.querySelector(".remove-mark")?.textContent).toBe(
      "×",
    );
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

function tuningTable(el: QuickGameTuningSandbox) {
  const table = el.shadowRoot?.querySelector("parameter-tuning-table") as
    | (HTMLElement & {
        selectedParameterIds: string[];
        updateComplete: Promise<boolean>;
      })
    | null;
  expect(table).toBeTruthy();
  return table!;
}

function dispatchParameterInput(
  el: QuickGameTuningSandbox,
  parameterId: string,
  value: number,
) {
  const table = tuningTable(el);
  const input = table.shadowRoot?.querySelector(
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

function nextTick() {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

import { afterEach, describe, expect, it, vi } from "vitest";
import "../../../src/client/sandbox/PopulationFoodSystemsSandbox";
import { PopulationFoodSystemsSandbox } from "../../../src/client/sandbox/PopulationFoodSystemsSandbox";

describe("population-food-systems-sandbox", () => {
  afterEach(() => {
    document.body.innerHTML = "";
    vi.restoreAllMocks();
  });

  it("renders the combined population and food dynamics simulator", async () => {
    const el = await renderSandbox();

    expect(el.shadowRoot?.querySelector("hud-surface")).toBeTruthy();
    expect(
      el.shadowRoot?.querySelector("hud-select[data-capacity-mode]"),
    ).toBeTruthy();
    expect(
      el.shadowRoot?.querySelector(
        'hud-range[data-control="foodAllocationToPopulation"]',
      ),
    ).toBeTruthy();
    expect(el.shadowRoot?.textContent).toContain("Population Food Dynamics");
    expect(el.shadowRoot?.textContent).toContain("Food-supported pop");
  });

  it("updates live stocks and advances one step", async () => {
    const el = await renderSandbox();

    dispatchValue(el, 'hud-input[data-control-input="temperature"]', 35);
    dispatchValue(
      el,
      'hud-input[data-control-input="tileExpansionPerTick"]',
      1,
    );
    clickAction(el, "step");
    await el.updateComplete;

    expect(el.shadowRoot?.textContent).toContain("T1");
    expect(el.shadowRoot?.textContent).toContain("35");
  });

  it("switches to hard min capacity mode", async () => {
    const el = await renderSandbox();

    el.shadowRoot
      ?.querySelector("hud-select[data-capacity-mode]")
      ?.dispatchEvent(
        new CustomEvent("value-change", {
          detail: { value: "hard-min-cap" },
          bubbles: true,
          composed: true,
        }),
      );
    await el.updateComplete;

    expect(el.shadowRoot?.textContent).toContain("min(land max population");
  });
});

async function renderSandbox(): Promise<PopulationFoodSystemsSandbox> {
  const el = document.createElement(
    "population-food-systems-sandbox",
  ) as PopulationFoodSystemsSandbox;
  document.body.appendChild(el);
  await el.updateComplete;
  return el;
}

function clickAction(el: PopulationFoodSystemsSandbox, action: string) {
  el.shadowRoot
    ?.querySelector(`hud-button[data-action="${action}"]`)
    ?.dispatchEvent(new MouseEvent("click", { bubbles: true, composed: true }));
}

function dispatchValue(
  el: PopulationFoodSystemsSandbox,
  selector: string,
  value: unknown,
) {
  el.shadowRoot?.querySelector(selector)?.dispatchEvent(
    new CustomEvent("value-change", {
      detail: { value },
      bubbles: true,
      composed: true,
    }),
  );
}

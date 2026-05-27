import { afterEach, describe, expect, it, vi } from "vitest";
import "../../../src/client/sandbox/FoodSystemsSandbox";
import { FoodSystemsSandbox } from "../../../src/client/sandbox/FoodSystemsSandbox";

describe("food-systems-sandbox", () => {
  afterEach(() => {
    document.body.innerHTML = "";
    vi.restoreAllMocks();
  });

  it("renders the standalone food systems simulator", async () => {
    const el = await renderSandbox();

    expect(el.shadowRoot?.querySelector("hud-surface")).toBeTruthy();
    expect(
      el.shadowRoot?.querySelector('hud-range[data-control="temperature"]'),
    ).toBeTruthy();
    expect(
      el.shadowRoot?.querySelector(
        'hud-range[data-control="foodAllocationToPopulation"]',
      ),
    ).toBeTruthy();
    expect(el.shadowRoot?.textContent).toContain("Food Systems Sandbox");
  });

  it("updates live stock controls and advances one step", async () => {
    const el = await renderSandbox();

    dispatchValue(el, 'hud-input[data-control-input="temperature"]', 35);
    dispatchValue(el, 'hud-input[data-control-input="food"]', 100);
    clickAction(el, "step");
    await el.updateComplete;

    expect(el.shadowRoot?.textContent).toContain("T1");
    expect(el.shadowRoot?.textContent).toContain("35 deg C");
  });
});

async function renderSandbox(): Promise<FoodSystemsSandbox> {
  const el = document.createElement(
    "food-systems-sandbox",
  ) as FoodSystemsSandbox;
  document.body.appendChild(el);
  await el.updateComplete;
  return el;
}

function clickAction(el: FoodSystemsSandbox, action: string) {
  el.shadowRoot
    ?.querySelector(`hud-button[data-action="${action}"]`)
    ?.dispatchEvent(new MouseEvent("click", { bubbles: true, composed: true }));
}

function dispatchValue(
  el: FoodSystemsSandbox,
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

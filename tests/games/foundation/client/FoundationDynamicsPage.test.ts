import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  DYNAMICS_SYSTEM_SCHEMA_VERSION,
  SIMPLE_FOOD_STOCK_TEMPLATE,
} from "../../../../src/core/systems/dynamics";
import "../../../../src/games/foundation/client/FoundationDynamicsPage";
import type { FoundationDynamicsPage } from "../../../../src/games/foundation/client/FoundationDynamicsPage";
import {
  FOUNDATION_DYNAMICS_LIBRARY_VERSION,
  FOUNDATION_DYNAMICS_STORAGE_KEY,
} from "../../../../src/games/foundation/dynamics";

describe("FoundationDynamicsPage", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "ResizeObserver",
      class ResizeObserver {
        observe() {}
        unobserve() {}
        disconnect() {}
      },
    );
  });

  afterEach(() => {
    document.body.innerHTML = "";
    window.localStorage.clear();
    vi.unstubAllGlobals();
  });

  it("renders the Foundation dynamics page shell", async () => {
    const page = await renderPage();

    const text = page.shadowRoot?.textContent ?? "";
    expect(text).toContain("Foundation Dynamics");
    expect(text).toContain("Simple Food Stock");
    expect(text).toContain("/foundation/dynamics");
    expect(text).toContain(
      "foodStock = clamp(foodStock + foodProduction - foodDemand, 0, foodStockCapacity)",
    );
    expect(
      page.shadowRoot?.querySelector("[data-node-type='stock']"),
    ).toBeTruthy();
  });

  it("saves and duplicates systems from the page controls", async () => {
    const page = await renderPage();

    setInputValue(page, "[data-system-name]", "Food Stock Variant");
    clickAction(page, "save");
    await page.updateComplete;

    let stored = JSON.parse(
      window.localStorage.getItem(FOUNDATION_DYNAMICS_STORAGE_KEY) ?? "{}",
    );
    expect(stored.systems[0].name).toBe("Food Stock Variant");

    clickAction(page, "duplicate");
    await page.updateComplete;

    stored = JSON.parse(
      window.localStorage.getItem(FOUNDATION_DYNAMICS_STORAGE_KEY) ?? "{}",
    );
    expect(stored.systems).toHaveLength(2);
    expect(stored.systems[1].id).toBe("simple-food-stock-copy");
    expect(page.shadowRoot?.textContent).toContain("Duplicated system.");
  });

  it("imports and exports a dynamics library", async () => {
    const page = await renderPage();
    const importedSystem = {
      ...SIMPLE_FOOD_STOCK_TEMPLATE.system,
      id: "imported-food-stock",
      name: "Imported Food Stock",
    };
    const serialized = JSON.stringify({
      version: FOUNDATION_DYNAMICS_LIBRARY_VERSION,
      systems: [importedSystem],
      scenarios: [
        {
          ...SIMPLE_FOOD_STOCK_TEMPLATE.scenario,
          id: "imported-scenario",
          systemId: "imported-food-stock",
          version: DYNAMICS_SYSTEM_SCHEMA_VERSION,
        },
      ],
    });

    setTextareaValue(page, "[data-import]", serialized);
    clickAction(page, "import");
    await page.updateComplete;

    expect(page.shadowRoot?.textContent).toContain("Imported Food Stock");
    const exportValue = (
      page.shadowRoot?.querySelector("[data-export]") as HTMLTextAreaElement
    )?.value;
    expect(exportValue).toContain("imported-food-stock");
  });

  it("steps the food template simulation and updates the trace", async () => {
    const page = await renderPage();

    expect(page.shadowRoot?.textContent).toContain("T1");

    clickAction(page, "step");
    await page.updateComplete;

    const text = page.shadowRoot?.textContent ?? "";
    expect(text).toContain("T2");
    expect(text).toContain("Stepped to T2.");
    expect(page.shadowRoot?.querySelector(".trace-table")).toBeTruthy();
  });
});

async function renderPage(): Promise<FoundationDynamicsPage> {
  const page = document.createElement(
    "foundation-dynamics-page",
  ) as FoundationDynamicsPage;
  document.body.append(page);
  await page.updateComplete;
  return page;
}

function clickAction(page: FoundationDynamicsPage, action: string) {
  page.shadowRoot
    ?.querySelector(`[data-action="${action}"]`)
    ?.dispatchEvent(new MouseEvent("click", { bubbles: true, composed: true }));
}

function setInputValue(
  page: FoundationDynamicsPage,
  selector: string,
  value: string,
) {
  const input = page.shadowRoot?.querySelector(selector) as HTMLInputElement;
  expect(input).toBeTruthy();
  input.value = value;
  input.dispatchEvent(
    new InputEvent("input", { bubbles: true, composed: true }),
  );
}

function setTextareaValue(
  page: FoundationDynamicsPage,
  selector: string,
  value: string,
) {
  const input = page.shadowRoot?.querySelector(selector) as HTMLTextAreaElement;
  expect(input).toBeTruthy();
  input.value = value;
  input.dispatchEvent(
    new InputEvent("input", { bubbles: true, composed: true }),
  );
}

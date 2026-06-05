import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import "../../../../src/games/foundation/client/FoundationDynamicsPage";
import type { FoundationDynamicsPage } from "../../../../src/games/foundation/client/FoundationDynamicsPage";
import { FOOD_STOCK_BUILTIN_SYSTEM_ID } from "../../../../src/games/foundation/dynamics/FoundationDynamicsModel";

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
    vi.unstubAllGlobals();
  });

  it("uses the Foundation page layout with a left panel and main canvas", async () => {
    const page = await renderPage();

    expect(page.shadowRoot?.querySelector(".app")).toBeTruthy();
    expect(page.shadowRoot?.querySelector(".controls")).toBeTruthy();
    expect(page.shadowRoot?.querySelector(".workspace")).toBeTruthy();
    expect(
      page.shadowRoot?.querySelector("hud-surface.map-panel"),
    ).toBeTruthy();
    expect(page.shadowRoot?.querySelector("#react-flow-host")).toBeTruthy();

    const text = page.shadowRoot?.textContent ?? "";
    expect(text).toContain("Foundation");
    expect(text).toContain("Dynamics builder");
    expect(text).toContain("/foundation/dynamics");
  });

  it("starts a blank unsaved system from the preset controls", async () => {
    const page = await renderPage();
    const newButton = page.shadowRoot?.querySelector<HTMLElement>(
      'hud-icon-button[label="Create new system"]',
    );

    newButton?.click();
    await page.updateComplete;

    const nameInput = page.shadowRoot?.querySelector<HTMLInputElement>(
      ".system-name-field input",
    );
    expect(page.shadowRoot?.textContent ?? "").toContain("No Inputs.");
    expect(nameInput?.value).toBe("Untitled system");
    expect(
      page.shadowRoot?.querySelector(".foundation-dynamics-chart-line"),
    ).toBeNull();
  });

  it("loads systems from the preset dropdown and clears on the placeholder", async () => {
    const page = await renderPage();

    await selectPreset(page, `builtin:${FOOD_STOCK_BUILTIN_SYSTEM_ID}`);
    expect(page.shadowRoot?.textContent ?? "").toContain("tilesOwned");

    await selectPreset(page, "");
    expect(page.shadowRoot?.textContent ?? "").toContain("No Inputs.");
  });

  it("collapses and expands node control cards", async () => {
    const page = await renderPage();
    await selectPreset(page, `builtin:${FOOD_STOCK_BUILTIN_SYSTEM_ID}`);

    const collapseButton = page.shadowRoot?.querySelector<HTMLElement>(
      ".node-collapse-button",
    );

    collapseButton?.click();
    await page.updateComplete;

    expect(
      page.shadowRoot?.querySelector("hud-surface-body[hidden]"),
    ).toBeTruthy();

    collapseButton?.click();
    await page.updateComplete;

    expect(
      page.shadowRoot?.querySelector("hud-surface-body[hidden]"),
    ).toBeNull();
  });

  it("renders a visible simulation chart path after stepping", async () => {
    const page = await renderPage();
    await selectPreset(page, `builtin:${FOOD_STOCK_BUILTIN_SYSTEM_ID}`);

    const stepButton = [...page.shadowRoot!.querySelectorAll("button")].find(
      (button) => button.textContent?.trim() === "Step",
    );

    stepButton?.click();
    await page.updateComplete;

    const chartLine = page.shadowRoot?.querySelector<SVGPathElement>(
      ".foundation-dynamics-chart-line",
    );
    expect(chartLine?.getAttribute("d")).toContain("L");
    expect(chartLine?.getAttribute("stroke")).toBe("rgb(125, 200, 166)");
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

async function selectPreset(
  page: FoundationDynamicsPage,
  value: string,
): Promise<void> {
  const select = page.shadowRoot?.querySelector("hud-select");
  select?.dispatchEvent(new CustomEvent("value-change", { detail: { value } }));
  await page.updateComplete;
}

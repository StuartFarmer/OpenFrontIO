import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DYNAMICS_SCHEMA_VERSION } from "../../../../src/core/systems/dynamics";
import "../../../../src/games/foundation/client/FoundationDynamicsPage";
import type { FoundationDynamicsPage } from "../../../../src/games/foundation/client/FoundationDynamicsPage";
import {
  FOOD_STOCK_BUILTIN_SYSTEM_ID,
  FOUNDATION_DYNAMICS_BUILTIN_SYSTEMS,
  FOUNDATION_DYNAMICS_EDGES,
  FOUNDATION_DYNAMICS_NODES,
  savedDynamicsSystem,
  savedDynamicsSystemToSchema,
} from "../../../../src/games/foundation/dynamics/FoundationDynamicsModel";
import { serializeFoundationDynamicsSystemLibrary } from "../../../../src/games/foundation/dynamics/FoundationDynamicsStorage";

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

  it("keeps existing nodes when adding another node after canvas focus changes", async () => {
    const page = await renderPage();

    clickAddNode(page);
    await page.updateComplete;
    page.shadowRoot
      ?.querySelector("#react-flow-host")
      ?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    await page.updateComplete;
    clickAddNode(page);
    await page.updateComplete;

    const text = page.shadowRoot?.textContent ?? "";
    expect(text.match(/newInput/g)).toHaveLength(2);
  });

  it("renders named native form controls in the editor", async () => {
    const page = await renderPage();

    clickAddNode(page);
    await page.updateComplete;

    const nativeControls = [
      ...page.shadowRoot!.querySelectorAll<
        HTMLInputElement | HTMLTextAreaElement
      >("input, textarea"),
    ];

    expect(nativeControls.length).toBeGreaterThan(0);
    for (const control of nativeControls) {
      expect(control.getAttribute("name")).toBeTruthy();
    }
  });

  it("loads systems from the preset dropdown and clears on the placeholder", async () => {
    const page = await renderPage();

    await selectPreset(page, `builtin:${FOOD_STOCK_BUILTIN_SYSTEM_ID}`);
    expect(page.shadowRoot?.textContent ?? "").toContain("tilesOwned");

    await selectPreset(page, "");
    expect(page.shadowRoot?.textContent ?? "").toContain("No Inputs.");
  });

  it("loads each schema-first built-in preset into the editor", async () => {
    const page = await renderPage();

    for (const system of FOUNDATION_DYNAMICS_BUILTIN_SYSTEMS) {
      await selectPreset(page, `builtin:${system.definition.id}`);

      expect(page.shadowRoot?.textContent ?? "").toContain(
        system.definition.nodes[0]?.name,
      );
    }
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

  it("shows compile diagnostics for invalid formulas", async () => {
    const page = await renderPage();
    await selectPreset(page, `builtin:${FOOD_STOCK_BUILTIN_SYSTEM_ID}`);

    const formula = page.shadowRoot?.querySelector<HTMLTextAreaElement>(
      ".control-widget textarea",
    );
    expect(formula).toBeTruthy();

    formula!.value = "tilesOwned *";
    formula!.dispatchEvent(new Event("input"));
    await page.updateComplete;

    const text = page.shadowRoot?.textContent ?? "";
    expect(text).toContain('Node "food-production" has an invalid expression.');

    const stepButton = [...page.shadowRoot!.querySelectorAll("button")].find(
      (button) => button.textContent?.trim() === "Step",
    );
    expect(stepButton?.disabled).toBe(true);
  });

  it("exports saved systems through the canonical schema", async () => {
    const page = await renderPage();
    await selectPreset(page, `builtin:${FOOD_STOCK_BUILTIN_SYSTEM_ID}`);
    const buttons = [
      ...page.shadowRoot!.querySelectorAll<HTMLElement>("hud-icon-button"),
    ];

    buttons
      .find(
        (button) =>
          button.getAttribute("label") === "Save current system preset",
      )
      ?.click();
    await page.updateComplete;
    buttons
      .find(
        (button) =>
          button.getAttribute("label") === "Export saved systems as JSON",
      )
      ?.click();
    await page.updateComplete;

    const json = page.shadowRoot?.querySelector<HTMLTextAreaElement>(
      ".system-json-field textarea",
    )?.value;
    const parsed = JSON.parse(json ?? "{}") as { version?: number };

    expect(parsed.version).toBe(DYNAMICS_SCHEMA_VERSION);
  });

  it("imports canonical saved systems and loads them into the editor", async () => {
    const page = await renderPage();
    const system = savedDynamicsSystemToSchema(
      savedDynamicsSystem(
        "Imported Food",
        FOUNDATION_DYNAMICS_NODES,
        FOUNDATION_DYNAMICS_EDGES,
      ),
    );
    const textarea = page.shadowRoot?.querySelector<HTMLTextAreaElement>(
      ".system-json-field textarea",
    );

    textarea!.value = serializeFoundationDynamicsSystemLibrary([system]);
    textarea!.dispatchEvent(new Event("input"));
    await page.updateComplete;
    const buttons = [
      ...page.shadowRoot!.querySelectorAll<HTMLElement>("hud-icon-button"),
    ];
    buttons
      .find(
        (button) => button.getAttribute("label") === "Import systems from JSON",
      )
      ?.click();
    await page.updateComplete;

    expect(page.shadowRoot?.textContent ?? "").toContain("tilesOwned");
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

function clickAddNode(page: FoundationDynamicsPage): void {
  page.shadowRoot?.querySelector<HTMLElement>(".add-node-action")?.click();
}

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import "../../../../src/games/foundation/client/FoundationDynamicsPage";
import type { FoundationDynamicsPage } from "../../../../src/games/foundation/client/FoundationDynamicsPage";

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
});

async function renderPage(): Promise<FoundationDynamicsPage> {
  const page = document.createElement(
    "foundation-dynamics-page",
  ) as FoundationDynamicsPage;
  document.body.append(page);
  await page.updateComplete;
  return page;
}

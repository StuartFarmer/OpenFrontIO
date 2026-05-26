import { afterEach, describe, expect, it, vi } from "vitest";
import "../../../src/client/sandbox/SandboxBalancer";
import { SandboxBalancer } from "../../../src/client/sandbox/SandboxBalancer";

describe("sandbox-balancer", () => {
  afterEach(() => {
    document.body.innerHTML = "";
    window.localStorage.clear();
    vi.restoreAllMocks();
  });

  it("renders the developer shell with HUD primitives", async () => {
    const el = await renderSandbox();

    expect(el.shadowRoot?.querySelector("hud-surface")).toBeTruthy();
    expect(el.shadowRoot?.querySelector("hud-button")).toBeTruthy();
    expect(el.shadowRoot?.querySelector("hud-textarea")).toBeTruthy();
  });

  it("dispatches a sandbox join-lobby event for a real local run", async () => {
    const el = await renderSandbox();
    const events: CustomEvent[] = [];
    el.addEventListener("join-lobby", (event) => {
      events.push(event as CustomEvent);
    });

    clickAction(el, "start");

    expect(events).toHaveLength(1);
    expect(events[0].detail.source).toBe("sandbox");
    expect(events[0].detail.gameStartInfo.config.isSandbox).toBe(true);
    expect(events[0].detail.gameStartInfo.config.bots).toBe(0);
    expect(events[0].detail.gameStartInfo.config.nations).toBe("disabled");
  });

  it("persists pending mechanic edits for the next refresh-started run", async () => {
    const el = await renderSandbox();
    const events: CustomEvent[] = [];
    el.addEventListener("join-lobby", (event) => {
      events.push(event as CustomEvent);
    });

    clickAction(el, "start");
    const initialGrowth =
      events[0].detail.gameStartInfo.config.mechanics.populationResources
        .troopLogisticGrowthRate;

    dispatchValue(
      el,
      'hud-input[data-mechanic-input="troopLogisticGrowthRate"]',
      0.025,
    );
    await el.updateComplete;

    expect(events).toHaveLength(1);

    document.body.innerHTML = "";
    const reloaded = await renderSandbox();
    const reloadedEvents: CustomEvent[] = [];
    reloaded.addEventListener("join-lobby", (event) => {
      reloadedEvents.push(event as CustomEvent);
    });
    await reloaded.updateComplete;
    await new Promise((resolve) => setTimeout(resolve, 0));
    const refreshedGrowth =
      reloadedEvents[0].detail.gameStartInfo.config.mechanics
        .populationResources.troopLogisticGrowthRate;

    expect(initialGrowth).toBe(0.016);
    expect(refreshedGrowth).toBe(0.025);
  });

  it("persists scenario launch settings between refreshes", async () => {
    const el = await renderSandbox();

    el.shadowRoot?.querySelector("hud-segmented-control")?.dispatchEvent(
      new CustomEvent("selection-change", {
        detail: { id: "scenario" },
        bubbles: true,
        composed: true,
      }),
    );
    dispatchValue(el, "hud-input[type='number']", 12);
    const numberInputs = el.shadowRoot?.querySelectorAll(
      "hud-input[type='number']",
    );
    numberInputs?.[1]?.dispatchEvent(
      new CustomEvent("value-change", {
        detail: { value: 7 },
        bubbles: true,
        composed: true,
      }),
    );
    await el.updateComplete;

    document.body.innerHTML = "";
    const reloaded = await renderSandbox();
    const events: CustomEvent[] = [];
    reloaded.addEventListener("join-lobby", (event) => {
      events.push(event as CustomEvent);
    });

    clickAction(reloaded, "start");

    expect(events[0].detail.gameStartInfo.config.bots).toBe(12);
    expect(events[0].detail.gameStartInfo.config.nations).toBe(7);
  });

  it("imports valid mechanics JSON and rejects invalid JSON", async () => {
    const el = await renderSandbox();
    const events: CustomEvent[] = [];
    el.addEventListener("join-lobby", (event) => {
      events.push(event as CustomEvent);
    });

    dispatchValue(
      el,
      "hud-textarea[data-json]",
      JSON.stringify({
        version: 1,
        populationResources: { passiveResourceRegenMultiplier: 0.75 },
      }),
    );
    clickAction(el, "import-json");
    clickAction(el, "start");

    expect(
      events[0].detail.gameStartInfo.config.mechanics.populationResources
        .passiveResourceRegenMultiplier,
    ).toBe(0.75);

    dispatchValue(el, "hud-textarea[data-json]", "{");
    clickAction(el, "import-json");
    await el.updateComplete;

    expect(el.shadowRoot?.querySelector(".json-error")?.textContent).toContain(
      "JSON",
    );
  });

  it("dispatches pause and resume commands for active sandbox runs", async () => {
    const el = await renderSandbox();
    const pauses: CustomEvent[] = [];
    el.addEventListener("sandbox-pause-game", (event) => {
      pauses.push(event as CustomEvent);
    });

    clickAction(el, "start");
    clickAction(el, "pause");
    clickAction(el, "pause");

    expect(pauses.map((event) => event.detail.paused)).toEqual([true, false]);
  });
});

async function renderSandbox(): Promise<SandboxBalancer> {
  const el = document.createElement("sandbox-balancer") as SandboxBalancer;
  document.body.appendChild(el);
  await el.updateComplete;
  return el;
}

function clickAction(el: SandboxBalancer, action: string) {
  el.shadowRoot
    ?.querySelector(`hud-button[data-action="${action}"]`)
    ?.dispatchEvent(new MouseEvent("click", { bubbles: true, composed: true }));
}

function dispatchValue(el: SandboxBalancer, selector: string, value: unknown) {
  el.shadowRoot?.querySelector(selector)?.dispatchEvent(
    new CustomEvent("value-change", {
      detail: { value },
      bubbles: true,
      composed: true,
    }),
  );
}

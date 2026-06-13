import { describe, expect, it } from "vitest";
import type { FoundationRuntimeSnapshot } from "../../../../src/games/foundation";
import "../../../../src/games/foundation/client/FoundationDebugPanel";
import type {
  FoundationClientStatus,
  FoundationDebugPanel,
} from "../../../../src/games/foundation/client/FoundationDebugPanel";

function snapshot(
  overrides: Partial<FoundationRuntimeSnapshot> = {},
): FoundationRuntimeSnapshot {
  return {
    moduleId: "foundation",
    tick: 3,
    updateCount: 2,
    map: { width: 256, height: 256 },
    player: {
      id: "player-1",
      ownerId: 1,
      name: "Player",
      placed: true,
      selectedTile: 32896,
      claimedTileCount: 317,
      buildings: [],
      troops: 25000,
      maxTroops: 163000,
      foodProduction: 163000,
      foodDemand: 25000,
      foodSupportedTroops: 163000,
      foodSurplus: 138000,
      foodDeficit: 0,
      foodStock: 12_000,
      foodStockCapacity: 20_000,
      foodStockDelta: 8_000,
      foodStockOverflow: 7_000,
      troopIncreaseRate: 300,
      exploringTroops: 5000,
    },
    ...overrides,
  };
}

describe("FoundationDebugPanel", () => {
  it("renders the Foundation placement metrics without extra game systems", async () => {
    const panel = document.createElement(
      "foundation-debug-panel",
    ) as FoundationDebugPanel;
    panel.snapshot = snapshot();
    panel.status = {
      tone: "ok",
      text: "Placed player at 128, 128.",
    } satisfies FoundationClientStatus;

    document.body.append(panel);
    await panel.updateComplete;

    const text = panel.shadowRoot?.textContent ?? "";
    expect(text).toContain("256 x 256");
    expect(text).toContain("placed");
    expect(text).toContain("32,896");
    expect(text).toContain("317");
    expect(text).toContain("2.50K");
    expect(text).toContain("16.3K");
    expect(text).toContain("+13.8K/tick");
    expect(text).toContain("1.20K / 2.00K");
    expect(text).toContain("+800, 700 lost");
    expect(text).toContain("300/s");
    expect(text).toContain("500");
    expect(text).toContain("Placed player at 128, 128.");
    expect(text).toContain("Pause");
    expect(text).toContain("Reset");
    expect(text).not.toContain("Population");
    panel.remove();
  });

  it("emits play pause and reset control events", async () => {
    const panel = document.createElement(
      "foundation-debug-panel",
    ) as FoundationDebugPanel;
    panel.snapshot = snapshot();

    let playPauseEvents = 0;
    let resetEvents = 0;
    panel.addEventListener("foundation-play-pause", () => playPauseEvents++);
    panel.addEventListener("foundation-reset-simulation", () => resetEvents++);

    document.body.append(panel);
    await panel.updateComplete;

    const buttons = Array.from(
      panel.shadowRoot?.querySelectorAll("button") ?? [],
    );
    buttons[0].click();
    buttons[1].click();

    expect(playPauseEvents).toBe(1);
    expect(resetEvents).toBe(1);
    panel.remove();
  });

  it("shows an unplaced selected tile state", async () => {
    const panel = document.createElement(
      "foundation-debug-panel",
    ) as FoundationDebugPanel;
    panel.snapshot = snapshot({
      tick: 0,
      updateCount: 0,
      player: {
        id: "player-1",
        ownerId: 1,
        name: "Player",
        placed: false,
        selectedTile: null,
        claimedTileCount: 0,
        buildings: [],
        troops: 25000,
        maxTroops: 100000,
        foodProduction: 100000,
        foodDemand: 25000,
        foodSupportedTroops: 100000,
        foodSurplus: 75000,
        foodDeficit: 0,
        foodStock: 0,
        foodStockCapacity: 20_000,
        foodStockDelta: 0,
        foodStockOverflow: 0,
        troopIncreaseRate: 0,
        exploringTroops: 0,
      },
    });

    document.body.append(panel);
    await panel.updateComplete;

    const text = panel.shadowRoot?.textContent ?? "";
    expect(text).toContain("unplaced");
    expect(text).toContain("none");
    panel.remove();
  });
});

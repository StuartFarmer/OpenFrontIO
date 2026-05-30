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
      troops: 25000,
      maxTroops: 163000,
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
    expect(text).toContain("25,000");
    expect(text).toContain("163,000");
    expect(text).toContain("5,000");
    expect(text).toContain("Placed player at 128, 128.");
    expect(text).not.toContain("Food");
    expect(text).not.toContain("Population");
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
        troops: 25000,
        maxTroops: 100000,
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

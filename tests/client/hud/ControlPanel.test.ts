import { afterEach, describe, expect, it } from "vitest";
import { ControlPanel } from "../../../src/client/hud/layers/ControlPanel";
import { GameUpdateType } from "../../../src/core/game/GameUpdates";
import {
  makeEmptyGu,
  makeGameView,
  makeNameViewData,
  makePlayerUpdate,
} from "../../util/viewStubs";

describe("ControlPanel resources", () => {
  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("renders Biomass, Fuels, and Metals from the local player resources", async () => {
    const game = makeGameView({ myClientID: "client-a" });
    const update = makeEmptyGu(1);
    const player = makePlayerUpdate({
      id: "player-a",
      clientID: "client-a",
      smallID: 1,
      gold: 50n,
      resources: { food: 100n, energy: 200n, materials: 300n },
      resourceCapacity: { food: 1000n, energy: 2000n, materials: 3000n },
      effectiveTroopCapacity: 750,
      troopIncreaseRate: -2,
    });
    update.updates[GameUpdateType.Player] = [player];
    update.playerNameViewData[player.id] = makeNameViewData();
    game.update(update);

    const panel = new ControlPanel();
    panel.game = game;
    document.body.appendChild(panel);

    panel.tick();
    await panel.updateComplete;

    expect(panel.textContent).toContain("Biomass");
    expect(panel.textContent).toContain("Fuels");
    expect(panel.textContent).toContain("Metals");
    expect(panel.textContent).toContain("Troops");
    expect(panel.textContent).toContain("100");
    expect(panel.textContent).toContain("200");
    expect(panel.textContent).toContain("300");
    expect(panel.textContent).toContain("50");
    expect(panel.textContent).toContain("-2/s");
    expect(panel.textContent).toContain("75");
  });

  it("switches the selected metric bar when a resource tab is clicked", async () => {
    const game = makeGameView({ myClientID: "client-a" });
    const update = makeEmptyGu(1);
    const player = makePlayerUpdate({
      id: "player-a",
      clientID: "client-a",
      smallID: 1,
      resources: { food: 100n, energy: 200n, materials: 300n },
      resourceCapacity: { food: 1000n, energy: 2000n, materials: 3000n },
    });
    update.updates[GameUpdateType.Player] = [player];
    update.playerNameViewData[player.id] = makeNameViewData();
    game.update(update);

    const panel = new ControlPanel();
    panel.game = game;
    document.body.appendChild(panel);

    panel.tick();
    await panel.updateComplete;

    const metalsTab = Array.from(panel.querySelectorAll("button")).find(
      (button) => button.textContent?.includes("Metals"),
    );
    expect(metalsTab).toBeDefined();
    metalsTab!.click();
    await panel.updateComplete;

    expect(metalsTab!.getAttribute("aria-pressed")).toBe("true");
    expect(panel.textContent).toContain("3.00K");
    expect(panel.textContent).toContain("34%");
    expect(panel.textContent).toContain("33%");
    expect(
      panel.querySelector('img[src="/icons/biomass-icon.svg"]'),
    ).toBeTruthy();
    expect(panel.querySelector('img[src="/icons/fuel-icon.svg"]')).toBeTruthy();
    expect(
      panel.querySelector('img[src="/icons/metal-icon.svg"]'),
    ).toBeTruthy();
  });
});

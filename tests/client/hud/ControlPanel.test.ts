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
    expect(panel.textContent).toContain("100/1.00K");
    expect(panel.textContent).toContain("200/2.00K");
    expect(panel.textContent).toContain("300/3.00K");
    expect(panel.textContent).toContain("50");
  });
});

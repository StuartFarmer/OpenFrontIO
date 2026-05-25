import { afterEach, describe, expect, it } from "vitest";
import { ControlPanel } from "../../../src/client/hud/layers/ControlPanel";
import { GameUpdateType } from "../../../src/core/game/GameUpdates";
import {
  makeEmptyGu,
  makeGameView,
  makeNameViewData,
  makePlayerUpdate,
} from "../../util/viewStubs";

function collectText(node: Node): string {
  let text = node.textContent ?? "";
  if (node instanceof Element && node.shadowRoot) {
    text += collectText(node.shadowRoot);
  }
  for (const child of Array.from(node.childNodes)) {
    text += collectText(child);
  }
  return text;
}

function queryDeepAll<T extends Element>(root: ParentNode, selector: string): T[] {
  const matches = Array.from(root.querySelectorAll<T>(selector));
  for (const element of Array.from(root.querySelectorAll("*"))) {
    if (element.shadowRoot) {
      matches.push(...queryDeepAll<T>(element.shadowRoot, selector));
    }
  }
  return matches;
}

function hasDeepIconSrc(root: ParentNode, src: string): boolean {
  return queryDeepAll<HTMLElement>(root, "hud-icon,hud-mask-icon").some(
    (element) => (element as unknown as { src?: string }).src === src,
  );
}

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

    const text = collectText(panel);
    expect(text).toContain("Biomass");
    expect(text).toContain("Fuels");
    expect(text).toContain("Metals");
    expect(text).toContain("Troops");
    expect(text).toContain("100");
    expect(text).toContain("200");
    expect(text).toContain("300");
    expect(text).toContain("50");
    expect(text).toContain("-2/s");
    expect(text).toContain("75");
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

    const metalsTab = queryDeepAll<HTMLButtonElement>(panel, "button").find(
      (button) => button.textContent?.includes("Metals"),
    );
    expect(metalsTab).toBeDefined();
    metalsTab!.click();
    await panel.updateComplete;

    expect(metalsTab!.getAttribute("aria-pressed")).toBe("true");
    const text = collectText(panel);
    expect(text).toContain("3.00K");
    expect(text).toContain("34%");
    expect(text).toContain("33%");
    expect(hasDeepIconSrc(panel, "/icons/biomass-icon.svg")).toBe(true);
    expect(hasDeepIconSrc(panel, "/icons/fuel-icon.svg")).toBe(true);
    expect(hasDeepIconSrc(panel, "/icons/metal-icon.svg")).toBe(true);
  });
});

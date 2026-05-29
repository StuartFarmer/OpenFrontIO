import { afterEach, describe, expect, it } from "vitest";
import { ControlPanel } from "../../../src/client/hud/layers/ControlPanel";
import { SendFoodAllocationIntentEvent } from "../../../src/client/Transport";
import { EventBus } from "../../../src/core/EventBus";
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

function queryDeepAll<T extends Element>(
  root: ParentNode,
  selector: string,
): T[] {
  const matches = Array.from(root.querySelectorAll<T>(selector));
  if (root instanceof Element && root.shadowRoot) {
    matches.push(...queryDeepAll<T>(root.shadowRoot, selector));
  }
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
      foodAllocationToPopulation: 0.4,
    });
    update.updates[GameUpdateType.Player] = [player];
    update.playerNameViewData[player.id] = makeNameViewData();
    game.update(update);

    const panel = new ControlPanel();
    panel.game = game;
    document.body.appendChild(panel);

    panel.tick();
    await panel.updateComplete;

    const metricSelector = queryDeepAll<HTMLElement>(
      panel,
      "hud-segmented-control",
    ).find(
      (element) =>
        (element as unknown as { selected?: string }).selected === "troops",
    );
    expect(metricSelector).toBeDefined();
    metricSelector!.dispatchEvent(
      new CustomEvent("selection-change", {
        detail: { id: "materials" },
        bubbles: true,
        composed: true,
      }),
    );
    await panel.updateComplete;

    expect((metricSelector as unknown as { selected?: string }).selected).toBe(
      "materials",
    );
    const text = collectText(panel);
    expect(text).toContain("3.00K");
    expect(queryDeepAll(panel, "hud-blend-slider")).toHaveLength(0);
    expect(hasDeepIconSrc(panel, "/icons/biomass-icon.svg")).toBe(true);
    expect(hasDeepIconSrc(panel, "/icons/fuel-icon.svg")).toBe(true);
    expect(hasDeepIconSrc(panel, "/icons/metal-icon.svg")).toBe(true);
  });

  it("renders a single biomass allocation range when Biomass is selected", async () => {
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
    panel.eventBus = new EventBus();
    panel.uiState = {
      attackRatio: 0.2,
      foodAllocationToPopulation: 0.4,
      ghostStructure: null,
      overlappingRailroads: [],
      ghostRailPaths: [],
      rocketDirectionUp: true,
    };
    document.body.appendChild(panel);

    panel.tick();
    await panel.updateComplete;

    queryDeepAll<HTMLElement>(panel, "hud-segmented-control")[0].dispatchEvent(
      new CustomEvent("selection-change", {
        detail: { id: "food" },
        bubbles: true,
        composed: true,
      }),
    );
    await panel.updateComplete;

    const ranges = queryDeepAll<HTMLElement>(
      panel,
      'hud-range[data-control="foodAllocationToPopulation"]',
    );
    expect(ranges).toHaveLength(1);
    expect(queryDeepAll(panel, "hud-blend-slider")).toHaveLength(0);
    expect(collectText(panel)).toContain("40% eat / 60% store");

    const emitted: SendFoodAllocationIntentEvent[] = [];
    panel.eventBus.on(SendFoodAllocationIntentEvent, (event) => {
      emitted.push(event);
    });
    ranges[0].dispatchEvent(
      new CustomEvent("value-change", {
        detail: { value: 65 },
        bubbles: true,
        composed: true,
      }),
    );
    await panel.updateComplete;

    expect(panel.uiState.foodAllocationToPopulation).toBe(0.65);
    expect(emitted[emitted.length - 1]?.foodAllocationToPopulation).toBe(0.65);
    expect(collectText(panel)).toContain("65% eat / 35% store");
  });
});

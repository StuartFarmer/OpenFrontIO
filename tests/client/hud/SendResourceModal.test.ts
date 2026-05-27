import { afterEach, describe, expect, it, vi } from "vitest";
import "../../../src/client/hud/layers/SendResourceModal";

type TestSendResourceModal = HTMLElement & {
  open: boolean;
  mode: "troops" | "gold";
  total: number | bigint;
  eventBus: { emit: ReturnType<typeof vi.fn> };
  myPlayer: unknown;
  target: unknown;
  gameView: unknown;
  updateComplete: Promise<boolean>;
};

const alivePlayer = (values: {
  name?: string;
  troops?: number;
  gold?: bigint;
}) => ({
  isAlive: () => true,
  name: () => values.name ?? "Target",
  troops: () => values.troops ?? 0,
  gold: () => values.gold ?? 0n,
});

describe("send-resource-modal", () => {
  afterEach(() => {
    document.body.replaceChildren();
    vi.restoreAllMocks();
  });

  it("uses shared UI controls while preserving troop capacity clamp on confirm", async () => {
    const modal = document.createElement(
      "send-resource-modal",
    ) as TestSendResourceModal;
    const emit = vi.fn();
    const confirmed = vi.fn();
    const closed = vi.fn();

    modal.open = true;
    modal.mode = "troops";
    modal.total = 100;
    modal.eventBus = { emit };
    modal.myPlayer = alivePlayer({ troops: 100 });
    modal.target = alivePlayer({ name: "Ally", troops: 25 });
    modal.gameView = {
      config: () => ({
        maxTroops: () => 50,
      }),
    };
    modal.addEventListener("confirm", confirmed);
    modal.addEventListener("close", closed);

    document.body.append(modal);
    await modal.updateComplete;

    expect(modal.querySelector("ui-surface")).toBeTruthy();
    expect(modal.querySelector("ui-pill")).toBeTruthy();
    expect(modal.querySelectorAll("ui-button").length).toBeGreaterThanOrEqual(
      7,
    );

    const actions = Array.from(modal.querySelectorAll("ui-button"));
    actions[actions.length - 1]!.dispatchEvent(
      new MouseEvent("click", { bubbles: true, composed: true }),
    );

    expect(emit).toHaveBeenCalledTimes(1);
    expect(confirmed).toHaveBeenCalledWith(
      expect.objectContaining({
        detail: { amount: 25, closePanel: true, success: true },
      }),
    );
    expect(closed).toHaveBeenCalledTimes(1);
  });
});

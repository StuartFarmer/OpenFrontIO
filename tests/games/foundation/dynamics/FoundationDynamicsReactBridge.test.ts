import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SIMPLE_FOOD_STOCK_TEMPLATE } from "../../../../src/core/systems/dynamics";
import { FoundationDynamicsReactBridge } from "../../../../src/games/foundation/dynamics/react";

describe("FoundationDynamicsReactBridge", () => {
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

  it("mounts and unmounts the React Flow island", async () => {
    const container = document.createElement("div");
    container.style.width = "800px";
    container.style.height = "600px";
    document.body.append(container);

    const bridge = new FoundationDynamicsReactBridge(container, {
      system: SIMPLE_FOOD_STOCK_TEMPLATE.system,
    });
    await nextFrame();

    expect(container.querySelector(".react-flow")).toBeTruthy();

    bridge.unmount();

    expect(container.innerHTML).toBe("");
  });

  it("emits schema changes through the bridge boundary", () => {
    const container = document.createElement("div");
    document.body.append(container);
    const onSystemChange = vi.fn();
    const bridge = new FoundationDynamicsReactBridge(container, {
      system: SIMPLE_FOOD_STOCK_TEMPLATE.system,
      onSystemChange,
    });
    const nextSystem = {
      ...SIMPLE_FOOD_STOCK_TEMPLATE.system,
      name: "Renamed System",
    };

    bridge.emitSystemChange(nextSystem);

    expect(onSystemChange).toHaveBeenCalledWith(nextSystem);
    bridge.unmount();
  });
});

function nextFrame(): Promise<void> {
  return new Promise((resolve) => requestAnimationFrame(() => resolve()));
}

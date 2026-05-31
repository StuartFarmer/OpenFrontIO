import { describe, expect, it } from "vitest";
import "../../../../src/games/foundation/client/FoundationTuningPanel";
import type { FoundationTuningPanel } from "../../../../src/games/foundation/client/FoundationTuningPanel";

describe("FoundationTuningPanel", () => {
  it("renders persisted tuning controls and emits changes", async () => {
    const panel = document.createElement(
      "foundation-tuning-panel",
    ) as FoundationTuningPanel;

    let changedAttackRatio = 0;
    panel.addEventListener("foundation-tuning-change", (event) => {
      changedAttackRatio = (event as CustomEvent).detail.attackRatio;
    });

    document.body.append(panel);
    await panel.updateComplete;

    const text = panel.shadowRoot?.textContent ?? "";
    expect(text).toContain("Tuning");
    expect(text).toContain("Base speed");

    const attackInput = panel.shadowRoot?.querySelector(
      'input[min="1"][max="100"]',
    ) as HTMLInputElement;
    attackInput.value = "35";
    attackInput.dispatchEvent(new Event("change"));

    expect(changedAttackRatio).toBe(0.35);
    panel.remove();
  });

  it("emits default settings reset", async () => {
    const panel = document.createElement(
      "foundation-tuning-panel",
    ) as FoundationTuningPanel;

    let resetElevation = "";
    panel.addEventListener("foundation-tuning-reset", (event) => {
      resetElevation = (event as CustomEvent).detail.elevation;
    });

    document.body.append(panel);
    await panel.updateComplete;

    const resetButton = Array.from(
      panel.shadowRoot?.querySelectorAll("button") ?? [],
    ).find((button) => button.textContent?.includes("Reset defaults"));
    resetButton?.click();

    expect(resetElevation).toBe("flat");
    panel.remove();
  });

  it("copies current settings as JSON", async () => {
    const panel = document.createElement(
      "foundation-tuning-panel",
    ) as FoundationTuningPanel;
    const writes: string[] = [];
    const originalClipboard = navigator.clipboard;
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: {
        writeText: async (value: string) => {
          writes.push(value);
        },
      },
    });

    let copyOk = false;
    panel.addEventListener("foundation-tuning-copy", (event) => {
      copyOk = (event as CustomEvent).detail.ok;
    });

    document.body.append(panel);
    await panel.updateComplete;

    const copyButton = panel.shadowRoot?.querySelector("button");
    copyButton?.click();
    await Promise.resolve();

    expect(copyOk).toBe(true);
    expect(JSON.parse(writes[0])).toMatchObject({
      elevation: "flat",
      attackRatio: 0.2,
    });

    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: originalClipboard,
    });
    panel.remove();
  });
});

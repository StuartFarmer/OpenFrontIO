import { afterEach, describe, expect, it } from "vitest";
import "../../../src/client/GameModeSelector";
import "../../../src/client/components/PlayPage";

describe("homepage play flow shell", () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  it("renders the play page entry points", async () => {
    const page = document.createElement("play-page") as HTMLElement & {
      updateComplete: Promise<boolean>;
    };

    document.body.append(page);
    await page.updateComplete;

    expect(page.querySelector("#page-play")).toBeDefined();
    expect(page.querySelector("username-input")).toBeDefined();
    expect(page.querySelector("game-mode-selector")).toBeDefined();
  });

  it("renders quick game, solo, host, and join actions with shared buttons", async () => {
    const selector = document.createElement(
      "game-mode-selector",
    ) as HTMLElement & {
      updateComplete: Promise<boolean>;
    };

    document.body.append(selector);
    await selector.updateComplete;

    const buttons = [...selector.querySelectorAll("hud-button")];
    expect(buttons).toHaveLength(4);
    expect(buttons[0].getAttribute("label")).toBe("Quick Game");
    for (const button of buttons) {
      expect(button.getAttribute("label")?.trim()).not.toBe("");
    }
  });
});

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import "../../../src/client/sandbox/WarBattleSystemsSandbox";
import { WarBattleSystemsSandbox } from "../../../src/client/sandbox/WarBattleSystemsSandbox";

describe("war-battle-systems-sandbox", () => {
  beforeEach(() => {
    vi.useRealTimers();
  });

  afterEach(() => {
    document.body.innerHTML = "";
    window.localStorage.clear();
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it("renders the standalone war battle simulator", async () => {
    const el = await renderSandbox();

    expect(el.shadowRoot?.querySelector("hud-surface")).toBeTruthy();
    expect(
      el.shadowRoot?.querySelector('hud-range[data-control="attacker.push"]'),
    ).toBeTruthy();
    expect(
      el.shadowRoot?.querySelector('hud-range[data-control="attacker.troops"]'),
    ).toBeTruthy();
    expect(
      el.shadowRoot?.querySelector(
        'hud-range[data-control="growth.growthRate"]',
      ),
    ).toBeTruthy();
    expect(
      el.shadowRoot?.querySelector(
        'hud-range[data-control="attacker.growthMultiplier"]',
      ),
    ).toBeTruthy();
    expect(el.shadowRoot?.querySelector("hud-tabs")).toBeTruthy();
    expect(el.shadowRoot?.textContent).toContain("War Battle Systems Sandbox");
    expect(el.shadowRoot?.textContent).toContain("Left side");
    expect(el.shadowRoot?.textContent).toContain("Right side");
    expect(runButton(el)?.disabled).toBe(false);
  });

  it("pushes from the left side and advances one battle tick", async () => {
    const el = await renderSandbox();

    dispatchValue(el, 'hud-input[data-control-input="attacker.push"]', 5000);
    clickAction(el, "attacker-push");
    await el.updateComplete;

    expect(el.shadowRoot?.textContent).toContain("fighting");
    expect(el.shadowRoot?.textContent).toContain("Pause");
    expect(
      el.shadowRoot?.querySelector('hud-stat[label="Left push"]'),
    ).toBeTruthy();

    clickAction(el, "run");
    await el.updateComplete;
    clickAction(el, "step");
    await el.updateComplete;

    expect(el.shadowRoot?.textContent).toContain("T1");
    expect(
      el.shadowRoot?.querySelector('hud-stat[label="Tiles / tick"]'),
    ).toBeTruthy();
    expect(currentBattle(el).defender.troops).toBeLessThan(40_000);
    expect(statValue(el, "Right growth")).toBe("0");
  });

  it("pushes from the right side and uses pause and resume", async () => {
    const el = await renderSandbox();

    dispatchValue(el, 'hud-input[data-control-input="defender.push"]', 5000);
    clickAction(el, "defender-push");
    await el.updateComplete;
    expect(el.shadowRoot?.textContent).toContain(
      "Right side is actively pushing",
    );
    expect(el.shadowRoot?.textContent).toContain("Pause");

    clickAction(el, "run");
    await el.updateComplete;
    expect(el.shadowRoot?.textContent).toContain("Resume");

    clickAction(el, "run");
    await el.updateComplete;
    expect(el.shadowRoot?.textContent).toContain("Pause");
  });

  it("lets the right side counter an active left-side push", async () => {
    const el = await renderSandbox();

    dispatchValue(el, 'hud-input[data-control-input="attacker.push"]', 5000);
    clickAction(el, "attacker-push");
    await el.updateComplete;
    clickAction(el, "run");
    await el.updateComplete;

    dispatchValue(el, 'hud-input[data-control-input="defender.push"]', 7000);
    clickAction(el, "defender-push");
    await el.updateComplete;

    expect(el.shadowRoot?.textContent).toContain(
      "Right side is actively pushing",
    );
    expect(el.shadowRoot?.textContent).toContain("2,000");
  });

  it("applies troop growth when a tick advances", async () => {
    const el = await renderSandbox();

    dispatchValue(el, 'hud-input[data-control-input="attacker.troops"]', 9500);
    await el.updateComplete;
    expect(statValue(el, "Left troops")).toBe("9.5K");

    clickAction(el, "step");
    await el.updateComplete;

    expect(Number(statValue(el, "Left growth"))).toBeGreaterThan(0);
    expect(statValue(el, "Left troops")).toBe("9.6K");
  });

  it("can start the clock before either side pushes", async () => {
    vi.useFakeTimers();
    const el = await renderSandbox();

    clickAction(el, "run");
    await el.updateComplete;

    expect(el.shadowRoot?.textContent).toContain("Pause");
    expect(runButton(el)?.disabled).toBe(false);

    vi.advanceTimersByTime(360);
    await el.updateComplete;

    expect(el.shadowRoot?.textContent).toContain("Pause");
    expect(el.shadowRoot?.textContent).toContain("T3");
  });

  it("restores selected values after remount", async () => {
    const el = await renderSandbox();

    dispatchValue(el, 'hud-input[data-control-input="attacker.troops"]', 12345);
    dispatchValue(el, 'hud-input[data-control-input="defender.push"]', 21000);
    dispatchValue(
      el,
      'hud-input[data-control-input="growth.growthRate"]',
      0.02,
    );
    await el.updateComplete;

    el.remove();
    const restored = await renderSandbox();

    expect(currentBattle(restored).attacker.troops).toBe(12345);
    expect(
      inputValue(restored, 'hud-input[data-control-input="defender.push"]'),
    ).toBe("21000");
    expect(
      inputValue(restored, 'hud-input[data-control-input="growth.growthRate"]'),
    ).toBe("0.02");
  });
});

async function renderSandbox(): Promise<WarBattleSystemsSandbox> {
  const el = document.createElement(
    "war-battle-systems-sandbox",
  ) as WarBattleSystemsSandbox;
  document.body.appendChild(el);
  await el.updateComplete;
  return el;
}

function clickAction(el: WarBattleSystemsSandbox, action: string) {
  el.shadowRoot
    ?.querySelector(`hud-button[data-action="${action}"]`)
    ?.dispatchEvent(new MouseEvent("click", { bubbles: true, composed: true }));
}

function runButton(el: WarBattleSystemsSandbox) {
  return el.shadowRoot?.querySelector('hud-button[data-action="run"]') as {
    disabled?: boolean;
  } | null;
}

function dispatchValue(
  el: WarBattleSystemsSandbox,
  selector: string,
  value: unknown,
) {
  el.shadowRoot?.querySelector(selector)?.dispatchEvent(
    new CustomEvent("value-change", {
      detail: { value },
      bubbles: true,
      composed: true,
    }),
  );
}

function statValue(el: WarBattleSystemsSandbox, label: string): string {
  const stat = el.shadowRoot?.querySelector(`hud-stat[label="${label}"]`) as {
    value?: string;
  } | null;
  return stat?.value ?? "";
}

function inputValue(el: WarBattleSystemsSandbox, selector: string): string {
  const input = el.shadowRoot?.querySelector(selector) as {
    value?: string;
  } | null;
  return input?.value ?? "";
}

function currentBattle(el: WarBattleSystemsSandbox) {
  return (
    el as unknown as {
      battle: {
        attacker: { troops: number };
        defender: { troops: number };
      };
    }
  ).battle;
}

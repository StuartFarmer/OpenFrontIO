import { afterEach, describe, expect, it, vi } from "vitest";
import "../../../src/client/components/baseComponents/Button";
import { OModal } from "../../../src/client/components/baseComponents/Modal";
import "../../../src/client/components/baseComponents/setting/SettingNumber";
import "../../../src/client/components/baseComponents/setting/SettingSelect";
import "../../../src/client/components/baseComponents/setting/SettingSlider";
import "../../../src/client/components/baseComponents/setting/SettingToggle";
import "../../../src/client/components/ui";

const sharedTags = [
  "hud-surface",
  "hud-surface-header",
  "hud-surface-body",
  "hud-surface-footer",
  "hud-button",
  "hud-icon-button",
  "hud-action-group",
  "hud-pill",
  "hud-label",
  "hud-alert",
  "hud-form-row",
  "hud-input",
  "hud-textarea",
  "hud-select",
  "hud-range",
  "hud-toggle",
  "hud-checkbox",
  "hud-stat-grid",
  "hud-stat",
  "hud-table",
  "hud-table-row",
  "hud-table-cell",
  "hud-list-row",
  "hud-empty-state",
  "hud-loading-state",
  "hud-modal-shell",
  "hud-modal-header",
  "hud-modal-body",
  "hud-modal-footer",
  "hud-menu",
  "hud-menu-item",
  "hud-divider",
  "hud-row",
  "hud-stack",
  "hud-grid",
];

describe("shared UI components", () => {
  afterEach(() => {
    document.body.replaceChildren();
    document.body.style.overflow = "";
    OModal.openCount = 0;
    vi.restoreAllMocks();
  });

  it("registers the shared primitive custom elements", () => {
    for (const tag of sharedTags) {
      expect(customElements.get(tag), tag).toBeDefined();
    }
  });

  it("hud-button reflects disabled state to the internal button", async () => {
    const button = document.createElement("hud-button") as HTMLElement & {
      disabled: boolean;
      updateComplete: Promise<boolean>;
    };
    button.textContent = "Save";
    button.disabled = true;

    document.body.append(button);
    await button.updateComplete;

    const internal = button.shadowRoot?.querySelector("button");
    expect(internal?.disabled).toBe(true);
    expect(button.textContent?.trim()).toBe("Save");
  });

  it("hud-input emits composed input events and updates value", async () => {
    const input = document.createElement("hud-input") as HTMLElement & {
      value: string;
      updateComplete: Promise<boolean>;
    };
    const spy = vi.fn();
    input.addEventListener("input", spy);

    document.body.append(input);
    await input.updateComplete;

    const internal = input.shadowRoot?.querySelector("input");
    expect(internal).toBeDefined();

    internal!.value = "abc";
    internal!.dispatchEvent(new InputEvent("input", { bubbles: true }));

    expect(input.value).toBe("abc");
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it("hud-modal-shell dispatches close from the shared close button", async () => {
    const modal = document.createElement("hud-modal-shell") as HTMLElement & {
      open: boolean;
      updateComplete: Promise<boolean>;
    };
    modal.open = true;
    const spy = vi.fn();
    modal.addEventListener("close", spy);

    document.body.append(modal);
    await modal.updateComplete;

    const closeButton = modal.shadowRoot?.querySelector("hud-icon-button");
    expect(closeButton).toBeDefined();

    closeButton!.dispatchEvent(
      new MouseEvent("click", { bubbles: true, composed: true }),
    );

    expect(spy).toHaveBeenCalledTimes(1);
  });

  it("o-button composes through the shared button primitive", async () => {
    const button = document.createElement("o-button") as HTMLElement & {
      title: string;
      variant: string;
      updateComplete: Promise<boolean>;
    };
    button.title = "Start";
    button.variant = "primary";

    document.body.append(button);
    await button.updateComplete;

    const sharedButton = button.querySelector("hud-button");
    expect(sharedButton).toBeDefined();
    expect(sharedButton?.getAttribute("variant")).toBe("active");
    expect(sharedButton?.textContent?.trim()).toBe("Start");
  });

  it("o-modal preserves open, shared close control, and body scroll lifecycle", async () => {
    const modal = document.createElement("o-modal") as OModal;
    modal.hideCloseButton = false;
    const onClose = vi.fn();
    modal.onClose = onClose;

    document.body.append(modal);
    modal.open();
    await modal.updateComplete;

    expect(modal.isModalOpen).toBe(true);
    expect(document.body.style.overflow).toBe("hidden");

    const closeButton = modal.shadowRoot?.querySelector("hud-icon-button");
    expect(closeButton).toBeDefined();
    closeButton!.dispatchEvent(
      new MouseEvent("click", { bubbles: true, composed: true }),
    );
    await modal.updateComplete;

    expect(modal.isModalOpen).toBe(false);
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(document.body.style.overflow).toBe("");
  });

  it("settings controls compose shared primitives without changing event contracts", async () => {
    const slider = document.createElement("setting-slider") as HTMLElement & {
      value: number;
      updateComplete: Promise<boolean>;
    };
    const select = document.createElement("setting-select") as HTMLElement & {
      options: Array<{ value: number | string; label: string }>;
      value: string;
      updateComplete: Promise<boolean>;
    };
    const number = document.createElement("setting-number") as HTMLElement & {
      value: number;
      updateComplete: Promise<boolean>;
    };
    const toggle = document.createElement("setting-toggle") as HTMLElement & {
      checked: boolean;
      updateComplete: Promise<boolean>;
    };
    slider.value = 25;
    select.options = [
      { value: 1, label: "1%" },
      { value: 5, label: "5%" },
    ];
    select.value = "1";
    number.value = 10;
    toggle.checked = false;

    const sliderChange = vi.fn();
    const selectChange = vi.fn();
    const numberChange = vi.fn();
    const toggleChange = vi.fn();
    slider.addEventListener("change", sliderChange);
    select.addEventListener("change", selectChange);
    number.addEventListener("change", numberChange);
    toggle.addEventListener("change", toggleChange);

    document.body.append(slider, select, number, toggle);
    await Promise.all([
      slider.updateComplete,
      select.updateComplete,
      number.updateComplete,
      toggle.updateComplete,
    ]);

    const sharedSlider = slider.querySelector("hud-range") as HTMLElement & {
      value: number;
    };
    sharedSlider.value = 55;
    sharedSlider.dispatchEvent(new Event("input", { bubbles: true }));
    expect(sliderChange).toHaveBeenCalledWith(
      expect.objectContaining({ detail: { value: 55 } }),
    );

    const sharedSelect = select.querySelector("hud-select") as HTMLElement & {
      value: string;
    };
    sharedSelect.value = "5";
    sharedSelect.dispatchEvent(new Event("change", { bubbles: true }));
    expect(selectChange).toHaveBeenCalledTimes(1);
    expect(selectChange).toHaveBeenCalledWith(
      expect.objectContaining({ detail: { value: 5 } }),
    );

    const sharedNumber = number.querySelector("hud-input") as HTMLElement & {
      value: string;
    };
    sharedNumber.value = "42";
    sharedNumber.dispatchEvent(new Event("input", { bubbles: true }));
    expect(numberChange).toHaveBeenCalledWith(
      expect.objectContaining({ detail: { value: 42 } }),
    );

    const sharedToggle = toggle.querySelector("hud-toggle") as HTMLElement & {
      checked: boolean;
    };
    sharedToggle.checked = true;
    sharedToggle.dispatchEvent(new Event("change", { bubbles: true }));
    expect(toggle.checked).toBe(true);
    expect(toggleChange).toHaveBeenCalledTimes(1);
  });
});

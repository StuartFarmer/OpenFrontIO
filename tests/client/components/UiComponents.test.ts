import { afterEach, describe, expect, it, vi } from "vitest";
import "../../../src/client/components/baseComponents/Button";
import { OModal } from "../../../src/client/components/baseComponents/Modal";
import "../../../src/client/components/ui";

const sharedTags = [
  "ui-surface",
  "ui-surface-header",
  "ui-surface-body",
  "ui-surface-footer",
  "ui-button",
  "ui-icon-button",
  "ui-action-group",
  "ui-pill",
  "ui-label",
  "ui-alert",
  "ui-form-row",
  "ui-input",
  "ui-textarea",
  "ui-select",
  "ui-range",
  "ui-toggle",
  "ui-checkbox",
  "ui-stat-grid",
  "ui-stat",
  "ui-table",
  "ui-table-row",
  "ui-table-cell",
  "ui-list-row",
  "ui-empty-state",
  "ui-loading-state",
  "ui-modal-shell",
  "ui-modal-header",
  "ui-modal-body",
  "ui-modal-footer",
  "ui-menu",
  "ui-menu-item",
  "ui-divider",
  "ui-row",
  "ui-stack",
  "ui-grid",
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

  it("ui-button reflects disabled state to the internal button", async () => {
    const button = document.createElement("ui-button") as HTMLElement & {
      disabled: boolean;
      updateComplete: Promise<boolean>;
    };
    button.setAttribute("label", "Save");
    button.disabled = true;

    document.body.append(button);
    await button.updateComplete;

    const internal = button.shadowRoot?.querySelector("button");
    expect(internal?.disabled).toBe(true);
    expect(internal?.textContent?.trim()).toBe("Save");
  });

  it("ui-input emits composed input events and updates value", async () => {
    const input = document.createElement("ui-input") as HTMLElement & {
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

  it("ui-modal-shell dispatches close from the shared close button", async () => {
    const modal = document.createElement("ui-modal-shell") as HTMLElement & {
      open: boolean;
      updateComplete: Promise<boolean>;
    };
    modal.open = true;
    const spy = vi.fn();
    modal.addEventListener("close", spy);

    document.body.append(modal);
    await modal.updateComplete;

    const closeButton = modal.shadowRoot?.querySelector("ui-icon-button");
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

    const sharedButton = button.querySelector("ui-button");
    expect(sharedButton).toBeDefined();
    expect(sharedButton?.getAttribute("variant")).toBe("primary");
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

    const closeButton = modal.shadowRoot?.querySelector("ui-icon-button");
    expect(closeButton).toBeDefined();
    closeButton!.dispatchEvent(
      new MouseEvent("click", { bubbles: true, composed: true }),
    );
    await modal.updateComplete;

    expect(modal.isModalOpen).toBe(false);
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(document.body.style.overflow).toBe("");
  });
});

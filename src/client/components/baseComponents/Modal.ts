import { LitElement, html } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import "../../hud/ui";

export type OModalTab = { key: string; label: string };

// Compatibility shell for the former legacy modal tag. New modal code should
// use HUD modal primitives directly.
@customElement("o-modal")
export class OModal extends LitElement {
  @state() public isModalOpen = false;

  static openCount = 0;

  @property({ type: Boolean })
  public inline = false;

  @property({ type: Boolean })
  public alwaysMaximized = false;

  @property({ type: Boolean })
  public hideCloseButton = false;

  @property({ type: String })
  public title = "";

  @property({ type: Boolean })
  public hideHeader = false;

  @property({ type: String })
  public maxWidth = "";

  @property({ type: Array })
  public tabs: OModalTab[] = [];

  @property({ type: String })
  public activeTab = "";

  @property({ attribute: false })
  public onTabChange?: (key: string) => void;

  public onClose?: () => void;

  public open() {
    if (!this.isModalOpen) {
      if (!this.inline) {
        OModal.openCount = OModal.openCount + 1;
        if (OModal.openCount === 1) document.body.style.overflow = "hidden";
      }
      this.isModalOpen = true;
    }
  }

  public close() {
    if (this.isModalOpen) {
      this.isModalOpen = false;
      this.onClose?.();
      if (!this.inline) {
        OModal.openCount = Math.max(0, OModal.openCount - 1);
        if (OModal.openCount === 0) document.body.style.overflow = "";
      }
    }
  }

  disconnectedCallback() {
    // Ensure global counter is decremented if this modal is removed while open.
    if (this.isModalOpen && !this.inline) {
      OModal.openCount = Math.max(0, OModal.openCount - 1);
      if (OModal.openCount === 0) document.body.style.overflow = "";
    }
    super.disconnectedCallback();
  }

  private handleTabClick(key: string) {
    this.onTabChange?.(key);
  }

  private renderTabs() {
    return html`
      <hud-tabs
        .items=${this.tabs.map((tab) => ({ id: tab.key, label: tab.label }))}
        .selected=${this.activeTab}
        @selection-change=${(event: CustomEvent<{ id: string }>) =>
          this.handleTabClick(event.detail.id)}
      ></hud-tabs>
    `;
  }

  render() {
    const shouldRender = this.isModalOpen || this.inline;
    if (!shouldRender) {
      return html``;
    }

    const hasTabs = this.tabs.length > 0;
    const shellStyle = this.alwaysMaximized
      ? "--hud-modal-max-height: calc(100vh - 2rem);"
      : "";

    return html`
      <hud-modal-shell
        ?open=${this.isModalOpen}
        ?inline=${this.inline}
        ?hideCloseButton=${this.hideCloseButton}
        label=${this.title}
        maxWidth=${this.maxWidth || "900px"}
        style=${shellStyle}
        @dismiss=${() => this.close()}
      >
        ${!this.hideHeader && this.title
          ? html`<hud-modal-header>
              <hud-label>${this.title}</hud-label>
            </hud-modal-header>`
          : html``}
        <slot name="header"></slot>
        ${hasTabs ? this.renderTabs() : html``}
        <hud-modal-body
          style="flex: 1; min-height: 0; overflow: auto; --hud-surface-body-padding: 0;"
        >
          <slot></slot>
        </hud-modal-body>
      </hud-modal-shell>
    `;
  }
}

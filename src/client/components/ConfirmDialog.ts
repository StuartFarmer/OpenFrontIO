import { html, LitElement, render as litRender } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { translateText } from "../Utils";
import "../hud/ui";

/**
 * A reusable inline confirmation dialog.
 *
 * Usage:
 * ```html
 * <confirm-dialog
 *   .message=${"Are you sure?"}
 *   variant="danger"
 *   @confirm=${() => doThing()}
 *   @cancel=${() => {}}
 * ></confirm-dialog>
 * ```
 *
 * For ban-style flows, add a textarea:
 * ```html
 * <confirm-dialog
 *   .message=${"Ban this player?"}
 *   variant="warning"
 *   textareaPlaceholder="Reason (optional)"
 *   @confirm=${(e) => ban(e.detail.text)}
 *   @cancel=${() => {}}
 * ></confirm-dialog>
 * ```
 */
@customElement("confirm-dialog")
export class ConfirmDialog extends LitElement {
  @property() message = "";
  @property() variant: "danger" | "warning" = "danger";
  @property() textareaPlaceholder = "";
  @property({ type: Boolean }) disabled = false;

  @state() private text = "";

  private portal: HTMLDivElement | null = null;

  createRenderRoot() {
    return this;
  }

  connectedCallback() {
    super.connectedCallback();
    this.portal = document.createElement("div");
    document.body.appendChild(this.portal);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    if (this.portal) {
      litRender(html``, this.portal);
      this.portal.remove();
      this.portal = null;
    }
  }

  render() {
    if (this.portal) {
      litRender(this.renderOverlay(), this.portal);
    }
    return html``;
  }

  private renderOverlay() {
    const isDanger = this.variant === "danger";

    return html`
      <hud-modal-shell
        .open=${true}
        maxWidth="24rem"
        label=${translateText("common.confirm")}
        @dismiss=${() => this.handleCancel()}
        style="--hud-modal-z-index: 9999"
      >
        <hud-modal-body style="--hud-surface-body-padding: 14px">
          <hud-alert tone=${isDanger ? "danger" : "warning"}>
            ${this.message}
          </hud-alert>
          ${this.textareaPlaceholder
            ? html`<hud-textarea
                .value=${this.text}
                @input=${(e: Event) =>
                  (this.text = (
                    e.currentTarget as HTMLElement & { value: string }
                  ).value)}
                rows=${2}
                placeholder="${this.textareaPlaceholder}"
                style="margin-top: 10px; --hud-textarea-min-height: 64px"
              ></hud-textarea>`
            : ""}
        </hud-modal-body>
        <hud-modal-footer>
          <hud-button
            @click=${() => this.handleCancel()}
            ?disabled=${this.disabled}
          >
            ${translateText("common.cancel")}
          </hud-button>
          <hud-button
            variant=${isDanger ? "danger" : "active"}
            @click=${() => this.handleConfirm()}
            ?disabled=${this.disabled}
          >
            ${translateText("common.confirm")}
          </hud-button>
        </hud-modal-footer>
      </hud-modal-shell>
    `;
  }

  private handleConfirm() {
    this.dispatchEvent(
      new CustomEvent("confirm", { detail: { text: this.text } }),
    );
    this.text = "";
  }

  private handleCancel() {
    this.dispatchEvent(new CustomEvent("cancel"));
    this.text = "";
  }
}

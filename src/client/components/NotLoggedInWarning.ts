import { LitElement, html } from "lit";
import { customElement, state } from "lit/decorators.js";
import { UserMeResponse } from "../../core/ApiSchemas";
import { hasLinkedAccount } from "../Api";
import "../hud/ui";

@customElement("not-logged-in-warning")
export class NotLoggedInWarning extends LitElement {
  @state() private linked = false;

  private _onUserMe = (event: CustomEvent<UserMeResponse | false>) => {
    this.linked = hasLinkedAccount(event.detail);
  };

  createRenderRoot() {
    return this;
  }

  connectedCallback() {
    super.connectedCallback();
    document.addEventListener(
      "userMeResponse",
      this._onUserMe as EventListener,
    );
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    document.removeEventListener(
      "userMeResponse",
      this._onUserMe as EventListener,
    );
  }

  render() {
    if (this.linked) return html``;

    return html`<div class="no-crazygames flex items-center">
      <hud-button
        variant="danger"
        style="--hud-button-min-height: 32px; --hud-button-radius: 8px; --hud-button-padding: 8px 14px;"
        data-i18n="common.not_logged_in"
        @click=${() => {
          window.showPage?.("page-account");
        }}
      >
        Not logged in
      </hud-button>
    </div>`;
  }
}

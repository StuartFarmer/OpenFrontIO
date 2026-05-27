import { LitElement, html } from "lit";
import { customElement, state } from "lit/decorators.js";
import "./components/ui";
import { translateText } from "./Utils";

@customElement("game-starting-modal")
export class GameStartingModal extends LitElement {
  @state()
  isVisible = false;

  createRenderRoot() {
    return this;
  }

  render() {
    return html`
      <ui-modal-shell
        ?open=${this.isVisible}
        hideCloseButton
        maxWidth="400px"
        label=${translateText("game_starting_modal.title")}
        style="--ui-modal-z-index: 9999;"
      >
        <ui-modal-body style="--ui-modal-body-padding: 1.5rem;">
          <div class="text-center">
            <div
              class="text-base font-medium tracking-wider uppercase text-white/40 mb-3"
            >
              © OpenFront and Contributors
            </div>
            <a
              href="https://github.com/openfrontio/OpenFrontIO/blob/main/CREDITS.md"
              target="_blank"
              rel="noopener noreferrer"
              class="block mb-4 text-lg font-medium tracking-wider uppercase text-malibu-blue no-underline transition-colors duration-200 hover:text-aquarius"
              >${translateText("game_starting_modal.credits")}</a
            >
            <p class="text-base text-white/40 mb-4">
              ${translateText("game_starting_modal.code_license")}
            </p>
            <ui-alert>
              <span class="text-xl font-medium tracking-wider text-white">
                ${translateText("game_starting_modal.title")}
              </span>
            </ui-alert>
          </div>
        </ui-modal-body>
      </ui-modal-shell>
    `;
  }

  show() {
    this.isVisible = true;
    this.requestUpdate();
  }

  hide() {
    this.isVisible = false;
    this.requestUpdate();
  }
}

import { html, LitElement } from "lit";
import { customElement } from "lit/decorators.js";
import { assetUrl } from "../../core/AssetUrls";

@customElement("mobile-nav-bar")
export class MobileNavBar extends LitElement {
  createRenderRoot() {
    return this;
  }

  render() {
    return html`
      <div
        class="flex-1 w-full flex flex-col justify-start overflow-y-auto pt-4 pb-4 px-5 gap-4"
      >
        <div class="flex flex-col text-malibu-blue mb-4">
          <div class="flex flex-col items-center gap-1">
            <img
              src=${assetUrl("images/OpenFrontLogo.svg")}
              alt="OpenFront"
              class="w-auto h-auto max-w-[220px] max-h-[4.5rem]"
            />
            <div
              id="game-version"
              class="l-header__highlightText text-center"
            ></div>
          </div>
        </div>
        <button
          class="nav-menu-item active block w-full text-left font-bold uppercase tracking-[0.05em] text-blue-600 transition-all duration-200 cursor-pointer text-[clamp(18px,2.8vh,32px)] py-[clamp(0.2rem,0.8vh,0.75rem)]"
          data-page="page-play"
          data-i18n="main.play"
        ></button>
      </div>
    `;
  }
}

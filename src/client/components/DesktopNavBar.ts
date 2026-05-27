import { LitElement, html } from "lit";
import { customElement } from "lit/decorators.js";
import { assetUrl } from "../../core/AssetUrls";

@customElement("desktop-nav-bar")
export class DesktopNavBar extends LitElement {
  createRenderRoot() {
    return this;
  }

  render() {
    return html`
      <nav
        class="hidden lg:flex w-full bg-zinc-900/90 backdrop-blur-md items-center justify-center py-4 shrink-0 z-50 relative"
      >
        <div class="flex flex-col items-center justify-center">
          <div class="h-8">
            <img
              class="block h-full aspect-[1364/259]"
              src=${assetUrl("images/OpenFrontLogo.svg")}
              alt="OpenFront"
            />
          </div>
          <div
            id="game-version"
            class="l-header__highlightText text-center"
          ></div>
        </div>
      </nav>
    `;
  }
}

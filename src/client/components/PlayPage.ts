import { LitElement, html } from "lit";
import { customElement } from "lit/decorators.js";
import { assetUrl } from "../../core/AssetUrls";
import "../hud/ui";

@customElement("play-page")
export class PlayPage extends LitElement {
  createRenderRoot() {
    return this;
  }

  render() {
    return html`
      <div
        id="page-play"
        class="flex flex-col gap-2 w-full h-full px-0 lg:px-4 min-h-0"
      >
        <!-- Mobile: Fixed top bar -->
        <div
          class="lg:hidden fixed left-0 right-0 top-0 z-40 pt-[env(safe-area-inset-top)] bg-surface border-b border-white/10"
        >
          <div class="flex items-center justify-center h-14 px-2">
            <div
              class="flex items-center justify-center text-malibu-blue min-w-0"
            >
              <img
                src=${assetUrl("images/OpenFrontLogo.svg")}
                alt="OpenFront"
                class="h-full w-auto"
              />
            </div>
          </div>
        </div>

        <div
          class="w-full pb-4 lg:pb-0 flex flex-col gap-4 sm:-mx-4 sm:w-[calc(100%+2rem)] lg:mx-0 lg:w-full lg:grid lg:grid-cols-[2fr_1fr] lg:gap-4"
        >
          <!-- Mobile: spacer for fixed top bar -->
          <div
            class="lg:hidden h-[calc(env(safe-area-inset-top)+56px)] lg:col-span-2 -mb-4"
          ></div>

          <!-- Username -->
          <hud-surface
            class="block overflow-visible lg:col-span-2 lg:mx-auto lg:w-full lg:max-w-3xl lg:relative lg:z-20"
            style="--hud-radius: 12px; --hud-surface-shadow: none; --hud-surface-bg: rgba(15, 23, 42, 0.72); --hud-surface-border: rgba(255, 255, 255, 0.1);"
          >
            <hud-surface-body
              style="--hud-surface-body-padding: 0.5rem; display: block;"
            >
              <div class="flex items-center gap-2 min-w-0 w-full lg:h-[50px]">
                <username-input
                  class="flex-1 min-w-0 h-10 lg:h-[50px]"
                ></username-input>
              </div>
            </hud-surface-body>
          </hud-surface>
        </div>

        <game-mode-selector class="block w-full"></game-mode-selector>
      </div>
    `;
  }
}

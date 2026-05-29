import { LitElement, html } from "lit";
import { customElement } from "lit/decorators.js";
import { assetUrl } from "../../core/AssetUrls";
import "../hud/ui";
import "./NewsBox";

@customElement("play-page")
export class PlayPage extends LitElement {
  createRenderRoot() {
    return this;
  }

  render() {
    return html`
      <hud-stack
        id="page-play"
        class="flex flex-col gap-2 w-full px-0 lg:px-4 min-h-0"
        style="--hud-stack-gap: 0.5rem;"
      >
        <token-login class="absolute"></token-login>

        <!-- Mobile: Fixed top bar -->
        <hud-toolbar
          class="lg:hidden fixed left-0 right-0 top-0 z-40 border-b border-white/10"
          style="width: 100%; min-height: calc(env(safe-area-inset-top) + 3.5rem); justify-content: center; --hud-toolbar-padding: env(safe-area-inset-top) 0 0; --hud-toolbar-gap: 0; --hud-radius: 0; background: rgba(15, 23, 42, 0.88);"
        >
          <div
            class="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center h-14 px-2 gap-2 w-full"
          >
            <button
              id="hamburger-btn"
              class="col-start-1 justify-self-start h-10 shrink-0 aspect-[4/3] flex text-white/90 rounded-md items-center justify-center transition-colors"
              data-i18n-aria-label="main.menu"
              aria-expanded="false"
              aria-controls="sidebar-menu"
              aria-haspopup="dialog"
              data-i18n-title="main.menu"
            >
              <span class="text-2xl leading-none" aria-hidden="true">☰</span>
            </button>

            <div
              class="col-start-2 flex items-center justify-center text-malibu-blue min-w-0 h-full"
            >
              <img
                src=${assetUrl("images/OpenFrontLogo.svg")}
                alt="OpenFront"
                class="h-full w-auto"
              />
            </div>

            <div
              aria-hidden="true"
              class="col-start-3 justify-self-end h-10 shrink-0 aspect-[4/3]"
            ></div>
          </div>
        </hud-toolbar>

        <div
          class="w-full pb-4 lg:pb-0 flex flex-col gap-4 sm:-mx-4 sm:w-[calc(100%+2rem)] lg:mx-0 lg:w-full lg:grid lg:grid-cols-[2fr_1fr] lg:gap-4"
        >
          <!-- Mobile: spacer for fixed top bar -->
          <div
            class="lg:hidden h-[calc(env(safe-area-inset-top)+56px)] lg:col-span-2 -mb-4"
          ></div>

          <news-box class="lg:col-span-2"></news-box>

          <!-- Username: left col -->
          <hud-surface
            class="block overflow-visible lg:relative lg:z-20"
            style="--hud-radius: 12px; --hud-surface-shadow: none; --hud-surface-bg: rgba(15, 23, 42, 0.72); --hud-surface-border: rgba(255, 255, 255, 0.1);"
          >
            <hud-surface-body
              style="--hud-surface-body-padding: 0.5rem; display: block;"
            >
              <div class="flex items-center gap-2 min-w-0 w-full lg:h-[50px]">
                <username-input
                  class="flex-1 min-w-0 h-10 lg:h-[50px]"
                ></username-input>
                <pattern-input
                  id="pattern-input-mobile"
                  show-select-label
                  adaptive-size
                  class="shrink-0 lg:hidden"
                ></pattern-input>
                <flag-input
                  id="flag-input-mobile"
                  show-select-label
                  class="shrink-0 lg:hidden h-10 w-10"
                ></flag-input>
              </div>
            </hud-surface-body>
          </hud-surface>

          <!-- Skin + flag: right col -->
          <hud-row class="hidden lg:flex h-[60px] gap-2">
            <pattern-input
              id="pattern-input-desktop"
              show-select-label
              class="flex-1 h-full"
            ></pattern-input>
            <flag-input
              id="flag-input-desktop"
              show-select-label
              class="flex-1 h-full"
            ></flag-input>
          </hud-row>
        </div>

        <game-mode-selector class="block w-full"></game-mode-selector>
      </hud-stack>
    `;
  }
}

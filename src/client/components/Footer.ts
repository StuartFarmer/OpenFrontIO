import { LitElement, html } from "lit";
import { customElement } from "lit/decorators.js";
import { assetUrl } from "../../core/AssetUrls";
import "../hud/ui";

@customElement("page-footer")
export class Footer extends LitElement {
  createRenderRoot() {
    return this;
  }

  render() {
    return html`
      <footer class="[.in-game_&]:hidden w-full shrink-0 relative z-50">
        <hud-surface
          class="block w-full backdrop-blur-md"
          style="--hud-radius: 0;"
        >
          <hud-surface-body
            class="block text-white/50"
            style="--hud-surface-body-padding: 0.25rem 0 0.75rem;"
          >
            <hud-row
              class="w-full relative pt-2"
              justify="center"
              style="--hud-row-gap: clamp(1rem, 3vw, 1.5rem);"
            >
              <a
                href="https://github.com/openfrontio/OpenFrontIO"
                target="_blank"
                rel="noopener noreferrer"
                class="opacity-60 hover:opacity-100 hover:scale-110 transition-all"
              >
                <hud-icon
                  size="lg"
                  tone="inherit"
                  src=${assetUrl("icons/github-mark-white.svg")}
                  label="GitHub"
                  data-i18n-label="main.github"
                ></hud-icon>
              </a>
              <a
                href="https://www.reddit.com/r/OpenFront/"
                target="_blank"
                rel="noopener noreferrer"
                class="opacity-60 hover:opacity-100 hover:scale-110 transition-all"
              >
                <hud-icon
                  size="lg"
                  tone="inherit"
                  src=${assetUrl("icons/reddit.svg")}
                  label="Reddit"
                ></hud-icon>
              </a>
              <a
                href="https://discord.gg/openfront"
                target="_blank"
                rel="noopener noreferrer"
                class="opacity-60 hover:opacity-100 hover:scale-110 transition-all"
              >
                <hud-icon
                  size="lg"
                  tone="inherit"
                  src=${assetUrl("icons/discord.svg")}
                  label="Discord"
                ></hud-icon>
              </a>
              <a
                href="https://openfront.wiki/Main_Page"
                target="_blank"
                rel="noopener noreferrer"
                class="opacity-60 hover:opacity-100 hover:scale-110 transition-all"
              >
                <img
                  src=${assetUrl("icons/wiki-logo.svg")}
                  data-i18n-alt="main.wiki"
                  class="h-6 w-6 lg:h-7 lg:w-7 object-contain pointer-events-none"
                  draggable="false"
                />
              </a>
              <lang-selector
                class="absolute right-4 top-0 sm:top-[10px]"
              ></lang-selector>
            </hud-row>
            <hud-row
              class="text-xs mt-1 lg:mt-2 px-4"
              justify="center"
              wrap
              style="--hud-row-gap: 1rem;"
            >
              <a
                href="/terms-of-service.html"
                data-i18n="main.terms_of_service"
                target="_blank"
                class="hover:text-white transition-colors"
              ></a>
              <span data-i18n="main.copyright"></span>
              <a
                href="/privacy-policy.html"
                data-i18n="main.privacy_policy"
                target="_blank"
                class="hover:text-white transition-colors"
              ></a>
            </hud-row>
          </hud-surface-body>
        </hud-surface>
      </footer>
    `;
  }
}

import { html, LitElement, type TemplateResult } from "lit";
import { customElement } from "lit/decorators.js";
import { assetUrl } from "../../core/AssetUrls";
import "../hud/ui";
import { NavNotificationsController } from "./NavNotificationsController";

@customElement("mobile-nav-bar")
export class MobileNavBar extends LitElement {
  private _notifications = new NavNotificationsController(this);

  createRenderRoot() {
    return this;
  }

  connectedCallback() {
    super.connectedCallback();
    window.addEventListener("showPage", this._onShowPage);

    const current = window.currentPageId;
    if (current) {
      this.updateComplete.then(() => {
        this._updateActiveState(current);
      });
    }
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    window.removeEventListener("showPage", this._onShowPage);
  }

  private _onShowPage = (e: Event) => {
    this._updateActiveState((e as CustomEvent).detail);
  };

  private _updateActiveState(pageId: string) {
    this.querySelectorAll(".nav-menu-item").forEach((el) => {
      el.classList.toggle(
        "active",
        (el as HTMLElement).dataset.page === pageId,
      );
    });
  }

  private renderDot(color: "red" | "yellow"): TemplateResult {
    const dot = color === "red" ? "bg-red-500" : "bg-yellow-400";
    return html`
      <span class="relative ml-2 shrink-0 -mt-2 w-2 h-2">
        <span class="absolute inset-0 ${dot} rounded-full animate-ping"></span>
        <span class="absolute inset-0 ${dot} rounded-full"></span>
      </span>
    `;
  }

  private renderNavButton(
    pageId: string,
    i18nKey: string,
    options: {
      class?: string;
      click?: (event: Event) => void;
      dot?: TemplateResult | "";
    } = {},
  ) {
    const active = window.currentPageId === pageId;

    return html`
      <hud-button
        class="nav-menu-item ${active ? "active" : ""} ${options.class ?? ""} block w-full text-left font-bold uppercase tracking-[0.05em] transition-all duration-200 cursor-pointer text-[clamp(18px,2.8vh,32px)] py-[clamp(0.2rem,0.8vh,0.75rem)] [&.active]:text-blue-500 [&.active]:translate-x-2.5"
        data-page=${pageId}
        data-i18n=${i18nKey}
        @click=${options.click}
        style="--hud-button-host-width: 100%; --hud-button-width: 100%; --hud-button-padding: 0; --hud-button-background: transparent; --hud-button-hover-background: transparent; --hud-button-border-color: transparent; --hud-button-color: rgba(255,255,255,0.72); --hud-button-hover-color: rgb(59, 130, 246); --hud-button-justify-content: flex-start;"
      >
        ${options.dot ?? ""}
      </hud-button>
    `;
  }

  render() {
    window.currentPageId ??= "page-play";

    return html`
      <hud-safe-area
        class="flex-1 w-full overflow-y-auto pt-4 pb-4 px-5"
        style="display: flex; min-height: 0;"
      >
        <hud-stack
          class="w-full"
          density="loose"
          style="align-content: start;"
        >
          <hud-stack class="text-malibu-blue mb-4" density="compact">
            <img
              src=${assetUrl("images/OpenFrontLogo.svg")}
              alt="OpenFront"
              class="w-auto h-auto max-w-[220px] max-h-[4.5rem] mx-auto"
            />
            <hud-label>
              <div
                id="game-version"
                class="l-header__highlightText text-center"
              ></div>
            </hud-label>
          </hud-stack>

          ${this.renderNavButton("page-play", "main.play")}
          ${this.renderNavButton("page-news", "main.news", {
            click: this._notifications.onNewsClick,
            dot: this._notifications.showNewsDot()
              ? this.renderDot("red")
              : "",
          })}
          ${this.renderNavButton("page-leaderboard", "main.leaderboard")}
          ${this.renderNavButton("page-clan", "main.clans")}
          ${this.renderNavButton("page-item-store", "main.store", {
            class: "no-crazygames",
            click: this._notifications.onStoreClick,
            dot: this._notifications.showStoreDot()
              ? this.renderDot("red")
              : "",
          })}
          ${this.renderNavButton("page-settings", "main.settings")}
          ${this.renderNavButton("page-account", "main.account", {
            class: "no-crazygames",
          })}
          ${this.renderNavButton("page-help", "main.help", {
            click: this._notifications.onHelpClick,
            dot: this._notifications.showHelpDot()
              ? this.renderDot("yellow")
              : "",
          })}
        </hud-stack>
      </hud-safe-area>
    `;
  }
}

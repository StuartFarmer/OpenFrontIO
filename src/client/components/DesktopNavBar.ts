import { LitElement, html, type TemplateResult } from "lit";
import { customElement } from "lit/decorators.js";
import { assetUrl } from "../../core/AssetUrls";
import "../hud/ui";
import { NavNotificationsController } from "./NavNotificationsController";

@customElement("desktop-nav-bar")
export class DesktopNavBar extends LitElement {
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
      <span class="absolute -top-1 -right-1 w-2 h-2 ${dot} rounded-full animate-ping"></span>
      <span class="absolute -top-1 -right-1 w-2 h-2 ${dot} rounded-full"></span>
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
      <span class="relative ${options.class ?? ""}">
        <hud-button
          class="nav-menu-item ${active ? "active" : ""} font-medium uppercase tracking-[0.05em] transition-colors [&.active]:text-malibu-blue"
          data-page=${pageId}
          data-i18n=${i18nKey}
          @click=${options.click}
          style="--hud-button-background: transparent; --hud-button-hover-background: transparent; --hud-button-border-color: transparent; --hud-button-padding: 0.35rem 0.45rem; --hud-button-color: rgba(255,255,255,0.72); --hud-button-hover-color: rgb(56, 189, 248);"
        ></hud-button>
        ${options.dot ?? ""}
      </span>
    `;
  }

  render() {
    window.currentPageId ??= "page-play";

    return html`
      <nav class="hidden lg:block w-full shrink-0 z-50 relative">
        <hud-toolbar
          class="backdrop-blur-md"
          style="width: 100%; min-height: 4.25rem; justify-content: center; --hud-toolbar-padding: 1rem; --hud-toolbar-gap: 1.4rem; --hud-radius: 0; background: rgba(24, 24, 27, 0.9);"
        >
          <hud-stack
            class="items-center justify-center"
            density="compact"
            style="justify-items: center;"
          >
            <div class="h-8">
              <img
                class="block h-full aspect-[1364/259]"
                src=${assetUrl("images/OpenFrontLogo.svg")}
                alt="OpenFront"
              />
            </div>
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
          ${this.renderNavButton("page-item-store", "main.store", {
            class: "no-crazygames",
            click: this._notifications.onStoreClick,
            dot: this._notifications.showStoreDot()
              ? this.renderDot("red")
              : "",
          })}
          ${this.renderNavButton("page-settings", "main.settings")}
          ${this.renderNavButton("page-leaderboard", "main.leaderboard")}
          ${this.renderNavButton("page-clan", "main.clans")}
          ${this.renderNavButton("page-help", "main.help", {
            click: this._notifications.onHelpClick,
            dot: this._notifications.showHelpDot()
              ? this.renderDot("yellow")
              : "",
          })}

          <hud-button
            id="nav-account-button"
            class="no-crazygames nav-menu-item relative overflow-hidden [&.active]:text-white"
            data-page="page-account"
            data-i18n-aria-label="main.account"
            data-i18n-title="main.account"
            style="--hud-button-height: 2.5rem; --hud-button-padding: 0.25rem 0.75rem; --hud-button-radius: 9999px; --hud-button-background: transparent; --hud-button-hover-background: rgba(255,255,255,0.08); --hud-button-border-color: rgba(255,255,255,0.2); --hud-button-color: rgba(255,255,255,0.8);"
          >
            <img
              id="nav-account-avatar"
              class="no-crazygames hidden w-8 h-8 rounded-full object-cover"
              alt=""
              data-i18n-alt="main.discord_avatar_alt"
              referrerpolicy="no-referrer"
            />
            <hud-mask-icon
              id="nav-account-person-icon"
              src="/images/ProfileIcon.svg"
              size="h-5 w-5"
            ></hud-mask-icon>
            <span
              id="nav-account-email-badge"
              class="hidden absolute bottom-1 right-1 w-4 h-4 rounded-full bg-slate-900/80 border border-white/20 items-center justify-center"
              aria-hidden="true"
            >
              <hud-mask-icon src="/images/EmailIcon.svg" size="h-3 w-3"></hud-mask-icon>
            </span>
            <span
              id="nav-account-signin-text"
              class="text-xs font-bold tracking-widest"
              data-i18n="main.sign_in"
            ></span>
          </hud-button>
        </hud-toolbar>
      </nav>
    `;
  }
}

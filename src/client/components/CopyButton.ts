import { LitElement, html } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { Copy, Eye, EyeOff } from "lucide";
import { ClientEnv } from "src/client/ClientEnv";
import { UserSettings } from "../../core/game/UserSettings";
import { crazyGamesSDK } from "../CrazyGamesSDK";
import "../hud/ui";
import { renderLucideIcon } from "../hud/ui/LucideIcon";
import { copyToClipboard, translateText } from "../Utils";

@customElement("copy-button")
export class CopyButton extends LitElement {
  @property({ type: String, attribute: "lobby-id" }) lobbyId = "";
  @property({ type: String, attribute: "lobby-suffix" }) lobbySuffix = "";
  @property({ type: Boolean, attribute: "include-lobby-query" })
  includeLobbyQuery = false;
  @property({ type: String, attribute: "copy-text" }) copyText = "";
  @property({ type: String, attribute: "display-text" }) displayText = "";
  @property({ type: Boolean, attribute: "show-visibility-toggle" })
  showVisibilityToggle = true;
  @property({ type: Boolean, attribute: "show-copy-icon" })
  showCopyIcon = true;
  @property({ type: Boolean }) compact = false;

  @state() private copySuccess = false;
  @state() private lobbyIdVisible = true;

  private userSettings: UserSettings = new UserSettings();
  private maskLabel = html`&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;`;

  createRenderRoot() {
    return this;
  }

  protected willUpdate(
    changedProperties: Map<string | number | symbol, unknown>,
  ) {
    if (changedProperties.has("lobbyId")) {
      this.lobbyIdVisible = this.userSettings.lobbyIdVisibility();
      this.copySuccess = false;
    }
    if (changedProperties.has("copyText")) {
      this.copySuccess = false;
    }
    if (
      changedProperties.has("showVisibilityToggle") ||
      changedProperties.has("compact")
    ) {
      if (!this.showVisibilityToggle || this.compact) {
        this.lobbyIdVisible = true;
      }
    }
  }

  private toggleVisibility() {
    if (!this.showVisibilityToggle || this.compact) return;
    this.lobbyIdVisible = !this.lobbyIdVisible;
  }

  private enableSelectAll(e: Event) {
    (e.currentTarget as HTMLElement).classList.add("select-all");
  }

  private clearSelectAll(e: Event) {
    (e.currentTarget as HTMLElement).classList.remove("select-all");
  }

  private async buildCopyUrl(): Promise<string> {
    let url = `${window.location.origin}/${ClientEnv.workerPath(this.lobbyId)}/game/${this.lobbyId}`;
    if (this.includeLobbyQuery) {
      url += `?lobby&s=${encodeURIComponent(this.lobbySuffix)}`;
    }
    return url;
  }

  private async resolveCopyText(): Promise<string | null> {
    if (this.copyText) return this.copyText;
    if (crazyGamesSDK.isOnCrazyGames()) {
      return crazyGamesSDK.createInviteLink(this.lobbyId);
    }
    if (!this.lobbyId) return "";
    return await this.buildCopyUrl();
  }

  async handleCopy() {
    const text = await this.resolveCopyText();
    if (!text) {
      alert("Error copying game id");
      return;
    }
    await copyToClipboard(
      text,
      () => (this.copySuccess = true),
      () => (this.copySuccess = false),
    );
  }

  private canCopy() {
    return Boolean(this.copyText || this.lobbyId);
  }

  render() {
    const canCopy = this.canCopy();
    const allowMask = this.showVisibilityToggle && !this.compact;
    const rawLabel = this.displayText || this.lobbyId || this.copyText;
    const label = this.copySuccess
      ? translateText("common.copied")
      : allowMask && !this.lobbyIdVisible
        ? this.maskLabel
        : rawLabel;
    const disabledClass = canCopy ? "" : "opacity-60 cursor-not-allowed";
    const toggleDisabled = !this.lobbyId;
    const toggleClass = toggleDisabled ? "opacity-60 cursor-not-allowed" : "";

    if (this.compact) {
      return html`
        <hud-button
          @click=${this.handleCopy}
          class="${disabledClass}"
          style="--hud-button-min-height: 20px; --hud-button-radius: 4px; --hud-button-padding: 2px 8px;"
          title="${translateText("common.click_to_copy")}"
          aria-label="${translateText("common.click_to_copy")}"
          ?disabled=${!canCopy}
        >
          ${label}
        </hud-button>
      `;
    }

    return html`
      <div
        class="flex items-center gap-0.5 bg-white/5 rounded-lg px-2 py-1 border border-white/10 max-w-[220px] flex-nowrap"
      >
        ${this.showVisibilityToggle
          ? html`<hud-icon-button
              @click=${this.toggleVisibility}
              class="${toggleClass}"
              style="--hud-icon-button-size: 28px; --hud-icon-button-radius: 6px;"
              label="${translateText("user_setting.toggle_visibility")}"
              title="${translateText("user_setting.toggle_visibility")}"
              ?disabled=${toggleDisabled}
            >
              ${this.lobbyIdVisible
                ? renderLucideIcon(Eye, "h-4 w-4")
                : renderLucideIcon(EyeOff, "h-4 w-4")}
            </hud-icon-button>`
          : ""}
        <hud-button
          @click=${this.handleCopy}
          @dblclick=${this.enableSelectAll}
          @mouseleave=${this.clearSelectAll}
          class="${disabledClass}"
          style="--hud-button-min-width: 80px; --hud-button-min-height: 28px; --hud-button-radius: 4px; --hud-button-padding: 2px 8px; --hud-button-background: transparent; --hud-button-border-color: transparent;"
          title="${translateText("common.click_to_copy")}"
          aria-label="${translateText("common.click_to_copy")}"
          ?disabled=${!canCopy}
        >
          ${label}
        </hud-button>
        ${this.showCopyIcon
          ? html`<hud-icon-button
              @click=${this.handleCopy}
              class="${disabledClass}"
              style="--hud-icon-button-size: 28px; --hud-icon-button-radius: 6px;"
              label="${translateText("common.click_to_copy")}"
              title="${translateText("common.click_to_copy")}"
              ?disabled=${!canCopy}
            >
              ${renderLucideIcon(Copy, "h-4 w-4")}
            </hud-icon-button>`
          : ""}
      </div>
    `;
  }
}

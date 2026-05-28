import { html, LitElement } from "lit";
import { customElement } from "lit/decorators.js";
import { HostLobbyModal } from "./HostLobbyModal";
import "./hud/ui";
import { JoinLobbyModal } from "./JoinLobbyModal";
import { SinglePlayerModal } from "./SinglePlayerModal";
import { UsernameInput } from "./UsernameInput";
import { translateText } from "./Utils";

@customElement("game-mode-selector")
export class GameModeSelector extends LitElement {
  createRenderRoot() {
    return this;
  }

  public stop() {}

  private validateUsername(): boolean {
    const usernameInput = document.querySelector(
      "username-input",
    ) as UsernameInput | null;
    return usernameInput ? usernameInput.validateOrShowError() : true;
  }

  private openSinglePlayerModal = () => {
    if (!this.validateUsername()) return;
    (
      document.querySelector("single-player-modal") as SinglePlayerModal
    )?.open();
  };

  private openQuickGame = () => {
    if (!this.validateUsername()) return;
    window.location.assign("/quick-game");
  };

  private openHostLobby = () => {
    if (!this.validateUsername()) return;
    (document.querySelector("host-lobby-modal") as HostLobbyModal)?.open();
  };

  private openJoinLobby = () => {
    if (!this.validateUsername()) return;
    (document.querySelector("join-lobby-modal") as JoinLobbyModal)?.open();
  };

  private renderActionButton(
    title: string,
    onClick: () => void,
    variant: "primary" | "secondary" = "secondary",
  ) {
    return html`
      <hud-button
        @click=${onClick}
        variant=${variant}
        width="block"
        label=${title}
        style="--hud-button-min-height: 4rem; --hud-button-radius: 8px; --hud-button-width: 100%;"
      ></hud-button>
    `;
  }

  render() {
    return html`
      <div class="mx-auto flex w-full max-w-3xl flex-col gap-4 px-4 pb-4">
        ${this.renderActionButton("Quick Game", this.openQuickGame, "primary")}
        ${this.renderActionButton(
          translateText("main.solo"),
          this.openSinglePlayerModal,
        )}
        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
          ${this.renderActionButton(
            translateText("main.create"),
            this.openHostLobby,
          )}
          ${this.renderActionButton(
            translateText("main.join"),
            this.openJoinLobby,
          )}
        </div>
      </div>
    `;
  }
}

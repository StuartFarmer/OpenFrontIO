import { html, LitElement } from "lit";
import { customElement } from "lit/decorators.js";
import { HostLobbyModal } from "./HostLobbyModal";
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
    const classes =
      variant === "primary"
        ? "bg-malibu-blue hover:bg-aquarius active:bg-malibu-blue/80"
        : "bg-surface hover:brightness-[1.08] active:brightness-[0.95]";

    return html`
      <button
        @click=${onClick}
        class="flex h-16 w-full items-center justify-center rounded-lg ${classes} px-4 text-center text-sm font-semibold uppercase tracking-wider text-white transition-all duration-200 hover:scale-[1.01] active:scale-[0.99] sm:h-20 sm:text-base"
      >
        ${title}
      </button>
    `;
  }

  render() {
    return html`
      <div class="mx-auto flex w-full max-w-3xl flex-col gap-4 px-4 pb-4">
        ${this.renderActionButton(
          translateText("main.solo"),
          this.openSinglePlayerModal,
          "primary",
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

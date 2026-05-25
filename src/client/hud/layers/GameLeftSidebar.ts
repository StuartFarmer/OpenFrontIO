import { Colord } from "colord";
import { html, LitElement } from "lit";
import { customElement, state } from "lit/decorators.js";
import { assetUrl } from "../../../core/AssetUrls";
import { EventBus } from "../../../core/EventBus";
import { GameMode, Team } from "../../../core/game/Game";
import { GameView } from "../../../core/game/GameView";
import { Controller } from "../../Controller";
import { Platform } from "../../Platform";
import { getTranslatedPlayerTeamLabel, translateText } from "../../Utils";
import "../ui/HudComponents";
import { ImmunityBarVisibleEvent } from "./ImmunityTimer";
import { SpawnBarVisibleEvent } from "./SpawnTimer";
const leaderboardRegularIcon = assetUrl(
  "images/LeaderboardIconRegularWhite.svg",
);
const leaderboardSolidIcon = assetUrl("images/LeaderboardIconSolidWhite.svg");
const teamRegularIcon = assetUrl("images/TeamIconRegularWhite.svg");
const teamSolidIcon = assetUrl("images/TeamIconSolidWhite.svg");

@customElement("game-left-sidebar")
export class GameLeftSidebar extends LitElement implements Controller {
  @state()
  private isLeaderboardShow = false;
  @state()
  private isTeamLeaderboardShow = false;
  @state()
  private isVisible = false;
  @state()
  private isPlayerTeamLabelVisible = false;
  @state()
  private playerTeam: Team | null = null;
  @state()
  private spawnBarVisible = false;
  @state()
  private immunityBarVisible = false;

  private playerColor: Colord = new Colord("#FFFFFF");
  public game: GameView;
  public eventBus: EventBus;
  private _shownOnInit = false;

  createRenderRoot() {
    return this;
  }

  init() {
    this.isVisible = true;
    this.eventBus.on(SpawnBarVisibleEvent, (e) => {
      this.spawnBarVisible = e.visible;
    });
    this.eventBus.on(ImmunityBarVisibleEvent, (e) => {
      this.immunityBarVisible = e.visible;
    });
    if (this.isTeamGame) {
      this.isPlayerTeamLabelVisible = true;
    }
    // Make it visible by default on large screens
    if (Platform.isDesktopWidth) {
      // lg breakpoint
      this._shownOnInit = true;
    }
    this.requestUpdate();
  }

  tick() {
    if (!this.playerTeam && this.game.myPlayer()?.team()) {
      this.playerTeam = this.game.myPlayer()!.team();
      if (this.playerTeam) {
        this.playerColor = this.game
          .config()
          .theme()
          .teamColor(this.playerTeam);
        this.requestUpdate();
      }
    }

    if (this._shownOnInit && !this.game.inSpawnPhase()) {
      this._shownOnInit = false;
      this.isLeaderboardShow = true;
      this.requestUpdate();
    }

    if (!this.game.inSpawnPhase() && this.isPlayerTeamLabelVisible) {
      this.isPlayerTeamLabelVisible = false;
      this.requestUpdate();
    }
  }

  private get barOffset(): number {
    return (this.spawnBarVisible ? 7 : 0) + (this.immunityBarVisible ? 7 : 0);
  }

  private toggleLeaderboard(): void {
    this.isLeaderboardShow = !this.isLeaderboardShow;
  }

  private toggleTeamLeaderboard(): void {
    this.isTeamLeaderboardShow = !this.isTeamLeaderboardShow;
  }

  private get isTeamGame(): boolean {
    return this.game?.config().gameConfig().gameMode === GameMode.Team;
  }

  private renderToolbarIcon(src: string, label: string) {
    return html`<hud-icon .src=${src} size="md" .label=${label}></hud-icon>`;
  }

  render() {
    return html`
      <aside
        class=${`fixed top-0 min-[1200px]:top-4 left-0 min-[1200px]:left-4 z-900 flex flex-col max-h-[calc(100vh-80px)] overflow-y-auto p-2 font-mono tabular-nums text-white bg-gray-800/88 backdrop-blur-sm shadow-xs rounded-[3px] ${this.isLeaderboardShow || this.isTeamLeaderboardShow ? "max-[400px]:w-full max-[400px]:rounded-none" : ""} transition-all duration-300 ease-out transform ${
          this.isVisible ? "translate-x-0" : "hidden"
        }`}
        style="margin-top: ${this.barOffset}px;"
      >
        <hud-toolbar>
          <hud-icon-button
            label=${translateText("help_modal.icon_alt_player_leaderboard") ||
            "Player Leaderboard"}
            @click=${this.toggleLeaderboard}
            @keydown=${(e: KeyboardEvent) => {
              if (e.key === "Enter" || e.key === " " || e.code === "Space") {
                e.preventDefault();
                this.toggleLeaderboard();
              }
            }}
          >
            ${this.renderToolbarIcon(
              this.isLeaderboardShow
                ? leaderboardSolidIcon
                : leaderboardRegularIcon,
              translateText("help_modal.icon_alt_player_leaderboard") ||
                "Player Leaderboard",
            )}
          </hud-icon-button>
          ${this.isTeamGame
            ? html`
                <hud-icon-button
                  label=${translateText(
                    "help_modal.icon_alt_team_leaderboard",
                  ) || "Team Leaderboard"}
                  @click=${this.toggleTeamLeaderboard}
                  @keydown=${(e: KeyboardEvent) => {
                    if (
                      e.key === "Enter" ||
                      e.key === " " ||
                      e.code === "Space"
                    ) {
                      e.preventDefault();
                      this.toggleTeamLeaderboard();
                    }
                  }}
                >
                  ${this.renderToolbarIcon(
                    this.isTeamLeaderboardShow
                      ? teamSolidIcon
                      : teamRegularIcon,
                    translateText("help_modal.icon_alt_team_leaderboard") ||
                      "Team Leaderboard",
                  )}
                </hud-icon-button>
              `
            : null}
          ${this.isLeaderboardShow || this.isTeamLeaderboardShow
            ? html`<span
                class="ml-auto text-[10px] text-slate-500 select-all leading-none self-start"
                title=${translateText("help_modal.game_id_tooltip")}
                >${this.game?.gameID() ?? ""}</span
              >`
            : null}
        </hud-toolbar>
        ${this.isPlayerTeamLabelVisible
          ? html`
              <div
                class="flex items-center w-full text-white mt-2"
                @contextmenu=${(e: Event) => e.preventDefault()}
              >
                ${translateText("help_modal.ui_your_team")}
                <span
                  style="--color: ${this.playerColor.toRgbString()}"
                  class="text-(--color)"
                >
                  &nbsp;${getTranslatedPlayerTeamLabel(this.playerTeam)}
                  &#10687;
                </span>
              </div>
            `
          : null}
        <div
          class=${`block lg:flex flex-wrap overflow-x-auto min-w-0 w-full ${this.isLeaderboardShow && this.isTeamLeaderboardShow ? "gap-2" : ""}`}
        >
          <leader-board .visible=${this.isLeaderboardShow}></leader-board>
          <team-stats
            class="flex-1"
            .visible=${this.isTeamLeaderboardShow && this.isTeamGame}
          ></team-stats>
        </div>
        <slot></slot>
      </aside>
    `;
  }
}

import { LitElement, html } from "lit";
import { customElement, property } from "lit/decorators.js";
import { EventBus } from "../../../core/EventBus";
import { GameMode, Team, UnitType } from "../../../core/game/Game";
import { GameView, PlayerView } from "../../../core/game/GameView";
import { Controller } from "../../Controller";
import {
  formatPercentage,
  renderNumber,
  renderTroops,
  translateText,
} from "../../Utils";
import {
  HUD_BUTTON,
  HUD_COMPACT_TABLE,
  HUD_SURFACE,
  HUD_TD,
  HUD_TD_LEFT,
  HUD_TH,
} from "../ui/HudTheme";

interface TeamEntry {
  teamName: string;
  isMyTeam: boolean;
  totalScoreStr: string;
  totalGold: string;
  totalMaxTroops: string;
  totalSAMs: string;
  totalLaunchers: string;
  totalWarShips: string;
  totalCities: string;
  totalScoreSort: number;
  players: PlayerView[];
}

@customElement("team-stats")
export class TeamStats extends LitElement implements Controller {
  public game: GameView;
  public eventBus: EventBus;

  @property({ type: Boolean }) visible = false;
  teams: TeamEntry[] = [];
  private _shownOnInit = false;
  private showUnits = false;
  private _myTeam: Team | null = null;

  createRenderRoot() {
    return this; // use light DOM for Tailwind
  }

  init() {}

  getTickIntervalMs() {
    return 1000;
  }

  tick() {
    if (this.game.config().gameConfig().gameMode !== GameMode.Team) return;

    if (!this._shownOnInit && !this.game.inSpawnPhase()) {
      this._shownOnInit = true;
      this.updateTeamStats();
    }

    if (!this.visible) return;

    this.updateTeamStats();
  }

  private updateTeamStats() {
    const players = this.game.playerViews();
    const grouped: Record<Team, PlayerView[]> = {};

    if (this._myTeam === null) {
      const myPlayer = this.game.myPlayer();
      this._myTeam = myPlayer?.team() ?? null;
    }

    for (const player of players) {
      const rawTeam = player.team();
      if (rawTeam === null) continue;
      grouped[rawTeam] ??= [];
      grouped[rawTeam].push(player);
    }

    this.teams = Object.entries(grouped)
      .map(([rawTeam, teamPlayers]) => {
        const key = `team_colors.${rawTeam.toLowerCase()}`;
        const translated = translateText(key);
        const teamName = translated !== key ? translated : rawTeam;

        let totalGold = 0n;
        let totalMaxTroops = 0;
        let totalScoreSort = 0;
        let totalSAMs = 0;
        let totalLaunchers = 0;
        let totalWarShips = 0;
        let totalCities = 0;

        for (const p of teamPlayers) {
          if (p.isAlive()) {
            totalMaxTroops += this.game.config().maxTroops(p);
            totalGold += p.gold();
            totalScoreSort += p.numTilesOwned();
            totalLaunchers += p.totalUnitLevels(UnitType.MissileSilo);
            totalSAMs += p.totalUnitLevels(UnitType.SAMLauncher);
            totalWarShips += p.totalUnitLevels(UnitType.Warship);
            totalCities += p.totalUnitLevels(UnitType.City);
          }
        }

        const numTilesWithoutFallout =
          this.game.numLandTiles() - this.game.numTilesWithFallout();
        const totalScorePercent = totalScoreSort / numTilesWithoutFallout;

        return {
          teamName,
          isMyTeam: rawTeam === this._myTeam,
          totalScoreStr: formatPercentage(totalScorePercent),
          totalScoreSort,
          totalGold: renderNumber(totalGold),
          totalMaxTroops: renderTroops(totalMaxTroops),
          players: teamPlayers,

          totalLaunchers: renderNumber(totalLaunchers),
          totalSAMs: renderNumber(totalSAMs),
          totalWarShips: renderNumber(totalWarShips),
          totalCities: renderNumber(totalCities),
        };
      })
      .sort((a, b) => b.totalScoreSort - a.totalScoreSort);

    this.requestUpdate();
  }

  render() {
    if (!this.visible) return html``;

    return html`
      <div
        class="mt-2 max-h-[30vh] overflow-x-hidden overflow-y-auto w-full ${HUD_SURFACE}"
        @contextmenu=${(e: MouseEvent) => e.preventDefault()}
      >
        <table class="${HUD_COMPACT_TABLE} table-fixed">
          <thead>
            <tr>
              <th class="${HUD_TH} text-left">
                ${translateText("leaderboard.team")}
              </th>
              ${this.showUnits
                ? html`
                    <th class="${HUD_TH}">
                      ${translateText("leaderboard.launchers")}
                    </th>
                    <th class="${HUD_TH}">
                      ${translateText("leaderboard.sams")}
                    </th>
                    <th class="${HUD_TH}">
                      ${translateText("leaderboard.warships")}
                    </th>
                    <th class="${HUD_TH}">
                      ${translateText("leaderboard.cities")}
                    </th>
                  `
                : html`
                    <th class="${HUD_TH}">
                      ${translateText("leaderboard.owned")}
                    </th>
                    <th class="${HUD_TH}">
                      ${translateText("leaderboard.gold")}
                    </th>
                    <th class="${HUD_TH}">
                      ${translateText("leaderboard.maxtroops")}
                    </th>
                  `}
            </tr>
          </thead>
          <tbody>
            ${this.teams.map((team) =>
              this.showUnits
                ? html`
                    <tr
                      class="hover:bg-white/10 ${team.isMyTeam
                        ? "font-bold text-aquarius"
                        : ""}"
                    >
                      <td class="${HUD_TD_LEFT}">${team.teamName}</td>
                      <td class="${HUD_TD}">${team.totalLaunchers}</td>
                      <td class="${HUD_TD}">${team.totalSAMs}</td>
                      <td class="${HUD_TD}">${team.totalWarShips}</td>
                      <td class="${HUD_TD}">${team.totalCities}</td>
                    </tr>
                  `
                : html`
                    <tr
                      class="hover:bg-white/10 ${team.isMyTeam
                        ? "font-bold text-aquarius"
                        : ""}"
                    >
                      <td class="${HUD_TD_LEFT}">${team.teamName}</td>
                      <td class="${HUD_TD}">${team.totalScoreStr}</td>
                      <td class="${HUD_TD}">${team.totalGold}</td>
                      <td class="${HUD_TD}">${team.totalMaxTroops}</td>
                    </tr>
                  `,
            )}
          </tbody>
        </table>
        <button
          class="m-2 ${HUD_BUTTON}"
          aria-pressed=${String(this.showUnits)}
          @click=${() => {
            this.showUnits = !this.showUnits;
            this.requestUpdate();
          }}
        >
          ${this.showUnits
            ? translateText("leaderboard.show_control")
            : translateText("leaderboard.show_units")}
        </button>
      </div>
    `;
  }
}

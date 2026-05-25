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
import "../ui/HudComponents";

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

  connectedCallback() {
    super.connectedCallback();
    this.classList.add("block", "w-full");
  }

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
        class="mt-2 max-h-[30vh] overflow-x-hidden overflow-y-auto w-full font-mono tabular-nums text-white bg-gray-800/88 backdrop-blur-sm shadow-xs rounded-[3px]"
        @contextmenu=${(e: MouseEvent) => e.preventDefault()}
      >
        <hud-table>
          <hud-table-row>
            <hud-table-cell header align="left">
              ${hudLabel("leaderboard.team", "Team")}
            </hud-table-cell>
            ${this.showUnits
              ? html`
                  <hud-table-cell header>
                    ${hudLabel("leaderboard.launchers", "Launchers")}
                  </hud-table-cell>
                  <hud-table-cell header>
                    ${hudLabel("leaderboard.sams", "SAMs")}
                  </hud-table-cell>
                  <hud-table-cell header>
                    ${hudLabel("leaderboard.warships", "Warships")}
                  </hud-table-cell>
                  <hud-table-cell header>
                    ${hudLabel("leaderboard.cities", "Cities")}
                  </hud-table-cell>
                `
              : html`
                  <hud-table-cell header>
                    ${hudLabel("leaderboard.owned", "Owned")}
                  </hud-table-cell>
                  <hud-table-cell header>
                    ${hudLabel("leaderboard.gold", "Gold")}
                  </hud-table-cell>
                  <hud-table-cell header>
                    ${hudLabel("leaderboard.maxtroops", "Max")}
                  </hud-table-cell>
                `}
          </hud-table-row>
          ${this.teams.map((team) =>
            this.showUnits
              ? html`
                  <hud-table-row interactive ?selected=${team.isMyTeam}>
                    <hud-table-cell align="left"
                      >${team.teamName}</hud-table-cell
                    >
                    <hud-table-cell>${team.totalLaunchers}</hud-table-cell>
                    <hud-table-cell>${team.totalSAMs}</hud-table-cell>
                    <hud-table-cell>${team.totalWarShips}</hud-table-cell>
                    <hud-table-cell>${team.totalCities}</hud-table-cell>
                  </hud-table-row>
                `
              : html`
                  <hud-table-row interactive ?selected=${team.isMyTeam}>
                    <hud-table-cell align="left"
                      >${team.teamName}</hud-table-cell
                    >
                    <hud-table-cell>${team.totalScoreStr}</hud-table-cell>
                    <hud-table-cell>${team.totalGold}</hud-table-cell>
                    <hud-table-cell>${team.totalMaxTroops}</hud-table-cell>
                  </hud-table-row>
                `,
          )}
        </hud-table>
        <hud-button
          class="m-2"
          aria-pressed=${String(this.showUnits)}
          @click=${() => {
            this.showUnits = !this.showUnits;
            this.requestUpdate();
          }}
        >
          ${this.showUnits
            ? hudLabel("leaderboard.show_control", "Show Stats")
            : hudLabel("leaderboard.show_units", "Show Units")}
        </hud-button>
      </div>
    `;
  }
}

function hudLabel(key: string, fallback: string): string {
  const translated = translateText(key);
  return translated === key ? fallback : translated;
}

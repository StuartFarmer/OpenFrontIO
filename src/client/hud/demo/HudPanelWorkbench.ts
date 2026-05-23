import { LitElement, html } from "lit";
import { customElement } from "lit/decorators.js";
import {
  MessageCategory,
  MessageType,
  Relation,
} from "../../../core/game/Game";
import "../layers/AttacksDisplay";
import "../layers/ControlPanel";
import "../layers/EventsDisplay";
import "../layers/GameLeftSidebar";
import "../layers/GameRightSidebar";
import "../layers/Leaderboard";
import "../layers/PlayerInfoOverlay";
import "../layers/ReplayPanel";
import "../layers/TeamStats";
import "../layers/UnitDisplay";
import {
  buildables,
  mockGame,
  myPlayer,
  noopEventBus,
  players,
  row,
  uiState,
} from "./HudLiveComponentsDemo";

@customElement("hud-panel-workbench")
export class HudPanelWorkbench extends LitElement {
  createRenderRoot() {
    return this;
  }

  firstUpdated() {
    this.seedPanels();
    requestAnimationFrame(() => this.seedPanels());
  }

  updated() {
    this.seedPanels();
  }

  private seedPanels() {
    this.querySelectorAll("leader-board").forEach((el) =>
      this.seedLeaderboard(el as any, true),
    );
    this.querySelectorAll("team-stats").forEach((el) =>
      this.seedTeamStats(el as any, true),
    );
    this.querySelectorAll("events-display").forEach((el) =>
      this.seedEvents(el as any),
    );
    this.querySelectorAll("control-panel").forEach((el) =>
      this.seedControlPanel(el as any),
    );
    this.querySelectorAll("unit-display").forEach((el) =>
      this.seedUnitDisplay(el as any),
    );
    this.querySelectorAll("attacks-display").forEach((el) =>
      this.seedAttacks(el as any),
    );
    this.querySelectorAll("game-right-sidebar").forEach((el) =>
      this.seedRightSidebar(el as any),
    );
    this.querySelectorAll("replay-panel").forEach((el) =>
      this.seedReplayPanel(el as any),
    );
    this.querySelectorAll("player-info-overlay").forEach((el) =>
      this.seedPlayerInfo(el as any),
    );
    this.querySelectorAll("game-left-sidebar").forEach((el) =>
      this.seedLeftSidebar(el as any),
    );
  }

  private seedLeaderboard(el: any, visible: boolean) {
    el.visible = visible;
    el.game = mockGame;
    el.eventBus = noopEventBus;
    el.players = [
      row(players[1], 1, "31.8%", "148K", "2.4M"),
      row(players[0], 2, "25.4%", "92K", "1.9M", true, true),
      row(players[2], 3, "18.2%", "107K", "1.3M", false, true),
      row(players[3], 4, "9.7%", "41K", "812K"),
    ];
    el.requestUpdate();
  }

  private seedTeamStats(el: any, visible: boolean) {
    el.visible = visible;
    el.game = mockGame;
    el.eventBus = noopEventBus;
    el.teams = [
      {
        teamName: "Blue",
        isMyTeam: true,
        totalScoreStr: "43.6%",
        totalGold: "199K",
        totalMaxTroops: "4.1M",
        totalSAMs: "5",
        totalLaunchers: "3",
        totalWarShips: "11",
        totalCities: "17",
        totalScoreSort: 4360,
        players: [players[0], players[2]],
      },
      {
        teamName: "Red",
        isMyTeam: false,
        totalScoreStr: "31.8%",
        totalGold: "148K",
        totalMaxTroops: "2.9M",
        totalSAMs: "5",
        totalLaunchers: "3",
        totalWarShips: "9",
        totalCities: "12",
        totalScoreSort: 3180,
        players: [players[1]],
      },
    ];
    el.requestUpdate();
  }

  private seedEvents(el: any) {
    el.game = mockGame;
    el.eventBus = noopEventBus;
    el.uiState = uiState;
    el.eventsFilters = new Map([
      [MessageCategory.ATTACK, false],
      [MessageCategory.NUKE, false],
      [MessageCategory.TRADE, false],
      [MessageCategory.ALLIANCE, false],
      [MessageCategory.CHAT, false],
    ]);
    el.events = [
      {
        description: "Red requested attack on Delta.",
        type: MessageType.ATTACK_REQUEST,
        createdAt: 1160,
        priority: 90,
        focusID: 2,
        buttons: [
          { text: "Focus", className: "btn-info", action: () => {} },
          { text: "Accept", className: "btn-success", action: () => {} },
        ],
      },
      {
        description: "+12.4K gold received from trade route.",
        type: MessageType.RECEIVED_GOLD_FROM_TRADE,
        createdAt: 1168,
        priority: 60,
      },
      {
        description: "Alliance with East March expires in 24s.",
        type: MessageType.ALLIANCE_EXPIRED,
        createdAt: 1174,
        priority: 72,
      },
      {
        description: "Missile silo captured near the capital.",
        type: MessageType.CAPTURED_ENEMY_UNIT,
        createdAt: 1178,
        priority: 80,
      },
    ];
    el.requestUpdate();
  }

  private seedControlPanel(el: any) {
    el.game = mockGame;
    el.eventBus = noopEventBus;
    el.uiState = uiState;
    el.attackRatio = 0.25;
    el._isVisible = true;
    el._maxTroops = myPlayer.effectiveTroopCapacity();
    el._troops = myPlayer.troops();
    el._gold = myPlayer.gold();
    el._attackingTroops = 245000;
    el.troopRate = myPlayer.troopIncreaseRate() * 10;
    el._troopRateIsIncreasing = true;
    el._resources = myPlayer.resources();
    el._resourceCapacity = myPlayer.resourceCapacity();
    el._resourceRates = { food: 18400, energy: 7200, materials: 9600 };
    el._importBlendFirst = 34;
    el._importBlendSecond = 67;
    el._exportBlendFirst = 40;
    el._exportBlendSecond = 72;
    el._productionBlend = { food: 48, energy: 24, materials: 28 };
    el.requestUpdate();
  }

  private seedUnitDisplay(el: any) {
    el.game = mockGame;
    el.eventBus = noopEventBus;
    el.uiState = uiState;
    el.playerBuildables = buildables;
    el.keybinds = {};
    el.allDisabled = false;
    el._cities = 9;
    el._factories = 6;
    el._port = 3;
    el._defensePost = 4;
    el._railStations = 5;
    el._silos = 2;
    el._warships = 7;
    el.requestUpdate();
  }

  private seedAttacks(el: any) {
    el.game = mockGame;
    el.eventBus = noopEventBus;
    el.uiState = uiState;
    el.active = true;
    el._isVisible = true;
    el.outgoingAttacks = [
      {
        id: "out-1",
        attackerID: 1,
        targetID: 2,
        troops: 180000,
        retreating: false,
      },
    ];
    el.outgoingLandAttacks = [
      {
        id: "land-1",
        attackerID: 1,
        targetID: 0,
        troops: 42000,
        retreating: true,
      },
    ];
    el.incomingAttacks = [
      {
        id: "in-1",
        attackerID: 4,
        targetID: 1,
        troops: 96000,
        retreating: false,
      },
    ];
    el.outgoingBoats = [];
    el.incomingBoats = [];
    el.requestUpdate();
  }

  private seedRightSidebar(el: any) {
    el.game = mockGame;
    el.eventBus = noopEventBus;
    el._isSinglePlayer = true;
    el._isVisible = true;
    el._isReplayVisible = true;
    el.timer = 742;
    el.requestUpdate();
  }

  private seedReplayPanel(el: any) {
    el.game = mockGame;
    el.eventBus = noopEventBus;
    el.visible = true;
    el.isSingleplayer = true;
    el._replaySpeedMultiplier = 2;
    el.requestUpdate();
  }

  private seedPlayerInfo(el: any) {
    el.game = mockGame;
    el.eventBus = noopEventBus;
    el.transform = {};
    el.player = players[2];
    el.playerProfile = {
      relations: { [myPlayer.smallID()]: Relation.Friendly },
    };
    el.unit = null;
    el._isActive = true;
    el._isInfoVisible = true;
    el.requestUpdate();
  }

  private seedLeftSidebar(el: any) {
    el.game = mockGame;
    el.eventBus = noopEventBus;
    el.isVisible = true;
    el.isLeaderboardShow = true;
    el.isTeamLeaderboardShow = true;
    el.isPlayerTeamLabelVisible = false;
    el.playerTeam = "Blue";
    el.spawnBarVisible = false;
    el.immunityBarVisible = false;
    el.requestUpdate();

    el.querySelectorAll("leader-board").forEach((leaderboard: any) =>
      this.seedLeaderboard(leaderboard, true),
    );
    el.querySelectorAll("team-stats").forEach((teamStats: any) =>
      this.seedTeamStats(teamStats, true),
    );
  }

  render() {
    return html`
      <style>
        body {
          margin: 0;
          background: #0f172a;
        }

        .workbench {
          min-height: 100vh;
          padding: 24px;
          color: #f8fafc;
          font-family:
            Inter,
            ui-sans-serif,
            system-ui,
            -apple-system,
            BlinkMacSystemFont,
            "Segoe UI",
            sans-serif;
        }

        .topbar {
          max-width: 1280px;
          margin: 0 auto 18px;
        }

        h1,
        h2,
        p {
          margin: 0;
        }

        h1 {
          font-size: 22px;
          font-weight: 650;
        }

        .subtle {
          margin-top: 4px;
          color: rgba(226, 232, 240, 0.66);
          font-size: 12px;
        }

        .catalog {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(360px, 1fr));
          gap: 14px;
          max-width: 1280px;
          margin: 0 auto;
        }

        .section {
          overflow: hidden;
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 3px;
          background: rgba(15, 23, 42, 0.78);
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.28);
        }

        .section-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          min-height: 30px;
          padding: 6px 8px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.12);
          color: rgba(226, 232, 240, 0.74);
          font-family:
            ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas,
            "Liberation Mono", "Courier New", monospace;
          font-size: 10px;
          font-variant-numeric: tabular-nums;
          text-transform: uppercase;
        }

        .section-header span:last-child {
          color: rgba(148, 163, 184, 0.82);
          text-transform: none;
        }

        .stage {
          position: relative;
          overflow: hidden;
          min-height: 96px;
          padding: 12px;
          background:
            linear-gradient(rgba(2, 6, 23, 0.2), rgba(2, 6, 23, 0.42)), #1e293b;
          transform: translateZ(0);
        }

        .stage.center {
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .stage.top {
          display: flex;
          align-items: flex-start;
          justify-content: flex-start;
        }

        .frame {
          position: relative;
          min-width: 0;
        }

        .frame.shell {
          color: white;
          background: rgba(31, 41, 55, 0.88);
          border-radius: 3px;
          box-shadow: 0 10px 15px rgba(0, 0, 0, 0.22);
          overflow: hidden;
        }

        .w-500 {
          width: 500px;
        }

        .w-420 {
          width: 420px;
        }

        .w-384 {
          width: 384px;
        }

        .w-320 {
          width: 320px;
        }

        .h-64 {
          height: 64px;
        }

        .h-96 {
          height: 96px;
        }

        .h-140 {
          height: 140px;
        }

        .h-180 {
          height: 180px;
        }

        .h-240 {
          height: 240px;
        }

        .h-360 {
          height: 360px;
        }

        leader-board,
        team-stats,
        attacks-display,
        control-panel,
        unit-display,
        events-display,
        replay-panel,
        game-right-sidebar,
        player-info-overlay,
        game-left-sidebar {
          pointer-events: auto;
        }
      </style>

      <div class="workbench">
        <div class="topbar">
          <h1>HUD Panel Workbench</h1>
          <p class="subtle">
            Actual HUD components in isolated constrained stages. Fix the panel
            here, then validate in the live HUD demo.
          </p>
        </div>

        <div class="catalog">
          ${this.section(
            "Left Sidebar",
            "420 x 360, fixed-position sandbox",
            html`<div class="stage h-360">
              <game-left-sidebar></game-left-sidebar>
            </div>`,
          )}
          ${this.section(
            "Leaderboard",
            "320 x 240",
            html`<div class="stage top h-240">
              <div class="frame w-320"><leader-board></leader-board></div>
            </div>`,
          )}
          ${this.section(
            "Team Stats",
            "320 x 180",
            html`<div class="stage top h-180">
              <div class="frame w-320"><team-stats></team-stats></div>
            </div>`,
          )}
          ${this.section(
            "Control Panel",
            "500 x 140",
            html`<div class="stage center h-140">
              <div class="frame shell w-500">
                <control-panel></control-panel>
              </div>
            </div>`,
          )}
          ${this.section(
            "Unit Display",
            "500 x 64",
            html`<div class="stage center h-96">
              <div class="frame shell w-500">
                <unit-display></unit-display>
              </div>
            </div>`,
          )}
          ${this.section(
            "Attacks Display",
            "500 x 140",
            html`<div class="stage center h-140">
              <div class="frame w-500"><attacks-display></attacks-display></div>
            </div>`,
          )}
          ${this.section(
            "Events Display",
            "384 x 240",
            html`<div class="stage top h-240">
              <div class="frame w-384"><events-display></events-display></div>
            </div>`,
          )}
          ${this.section(
            "Right Sidebar",
            "320 x 64",
            html`<div class="stage center h-96">
              <div class="frame w-320">
                <game-right-sidebar></game-right-sidebar>
              </div>
            </div>`,
          )}
          ${this.section(
            "Replay Panel",
            "320 x 96",
            html`<div class="stage center h-140">
              <div class="frame w-320"><replay-panel></replay-panel></div>
            </div>`,
          )}
          ${this.section(
            "Player Popover",
            "500 x 180, fixed-position sandbox",
            html`<div class="stage h-180">
              <player-info-overlay></player-info-overlay>
            </div>`,
          )}
        </div>
      </div>
    `;
  }

  private section(title: string, detail: string, content: unknown) {
    return html`
      <section class="section">
        <div class="section-header">
          <span>${title}</span>
          <span>${detail}</span>
        </div>
        ${content}
      </section>
    `;
  }
}

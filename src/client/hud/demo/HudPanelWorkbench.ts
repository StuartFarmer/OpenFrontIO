import { html, LitElement } from "lit";
import { customElement, state } from "lit/decorators.js";
import { ChevronUp, X } from "lucide";
import { assetUrl } from "../../../core/AssetUrls";
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
  HUD_ACTION_GROUP,
  HUD_ATTACK_RATIO_PILL,
  HUD_BLEND_LABEL,
  HUD_BLEND_ROW,
  HUD_BUILD_HOTKEY,
  HUD_BUILD_ICON,
  HUD_BUILD_ITEM,
  HUD_BUILD_ITEM_ACTIVE,
  HUD_BUILD_STRIP,
  HUD_BUTTON,
  HUD_COMPACT_TABLE,
  HUD_CONTROL_ROW,
  HUD_DUAL_RANGE,
  HUD_DUAL_RANGE_FILL,
  HUD_DUAL_RANGE_INPUT,
  HUD_DUAL_RANGE_TRACK,
  HUD_EVENT_META,
  HUD_EVENT_ROW,
  HUD_EVENT_TEXT,
  HUD_FIELD_LABEL,
  HUD_FORM_ROW,
  HUD_ICON_BUTTON,
  HUD_ICON_CLUSTER,
  HUD_IDENTITY_NAME,
  HUD_IDENTITY_ROW,
  HUD_INPUT,
  HUD_METER,
  HUD_METER_FILL,
  HUD_METER_STACK,
  HUD_METER_TEXT,
  HUD_MINI_METER,
  HUD_NOTIFICATION_PILL,
  HUD_PILL,
  HUD_PILL_BLUE,
  HUD_PILL_GOLD,
  HUD_PILL_GREEN,
  HUD_PILL_MASK_ICON,
  HUD_PILL_RED,
  HUD_PILL_VALUE,
  HUD_RANGE,
  HUD_SEGMENT,
  HUD_SEGMENT_ACTIVE,
  HUD_SEGMENT_CONTENT,
  HUD_SEGMENT_LABEL,
  HUD_SEGMENT_MAIN,
  HUD_SEGMENT_VALUE,
  HUD_SEGMENTED,
  HUD_SELECT,
  HUD_STAT_GRID,
  HUD_STAT_LABEL,
  HUD_STAT_VALUE,
  HUD_SURFACE,
  HUD_SURFACE_BODY,
  HUD_SURFACE_HEADER,
  HUD_TD,
  HUD_TD_LEFT,
  HUD_TH,
  HUD_TIMER_LABEL,
  HUD_TOOLBAR,
  HUD_TOOLTIP,
  HUD_TOOLTIP_TITLE,
} from "../ui/HudTheme";
import { renderLucideIcon } from "../ui/LucideIcon";
import {
  buildables,
  mockGame,
  myPlayer,
  noopEventBus,
  players,
  row,
  uiState,
} from "./HudLiveComponentsDemo";

const sampleGoldCoinIcon = assetUrl("images/GoldCoinIcon.svg");
const sampleSoldierIcon = assetUrl("images/SoldierIcon.svg");
const sampleSwordIcon = assetUrl("images/SwordIcon.svg");
const sampleAllianceIcon = assetUrl("images/AllianceIconWhite.svg");
const sampleChatIcon = assetUrl("images/ChatIconWhite.svg");
const sampleExitIcon = assetUrl("images/ExitIconWhite.svg");
const sampleLeaderboardIcon = assetUrl("images/LeaderboardIconSolidWhite.svg");
const sampleNukeIcon = assetUrl("images/NukeIconWhite.svg");
const sampleSettingsIcon = assetUrl("images/SettingIconWhite.svg");
const sampleBiomassIcon = assetUrl("icons/biomass-icon.svg");
const sampleFuelIcon = assetUrl("icons/fuel-icon.svg");
const sampleMetalIcon = assetUrl("icons/metal-icon.svg");

const hudIconSamples = [
  ["Troops", sampleSoldierIcon],
  ["Troops Blue", assetUrl("images/SoldierIconAquarius.svg")],
  ["Sword", sampleSwordIcon],
  ["Sword White", assetUrl("images/SwordIconWhite.svg")],
  ["Nuke", sampleNukeIcon],
  ["Hydrogen", assetUrl("images/MushroomCloudIconWhite.svg")],
  ["MIRV", assetUrl("images/MIRVIcon.svg")],
  ["Warship", assetUrl("images/BattleshipIconWhite.svg")],
  ["Boat", assetUrl("images/BoatIconWhite.svg")],
  ["City", assetUrl("images/CityIconWhite.svg")],
  ["Factory", assetUrl("images/FactoryIconWhite.svg")],
  ["Port", assetUrl("images/PortIcon.svg")],
  ["Shield", assetUrl("images/ShieldIconWhite.svg")],
  ["SAM", assetUrl("images/SamLauncherIconWhite.svg")],
  ["Silo", assetUrl("images/MissileSiloIconWhite.svg")],
  ["Build", assetUrl("images/BuildIconWhite.svg")],
  ["Gold", sampleGoldCoinIcon],
  ["Biomass", sampleBiomassIcon],
  ["Fuel", sampleFuelIcon],
  ["Metal", sampleMetalIcon],
  ["Alliance", sampleAllianceIcon],
  ["Alliance Color", assetUrl("images/AllianceIcon.svg")],
  ["Chat", sampleChatIcon],
  ["Target", assetUrl("images/TargetIconWhite.svg")],
  ["Donate Troops", assetUrl("images/DonateTroopIconWhite.svg")],
  ["Donate Gold", assetUrl("images/DonateGoldIconWhite.svg")],
  ["Emoji", assetUrl("images/EmojiIconWhite.svg")],
  ["Traitor", assetUrl("images/TraitorIconWhite.svg")],
  ["Traitor Red", assetUrl("images/TraitorIconLightRed.svg")],
  ["Stop Trade", assetUrl("images/StopIconWhite.png")],
  ["Start Trade", assetUrl("images/TradingIconWhite.png")],
  ["Info", assetUrl("images/InfoIcon.svg")],
  ["Close", assetUrl("images/XIcon.svg")],
  ["Exit", sampleExitIcon],
  ["Settings", sampleSettingsIcon],
  ["Leaderboard", sampleLeaderboardIcon],
  ["Leaderboard Line", assetUrl("images/LeaderboardIconRegularWhite.svg")],
  ["Team", assetUrl("images/TeamIconSolidWhite.svg")],
  ["Team Line", assetUrl("images/TeamIconRegularWhite.svg")],
  ["Play", assetUrl("images/PlayIconWhite.svg")],
  ["Pause", assetUrl("images/PauseIconWhite.svg")],
  ["Fast Forward", assetUrl("images/FastForwardIconSolidWhite.svg")],
  ["Fullscreen", assetUrl("images/FullscreenIconWhite.svg")],
  ["Exit Full", assetUrl("images/ExitFullscreenIconWhite.svg")],
  ["Cursor Price", assetUrl("images/CursorPriceIconWhite.svg")],
  ["Dark Mode", assetUrl("images/DarkModeIconWhite.svg")],
  ["Explosion", assetUrl("images/ExplosionIconWhite.svg")],
  ["Mouse", assetUrl("images/MouseIconWhite.svg")],
  ["Ninja", assetUrl("images/NinjaIconWhite.svg")],
  ["Siren", assetUrl("images/SirenIconWhite.svg")],
  ["Tree", assetUrl("images/TreeIconWhite.svg")],
  ["Music", assetUrl("images/music.svg")],
] as const;

@customElement("hud-panel-workbench")
export class HudPanelWorkbench extends LitElement {
  @state() private dualRangeStart = 25;
  @state() private dualRangeEnd = 75;
  @state() private blendRangeFirst = 34;
  @state() private blendRangeSecond = 67;

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
        html,
        body {
          height: auto !important;
          margin: 0;
          overflow-y: auto !important;
          background: #0f172a;
        }

        body {
          display: block !important;
          min-height: 100vh;
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

        .catalog-heading {
          grid-column: 1 / -1;
          margin-top: 8px;
          padding: 8px 0 2px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.12);
          color: rgba(226, 232, 240, 0.86);
          font-family:
            ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas,
            "Liberation Mono", "Courier New", monospace;
          font-size: 11px;
          font-weight: 700;
          font-variant-numeric: tabular-nums;
          text-transform: uppercase;
        }

        .catalog-heading span {
          margin-left: 8px;
          color: rgba(148, 163, 184, 0.82);
          font-weight: 500;
          text-transform: none;
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

        .kit-stage {
          min-height: 132px;
          padding: 12px;
          background: #1e293b;
          font-family:
            ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas,
            "Liberation Mono", "Courier New", monospace;
          font-size: 10px;
          font-variant-numeric: tabular-nums;
        }

        .kit-stack {
          display: grid;
          gap: 8px;
        }

        .atom-row {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 8px;
        }

        .atom-caption {
          min-width: 72px;
          color: rgba(226, 232, 240, 0.68);
          text-transform: uppercase;
        }

        .atom-icon {
          display: inline-grid;
          place-items: center;
          aspect-ratio: 1 / 1;
          flex: 0 0 auto;
          overflow: hidden;
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 2px;
          background: rgba(2, 6, 23, 0.35);
          color: #67e8f9;
          font-weight: 700;
          line-height: 1;
        }

        .atom-icon.red {
          color: #f87171;
          border-color: rgba(185, 28, 28, 0.5);
          background: rgba(127, 29, 29, 0.35);
        }

        .atom-icon.sm {
          width: 16px;
        }

        .atom-icon.md {
          width: 20px;
        }

        .atom-icon.lg {
          width: 24px;
        }

        .atom-icon.xl {
          width: 28px;
        }

        .actual-icon-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(86px, 1fr));
          gap: 6px;
        }

        .actual-icon-card {
          display: grid;
          min-width: 0;
          grid-template-columns: 24px minmax(0, 1fr);
          align-items: center;
          gap: 6px;
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 2px;
          background: rgba(2, 6, 23, 0.28);
          padding: 4px 5px;
          color: rgba(226, 232, 240, 0.78);
          line-height: 1;
        }

        .actual-icon-card img {
          width: 20px;
          height: 20px;
          object-fit: contain;
        }

        .actual-icon-card span {
          min-width: 0;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .atom-label {
          min-width: 0;
          color: #e2e8f0;
          line-height: 1;
        }

        .atom-label.number {
          min-width: 56px;
          text-align: right;
          white-space: nowrap;
        }

        .atom-label.text {
          max-width: 120px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .surface-sample {
          overflow: hidden;
          width: 180px;
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 3px;
          background: rgba(31, 41, 55, 0.88);
          color: white;
        }

        .surface-sample-header {
          min-height: 26px;
          padding: 6px 8px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          background: rgba(15, 23, 42, 0.5);
          font-weight: 700;
        }

        .surface-sample-body {
          padding: 8px;
          color: rgba(226, 232, 240, 0.78);
        }

        .button-sample {
          min-height: 24px;
          padding: 0 8px;
          border: 1px solid rgba(255, 255, 255, 0.25);
          border-radius: 2px;
          background: rgba(2, 6, 23, 0.35);
          color: white;
          font: inherit;
          font-weight: 650;
        }

        .breakdown-list {
          display: grid;
          gap: 6px;
          margin: 0;
          padding: 0;
          list-style: none;
          color: rgba(226, 232, 240, 0.76);
        }

        .breakdown-list strong {
          color: white;
        }

        .attack-row-sample {
          display: flex;
          width: 100%;
          max-width: 500px;
          min-width: 0;
          align-items: center;
          gap: 4px;
          overflow: hidden;
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 3px;
          background: rgba(31, 41, 55, 0.88);
          padding: 2px 4px;
          color: #67e8f9;
        }

        .attack-row-main {
          display: grid;
          min-width: 0;
          flex: 1;
          grid-template-columns: auto auto minmax(60px, auto) minmax(0, 1fr);
          align-items: center;
          gap: 4px;
        }

        .dual-range-input {
          pointer-events: none;
        }

        .dual-range-input::-webkit-slider-runnable-track {
          height: 24px;
          background: transparent;
          border: 0;
        }

        .dual-range-input::-webkit-slider-thumb {
          pointer-events: auto;
          width: 18px;
          height: 18px;
          margin-top: 3px;
          border: 3px solid rgba(255, 255, 255, 0.86);
          border-radius: 9999px;
          background: #38bdf8;
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.45);
          transition:
            transform 120ms ease,
            box-shadow 120ms ease;
          -webkit-appearance: none;
          appearance: none;
        }

        .dual-range-input:active::-webkit-slider-thumb {
          transform: scale(1.1);
          box-shadow:
            0 0 0 3px rgba(56, 189, 248, 0.24),
            0 1px 2px rgba(0, 0, 0, 0.45);
        }

        .blend-range-input::-webkit-slider-thumb {
          background: #cbd5e1;
          box-shadow:
            0 0 0 2px rgba(15, 23, 42, 0.8),
            0 1px 2px rgba(0, 0, 0, 0.45);
        }

        .blend-range-input:active::-webkit-slider-thumb {
          box-shadow:
            0 0 0 3px rgba(203, 213, 225, 0.25),
            0 1px 2px rgba(0, 0, 0, 0.45);
        }

        .dual-range-input::-moz-range-track {
          height: 24px;
          background: transparent;
          border: 0;
        }

        .dual-range-input::-moz-range-thumb {
          pointer-events: auto;
          width: 18px;
          height: 18px;
          border: 3px solid rgba(255, 255, 255, 0.86);
          border-radius: 9999px;
          background: #38bdf8;
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.45);
        }

        .blend-range-input::-moz-range-thumb {
          background: #cbd5e1;
          box-shadow:
            0 0 0 2px rgba(15, 23, 42, 0.8),
            0 1px 2px rgba(0, 0, 0, 0.45);
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
          <h1>HUD UI Catalog</h1>
          <p class="subtle">
            Every reusable HUD UI element, from primitives to composed panels.
          </p>
        </div>

        <div class="catalog">
          ${this.catalogHeading(
            "Atoms",
            "basic reusable units for building new HUD panels",
          )}
          ${this.section(
            "Header",
            "surface header and body slots",
            this.renderHeaderAtoms(),
          )}
          ${this.section(
            "Surface + Control",
            "radius 3px surfaces, radius 2px controls",
            this.renderSurfaceControlAtoms(),
          )}
          ${this.section(
            "Icons",
            "sm, md, lg, xl square icons",
            this.renderIconAtoms(),
          )}
          ${this.section(
            "Labels",
            "mono numeric and text labels",
            this.renderLabelAtoms(),
          )}
          ${this.section(
            "Buttons",
            "text, icon, active, danger",
            this.renderButtonAtoms(),
          )}
          ${this.section(
            "Pills",
            "neutral and semantic",
            this.renderPillAtoms(),
          )}
          ${this.section(
            "Forms",
            "input, select, range",
            this.renderFormAtoms(),
          )}
          ${this.section(
            "Meters",
            "full and mini progress bars",
            this.renderMeterAtoms(),
          )}
          ${this.section(
            "Compact Table",
            "headers and aligned cells",
            this.renderTableAtoms(),
          )}
          ${this.catalogHeading(
            "Molecules",
            "composed HUD controls and repeated row patterns",
          )}
          ${this.section(
            "Attack Row",
            "icon + icon + number + label + action",
            this.renderAttackRowMolecule(),
          )}
          ${this.section(
            "Control Panel Controls",
            "tabs, meter, slider, blend",
            this.renderControlPanelMolecules(),
          )}
          ${this.section(
            "Events",
            "filters, row, actions, notice",
            this.renderEventsMolecules(),
          )}
          ${this.section(
            "Unit Display",
            "build strip, build item, tooltip",
            this.renderUnitDisplayMolecules(),
          )}
          ${this.section(
            "Player Info",
            "identity, icon pills, mini meter",
            this.renderPlayerInfoMolecules(),
          )}
          ${this.section(
            "Sidebar + Economy",
            "toolbar, timer, economy stats",
            this.renderSidebarEconomyMolecules(),
          )}
          ${this.catalogHeading(
            "Complete Components",
            "live composites in constrained stages",
          )}
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

  private catalogHeading(title: string, detail: string) {
    return html`<div class="catalog-heading">
      ${title}<span>${detail}</span>
    </div>`;
  }

  private renderHeaderAtoms() {
    return html`
      <div class="kit-stage">
        <div class="${HUD_SURFACE} w-full max-w-[260px]">
          <div class="${HUD_SURFACE_HEADER}">
            <span>SECTION HEADER</span>
            <span class="text-slate-400">meta</span>
          </div>
          <div class="${HUD_SURFACE_BODY} text-slate-300">surface body</div>
        </div>
      </div>
    `;
  }

  private renderSurfaceControlAtoms() {
    return html`
      <div class="kit-stage">
        <div class="atom-row">
          <span class="atom-caption">surface</span>
          <div class="surface-sample">
            <div class="surface-sample-header">PANEL HEADER</div>
            <div class="surface-sample-body">panel body</div>
          </div>
        </div>
        <div class="atom-row" style="margin-top: 10px">
          <span class="atom-caption">control</span>
          <button class="button-sample">ACTION</button>
          <span class="atom-icon md">X</span>
        </div>
      </div>
    `;
  }

  private renderIconAtoms() {
    return html`
      <div class="kit-stage kit-stack">
        <div class="atom-row">
          <span class="atom-caption">sizes</span>
          <span class="atom-icon sm">S</span>
          <span class="atom-icon md">S</span>
          <span class="atom-icon lg">S</span>
          <span class="atom-icon xl">S</span>
        </div>
        <div class="atom-row">
          <span class="atom-caption">red</span>
          <span class="atom-icon red sm">v</span>
          <span class="atom-icon red md">v</span>
          <span class="atom-icon red lg">v</span>
          <span class="atom-icon red xl">v</span>
        </div>
        <div class="atom-row">
          <span class="atom-caption">action</span>
          <span class="atom-icon md">X</span>
          <span class="atom-icon red md">X</span>
        </div>
        <div class="actual-icon-grid">
          ${hudIconSamples.map(
            ([label, src]) => html`
              <div class="actual-icon-card" title=${label}>
                <img src=${src} alt=${label} />
                <span>${label}</span>
              </div>
            `,
          )}
        </div>
      </div>
    `;
  }

  private renderLabelAtoms() {
    return html`
      <div class="kit-stage kit-stack">
        <div class="atom-row">
          <span class="atom-caption">number</span>
          <span class="atom-label number">1.00K</span>
          <span class="atom-label number">10.0K</span>
          <span class="atom-label number">100K</span>
          <span class="atom-label number">1.00M</span>
        </div>
        <div class="atom-row">
          <span class="atom-caption">label</span>
          <span class="atom-label text">East March</span>
          <span class="atom-label text">Wilderness</span>
          <span class="atom-label text">Very Long Player Name</span>
        </div>
      </div>
    `;
  }

  private renderButtonAtoms() {
    return html`
      <div class="kit-stage kit-stack">
        <div class="atom-row">
          <span class="atom-caption">button</span>
          <button class="${HUD_BUTTON}">Default</button>
          <button class="${HUD_BUTTON} border-aquarius/70 bg-aquarius/25">
            Active
          </button>
          <button class="${HUD_BUTTON} border-red-400/70 text-red-300">
            Danger
          </button>
        </div>
        <div class="atom-row">
          <span class="atom-caption">icon</span>
          <button class="${HUD_ICON_BUTTON}">
            ${this.renderPlainIcon(sampleSettingsIcon)}
          </button>
          <button class="${HUD_ICON_BUTTON}">
            ${this.renderPlainIcon(sampleExitIcon)}
          </button>
          <button class="${HUD_ICON_BUTTON}">
            ${this.renderPlainIcon(sampleLeaderboardIcon)}
          </button>
        </div>
      </div>
    `;
  }

  private renderPillAtoms() {
    return html`
      <div class="kit-stage kit-stack">
        <div class="atom-row">
          <span class="atom-caption">pill</span>
          <span class="${HUD_PILL}">Neutral</span>
          <span class="${HUD_PILL} ${HUD_PILL_BLUE}">Blue</span>
          <span class="${HUD_PILL} ${HUD_PILL_GREEN}">Green</span>
          <span class="${HUD_PILL} ${HUD_PILL_GOLD}">Gold</span>
          <span class="${HUD_PILL} ${HUD_PILL_RED}">Red</span>
        </div>
        <div class="atom-row">
          <span class="atom-caption">icon pill</span>
          <span class="${HUD_PILL} ${HUD_PILL_GOLD}">
            ${this.renderSampleIcon(sampleGoldCoinIcon, "h-[13px] w-[13px]")}
            <span class="${HUD_PILL_VALUE}">92K</span>
          </span>
          <span class="${HUD_PILL} ${HUD_PILL_GREEN}">
            ${this.renderSampleIcon(sampleSoldierIcon, "h-3.5 w-3.5")}
            <span class="${HUD_PILL_VALUE}">+18.4K/s</span>
          </span>
          <span class="${HUD_NOTIFICATION_PILL}">3</span>
        </div>
      </div>
    `;
  }

  private renderFormAtoms() {
    return html`
      <div class="kit-stage kit-stack">
        <div class="${HUD_FORM_ROW}">
          <label class="${HUD_FIELD_LABEL}">Input</label>
          <input class="${HUD_INPUT}" value="10.0K" />
        </div>
        <div class="${HUD_FORM_ROW}">
          <label class="${HUD_FIELD_LABEL}">Select</label>
          <select class="${HUD_SELECT}">
            <option>Troops</option>
            <option>Biomass</option>
            <option>Metals</option>
          </select>
        </div>
        <div class="${HUD_FORM_ROW}">
          <label class="${HUD_FIELD_LABEL}">Range</label>
          <input class="${HUD_RANGE}" type="range" value="25" />
        </div>
        <div class="${HUD_FORM_ROW}">
          <label class="${HUD_FIELD_LABEL}">Dual</label>
          ${this.renderDualRange()}
        </div>
        <div class="${HUD_FORM_ROW}">
          <label class="${HUD_FIELD_LABEL}">Blend</label>
          ${this.renderBlendDualRangeSample()}
        </div>
      </div>
    `;
  }

  private renderDualRange() {
    return html`
      <div class="${HUD_DUAL_RANGE}" translate="no">
        <div class="${HUD_DUAL_RANGE_TRACK}"></div>
        <div
          class="${HUD_DUAL_RANGE_FILL}"
          style="left: ${this.dualRangeStart}%; right: ${100 -
          this.dualRangeEnd}%"
        ></div>
        <input
          class="${HUD_DUAL_RANGE_INPUT}"
          type="range"
          min="0"
          max="100"
          .value=${String(this.dualRangeStart)}
          @input=${(e: Event) => this.setDualRangeStart(e)}
          aria-label="Range start"
        />
        <input
          class="${HUD_DUAL_RANGE_INPUT}"
          type="range"
          min="0"
          max="100"
          .value=${String(this.dualRangeEnd)}
          @input=${(e: Event) => this.setDualRangeEnd(e)}
          aria-label="Range end"
        />
        <div
          class="pointer-events-none absolute -bottom-3 flex -translate-x-1/2 gap-1 text-[10px] text-slate-300"
          style="left: ${(this.dualRangeStart + this.dualRangeEnd) / 2}%"
        >
          <span>${this.dualRangeStart}</span>
          <span>-</span>
          <span>${this.dualRangeEnd}</span>
        </div>
      </div>
    `;
  }

  private setDualRangeStart(e: Event) {
    const value = Number((e.target as HTMLInputElement).value);
    this.dualRangeStart = Math.min(value, this.dualRangeEnd - 1);
  }

  private setDualRangeEnd(e: Event) {
    const value = Number((e.target as HTMLInputElement).value);
    this.dualRangeEnd = Math.max(value, this.dualRangeStart + 1);
  }

  private renderMeterAtoms() {
    return html`
      <div class="kit-stage kit-stack">
        <div class="${HUD_METER}">
          <div class="${HUD_METER_STACK}">
            <div
              class="${HUD_METER_FILL} bg-malibu-blue"
              style="width: 68%"
            ></div>
            <div class="${HUD_METER_FILL} bg-aquarius" style="width: 9%"></div>
          </div>
          <div class="${HUD_METER_TEXT} justify-center">1.8M / 2.6M</div>
        </div>
        <div class="${HUD_MINI_METER}">
          <div class="${HUD_METER_STACK}">
            <div class="${HUD_METER_FILL} bg-sky-700" style="width: 68%"></div>
            <div
              class="${HUD_METER_FILL} bg-malibu-blue"
              style="width: 9%"
            ></div>
          </div>
          <div class="${HUD_METER_TEXT} justify-between px-1.5 text-[10px]">
            <span>1.8M</span><span>2.6M</span>
          </div>
        </div>
      </div>
    `;
  }

  private renderTableAtoms() {
    return html`
      <div class="kit-stage">
        <table class="${HUD_COMPACT_TABLE}">
          <thead>
            <tr>
              <th class="${HUD_TH} text-left">Name</th>
              <th class="${HUD_TH}">Owned</th>
              <th class="${HUD_TH}">Gold</th>
              <th class="${HUD_TH}">Max</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td class="${HUD_TD_LEFT}">Blue Harbor</td>
              <td class="${HUD_TD}">25.4%</td>
              <td class="${HUD_TD}">92K</td>
              <td class="${HUD_TD}">1.9M</td>
            </tr>
            <tr>
              <td class="${HUD_TD_LEFT}">Red March</td>
              <td class="${HUD_TD}">18.2%</td>
              <td class="${HUD_TD}">107K</td>
              <td class="${HUD_TD}">1.3M</td>
            </tr>
          </tbody>
        </table>
      </div>
    `;
  }

  private renderAttackRowMolecule() {
    return html`
      <div class="kit-stage">
        <div class="attack-row-sample">
          <div class="attack-row-main">
            <span class="atom-icon md">S</span>
            <span class="atom-icon md"
              >${renderLucideIcon(ChevronUp, "h-3.5 w-3.5")}</span
            >
            <span class="atom-label number w-[5ch] text-left">10.0K</span>
            <span class="atom-label text">East March</span>
          </div>
          <span class="atom-icon md"
            >${renderLucideIcon(X, "h-3.5 w-3.5")}</span
          >
        </div>
      </div>
    `;
  }

  private renderControlPanelMolecules() {
    return html`
      <div class="kit-stage kit-stack">
        <div class="${HUD_SEGMENTED} w-full">
          ${this.renderMetricTabSample(
            sampleSoldierIcon,
            "Troops",
            "1.8M",
            "text-blue-200",
            true,
          )}
          ${this.renderMetricTabSample(
            sampleBiomassIcon,
            "Biomass",
            "54K",
            "text-green-300",
          )}
          ${this.renderMetricTabSample(
            sampleFuelIcon,
            "Fuels",
            "42K",
            "text-cyan-300",
          )}
          ${this.renderMetricTabSample(
            sampleMetalIcon,
            "Metals",
            "64K",
            "text-stone-200",
          )}
        </div>
        <div class="atom-row">
          <span class="${HUD_PILL} ${HUD_PILL_GREEN}">
            ${this.renderSampleIcon(sampleSoldierIcon, "h-3.5 w-3.5")}
            <span class="${HUD_PILL_VALUE}">+18.4K/s</span>
          </span>
          <div class="${HUD_METER} flex-1">
            <div class="${HUD_METER_STACK}">
              <div
                class="${HUD_METER_FILL} bg-malibu-blue"
                style="width: 68%"
              ></div>
              <div
                class="${HUD_METER_FILL} bg-aquarius"
                style="width: 9%"
              ></div>
            </div>
            <div class="${HUD_METER_TEXT} justify-center">1.8M / 2.6M</div>
          </div>
          <span class="${HUD_PILL} ${HUD_PILL_GOLD}">
            ${this.renderSampleIcon(sampleGoldCoinIcon, "h-[13px] w-[13px]")}
            <span class="${HUD_PILL_VALUE}">92K</span>
          </span>
        </div>
        <div class="${HUD_CONTROL_ROW}">
          <span class="${HUD_ATTACK_RATIO_PILL}">
            ${this.renderSampleIcon(sampleSwordIcon, "h-3 w-3")}
            <span class="text-white ${HUD_PILL_VALUE}">25% (450K)</span>
          </span>
          <input class="${HUD_RANGE}" type="range" value="25" />
        </div>
        <div class="${HUD_BLEND_ROW}">
          <div class="${HUD_BLEND_LABEL} w-[7.75rem] text-xs">Import Blend</div>
          ${this.renderBlendDualRangeSample()}
        </div>
      </div>
    `;
  }

  private renderBlendDualRangeSample() {
    const biomass = this.blendRangeFirst;
    const fuel = this.blendRangeSecond - this.blendRangeFirst;
    const metal = 100 - this.blendRangeSecond;

    return html`
      <div class="${HUD_DUAL_RANGE} h-9" translate="no">
        <div
          class="absolute left-0 right-0 top-3 h-1.5 -translate-y-1/2 overflow-hidden rounded-full border border-white/20 bg-slate-950/50"
        >
          <div class="flex h-full">
            <div class="h-full bg-green-500" style="width: ${biomass}%"></div>
            <div class="h-full bg-cyan-500" style="width: ${fuel}%"></div>
            <div class="h-full bg-stone-300" style="width: ${metal}%"></div>
          </div>
        </div>
        <input
          class="${HUD_DUAL_RANGE_INPUT} blend-range-input"
          type="range"
          min="0"
          max="100"
          .value=${String(this.blendRangeFirst)}
          @input=${(e: Event) => this.setBlendRangeFirst(e)}
          aria-label="Biomass and fuel split"
        />
        <input
          class="${HUD_DUAL_RANGE_INPUT} blend-range-input"
          type="range"
          min="0"
          max="100"
          .value=${String(this.blendRangeSecond)}
          @input=${(e: Event) => this.setBlendRangeSecond(e)}
          aria-label="Fuel and metal split"
        />
        <div
          class="pointer-events-none absolute bottom-0 left-0 right-0 flex overflow-hidden text-[10px] font-bold leading-none tabular-nums text-slate-200"
        >
          <span
            class="flex min-w-0 items-center justify-center gap-0.5 overflow-hidden whitespace-nowrap"
            style="width: ${biomass}%"
          >
            ${biomass >= 8
              ? this.renderBlendSegmentSample(sampleBiomassIcon, `${biomass}%`)
              : ""}
          </span>
          <span
            class="flex min-w-0 items-center justify-center gap-0.5 overflow-hidden whitespace-nowrap"
            style="width: ${fuel}%"
          >
            ${fuel >= 8
              ? this.renderBlendSegmentSample(sampleFuelIcon, `${fuel}%`)
              : ""}
          </span>
          <span
            class="flex min-w-0 items-center justify-center gap-0.5 overflow-hidden whitespace-nowrap"
            style="width: ${metal}%"
          >
            ${metal >= 8
              ? this.renderBlendSegmentSample(sampleMetalIcon, `${metal}%`)
              : ""}
          </span>
        </div>
      </div>
    `;
  }

  private setBlendRangeFirst(e: Event) {
    const value = Number((e.target as HTMLInputElement).value);
    this.blendRangeFirst = Math.min(value, this.blendRangeSecond - 1);
  }

  private setBlendRangeSecond(e: Event) {
    const value = Number((e.target as HTMLInputElement).value);
    this.blendRangeSecond = Math.max(value, this.blendRangeFirst + 1);
  }

  private renderEventsMolecules() {
    return html`
      <div class="kit-stage kit-stack">
        <div class="${HUD_SEGMENTED} w-fit">
          <button class="${HUD_SEGMENT_ACTIVE} ${HUD_ICON_BUTTON}">
            ${this.renderPlainIcon(sampleSwordIcon)}
          </button>
          <button class="${HUD_ICON_BUTTON}">
            ${this.renderPlainIcon(sampleNukeIcon)}
          </button>
          <button class="${HUD_ICON_BUTTON}">
            ${this.renderPlainIcon(sampleAllianceIcon)}
          </button>
          <button class="${HUD_ICON_BUTTON}">
            ${this.renderPlainIcon(sampleChatIcon)}
          </button>
        </div>
        <div class="${HUD_EVENT_ROW}">
          <span class="${HUD_EVENT_META}">00:42</span>
          <span class="${HUD_EVENT_TEXT} text-red-300">
            Red requested attack on Delta.
          </span>
          <span class="${HUD_ACTION_GROUP}">
            <button class="${HUD_BUTTON}">Focus</button>
            <button class="${HUD_BUTTON}">Accept</button>
          </span>
        </div>
        <div class="atom-row">
          <span class="${HUD_NOTIFICATION_PILL}">3</span>
          <span class="${HUD_PILL} ${HUD_PILL_GOLD}">
            ${this.renderSampleIcon(sampleGoldCoinIcon, "h-[13px] w-[13px]")}
            <span class="${HUD_PILL_VALUE}">+12.4K</span>
          </span>
        </div>
      </div>
    `;
  }

  private renderUnitDisplayMolecules() {
    return html`
      <div class="kit-stage kit-stack">
        <div class="${HUD_BUILD_STRIP}">
          ${this.renderBuildItemSample("1", sampleSoldierIcon, "9", true)}
          ${this.renderBuildItemSample("2", sampleBiomassIcon, "6")}
          ${this.renderBuildItemSample("3", sampleFuelIcon, "3")}
          ${this.renderBuildItemSample("4", "", "R")}
        </div>
        <div class="${HUD_TOOLTIP}">
          <div class="${HUD_TOOLTIP_TITLE}">Factory [2]</div>
          <div>Improves nearby resource production.</div>
          <div class="mt-1 text-yellow-300">34 / 18 / 11</div>
        </div>
      </div>
    `;
  }

  private renderPlayerInfoMolecules() {
    return html`
      <div class="kit-stage kit-stack">
        <div class="${HUD_IDENTITY_ROW}">
          <div class="${HUD_IDENTITY_NAME} text-aquarius">
            <span class="h-4 w-6 rounded-[1px] bg-sky-500"></span>
            <span class="truncate">Blue Harbor</span>
            <span class="${HUD_ICON_CLUSTER}">
              ${this.renderPlainIcon(sampleAllianceIcon, "h-4 w-4")}
              <span translate="no">🙂</span>
            </span>
          </div>
          <span class="${HUD_PILL} ${HUD_PILL_BLUE}">
            ${this.renderSampleIcon(sampleAllianceIcon, "h-3 w-3")}
            <span class="${HUD_PILL_VALUE}">01:24</span>
          </span>
        </div>
        <div class="atom-row">
          <span class="${HUD_PILL} ${HUD_PILL_GOLD}">
            ${this.renderSampleIcon(sampleGoldCoinIcon, "h-[13px] w-[13px]")}
            <span class="${HUD_PILL_VALUE}">92K</span>
          </span>
          <span class="${HUD_PILL} ${HUD_PILL_BLUE}">
            ${this.renderSampleIcon(sampleSoldierIcon, "h-3 w-3")}
            <span class="${HUD_PILL_VALUE}">245K</span>
          </span>
        </div>
        <div class="${HUD_MINI_METER}">
          <div class="${HUD_METER_STACK}">
            <div class="${HUD_METER_FILL} bg-sky-700" style="width: 68%"></div>
            <div
              class="${HUD_METER_FILL} bg-malibu-blue"
              style="width: 9%"
            ></div>
          </div>
          <div class="${HUD_METER_TEXT} justify-between px-1.5 text-[10px]">
            <span>1.8M</span><span>2.6M</span>
          </div>
        </div>
      </div>
    `;
  }

  private renderSidebarEconomyMolecules() {
    return html`
      <div class="kit-stage kit-stack">
        <div class="${HUD_TOOLBAR}">
          <span class="${HUD_TIMER_LABEL}">09:42</span>
          <button class="${HUD_ICON_BUTTON}">
            ${this.renderPlainIcon(sampleLeaderboardIcon)}
          </button>
          <button class="${HUD_ICON_BUTTON}">
            ${this.renderPlainIcon(sampleSettingsIcon)}
          </button>
          <button class="${HUD_ICON_BUTTON}">
            ${this.renderPlainIcon(sampleExitIcon)}
          </button>
        </div>
        <div class="${HUD_SURFACE_BODY} p-0">
          <div class="flex items-center justify-between gap-2">
            <div class="font-semibold">Biomass</div>
            <div class="text-slate-200">54K / 120K</div>
          </div>
          <div class="mt-1 h-1.5 overflow-hidden rounded-[2px] bg-black/35">
            <div class="h-full bg-green-500" style="width: 45%"></div>
          </div>
          <div class="mt-2 ${HUD_STAT_GRID}">
            <div>
              <div class="${HUD_STAT_LABEL}">Net</div>
              <div class="${HUD_STAT_VALUE} text-emerald-300">+1.2K/s</div>
            </div>
            <div>
              <div class="${HUD_STAT_LABEL}">Prod</div>
              <div class="${HUD_STAT_VALUE} text-emerald-300">+2.0K/s</div>
            </div>
            <div>
              <div class="${HUD_STAT_LABEL}">Rail</div>
              <div class="${HUD_STAT_VALUE} text-slate-300">0/s</div>
            </div>
            <div>
              <div class="${HUD_STAT_LABEL}">Delta</div>
              <div class="${HUD_STAT_VALUE} text-red-300">-120/s</div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  private renderMetricTabSample(
    icon: string,
    label: string,
    value: string,
    toneClass: string,
    active = false,
  ) {
    return html`
      <button
        class="${HUD_SEGMENT} ${active ? HUD_SEGMENT_ACTIVE : ""} ${toneClass}"
      >
        <span class="${HUD_SEGMENT_CONTENT}">
          <span class="${HUD_SEGMENT_MAIN}">
            ${this.renderSampleIcon(icon, "h-3.5 w-3.5")}
            <span class="${HUD_SEGMENT_LABEL}">${label}</span>
          </span>
          <span class="${HUD_SEGMENT_VALUE}">${value}</span>
        </span>
      </button>
    `;
  }

  private renderBuildItemSample(
    hotkey: string,
    icon: string,
    value: string,
    active = false,
  ) {
    return html`
      <div class="${HUD_BUILD_ITEM} ${active ? HUD_BUILD_ITEM_ACTIVE : ""}">
        <div class="${HUD_BUILD_HOTKEY}">${hotkey}</div>
        ${icon
          ? html`<img src="${icon}" class="${HUD_BUILD_ICON}" />`
          : html`<span class="${HUD_BUILD_ICON}">R</span>`}
        <span class="w-[3ch] text-left text-xs leading-none tabular-nums"
          >${value}</span
        >
      </div>
    `;
  }

  private renderSampleIcon(src: string, sizeClass: string) {
    return html`<span
      class="${HUD_PILL_MASK_ICON} ${sizeClass}"
      style="mask-image: url('${src}'); -webkit-mask-image: url('${src}');"
      aria-hidden="true"
    ></span>`;
  }

  private renderPlainIcon(src: string, sizeClass = "h-4 w-4") {
    return html`<img src="${src}" class="shrink-0 ${sizeClass}" />`;
  }

  private renderBlendSegmentSample(icon: string, value: string) {
    return html`
      <span
        class="inline-flex items-center justify-center gap-0.5 text-[10px] font-bold leading-none tabular-nums drop-shadow-[0_1px_1px_rgba(0,0,0,0.85)] whitespace-nowrap"
      >
        ${this.renderSampleIcon(icon, "h-3 w-3")} ${value}
      </span>
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

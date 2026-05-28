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
  hudCatalogCategories,
  hudCatalogEntries,
  hudCatalogEntriesByCategory,
  hudIconCatalog,
} from "../ui/HudCatalog";
import "../ui/HudComponents";
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
  @state() private selectedMetric = "troops";
  @state() private selectedEventFilter = "attack";

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
    el.active = true;
    el._isVisible = true;
    el._hidden = false;
    el.latestGoldAmount = 12400n;
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

        hud-kit-stage[popover-preview] player-info-overlay > div {
          position: static !important;
          margin-top: 0 !important;
          transform: none !important;
        }

        hud-kit-stage[popover-preview] player-info-overlay > div > div {
          width: 100% !important;
        }
      </style>

      <hud-kit-page>
        <hud-kit-topbar
          title="HUD UI Catalog"
          detail="Every reusable HUD UI element, from primitives to composed panels."
        ></hud-kit-topbar>

        <hud-kit-catalog>
          ${this.catalogHeading(
            "Catalog",
            "single source of component metadata and examples",
          )}
          ${this.section(
            "Manifest",
            "categories, status, API coverage",
            this.renderCatalogManifest(),
          )}
          ${this.section(
            "Foundations",
            "tokens, icon registry, sizing guidance",
            this.renderFoundationCatalog(),
          )}
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
            "Advanced Controls",
            "tabs, command choice, selection states",
            this.renderAdvancedControlAtoms(),
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
            "Surfaces",
            "small shells and overlay primitives for future composites",
          )}
          ${this.section(
            "Layout Helpers",
            "stack, row, grid, split, scroll, states",
            this.renderLayoutSurfaceElements(),
          )}
          ${this.section(
            "Overlays",
            "modal and popover shells",
            this.renderOverlayElements(),
          )}
          ${this.section(
            "Feedback",
            "alert, toast, notice, confirm actions",
            this.renderFeedbackElements(),
          )}
          ${this.section(
            "Menus",
            "dropdown-style command list primitives",
            this.renderMenuElements(),
          )}
          ${this.catalogHeading(
            "Recipes",
            "small compositions made only from catalog elements",
          )}
          ${this.section(
            "Composition Recipes",
            "resource row, modal footer, feed row",
            this.renderRecipeElements(),
          )}
          ${this.catalogHeading(
            "Complete Components",
            "live composites in constrained stages",
          )}
          ${this.section(
            "Left Sidebar",
            "420 x 360, fixed-position sandbox",
            html`<hud-kit-stage preview style="--hud-kit-stage-height: 360px">
              <game-left-sidebar></game-left-sidebar>
            </hud-kit-stage>`,
          )}
          ${this.section(
            "Leaderboard",
            "320 x 240",
            html`<hud-kit-stage
              preview
              align="top"
              style="--hud-kit-stage-height: 240px"
            >
              <hud-kit-frame style="--hud-kit-frame-width: 320px">
                <leader-board></leader-board>
              </hud-kit-frame>
            </hud-kit-stage>`,
          )}
          ${this.section(
            "Team Stats",
            "320 x 180",
            html`<hud-kit-stage
              preview
              align="top"
              style="--hud-kit-stage-height: 180px"
            >
              <hud-kit-frame style="--hud-kit-frame-width: 320px">
                <team-stats></team-stats>
              </hud-kit-frame>
            </hud-kit-stage>`,
          )}
          ${this.section(
            "Control Panel",
            "500 x 140",
            html`<hud-kit-stage
              preview
              align="center"
              style="--hud-kit-stage-height: 140px"
            >
              <hud-kit-frame shell style="--hud-kit-frame-width: 500px">
                ${this.renderControlPanelComposite()}
              </hud-kit-frame>
            </hud-kit-stage>`,
          )}
          ${this.section(
            "Unit Display",
            "500 x 64",
            html`<hud-kit-stage
              preview
              align="center"
              style="--hud-kit-stage-height: 96px"
            >
              <hud-kit-frame shell style="--hud-kit-frame-width: 500px">
                <unit-display></unit-display>
              </hud-kit-frame>
            </hud-kit-stage>`,
          )}
          ${this.section(
            "Attacks Display",
            "500 x 140",
            html`<hud-kit-stage
              preview
              align="center"
              style="--hud-kit-stage-height: 140px"
            >
              <hud-kit-frame style="--hud-kit-frame-width: 500px">
                <attacks-display></attacks-display>
              </hud-kit-frame>
            </hud-kit-stage>`,
          )}
          ${this.section(
            "Events Display",
            "384 x 240",
            html`<hud-kit-stage
              preview
              align="top"
              style="--hud-kit-stage-height: 240px"
            >
              <hud-kit-frame style="--hud-kit-frame-width: 384px">
                <events-display></events-display>
              </hud-kit-frame>
            </hud-kit-stage>`,
          )}
          ${this.section(
            "Right Sidebar",
            "320 x 64",
            html`<hud-kit-stage
              preview
              align="center"
              style="--hud-kit-stage-height: 96px"
            >
              <hud-kit-frame style="--hud-kit-frame-width: 320px">
                <game-right-sidebar></game-right-sidebar>
              </hud-kit-frame>
            </hud-kit-stage>`,
          )}
          ${this.section(
            "Replay Panel",
            "320 x 96",
            html`<hud-kit-stage
              preview
              align="center"
              style="--hud-kit-stage-height: 140px"
            >
              <hud-kit-frame style="--hud-kit-frame-width: 320px">
                <replay-panel></replay-panel>
              </hud-kit-frame>
            </hud-kit-stage>`,
          )}
          ${this.section(
            "Player Popover",
            "500 x 180, fixed-position sandbox",
            html`<hud-kit-stage
              popover-preview
              preview
              align="center"
              style="--hud-kit-stage-height: 180px"
            >
              <hud-kit-frame shell style="--hud-kit-frame-width: 500px">
                <player-info-overlay></player-info-overlay>
              </hud-kit-frame>
            </hud-kit-stage>`,
          )}
        </hud-kit-catalog>
      </hud-kit-page>
    `;
  }

  private catalogHeading(title: string, detail: string) {
    return html`<hud-kit-heading
      .title=${title}
      .detail=${detail}
    ></hud-kit-heading>`;
  }

  private renderCatalogManifest() {
    return html`<hud-kit-stage stack>
      <hud-stat-grid columns="4">
        <hud-stat
          label="Entries"
          .value=${String(hudCatalogEntries.length)}
        ></hud-stat>
        <hud-stat
          label="Elements"
          .value=${String(
            hudCatalogEntries.filter((entry) => entry.tagName).length,
          )}
        ></hud-stat>
        <hud-stat
          label="Icons"
          .value=${String(hudIconCatalog.length)}
        ></hud-stat>
        <hud-stat label="Statuses" value="5"></hud-stat>
      </hud-stat-grid>
      <hud-grid columns="2">
        ${hudCatalogCategories
          .filter((category) => hudCatalogEntriesByCategory(category).length)
          .map(
            (category) =>
              html`<hud-list-row>
                <hud-label slot="leading" tone="active">${category}</hud-label>
                <span
                  >${hudCatalogEntriesByCategory(category).length} entries</span
                >
                <hud-label slot="meta" tone="muted">cataloged</hud-label>
              </hud-list-row>`,
          )}
      </hud-grid>
    </hud-kit-stage>`;
  }

  private renderFoundationCatalog() {
    return html`<hud-kit-stage stack>
      <hud-grid columns="3">
        <hud-color-swatch color="#38bdf8" label="active"></hud-color-swatch>
        <hud-color-swatch color="#86efac" label="success"></hud-color-swatch>
        <hud-color-swatch color="#fde68a" label="gold"></hud-color-swatch>
        <hud-color-swatch color="#fdba74" label="warning"></hud-color-swatch>
        <hud-color-swatch color="#fca5a5" label="danger"></hud-color-swatch>
        <hud-color-swatch color="#94a3b8" label="muted"></hud-color-swatch>
      </hud-grid>
      <hud-kit-icon-gallery>
        ${hudIconCatalog.map(
          (entry) =>
            html`<hud-kit-icon-sample
              .label=${entry.name}
              .iconSrc=${assetUrl(entry.assetPath)}
              title=${entry.usage}
            ></hud-kit-icon-sample>`,
        )}
      </hud-kit-icon-gallery>
    </hud-kit-stage>`;
  }

  private renderHeaderAtoms() {
    return html`
      <hud-kit-stage>
        <hud-surface style="width: 100%; max-width: 260px">
          <hud-surface-header>
            <hud-label>SECTION HEADER</hud-label>
            <hud-label tone="muted">meta</hud-label>
          </hud-surface-header>
          <hud-surface-body>surface body</hud-surface-body>
        </hud-surface>
      </hud-kit-stage>
    `;
  }

  private renderSurfaceControlAtoms() {
    return html`
      <hud-kit-stage>
        <hud-kit-row>
          <hud-kit-caption>surface</hud-kit-caption>
          <hud-surface style="width: 180px">
            <hud-surface-header>PANEL HEADER</hud-surface-header>
            <hud-surface-body>panel body</hud-surface-body>
          </hud-surface>
        </hud-kit-row>
        <hud-kit-row style="margin-top: 10px">
          <hud-kit-caption>control</hud-kit-caption>
          <hud-button>ACTION</hud-button>
          <hud-icon-button label="Close">
            ${renderLucideIcon(X, "h-4 w-4")}
          </hud-icon-button>
        </hud-kit-row>
      </hud-kit-stage>
    `;
  }

  private renderIconAtoms() {
    return html`
      <hud-kit-stage stack>
        <hud-kit-row>
          <hud-kit-caption>sizes</hud-kit-caption>
          <hud-icon .src=${sampleSwordIcon} size="sm" label="Small"></hud-icon>
          <hud-icon .src=${sampleSwordIcon} size="md" label="Medium"></hud-icon>
          <hud-icon .src=${sampleSwordIcon} size="lg" label="Large"></hud-icon>
          <hud-icon
            .src=${sampleSwordIcon}
            size="xl"
            label="Extra large"
          ></hud-icon>
        </hud-kit-row>
        <hud-kit-row>
          <hud-kit-caption>red</hud-kit-caption>
          <hud-icon .src=${sampleSwordIcon} tone="red" size="sm"></hud-icon>
          <hud-icon .src=${sampleSwordIcon} tone="red" size="md"></hud-icon>
          <hud-icon .src=${sampleSwordIcon} tone="red" size="lg"></hud-icon>
          <hud-icon .src=${sampleSwordIcon} tone="red" size="xl"></hud-icon>
        </hud-kit-row>
        <hud-kit-row>
          <hud-kit-caption>action</hud-kit-caption>
          ${renderLucideIcon(ChevronUp, "h-5 w-5")}
          <hud-label tone="red">${renderLucideIcon(X, "h-5 w-5")}</hud-label>
        </hud-kit-row>
        <hud-kit-icon-gallery>
          ${hudIconSamples.map(
            ([label, src]) => html`
              <hud-kit-icon-sample
                .label=${label}
                .iconSrc=${src}
                title=${label}
              ></hud-kit-icon-sample>
            `,
          )}
        </hud-kit-icon-gallery>
      </hud-kit-stage>
    `;
  }

  private renderLabelAtoms() {
    return html`
      <hud-kit-stage stack>
        <hud-kit-row>
          <hud-kit-caption>number</hud-kit-caption>
          <hud-number value="1000" format></hud-number>
          <hud-number value="10000" format></hud-number>
          <hud-number value="100000" format></hud-number>
          <hud-number value="1000000" format></hud-number>
        </hud-kit-row>
        <hud-kit-row>
          <hud-kit-caption>label</hud-kit-caption>
          <hud-label>East March</hud-label>
          <hud-label tone="muted">Wilderness</hud-label>
          <hud-label tone="active">Very Long Player Name</hud-label>
        </hud-kit-row>
      </hud-kit-stage>
    `;
  }

  private renderButtonAtoms() {
    return html`
      <hud-kit-stage stack>
        <hud-kit-row>
          <hud-kit-caption>button</hud-kit-caption>
          <hud-button>Default</hud-button>
          <hud-button variant="active">Active</hud-button>
          <hud-button variant="danger">Danger</hud-button>
        </hud-kit-row>
        <hud-kit-row>
          <hud-kit-caption>icon</hud-kit-caption>
          <hud-icon-button label="Settings">
            <hud-icon .src=${sampleSettingsIcon} size="sm"></hud-icon>
          </hud-icon-button>
          <hud-icon-button label="Exit">
            <hud-icon .src=${sampleExitIcon} size="sm"></hud-icon>
          </hud-icon-button>
          <hud-icon-button label="Leaderboard">
            <hud-icon .src=${sampleLeaderboardIcon} size="sm"></hud-icon>
          </hud-icon-button>
        </hud-kit-row>
      </hud-kit-stage>
    `;
  }

  private renderPillAtoms() {
    return html`
      <hud-kit-stage stack>
        <hud-kit-row>
          <hud-kit-caption>pill</hud-kit-caption>
          <hud-pill value="Neutral"></hud-pill>
          <hud-pill value="Blue" tone="blue"></hud-pill>
          <hud-pill value="Green" tone="green"></hud-pill>
          <hud-pill value="Gold" tone="gold"></hud-pill>
          <hud-pill value="Red" tone="red"></hud-pill>
        </hud-kit-row>
        <hud-kit-row>
          <hud-kit-caption>icon pill</hud-kit-caption>
          <hud-pill
            value="92K"
            tone="gold"
            icon-src=${sampleGoldCoinIcon}
          ></hud-pill>
          <hud-pill
            value="+18.4K/s"
            tone="green"
            icon-src=${sampleSoldierIcon}
          ></hud-pill>
          <hud-pill value="3" tone="red"></hud-pill>
        </hud-kit-row>
      </hud-kit-stage>
    `;
  }

  private renderFormAtoms() {
    return html`
      <hud-kit-stage stack>
        <hud-form-row>
          <hud-field-label>Input</hud-field-label>
          <hud-input value="10.0K"></hud-input>
        </hud-form-row>
        <hud-form-row>
          <hud-field-label>Select</hud-field-label>
          <hud-select
            value="troops"
            .options=${[
              { label: "Troops", value: "troops" },
              { label: "Biomass", value: "biomass" },
              { label: "Metals", value: "metals" },
            ]}
          ></hud-select>
        </hud-form-row>
        <hud-form-row>
          <hud-field-label>Range</hud-field-label>
          <hud-range value="25" label="Single range"></hud-range>
        </hud-form-row>
        <hud-form-row>
          <hud-field-label>Dual</hud-field-label>
          ${this.renderDualRange()}
        </hud-form-row>
        <hud-form-row>
          <hud-field-label>Blend</hud-field-label>
          ${this.renderBlendDualRangeSample()}
        </hud-form-row>
      </hud-kit-stage>
    `;
  }

  private renderAdvancedControlAtoms() {
    return html`<hud-kit-stage stack>
      <hud-tabs
        selected="intel"
        .items=${[
          { id: "intel", label: "Intel" },
          { id: "trade", label: "Trade" },
          { id: "locked", label: "Locked", disabled: true },
        ]}
      ></hud-tabs>
      <hud-kit-row>
        <hud-command-choice selected value="A">
          <hud-icon slot="icon" .src=${sampleSwordIcon} size="sm"></hud-icon>
          Attack
          <hud-label slot="meta" tone="active">25%</hud-label>
        </hud-command-choice>
        <hud-command-choice value="3">
          <hud-icon slot="icon" .src=${sampleAllianceIcon} size="sm"></hud-icon>
          Ally
        </hud-command-choice>
        <hud-command-choice locked value="L">
          <hud-icon slot="icon" .src=${sampleNukeIcon} size="sm"></hud-icon>
          Locked
        </hud-command-choice>
      </hud-kit-row>
    </hud-kit-stage>`;
  }

  private renderDualRange() {
    return html`<hud-dual-range
      .start=${this.dualRangeStart}
      .end=${this.dualRangeEnd}
      start-label="Range start"
      end-label="Range end"
      @range-change=${this.setDualRange}
    >
      <hud-range-readout
        .start=${this.dualRangeStart}
        .end=${this.dualRangeEnd}
      ></hud-range-readout>
    </hud-dual-range>`;
  }

  private setDualRange(
    event: CustomEvent<{ start: number; end: number; changed: string }>,
  ) {
    if (event.detail.changed === "start") {
      this.setDualRangeStart(event.detail.start);
    } else {
      this.setDualRangeEnd(event.detail.end);
    }
  }

  private setDualRangeStart(value: number) {
    this.dualRangeStart = Math.min(value, this.dualRangeEnd - 1);
  }

  private setDualRangeEnd(value: number) {
    this.dualRangeEnd = Math.max(value, this.dualRangeStart + 1);
  }

  private renderMeterAtoms() {
    return html`
      <hud-kit-stage stack>
        <hud-meter
          .segments=${[
            { width: 68, tone: "blue" },
            { width: 9, tone: "cyan" },
          ]}
          label="1.8M / 2.6M"
        ></hud-meter>
        <hud-meter
          variant="mini"
          .segments=${[
            { width: 68, tone: "slate" },
            { width: 9, tone: "blue" },
          ]}
          .label=${html`<hud-label>1.8M</hud-label>
            <hud-label>2.6M</hud-label>`}
          label-align="between"
        ></hud-meter>
      </hud-kit-stage>
    `;
  }

  private renderTableAtoms() {
    return html`
      <hud-kit-stage stack>
        <hud-table>
          <hud-table-row>
            <hud-table-cell header align="left">Name</hud-table-cell>
            <hud-table-cell header>Owned</hud-table-cell>
            <hud-table-cell header>Gold</hud-table-cell>
            <hud-table-cell header>Max</hud-table-cell>
          </hud-table-row>
          <hud-table-row>
            <hud-table-cell align="left">Blue Harbor</hud-table-cell>
            <hud-table-cell>25.4%</hud-table-cell>
            <hud-table-cell>92K</hud-table-cell>
            <hud-table-cell>1.9M</hud-table-cell>
          </hud-table-row>
          <hud-table-row>
            <hud-table-cell align="left">Red March</hud-table-cell>
            <hud-table-cell>18.2%</hud-table-cell>
            <hud-table-cell>107K</hud-table-cell>
            <hud-table-cell>1.3M</hud-table-cell>
          </hud-table-row>
        </hud-table>
        <hud-list-row selected>
          <hud-label slot="leading">#2</hud-label>
          East March
          <hud-label slot="meta">18.2%</hud-label>
          <hud-button slot="actions">View</hud-button>
        </hud-list-row>
      </hud-kit-stage>
    `;
  }

  private renderAttackRowMolecule() {
    return html`
      <hud-kit-stage>
        <hud-attack-row tone="blue" amount="10.0K" label="East March">
          <hud-icon
            slot="primary-icon"
            .src=${sampleSoldierIcon}
            size="md"
            tone="active"
          ></hud-icon>
          <hud-label slot="direction-icon">
            ${renderLucideIcon(ChevronUp, "h-3.5 w-3.5")}
          </hud-label>
          <hud-icon-button slot="action" label="Cancel">
            ${renderLucideIcon(X, "h-3.5 w-3.5")}
          </hud-icon-button>
        </hud-attack-row>
      </hud-kit-stage>
    `;
  }

  private renderControlPanelMolecules() {
    return html`<hud-kit-stage
      >${this.renderControlPanelComposite()}</hud-kit-stage
    >`;
  }

  private renderControlPanelComposite() {
    return html`
      <hud-control-panel>
        <hud-segmented-control
          .selected=${this.selectedMetric}
          .items=${[
            {
              id: "troops",
              label: "Troops",
              value: "1.8M",
              iconSrc: sampleSoldierIcon,
              tone: "active",
            },
            {
              id: "biomass",
              label: "Biomass",
              value: "54K",
              iconSrc: sampleBiomassIcon,
              tone: "success",
            },
            {
              id: "fuel",
              label: "Fuels",
              value: "42K",
              iconSrc: sampleFuelIcon,
              tone: "active",
            },
            {
              id: "metal",
              label: "Metals",
              value: "64K",
              iconSrc: sampleMetalIcon,
              tone: "default",
            },
          ]}
          @selection-change=${this.setSelectedMetric}
        ></hud-segmented-control>
        <hud-kit-row>
          <hud-pill
            value="+18.4K/s"
            tone="green"
            icon-src=${sampleSoldierIcon}
          ></hud-pill>
          <hud-meter
            style="flex: 1 1 auto; min-width: 120px"
            variant="mini"
            .segments=${[
              { width: 68, tone: "blue" },
              { width: 9, tone: "cyan" },
            ]}
            .label=${html`<hud-label>1.8M</hud-label>
              <hud-label>2.6M</hud-label>`}
            label-align="between"
          ></hud-meter>
          <hud-pill
            value="92K"
            tone="gold"
            icon-src=${sampleGoldCoinIcon}
          ></hud-pill>
        </hud-kit-row>
        <hud-form-row>
          <hud-pill
            value="25% (450K)"
            tone="blue"
            icon-src=${sampleSwordIcon}
          ></hud-pill>
          <hud-range value="25" label="Attack ratio"></hud-range>
        </hud-form-row>
        <hud-form-row style="--hud-form-label-width: 7.75rem">
          <hud-field-label>Import Blend</hud-field-label>
          ${this.renderBlendDualRangeSample()}
        </hud-form-row>
      </hud-control-panel>
    `;
  }

  private renderBlendDualRangeSample() {
    const biomass = this.blendRangeFirst;
    const fuel = this.blendRangeSecond - this.blendRangeFirst;
    const metal = 100 - this.blendRangeSecond;

    return html`<hud-blend-slider
      .first=${this.blendRangeFirst}
      .second=${this.blendRangeSecond}
      .segments=${[
        {
          tone: "food",
          width: biomass,
          iconSrc: sampleBiomassIcon,
          label: `${biomass}%`,
        },
        {
          tone: "energy",
          width: fuel,
          iconSrc: sampleFuelIcon,
          label: `${fuel}%`,
        },
        {
          tone: "materials",
          width: metal,
          iconSrc: sampleMetalIcon,
          label: `${metal}%`,
        },
      ]}
      @blend-change=${this.setBlendRange}
    ></hud-blend-slider>`;
  }

  private setSelectedMetric(event: CustomEvent<{ id: string }>) {
    this.selectedMetric = event.detail.id;
  }

  private setBlendRange(
    event: CustomEvent<{ first: number; second: number; changed: string }>,
  ) {
    if (event.detail.changed === "first") {
      this.setBlendRangeFirst(event.detail.first);
    } else {
      this.setBlendRangeSecond(event.detail.second);
    }
  }

  private setBlendRangeFirst(value: number) {
    this.blendRangeFirst = Math.min(value, this.blendRangeSecond - 1);
  }

  private setBlendRangeSecond(value: number) {
    this.blendRangeSecond = Math.max(value, this.blendRangeFirst + 1);
  }

  private renderEventsMolecules() {
    return html`
      <hud-kit-stage stack>
        <hud-segmented-control
          .selected=${this.selectedEventFilter}
          .items=${[
            {
              id: "attack",
              label: "Attack",
              iconSrc: sampleSwordIcon,
              tone: "danger",
            },
            {
              id: "nuke",
              label: "Nuke",
              iconSrc: sampleNukeIcon,
              tone: "warning",
            },
            {
              id: "alliance",
              label: "Alliance",
              iconSrc: sampleAllianceIcon,
              tone: "active",
            },
            {
              id: "chat",
              label: "Chat",
              iconSrc: sampleChatIcon,
              tone: "default",
            },
          ]}
          @selection-change=${this.setSelectedEventFilter}
        ></hud-segmented-control>
        <hud-event-row
          meta="00:42"
          text="Red requested attack on Delta."
          tone="red"
        >
          <hud-action-group slot="actions">
            <hud-button>Focus</hud-button>
            <hud-button variant="active">Accept</hud-button>
          </hud-action-group>
        </hud-event-row>
        <hud-kit-row>
          <hud-pill tone="red" value="3"></hud-pill>
          <hud-pill
            tone="gold"
            value="+12.4K"
            icon-src=${sampleGoldCoinIcon}
          ></hud-pill>
        </hud-kit-row>
      </hud-kit-stage>
    `;
  }

  private setSelectedEventFilter(event: CustomEvent<{ id: string }>) {
    this.selectedEventFilter = event.detail.id;
  }

  private renderUnitDisplayMolecules() {
    return html`
      <hud-kit-stage stack>
        <hud-unit-display>
          <hud-unit-button
            hotkey="1"
            icon-src=${sampleSoldierIcon}
            count="9"
            selected
          ></hud-unit-button>
          <hud-unit-button
            hotkey="2"
            icon-src=${sampleBiomassIcon}
            count="6"
          ></hud-unit-button>
          <hud-unit-button
            hotkey="3"
            icon-src=${sampleFuelIcon}
            count="3"
          ></hud-unit-button>
          <hud-unit-button hotkey="4" fallback="R" count="2"></hud-unit-button>
        </hud-unit-display>
        <hud-tooltip title="Factory [2]">
          <hud-label>Improves nearby resource production.</hud-label>
          <hud-label tone="gold">34 / 18 / 11</hud-label>
        </hud-tooltip>
      </hud-kit-stage>
    `;
  }

  private renderPlayerInfoMolecules() {
    return html`
      <hud-kit-stage stack>
        <hud-kit-row>
          <hud-player-identity
            name="Blue Harbor"
            icon-src=${sampleAllianceIcon}
            emoji="🙂"
            swatch-color="#0ea5e9"
          ></hud-player-identity>
          <hud-pill
            tone="blue"
            value="01:24"
            icon-src=${sampleAllianceIcon}
          ></hud-pill>
        </hud-kit-row>
        <hud-kit-row>
          <hud-pill
            tone="gold"
            value="92K"
            icon-src=${sampleGoldCoinIcon}
          ></hud-pill>
          <hud-pill
            tone="blue"
            value="245K"
            icon-src=${sampleSoldierIcon}
          ></hud-pill>
        </hud-kit-row>
        <hud-meter
          variant="mini"
          .segments=${[
            { width: 68, tone: "slate" },
            { width: 9, tone: "blue" },
          ]}
          .label=${html`<hud-label>1.8M</hud-label>
            <hud-label>2.6M</hud-label>`}
          label-align="between"
        ></hud-meter>
      </hud-kit-stage>
    `;
  }

  private renderSidebarEconomyMolecules() {
    return html`
      <hud-kit-stage stack>
        <hud-toolbar>
          <hud-timer-label value="09:42"></hud-timer-label>
          <hud-icon-button label="Leaderboard">
            <hud-icon .src=${sampleLeaderboardIcon} size="sm"></hud-icon>
          </hud-icon-button>
          <hud-icon-button label="Settings">
            <hud-icon .src=${sampleSettingsIcon} size="sm"></hud-icon>
          </hud-icon-button>
          <hud-icon-button label="Exit">
            <hud-icon .src=${sampleExitIcon} size="sm"></hud-icon>
          </hud-icon-button>
        </hud-toolbar>
        <hud-meter
          variant="mini"
          .segments=${[{ width: 45, tone: "green" }]}
          .label=${html`<hud-label>Biomass</hud-label>
            <hud-label>54K / 120K</hud-label>`}
          label-align="between"
        ></hud-meter>
        <hud-stat-grid>
          <hud-stat label="Net" value="+1.2K/s" tone="green"></hud-stat>
          <hud-stat label="Prod" value="+2.0K/s" tone="green"></hud-stat>
          <hud-stat label="Rail" value="0/s"></hud-stat>
          <hud-stat label="Delta" value="-120/s" tone="red"></hud-stat>
        </hud-stat-grid>
      </hud-kit-stage>
    `;
  }

  private renderLayoutSurfaceElements() {
    return html`<hud-kit-stage stack>
      <hud-surface>
        <hud-surface-header>
          <hud-label>Surface</hud-label>
          <hud-action-group>
            <hud-button>Apply</hud-button>
          </hud-action-group>
        </hud-surface-header>
        <hud-surface-body>
          <hud-stack density="compact">
            <hud-row justify="between">
              <hud-label>Stacked layout</hud-label>
              <hud-pill value="draft" tone="blue"></hud-pill>
            </hud-row>
            <hud-grid columns="2">
              <hud-stat label="Rows" value="4"></hud-stat>
              <hud-stat label="Gap" value="8px"></hud-stat>
            </hud-grid>
          </hud-stack>
        </hud-surface-body>
        <hud-surface-footer>
          <hud-button>Cancel</hud-button>
          <hud-button variant="active">Save</hud-button>
        </hud-surface-footer>
      </hud-surface>
      <hud-split>
        <hud-empty-state message="No events selected"></hud-empty-state>
        <hud-loading-state label="Syncing"></hud-loading-state>
      </hud-split>
    </hud-kit-stage>`;
  }

  private renderOverlayElements() {
    return html`<hud-kit-stage stack>
      <hud-popover>
        <hud-surface-header>
          <hud-label>Popover</hud-label>
          <hud-pill value="info" tone="blue"></hud-pill>
        </hud-surface-header>
        <hud-surface-body>
          <hud-list-row>
            <hud-icon
              slot="leading"
              .src=${sampleAllianceIcon}
              size="sm"
            ></hud-icon>
            East March relation
            <hud-label slot="meta" tone="active">friendly</hud-label>
          </hud-list-row>
        </hud-surface-body>
      </hud-popover>
      <hud-kit-frame shell style="--hud-kit-frame-width: 320px">
        <hud-modal-header>
          <hud-label>Modal shell</hud-label>
          <hud-icon-button label="Close">
            ${renderLucideIcon(X, "h-4 w-4")}
          </hud-icon-button>
        </hud-modal-header>
        <hud-modal-body>
          <hud-label tone="muted">
            Header, body, and footer can be used inside hud-modal-shell.
          </hud-label>
        </hud-modal-body>
        <hud-modal-footer>
          <hud-button>Cancel</hud-button>
          <hud-button variant="active">Confirm</hud-button>
        </hud-modal-footer>
      </hud-kit-frame>
    </hud-kit-stage>`;
  }

  private renderFeedbackElements() {
    return html`<hud-kit-stage stack>
      <hud-alert tone="info">
        <hud-icon slot="icon" .src=${sampleChatIcon} size="sm"></hud-icon>
        New alliance message received.
        <hud-button slot="actions">Open</hud-button>
      </hud-alert>
      <hud-alert tone="orange" compact>
        <hud-icon slot="icon" .src=${sampleNukeIcon} size="sm"></hud-icon>
        Silo reload delayed.
      </hud-alert>
      <hud-toast tone="green">
        <hud-icon slot="icon" .src=${sampleGoldCoinIcon} size="sm"></hud-icon>
        Trade route added.
      </hud-toast>
      <hud-confirm-actions>
        <hud-button slot="secondary">Cancel</hud-button>
        <hud-button variant="active">Apply</hud-button>
        <hud-button slot="danger" variant="danger">Delete</hud-button>
      </hud-confirm-actions>
    </hud-kit-stage>`;
  }

  private renderMenuElements() {
    return html`<hud-kit-stage>
      <hud-menu>
        <hud-surface-header>
          <hud-label>Actions</hud-label>
        </hud-surface-header>
        <hud-menu-item selected>
          <hud-icon slot="icon" .src=${sampleSwordIcon} size="sm"></hud-icon>
          Attack
          <hud-label slot="meta" tone="active">A</hud-label>
        </hud-menu-item>
        <hud-menu-item>
          <hud-icon slot="icon" .src=${sampleAllianceIcon} size="sm"></hud-icon>
          Alliance
          <hud-label slot="meta" tone="muted">F</hud-label>
        </hud-menu-item>
        <hud-menu-divider></hud-menu-divider>
        <hud-menu-item disabled>
          <hud-icon slot="icon" .src=${sampleNukeIcon} size="sm"></hud-icon>
          Launch
          <hud-label slot="meta" tone="orange">locked</hud-label>
        </hud-menu-item>
      </hud-menu>
    </hud-kit-stage>`;
  }

  private renderRecipeElements() {
    return html`<hud-kit-stage stack>
      <hud-surface>
        <hud-surface-body>
          <hud-form-row style="--hud-form-label-width: 6.5rem">
            <hud-field-label>Resource</hud-field-label>
            <hud-row>
              <hud-pill
                value="+18.4K/s"
                tone="green"
                icon-src=${sampleBiomassIcon}
              ></hud-pill>
              <hud-meter
                style="flex: 1 1 auto"
                variant="mini"
                .segments=${[{ width: 62, tone: "green" }]}
                .label=${html`<hud-label>54K</hud-label>
                  <hud-label>120K</hud-label>`}
                label-align="between"
              ></hud-meter>
            </hud-row>
          </hud-form-row>
        </hud-surface-body>
      </hud-surface>
      <hud-event-row meta="01:08" text="Recipe feed row with actions.">
        <hud-action-group slot="actions">
          <hud-button>Focus</hud-button>
          <hud-button variant="active">Accept</hud-button>
        </hud-action-group>
      </hud-event-row>
      <hud-surface-footer>
        <hud-button>Secondary</hud-button>
        <hud-button variant="active">Primary</hud-button>
      </hud-surface-footer>
    </hud-kit-stage>`;
  }

  private section(title: string, detail: string, content: unknown) {
    return html`<hud-kit-section .title=${title} .detail=${detail}>
      ${content}
    </hud-kit-section>`;
  }
}

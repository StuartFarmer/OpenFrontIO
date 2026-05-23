import { LitElement, html } from "lit";
import { customElement } from "lit/decorators.js";
import {
  GameMode,
  GameType,
  MessageCategory,
  MessageType,
  PlayerType,
  Relation,
  TerrainType,
  UnitType,
} from "../../../core/game/Game";
import type { UIState } from "../../UIState";
import "../layers/AttacksDisplay";
import "../layers/ChatDisplay";
import "../layers/ControlPanel";
import "../layers/EventsDisplay";
import "../layers/GameLeftSidebar";
import "../layers/GameRightSidebar";
import "../layers/Leaderboard";
import "../layers/PlayerInfoOverlay";
import "../layers/ReplayPanel";
import "../layers/TeamStats";
import "../layers/UnitDisplay";

export type MockPlayer = any;

export const noopEventBus = {
  emit: () => {},
  on: () => {},
};

export const uiState: UIState = {
  attackRatio: 0.25,
  ghostStructure: null,
  overlappingRailroads: [],
  ghostRailPaths: [],
  rocketDirectionUp: true,
  resourceImportBlend: { food: 34, energy: 33, materials: 33 },
  resourceExportBlend: { food: 34, energy: 33, materials: 33 },
};

export const resourceCost = {
  food: 120n,
  energy: 80n,
  materials: 160n,
};

export const buildables = [
  UnitType.City,
  UnitType.Factory,
  UnitType.Port,
  UnitType.DefensePost,
  UnitType.RailStation,
  UnitType.Silo,
  UnitType.Warship,
  UnitType.AtomBomb,
  UnitType.HydrogenBomb,
  UnitType.MIRV,
].map((type) => ({
  type,
  cost: 0n,
  resourceCost,
}));

export const playerData = [
  {
    id: "you",
    smallID: 1,
    name: "You",
    team: "Blue",
    type: PlayerType.Human,
    tiles: 2540,
    gold: 92000n,
    troops: 1900000,
    capacity: 2400000,
    rate: 7400,
    units: {
      [UnitType.City]: 9,
      [UnitType.Factory]: 6,
      [UnitType.Port]: 3,
      [UnitType.DefensePost]: 4,
      [UnitType.RailStation]: 5,
      [UnitType.Silo]: 2,
      [UnitType.MissileSilo]: 2,
      [UnitType.SAMLauncher]: 3,
      [UnitType.Warship]: 7,
    },
  },
  {
    id: "fracture",
    smallID: 2,
    name: "Fracture",
    team: "Red",
    type: PlayerType.Nation,
    tiles: 3180,
    gold: 148000n,
    troops: 2400000,
    capacity: 2900000,
    rate: 9100,
    units: {
      [UnitType.City]: 12,
      [UnitType.Factory]: 7,
      [UnitType.Port]: 4,
      [UnitType.MissileSilo]: 3,
      [UnitType.SAMLauncher]: 5,
      [UnitType.Warship]: 9,
    },
  },
  {
    id: "east",
    smallID: 3,
    name: "East March",
    team: "Blue",
    type: PlayerType.Human,
    tiles: 1820,
    gold: 107000n,
    troops: 1300000,
    capacity: 1750000,
    rate: 5300,
    units: {
      [UnitType.City]: 8,
      [UnitType.Factory]: 4,
      [UnitType.Port]: 2,
      [UnitType.MissileSilo]: 1,
      [UnitType.SAMLauncher]: 2,
      [UnitType.Warship]: 4,
    },
  },
  {
    id: "coast",
    smallID: 4,
    name: "Narrow Coast Federation",
    team: "Green",
    type: PlayerType.Nation,
    tiles: 970,
    gold: 41000n,
    troops: 812000,
    capacity: 1040000,
    rate: 3100,
    units: {
      [UnitType.City]: 5,
      [UnitType.Factory]: 2,
      [UnitType.Port]: 3,
      [UnitType.MissileSilo]: 0,
      [UnitType.SAMLauncher]: 1,
      [UnitType.Warship]: 2,
    },
  },
];

export const players = playerData.map(createMockPlayer);
export const myPlayer = players[0];

export const mockGame = {
  config: () => ({
    isReplay: () => true,
    isUnitDisabled: () => false,
    disableAlliances: () => false,
    maxTroops: (player: MockPlayer) => player.effectiveTroopCapacity(),
    gameConfig: () => ({
      gameType: GameType.Singleplayer,
      gameMode: GameMode.Team,
      maxTimerValue: undefined,
    }),
    theme: () => ({
      teamColor: (team: string) => ({
        toHex: () =>
          team === "Blue" ? "#38bdf8" : team === "Red" ? "#fb7185" : "#4ade80",
        toRgbString: () =>
          team === "Blue"
            ? "56, 189, 248"
            : team === "Red"
              ? "251, 113, 133"
              : "74, 222, 128",
      }),
    }),
  }),
  elapsedGameSeconds: () => 742,
  gameID: () => "HUD-DEMO",
  inSpawnPhase: () => false,
  myPlayer: () => myPlayer,
  numLandTiles: () => 10000,
  numTilesWithFallout: () => 0,
  playerBySmallID: (id: number) => players.find((p) => p.smallID() === id),
  playerViews: () => players,
  ticks: () => 1180,
  unit: () => undefined,
  width: () => 100,
  height: () => 100,
  ownerID: () => myPlayer.smallID(),
  terrainType: () => TerrainType.Plains,
};

@customElement("hud-live-components-demo")
export class HudLiveComponentsDemo extends LitElement {
  createRenderRoot() {
    return this;
  }

  firstUpdated() {
    this.seedComponents();
    requestAnimationFrame(() => this.seedComponents());
  }

  updated() {
    this.seedComponents();
  }

  private seedComponents() {
    this.seedLeftSidebar();
    this.seedLeaderboard();
    this.seedTeamStats();
    this.seedEvents();
    this.seedControlPanel();
    this.seedUnitDisplay();
    this.seedAttacks();
    this.seedRightSidebar();
    this.seedReplayPanel();
    this.seedPlayerInfo();
  }

  private seedLeftSidebar() {
    const el = this.querySelector("game-left-sidebar") as any;
    if (!el) return;
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
  }

  private seedLeaderboard() {
    const leaderboards = this.querySelectorAll(
      "leader-board",
    ) as NodeListOf<any>;
    leaderboards.forEach((el) => {
      el.visible = el.closest("game-left-sidebar") !== null;
      el.game = mockGame;
      el.eventBus = noopEventBus;
      el.players = [
        row(players[1], 1, "31.8%", "148K", "2.4M"),
        row(players[0], 2, "25.4%", "92K", "1.9M", true, true),
        row(players[2], 3, "18.2%", "107K", "1.3M", false, true),
        row(players[3], 4, "9.7%", "41K", "812K"),
      ];
      el.requestUpdate();
    });
  }

  private seedTeamStats() {
    const teamStats = this.querySelectorAll("team-stats") as NodeListOf<any>;
    teamStats.forEach((el) => {
      el.visible = el.closest("game-left-sidebar") !== null;
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
    });
  }

  private seedEvents() {
    const el = this.querySelector("events-display") as any;
    if (!el) return;
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

  private seedControlPanel() {
    const el = this.querySelector("control-panel") as any;
    if (!el) return;
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

  private seedUnitDisplay() {
    const el = this.querySelector("unit-display") as any;
    if (!el) return;
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

  private seedAttacks() {
    const el = this.querySelector("attacks-display") as any;
    if (!el) return;
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

  private seedRightSidebar() {
    const el = this.querySelector("game-right-sidebar") as any;
    if (!el) return;
    el.game = mockGame;
    el.eventBus = noopEventBus;
    el._isSinglePlayer = true;
    el._isVisible = true;
    el._isReplayVisible = true;
    el.timer = 742;
    el.requestUpdate();
  }

  private seedReplayPanel() {
    const el = this.querySelector("replay-panel") as any;
    if (!el) return;
    el.game = mockGame;
    el.eventBus = noopEventBus;
    el.visible = true;
    el.isSingleplayer = true;
    el._replaySpeedMultiplier = 2;
    el.requestUpdate();
  }

  private seedPlayerInfo() {
    const el = this.querySelector("player-info-overlay") as any;
    if (!el) return;
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

  render() {
    return html`
      <style>
        body {
          margin: 0;
          overflow: hidden;
        }

        .demo-page {
          position: fixed;
          inset: 0;
          min-height: 100vh;
          overflow: hidden;
          background: #0f172a;
        }
      </style>

      <div class="demo-page">
        <div id="app" class="fixed inset-0 bg-slate-950"></div>

        <!-- Bottom HUD: exact index.html scaffold, with blank map behind it. -->
        <div
          class="fixed bottom-0 left-0 w-full z-[200] flex flex-col pointer-events-none sm:flex-row sm:items-end lg:grid lg:grid-cols-[1fr_500px_1fr] lg:items-end min-[1200px]:px-4"
          style="
            padding-bottom: env(safe-area-inset-bottom);
            padding-left: env(safe-area-inset-left);
            padding-right: env(safe-area-inset-right);
          "
        >
          <div
            class="contents sm:flex sm:flex-col sm:pointer-events-none w-full sm:w-[500px] lg:col-start-2 sm:z-10"
          >
            <attacks-display
              class="w-full pointer-events-auto order-1 sm:order-none"
            ></attacks-display>
            <div
              class="pointer-events-auto font-mono tabular-nums text-white bg-gray-800/88 backdrop-blur-sm rounded-[3px] shadow-lg order-3 sm:order-none"
            >
              <control-panel class="w-full"></control-panel>
              <unit-display class="hidden lg:block w-full"></unit-display>
            </div>
          </div>

          <div
            class="flex flex-col pointer-events-none items-end order-2 sm:order-none sm:flex-1 lg:col-start-3 lg:self-end lg:justify-end min-[1200px]:mr-4"
          >
            <chat-display
              class="w-full sm:w-auto pointer-events-auto"
            ></chat-display>
            <events-display
              class="w-full sm:w-auto pointer-events-auto"
            ></events-display>
          </div>
        </div>

        <div
          class="flex flex-col items-end fixed top-0 right-0 min-[1200px]:top-4 min-[1200px]:right-4 z-1000 gap-2"
        >
          <game-right-sidebar></game-right-sidebar>
          <replay-panel></replay-panel>
        </div>

        <game-left-sidebar></game-left-sidebar>
        <player-info-overlay></player-info-overlay>
        <leader-board></leader-board>
        <team-stats></team-stats>
      </div>
    `;
  }
}

export function row(
  player: MockPlayer,
  position: number,
  score: string,
  gold: string,
  maxTroops: string,
  isMyPlayer = false,
  isOnSameTeam = false,
) {
  return {
    name: player.displayName(),
    position,
    score,
    gold,
    maxTroops,
    isMyPlayer,
    isOnSameTeam,
    player,
  };
}

function createMockPlayer(data: {
  id: string;
  smallID: number;
  name: string;
  team: string;
  type: PlayerType;
  tiles: number;
  gold: bigint;
  troops: number;
  capacity: number;
  rate: number;
  units: Partial<Record<UnitType, number>>;
}): MockPlayer {
  const resources = {
    food: 92000n,
    energy: 42000n,
    materials: 64000n,
  };
  const capacity = {
    food: 140000n,
    energy: 90000n,
    materials: 110000n,
  };

  return {
    attackClusteredPositions: async () => [{ positions: [{ x: 50, y: 40 }] }],
    buildables: async () => buildables,
    cosmetics: {},
    displayName: () => data.name,
    effectiveTroopCapacity: () => data.capacity,
    getTraitorRemainingTicks: () => 0,
    gold: () => data.gold,
    id: () => data.id,
    isAlive: () => true,
    isAlliedWith: (player: MockPlayer) => player.team() === data.team,
    isFriendly: (player: MockPlayer) => player.team() === data.team,
    isLobbyCreator: () => true,
    isTraitor: () => false,
    numTilesOwned: () => data.tiles,
    outgoingAttacks: () => [{ troops: data.id === "you" ? 245000 : 65000 }],
    resourceCapacity: () => capacity,
    resources: () => resources,
    smallID: () => data.smallID,
    team: () => data.team,
    totalUnitLevels: (type: UnitType) => data.units[type] ?? 0,
    troopIncreaseRate: () => data.rate / 10,
    troops: () => data.troops,
    type: () => data.type,
    units: (type?: UnitType) => {
      const count = type ? (data.units[type] ?? 0) : 0;
      return Array.from({ length: count }, (_, id) => ({
        id: () => id,
        isActive: () => true,
        owner: () => players[0],
        tile: () => 0,
        type: () => type,
      }));
    },
    alliances: () =>
      data.id === "you" ? [{ other: "east", expiresAt: 1500 }] : [],
  };
}

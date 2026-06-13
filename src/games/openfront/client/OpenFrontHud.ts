import { Controller } from "src/client/Controller";
import { GameStartingModal } from "src/client/GameStartingModal";
import { TransformHandler } from "src/client/TransformHandler";
import { UIState } from "src/client/UIState";
import { BuildPreviewController } from "src/client/controllers/BuildPreviewController";
import { HoverHighlightController } from "src/client/controllers/HoverHighlightController";
import { SandboxTileRulerController } from "src/client/controllers/SandboxTileRulerController";
import { WarshipSelectionController } from "src/client/controllers/WarshipSelectionController";
import { GameRenderer } from "src/client/hud/GameRenderer";
import { AlertFrame } from "src/client/hud/layers/AlertFrame";
import { AttackingTroopsOverlay } from "src/client/hud/layers/AttackingTroopsOverlay";
import { AttacksDisplay } from "src/client/hud/layers/AttacksDisplay";
import { BuildBar } from "src/client/hud/layers/BuildBar";
import { BuildMenu } from "src/client/hud/layers/BuildMenu";
import { ChatDisplay } from "src/client/hud/layers/ChatDisplay";
import { ChatModal } from "src/client/hud/layers/ChatModal";
import { ControlPanel } from "src/client/hud/layers/ControlPanel";
import { EmojiTable } from "src/client/hud/layers/EmojiTable";
import { EventsDisplay } from "src/client/hud/layers/EventsDisplay";
import { GameLeftSidebar } from "src/client/hud/layers/GameLeftSidebar";
import { GameRightSidebar } from "src/client/hud/layers/GameRightSidebar";
import { HeadsUpMessage } from "src/client/hud/layers/HeadsUpMessage";
import { ImmunityTimer } from "src/client/hud/layers/ImmunityTimer";
import { InGamePromo } from "src/client/hud/layers/InGamePromo";
import { Leaderboard } from "src/client/hud/layers/Leaderboard";
import { MainRadialMenu } from "src/client/hud/layers/MainRadialMenu";
import { MultiTabModal } from "src/client/hud/layers/MultiTabModal";
import { PerformanceOverlay } from "src/client/hud/layers/PerformanceOverlay";
import { PlayerInfoOverlay } from "src/client/hud/layers/PlayerInfoOverlay";
import { PlayerPanel } from "src/client/hud/layers/PlayerPanel";
import { ReplayPanel } from "src/client/hud/layers/ReplayPanel";
import { SettingsModal } from "src/client/hud/layers/SettingsModal";
import { SpawnTimer } from "src/client/hud/layers/SpawnTimer";
import { TeamStats } from "src/client/hud/layers/TeamStats";
import { WinModal } from "src/client/hud/layers/WinModal";
import { GameView as WebGLGameView } from "src/client/render/gl";
import { EventBus } from "src/core/EventBus";
import { GameView } from "src/core/game/GameView";
import { UserSettings } from "src/core/game/UserSettings";

export function createOpenFrontRenderer(
  inputEl: HTMLElement,
  game: GameView,
  eventBus: EventBus,
  playerRole: string | null,
  view: WebGLGameView,
): GameRenderer {
  const transformHandler = new TransformHandler(game, eventBus, inputEl);
  const userSettings = new UserSettings();

  const uiState: UIState = {
    attackRatio: 20,
    ghostStructure: null,
    overlappingRailroads: [],
    ghostRailPaths: [],
    rocketDirectionUp: true,
  };

  //hide when the game renders
  const startingModal = document.querySelector(
    "game-starting-modal",
  ) as GameStartingModal;
  startingModal.hide();

  // TODO maybe append this to document instead of querying for them?
  const emojiTable = document.querySelector("emoji-table") as EmojiTable;
  if (!emojiTable || !(emojiTable instanceof EmojiTable)) {
    console.error("EmojiTable element not found in the DOM");
  }
  emojiTable.transformHandler = transformHandler;
  emojiTable.game = game;
  emojiTable.initEventBus(eventBus);

  const buildMenu = document.querySelector("build-menu") as BuildMenu;
  if (!buildMenu || !(buildMenu instanceof BuildMenu)) {
    console.error("BuildMenu element not found in the DOM");
  }
  buildMenu.game = game;
  buildMenu.eventBus = eventBus;
  buildMenu.uiState = uiState;
  buildMenu.transformHandler = transformHandler;

  const buildBar = document.querySelector("build-bar") as BuildBar;
  if (!buildBar || !(buildBar instanceof BuildBar)) {
    console.error("BuildBar element not found in the DOM");
  }
  buildBar.game = game;
  buildBar.eventBus = eventBus;
  buildBar.uiState = uiState;

  const leaderboard = document.querySelector("leader-board") as Leaderboard;
  if (!leaderboard || !(leaderboard instanceof Leaderboard)) {
    console.error("LeaderBoard element not found in the DOM");
  }
  leaderboard.eventBus = eventBus;
  leaderboard.game = game;

  const gameLeftSidebar = document.querySelector(
    "game-left-sidebar",
  ) as GameLeftSidebar;
  if (!gameLeftSidebar || !(gameLeftSidebar instanceof GameLeftSidebar)) {
    console.error("GameLeftSidebar element not found in the DOM");
  }
  gameLeftSidebar.game = game;
  gameLeftSidebar.eventBus = eventBus;

  const teamStats = document.querySelector("team-stats") as TeamStats;
  if (!teamStats || !(teamStats instanceof TeamStats)) {
    console.error("TeamStats element not found in the DOM");
  }
  teamStats.eventBus = eventBus;
  teamStats.game = game;

  const controlPanel = document.querySelector("control-panel") as ControlPanel;
  if (!(controlPanel instanceof ControlPanel)) {
    console.error("ControlPanel element not found in the DOM");
  }
  controlPanel.eventBus = eventBus;
  controlPanel.uiState = uiState;
  controlPanel.game = game;

  const eventsDisplay = document.querySelector(
    "events-display",
  ) as EventsDisplay;
  if (!(eventsDisplay instanceof EventsDisplay)) {
    console.error("events display not found");
  }
  eventsDisplay.eventBus = eventBus;
  eventsDisplay.game = game;
  eventsDisplay.uiState = uiState;

  const attacksDisplay = document.querySelector(
    "attacks-display",
  ) as AttacksDisplay;
  if (!(attacksDisplay instanceof AttacksDisplay)) {
    console.error("attacks display not found");
  }
  attacksDisplay.eventBus = eventBus;
  attacksDisplay.game = game;
  attacksDisplay.uiState = uiState;

  const chatDisplay = document.querySelector("chat-display") as ChatDisplay;
  if (!(chatDisplay instanceof ChatDisplay)) {
    console.error("chat display not found");
  }
  chatDisplay.eventBus = eventBus;
  chatDisplay.game = game;

  const playerInfo = document.querySelector(
    "player-info-overlay",
  ) as PlayerInfoOverlay;
  if (!(playerInfo instanceof PlayerInfoOverlay)) {
    console.error("player info overlay not found");
  }
  playerInfo.eventBus = eventBus;
  playerInfo.transform = transformHandler;
  playerInfo.game = game;

  const winModal = document.querySelector("win-modal") as WinModal;
  if (!(winModal instanceof WinModal)) {
    console.error("win modal not found");
  }
  winModal.eventBus = eventBus;
  winModal.game = game;

  const replayPanel = document.querySelector("replay-panel") as ReplayPanel;
  if (!(replayPanel instanceof ReplayPanel)) {
    console.error("replay panel not found");
  }
  replayPanel.eventBus = eventBus;
  replayPanel.game = game;

  const gameRightSidebar = document.querySelector(
    "game-right-sidebar",
  ) as GameRightSidebar;
  if (!(gameRightSidebar instanceof GameRightSidebar)) {
    console.error("Game Right bar not found");
  }
  gameRightSidebar.game = game;
  gameRightSidebar.eventBus = eventBus;

  const settingsModal = document.querySelector(
    "settings-modal",
  ) as SettingsModal;
  if (!(settingsModal instanceof SettingsModal)) {
    console.error("settings modal not found");
  }
  settingsModal.userSettings = userSettings;
  settingsModal.eventBus = eventBus;

  const playerPanel = document.querySelector("player-panel") as PlayerPanel;
  if (!(playerPanel instanceof PlayerPanel)) {
    console.error("player panel not found");
  }
  playerPanel.g = game;
  playerPanel.initEventBus(eventBus);
  playerPanel.emojiTable = emojiTable;
  playerPanel.uiState = uiState;

  playerPanel.setRole(playerRole);

  const chatModal = document.querySelector("chat-modal") as ChatModal;
  if (!(chatModal instanceof ChatModal)) {
    console.error("chat modal not found");
  }
  chatModal.g = game;
  chatModal.initEventBus(eventBus);

  const multiTabModal = document.querySelector(
    "multi-tab-modal",
  ) as MultiTabModal;
  if (!(multiTabModal instanceof MultiTabModal)) {
    console.error("multi-tab modal not found");
  }
  multiTabModal.game = game;

  const headsUpMessage = document.querySelector(
    "heads-up-message",
  ) as HeadsUpMessage;
  if (!(headsUpMessage instanceof HeadsUpMessage)) {
    console.error("heads-up message not found");
  }
  headsUpMessage.game = game;

  const performanceOverlay = document.querySelector(
    "performance-overlay",
  ) as PerformanceOverlay;
  if (!(performanceOverlay instanceof PerformanceOverlay)) {
    console.error("performance overlay not found");
  }
  performanceOverlay.eventBus = eventBus;
  performanceOverlay.userSettings = userSettings;

  const alertFrame = document.querySelector("alert-frame") as AlertFrame;
  if (!(alertFrame instanceof AlertFrame)) {
    console.error("alert frame not found");
  }
  alertFrame.game = game;

  const spawnTimer = document.querySelector("spawn-timer") as SpawnTimer;
  if (!(spawnTimer instanceof SpawnTimer)) {
    console.error("spawn timer not found");
  }
  spawnTimer.game = game;
  spawnTimer.eventBus = eventBus;
  spawnTimer.transformHandler = transformHandler;

  const immunityTimer = document.querySelector(
    "immunity-timer",
  ) as ImmunityTimer;
  if (!(immunityTimer instanceof ImmunityTimer)) {
    console.error("immunity timer not found");
  }
  immunityTimer.game = game;
  immunityTimer.eventBus = eventBus;

  const inGamePromo = document.querySelector("in-game-promo") as InGamePromo;
  if (!(inGamePromo instanceof InGamePromo)) {
    console.error("in-game promo not found");
  }
  inGamePromo.game = game;

  const layers: Controller[] = [
    new WarshipSelectionController(game, eventBus, transformHandler, view),
    new BuildPreviewController(game, eventBus, uiState, transformHandler, view),
    new HoverHighlightController(game, eventBus, transformHandler, view),
    new SandboxTileRulerController(game, eventBus, transformHandler),
    new AttackingTroopsOverlay(game, transformHandler, eventBus, userSettings),
    eventsDisplay,
    attacksDisplay,
    chatDisplay,
    buildBar,
    buildMenu,
    new MainRadialMenu(
      eventBus,
      game,
      transformHandler,
      emojiTable as EmojiTable,
      buildMenu,
      uiState,
      playerPanel,
    ),
    spawnTimer,
    immunityTimer,
    leaderboard,
    gameLeftSidebar,
    gameRightSidebar,
    controlPanel,
    playerInfo,
    winModal,
    replayPanel,
    settingsModal,
    teamStats,
    playerPanel,
    headsUpMessage,
    multiTabModal,
    inGamePromo,
    alertFrame,
    performanceOverlay,
  ];

  return new GameRenderer(
    transformHandler,
    uiState,
    layers,
    performanceOverlay,
  );
}

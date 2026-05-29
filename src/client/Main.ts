import version from "resources/version.txt?raw";
import { ClientEnv } from "src/client/ClientEnv";
import { UserMeResponse } from "../core/ApiSchemas";
import { assetUrl } from "../core/AssetUrls";
import { EventBus } from "../core/EventBus";
import {
  GAME_ID_REGEX,
  GameInfo,
  GameRecord,
  GameStartInfo,
  PublicGameInfo,
} from "../core/Schemas";
import { generateID } from "../core/Util";
import { GameEnv } from "../core/configuration/Config";
import { GameType } from "../core/game/Game";
import {
  DARK_MODE_KEY,
  USER_SETTINGS_CHANGED_EVENT,
  UserSettings,
} from "../core/game/UserSettings";
import "./AccountModal";
import "./ClanModal";
import "./FlagInput";
import "./FlagInputModal";
import { userAuth } from "./Auth";
import {
  joinLobby,
  removeExistingGameSurfaces,
  type JoinLobbyResult,
} from "./ClientGameRunner";
import { getPlayerCosmeticsRefs } from "./Cosmetics";
import { crazyGamesSDK } from "./CrazyGamesSDK";
import "./GameModeSelector";
import { GameModeSelector } from "./GameModeSelector";
import { GameStartingModal } from "./GameStartingModal";
import "./GoogleAdElement";
import "./HelpModal";
import "./HomepagePromos";
import { HostLobbyModal as HostPrivateLobbyModal } from "./HostLobbyModal";
import { JoinLobbyModal } from "./JoinLobbyModal";
import "./LangSelector";
import { LangSelector } from "./LangSelector";
import { areLocalServicesEnabled } from "./LocalServices";
import { initLayout } from "./Layout";
import "./LeaderboardModal";
import "./Matchmaking";
import { modalRouter } from "./ModalRouter";
import { initNavigation } from "./Navigation";
import "./NewsModal";
import "./PatternInput";
import "./SinglePlayerModal";
import "./Store";
import "./TerritoryPatternsModal";
import "./TokenLoginModal";
import "./TroubleshootingModal";
import {
  PauseGameIntentEvent,
  SendKickPlayerIntentEvent,
  SendStartGameEvent,
  SendUpdateGameConfigIntentEvent,
} from "./Transport";
import "./UserSettingModal";
import "./UsernameInput";
import { genAnonUsername, UsernameInput } from "./UsernameInput";
import { incrementGamesPlayed, translateText } from "./Utils";
import { installSafariPinchZoomBlocker } from "./utilities/DisableSafariPinchZoom";
import { createQuickGameStartInfo } from "./utilities/QuickGame";

import "./components/DesktopNavBar";
import "./components/Footer";
import "./components/MainLayout";
import "./components/MobileNavBar";
import "./components/PlayPage";
import "./components/RankedModal";
import "./components/baseComponents/Button";
import "./components/baseComponents/Modal";
import "./hud/demo/HudLiveComponentsDemo";
import "./hud/demo/HudPanelWorkbench";
import "./hud/ui";
import "./styles.css";
import "./styles/core/typography.css";
import "./styles/core/variables.css";
import "./styles/layout/container.css";
import "./styles/layout/header.css";
import "./styles/modal/chat.css";

declare global {
  interface Window {
    turnstile: any;
    adsEnabled: boolean;
    PageOS: {
      session: {
        newPageView: () => void;
      };
    };
    ramp: {
      que: Array<() => void>;
      passiveMode: boolean;
      spaAddAds: (ads: Array<{ type: string; selectorId?: string }>) => void;
      destroyUnits: (adType: string | string[]) => Promise<void>;
      settings?: {
        slots?: any;
      };
      spaNewPage: (url?: string) => void;
      spaAds: (config?: {
        ads?: Array<{ type: string; selectorId?: string }>;
        countPageview?: boolean;
        path?: string;
      }) => void;
      // Video ad methods
      onPlayerReady: (() => void) | null;
      addUnits: (units: Array<{ type: string }>) => Promise<void>;
      displayUnits: () => void;
    };
    Bolt: {
      on: (unitType: string, event: string, callback: () => void) => void;
      BOLT_AD_REQUEST_START: string;
      BOLT_AD_IMPRESSION: string;
      BOLT_AD_STARTED: string;
      BOLT_FIRST_QUARTILE: string;
      BOLT_MIDPOINT: string;
      BOLT_THIRD_QUARTILE: string;
      BOLT_AD_COMPLETE: string;
      BOLT_AD_ERROR: string;
      BOLT_AD_PAUSED: string;
      BOLT_AD_CLICKED: string;
      SHOW_HIDDEN_CONTAINER: string;
    };
    currentPageId?: string;
    showPage?: (pageId: string) => void;
  }

  // Extend the global interfaces to include your custom events
  interface DocumentEventMap {
    "join-lobby": CustomEvent<JoinLobbyEvent>;
    "kick-player": CustomEvent;
    "start-game": CustomEvent;
    "join-changed": CustomEvent;
    userMeResponse: CustomEvent<UserMeResponse | false>;
    "leave-lobby": CustomEvent;
    "update-game-config": CustomEvent;
    "sandbox-pause-game": CustomEvent<{ paused: boolean }>;
  }

  // Fixes the globalThis.addEventListener errors
  interface WindowEventMap {
    "event:user-settings-changed:settings.darkMode": CustomEvent<string>;
  }
}

export interface JoinLobbyEvent {
  // Multiplayer games only have gameID, gameConfig is not known until game starts.
  gameID: string;
  // GameConfig only exists when playing a singleplayer game.
  gameStartInfo?: GameStartInfo;
  // GameRecord exists when replaying an archived game.
  gameRecord?: GameRecord;
  source?:
    | "public"
    | "private"
    | "host"
    | "matchmaking"
    | "singleplayer"
    | "sandbox";
  publicLobbyInfo?: GameInfo | PublicGameInfo;
}

class Client {
  private lobbyHandle: JoinLobbyResult | null = null;
  private eventBus: EventBus = new EventBus();

  private currentUrl: string | null = null;

  private usernameInput: UsernameInput | null = null;

  private hostModal: HostPrivateLobbyModal | null = null;
  private joinModal: JoinLobbyModal | null = null;
  private gameModeSelector: GameModeSelector | null = null;
  private userSettings: UserSettings = new UserSettings();
  private mostRecentJoinEvent: number;
  private quickGameLaunchInProgress = false;

  private turnstileTokenPromise: Promise<{
    token: string;
    createdAt: number;
  }> | null = null;

  initializeSandbox(): void {
    document.addEventListener("join-lobby", this.handleJoinLobby.bind(this));
    document.addEventListener("leave-lobby", this.handleLeaveLobby.bind(this));
    document.addEventListener(
      "sandbox-pause-game",
      this.handleSandboxPauseGame.bind(this),
    );
    window.addEventListener("beforeunload", async () => {
      if (this.lobbyHandle !== null) {
        this.lobbyHandle.stop(true);
      }
    });
    this.applyDarkModeSetting();
  }

  async initialize(): Promise<void> {
    if (areLocalServicesEnabled()) {
      crazyGamesSDK.maybeInit();
    }

    // Keep URL routing only for play-critical modals.
    modalRouter.register("single-player", {
      tag: "single-player-modal",
      pageId: "page-single-player",
    });

    // Prefetch turnstile token so it is available when
    // the user joins a lobby.
    if (areLocalServicesEnabled()) {
      this.turnstileTokenPromise = getTurnstileToken();
    }

    // Wait for components to render before setting version
    await customElements.whenDefined("desktop-nav-bar");

    const openFrontFont = new FontFace(
      "OpenFront",
      `url(${assetUrl("fonts/OpenFront.ttf")})`,
    );
    document.fonts.add(openFrontFont);
    openFrontFont.load().catch(() => {});

    const versionElements = document.querySelectorAll(
      "#game-version, .game-version-display",
    );
    if (versionElements.length === 0) {
      console.warn("Game version element not found");
    } else {
      const trimmed = version.trim();
      const displayVersion = trimmed.startsWith("v") ? trimmed : `v${trimmed}`;
      versionElements.forEach((el) => {
        (el as HTMLElement).style.fontFamily = '"OpenFront", Inter, sans-serif';
        el.textContent = displayVersion;
      });
    }

    const langSelector = document.querySelector(
      "lang-selector",
    ) as LangSelector;
    if (!langSelector) {
      console.warn("Lang selector element not found");
    }

    this.usernameInput = document.querySelector(
      "username-input",
    ) as UsernameInput;
    if (!this.usernameInput) {
      console.warn("Username input element not found");
    }

    this.gameModeSelector = document.querySelector(
      "game-mode-selector",
    ) as GameModeSelector;

    window.addEventListener("beforeunload", async () => {
      console.log("Browser is closing");
      if (this.lobbyHandle !== null) {
        this.lobbyHandle.stop(true);
        await crazyGamesSDK.gameplayStop();
      }
    });

    document.addEventListener("join-lobby", this.handleJoinLobby.bind(this));
    document.addEventListener("leave-lobby", this.handleLeaveLobby.bind(this));
    document.addEventListener("kick-player", this.handleKickPlayer.bind(this));
    document.addEventListener("start-game", this.handleStartGame.bind(this));
    document.addEventListener(
      "sandbox-pause-game",
      this.handleSandboxPauseGame.bind(this),
    );
    document.addEventListener(
      "update-game-config",
      this.handleUpdateGameConfig.bind(this),
    );

    window.adsEnabled = false;

    this.hostModal = document.querySelector(
      "host-lobby-modal",
    ) as HostPrivateLobbyModal;
    if (!this.hostModal || !(this.hostModal instanceof HostPrivateLobbyModal)) {
      console.warn("Host private lobby modal element not found");
    } else {
      this.hostModal.eventBus = this.eventBus;
    }

    this.joinModal = document.querySelector(
      "join-lobby-modal",
    ) as JoinLobbyModal;
    if (!this.joinModal || !(this.joinModal instanceof JoinLobbyModal)) {
      console.warn("Join lobby modal element not found");
    } else {
      this.joinModal.eventBus = this.eventBus;
    }

    this.applyDarkModeSetting();

    // Attempt to join lobby
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", () => this.handleUrl());
    } else {
      this.handleUrl();
    }

    const onHashUpdate = () => {
      // Router-managed hash changes (#modal=...) are handled by the router
      // syncing in/out; we don't need to tear down the lobby state for them.
      if (modalRouter.isHashRouted()) {
        modalRouter.routeFromHash();
        return;
      }

      // Reset the UI to its initial state
      this.joinModal?.close();

      onJoinChanged();
    };

    const onPopState = () => {
      if (this.currentUrl !== null && this.lobbyHandle !== null) {
        console.info("Game is active");

        if (!this.lobbyHandle.stop()) {
          console.info("Player is active, ask before leaving game");

          const isConfirmed = confirm(
            translateText("help_modal.exit_confirmation"),
          );

          if (!isConfirmed) {
            // Rollback navigator history
            history.pushState(null, "", this.currentUrl);
            return;
          }
        }

        console.info("Player is not active, leave the game immediately");

        crazyGamesSDK.gameplayStop().then(() => {
          // redirect to the home page
          window.location.href = "/";
        });
      } else {
        console.info("Game not active, handle hash update");

        onHashUpdate();
      }
    };

    const onJoinChanged = () => {
      if (this.lobbyHandle !== null) {
        this.handleLeaveLobby();
      }

      // Attempt to join lobby
      this.handleUrl();
    };

    // Handle browser navigation & manual hash edits
    window.addEventListener("popstate", onPopState);
    window.addEventListener("hashchange", onHashUpdate);
    window.addEventListener("join-changed", onJoinChanged);

    function updateSliderProgress(slider: HTMLInputElement) {
      const percent =
        ((Number(slider.value) - Number(slider.min)) /
          (Number(slider.max) - Number(slider.min))) *
        100;
      slider.style.setProperty("--progress", `${percent}%`);
    }

    document
      .querySelectorAll<HTMLInputElement>(
        "#bots-count, #private-lobby-bots-count",
      )
      .forEach((slider) => {
        updateSliderProgress(slider);
        slider.addEventListener("input", () => updateSliderProgress(slider));
      });
  }

  private applyDarkModeSetting() {
    const applyDarkMode = (isDark: boolean) => {
      if (isDark) {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    };

    applyDarkMode(this.userSettings.darkMode());

    globalThis.addEventListener(
      `${USER_SETTINGS_CHANGED_EVENT}:${DARK_MODE_KEY}`,
      (e: CustomEvent<string>) => {
        const isDark = e.detail === "true";
        applyDarkMode(isDark);
      },
    );
  }

  private async handleUrl() {
    // Wait for modal custom elements to be defined
    await Promise.all([
      customElements.whenDefined("join-lobby-modal"),
      customElements.whenDefined("host-lobby-modal"),
    ]);

    // Check if CrazyGames SDK is enabled first (no hash needed in CrazyGames)
    if (crazyGamesSDK.isOnCrazyGames()) {
      const lobbyId = await crazyGamesSDK.getInviteGameId();
      console.log("got game id", lobbyId);
      if (lobbyId && GAME_ID_REGEX.test(lobbyId)) {
        console.log("game parsed successfully");
        // Wait 2 seconds to ensure all elements are actually loaded,
        // On low end-chromebooks the join modal was not registered in time.
        await new Promise((resolve) => setTimeout(resolve, 2000));
        window.showPage?.("page-join-lobby");
        this.joinModal?.open({ lobbyId });
        console.log(`CrazyGames: joining lobby ${lobbyId} from invite param`);
        return;
      }
    }
    crazyGamesSDK.isInstantMultiplayer().then((isInstant) => {
      if (isInstant) {
        console.log(
          `CrazyGames: joining instant multiplayer lobby from CrazyGames`,
        );
        this.hostModal?.open();
      }
    });

    const strip = () =>
      history.replaceState(
        null,
        "",
        window.location.pathname + window.location.search,
      );

    const hash = window.location.hash;

    // Decode the hash first to handle encoded characters
    const decodedHash = decodeURIComponent(hash);

    const pathMatch = window.location.pathname.match(
      /^\/(?:w\d+\/)?game\/([^/]+)/,
    );
    const lobbyId =
      pathMatch && GAME_ID_REGEX.test(pathMatch[1]) ? pathMatch[1] : null;
    if (lobbyId) {
      window.showPage?.("page-join-lobby");
      this.joinModal?.open({ lobbyId });
      console.log(`joining lobby ${lobbyId}`);
      return;
    }
    if (this.isQuickGameRoute(decodedHash)) {
      this.startQuickGame();
      return;
    }
    if (modalRouter.routeFromHash()) {
      return;
    }
    if (decodedHash.startsWith("#refresh")) {
      strip();
      window.location.href = "/";
    }
  }

  private isQuickGameRoute(decodedHash: string): boolean {
    return (
      window.location.pathname === "/quick-game" ||
      decodedHash === "#quick-game"
    );
  }

  private startQuickGame() {
    if (this.quickGameLaunchInProgress || this.lobbyHandle !== null) {
      return;
    }
    this.quickGameLaunchInProgress = true;

    const clientID = generateID();
    const gameID = generateID();
    const username = this.usernameInput?.getUsername() || genAnonUsername();
    const clanTag = this.usernameInput?.getClanTag() ?? null;

    document.dispatchEvent(
      new CustomEvent("join-lobby", {
        detail: {
          gameID,
          gameStartInfo: createQuickGameStartInfo({
            gameID,
            clientID,
            username,
            clanTag,
          }),
          source: "singleplayer",
        } satisfies JoinLobbyEvent,
        bubbles: true,
        composed: true,
      }),
    );
  }

  private async handleJoinLobby(event: CustomEvent<JoinLobbyEvent>) {
    const lobby = event.detail;
    this.mostRecentJoinEvent = event.timeStamp;
    const isSandbox =
      lobby.source === "sandbox" ||
      lobby.gameStartInfo?.config.isSandbox === true;
    const isSinglePlayer =
      lobby.gameStartInfo?.config.gameType === GameType.Singleplayer;
    if (this.usernameInput && !this.usernameInput.validateOrShowError()) {
      return;
    }

    console.log(`joining lobby ${lobby.gameID}`);
    if (this.lobbyHandle !== null) {
      console.log("joining lobby, stopping existing game");
      this.lobbyHandle.stop(true);
      this.lobbyHandle = null;
      document.body.classList.remove("in-game");
    }
    this.eventBus = new EventBus();
    const gameEventBus = this.eventBus;
    if (lobby.source === "public") {
      this.joinModal?.open({
        lobbyId: lobby.gameID,
        lobbyInfo: lobby.publicLobbyInfo,
      });
    }
    // Only update URL immediately for private lobbies, not public ones
    if (lobby.source !== "public" && !isSandbox && !isSinglePlayer) {
      this.updateJoinUrlForShare(lobby.gameID);
    }
    const auth = isSandbox ? false : await userAuth();
    const playerRole = auth !== false ? (auth.claims.role ?? null) : null;
    const newLobbyHandle = joinLobby(gameEventBus, {
      gameID: lobby.gameID,
      cosmetics: isSandbox ? {} : await getPlayerCosmeticsRefs(),
      turnstileToken: await this.getTurnstileToken(lobby),
      playerName: isSandbox
        ? (lobby.gameStartInfo?.players[0]?.username ?? "Sandbox")
        : (this.usernameInput?.getUsername() ?? genAnonUsername()),
      playerClanTag: isSandbox
        ? (lobby.gameStartInfo?.players[0]?.clanTag ?? null)
        : (this.usernameInput?.getClanTag() ?? null),
      playerRole,
      gameStartInfo: lobby.gameStartInfo ?? lobby.gameRecord?.info,
      gameRecord: lobby.gameRecord,
    });

    if (this.mostRecentJoinEvent !== event.timeStamp) {
      newLobbyHandle.stop(true);
      console.warn("Join requested, but was superseded");
      return;
    }

    this.lobbyHandle = newLobbyHandle;

    this.lobbyHandle.prestart.then(() => {
      console.log("Closing modals");
      document.getElementById("settings-button")?.classList.add("hidden");
      if (this.usernameInput) {
        // fix edge case where username-validation-error is re-rendered and hidden tag removed
        this.usernameInput.validationError = "";
      }
      document
        .getElementById("username-validation-error")
        ?.classList.add("hidden");
      this.joinModal?.closeWithoutLeaving();
      [
        "single-player-modal",
        "host-lobby-modal",
        "game-starting-modal",
        "game-top-bar",
        "account-button",
        "leaderboard-button",
        "lang-selector",
      ].forEach((tag) => {
        const modal = document.querySelector(tag) as HTMLElement & {
          close?: () => void;
          isModalOpen?: boolean;
        };
        if (modal?.close) {
          modal.close();
        } else if (modal && "isModalOpen" in modal) {
          modal.isModalOpen = false;
        }
      });
      this.gameModeSelector?.stop();
      document.querySelectorAll(".ad").forEach((ad) => {
        (ad as HTMLElement).style.display = "none";
      });

      if (!isSandbox) {
        crazyGamesSDK.loadingStart();
      }

      // show when the game loads
      const startingModal = document.querySelector(
        "game-starting-modal",
      ) as GameStartingModal;
      if (
        !isSandbox &&
        startingModal &&
        startingModal instanceof GameStartingModal
      ) {
        startingModal.show();
      }
    });

    this.lobbyHandle.join.then(() => {
      this.joinModal?.closeWithoutLeaving();
      this.gameModeSelector?.stop();
      if (!isSandbox) {
        incrementGamesPlayed();
      }

      document.querySelectorAll(".ad").forEach((ad) => {
        (ad as HTMLElement).style.display = "none";
      });

      if (!isSandbox && window.PageOS?.session?.newPageView) {
        window.PageOS.session.newPageView();
      }
      if (!isSandbox) {
        crazyGamesSDK.loadingStop();
        crazyGamesSDK.gameplayStart();
      }
      document.body.classList.add("in-game");

      if (!isSandbox && !isSinglePlayer) {
        // Ensure there's a homepage entry in history before adding the lobby entry
        if (window.location.hash === "" || window.location.hash === "#") {
          history.replaceState(null, "", window.location.origin + "#refresh");
        }
        const lobbyIdHidden = !this.userSettings.lobbyIdVisibility();
        history.pushState(
          null,
          "",
          lobbyIdHidden
            ? "/streamer-mode"
            : `/${ClientEnv.workerPath(lobby.gameID)}/game/${lobby.gameID}?live`,
        );
      }

      // Store current URL for popstate confirmation
      this.currentUrl = window.location.href;
    });
  }

  private updateJoinUrlForShare(lobbyId: string) {
    const lobbyIdHidden = !this.userSettings.lobbyIdVisibility();
    const targetUrl = lobbyIdHidden
      ? "/streamer-mode"
      : `/${ClientEnv.workerPath(lobbyId)}/game/${lobbyId}`;
    const currentUrl = window.location.pathname;

    if (currentUrl !== targetUrl) {
      history.replaceState(null, "", targetUrl);
    }
  }

  private async handleLeaveLobby(event?: CustomEvent) {
    if (this.lobbyHandle === null) {
      return;
    }
    console.log("leaving lobby, cancelling game");
    this.lobbyHandle.stop(true);
    this.lobbyHandle = null;
    this.quickGameLaunchInProgress = false;
    this.eventBus = new EventBus();
    this.currentUrl = null;

    try {
      history.replaceState(null, "", "/");
    } catch (e) {
      console.warn("Failed to restore URL on leave:", e);
    }

    document.body.classList.remove("in-game");

    if (this.joinModal?.isOpen()) {
      this.joinModal.close();
      if (event?.detail.cause === "full-lobby") {
        window.dispatchEvent(
          new CustomEvent("show-message", {
            detail: {
              message: translateText("public_lobby.join_timeout"),
              color: "red",
              duration: 3500,
            },
          }),
        );
      }
    }

    crazyGamesSDK.gameplayStop();
  }

  private handleKickPlayer(event: CustomEvent) {
    const { target } = event.detail;

    // Forward to eventBus if available
    if (this.eventBus) {
      this.eventBus.emit(new SendKickPlayerIntentEvent(target));
    }
  }

  private handleStartGame() {
    if (this.eventBus) {
      this.eventBus.emit(new SendStartGameEvent());
    }
  }

  private handleSandboxPauseGame(event: CustomEvent<{ paused: boolean }>) {
    if (this.eventBus) {
      this.eventBus.emit(new PauseGameIntentEvent(event.detail.paused));
    }
  }

  private handleUpdateGameConfig(event: CustomEvent) {
    const { config } = event.detail;

    // Forward to eventBus if available
    if (this.eventBus) {
      this.eventBus.emit(new SendUpdateGameConfigIntentEvent(config));
    }
  }

  private async getTurnstileToken(
    lobby: JoinLobbyEvent,
  ): Promise<string | null> {
    if (
      ClientEnv.env() === GameEnv.Dev ||
      lobby.gameStartInfo?.config.gameType === GameType.Singleplayer
    ) {
      return null;
    }

    // Always request a new token on crazygames.
    if (this.turnstileTokenPromise === null || crazyGamesSDK.isOnCrazyGames()) {
      console.log("No prefetched turnstile token, getting new token");
      return (await getTurnstileToken())?.token ?? null;
    }

    const token = await this.turnstileTokenPromise;
    // Clear promise so a new token is fetched next time
    this.turnstileTokenPromise = null;
    if (!token) {
      console.log("No turnstile token");
      return null;
    }

    const tokenTTL = 3 * 60 * 1000;
    if (Date.now() < token.createdAt + tokenTTL) {
      console.log("Prefetched turnstile token is valid");

      return token.token;
    } else {
      console.log("Turnstile token expired, getting new token");
      return (await getTurnstileToken())?.token ?? null;
    }
  }
}

// Hide elements with no-crazygames class if on CrazyGames
const hideCrazyGamesElements = () => {
  if (crazyGamesSDK.isOnCrazyGames()) {
    document.querySelectorAll(".no-crazygames").forEach((el) => {
      (el as HTMLElement).style.display = "none";
    });
  }
};

const isHudDemoRoute = () =>
  window.location.pathname === "/hud-demo" ||
  window.location.pathname === "/hud-demo.html" ||
  window.location.search.includes("hud-demo");

const isHudKitRoute = () =>
  window.location.pathname === "/hud-kit" ||
  window.location.pathname === "/hud-kit.html" ||
  window.location.search.includes("hud-kit");

const isUiKitRoute = () =>
  window.location.pathname === "/ui-kit" ||
  window.location.pathname === "/ui-kit.html" ||
  window.location.search.includes("ui-kit");

const isHudLiveDemoRoute = () =>
  window.location.pathname === "/hud-live-demo" ||
  window.location.pathname === "/hud-live-demo.html" ||
  window.location.search.includes("hud-live-demo");

const isHudPanelsRoute = () =>
  window.location.pathname === "/hud-panels" ||
  window.location.pathname === "/hud-panels.html" ||
  window.location.search.includes("hud-panels");

const isSandboxRoute = () =>
  window.location.pathname === "/sandbox" ||
  window.location.pathname === "/sandbox.html" ||
  window.location.search.includes("sandbox");

const isFoodSystemsSandboxRoute = () =>
  window.location.pathname === "/sandbox/food" ||
  window.location.pathname === "/sandbox-food" ||
  window.location.pathname === "/food-sandbox" ||
  window.location.search.includes("food-sandbox");

const isPopulationFoodSystemsSandboxRoute = () =>
  window.location.pathname === "/sandbox/population-food" ||
  window.location.pathname === "/sandbox/food-dynamics" ||
  window.location.pathname === "/population-food-sandbox" ||
  window.location.search.includes("population-food-sandbox");

const isWarBattleSystemsSandboxRoute = () =>
  window.location.pathname === "/sandbox/war" ||
  window.location.pathname === "/sandbox/war-battle" ||
  window.location.pathname === "/war-battle-sandbox" ||
  window.location.search.includes("war-battle-sandbox");

const isQuickGameTuningSandboxRoute = () =>
  window.location.pathname === "/sandbox/quick-game" ||
  window.location.pathname === "/quick-game-tuning" ||
  window.location.search.includes("quick-game-tuning");

const renderHudDemo = () => {
  document.body.innerHTML = "<hud-panel-workbench></hud-panel-workbench>";
};

const renderHudKit = () => {
  document.body.innerHTML = "<hud-panel-workbench></hud-panel-workbench>";
};

const renderUiKit = async () => {
  await import("./components/ui/UiKitPage");
  document.body.innerHTML = "<hud-ui-review-page></hud-ui-review-page>";
};

const renderHudLiveDemo = () => {
  document.body.innerHTML =
    "<hud-live-components-demo></hud-live-components-demo>";
};

const renderHudPanels = () => {
  document.body.innerHTML = "<hud-panel-workbench></hud-panel-workbench>";
};

const renderSandboxShell = (sandboxTag: string) => {
  removeExistingGameSurfaces();
  document.body.innerHTML = `
    <${sandboxTag}></${sandboxTag}>
    <lang-selector style="display: none"></lang-selector>
    <hud-game-shell>
      <div id="app" slot="app"></div>
      <attacks-display slot="bottom-center-top" class="w-full"></attacks-display>
      <control-panel slot="bottom-center-main" class="w-full"></control-panel>
      <unit-display slot="bottom-center-main" class="hidden lg:block w-full"></unit-display>
      <chat-display slot="bottom-side" class="w-full sm:w-auto"></chat-display>
      <events-display slot="bottom-side" class="w-full sm:w-auto"></events-display>
      <game-right-sidebar slot="top-right"></game-right-sidebar>
      <replay-panel slot="top-right"></replay-panel>
      <emoji-table></emoji-table>
      <build-menu></build-menu>
      <win-modal></win-modal>
      <game-starting-modal></game-starting-modal>
      <settings-modal></settings-modal>
      <player-panel></player-panel>
      <spawn-timer></spawn-timer>
      <immunity-timer></immunity-timer>
      <in-game-promo></in-game-promo>
      <game-info-modal></game-info-modal>
      <alert-frame></alert-frame>
      <chat-modal></chat-modal>
      <multi-tab-modal></multi-tab-modal>
      <game-left-sidebar></game-left-sidebar>
      <performance-overlay></performance-overlay>
      <player-info-overlay></player-info-overlay>
      <leader-board></leader-board>
      <team-stats></team-stats>
      <heads-up-message></heads-up-message>
    </hud-game-shell>
  `;
};

const renderSandbox = async () => {
  await import("./sandbox/SandboxBalancer");
  renderSandboxShell("sandbox-balancer");
};

const renderQuickGameTuningSandbox = async () => {
  await import("./sandbox/QuickGameTuningSandbox");
  renderSandboxShell("quick-game-tuning-sandbox");
};

const renderFoodSystemsSandbox = async () => {
  await import("./sandbox/FoodSystemsSandbox");
  removeExistingGameSurfaces();
  document.body.innerHTML = "<food-systems-sandbox></food-systems-sandbox>";
};

const renderPopulationFoodSystemsSandbox = async () => {
  await import("./sandbox/PopulationFoodSystemsSandbox");
  removeExistingGameSurfaces();
  document.body.innerHTML =
    "<population-food-systems-sandbox></population-food-systems-sandbox>";
};

const renderWarBattleSystemsSandbox = async () => {
  await import("./sandbox/WarBattleSystemsSandbox");
  removeExistingGameSurfaces();
  document.body.innerHTML =
    "<war-battle-systems-sandbox></war-battle-systems-sandbox>";
};

// Initialize the client when the DOM is loaded
const bootstrap = async () => {
  if (isQuickGameTuningSandboxRoute()) {
    await renderQuickGameTuningSandbox();
    installSafariPinchZoomBlocker();
    new Client().initializeSandbox();
    return;
  }

  if (isWarBattleSystemsSandboxRoute()) {
    await renderWarBattleSystemsSandbox();
    return;
  }

  if (isPopulationFoodSystemsSandboxRoute()) {
    await renderPopulationFoodSystemsSandbox();
    return;
  }

  if (isFoodSystemsSandboxRoute()) {
    await renderFoodSystemsSandbox();
    return;
  }

  if (isSandboxRoute()) {
    await renderSandbox();
    installSafariPinchZoomBlocker();
    new Client().initializeSandbox();
    return;
  }

  if (isHudKitRoute()) {
    renderHudKit();
    return;
  }

  if (isUiKitRoute()) {
    await renderUiKit();
    return;
  }

  if (isHudPanelsRoute()) {
    renderHudPanels();
    return;
  }

  if (isHudLiveDemoRoute()) {
    renderHudLiveDemo();
    return;
  }

  if (isHudDemoRoute()) {
    renderHudDemo();
    return;
  }

  // Prevent Safari's page-level pinch-zoom, which ignores `user-scalable=no`
  // on iOS and can softlock the HUD. See issue #2330.
  installSafariPinchZoomBlocker();

  new Client().initialize();
  initLayout();
  initNavigation();

  // Hide elements immediately
  hideCrazyGamesElements();

  // Also hide elements after a short delay to catch late-rendered components
  setTimeout(hideCrazyGamesElements, 100);
  setTimeout(hideCrazyGamesElements, 500);
};

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", bootstrap);
} else {
  bootstrap();
}

async function getTurnstileToken(): Promise<{
  token: string;
  createdAt: number;
}> {
  // Wait for Turnstile script to load (handles slow connections)
  let attempts = 0;
  while (typeof window.turnstile === "undefined" && attempts < 100) {
    await new Promise((resolve) => setTimeout(resolve, 100));
    attempts++;
  }

  if (typeof window.turnstile === "undefined") {
    throw new Error("Failed to load Turnstile script");
  }

  const widgetId = window.turnstile.render("#turnstile-container", {
    sitekey: ClientEnv.turnstileSiteKey(),
    size: "normal",
    execution: "execute",
    appearance: "interaction-only",
    theme: "light",
  });

  return new Promise((resolve, reject) => {
    window.turnstile.execute(widgetId, {
      callback: (token: string) => {
        window.turnstile.remove(widgetId);
        console.log(`Turnstile token received: ${token}`);
        resolve({ token, createdAt: Date.now() });
      },
      "error-callback": (errorCode: string) => {
        window.turnstile.remove(widgetId);
        console.error(`Turnstile error: ${errorCode}`);
        alert(`Turnstile error: ${errorCode}. Please refresh and try again.`);
        reject(new Error(`Turnstile failed: ${errorCode}`));
      },
    });
  });
}

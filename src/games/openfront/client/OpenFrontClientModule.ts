import { ClientGameRunner, LobbyConfig } from "src/client/ClientGameRunner";
import { AlternateViewEvent, InputHandler } from "src/client/InputHandler";
import { MoveWarshipIntentEvent, Transport } from "src/client/Transport";
import { createCanvas } from "src/client/Utils";
import { WebGLFrameBuilder } from "src/client/WebGLFrameBuilder";
import { GameView as WebGLGameView } from "src/client/render/gl";
import { ALL_UNIT_TYPES } from "src/client/render/types";
import { SoundManager } from "src/client/sound/SoundManager";
import { EventBus } from "src/core/EventBus";
import { ClientID } from "src/core/Schemas";
import { Config } from "src/core/configuration/Config";
import { GameMapLoader } from "src/core/game/GameMapLoader";
import { GameView } from "src/core/game/GameView";
import { loadTerrainMap, TerrainMapData } from "src/core/game/TerrainMapLoader";
import {
  DARK_MODE_KEY,
  USER_SETTINGS_CHANGED_EVENT,
  UserSettings,
} from "src/core/game/UserSettings";
import { WorkerClient } from "src/core/worker/WorkerClient";
import { createOpenFrontRenderer } from "./OpenFrontHud";

const WEBGL_CANVAS_ID = "webgl-debug-canvas";
const GAME_INPUT_OVERLAY_ID = "game-input-overlay";

export interface OpenFrontClientMountContext {
  lobbyConfig: LobbyConfig;
  clientID: ClientID | undefined;
  eventBus: EventBus;
  transport: Transport;
  userSettings: UserSettings;
  terrainLoad: Promise<TerrainMapData> | null;
  mapLoader: GameMapLoader;
}

export const OpenFrontClientModule = {
  async mount(ctx: OpenFrontClientMountContext): Promise<ClientGameRunner> {
    return mountOpenFrontClientGame(ctx);
  },
};

export function removeExistingGameSurfaces(): void {
  document
    .querySelectorAll<HTMLElement>(
      `#${WEBGL_CANVAS_ID}, #${GAME_INPUT_OVERLAY_ID}`,
    )
    .forEach((element) => element.remove());
}

// Build the WebGL view + its glCanvas. Must run before createOpenFrontRenderer
// so the controllers can be wired directly to the view.
function createWebGLView(terrainMap: TerrainMapData): {
  view: WebGLGameView;
  glCanvas: HTMLCanvasElement;
  cachedWebGLFrameCallback: { current: FrameRequestCallback | null };
} {
  const gameMap = terrainMap.gameMap;
  const mapWidth = gameMap.width();
  const mapHeight = gameMap.height();

  const terrainBytes = new Uint8Array(mapWidth * mapHeight);
  for (let y = 0; y < mapHeight; y++) {
    for (let x = 0; x < mapWidth; x++) {
      terrainBytes[y * mapWidth + x] = gameMap.terrainByte(gameMap.ref(x, y));
    }
  }

  const glCanvas = createCanvas();
  glCanvas.id = WEBGL_CANVAS_ID;
  glCanvas.style.pointerEvents = "none";
  document.body.insertBefore(glCanvas, document.body.firstChild);

  // Capture the WebGL renderer's animation-frame callback rather than letting
  // it run its own RAF loop. Two independent RAF loops race: when the user
  // pans, the WebGL renderer can draw with one-frame-stale camera state
  // because its RAF fires before canvas2D's RAF (which would have synced the
  // camera). Driving WebGL's draw synchronously from canvas2D's onPreRender
  // hook locks them to the same frame.
  const cachedWebGLFrameCallback: { current: FrameRequestCallback | null } = {
    current: null,
  };
  const captureRaf = (cb: FrameRequestCallback): number => {
    cachedWebGLFrameCallback.current = cb;
    return 0;
  };
  const captureCaf = (_id: number): void => {
    cachedWebGLFrameCallback.current = null;
  };

  const palette = new Float32Array(4096 * 2 * 4);
  const view = new WebGLGameView(
    glCanvas,
    {
      mapWidth,
      mapHeight,
      unitTypes: [...ALL_UNIT_TYPES],
      players: [],
      // Pre-allocate renderer textures for up to 1024 players. We add players
      // dynamically via view.addPlayers() as they come in from the simulation,
      // but the NamePass / palette / relation matrix all need a static upper
      // bound at construction time.
      maxPlayers: 1024,
    },
    terrainBytes,
    palette,
    captureRaf,
    captureCaf,
  );

  (window as unknown as { __webglView?: unknown }).__webglView = view;

  return { view, glCanvas, cachedWebGLFrameCallback };
}

function mountWebGLFrameLoop(
  terrainMap: TerrainMapData,
  view: WebGLGameView,
  glCanvas: HTMLCanvasElement,
  cachedWebGLFrameCallback: { current: FrameRequestCallback | null },
  transformHandler: import("src/client/TransformHandler").TransformHandler,
  gameView: GameView,
  eventBus: EventBus,
): { builder: WebGLFrameBuilder; stop: () => void } {
  const gameMap = terrainMap.gameMap;
  const mapWidth = gameMap.width();
  const mapHeight = gameMap.height();

  // Cache canvas dimensions to avoid forced reflows every frame. Reading
  // clientWidth/clientHeight flushes pending layout — at 60fps that's a
  // measurable cost. Only update on resize events from the observer.
  let cachedCanvasW = glCanvas.clientWidth;
  let cachedCanvasH = glCanvas.clientHeight;
  const resizeObs = new ResizeObserver((entries) => {
    for (const entry of entries) {
      const { width, height } = entry.contentRect;
      if (width > 0 && height > 0) {
        cachedCanvasW = width;
        cachedCanvasH = height;
      }
    }
  });
  resizeObs.observe(glCanvas);

  const syncCamera = (): void => {
    const scale = transformHandler.scale;
    const dpr = window.devicePixelRatio || 1;
    const centerX =
      transformHandler.offsetX +
      mapWidth / 2 +
      (cachedCanvasW - mapWidth) / (2 * scale);
    const centerY =
      transformHandler.offsetY +
      mapHeight / 2 +
      (cachedCanvasH - mapHeight) / (2 * scale);
    view.setCameraState(centerX, centerY, scale * dpr);
    // Invoke the WebGL renderer's frame callback synchronously, with the just-
    // updated camera state. The callback re-arms itself via captureRaf, so
    // we'll get a fresh callback ready for the next canvas2D frame.
    const cb = cachedWebGLFrameCallback.current;
    cachedWebGLFrameCallback.current = null;
    cb?.(performance.now());
  };

  // Move-target chevrons: when the player issues a warship move, show the
  // animated chevron pass at the target tile. The renderer needs the target's
  // tile x/y and the warship's owner smallID (so the chevrons use the right
  // color).
  eventBus.on(MoveWarshipIntentEvent, (e) => {
    const tile = e.tile;
    const tx = gameView.x(tile);
    const ty = gameView.y(tile);
    // Resolve owner via the first unit in the move set.
    const firstUnit = gameView.unit(e.unitIds[0]);
    if (firstUnit === undefined) return;
    view.showMoveIndicator(tx, ty, firstUnit.owner().smallID());
  });

  // Self-driving RAF: syncCamera reads the latest camera state from
  // TransformHandler, pushes it to WebGL, and synchronously invokes the
  // renderer's captured frame callback (which draws). One RAF = one
  // synchronized camera-update + WebGL render.
  let stopped = false;
  let animationFrameID: number | null = null;
  const driveFrame = (): void => {
    if (stopped) {
      return;
    }
    syncCamera();
    animationFrameID = requestAnimationFrame(driveFrame);
  };
  animationFrameID = requestAnimationFrame(driveFrame);

  return {
    builder: new WebGLFrameBuilder(view),
    stop: () => {
      stopped = true;
      resizeObs.disconnect();
      cachedWebGLFrameCallback.current = null;
      if (animationFrameID !== null) {
        cancelAnimationFrame(animationFrameID);
        animationFrameID = null;
      }
    },
  };
}

async function mountOpenFrontClientGame({
  lobbyConfig,
  clientID,
  eventBus,
  transport,
  userSettings,
  terrainLoad,
  mapLoader,
}: OpenFrontClientMountContext): Promise<ClientGameRunner> {
  if (lobbyConfig.gameStartInfo === undefined) {
    throw new Error("missing gameStartInfo");
  }
  const config = new Config(
    lobbyConfig.gameStartInfo.config,
    userSettings,
    lobbyConfig.gameRecord !== undefined,
  );
  let gameMap: TerrainMapData;

  if (terrainLoad) {
    gameMap = await terrainLoad;
  } else {
    gameMap = await loadTerrainMap(
      lobbyConfig.gameStartInfo.config.gameMap,
      lobbyConfig.gameStartInfo.config.gameMapSize,
      mapLoader,
    );
  }
  const worker = new WorkerClient(lobbyConfig.gameStartInfo, clientID);
  await worker.initialize();
  const gameView = new GameView(
    worker,
    config,
    gameMap,
    clientID,
    lobbyConfig.playerName,
    lobbyConfig.playerClanTag,
    lobbyConfig.gameStartInfo.gameID,
    lobbyConfig.gameStartInfo.players,
  );

  removeExistingGameSurfaces();

  // Transparent fullscreen overlay used purely as the pointer-event /
  // bounding-rect target for InputHandler + TransformHandler. The actual
  // map drawing happens on the WebGL canvas created in createWebGLView.
  const inputOverlay = document.createElement("div");
  inputOverlay.id = GAME_INPUT_OVERLAY_ID;
  inputOverlay.style.position = "fixed";
  inputOverlay.style.left = "0";
  inputOverlay.style.top = "0";
  inputOverlay.style.width = "100%";
  inputOverlay.style.height = "100%";
  inputOverlay.style.touchAction = "none";
  document.body.appendChild(inputOverlay);

  const soundManager = new SoundManager(eventBus, userSettings);
  let glCanvas: HTMLCanvasElement | null = null;
  let stopWebGLFrameLoop: (() => void) | null = null;
  let cleanupGameSurface: (() => void) | null = null;
  try {
    const webGLView = createWebGLView(gameMap);
    const { view, cachedWebGLFrameCallback } = webGLView;
    glCanvas = webGLView.glCanvas;

    // Bind the WebGL renderer's day/night mode to the existing darkMode
    // UserSetting so the in-game map matches the rest of the UI. Initial
    // apply + live updates via the per-key settings-changed event.
    const applyDayNightMode = (isDark: boolean): void => {
      view.getSettings().dayNight.mode = isDark ? "dark" : "light";
    };
    applyDayNightMode(userSettings.darkMode());
    globalThis.addEventListener(
      `${USER_SETTINGS_CHANGED_EVENT}:${DARK_MODE_KEY}`,
      (e) => applyDayNightMode((e as CustomEvent<string>).detail === "true"),
    );

    // Space-hold (and the settings-modal toggle) drives the affiliation
    // recolor. InputHandler emits AlternateViewEvent; the WebGL view needs
    // setAltView called to switch passes into alt mode.
    eventBus.on(AlternateViewEvent, (e) => view.setAltView(e.alternateView));

    view.setShowPatterns(userSettings.territoryPatterns());
    globalThis.addEventListener(
      `${USER_SETTINGS_CHANGED_EVENT}:settings.territoryPatterns`,
      (e) => view.setShowPatterns((e as CustomEvent<string>).detail === "true"),
    );

    const gameRenderer = createOpenFrontRenderer(
      inputOverlay,
      gameView,
      eventBus,
      lobbyConfig.playerRole,
      view,
    );

    const webGLFrameLoop = mountWebGLFrameLoop(
      gameMap,
      view,
      glCanvas,
      cachedWebGLFrameCallback,
      gameRenderer.transformHandler,
      gameView,
      eventBus,
    );
    const webglBuilder = webGLFrameLoop.builder;
    stopWebGLFrameLoop = webGLFrameLoop.stop;
    const inputHandler = new InputHandler(
      gameView,
      gameRenderer.uiState,
      inputOverlay,
      eventBus,
    );
    cleanupGameSurface = () => {
      stopWebGLFrameLoop?.();
      stopWebGLFrameLoop = null;
      inputHandler.destroy();
      view.dispose();
      const debugWindow = window as unknown as { __webglView?: unknown };
      if (debugWindow.__webglView === view) {
        delete debugWindow.__webglView;
      }
      inputOverlay.remove();
      glCanvas?.remove();
      glCanvas = null;
    };

    console.log(
      `creating private game got difficulty: ${lobbyConfig.gameStartInfo.config.difficulty}`,
    );

    return new ClientGameRunner(
      lobbyConfig,
      clientID,
      eventBus,
      gameRenderer,
      inputHandler,
      transport,
      worker,
      gameView,
      soundManager,
      userSettings,
      webglBuilder,
      () => {
        cleanupGameSurface?.();
        cleanupGameSurface = null;
      },
    );
  } catch (err) {
    cleanupGameSurface?.();
    if (cleanupGameSurface === null) {
      stopWebGLFrameLoop?.();
      inputOverlay.remove();
      glCanvas?.remove();
    }
    soundManager.dispose();
    worker.cleanup();
    throw err;
  }
}

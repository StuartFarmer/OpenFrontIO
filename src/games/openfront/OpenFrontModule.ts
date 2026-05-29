import type { JoinLobbyResult, LobbyConfig } from "src/client/ClientGameRunner";
import type { EventBus } from "src/core/EventBus";
import type { GameRunner } from "src/core/GameRunner";
import type { ClientID, GameStartInfo } from "src/core/Schemas";
import type { GameMapLoader } from "src/core/game/GameMapLoader";
import type {
  ErrorUpdate,
  GameUpdateViewData,
} from "src/core/game/GameUpdates";
import type {
  ClientGameModuleRuntime,
  CreateServerRunnerContext,
  GameModuleRuntime,
  ServerGameModuleRuntime,
} from "src/core/modules/GameModuleRuntime";

export const OPENFRONT_MODULE_ID = "openfront";

type OpenFrontUpdate = GameUpdateViewData | ErrorUpdate;

const openFrontServerRuntime: ServerGameModuleRuntime = {
  async createRunner(ctx): Promise<GameRunner> {
    const openFrontCtx = ctx as CreateServerRunnerContext<
      GameStartInfo,
      ClientID | undefined,
      GameMapLoader,
      OpenFrontUpdate
    >;
    const { createGameRunner } = await import("src/core/GameRunner");
    return createGameRunner(
      openFrontCtx.gameStart,
      openFrontCtx.clientId,
      openFrontCtx.mapLoader,
      openFrontCtx.onUpdate,
    );
  },
};

const openFrontClientRuntime: ClientGameModuleRuntime = {
  async mount({ eventBus, lobbyConfig }): Promise<JoinLobbyResult> {
    const { joinLobby } = await import("src/client/ClientGameRunner");
    return joinLobby(eventBus as EventBus, lobbyConfig as LobbyConfig);
  },
};

export const openFrontModule: GameModuleRuntime = {
  id: OPENFRONT_MODULE_ID,
  server: openFrontServerRuntime,
  client: openFrontClientRuntime,
};

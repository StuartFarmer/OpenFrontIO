import type { JoinLobbyResult, LobbyConfig } from "src/client/ClientGameRunner";
import type { EventBus } from "src/core/EventBus";
import type {
  ClientGameModuleRuntime,
  GameModuleRuntime,
  ServerGameModuleRuntime,
} from "src/core/modules/GameModuleRuntime";
import { OPENFRONT_MODULE_ID } from "./constants";
import type { OpenFrontCreateRunnerContext } from "./server/OpenFrontServerModule";

export { OPENFRONT_MODULE_ID };

const openFrontServerRuntime: ServerGameModuleRuntime = {
  async createRunner(ctx) {
    const { createOpenFrontGameRunner } =
      await import("./server/OpenFrontServerModule");
    return createOpenFrontGameRunner(ctx as OpenFrontCreateRunnerContext);
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

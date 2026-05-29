import type {
  GameModuleId,
  ServerGameModuleRuntime,
} from "src/core/modules/GameModuleRuntime";
import { OPENFRONT_MODULE_ID } from "src/games/openfront/constants";
import { openFrontServerModule } from "src/games/openfront/server/OpenFrontServerModule";

export const DEFAULT_SERVER_GAME_MODULE_ID = OPENFRONT_MODULE_ID;

const serverGameModules = new Map<GameModuleId, ServerGameModuleRuntime>([
  [OPENFRONT_MODULE_ID, openFrontServerModule],
]);

export function registerServerGameModule(
  moduleId: GameModuleId,
  runtime: ServerGameModuleRuntime,
): void {
  serverGameModules.set(moduleId, runtime);
}

export function getServerGameModule(
  moduleId?: GameModuleId,
): ServerGameModuleRuntime {
  const resolvedModuleId = moduleId ?? DEFAULT_SERVER_GAME_MODULE_ID;
  const module = serverGameModules.get(resolvedModuleId);
  if (!module) {
    throw new Error(`Unknown server game module: ${resolvedModuleId}`);
  }
  return module;
}

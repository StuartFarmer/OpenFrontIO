import type {
  GameModuleId,
  GameModuleRuntime,
} from "src/core/modules/GameModuleRuntime";
import {
  OPENFRONT_MODULE_ID,
  openFrontModule,
} from "src/games/openfront/OpenFrontModule";

export const DEFAULT_GAME_MODULE_ID = OPENFRONT_MODULE_ID;

const gameModules = new Map<GameModuleId, GameModuleRuntime>([
  [openFrontModule.id, openFrontModule],
]);

export function registerGameModule(module: GameModuleRuntime): void {
  gameModules.set(module.id, module);
}

export function getGameModule(moduleId?: GameModuleId): GameModuleRuntime {
  const resolvedModuleId = moduleId ?? DEFAULT_GAME_MODULE_ID;
  const module = gameModules.get(resolvedModuleId);
  if (!module) {
    throw new Error(`Unknown game module: ${resolvedModuleId}`);
  }
  return module;
}

export function listGameModules(): readonly GameModuleRuntime[] {
  return [...gameModules.values()];
}

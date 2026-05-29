import { createGameRunner, type GameRunner } from "src/core/GameRunner";
import type { ClientID, GameStartInfo } from "src/core/Schemas";
import type { GameMapLoader } from "src/core/game/GameMapLoader";
import type {
  ErrorUpdate,
  GameUpdateViewData,
} from "src/core/game/GameUpdates";
import type {
  CreateServerRunnerContext,
  ServerGameModuleRuntime,
} from "src/core/modules/GameModuleRuntime";

type OpenFrontUpdate = GameUpdateViewData | ErrorUpdate;

export type OpenFrontCreateRunnerContext = CreateServerRunnerContext<
  GameStartInfo,
  ClientID | undefined,
  GameMapLoader,
  OpenFrontUpdate
>;

export const openFrontServerModule: ServerGameModuleRuntime = {
  async createRunner(ctx): Promise<GameRunner> {
    return createOpenFrontGameRunner(ctx as OpenFrontCreateRunnerContext);
  },
};

export function createOpenFrontGameRunner(
  ctx: OpenFrontCreateRunnerContext,
): Promise<GameRunner> {
  return createGameRunner(
    ctx.gameStart,
    ctx.clientId,
    ctx.mapLoader,
    ctx.onUpdate,
  );
}

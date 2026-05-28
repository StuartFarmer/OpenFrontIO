import type { MechanicsConfigInput } from "../../core/configuration/MechanicsConfig";
import { Difficulty, Duos, GameMapType, GameMode } from "../../core/game/Game";
import type {
  ClientID,
  GameID,
  GameStartInfo,
  PlayerCosmetics,
} from "../../core/Schemas";
import { createSinglePlayerGameStartInfo } from "./SinglePlayerGameStart";

export interface CreateQuickGameStartInfoOptions {
  gameID: GameID;
  clientID: ClientID;
  username: string;
  clanTag: string | null;
  cosmetics?: PlayerCosmetics;
  difficulty?: Difficulty;
  nations?: GameStartInfo["config"]["nations"];
  mechanics?: MechanicsConfigInput;
  isSandbox?: boolean;
  lobbyCreatedAt?: number;
}

export function createQuickGameStartInfo(
  options: CreateQuickGameStartInfoOptions,
): GameStartInfo {
  return createSinglePlayerGameStartInfo({
    gameID: options.gameID,
    clientID: options.clientID,
    username: options.username,
    clanTag: options.clanTag,
    cosmetics: options.cosmetics ?? {},
    selectedMap: GameMapType.World,
    compactMap: false,
    gameMode: GameMode.FFA,
    teamCount: Duos,
    difficulty: options.difficulty ?? Difficulty.Medium,
    bots: 0,
    infiniteGold: false,
    infiniteTroops: false,
    instantBuild: false,
    randomSpawn: true,
    disabledUnits: [],
    nations: options.nations ?? 24,
    mechanics: options.mechanics,
    isSandbox: options.isSandbox,
    lobbyCreatedAt: options.lobbyCreatedAt,
  });
}

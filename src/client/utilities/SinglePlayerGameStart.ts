import type { MechanicsConfigInput } from "../../core/configuration/MechanicsConfig";
import {
  Difficulty,
  GameMapSize,
  GameMapType,
  GameMode,
  GameType,
  UnitType,
} from "../../core/game/Game";
import type {
  ClientID,
  GameID,
  GameStartInfo,
  PlayerCosmetics,
  TeamCountConfig,
} from "../../core/Schemas";

export interface CreateSinglePlayerGameStartInfoOptions {
  gameID: GameID;
  clientID: ClientID;
  username: string;
  clanTag: string | null;
  cosmetics: PlayerCosmetics;
  selectedMap: GameMapType;
  compactMap: boolean;
  gameMode: GameMode;
  teamCount: TeamCountConfig;
  difficulty: Difficulty;
  maxTimerValue?: number;
  bots: number;
  infiniteGold: boolean;
  infiniteTroops: boolean;
  instantBuild: boolean;
  randomSpawn: boolean;
  disabledUnits: UnitType[];
  nations: GameStartInfo["config"]["nations"];
  goldMultiplier?: number;
  startingGold?: number;
  disableAlliances?: boolean;
  waterNukes?: boolean;
  mechanics?: MechanicsConfigInput;
  isSandbox?: boolean;
  lobbyCreatedAt?: number;
}

export function createSinglePlayerGameStartInfo(
  options: CreateSinglePlayerGameStartInfoOptions,
): GameStartInfo {
  return {
    gameID: options.gameID,
    players: [
      {
        clientID: options.clientID,
        username: options.username,
        clanTag: options.clanTag,
        cosmetics: options.cosmetics,
      },
    ],
    config: {
      gameMap: options.selectedMap,
      gameMapSize: options.compactMap
        ? GameMapSize.Compact
        : GameMapSize.Normal,
      gameType: GameType.Singleplayer,
      gameMode: options.gameMode,
      playerTeams: options.teamCount,
      difficulty: options.difficulty,
      maxTimerValue: options.maxTimerValue,
      bots: options.bots,
      infiniteGold: options.infiniteGold,
      donateGold: options.gameMode === GameMode.Team,
      donateTroops: options.gameMode === GameMode.Team,
      infiniteTroops: options.infiniteTroops,
      instantBuild: options.instantBuild,
      randomSpawn: options.randomSpawn,
      disabledUnits: options.disabledUnits
        .map((u) => Object.values(UnitType).find((ut) => ut === u))
        .filter((ut): ut is UnitType => ut !== undefined),
      nations: options.nations,
      ...(options.goldMultiplier !== undefined
        ? { goldMultiplier: options.goldMultiplier }
        : {}),
      ...(options.startingGold !== undefined
        ? { startingGold: options.startingGold }
        : {}),
      ...(options.disableAlliances ? { disableAlliances: true } : {}),
      ...(options.waterNukes ? { waterNukes: true } : {}),
      ...(options.mechanics ? { mechanics: options.mechanics } : {}),
      ...(options.isSandbox ? { isSandbox: true } : {}),
    },
    lobbyCreatedAt: options.lobbyCreatedAt ?? Date.now(),
  };
}

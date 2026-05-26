import { describe, expect, it } from "vitest";
import { createSinglePlayerGameStartInfo } from "../../../src/client/utilities/SinglePlayerGameStart";
import {
  Difficulty,
  GameMapSize,
  GameMapType,
  GameMode,
  GameType,
} from "../../../src/core/game/Game";
import { GameStartInfoSchema } from "../../../src/core/Schemas";

describe("createSinglePlayerGameStartInfo", () => {
  it("builds the same single-player config shape used by local games", () => {
    const info = createSinglePlayerGameStartInfo({
      gameID: "GAME1234",
      clientID: "CLNT1234",
      username: "Tester",
      clanTag: null,
      cosmetics: {},
      selectedMap: GameMapType.World,
      compactMap: false,
      gameMode: GameMode.FFA,
      teamCount: 2,
      difficulty: Difficulty.Easy,
      bots: 4,
      infiniteGold: false,
      infiniteTroops: false,
      instantBuild: false,
      randomSpawn: false,
      disabledUnits: [],
      nations: "default",
      lobbyCreatedAt: 123,
    });

    expect(GameStartInfoSchema.parse(info)).toEqual(info);
    expect(info.config).toMatchObject({
      gameMap: GameMapType.World,
      gameMapSize: GameMapSize.Normal,
      gameType: GameType.Singleplayer,
      gameMode: GameMode.FFA,
      bots: 4,
      nations: "default",
      donateGold: false,
      donateTroops: false,
    });
  });

  it("supports sandbox mechanics and isolated World-map settings", () => {
    const info = createSinglePlayerGameStartInfo({
      gameID: "SAND1234",
      clientID: "SAND5678",
      username: "Sandbox",
      clanTag: null,
      cosmetics: {},
      selectedMap: GameMapType.World,
      compactMap: false,
      gameMode: GameMode.FFA,
      teamCount: 2,
      difficulty: Difficulty.Easy,
      bots: 0,
      infiniteGold: false,
      infiniteTroops: false,
      instantBuild: false,
      randomSpawn: false,
      disabledUnits: [],
      nations: "disabled",
      mechanics: {
        populationResources: {
          troopLogisticGrowthRate: 0.02,
        },
      },
      isSandbox: true,
      lobbyCreatedAt: 456,
    });

    expect(GameStartInfoSchema.parse(info)).toEqual(info);
    expect(info.config.isSandbox).toBe(true);
    expect(info.config.nations).toBe("disabled");
    expect(info.config.bots).toBe(0);
    expect(
      info.config.mechanics?.populationResources?.troopLogisticGrowthRate,
    ).toBe(0.02);
  });
});

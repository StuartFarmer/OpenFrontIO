import { describe, expect, it } from "vitest";
import { createQuickGameStartInfo } from "../../../src/client/utilities/QuickGame";
import {
  Difficulty,
  GameMapSize,
  GameMapType,
  GameMode,
  GameType,
} from "../../../src/core/game/Game";
import { GameStartInfoSchema } from "../../../src/core/Schemas";

describe("createQuickGameStartInfo", () => {
  it("builds a one-click World-map single-player game with nations", () => {
    const info = createQuickGameStartInfo({
      gameID: "GAME1234",
      clientID: "CLNT1234",
      username: "Tester",
      clanTag: null,
      lobbyCreatedAt: 123,
    });

    expect(GameStartInfoSchema.parse(info)).toEqual(info);
    expect(info.config).toMatchObject({
      gameMap: GameMapType.World,
      gameMapSize: GameMapSize.Normal,
      gameType: GameType.Singleplayer,
      gameMode: GameMode.FFA,
      difficulty: Difficulty.Medium,
      bots: 0,
      nations: 24,
      randomSpawn: true,
      infiniteGold: false,
      infiniteTroops: false,
      instantBuild: false,
    });
  });
});

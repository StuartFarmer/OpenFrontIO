import { readFileSync } from "node:fs";
import path from "node:path";
import { createSinglePlayerGameStartInfo } from "src/client/utilities/SinglePlayerGameStart";
import {
  Difficulty,
  GameMapType,
  GameMode,
  PlayerType,
  UnitType,
} from "src/core/game/Game";
import type { GameMapLoader, MapData } from "src/core/game/GameMapLoader";
import type { MapManifest } from "src/core/game/TerrainMapLoader";
import { GameRunner } from "src/core/GameRunner";
import { GameStartInfoSchema } from "src/core/Schemas";
import { OPENFRONT_MODULE_ID } from "src/games/openfront/constants";
import { openFrontServerModule } from "src/games/openfront/server/OpenFrontServerModule";
import { DEFAULT_GAME_MODULE_ID, getGameModule } from "src/games/registry";
import {
  DEFAULT_SERVER_GAME_MODULE_ID,
  getServerGameModule,
} from "src/games/serverRegistry";
import { describe, expect, test } from "vitest";

describe("OpenFront server module", () => {
  test("openfront_server_module_creates_runner", async () => {
    const updates: unknown[] = [];
    const runner = (await openFrontServerModule.createRunner({
      gameStart: makeGameStartInfo(),
      clientId: "CLNT0001",
      mapLoader: new BigPlainsMapLoader(),
      onUpdate: (update) => updates.push(update),
    })) as GameRunner;

    expect(runner).toBeInstanceOf(GameRunner);
    expect(runner.game.config().gameConfig().gameMap).toBe(GameMapType.World);
    expect(runner.game.allPlayers()).toHaveLength(1);
    expect(runner.game.allPlayers()[0].info().playerType).toBe(
      PlayerType.Human,
    );
    expect(updates).toHaveLength(0);
  });

  test("registry_defaults_to_openfront_server_runtime", () => {
    const module = getGameModule();

    expect(DEFAULT_GAME_MODULE_ID).toBe(OPENFRONT_MODULE_ID);
    expect(module.id).toBe(OPENFRONT_MODULE_ID);
    expect(module.server?.createRunner).toEqual(expect.any(Function));
  });

  test("server_registry_defaults_to_openfront_without_client_runtime", () => {
    expect(DEFAULT_SERVER_GAME_MODULE_ID).toBe(OPENFRONT_MODULE_ID);
    expect(getServerGameModule()).toBe(openFrontServerModule);
  });
});

function makeGameStartInfo() {
  const info = createSinglePlayerGameStartInfo({
    gameID: "GAME1234",
    clientID: "CLNT0001",
    username: "Tester",
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
    disabledUnits: [UnitType.RailStation],
    nations: "disabled",
    lobbyCreatedAt: 123,
  });

  return GameStartInfoSchema.parse(info);
}

class BigPlainsMapLoader implements GameMapLoader {
  getMapData(): MapData {
    return {
      mapBin: () => loadBinary("map.bin"),
      map4xBin: () => loadBinary("map4x.bin"),
      map16xBin: () => loadBinary("map16x.bin"),
      manifest: async () =>
        JSON.parse(loadText("manifest.json")) as MapManifest,
      webpPath: mapPath("thumbnail.webp"),
    };
  }
}

function loadBinary(fileName: string): Promise<Uint8Array> {
  return Promise.resolve(new Uint8Array(readFileSync(mapPath(fileName))));
}

function loadText(fileName: string): string {
  return readFileSync(mapPath(fileName), "utf8");
}

function mapPath(fileName: string): string {
  return path.resolve(
    import.meta.dirname,
    "../../testdata/maps/big_plains",
    fileName,
  );
}

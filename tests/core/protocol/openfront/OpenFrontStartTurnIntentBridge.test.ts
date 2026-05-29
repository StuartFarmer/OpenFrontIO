import { describe, expect, test } from "vitest";
import { createSinglePlayerGameStartInfo } from "../../../../src/client/utilities/SinglePlayerGameStart";
import {
  Difficulty,
  GameMapType,
  GameMode,
} from "../../../../src/core/game/Game";
import type { GameStartInfo, StampedIntent } from "../../../../src/core/Schemas";
import { OPENFRONT_MODULE_ID } from "../../../../src/core/protocol/openfront/constants";
import {
  toEngineGameStartEnvelope,
  toEngineStampedIntentEnvelope,
  toEngineTurnEnvelope,
  toOpenFrontGameStartInfo,
  toOpenFrontStampedIntent,
  toOpenFrontTurn,
} from "../../../../src/core/protocol/openfront/startTurnIntent";

describe("OpenFront start, turn, and intent bridge", () => {
  test("openfront_turn_bridge_round_trips_stamped_intents", () => {
    const intent = {
      type: "spawn",
      tile: 99,
      clientID: "client-a",
    } satisfies StampedIntent;
    const turn = {
      turnNumber: 12,
      intents: [intent],
      hash: 9876,
    };

    const intentEnvelope = toEngineStampedIntentEnvelope(intent);
    const turnEnvelope = toEngineTurnEnvelope(turn);
    const roundTripIntent = toOpenFrontStampedIntent(intentEnvelope);
    const roundTripTurn = toOpenFrontTurn(turnEnvelope);

    expect(intentEnvelope).toEqual({
      clientId: "client-a",
      type: "spawn",
      payload: intent,
    });
    expect(roundTripIntent).toEqual(intent);
    expect(turnEnvelope).toMatchObject({
      moduleId: OPENFRONT_MODULE_ID,
      turnNumber: 12,
      hash: 9876,
    });
    expect(turnEnvelope.intents[0].payload).toBe(intent);
    expect(roundTripTurn).toEqual(turn);
  });

  test("legacy_game_start_defaults_module_id_to_openfront", () => {
    const gameStart = makeGameStart();

    const envelope = toEngineGameStartEnvelope(gameStart);
    const roundTrip = toOpenFrontGameStartInfo(envelope);

    expect(envelope.moduleId).toBe(OPENFRONT_MODULE_ID);
    expect(envelope.gameId).toBe(gameStart.gameID);
    expect(envelope.players).toEqual([
      {
        playerId: "client-a",
        clientId: "client-a",
        username: "Ada",
        profile: gameStart.players[0],
      },
    ]);
    expect(roundTrip).toEqual(gameStart);
  });

  test("legacy_records_accept_existing_module_id_spellings", () => {
    const gameStart = {
      ...makeGameStart(),
      moduleID: "openfront-legacy",
    };
    const turn = {
      moduleId: "openfront-current",
      turnNumber: 1,
      intents: [
        {
          type: "spawn",
          tile: 1,
          clientID: "client-a",
        } satisfies StampedIntent,
      ],
    };

    expect(toEngineGameStartEnvelope(gameStart).moduleId).toBe(
      "openfront-legacy",
    );
    expect(toEngineTurnEnvelope(turn).moduleId).toBe("openfront-current");
  });
});

function makeGameStart(): GameStartInfo {
  return createSinglePlayerGameStartInfo({
    gameID: "game-a",
    clientID: "client-a",
    username: "Ada",
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
    lobbyCreatedAt: 1_764_320_000,
  });
}

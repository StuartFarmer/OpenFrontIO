import type {
  GameStartEnvelope,
  StampedIntentEnvelope,
  TurnEnvelope,
} from "../types";
import {
  GameStartEnvelopeSchema,
  StampedIntentEnvelopeSchema,
  TurnEnvelopeSchema,
} from "../schemas";
import type { GameStartInfo, Player, StampedIntent, Turn } from "../../Schemas";
import { OPENFRONT_MODULE_ID } from "./constants";

type LegacyModuleRecord = {
  moduleId?: string;
  moduleID?: string;
};

export type OpenFrontGameStartEnvelope = GameStartEnvelope<
  GameStartInfo["config"],
  Player
> & {
  moduleId: typeof OPENFRONT_MODULE_ID | string;
};

export type OpenFrontStampedIntentEnvelope =
  StampedIntentEnvelope<StampedIntent>;

export type OpenFrontTurnEnvelope = TurnEnvelope<StampedIntent> & {
  moduleId: typeof OPENFRONT_MODULE_ID | string;
};

export function toEngineGameStartEnvelope(
  gameStart: GameStartInfo & LegacyModuleRecord,
): OpenFrontGameStartEnvelope {
  const envelope = {
    gameId: gameStart.gameID,
    moduleId: legacyModuleId(gameStart),
    lobbyCreatedAt: gameStart.lobbyCreatedAt,
    visibleAt: gameStart.visibleAt,
    players: gameStart.players.map((player) => ({
      playerId: player.clientID,
      clientId: player.clientID,
      username: player.username,
      profile: player,
    })),
    config: gameStart.config,
  } satisfies OpenFrontGameStartEnvelope;

  return GameStartEnvelopeSchema.parse(envelope) as OpenFrontGameStartEnvelope;
}

export function toOpenFrontGameStartInfo(
  envelope: GameStartEnvelope,
): GameStartInfo {
  const parsed = GameStartEnvelopeSchema.parse(envelope);

  const gameStart: GameStartInfo = {
    gameID: parsed.gameId,
    lobbyCreatedAt: parsed.lobbyCreatedAt,
    config: parsed.config as GameStartInfo["config"],
    players: parsed.players.map((player) => {
      if (isRecord(player.profile)) {
        return player.profile as Player;
      }

      return {
        clientID: player.clientId ?? player.playerId,
        username: player.username ?? player.playerId,
        clanTag: null,
      } satisfies Player;
    }),
  };

  if (parsed.visibleAt !== undefined) {
    gameStart.visibleAt = parsed.visibleAt;
  }

  return gameStart;
}

export function toEngineStampedIntentEnvelope(
  intent: StampedIntent,
): OpenFrontStampedIntentEnvelope {
  const envelope = {
    clientId: intent.clientID,
    type: intent.type,
    payload: intent,
  } satisfies OpenFrontStampedIntentEnvelope;

  return StampedIntentEnvelopeSchema.parse(
    envelope,
  ) as OpenFrontStampedIntentEnvelope;
}

export function toOpenFrontStampedIntent(
  envelope: StampedIntentEnvelope,
): StampedIntent {
  const parsed = StampedIntentEnvelopeSchema.parse(envelope);
  const payload = isRecord(parsed.payload) ? parsed.payload : {};

  return {
    ...payload,
    type: parsed.type,
    clientID: parsed.clientId,
  } as StampedIntent;
}

export function toEngineTurnEnvelope(
  turn: Turn & LegacyModuleRecord,
): OpenFrontTurnEnvelope {
  const envelope = {
    moduleId: legacyModuleId(turn),
    turnNumber: turn.turnNumber,
    intents: turn.intents.map(toEngineStampedIntentEnvelope),
    hash: turn.hash,
  } satisfies OpenFrontTurnEnvelope;

  return TurnEnvelopeSchema.parse(envelope) as OpenFrontTurnEnvelope;
}

export function toOpenFrontTurn(envelope: TurnEnvelope): Turn {
  const parsed = TurnEnvelopeSchema.parse(envelope);

  const turn: Turn = {
    turnNumber: parsed.turnNumber,
    intents: parsed.intents.map(toOpenFrontStampedIntent),
  };

  if (parsed.hash !== undefined) {
    turn.hash = parsed.hash;
  }

  return turn;
}

function legacyModuleId(record: LegacyModuleRecord): string {
  return record.moduleId ?? record.moduleID ?? OPENFRONT_MODULE_ID;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

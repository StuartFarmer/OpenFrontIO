import { z } from "zod";
import type {
  EngineErrorEnvelope,
  EngineMapDeltaEnvelope,
  EnginePlayerEnvelope,
  EngineUpdateEnvelope,
  EngineUpdateMetricsEnvelope,
  GameStartEnvelope,
  ModuleEventEnvelope,
  StampedIntentEnvelope,
  TurnEnvelope,
} from "./types";

const requiredUnknown = () =>
  z.custom<unknown>((_value) => true, {
    message: "Expected module-owned payload",
  });

export const Uint32ArraySchema = z.custom<Uint32Array>(
  (value) => value instanceof Uint32Array,
  { message: "Expected Uint32Array" },
);

export const EnginePlayerEnvelopeSchema: z.ZodType<EnginePlayerEnvelope> =
  z.object({
    playerId: z.string().min(1),
    clientId: z.string().min(1).optional(),
    username: z.string().optional(),
    profile: requiredUnknown().optional(),
  });

export const GameStartEnvelopeSchema: z.ZodType<GameStartEnvelope> = z.object({
  gameId: z.string().min(1),
  moduleId: z.string().min(1),
  lobbyCreatedAt: z.number().finite(),
  visibleAt: z.number().finite().optional(),
  players: z.array(EnginePlayerEnvelopeSchema),
  config: requiredUnknown(),
});

export const StampedIntentEnvelopeSchema: z.ZodType<StampedIntentEnvelope> =
  z.object({
    clientId: z.string().min(1),
    type: z.string().min(1),
    payload: requiredUnknown(),
  });

export const TurnEnvelopeSchema: z.ZodType<TurnEnvelope> = z.object({
  moduleId: z.string().min(1),
  turnNumber: z.number().int().nonnegative(),
  intents: z.array(StampedIntentEnvelopeSchema),
  hash: z.number().int().nullable().optional(),
});

export const EngineMapDeltaEnvelopeSchema: z.ZodType<EngineMapDeltaEnvelope> =
  z.object({
    packedTileStateUpdates: Uint32ArraySchema.optional(),
    packedTerrainUpdates: Uint32ArraySchema.optional(),
    packedMotionPlans: Uint32ArraySchema.optional(),
  });

export const ModuleEventEnvelopeSchema: z.ZodType<ModuleEventEnvelope> =
  z.object({
    type: z.string().min(1),
    payload: requiredUnknown(),
  });

export const EngineUpdateMetricsEnvelopeSchema: z.ZodType<EngineUpdateMetricsEnvelope> =
  z.object({
    tickExecutionDuration: z.number().finite().nonnegative().optional(),
    pendingTurns: z.number().int().nonnegative().optional(),
  });

export const EngineUpdateEnvelopeSchema: z.ZodType<EngineUpdateEnvelope> =
  z.object({
    moduleId: z.string().min(1),
    tick: z.number().int().nonnegative(),
    map: EngineMapDeltaEnvelopeSchema.optional(),
    events: z.array(ModuleEventEnvelopeSchema),
    metrics: EngineUpdateMetricsEnvelopeSchema.optional(),
  });

export const EngineErrorEnvelopeSchema: z.ZodType<EngineErrorEnvelope> =
  z.object({
    moduleId: z.string().min(1).optional(),
    code: z.string().min(1),
    message: z.string().min(1),
    details: requiredUnknown().optional(),
    tick: z.number().int().nonnegative().optional(),
    recoverable: z.boolean().optional(),
  });

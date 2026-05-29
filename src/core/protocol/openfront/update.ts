import type { EngineUpdateEnvelope, ModuleEventEnvelope } from "../types";
import { EngineUpdateEnvelopeSchema } from "../schemas";
import { collectUpdateEnvelopeTransferables } from "../transferables";
import type { GameUpdates } from "../../game/Game";
import type { GameUpdateViewData } from "../../game/GameUpdates";
import type { NameViewData } from "../../game/Game";
import {
  OPENFRONT_LEGACY_UPDATES_EVENT,
  OPENFRONT_MODULE_ID,
  OPENFRONT_PLAYER_NAME_VIEW_DATA_EVENT,
} from "./constants";

export interface OpenFrontLegacyUpdatesEvent
  extends ModuleEventEnvelope<GameUpdates> {
  type: typeof OPENFRONT_LEGACY_UPDATES_EVENT;
}

export interface OpenFrontPlayerNameViewDataEvent
  extends ModuleEventEnvelope<Record<string, NameViewData>> {
  type: typeof OPENFRONT_PLAYER_NAME_VIEW_DATA_EVENT;
}

export type OpenFrontUpdateEvent =
  | OpenFrontLegacyUpdatesEvent
  | OpenFrontPlayerNameViewDataEvent;

export type OpenFrontUpdateEnvelope =
  EngineUpdateEnvelope<OpenFrontUpdateEvent["payload"]> & {
    moduleId: typeof OPENFRONT_MODULE_ID;
    events: OpenFrontUpdateEvent[];
  };

export function toEngineUpdateEnvelope(
  update: GameUpdateViewData,
): OpenFrontUpdateEnvelope {
  const envelope = {
    moduleId: OPENFRONT_MODULE_ID,
    tick: update.tick,
    map: {
      packedTileStateUpdates: update.packedTileUpdates,
      packedMotionPlans: update.packedMotionPlans,
    },
    events: [
      {
        type: OPENFRONT_LEGACY_UPDATES_EVENT,
        payload: update.updates,
      },
      {
        type: OPENFRONT_PLAYER_NAME_VIEW_DATA_EVENT,
        payload: update.playerNameViewData,
      },
    ],
    metrics: openFrontMetrics(update),
  } satisfies OpenFrontUpdateEnvelope;

  return EngineUpdateEnvelopeSchema.parse(envelope) as OpenFrontUpdateEnvelope;
}

export function toOpenFrontGameUpdateViewData(
  envelope: EngineUpdateEnvelope,
): GameUpdateViewData {
  const parsed = EngineUpdateEnvelopeSchema.parse(envelope);
  const updates = findOpenFrontEventPayload<GameUpdates>(
    parsed.events,
    OPENFRONT_LEGACY_UPDATES_EVENT,
  );
  const playerNameViewData = findOpenFrontEventPayload<
    Record<string, NameViewData>
  >(parsed.events, OPENFRONT_PLAYER_NAME_VIEW_DATA_EVENT);
  const update: GameUpdateViewData = {
    tick: parsed.tick,
    updates,
    packedTileUpdates:
      parsed.map?.packedTileStateUpdates ?? new Uint32Array(0),
    playerNameViewData,
  };

  if (parsed.map?.packedMotionPlans !== undefined) {
    update.packedMotionPlans = parsed.map.packedMotionPlans;
  }
  if (parsed.metrics?.tickExecutionDuration !== undefined) {
    update.tickExecutionDuration = parsed.metrics.tickExecutionDuration;
  }
  if (parsed.metrics?.pendingTurns !== undefined) {
    update.pendingTurns = parsed.metrics.pendingTurns;
  }

  return update;
}

export function collectOpenFrontUpdateTransferables(
  update: GameUpdateViewData,
): ArrayBuffer[] {
  return collectUpdateEnvelopeTransferables(toEngineUpdateEnvelope(update));
}

function openFrontMetrics(
  update: GameUpdateViewData,
): OpenFrontUpdateEnvelope["metrics"] {
  const metrics = {
    tickExecutionDuration: update.tickExecutionDuration,
    pendingTurns: update.pendingTurns,
  };

  return Object.values(metrics).some((value) => value !== undefined)
    ? metrics
    : undefined;
}

function findOpenFrontEventPayload<TPayload>(
  events: ModuleEventEnvelope[],
  type: OpenFrontUpdateEvent["type"],
): TPayload {
  const event = events.find((candidate) => candidate.type === type);
  if (!event) {
    throw new Error(`Missing OpenFront update bridge event: ${type}`);
  }
  return event.payload as TPayload;
}

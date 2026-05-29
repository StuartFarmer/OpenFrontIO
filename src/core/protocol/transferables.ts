import type { EngineMapDeltaEnvelope, EngineUpdateEnvelope } from "./types";

export function collectMapDeltaTransferables(
  map: EngineMapDeltaEnvelope | undefined,
): ArrayBuffer[] {
  if (!map) {
    return [];
  }

  const transferables = new Set<ArrayBuffer>();
  for (const view of [
    map.packedTileStateUpdates,
    map.packedTerrainUpdates,
    map.packedMotionPlans,
  ]) {
    if (!view || !(view.buffer instanceof ArrayBuffer)) {
      continue;
    }
    transferables.add(view.buffer);
  }

  return [...transferables];
}

export function collectUpdateEnvelopeTransferables(
  update: EngineUpdateEnvelope,
): ArrayBuffer[] {
  return collectMapDeltaTransferables(update.map);
}

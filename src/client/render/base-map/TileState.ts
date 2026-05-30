import { OWNER_MASK } from "../gl/utils/TileCodec";
import type {
  BaseMapOwnerId,
  BaseMapSize,
  BaseMapTileRef,
  BaseMapTileStateDelta,
} from "./Types";

export { OWNER_MASK as BASE_MAP_OWNER_MASK };

export function ownerIdFromTileState(state: number): BaseMapOwnerId {
  return state & OWNER_MASK;
}

export function writeOwnerToTileState(
  state: number,
  ownerId: BaseMapOwnerId,
): number {
  return (state & ~OWNER_MASK) | (ownerId & OWNER_MASK);
}

export function tileRefForPoint(
  size: BaseMapSize,
  x: number,
  y: number,
): BaseMapTileRef | null {
  if (!Number.isInteger(x) || !Number.isInteger(y)) return null;
  if (x < 0 || y < 0 || x >= size.width || y >= size.height) return null;
  return y * size.width + x;
}

export function pointForTileRef(
  size: BaseMapSize,
  ref: BaseMapTileRef,
): { x: number; y: number } {
  assertTileRefInBounds(size, ref);
  return { x: ref % size.width, y: Math.floor(ref / size.width) };
}

export function assertTileRefInBounds(
  size: BaseMapSize,
  ref: BaseMapTileRef,
): void {
  const tileCount = size.width * size.height;
  if (!Number.isInteger(ref) || ref < 0 || ref >= tileCount) {
    throw new RangeError(`tile ref ${ref} is outside 0..${tileCount - 1}`);
  }
}

export function buildOwnerClaimDeltas(
  size: BaseMapSize,
  tileState: Uint16Array,
  centerRef: BaseMapTileRef,
  radius: number,
  ownerId: BaseMapOwnerId,
): BaseMapTileStateDelta[] {
  validateTileBufferLength(size, tileState, "tileState");
  assertTileRefInBounds(size, centerRef);
  if (!Number.isInteger(radius) || radius < 0) {
    throw new RangeError("claim radius must be a non-negative integer");
  }

  const center = pointForTileRef(size, centerRef);
  const radiusSq = radius * radius;
  const deltas: BaseMapTileStateDelta[] = [];

  for (let y = center.y - radius; y <= center.y + radius; y++) {
    for (let x = center.x - radius; x <= center.x + radius; x++) {
      const ref = tileRefForPoint(size, x, y);
      if (ref === null) continue;
      const dx = x - center.x;
      const dy = y - center.y;
      if (dx * dx + dy * dy > radiusSq) continue;

      const nextState = writeOwnerToTileState(tileState[ref], ownerId);
      if (tileState[ref] === nextState) continue;
      tileState[ref] = nextState;
      deltas.push({ ref, state: nextState });
    }
  }

  return deltas;
}

export function validateMapSize(size: BaseMapSize): void {
  if (!Number.isInteger(size.width) || size.width <= 0) {
    throw new RangeError("base map width must be a positive integer");
  }
  if (!Number.isInteger(size.height) || size.height <= 0) {
    throw new RangeError("base map height must be a positive integer");
  }
}

export function validateTileBufferLength(
  size: BaseMapSize,
  buffer: Uint8Array | Uint16Array,
  name: string,
): void {
  const expected = size.width * size.height;
  if (buffer.length !== expected) {
    throw new RangeError(
      `${name} length ${buffer.length} does not match map tile count ${expected}`,
    );
  }
}

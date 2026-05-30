import { describe, expect, it } from "vitest";
import {
  buildOwnerClaimDeltas,
  ownerIdFromTileState,
  writeOwnerToTileState,
} from "../../../../src/client/render/base-map";
import {
  DEFENSE_BIT,
  FALLOUT_BIT,
} from "../../../../src/client/render/gl/utils/TileCodec";

describe("base-map tile state helpers", () => {
  it("reads and writes owner ids in the low 12 bits", () => {
    const highBits = DEFENSE_BIT | FALLOUT_BIT;
    const state = writeOwnerToTileState(highBits | 2, 17);

    expect(ownerIdFromTileState(state)).toBe(17);
    expect(state & DEFENSE_BIT).toBe(DEFENSE_BIT);
    expect(state & FALLOUT_BIT).toBe(FALLOUT_BIT);
  });

  it("builds circular claim-radius deltas and preserves non-owner bits", () => {
    const tileState = new Uint16Array(9);
    tileState[4] = DEFENSE_BIT | 1;

    const deltas = buildOwnerClaimDeltas(
      { width: 3, height: 3 },
      tileState,
      4,
      1,
      7,
    );

    expect(deltas.map((delta) => delta.ref).sort((a, b) => a - b)).toEqual([
      1, 3, 4, 5, 7,
    ]);
    expect(ownerIdFromTileState(tileState[4])).toBe(7);
    expect(tileState[4] & DEFENSE_BIT).toBe(DEFENSE_BIT);
  });

  it("does not emit deltas for tiles that already have the target owner", () => {
    const tileState = new Uint16Array(4);
    tileState.fill(3);

    const deltas = buildOwnerClaimDeltas(
      { width: 2, height: 2 },
      tileState,
      0,
      0,
      3,
    );

    expect(deltas).toEqual([]);
  });

  it("rejects invalid buffers and refs", () => {
    expect(() =>
      buildOwnerClaimDeltas(
        { width: 2, height: 2 },
        new Uint16Array(3),
        0,
        1,
        1,
      ),
    ).toThrow(/tile count/);
    expect(() =>
      buildOwnerClaimDeltas(
        { width: 2, height: 2 },
        new Uint16Array(4),
        9,
        1,
        1,
      ),
    ).toThrow(/outside/);
  });
});

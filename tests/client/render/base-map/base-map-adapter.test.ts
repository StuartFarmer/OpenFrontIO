import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  BaseMapWebGLAdapter,
  buildBaseMapPaletteData,
  type BaseMapPalette,
  type BaseMapRenderTarget,
  type BaseMapTileStateDelta,
} from "../../../../src/client/render/base-map";

class FakeBaseMapTarget implements BaseMapRenderTarget {
  readonly calls: string[] = [];
  readonly liveDeltas: BaseMapTileStateDelta[][] = [];
  readonly fullTileUploads: Uint16Array[] = [];
  readonly terrainUploads: { refs: readonly number[]; bytes: Uint8Array }[] =
    [];
  readonly paletteUploads: Float32Array[] = [];
  camera = { x: 2, y: 3, z: 4 };
  world = { x: 0, y: 0 };
  disposed = false;

  resize(widthCssPx: number, heightCssPx: number): void {
    this.calls.push(`resize:${widthCssPx}x${heightCssPx}`);
  }

  dispose(): void {
    this.disposed = true;
    this.calls.push("dispose");
  }

  fitMap(): void {
    this.calls.push("fitMap");
  }

  getCameraState(): { x: number; y: number; z: number } {
    this.calls.push("getCameraState");
    return this.camera;
  }

  setCameraState(x: number, y: number, z: number): void {
    this.camera = { x, y, z };
    this.calls.push(`setCameraState:${x},${y},${z}`);
  }

  screenToWorld(screenX: number, screenY: number): { x: number; y: number } {
    this.calls.push(`screenToWorld:${screenX},${screenY}`);
    return this.world;
  }

  uploadTileAndTrailState(tileState: Uint16Array): void {
    this.calls.push("uploadTileAndTrailState");
    this.fullTileUploads.push(tileState);
  }

  uploadLiveDelta(
    _tileState: Uint16Array,
    changedTiles: BaseMapTileStateDelta[],
  ): void {
    this.calls.push("uploadLiveDelta");
    this.liveDeltas.push(changedTiles);
  }

  applyTerrainDelta(refs: readonly number[], terrainBytes: Uint8Array): void {
    this.calls.push("applyTerrainDelta");
    this.terrainUploads.push({ refs, bytes: terrainBytes });
  }

  updatePalette(paletteData: Float32Array): void {
    this.calls.push("updatePalette");
    this.paletteUploads.push(paletteData);
  }
}

const palette: BaseMapPalette = {
  entries: [
    {
      ownerId: 1,
      fill: [0.1, 0.2, 0.3, 0.4],
      border: [0.5, 0.6, 0.7, 0.8],
    },
  ],
};

function makeAdapter(target = new FakeBaseMapTarget()): {
  adapter: BaseMapWebGLAdapter;
  target: FakeBaseMapTarget;
} {
  return {
    target,
    adapter: new BaseMapWebGLAdapter({
      width: 4,
      height: 3,
      terrainBytes: new Uint8Array(12),
      tileState: new Uint16Array(12),
      palette,
      target,
    }),
  };
}

describe("BaseMapWebGLAdapter", () => {
  it("constructs against an injected target and uploads initial tile state", () => {
    const { adapter, target } = makeAdapter();

    expect(target.fullTileUploads).toHaveLength(1);
    expect(adapter.terrainBytes.length).toBe(12);
    expect(adapter.tileState.length).toBe(12);
    expect(adapter.palette).toBe(palette);
  });

  it("uploads full tile state and changed tile-state deltas", () => {
    const { adapter, target } = makeAdapter();
    const tileState = new Uint16Array(12);
    tileState[6] = 2;

    adapter.uploadTileState(tileState);
    adapter.applyTileStateDeltas(tileState, [{ ref: 6, state: 2 }]);

    expect(target.fullTileUploads[target.fullTileUploads.length - 1]).toBe(
      tileState,
    );
    expect(target.liveDeltas[target.liveDeltas.length - 1]).toEqual([
      { ref: 6, state: 2 },
    ]);
  });

  it("updates terrain bytes through parallel delta arrays", () => {
    const { adapter, target } = makeAdapter();

    adapter.applyTerrainDeltas([
      { ref: 2, terrainByte: 8 },
      { ref: 9, terrainByte: 4 },
    ]);

    expect(adapter.terrainBytes[2]).toBe(8);
    expect(adapter.terrainBytes[9]).toBe(4);
    expect(target.terrainUploads).toEqual([
      { refs: [2, 9], bytes: new Uint8Array([8, 4]) },
    ]);
  });

  it("maps palette entries into the current WebGL palette ABI", () => {
    const data = buildBaseMapPaletteData(palette);

    expect(Array.from(data.slice(4, 8))).toEqual(
      Array.from(new Float32Array([0.1, 0.2, 0.3, 0.4])),
    );
    expect(Array.from(data.slice(4096 * 4 + 4, 4096 * 4 + 8))).toEqual(
      Array.from(new Float32Array([0.5, 0.6, 0.7, 0.8])),
    );
  });

  it("exposes camera fit/get/set without OpenFront input state", () => {
    const { adapter, target } = makeAdapter();

    adapter.resize(640, 480);
    adapter.fitMap();
    adapter.setCameraState({ x: 10, y: 11, zoom: 2 });

    expect(adapter.getCameraState()).toEqual({ x: 10, y: 11, zoom: 2 });
    expect(target.calls).toContain("resize:640x480");
    expect(target.calls).toContain("fitMap");
  });

  it("converts screen coordinates to row-major tile refs", () => {
    const target = new FakeBaseMapTarget();
    target.world = { x: 2.9, y: 1.1 };
    const { adapter } = makeAdapter(target);

    expect(adapter.screenToTile({ screenX: 20, screenY: 10 })).toEqual({
      x: 2,
      y: 1,
      ref: 6,
    });

    target.world = { x: -1, y: 1 };
    expect(adapter.screenToTile({ screenX: 0, screenY: 0 })).toBeNull();
  });

  it("supports a click-to-claim flow without a full frame rebuild", () => {
    const target = new FakeBaseMapTarget();
    target.world = { x: 1.2, y: 1.6 };
    const { adapter } = makeAdapter(target);
    const tile = adapter.screenToTile({ screenX: 44, screenY: 55 });

    expect(tile?.ref).toBe(5);
    const deltas = adapter.claimRadius(tile!.ref, 1, 9);

    expect(deltas.map((delta) => delta.ref).sort((a, b) => a - b)).toEqual([
      1, 4, 5, 6, 9,
    ]);
    expect(adapter.getOwnerAtTile(5)).toBe(9);
    expect(target.liveDeltas[target.liveDeltas.length - 1]).toEqual(deltas);
  });

  it("disposes once and rejects later use", () => {
    const { adapter, target } = makeAdapter();

    adapter.dispose();
    adapter.dispose();

    expect(target.calls.filter((call) => call === "dispose")).toHaveLength(1);
    expect(() => adapter.fitMap()).toThrow(/disposed/);
  });

  it("keeps the adapter source free of OpenFront frame imports", () => {
    const source = readFileSync(
      "src/client/render/base-map/BaseMapWebGLAdapter.ts",
      "utf8",
    );

    expect(source).not.toContain("core/game/GameView");
    expect(source).not.toContain("FrameData");
    expect(source).not.toContain("PlayerView");
  });
});

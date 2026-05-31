import { GameView } from "../gl";
import type { RendererConfig } from "../types";
import {
  assertTileRefInBounds,
  buildOwnerClaimDeltas,
  ownerIdFromTileState,
  validateMapSize,
  validateTileBufferLength,
} from "./TileState";
import type {
  BaseMapCameraState,
  BaseMapOwnerId,
  BaseMapPalette,
  BaseMapPointer,
  BaseMapRenderTarget,
  BaseMapRenderer,
  BaseMapRendererConfig,
  BaseMapTerrainDelta,
  BaseMapTilePoint,
  BaseMapTileRef,
  BaseMapTileStateDelta,
} from "./Types";

const PALETTE_SIZE = 4096;

export class BaseMapWebGLAdapter implements BaseMapRenderer {
  private readonly size: { width: number; height: number };
  private readonly target: BaseMapRenderTarget;
  private readonly trailState: Uint8Array;
  private paletteData: Float32Array;
  private disposed = false;

  private terrainBytesBuffer: Uint8Array;
  private tileStateBuffer: Uint16Array;
  private paletteValue: BaseMapPalette;

  constructor(config: BaseMapRendererConfig) {
    this.size = { width: config.width, height: config.height };
    validateMapSize(this.size);
    validateTileBufferLength(this.size, config.terrainBytes, "terrainBytes");
    validateTileBufferLength(this.size, config.tileState, "tileState");
    if (
      config.terrainColors &&
      config.terrainColors.length !== config.width * config.height * 4
    ) {
      throw new RangeError(
        `terrainColors buffer length ${config.terrainColors.length} does not match ${config.width}x${config.height} RGBA`,
      );
    }

    this.terrainBytesBuffer = config.terrainBytes;
    this.tileStateBuffer = config.tileState;
    this.paletteValue = config.palette;
    this.paletteData = buildBaseMapPaletteData(config.palette);
    this.trailState = new Uint8Array(config.tileState.length);
    this.target =
      config.target ??
      createGameViewTarget(config, this.terrainBytesBuffer, this.paletteData);

    this.target.uploadTileAndTrailState(this.tileStateBuffer, this.trailState);
  }

  get terrainBytes(): Uint8Array {
    return this.terrainBytesBuffer;
  }

  get tileState(): Uint16Array {
    return this.tileStateBuffer;
  }

  get palette(): BaseMapPalette {
    return this.paletteValue;
  }

  resize(widthCssPx: number, heightCssPx: number): void {
    this.assertActive();
    this.target.resize?.(widthCssPx, heightCssPx);
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.target.dispose();
  }

  getCameraState(): BaseMapCameraState {
    this.assertActive();
    const state = this.target.getCameraState();
    return { x: state.x, y: state.y, zoom: state.z };
  }

  setCameraState(state: BaseMapCameraState): void {
    this.assertActive();
    this.target.setCameraState(state.x, state.y, state.zoom);
  }

  fitMap(): void {
    this.assertActive();
    this.target.fitMap();
  }

  zoomAtScreen(factor: number, pointer: BaseMapPointer): void {
    this.assertActive();
    if (!Number.isFinite(factor) || factor <= 0) return;

    if (this.target.zoomAtScreen) {
      this.target.zoomAtScreen(factor, pointer.screenX, pointer.screenY);
      return;
    }

    const worldBefore = this.target.screenToWorld(
      pointer.screenX,
      pointer.screenY,
    );
    const state = this.target.getCameraState();
    this.target.setCameraState(state.x, state.y, state.z * factor);
    const worldAfter = this.target.screenToWorld(
      pointer.screenX,
      pointer.screenY,
    );
    this.target.setCameraState(
      state.x + worldBefore.x - worldAfter.x,
      state.y + worldBefore.y - worldAfter.y,
      state.z * factor,
    );
  }

  uploadTileState(tileState: Uint16Array): void {
    this.assertActive();
    validateTileBufferLength(this.size, tileState, "tileState");
    this.tileStateBuffer = tileState;
    this.target.uploadTileAndTrailState(tileState, this.trailState);
  }

  applyTileStateDeltas(
    tileState: Uint16Array,
    deltas: readonly BaseMapTileStateDelta[],
  ): void {
    this.assertActive();
    validateTileBufferLength(this.size, tileState, "tileState");
    for (const delta of deltas) {
      assertTileRefInBounds(this.size, delta.ref);
    }
    this.tileStateBuffer = tileState;
    this.target.uploadLiveDelta(
      tileState,
      deltas.map((delta) => ({ ref: delta.ref, state: delta.state })),
    );
  }

  applyTerrainDeltas(deltas: readonly BaseMapTerrainDelta[]): void {
    this.assertActive();
    if (deltas.length === 0) return;

    const refs = new Array<number>(deltas.length);
    const bytes = new Uint8Array(deltas.length);
    for (let i = 0; i < deltas.length; i++) {
      const delta = deltas[i];
      assertTileRefInBounds(this.size, delta.ref);
      refs[i] = delta.ref;
      bytes[i] = delta.terrainByte;
      this.terrainBytesBuffer[delta.ref] = delta.terrainByte;
    }

    this.target.applyTerrainDelta(refs, bytes);
  }

  updatePalette(palette: BaseMapPalette): void {
    this.assertActive();
    this.paletteValue = palette;
    this.paletteData = buildBaseMapPaletteData(palette);
    this.target.updatePalette(this.paletteData);
  }

  screenToWorld(pointer: BaseMapPointer): { x: number; y: number } {
    this.assertActive();
    return this.target.screenToWorld(pointer.screenX, pointer.screenY);
  }

  screenToTile(pointer: BaseMapPointer): BaseMapTilePoint | null {
    const world = this.screenToWorld(pointer);
    const x = Math.floor(world.x);
    const y = Math.floor(world.y);
    if (x < 0 || y < 0 || x >= this.size.width || y >= this.size.height) {
      return null;
    }
    return { x, y, ref: y * this.size.width + x };
  }

  getOwnerAtTile(ref: BaseMapTileRef): BaseMapOwnerId {
    this.assertActive();
    assertTileRefInBounds(this.size, ref);
    return ownerIdFromTileState(this.tileStateBuffer[ref]);
  }

  claimRadius(
    centerRef: BaseMapTileRef,
    radius: number,
    ownerId: BaseMapOwnerId,
  ): BaseMapTileStateDelta[] {
    this.assertActive();
    const deltas = buildOwnerClaimDeltas(
      this.size,
      this.tileStateBuffer,
      centerRef,
      radius,
      ownerId,
    );
    if (deltas.length > 0) {
      this.applyTileStateDeltas(this.tileStateBuffer, deltas);
    }
    return deltas;
  }

  private assertActive(): void {
    if (this.disposed) {
      throw new Error("base map renderer has been disposed");
    }
  }
}

export function buildBaseMapPaletteData(palette: BaseMapPalette): Float32Array {
  const data = new Float32Array(PALETTE_SIZE * 2 * 4);
  for (const entry of palette.entries) {
    if (!Number.isInteger(entry.ownerId) || entry.ownerId < 0) {
      throw new RangeError("palette ownerId must be a non-negative integer");
    }
    if (entry.ownerId >= PALETTE_SIZE) {
      throw new RangeError(`palette ownerId ${entry.ownerId} exceeds 4095`);
    }
    const fillOff = entry.ownerId * 4;
    writeColor(data, fillOff, entry.fill);

    const border = entry.border ?? entry.fill;
    const borderOff = PALETTE_SIZE * 4 + entry.ownerId * 4;
    writeColor(data, borderOff, border);
  }
  return data;
}

function writeColor(
  data: Float32Array,
  offset: number,
  color: readonly [number, number, number, number],
): void {
  for (let i = 0; i < 4; i++) {
    const channel = color[i];
    if (!Number.isFinite(channel) || channel < 0 || channel > 1) {
      throw new RangeError("palette channels must be finite values in 0..1");
    }
    data[offset + i] = channel;
  }
}

function createGameViewTarget(
  config: BaseMapRendererConfig,
  terrainBytes: Uint8Array,
  paletteData: Float32Array,
): BaseMapRenderTarget {
  if (!config.canvas) {
    throw new Error(
      "canvas is required when no base map render target is provided",
    );
  }
  const header: RendererConfig = {
    mapWidth: config.width,
    mapHeight: config.height,
    unitTypes: [],
    players: [],
    maxPlayers: PALETTE_SIZE,
  };
  return new GameView(
    config.canvas,
    header,
    terrainBytes,
    paletteData,
    config.raf,
    config.caf,
    config.terrainColors,
  );
}

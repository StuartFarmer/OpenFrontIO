export type BaseMapTileRef = number;
export type BaseMapOwnerId = number;

export interface BaseMapSize {
  readonly width: number;
  readonly height: number;
}

export interface BaseMapPalette {
  readonly entries: readonly BaseMapPaletteEntry[];
}

export interface BaseMapPaletteEntry {
  readonly ownerId: BaseMapOwnerId;
  readonly fill: readonly [r: number, g: number, b: number, a: number];
  readonly border?: readonly [r: number, g: number, b: number, a: number];
}

export interface BaseMapTileStateDelta {
  readonly ref: BaseMapTileRef;
  readonly state: number;
}

export interface BaseMapTerrainDelta {
  readonly ref: BaseMapTileRef;
  readonly terrainByte: number;
}

export interface BaseMapCameraState {
  readonly x: number;
  readonly y: number;
  readonly zoom: number;
}

export interface BaseMapDirectionalBorderIntent {
  readonly ownerId: BaseMapOwnerId;
  readonly originX: number;
  readonly originY: number;
  readonly directionX: number;
  readonly directionY: number;
  readonly distance: number;
  readonly sharpness: number;
  readonly heatMap: Uint8Array;
}

export interface BaseMapPointer {
  readonly screenX: number;
  readonly screenY: number;
}

export interface BaseMapTilePoint {
  readonly x: number;
  readonly y: number;
  readonly ref: BaseMapTileRef;
}

export interface BaseMapRenderTarget {
  resize?(widthCssPx: number, heightCssPx: number): void;
  dispose(): void;

  fitMap(): void;
  getCameraState(): { x: number; y: number; z: number };
  setCameraState(x: number, y: number, z: number): void;
  panBy?(dx: number, dy: number): void;
  zoomAtScreen?(factor: number, screenX: number, screenY: number): void;
  screenToWorld(screenX: number, screenY: number): { x: number; y: number };

  uploadTileAndTrailState(tileState: Uint16Array, trailState: Uint8Array): void;
  uploadLiveDelta(
    tileState: Uint16Array,
    changedTiles: BaseMapTileStateDelta[],
  ): void;
  applyTerrainDelta(refs: readonly number[], terrainBytes: Uint8Array): void;
  updatePalette(paletteData: Float32Array): void;
  setDirectionalBorderIntent?(
    intent: BaseMapDirectionalBorderIntent | null,
  ): void;
}

export interface BaseMapRendererConfig extends BaseMapSize {
  readonly terrainBytes: Uint8Array;
  readonly terrainColors?: Uint8Array;
  readonly tileState: Uint16Array;
  readonly palette: BaseMapPalette;
  readonly canvas?: HTMLCanvasElement;
  readonly target?: BaseMapRenderTarget;
  readonly raf?: typeof requestAnimationFrame;
  readonly caf?: typeof cancelAnimationFrame;
}

export interface BaseMapRenderer {
  readonly terrainBytes: Uint8Array;
  readonly tileState: Uint16Array;
  readonly palette: BaseMapPalette;

  resize(widthCssPx: number, heightCssPx: number): void;
  dispose(): void;

  getCameraState(): BaseMapCameraState;
  setCameraState(state: BaseMapCameraState): void;
  panBy(dx: number, dy: number): void;
  fitMap(): void;

  uploadTileState(tileState: Uint16Array): void;
  applyTileStateDeltas(
    tileState: Uint16Array,
    deltas: readonly BaseMapTileStateDelta[],
  ): void;
  applyTerrainDeltas(deltas: readonly BaseMapTerrainDelta[]): void;
  updatePalette(palette: BaseMapPalette): void;
  setDirectionalBorderIntent(
    intent: BaseMapDirectionalBorderIntent | null,
  ): void;

  screenToWorld(pointer: BaseMapPointer): { x: number; y: number };
  screenToTile(pointer: BaseMapPointer): BaseMapTilePoint | null;
  getOwnerAtTile(ref: BaseMapTileRef): BaseMapOwnerId;
}

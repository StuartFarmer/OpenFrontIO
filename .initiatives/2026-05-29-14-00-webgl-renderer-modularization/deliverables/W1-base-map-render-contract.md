# W1 Base Map Render Contract Proposal

## Purpose

Define the smallest renderer-facing contract needed by Foundation without
exposing OpenFront frame, gameplay, HUD, unit, structure, railroad, nuke,
alliance, or radial-menu concepts.

This is a planning contract only. No source contract file is added in W1
because the current batch is inventory/contract work and the user write scope
prefers initiative documentation.

## Proposed Type Shape

```ts
export type BaseMapTileRef = number;
export type BaseMapOwnerId = number;

export interface BaseMapSize {
  readonly width: number;
  readonly height: number;
}

export interface BaseMapRendererConfig extends BaseMapSize {
  readonly terrainBytes: Uint8Array;
  readonly tileState: Uint16Array;
  readonly palette: BaseMapPalette;
  readonly raf?: typeof requestAnimationFrame;
  readonly caf?: typeof cancelAnimationFrame;
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

export interface BaseMapPointer {
  readonly screenX: number;
  readonly screenY: number;
}

export interface BaseMapTilePoint {
  readonly x: number;
  readonly y: number;
  readonly ref: BaseMapTileRef;
}

export interface BaseMapRenderer {
  resize(widthCssPx: number, heightCssPx: number): void;
  dispose(): void;

  getCameraState(): BaseMapCameraState;
  setCameraState(state: BaseMapCameraState): void;
  fitMap(): void;

  uploadTileState(tileState: Uint16Array): void;
  applyTileStateDeltas(
    tileState: Uint16Array,
    deltas: readonly BaseMapTileStateDelta[],
  ): void;
  applyTerrainDeltas(deltas: readonly BaseMapTerrainDelta[]): void;
  updatePalette(palette: BaseMapPalette): void;

  screenToWorld(pointer: BaseMapPointer): { x: number; y: number };
  screenToTile(pointer: BaseMapPointer): BaseMapTilePoint | null;
  getOwnerAtTile(ref: BaseMapTileRef): BaseMapOwnerId;
}
```

## Contract Rules

- `terrainBytes.length` must equal `width * height`.
- `tileState.length` must equal `width * height`.
- The tile ref layout is row-major: `ref = y * width + x`.
- Owner ID is the low 12 bits of each tile state, matching the current WebGL
  ABI in `src/client/render/gl/utils/TileCodec.ts:1-17`.
- `ownerId = 0` means unowned for renderer queries and palette defaults.
- `screenToTile()` floors world coordinates and returns `null` outside bounds,
  matching the current `getOwnerAtWorld()` bounds behavior in
  `src/client/render/gl/Renderer.ts:826-831`.
- The contract must not expose terrain semantic helpers such as `isLand()`,
  `isGrass()`, passability, fertility, or shoreline classification.
- The contract must not expose OpenFront `GameView`, `FrameData`, `PlayerView`,
  `UnitState`, diplomacy, railroads, structures, nukes, names, or radial menu
  fields.

## Existing WebGL Adapter Mapping

| Contract method/input    | Existing candidate                                                                                                                                                         | Notes                                                                                                                                           |
| ------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| constructor config       | `new GameView(canvas, header, terrainBytes, paletteData, raf, caf)` at `src/client/render/gl/GameView.ts:42-57`                                                            | Existing `RendererConfig` still includes OpenFront unit/player capacity fields. Adapter can provide inert values until a smaller facade exists. |
| `uploadTileState()`      | `GameView.uploadTileAndTrailState()` / `applyFullTiles()` at `src/client/render/gl/GameView.ts:194-215`                                                                    | Existing path also requires `trailState`. Adapter can own a zeroed trail buffer or later use a base-only upload method.                         |
| `applyTileStateDeltas()` | `GameView.uploadLiveDelta()` at `src/client/render/gl/GameView.ts:200-202`                                                                                                 | Delta shape matches `{ ref, state }` from `TilePair`.                                                                                           |
| `applyTerrainDeltas()`   | `GameView.applyTerrainDelta()` at `src/client/render/gl/GameView.ts:269-272`                                                                                               | Existing method takes parallel arrays. Adapter can pack docs contract into arrays.                                                              |
| `updatePalette()`        | `GameView.updatePalette()` / `addPlayers()` at `src/client/render/gl/GameView.ts:217-227`                                                                                  | Foundation only needs owner 1 at first. Pattern data should remain adapter-owned/inert.                                                         |
| camera methods           | `GameView.getCameraState()`, `setCameraState()`, `fitMap()` at `src/client/render/gl/GameView.ts:149-172`                                                                  | Direct match.                                                                                                                                   |
| `screenToWorld()`        | `GameView.screenToWorld()` at `src/client/render/gl/GameView.ts:135-137`                                                                                                   | Direct match.                                                                                                                                   |
| `screenToTile()`         | `Camera.screenToWorld()` plus bounds/flooring from `Renderer.getOwnerAtWorld()` at `src/client/render/gl/Camera.ts:164-184` and `src/client/render/gl/Renderer.ts:826-831` | Adapter-level helper.                                                                                                                           |
| `getOwnerAtTile()`       | `TerritoryPass.getOwnerAt()` at `src/client/render/gl/passes/TerritoryPass.ts:217-222`                                                                                     | Current facade exposes world query, not direct tile query. Adapter can compute via buffer or request future direct method.                      |

## Foundation First-Loop Example

Foundation can render a blank grass map by constructing:

- `width = 256`, `height = 256`.
- `terrainBytes = new Uint8Array(width * height).fill(GRASS_BYTE)` where
  `GRASS_BYTE` is Foundation-owned.
- `tileState = new Uint16Array(width * height)`.
- `palette.entries = [{ ownerId: 1, fill: [r, g, b, a], border: [...] }]`.

For click-to-place:

1. Call `screenToTile({ screenX, screenY })`.
2. If non-null and placement is valid, mutate Foundation-owned `tileState` for
   the claim radius using low 12 owner bits.
3. Call `applyTileStateDeltas(tileState, changedRefsAndStates)`.

## Open Questions For W2/W3

- Whether the first adapter should instantiate full `GameView` with no-op
  trail/pattern data, or whether to add a small type-only/source facade in
  `src/client/render/**` before implementation.
- Whether terrain byte to color encoding should remain the current
  OpenFront-compatible `ColorUtils.encodeTerrainTile()` or accept a renderer
  profile/encoder for Foundation while preserving shared base visual parity.
- Whether direct `getOwnerAtTile(ref)` should be exposed by the facade or kept
  adapter-local from the module-owned `tileState`.

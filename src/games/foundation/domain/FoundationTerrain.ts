import { EngineTileMap, TileRef } from "./EngineTileMap";

export const FOUNDATION_GRASS_TERRAIN_BYTE = 1 << 7;

export class FoundationTerrain {
  constructor(private readonly map: EngineTileMap) {}

  terrainByte(ref: TileRef): number {
    if (!this.map.isValidRef(ref)) {
      throw new Error(`Invalid tile ref: ${ref}`);
    }
    return this.map.terrainBuffer()[ref];
  }

  isGrass(ref: TileRef): boolean {
    return this.terrainByte(ref) === FOUNDATION_GRASS_TERRAIN_BYTE;
  }
}

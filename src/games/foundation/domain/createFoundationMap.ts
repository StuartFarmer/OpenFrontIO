import { FoundationEngineTileMap } from "./EngineTileMap";
import { FOUNDATION_GRASS_TERRAIN_BYTE } from "./FoundationTerrain";

export const FOUNDATION_MAP_WIDTH = 256;
export const FOUNDATION_MAP_HEIGHT = 256;

export interface FoundationMapConfig {
  width?: number;
  height?: number;
}

export function createFoundationMap(
  config: FoundationMapConfig = {},
): FoundationEngineTileMap {
  const width = config.width ?? FOUNDATION_MAP_WIDTH;
  const height = config.height ?? FOUNDATION_MAP_HEIGHT;
  const terrain = new Uint8Array(width * height);
  terrain.fill(FOUNDATION_GRASS_TERRAIN_BYTE);

  return new FoundationEngineTileMap(width, height, terrain);
}

# Maps And Terrain

Canonical baseline: `main@782702c1d6c8614f2c44590584b0b34c1016020d`.

OpenFront maps are data-driven. The map enum gives names, but actual dimensions, land-tile counts, nations, and terrain bytes come from `resources/maps/**`.

## Map Manifest Shape

`MapManifest` is defined in `TerrainMapLoader.ts:21`.

| Manifest field | Source | Meaning |
| --- | --- | --- |
| `name` | `TerrainMapLoader.ts:22` | Display/name key for the map. |
| `map` | `TerrainMapLoader.ts:23` | Normal-size metadata: width, height, land tiles. |
| `map4x` | `TerrainMapLoader.ts:24` | Compact terrain metadata used for playable compact maps. |
| `map16x` | `TerrainMapLoader.ts:25` | Mini-map/downsampled metadata. |
| `nations` | `TerrainMapLoader.ts:26` | Manifest-defined nation spawns. |
| `additionalNations` | `TerrainMapLoader.ts:30` | Optional fallback pool for over-requested nation count. |
| `teamGameSpawnAreas` | `TerrainMapLoader.ts:31` | Optional named spawn rectangles for team games. |

Nation entries contain `[x, y]` coordinates, optional `flag`, and `name` (`TerrainMapLoader.ts:34`). Additional nations can omit coordinates (`TerrainMapLoader.ts:40`).

## Loading Normal Versus Compact Maps

`loadTerrainMap()` starts at `TerrainMapLoader.ts:46`. It uses a cache key of map plus map size (`TerrainMapLoader.ts:51`) and fetches map data through `terrainMapFileLoader.getMapData(map)` (`TerrainMapLoader.ts:54`).

For the playable map:

- Normal size loads `manifest.map` plus `map.bin`.
- Compact size loads `manifest.map4x` plus `map4x.bin`.

This branch is at `TerrainMapLoader.ts:57`.

For the mini map:

- Normal size uses `manifest.map4x` plus `map4x.bin`.
- Compact size uses `manifest.map16x` plus `map16x.bin`.

This branch is at `TerrainMapLoader.ts:62`.

When compact size is selected, manifest nation coordinates are divided by two with floor rounding (`TerrainMapLoader.ts:70`). Additional nation coordinates receive the same treatment (`TerrainMapLoader.ts:77`). Team spawn areas are also scaled, with width and height clamped to at least 1 (`TerrainMapLoader.ts:87`).

## Tile Refs

`TileRef` is just a number (`GameMap.ts:3`). `GameMap` exposes conversion methods:

- `ref(x, y)` maps coordinates to a tile ref.
- `x(ref)` and `y(ref)` map a tile ref back to coordinates.
- `cell(ref)` wraps the coordinates in a `Cell`.

These methods are declared at `GameMap.ts:5`.

The implementation precomputes lookup tables for ref-to-x, ref-to-y, and y-to-ref (`GameMap.ts:100`) when the `GameMapImpl` is constructed.

## Terrain Bytes

Terrain is stored in an immutable `Uint8Array` (`GameMap.ts:95`). `GameMapImpl` encodes terrain bits as:

| Bit or mask | Source | Meaning |
| --- | --- | --- |
| bit 7 | `GameMap.ts:106` | land flag. |
| bit 6 | `GameMap.ts:107` | shoreline flag. |
| bit 5 | `GameMap.ts:108` | ocean flag. |
| `0x1f` | `GameMap.ts:109` | magnitude bits. |

The terrain API exposes land, ocean shore, ocean, shoreline, magnitude, raw terrain byte, water/lake/shore predicates, tile cost, and terrain type through methods declared at `GameMap.ts:16` through `GameMap.ts:43`.

## Mutable Tile State

Mutable state is stored in a `Uint16Array` (`GameMap.ts:96`). The public `tileStateBuffer()` documentation gives the layout:

| Bit or mask | Source | Meaning |
| --- | --- | --- |
| bits 0-11 | `GameMap.ts:82` | owner id. |
| bit 13 | `GameMap.ts:84` | fallout. |
| bit 14 | `GameMap.ts:85` | defense bonus. |
| bit 15 | `GameMap.ts:115` | reserved. |

The implementation constants are `PLAYER_ID_MASK = 0xfff`, `FALLOUT_BIT = 13`, and `DEFENSE_BONUS_BIT = 14` at `GameMap.ts:111`.

## Terrain Types

`TerrainType` has plains, highland, mountain, lake, and ocean (`Game.ts:507`). Land combat formulas only support plains, highland, and mountain. Lake and ocean are water terrain and are handled by water movement, boats, ports, and nuke water conversion rather than land capture formulas.

## Appendix Target

There are 80 canonical map manifests. A later extraction pass should generate a table with:

- manifest path
- map display name
- normal dimensions and land tiles
- 4x dimensions and land tiles
- 16x dimensions and land tiles
- number of manifest nations
- whether team spawn areas are present

import { describe, expect, it } from "vitest";
import {
  FOUNDATION_OWNER_ID_MASK,
  FOUNDATION_PLACEMENT_RADIUS,
  createFoundationMap,
  createPlayer,
  ownerIdFromState,
  placePlayer,
} from "../../../src/games/foundation";
import {
  EngineTileMap,
  TileRef,
} from "../../../src/games/foundation/domain/EngineTileMap";

describe("Foundation placement", () => {
  it("claims the fixed placement radius around the clicked tile", () => {
    const map = createFoundationMap({ width: 32, height: 32 });
    const player = createPlayer("player-1", { ownerId: 1 });
    const clickedTile = map.ref(16, 16);

    const result = placePlayer(map, player, clickedTile);

    expect(result.claimedTiles).toHaveLength(
      expectedTileCount(map, clickedTile, FOUNDATION_PLACEMENT_RADIUS),
    );
    for (const tile of result.claimedTiles) {
      const dx = map.x(tile) - (16 - 0.5);
      const dy = map.y(tile) - (16 - 0.5);
      expect(dx * dx + dy * dy).toBeLessThanOrEqual(
        FOUNDATION_PLACEMENT_RADIUS * FOUNDATION_PLACEMENT_RADIUS,
      );
      expect(ownerIdFromState(map.stateBuffer()[tile])).toBe(1);
    }
  });

  it("clips placement radius at map edges", () => {
    const map = createFoundationMap({ width: 32, height: 32 });
    const player = createPlayer("player-1", { ownerId: 1 });
    const clickedTile = map.ref(0, 0);

    const result = placePlayer(map, player, clickedTile);

    expect(result.claimedTiles).toHaveLength(
      expectedTileCount(map, clickedTile, FOUNDATION_PLACEMENT_RADIUS),
    );
    expect(result.claimedTiles.length).toBeLessThan(
      expectedTileCount(map, map.ref(16, 16), FOUNDATION_PLACEMENT_RADIUS),
    );
    expect(result.claimedTiles.every((tile) => map.isValidRef(tile))).toBe(
      true,
    );
    expect(ownerIdFromState(map.stateBuffer()[map.ref(0, 0)])).toBe(1);
    expect(ownerIdFromState(map.stateBuffer()[map.ref(31, 31)])).toBe(0);
  });

  it("updates the Player record and preserves non-owner state bits", () => {
    const map = createFoundationMap({ width: 32, height: 32 });
    const player = createPlayer("player-1", { ownerId: 7, name: "Ada" });
    const clickedTile = map.ref(12, 14);
    map.stateBuffer()[clickedTile] = 1 << 13;

    const result = placePlayer(map, player, clickedTile);

    expect(result.player).not.toBe(player);
    expect(result.player.id).toBe("player-1");
    expect(result.player.name).toBe("Ada");
    expect(result.player.ownerId).toBe(7);
    expect(result.player.placement?.selectedTile).toBe(clickedTile);
    expect(result.player.placement?.claimedTileCount).toBe(
      result.claimedTiles.length,
    );
    expect(result.player.placement?.claimedTiles).toEqual(result.claimedTiles);
    expect(map.stateBuffer()[clickedTile] & ~FOUNDATION_OWNER_ID_MASK).toBe(
      1 << 13,
    );
    expect(ownerIdFromState(map.stateBuffer()[clickedTile])).toBe(7);
  });

  it("replaces the same Player placement on repeated placement", () => {
    const map = createFoundationMap({ width: 32, height: 32 });
    const player = createPlayer("player-1", { ownerId: 1 });
    const first = placePlayer(map, player, map.ref(4, 4));
    const second = placePlayer(map, first.player, map.ref(24, 24));

    expect(second.player.placement?.selectedTile).toBe(map.ref(24, 24));
    expect(ownerIdFromState(map.stateBuffer()[map.ref(4, 4)])).toBe(0);
    expect(ownerIdFromState(map.stateBuffer()[map.ref(24, 24)])).toBe(1);
  });
});

function expectedTileCount(
  map: EngineTileMap,
  centerTile: TileRef,
  radius: number,
): number {
  let count = 0;
  const centerX = map.x(centerTile);
  const centerY = map.y(centerTile);

  for (let y = 0; y < map.height(); y++) {
    for (let x = 0; x < map.width(); x++) {
      const dx = x - (centerX - 0.5);
      const dy = y - (centerY - 0.5);
      if (dx * dx + dy * dy <= radius * radius) {
        count++;
      }
    }
  }

  return count;
}

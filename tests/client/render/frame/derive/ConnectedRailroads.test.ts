import { describe, expect, it } from "vitest";
import {
  computeConnectedRailroadTiles,
  computeRailroadRouteOverlay,
} from "../../../../../src/client/render/frame/derive/ConnectedRailroads";

describe("computeConnectedRailroadTiles", () => {
  it("returns the railroad component connected to the local player's station", () => {
    const railroads = new Map<number, number[]>([
      [1, [11, 12, 13]],
      [2, [13, 14, 15]],
      [3, [81, 82, 83]],
    ]);

    const tiles = computeConnectedRailroadTiles({
      railroads,
      units: [station(1, 11), station(2, 15), station(3, 81)],
      localPlayerID: 1,
      mapWidth: 10,
      mapHeight: 10,
      stationSnapRadius: 0,
    });

    expect(new Set(tiles)).toEqual(new Set([11, 12, 13, 14, 15]));
  });

  it("classifies routeable rails as connected and isolated rails as disconnected", () => {
    const railroads = new Map<number, number[]>([
      [1, [11, 12, 13]],
      [2, [13, 14, 15]],
      [3, [81, 82, 83]],
    ]);

    const overlay = computeRailroadRouteOverlay({
      railroads,
      units: [station(1, 11), station(2, 15), station(3, 81)],
      localPlayerID: 1,
      mapWidth: 10,
      mapHeight: 10,
      stationSnapRadius: 0,
    });

    expect(new Set(overlay.connected)).toEqual(new Set([11, 12, 13, 14, 15]));
    expect(new Set(overlay.disconnected)).toEqual(new Set([81, 82, 83]));
  });

  it("connects rail segments that meet inside a station snap radius", () => {
    const railroads = new Map<number, number[]>([
      [1, [10, 11]],
      [2, [14, 15]],
    ]);

    const tiles = computeConnectedRailroadTiles({
      railroads,
      units: [station(1, 12), station(2, 13)],
      localPlayerID: 1,
      mapWidth: 20,
      mapHeight: 5,
      stationSnapRadius: 2,
    });

    expect(new Set(tiles)).toEqual(new Set([10, 11, 14, 15]));
  });

  it("marks all railroads disconnected when there is no local route seed", () => {
    const railroads = new Map<number, number[]>([[1, [1, 2, 3]]]);

    const overlay = computeRailroadRouteOverlay({
      railroads,
      units: [station(2, 1), { ...station(1, 3), isActive: false }],
      localPlayerID: 1,
      mapWidth: 10,
      mapHeight: 2,
    });

    expect(overlay.connected).toEqual([]);
    expect(new Set(overlay.disconnected)).toEqual(new Set([1, 2, 3]));
  });
});

function station(ownerID: number, pos: number) {
  return {
    pos,
    ownerID,
    isActive: true,
    hasTrainStation: true,
  };
}

import { describe, expect, it } from "vitest";
import {
  createFoundationMap,
  DEFAULT_FOUNDATION_WILDERNESS_PARAMETERS,
  distanceFrontWeight,
  focusedFrontLaneWidth,
  foundationWaterTerrainByteForElevation,
  ownerIdFromState,
  setOwnerId,
  startWildernessExploration,
  tickWildernessExploration,
  toblerSpeedMultiplier,
  wildernessSpeedForTile,
  wildernessTerrainPriorityWeight,
} from "../../../src/games/foundation";

describe("Foundation wilderness elevation speed", () => {
  it("keeps the original wilderness speed on flat elevation", () => {
    const map = createFoundationMap({ width: 3, height: 1 });
    const sourceTile = map.ref(0, 0);
    const targetTile = map.ref(1, 0);
    setOwnerId(map.stateBuffer(), sourceTile, 1);

    expect(toblerSpeedMultiplier(0)).toBeCloseTo(1, 5);
    expect(wildernessSpeedForTile(map, 1, targetTile)).toBeCloseTo(16.5, 5);
  });

  it("slows wilderness expansion uphill", () => {
    const map = createFoundationMap({
      width: 3,
      height: 1,
      elevation: (x) => (x === 0 ? 0 : 1),
    });
    const sourceTile = map.ref(0, 0);
    const targetTile = map.ref(1, 0);
    setOwnerId(map.stateBuffer(), sourceTile, 1);

    expect(wildernessSpeedForTile(map, 1, targetTile)).toBeGreaterThan(16.5);
  });

  it("speeds wilderness expansion on a slight downhill", () => {
    const map = createFoundationMap({
      width: 3,
      height: 1,
      elevation: (x) => (x === 0 ? 0.5 : 1 / 3),
    });
    const sourceTile = map.ref(0, 0);
    const targetTile = map.ref(1, 0);
    setOwnerId(map.stateBuffer(), sourceTile, 1);

    expect(wildernessSpeedForTile(map, 1, targetTile)).toBeLessThan(16.5);
  });

  it("uses an OpenFront-style continuous terrain priority weight", () => {
    expect(wildernessTerrainPriorityWeight(0)).toBe(1);
    expect(wildernessTerrainPriorityWeight(0.5)).toBe(1.5);
    expect(wildernessTerrainPriorityWeight(1)).toBe(2);
  });

  it("uses Gaussian Euclidean distance for border front weighting", () => {
    expect(distanceFrontWeight(0, 1)).toBe(1);
    expect(distanceFrontWeight(1, 1)).toBeCloseTo(Math.exp(-0.5), 5);
    expect(distanceFrontWeight(2, 1)).toBeCloseTo(Math.exp(-2), 5);
    expect(distanceFrontWeight(4, 1)).toBeCloseTo(Math.exp(-8), 5);
    expect(distanceFrontWeight(4, 10)).toBeLessThan(distanceFrontWeight(4, 1));
    expect(distanceFrontWeight(10, 1000, 10)).toBe(1);
    expect(distanceFrontWeight(Number.NaN)).toBe(0);
  });

  it("widens the focused front floor for large borders", () => {
    expect(focusedFrontLaneWidth(25, 1)).toBeCloseTo(1, 5);
    expect(focusedFrontLaneWidth(2_500, 1)).toBeCloseTo(6, 5);
    expect(focusedFrontLaneWidth(2_500, 1)).toBeGreaterThan(
      focusedFrontLaneWidth(25, 1),
    );
  });

  it("uses OpenFront terrain magnitude for wilderness attrition when toggled", () => {
    const remainingAfterFirstTile = (elevation: number): number => {
      const map = createFoundationMap({
        width: 3,
        height: 1,
        elevation: (x) => (x === 1 ? elevation : 0),
      });
      setOwnerId(map.stateBuffer(), map.ref(0, 0), 1);
      const player = {
        id: "player-1",
        ownerId: 1,
        name: "Player",
        troops: 10_000,
        foodStock: 0,
        buildings: [],
        placement: {
          selectedTile: map.ref(0, 0),
          claimedTiles: [map.ref(0, 0)],
          claimedTileCount: 1,
        },
        activeExploration: null,
      };
      const started = startWildernessExploration(
        map,
        player,
        map.ref(1, 0),
        1,
        {
          troopRatio: 0.5,
          parameters: {
            wildernessMechanics: "openfront",
            wildernessBaseSpeed: 16.5,
            elevationSlopeScale: 0.3,
            minToblerSpeedMultiplier: 0.1,
            maxToblerSpeedMultiplier: 1.25,
            terrainPriorityElevationScale: 1,
            wildernessDistanceFocus: 1,
            wildernessFrontCapacity: 3_000,
            wildernessAttackerLossPerTile: 80,
            wildernessTilesPerTickMultiplier: 0.5,
          },
        },
      );

      return (
        tickWildernessExploration(map, started.player, 2, {
          wildernessMechanics: "openfront",
          wildernessBaseSpeed: 16.5,
          elevationSlopeScale: 0.3,
          minToblerSpeedMultiplier: 0.1,
          maxToblerSpeedMultiplier: 1.25,
          terrainPriorityElevationScale: 1,
          wildernessDistanceFocus: 1,
          wildernessFrontCapacity: 3_000,
          wildernessAttackerLossPerTile: 80,
          wildernessTilesPerTickMultiplier: 0.5,
        }).player.activeExploration?.troops ?? 0
      );
    };

    expect(remainingAfterFirstTile(1)).toBeLessThan(remainingAfterFirstTile(0));
  });

  it("reassigns blocked focused pressure instead of scraping along water", () => {
    const map = createFoundationMap({ width: 5, height: 5 });
    const shoreFrontTile = map.ref(1, 1);
    const shoreWaterTile = map.ref(2, 1);
    const shoreNorthTile = map.ref(1, 0);
    const shoreSouthTile = map.ref(1, 2);
    const remoteFrontTile = map.ref(1, 4);
    map.terrainBuffer()[shoreWaterTile] =
      foundationWaterTerrainByteForElevation(0);
    setOwnerId(map.stateBuffer(), map.ref(0, 1), 1);
    setOwnerId(map.stateBuffer(), map.ref(0, 4), 1);

    const parameters = {
      ...DEFAULT_FOUNDATION_WILDERNESS_PARAMETERS,
      wildernessMechanics: "foundation" as const,
      wildernessBaseSpeed: 100,
      wildernessFrontCapacity: 1,
      wildernessDistanceFocus: 100,
      wildernessAttackerLossPerTile: 1,
    };
    const started = startWildernessExploration(
      map,
      {
        id: "player-1",
        ownerId: 1,
        name: "Player",
        troops: 10_000,
        foodStock: 0,
        buildings: [],
        placement: {
          selectedTile: map.ref(0, 1),
          claimedTiles: [map.ref(0, 1), map.ref(0, 4)],
          claimedTileCount: 2,
        },
        activeExploration: null,
      },
      map.ref(4, 1),
      1,
      {
        troopRatio: 0.5,
        frontMode: "focused",
        frontFocus: 1,
        parameters,
      },
    );
    if (!started.player.activeExploration) {
      throw new Error("expected active exploration");
    }

    const result = tickWildernessExploration(
      map,
      {
        ...started.player,
        activeExploration: {
          ...started.player.activeExploration,
          frontier: [
            {
              tile: shoreFrontTile,
              priority: 0,
              troopShare: 1,
              progress: 1,
            },
          ],
          borderTiles: [shoreFrontTile],
        },
      },
      2,
      parameters,
    );

    const frontierTiles =
      result.player.activeExploration?.frontier.map((entry) => entry.tile) ??
      [];
    expect(ownerIdFromState(map.stateBuffer()[shoreFrontTile])).toBe(1);
    expect(ownerIdFromState(map.stateBuffer()[shoreWaterTile])).toBe(0);
    expect(frontierTiles).not.toContain(shoreNorthTile);
    expect(frontierTiles).not.toContain(shoreSouthTile);
    expect(frontierTiles).toContain(remoteFrontTile);
  });

  it("expands easier terrain before high elevation terrain", () => {
    const map = createFoundationMap({
      width: 5,
      height: 5,
      elevation: (x, y) => {
        if (x === 1 && y === 2) return 1;
        return 0;
      },
    });
    const runtimeMap = map;
    const center = runtimeMap.ref(2, 2);
    setOwnerId(runtimeMap.stateBuffer(), center, 1);

    const highTile = runtimeMap.ref(1, 2);
    const flatTile = runtimeMap.ref(3, 2);

    expect(
      wildernessTerrainPriorityWeight(runtimeMap.elevation(highTile)),
    ).toBeGreaterThan(
      wildernessTerrainPriorityWeight(runtimeMap.elevation(flatTile)),
    );
  });
});

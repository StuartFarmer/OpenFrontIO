import { describe, expect, it } from "vitest";
import {
  ExplorationAttack,
  FOUNDATION_MODULE_ID,
  createBuildStructureCommand,
  createFoundationMap,
  createFoundationRuntime,
  createGrowTerritoryCommand,
  createPlacePlayerCommand,
  createPlayer,
  foodProductionForTileCount,
  foundationWaterTerrainByteForElevation,
  maxTroopsForTileCount,
  ownerIdFromState,
} from "../../../src/games/foundation";
import { foundationEconomyFixture } from "./dynamics/fixtures/FoundationEconomyFixtures";

describe("Foundation runtime", () => {
  it("builds a Foundation-owned place command envelope", () => {
    const command = createPlacePlayerCommand({
      clientId: "client-a",
      playerId: "player-1",
      turnNumber: 3,
      commandId: "cmd-1",
      tileRef: 12,
    });

    expect(command).toEqual({
      moduleId: FOUNDATION_MODULE_ID,
      clientId: "client-a",
      actor: { type: "player", id: "player-1" },
      turnNumber: 3,
      commandId: "cmd-1",
      payload: {
        type: "foundation.place_player",
        tileRef: 12,
      },
    });
    expect(command.payload.type).not.toBe("spawn");
  });

  it("builds a Foundation-owned grow command envelope", () => {
    const command = createGrowTerritoryCommand({
      clientId: "client-a",
      playerId: "player-1",
      turnNumber: 4,
      commandId: "cmd-2",
      targetTileRef: 64,
    });

    expect(command).toEqual({
      moduleId: FOUNDATION_MODULE_ID,
      clientId: "client-a",
      actor: { type: "player", id: "player-1" },
      turnNumber: 4,
      commandId: "cmd-2",
      payload: {
        type: "foundation.grow_territory",
        targetTileRef: 64,
      },
    });
  });

  it("builds a Foundation-owned structure command envelope", () => {
    const command = createBuildStructureCommand({
      clientId: "client-a",
      playerId: "player-1",
      turnNumber: 5,
      commandId: "cmd-3",
      buildingType: "grain-silo",
      tileRef: 77,
    });

    expect(command).toEqual({
      moduleId: FOUNDATION_MODULE_ID,
      clientId: "client-a",
      actor: { type: "player", id: "player-1" },
      turnNumber: 5,
      commandId: "cmd-3",
      payload: {
        type: "foundation.build_structure",
        buildingType: "grain-silo",
        tileRef: 77,
      },
    });
  });

  it("can carry an explicit grow troop ratio", () => {
    const command = createGrowTerritoryCommand({
      targetTileRef: 64,
      troopRatio: 0.05,
    });

    expect(command.payload).toEqual({
      type: "foundation.grow_territory",
      targetTileRef: 64,
      troopRatio: 0.05,
    });
  });

  it("can carry explicit grow front controls", () => {
    const command = createGrowTerritoryCommand({
      targetTileRef: 64,
      frontMode: "focused",
      frontFocus: 0.75,
    });

    expect(command.payload).toEqual({
      type: "foundation.grow_territory",
      targetTileRef: 64,
      frontMode: "focused",
      frontFocus: 0.75,
    });
  });

  it("aggregates duplicate frontier troop shares for one border tile", () => {
    const attack = new ExplorationAttack();

    attack.addBorderTile(42);
    attack.enqueue(42, 2, 0.25, 3);
    attack.addBorderTile(42);
    attack.enqueue(42, 1, 0.75, 7);

    expect(attack.borderSize()).toBe(1);
    expect(attack.frontierSize()).toBe(2);
    expect(attack.dequeue()).toEqual([42, 1, 1, 10]);
    attack.removeBorderTile(42);
    expect(attack.borderSize()).toBe(0);
    expect(attack.frontierSize()).toBe(0);
  });

  it("places the local player from a click placement command", () => {
    const map = createFoundationMap({ width: 32, height: 32 });
    const runtime = createFoundationRuntime({ map });
    const tileRef = map.ref(16, 16);

    const result = runtime.dispatch(createPlacePlayerCommand({ tileRef }));

    expect(result.ok).toBe(true);
    expect(runtime.player().placement?.selectedTile).toBe(tileRef);
    expect(runtime.snapshot()).toMatchObject({
      moduleId: FOUNDATION_MODULE_ID,
      tick: 1,
      updateCount: 1,
      map: { width: 32, height: 32 },
      player: {
        id: "player-1",
        placed: true,
        selectedTile: tileRef,
      },
    });
    expect(runtime.snapshot().player.claimedTileCount).toBeGreaterThan(0);
  });

  it("builds a foundation structure on owned land", () => {
    const map = createFoundationMap({ width: 32, height: 32 });
    const runtime = createFoundationRuntime({ map });
    const tileRef = map.ref(16, 16);

    runtime.dispatch(createPlacePlayerCommand({ tileRef }));
    const buildingTile = runtime.player().placement!.claimedTiles[0];
    const result = runtime.dispatch(
      createBuildStructureCommand({
        buildingType: "grain-silo",
        tileRef: buildingTile,
        turnNumber: runtime.snapshot().tick,
      }),
    );

    expect(result.ok).toBe(true);
    expect(runtime.snapshot().player.buildings).toEqual([
      {
        id: "building-1",
        type: "grain-silo",
        tileRef: buildingTile,
        level: 1,
        underConstruction: false,
      },
    ]);
    expect(result.update.events).toEqual([
      {
        type: "foundation.structure_built",
        payload: {
          playerId: "player-1",
          building: {
            id: "building-1",
            type: "grain-silo",
            tileRef: buildingTile,
            level: 1,
            underConstruction: false,
          },
        },
      },
    ]);
  });

  it("rejects duplicate foundation structures on one anchor tile", () => {
    const map = createFoundationMap({ width: 32, height: 32 });
    const runtime = createFoundationRuntime({ map });

    runtime.dispatch(createPlacePlayerCommand({ tileRef: map.ref(16, 16) }));
    const buildingTile = runtime.player().placement!.claimedTiles[0];
    runtime.dispatch(
      createBuildStructureCommand({
        buildingType: "grain-silo",
        tileRef: buildingTile,
      }),
    );
    const duplicate = runtime.dispatch(
      createBuildStructureCommand({
        buildingType: "oil-tank",
        tileRef: buildingTile,
      }),
    );

    expect(duplicate.ok).toBe(false);
    expect(duplicate.error).toBe("tile_occupied");
    expect(runtime.snapshot().player.buildings).toHaveLength(1);
  });

  it("adds completed grain silos to food stock capacity", () => {
    const map = createFoundationMap({ width: 32, height: 32 });
    const runtime = createFoundationRuntime({
      map,
      parameters: {
        baseFoodStorageCapacity: 50,
        baseSilosOwned: 0,
        addedStorageCapacityPerSilo: 100,
      },
    });

    runtime.dispatch(createPlacePlayerCommand({ tileRef: map.ref(16, 16) }));
    expect(runtime.snapshot().player.foodStockCapacity).toBe(50);

    const buildingTile = runtime.player().placement!.claimedTiles[0];
    runtime.dispatch(
      createBuildStructureCommand({
        buildingType: "grain-silo",
        tileRef: buildingTile,
      }),
    );

    expect(runtime.snapshot().player.foodStockCapacity).toBe(150);
  });

  it("rejects placement on water without tile deltas", () => {
    const map = createFoundationMap({ width: 32, height: 32 });
    const runtime = createFoundationRuntime({ map });
    const tileRef = map.ref(16, 16);
    map.terrainBuffer()[tileRef] = foundationWaterTerrainByteForElevation(0.1);

    const result = runtime.dispatch(createPlacePlayerCommand({ tileRef }));

    expect(result.ok).toBe(false);
    expect(result.error).toBe("water_tile");
    expect(result.update.map).toBeUndefined();
    expect(runtime.snapshot().player.placed).toBe(false);
    expect(ownerIdFromState(map.stateBuffer()[tileRef])).toBe(0);
  });

  it("uses the original OpenFront centered spawn radius", () => {
    const map = createFoundationMap({ width: 32, height: 32 });
    const runtime = createFoundationRuntime({ map });
    const tileRef = map.ref(16, 16);

    runtime.dispatch(createPlacePlayerCommand({ tileRef }));

    expect(runtime.snapshot().player.claimedTileCount).toBe(52);
  });

  it("emits a map delta with changed tile refs and states", () => {
    const map = createFoundationMap({ width: 32, height: 32 });
    const runtime = createFoundationRuntime({ map });
    const tileRef = map.ref(10, 12);

    const result = runtime.dispatch(createPlacePlayerCommand({ tileRef }));
    const changedTiles = Array.from(result.update.map?.changedTiles ?? []);
    const changedTileStates = Array.from(
      result.update.map?.changedTileStates ?? [],
    );

    expect(result.update.moduleId).toBe(FOUNDATION_MODULE_ID);
    expect(result.update.tick).toBe(1);
    expect(result.update.updateId).toBe(1);
    expect(result.update.events).toEqual([
      {
        type: "foundation.player_placed",
        payload: {
          playerId: "player-1",
          selectedTile: tileRef,
          claimedTileCount: changedTiles.length,
        },
      },
    ]);
    expect(changedTiles.length).toBeGreaterThan(0);
    expect(changedTileStates).toHaveLength(changedTiles.length);
    for (let i = 0; i < changedTiles.length; i++) {
      expect(changedTileStates[i]).toBe(map.stateBuffer()[changedTiles[i]]);
      expect(ownerIdFromState(changedTileStates[i])).toBe(1);
    }
    expect(result.update.map).not.toHaveProperty("tileState");
    expect(result.update).not.toHaveProperty("updates");
  });

  it("rejects a second placement explicitly without tile deltas", () => {
    const map = createFoundationMap({ width: 32, height: 32 });
    const runtime = createFoundationRuntime({ map });
    const firstTile = map.ref(4, 4);
    const secondTile = map.ref(20, 20);

    runtime.dispatch(createPlacePlayerCommand({ tileRef: firstTile }));
    const second = runtime.dispatch(
      createPlacePlayerCommand({ turnNumber: 1, tileRef: secondTile }),
    );

    expect(second.ok).toBe(false);
    expect(second.error).toBe("already_placed");
    expect(second.update).toMatchObject({
      moduleId: FOUNDATION_MODULE_ID,
      tick: 2,
      updateId: 2,
      events: [
        {
          type: "foundation.command_rejected",
          payload: {
            commandType: "foundation.place_player",
            reason: "already_placed",
          },
        },
      ],
    });
    expect(second.update.map).toBeUndefined();
    expect(runtime.player().placement?.selectedTile).toBe(firstTile);
    expect(ownerIdFromState(map.stateBuffer()[firstTile])).toBe(1);
    expect(ownerIdFromState(map.stateBuffer()[secondTile])).toBe(0);
  });

  it("keeps starting troops below food support after placement", () => {
    const map = createFoundationMap({ width: 32, height: 32 });
    const runtime = createFoundationRuntime({ map });

    runtime.dispatch(createPlacePlayerCommand({ tileRef: map.ref(16, 16) }));
    const snapshot = runtime.snapshot();

    expect(snapshot.player.troops).toBe(25_000);
    expect(snapshot.player.maxTroops).toBeGreaterThan(snapshot.player.troops);
    expect(snapshot.player.foodProduction).toBeGreaterThan(
      snapshot.player.foodDemand,
    );
    expect(snapshot.player.foodSupportedTroops).toBe(snapshot.player.maxTroops);
    expect(snapshot.player.foodDeficit).toBe(0);
    expect(snapshot.player.troopIncreaseRate).toBeGreaterThan(0);
  });

  it("uses food-supported capacity in the population growth curve", () => {
    const map = createFoundationMap({ width: 32, height: 32 });
    const runtime = createFoundationRuntime({ map });

    runtime.dispatch(createPlacePlayerCommand({ tileRef: map.ref(16, 16) }));
    const snapshot = runtime.snapshot();
    const foodProduction = foodProductionForTileCount(
      snapshot.player.claimedTileCount,
    );
    const maxTroops = maxTroopsForTileCount(snapshot.player.claimedTileCount);
    const expectedGrowth =
      0.05 * snapshot.player.troops * (1 - snapshot.player.troops / maxTroops);

    expect(snapshot.player.foodProduction).toBe(foodProduction);
    expect(snapshot.player.foodSupportedTroops).toBe(maxTroops);
    expect(snapshot.player.maxTroops).toBe(maxTroops);
    expect(snapshot.player.troopIncreaseRate).toBeCloseTo(expectedGrowth, 5);
  });

  it("derives supported troops from food production and food per troop", () => {
    const map = createFoundationMap({ width: 32, height: 32 });
    const runtime = createFoundationRuntime({
      map,
      parameters: { foodPerTroop: 2 },
    });

    runtime.dispatch(createPlacePlayerCommand({ tileRef: map.ref(16, 16) }));
    const snapshot = runtime.snapshot();

    expect(snapshot.player.foodDemand).toBe(snapshot.player.troops * 2);
    expect(snapshot.player.foodSupportedTroops).toBe(
      (snapshot.player.foodProduction * 0.5) / 2,
    );
    expect(snapshot.player.maxTroops).toBe(snapshot.player.foodSupportedTroops);
  });

  it("updates population with the dynamics growth curve after placement", () => {
    const map = createFoundationMap({ width: 64, height: 64 });
    const runtime = createFoundationRuntime({ map });

    runtime.dispatch(createPlacePlayerCommand({ tileRef: map.ref(16, 16) }));
    runtime.dispatch(
      createGrowTerritoryCommand({
        turnNumber: 1,
        targetTileRef: map.ref(40, 16),
      }),
    );

    const beforeGrowthSnapshot = runtime.snapshot().player;
    const afterAttackTroops = beforeGrowthSnapshot.troops;
    const expectedGrowth = beforeGrowthSnapshot.troopIncreaseRate;
    runtime.advanceTick();

    expect(runtime.snapshot().player.troops).toBeGreaterThan(afterAttackTroops);
    expect(runtime.snapshot().player.troops).toBeCloseTo(
      afterAttackTroops + expectedGrowth,
      5,
    );
    expect(runtime.snapshot().player.troopIncreaseRate).toBeGreaterThan(0);
  });

  it("updates economy metrics from the graph-backed economy system", () => {
    const fixture = foundationEconomyFixture("runtime-growth");
    const runtime = createFoundationRuntime({
      player: fixturePlayer(fixture),
      parameters: fixture.parameters,
    });

    const update = runtime.advanceTick();

    expect(runtime.player().foodStock).toBeCloseTo(
      fixture.runtime.player.foodStock,
      6,
    );
    expect(runtime.player().troops).toBeCloseTo(
      fixture.runtime.player.troops,
      6,
    );
    expect(update.metrics?.foodStock).toBeCloseTo(
      fixture.runtime.metrics.foodStock,
      6,
    );
    expect(update.metrics?.foodStockDelta).toBeCloseTo(
      fixture.runtime.foodStockMetrics.stockDelta,
      6,
    );
    expect(update.metrics?.foodStockOverflow).toBeCloseTo(
      fixture.runtime.foodStockMetrics.overflow,
      6,
    );
    expect(update.metrics?.troops).toBeCloseTo(
      fixture.runtime.player.troops,
      6,
    );
  });

  it("starts wilderness exploration by committing troops toward a clicked target", () => {
    const map = createFoundationMap({ width: 64, height: 64 });
    const runtime = createFoundationRuntime({ map });
    const startTile = map.ref(16, 16);
    const targetTile = map.ref(40, 16);

    runtime.dispatch(createPlacePlayerCommand({ tileRef: startTile }));
    const beforeTroops = runtime.snapshot().player.troops;
    const result = runtime.dispatch(
      createGrowTerritoryCommand({ turnNumber: 1, targetTileRef: targetTile }),
    );

    expect(result.ok).toBe(true);
    expect(result.update.map).toBeUndefined();
    expect(runtime.snapshot().player.troops).toBe(beforeTroops * 0.8);
    expect(runtime.snapshot().player.exploringTroops).toBe(beforeTroops * 0.2);
    expect(result.update.events).toEqual([
      {
        type: "foundation.wilderness_exploration_started",
        payload: {
          playerId: "player-1",
          targetTile,
          originTile: expect.any(Number),
          committedTroops: beforeTroops * 0.2,
          remainingTroops: beforeTroops * 0.8,
        },
      },
    ]);
    const eventPayload = result.update.events[0].payload as {
      originTile: number;
    };
    expect(ownerIdFromState(map.stateBuffer()[eventPayload.originTile])).toBe(
      1,
    );
    expect(
      Math.abs(map.x(eventPayload.originTile) - map.x(startTile)),
    ).toBeLessThanOrEqual(1);
    expect(
      Math.abs(map.y(eventPayload.originTile) - map.y(startTile)),
    ).toBeLessThanOrEqual(1);
  });

  it("accepts water as a wilderness exploration target without claiming water", () => {
    const map = createFoundationMap({ width: 64, height: 64 });
    const runtime = createFoundationRuntime({ map });
    const startTile = map.ref(16, 16);
    const targetTile = map.ref(40, 16);
    map.terrainBuffer()[targetTile] =
      foundationWaterTerrainByteForElevation(0.1);

    runtime.dispatch(createPlacePlayerCommand({ tileRef: startTile }));
    const result = runtime.dispatch(
      createGrowTerritoryCommand({ turnNumber: 1, targetTileRef: targetTile }),
    );

    expect(result.ok).toBe(true);
    expect(runtime.snapshot().player.exploringTroops).toBeGreaterThan(0);

    for (let i = 0; i < 40; i++) {
      runtime.advanceTick();
    }

    expect(ownerIdFromState(map.stateBuffer()[targetTile])).toBe(0);
  });

  it("reinforces active wilderness exploration with another grow command", () => {
    const map = createFoundationMap({ width: 64, height: 64 });
    const runtime = createFoundationRuntime({ map });

    runtime.dispatch(createPlacePlayerCommand({ tileRef: map.ref(16, 16) }));
    runtime.dispatch(
      createGrowTerritoryCommand({
        turnNumber: 1,
        targetTileRef: map.ref(40, 16),
        troopRatio: 0.1,
      }),
    );
    const firstSnapshot = runtime.snapshot();
    const expectedReinforcement = Math.floor(firstSnapshot.player.troops * 0.1);

    const result = runtime.dispatch(
      createGrowTerritoryCommand({
        turnNumber: 2,
        targetTileRef: map.ref(41, 16),
        troopRatio: 0.1,
      }),
    );

    expect(result.ok).toBe(true);
    expect(result.error).toBeUndefined();
    expect(runtime.snapshot().player.exploringTroops).toBe(
      firstSnapshot.player.exploringTroops + expectedReinforcement,
    );
  });

  it("keeps existing wilderness fronts active when adding an opposite push", () => {
    const map = createFoundationMap({ width: 64, height: 64 });
    const runtime = createFoundationRuntime({
      map,
      parameters: {
        startingTroops: 1_000_000,
        wildernessAttackerLossPerTile: 0,
        wildernessTilesPerTickMultiplier: 8,
      },
    });
    const startTile = map.ref(32, 32);

    runtime.dispatch(createPlacePlayerCommand({ tileRef: startTile }));
    runtime.dispatch(
      createGrowTerritoryCommand({
        turnNumber: 1,
        targetTileRef: map.ref(58, 32),
        troopRatio: 0.2,
        frontMode: "focused",
        frontFocus: 1,
      }),
    );
    runtime.dispatch(
      createGrowTerritoryCommand({
        turnNumber: 2,
        targetTileRef: map.ref(6, 32),
        troopRatio: 0.2,
        frontMode: "focused",
        frontFocus: 1,
      }),
    );

    const claimedTiles: number[] = [];
    for (let i = 0; i < 4; i++) {
      claimedTiles.push(
        ...Array.from(runtime.advanceTick().map?.changedTiles ?? []),
      );
    }

    const claimedXs = claimedTiles.map((tile) => map.x(tile));
    expect(Math.max(...claimedXs)).toBeGreaterThan(36);
    expect(Math.min(...claimedXs)).toBeLessThan(28);
  });

  it("grinds wilderness exploration over ticks with troop growth and map deltas", () => {
    const map = createFoundationMap({ width: 64, height: 64 });
    const runtime = createFoundationRuntime({ map });
    const startTile = map.ref(16, 16);
    const targetTile = map.ref(40, 16);

    runtime.dispatch(createPlacePlayerCommand({ tileRef: startTile }));
    const beforeCount = runtime.snapshot().player.claimedTileCount;
    runtime.dispatch(
      createGrowTerritoryCommand({
        turnNumber: 1,
        targetTileRef: targetTile,
        frontMode: "focused",
        frontFocus: 1,
      }),
    );
    const committedTroops = runtime.snapshot().player.exploringTroops;

    let tick = runtime.advanceTick();
    for (
      let i = 0;
      i < 8 && Array.from(tick.map?.changedTiles ?? []).length === 0;
      i++
    ) {
      tick = runtime.advanceTick();
    }
    const changedTiles = Array.from(tick.map?.changedTiles ?? []);
    const changedTileStates = Array.from(tick.map?.changedTileStates ?? []);

    expect(changedTiles.length).toBeGreaterThan(0);
    expect(changedTileStates).toHaveLength(changedTiles.length);
    expect(runtime.snapshot().player.claimedTileCount).toBe(
      beforeCount + changedTiles.length,
    );
    expect(runtime.snapshot().player.troops).toBeGreaterThan(20_000);
    expect(runtime.snapshot().player.maxTroops).toBeGreaterThan(
      runtime.snapshot().player.troops,
    );
    expect(runtime.snapshot().player.foodSupportedTroops).toBe(
      runtime.snapshot().player.maxTroops,
    );
    expect(runtime.snapshot().player.troopIncreaseRate).toBeGreaterThan(0);
    expect(runtime.snapshot().player.exploringTroops).toBeLessThan(
      committedTroops,
    );
    expect(runtime.snapshot().player.exploringTroops).toBe(
      committedTroops - changedTiles.length * 80,
    );
    expect(tick.events[0]).toEqual({
      type: "foundation.territory_grown",
      payload: {
        playerId: "player-1",
        targetTile,
        claimedTileCount: changedTiles.length,
        totalClaimedTileCount: beforeCount + changedTiles.length,
      },
    });
    for (let i = 0; i < changedTiles.length; i++) {
      expect(changedTileStates[i]).toBe(map.stateBuffer()[changedTiles[i]]);
      expect(ownerIdFromState(changedTileStates[i])).toBe(1);
    }
  });

  it("caps immediate wilderness speed by front capacity instead of total wave troops", () => {
    const claimedOnFirstTick = (startingTroops: number): number => {
      const map = createFoundationMap({ width: 64, height: 64 });
      const runtime = createFoundationRuntime({
        map,
        parameters: {
          startingTroops,
          wildernessFrontCapacity: 5_000,
          wildernessAttackerLossPerTile: 0,
        },
      });

      runtime.dispatch(createPlacePlayerCommand({ tileRef: map.ref(16, 16) }));
      runtime.dispatch(
        createGrowTerritoryCommand({
          turnNumber: 1,
          targetTileRef: map.ref(40, 16),
        }),
      );

      return Array.from(runtime.advanceTick().map?.changedTiles ?? []).length;
    };

    expect(claimedOnFirstTick(2_000_000)).toBe(claimedOnFirstTick(1_000_000));
  });

  it("uses uniform wilderness front shares for default click targets", () => {
    const runFirstExplorationTick = (targetTile: number): number[] => {
      const map = createFoundationMap({ width: 64, height: 64 });
      const runtime = createFoundationRuntime({
        map,
        parameters: {
          startingTroops: 1_000_000,
          wildernessAttackerLossPerTile: 0,
        },
      });
      runtime.dispatch(createPlacePlayerCommand({ tileRef: map.ref(16, 16) }));
      runtime.dispatch(
        createGrowTerritoryCommand({
          turnNumber: 1,
          targetTileRef: targetTile,
        }),
      );
      const changedTiles: number[] = [];
      for (let i = 0; i < 3; i++) {
        changedTiles.push(
          ...Array.from(runtime.advanceTick().map?.changedTiles ?? []),
        );
      }
      return changedTiles;
    };

    const eastTargetTiles = runFirstExplorationTick(20 + 64 * 16);
    const westTargetTiles = runFirstExplorationTick(11 + 64 * 16);

    expect(eastTargetTiles.length).toBeGreaterThan(0);
    expect(westTargetTiles.length).toBeGreaterThan(0);
    expect(eastTargetTiles).toEqual(westTargetTiles);
  });

  it("concentrates focused wilderness fronts near the target", () => {
    const runFirstExplorationTick = (targetTile: number): number[] => {
      const map = createFoundationMap({ width: 64, height: 64 });
      const runtime = createFoundationRuntime({
        map,
        parameters: {
          wildernessAttackerLossPerTile: 0,
          wildernessTilesPerTickMultiplier: 2,
        },
      });
      runtime.dispatch(createPlacePlayerCommand({ tileRef: map.ref(16, 16) }));
      runtime.dispatch(
        createGrowTerritoryCommand({
          turnNumber: 1,
          targetTileRef: targetTile,
          frontMode: "focused",
          frontFocus: 1,
        }),
      );
      return Array.from(runtime.advanceTick().map?.changedTiles ?? []);
    };

    const eastTargetTiles = runFirstExplorationTick(20 + 64 * 16);
    const westTargetTiles = runFirstExplorationTick(11 + 64 * 16);

    expect(eastTargetTiles.length).toBeGreaterThan(0);
    expect(westTargetTiles.length).toBeGreaterThan(0);
    expect(eastTargetTiles).not.toEqual(westTargetTiles);
    expect(
      Math.max(...eastTargetTiles.map((tile) => tile % 64)),
    ).toBeGreaterThan(Math.max(...westTargetTiles.map((tile) => tile % 64)));
  });

  it("continues wilderness exploration along the clicked vector after launch", () => {
    const runExploration = (targetTile: number): number[] => {
      const map = createFoundationMap({ width: 64, height: 64 });
      const runtime = createFoundationRuntime({
        map,
        parameters: {
          startingTroops: 1_000_000,
          wildernessAttackerLossPerTile: 0,
          wildernessTilesPerTickMultiplier: 8,
        },
      });
      runtime.dispatch(createPlacePlayerCommand({ tileRef: map.ref(16, 16) }));
      runtime.dispatch(
        createGrowTerritoryCommand({
          turnNumber: 1,
          targetTileRef: targetTile,
          frontMode: "focused",
          frontFocus: 1,
        }),
      );

      const claimedTiles: number[] = [];
      for (let i = 0; i < 8; i++) {
        claimedTiles.push(
          ...Array.from(runtime.advanceTick().map?.changedTiles ?? []),
        );
      }
      return claimedTiles;
    };

    const eastTiles = runExploration(50 + 64 * 16);
    const southTiles = runExploration(16 + 64 * 50);
    const averageX = (tiles: number[]): number =>
      tiles.reduce((sum, tile) => sum + (tile % 64), 0) / tiles.length;
    const averageY = (tiles: number[]): number =>
      tiles.reduce((sum, tile) => sum + Math.floor(tile / 64), 0) /
      tiles.length;

    expect(eastTiles.length).toBeGreaterThan(0);
    expect(southTiles.length).toBeGreaterThan(0);
    expect(averageX(eastTiles)).toBeGreaterThan(averageX(southTiles));
    expect(averageY(southTiles)).toBeGreaterThan(averageY(eastTiles));
  });

  it("makes focused wilderness exploration narrower and deeper than uniform exploration", () => {
    const runExploration = (frontMode?: "uniform" | "focused"): number[] => {
      const map = createFoundationMap({ width: 64, height: 64 });
      const runtime = createFoundationRuntime({
        map,
        parameters: {
          startingTroops: 1_000_000,
          wildernessAttackerLossPerTile: 0,
          wildernessTilesPerTickMultiplier: 8,
        },
      });
      runtime.dispatch(createPlacePlayerCommand({ tileRef: map.ref(16, 16) }));
      runtime.dispatch(
        createGrowTerritoryCommand({
          turnNumber: 1,
          targetTileRef: map.ref(50, 16),
          frontMode,
          frontFocus: frontMode === "focused" ? 1 : 0,
        }),
      );

      const claimedTiles: number[] = [];
      for (let i = 0; i < 8; i++) {
        claimedTiles.push(
          ...Array.from(runtime.advanceTick().map?.changedTiles ?? []),
        );
      }
      return claimedTiles;
    };

    const uniformTiles = runExploration("uniform");
    const focusedTiles = runExploration("focused");
    const xMax = (tiles: number[]): number =>
      Math.max(...tiles.map((tile) => tile % 64));
    const yRange = (tiles: number[]): number => {
      const ys = tiles.map((tile) => Math.floor(tile / 64));
      return Math.max(...ys) - Math.min(...ys);
    };

    expect(focusedTiles.length).toBeGreaterThan(0);
    expect(uniformTiles.length).toBeGreaterThan(0);
    expect(xMax(focusedTiles)).toBeGreaterThan(xMax(uniformTiles));
    expect(yRange(focusedTiles)).toBeLessThan(yRange(uniformTiles));
  });

  it("rejects growth before placement without tile deltas", () => {
    const map = createFoundationMap({ width: 32, height: 32 });
    const runtime = createFoundationRuntime({ map });
    const targetTile = map.ref(20, 20);

    const result = runtime.dispatch(
      createGrowTerritoryCommand({ targetTileRef: targetTile }),
    );

    expect(result.ok).toBe(false);
    expect(result.error).toBe("player_not_placed");
    expect(result.update).toMatchObject({
      moduleId: FOUNDATION_MODULE_ID,
      tick: 1,
      updateId: 1,
      events: [
        {
          type: "foundation.command_rejected",
          payload: {
            commandType: "foundation.grow_territory",
            reason: "player_not_placed",
          },
        },
      ],
    });
    expect(result.update.map).toBeUndefined();
  });

  it("exposes food stock without exposing a separate population stock", () => {
    const runtime = createFoundationRuntime({
      map: createFoundationMap({ width: 8, height: 8 }),
    });

    const before = runtime.snapshot();
    const result = runtime.dispatch(createPlacePlayerCommand({ tileRef: 0 }));
    const after = runtime.snapshot();

    expect(before.player).not.toHaveProperty("population");
    expect(after.player).not.toHaveProperty("population");
    expect(before.player.foodStock).toBe(0);
    expect(before.player.foodStockCapacity).toBe(50_000);
    expect(after.player.foodStock).toBe(0);
    expect(after.player.foodStockCapacity).toBe(50_000);
    expect(result.update.metrics).toMatchObject({ pendingTurns: 0 });
    expect(result.update.metrics).not.toHaveProperty("population");
    expect(result.update.metrics).toMatchObject({
      foodStock: 0,
      foodStockCapacity: 50_000,
    });
  });

  it("routes reserve production into the capped food stockpile", () => {
    const map = createFoundationMap({ width: 16, height: 16 });
    const runtime = createFoundationRuntime({
      map,
      parameters: {
        startingTroops: 10,
        foodPerTroop: 1,
        foodPerTile: 100,
        foodReservePercentage: 0.5,
        startingFoodStorage: 0,
        baseFoodStorageCapacity: 50,
        baseSilosOwned: 0,
        stockpileGrowthRate: 1,
      },
    });

    runtime.dispatch(createPlacePlayerCommand({ tileRef: map.ref(8, 8) }));
    const update = runtime.advanceTick();
    const snapshot = runtime.snapshot();

    expect(snapshot.player.foodStock).toBe(50);
    expect(snapshot.player.foodStockCapacity).toBe(50);
    expect(snapshot.player.foodStockDelta).toBe(50);
    expect(snapshot.player.foodStockOverflow).toBe(2550);
    expect(update.metrics).toMatchObject({
      foodStock: 50,
      foodStockCapacity: 50,
      foodStockDelta: 50,
      foodStockOverflow: 2550,
    });
  });

  it("does not draw down the food stockpile for population demand yet", () => {
    const map = createFoundationMap({ width: 16, height: 16 });
    const runtime = createFoundationRuntime({
      map,
      parameters: {
        startingTroops: 100,
        foodPerTroop: 1,
        foodPerTile: 1,
        foodReservePercentage: 0.5,
        startingFoodStorage: 20,
        baseFoodStorageCapacity: 50,
        baseSilosOwned: 0,
        stockpileGrowthRate: 0.1,
      },
    });

    runtime.dispatch(createPlacePlayerCommand({ tileRef: map.ref(8, 8) }));
    runtime.advanceTick();
    const snapshot = runtime.snapshot();

    expect(snapshot.player.foodStock).toBeGreaterThan(20);
    expect(snapshot.player.foodStockDelta).toBeGreaterThan(0);
    expect(snapshot.player.foodStockOverflow).toBe(0);
  });
});

function fixturePlayer(fixture: ReturnType<typeof foundationEconomyFixture>) {
  if (fixture.player === null) {
    return createPlayer("player-1", {
      troops: 25_000,
      foodStock: 1_750,
    });
  }
  const player = createPlayer("player-1", {
    troops: fixture.player.troops,
    foodStock: fixture.player.foodStock,
  });
  return {
    ...player,
    placement: {
      selectedTile: 1,
      claimedTiles: Array.from(
        { length: fixture.player.claimedTileCount },
        (_value, index) => index + 1,
      ),
      claimedTileCount: fixture.player.claimedTileCount,
    },
  };
}

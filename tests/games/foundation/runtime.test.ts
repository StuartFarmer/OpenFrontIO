import { describe, expect, it } from "vitest";
import {
  ExplorationAttack,
  FOUNDATION_MODULE_ID,
  createFoundationMap,
  createFoundationRuntime,
  createGrowTerritoryCommand,
  createPlacePlayerCommand,
  foundationWaterTerrainByteForElevation,
  maxTroopsForTileCount,
  ownerIdFromState,
  troopIncreaseRate,
} from "../../../src/games/foundation";

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

  it("keeps original OpenFront starting troops after placement", () => {
    const map = createFoundationMap({ width: 32, height: 32 });
    const runtime = createFoundationRuntime({ map });

    runtime.dispatch(createPlacePlayerCommand({ tileRef: map.ref(16, 16) }));
    const snapshot = runtime.snapshot();

    expect(snapshot.player.troops).toBe(25_000);
    expect(snapshot.player.maxTroops).toBeGreaterThan(snapshot.player.troops);
    expect(snapshot.player.troopIncreaseRate).toBeGreaterThan(0);
  });

  it("uses the original OpenFront troop regen curve", () => {
    const map = createFoundationMap({ width: 32, height: 32 });
    const runtime = createFoundationRuntime({ map });

    runtime.dispatch(createPlacePlayerCommand({ tileRef: map.ref(16, 16) }));
    const snapshot = runtime.snapshot();
    const maxTroops = maxTroopsForTileCount(snapshot.player.claimedTileCount);
    const expectedGrowth =
      (10 + Math.pow(snapshot.player.troops, 0.73) / 4) *
      (1 - snapshot.player.troops / maxTroops);

    expect(snapshot.player.maxTroops).toBe(maxTroops);
    expect(troopIncreaseRate(runtime.player())).toBeCloseTo(expectedGrowth, 5);
  });

  it("regenerates troops with the original OpenFront curve after placement", () => {
    const map = createFoundationMap({ width: 64, height: 64 });
    const runtime = createFoundationRuntime({ map });

    runtime.dispatch(createPlacePlayerCommand({ tileRef: map.ref(16, 16) }));
    runtime.dispatch(
      createGrowTerritoryCommand({
        turnNumber: 1,
        targetTileRef: map.ref(40, 16),
      }),
    );

    const afterAttackTroops = runtime.snapshot().player.troops;
    const expectedGrowth = troopIncreaseRate(runtime.player());
    runtime.advanceTick();

    expect(runtime.snapshot().player.troops).toBeGreaterThan(afterAttackTroops);
    expect(runtime.snapshot().player.troops).toBeCloseTo(
      afterAttackTroops + expectedGrowth,
      5,
    );
    expect(runtime.snapshot().player.troopIncreaseRate).toBeGreaterThan(0);
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

  it("grinds wilderness exploration over ticks with troop growth and map deltas", () => {
    const map = createFoundationMap({ width: 64, height: 64 });
    const runtime = createFoundationRuntime({ map });
    const startTile = map.ref(16, 16);
    const targetTile = map.ref(40, 16);

    runtime.dispatch(createPlacePlayerCommand({ tileRef: startTile }));
    const beforeCount = runtime.snapshot().player.claimedTileCount;
    runtime.dispatch(
      createGrowTerritoryCommand({ turnNumber: 1, targetTileRef: targetTile }),
    );
    const committedTroops = runtime.snapshot().player.exploringTroops;

    const tick = runtime.advanceTick();
    const changedTiles = Array.from(tick.map?.changedTiles ?? []);
    const changedTileStates = Array.from(tick.map?.changedTileStates ?? []);

    expect(changedTiles.length).toBeGreaterThan(0);
    expect(changedTileStates).toHaveLength(changedTiles.length);
    expect(runtime.snapshot().player.claimedTileCount).toBe(
      beforeCount + changedTiles.length,
    );
    expect(runtime.snapshot().player.troops).toBeGreaterThan(20_000);
    expect(runtime.snapshot().player.maxTroops).toBeGreaterThan(100_000);
    expect(runtime.snapshot().player.troopIncreaseRate).toBeGreaterThan(0);
    expect(runtime.snapshot().player.exploringTroops).toBeLessThan(
      committedTroops,
    );
    expect(runtime.snapshot().player.exploringTroops).toBe(
      committedTroops - changedTiles.length * 16,
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

  it("concentrates the wilderness frontier near close clicked targets", () => {
    const runFirstExplorationTick = (targetTile: number): number[] => {
      const map = createFoundationMap({ width: 64, height: 64 });
      const runtime = createFoundationRuntime({ map });
      runtime.dispatch(createPlacePlayerCommand({ tileRef: map.ref(16, 16) }));
      runtime.dispatch(
        createGrowTerritoryCommand({
          turnNumber: 1,
          targetTileRef: targetTile,
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

  it("does not expose population or food ticking in the MVP snapshot/update", () => {
    const runtime = createFoundationRuntime({
      map: createFoundationMap({ width: 8, height: 8 }),
    });

    const before = runtime.snapshot();
    const result = runtime.dispatch(createPlacePlayerCommand({ tileRef: 0 }));
    const after = runtime.snapshot();

    expect(before.player).not.toHaveProperty("population");
    expect(before.player).not.toHaveProperty("food");
    expect(after.player).not.toHaveProperty("population");
    expect(after.player).not.toHaveProperty("food");
    expect(result.update.metrics).toMatchObject({ pendingTurns: 0 });
    expect(result.update.metrics).not.toHaveProperty("population");
    expect(result.update.metrics).not.toHaveProperty("food");
  });
});

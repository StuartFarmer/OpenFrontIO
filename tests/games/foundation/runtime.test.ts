import { describe, expect, it } from "vitest";
import {
  FOUNDATION_MODULE_ID,
  createFoundationMap,
  createFoundationRuntime,
  createGrowTerritoryCommand,
  createPlacePlayerCommand,
  ownerIdFromState,
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
          committedTroops: beforeTroops * 0.2,
          remainingTroops: beforeTroops * 0.8,
        },
      },
    ]);
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
    expect(runtime.snapshot().player.exploringTroops).toBeLessThan(5_000);
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

  it("uses the same wilderness frontier regardless of clicked target direction", () => {
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

    const eastTargetTiles = runFirstExplorationTick(16 + 64 * 16 + 24);
    const westTargetTiles = runFirstExplorationTick(16 + 64 * 16 - 12);

    expect(eastTargetTiles.length).toBeGreaterThan(0);
    expect(eastTargetTiles).toEqual(westTargetTiles);
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

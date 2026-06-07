import {
  DEFAULT_FOUNDATION_SIMULATION_PARAMETERS,
  EngineTileMap,
  FoundationSimulationParameters,
  isLandTile,
  placePlayer,
  Player,
  startWildernessExploration,
  TileRef,
} from "../domain";
import { evaluateFoundationEconomyDynamicsSnapshot } from "./FoundationEconomyDynamicsSystem";
import {
  FOUNDATION_MODULE_ID,
  FoundationCommandEnvelope,
  FoundationCommandRejectedEvent,
  FoundationCommandResult,
  FoundationMapUpdate,
  FoundationPlayerPlacedEvent,
  FoundationUpdateEnvelope,
  FoundationWildernessExplorationStartedEvent,
} from "./FoundationProtocol";

export interface FoundationCommandRouterState {
  map: EngineTileMap;
  player: Player;
  tick: number;
  updateId: number;
  parameters?: FoundationSimulationParameters;
}

export interface FoundationCommandRouterResult extends FoundationCommandResult {
  player?: Player;
}

export class FoundationCommandRouter {
  route(
    command: FoundationCommandEnvelope,
    state: FoundationCommandRouterState,
  ): FoundationCommandRouterResult {
    if (command.moduleId !== FOUNDATION_MODULE_ID) {
      return rejectedUpdate(state, command.payload.type, "wrong_module");
    }

    if (
      command.actor.type !== "player" ||
      command.actor.id !== state.player.id
    ) {
      return rejectedUpdate(state, command.payload.type, "unknown_actor");
    }

    switch (command.payload.type) {
      case "foundation.place_player":
        return this.placePlayer(command.payload.tileRef, state);
      case "foundation.grow_territory":
        return this.growTerritory(
          command.payload.targetTileRef,
          command.payload.troopRatio,
          state,
        );
    }
  }

  private placePlayer(
    tileRef: TileRef,
    state: FoundationCommandRouterState,
  ): FoundationCommandRouterResult {
    if (state.player.placement) {
      return rejectedUpdate(state, "foundation.place_player", "already_placed");
    }
    if (!state.map.isValidRef(tileRef)) {
      return rejectedUpdate(state, "foundation.place_player", "invalid_tile");
    }
    if (!isLandTile(state.map, tileRef)) {
      return rejectedUpdate(state, "foundation.place_player", "water_tile");
    }

    const placement = placePlayer(
      state.map,
      state.player,
      tileRef,
      state.parameters,
    );
    const mapUpdate = createTileStateDelta(state.map, placement.claimedTiles);
    const event: FoundationPlayerPlacedEvent = {
      playerId: placement.player.id,
      selectedTile: tileRef,
      claimedTileCount: placement.claimedTiles.length,
    };

    return {
      ok: true,
      player: placement.player,
      update: createUpdate(state, {
        player: placement.player,
        map: mapUpdate,
        events: [{ type: "foundation.player_placed", payload: event }],
      }),
    };
  }

  private growTerritory(
    targetTileRef: TileRef,
    troopRatio: number | undefined,
    state: FoundationCommandRouterState,
  ): FoundationCommandRouterResult {
    if (!state.player.placement) {
      return rejectedUpdate(
        state,
        "foundation.grow_territory",
        "player_not_placed",
      );
    }
    if (!state.map.isValidRef(targetTileRef)) {
      return rejectedUpdate(
        state,
        "foundation.grow_territory",
        "invalid_target_tile",
      );
    }

    let exploration;
    try {
      exploration = startWildernessExploration(
        state.map,
        state.player,
        targetTileRef,
        state.tick,
        { troopRatio, parameters: state.parameters },
      );
    } catch (error) {
      const reason = explorationErrorReason(error);
      return rejectedUpdate(state, "foundation.grow_territory", reason);
    }

    const event: FoundationWildernessExplorationStartedEvent = {
      playerId: exploration.player.id,
      targetTile: targetTileRef,
      originTile: exploration.intent.originTile,
      committedTroops: exploration.committedTroops,
      remainingTroops: exploration.player.troops,
    };

    return {
      ok: true,
      player: exploration.player,
      update: createUpdate(state, {
        player: exploration.player,
        events: [
          {
            type: "foundation.wilderness_exploration_started",
            payload: event,
          },
        ],
      }),
    };
  }
}

function explorationErrorReason(error: unknown): string {
  if (!(error instanceof Error)) {
    return "exploration_failed";
  }
  switch (error.message) {
    case "Cannot explore wilderness before player placement":
      return "player_not_placed";
    case "Cannot explore an already owned tile":
      return "target_already_owned";
    case "Not enough troops to explore wilderness":
      return "not_enough_troops";
    case "Cannot explore water":
      return "water_tile";
    default:
      if (error.message.startsWith("Cannot explore toward invalid tile:")) {
        return "invalid_target_tile";
      }
      return "exploration_failed";
  }
}

function createTileStateDelta(
  map: EngineTileMap,
  changedTiles: readonly TileRef[],
): FoundationMapUpdate {
  const changedTileRefs = Uint32Array.from(changedTiles);
  const stateBuffer = map.stateBuffer();
  const changedTileStates = new Uint16Array(changedTileRefs.length);

  for (let i = 0; i < changedTileRefs.length; i++) {
    changedTileStates[i] = stateBuffer[changedTileRefs[i]];
  }

  return {
    changedTiles: changedTileRefs,
    changedTileStates,
  };
}

function rejectedUpdate(
  state: FoundationCommandRouterState,
  commandType: string,
  reason: string,
): FoundationCommandRouterResult {
  const payload: FoundationCommandRejectedEvent = {
    commandType,
    reason,
  };

  return {
    ok: false,
    error: reason,
    update: createUpdate(state, {
      events: [{ type: "foundation.command_rejected", payload }],
    }),
  };
}

function createUpdate(
  state: FoundationCommandRouterState,
  options: Pick<FoundationUpdateEnvelope, "events"> &
    Partial<Pick<FoundationUpdateEnvelope, "map">> & { player?: Player },
): FoundationUpdateEnvelope {
  const player = options.player ?? state.player;
  const parameters =
    state.parameters ?? DEFAULT_FOUNDATION_SIMULATION_PARAMETERS;
  const metrics = evaluateFoundationEconomyDynamicsSnapshot(
    player,
    parameters,
  ).metrics;
  const update: FoundationUpdateEnvelope = {
    moduleId: FOUNDATION_MODULE_ID,
    tick: state.tick,
    updateId: state.updateId,
    events: options.events,
    metrics,
  };

  if (options.map) {
    update.map = options.map;
  }

  return update;
}

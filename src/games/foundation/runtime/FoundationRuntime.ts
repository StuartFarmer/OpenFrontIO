import {
  createEmptyFoundationFoodStockMetrics,
  createFoundationMap,
  createPlayer,
  DEFAULT_FOUNDATION_SIMULATION_PARAMETERS,
  EngineTileMap,
  FoundationFoodStockMetrics,
  FoundationSimulationParameters,
  normalizeFoundationSimulationParameters,
  Player,
  tickWildernessExploration,
} from "../domain";
import { FoundationCommandRouter } from "./FoundationCommandRouter";
import {
  evaluateFoundationEconomyDynamicsSnapshot,
  tickFoundationEconomyDynamicsRuntime,
} from "./FoundationEconomyDynamicsSystem";
import {
  FOUNDATION_MODULE_ID,
  FoundationCommandEnvelope,
  FoundationCommandResult,
  FoundationMapUpdate,
  FoundationModuleId,
  FoundationTerritoryGrownEvent,
  FoundationUpdateEnvelope,
  FoundationWildernessExplorationCompletedEvent,
} from "./FoundationProtocol";

export interface FoundationRuntimeOptions {
  map?: EngineTileMap;
  player?: Player;
  parameters?: Partial<FoundationSimulationParameters>;
}

export interface FoundationRuntimeSnapshot {
  moduleId: FoundationModuleId;
  tick: number;
  updateCount: number;
  map: {
    width: number;
    height: number;
  };
  player: {
    id: string;
    ownerId: number;
    name: string;
    placed: boolean;
    selectedTile: number | null;
    claimedTileCount: number;
    troops: number;
    maxTroops: number;
    foodProduction: number;
    foodDemand: number;
    foodSupportedTroops: number;
    foodSurplus: number;
    foodDeficit: number;
    foodStock: number;
    foodStockCapacity: number;
    foodStockDelta: number;
    foodStockOverflow: number;
    troopIncreaseRate: number;
    exploringTroops: number;
  };
}

export class FoundationRuntime {
  private readonly map_: EngineTileMap;
  private readonly router: FoundationCommandRouter;
  private parameters: FoundationSimulationParameters;
  private player_: Player;
  private lastFoodStock: FoundationFoodStockMetrics;
  private tick_ = 0;
  private updateCount_ = 0;

  constructor(options: FoundationRuntimeOptions = {}) {
    this.map_ = options.map ?? createFoundationMap();
    this.parameters = normalizeFoundationSimulationParameters(
      options.parameters ?? DEFAULT_FOUNDATION_SIMULATION_PARAMETERS,
    );
    this.player_ =
      options.player ??
      createPlayer("player-1", {
        troops: this.parameters.startingTroops,
        foodStock: this.parameters.startingFoodStorage,
      });
    this.lastFoodStock = createEmptyFoundationFoodStockMetrics(
      this.player_,
      this.parameters,
    );
    this.router = new FoundationCommandRouter();
  }

  map(): EngineTileMap {
    return this.map_;
  }

  player(): Player {
    return this.player_;
  }

  updateParameters(parameters: Partial<FoundationSimulationParameters>): void {
    this.parameters = normalizeFoundationSimulationParameters({
      ...this.parameters,
      ...parameters,
    });
    this.lastFoodStock = {
      ...this.lastFoodStock,
      stockCapacity:
        evaluateFoundationEconomyDynamicsSnapshot(
          this.player_,
          this.parameters,
          this.lastFoodStock,
        ).metrics.foodStockCapacity ?? this.lastFoodStock.stockCapacity,
    };
  }

  snapshot(): FoundationRuntimeSnapshot {
    const placement = this.player_.placement;
    const metrics = evaluateFoundationEconomyDynamicsSnapshot(
      this.player_,
      this.parameters,
      this.lastFoodStock,
    ).metrics;

    return {
      moduleId: FOUNDATION_MODULE_ID,
      tick: this.tick_,
      updateCount: this.updateCount_,
      map: {
        width: this.map_.width(),
        height: this.map_.height(),
      },
      player: {
        id: this.player_.id,
        ownerId: this.player_.ownerId,
        name: this.player_.name,
        placed: placement !== null,
        selectedTile: placement?.selectedTile ?? null,
        claimedTileCount: placement?.claimedTileCount ?? 0,
        troops: this.player_.troops,
        maxTroops: metrics.maxTroops ?? 0,
        foodProduction: metrics.foodProduction ?? 0,
        foodDemand: metrics.foodDemand ?? 0,
        foodSupportedTroops: metrics.foodSupportedTroops ?? 0,
        foodSurplus: metrics.foodSurplus ?? 0,
        foodDeficit: metrics.foodDeficit ?? 0,
        foodStock: this.player_.foodStock,
        foodStockCapacity: metrics.foodStockCapacity ?? 0,
        foodStockDelta: metrics.foodStockDelta ?? 0,
        foodStockOverflow: metrics.foodStockOverflow ?? 0,
        troopIncreaseRate: metrics.troopIncreaseRate ?? 0,
        exploringTroops: this.player_.activeExploration?.troops ?? 0,
      },
    };
  }

  dispatch(command: FoundationCommandEnvelope): FoundationCommandResult {
    this.tick_++;
    this.updateCount_++;

    const result = this.router.route(command, {
      map: this.map_,
      player: this.player_,
      tick: this.tick_,
      updateId: this.updateCount_,
      parameters: this.parameters,
    });

    if (result.player) {
      this.player_ = result.player;
    }

    return {
      ok: result.ok,
      update: result.update,
      error: result.error,
    };
  }

  advanceTick(): FoundationUpdateEnvelope {
    this.tick_++;
    this.updateCount_++;

    const economyTick = tickFoundationEconomyDynamicsRuntime(
      this.player_,
      this.parameters,
    );
    this.lastFoodStock = economyTick.foodStockMetrics;
    let nextPlayer = economyTick.player;
    const explorationTargetTile =
      nextPlayer.activeExploration?.targetTile ?? -1;
    const exploration = tickWildernessExploration(
      this.map_,
      nextPlayer,
      this.tick_,
      this.parameters,
    );
    nextPlayer = exploration.player;
    this.player_ = nextPlayer;

    const events: FoundationUpdateEnvelope["events"] = [];
    if (exploration.claimedTiles.length > 0) {
      events.push({
        type: "foundation.territory_grown",
        payload: {
          playerId: nextPlayer.id,
          targetTile: explorationTargetTile,
          claimedTileCount: exploration.claimedTiles.length,
          totalClaimedTileCount: nextPlayer.placement?.claimedTileCount ?? 0,
        } satisfies FoundationTerritoryGrownEvent,
      });
    }
    if (exploration.completed) {
      events.push({
        type: "foundation.wilderness_exploration_completed",
        payload: {
          playerId: nextPlayer.id,
          targetTile: explorationTargetTile,
        } satisfies FoundationWildernessExplorationCompletedEvent,
      });
    }

    const update: FoundationUpdateEnvelope = {
      moduleId: FOUNDATION_MODULE_ID,
      tick: this.tick_,
      updateId: this.updateCount_,
      events,
      metrics: this.createMetrics(),
    };

    if (exploration.claimedTiles.length > 0) {
      update.map = createTileStateDelta(this.map_, exploration.claimedTiles);
    }

    return update;
  }

  private createMetrics(): FoundationUpdateEnvelope["metrics"] {
    return evaluateFoundationEconomyDynamicsSnapshot(
      this.player_,
      this.parameters,
      this.lastFoodStock,
    ).metrics;
  }
}

function createTileStateDelta(
  map: EngineTileMap,
  changedTiles: readonly number[],
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

export function createFoundationRuntime(
  options: FoundationRuntimeOptions = {},
): FoundationRuntime {
  return new FoundationRuntime(options);
}

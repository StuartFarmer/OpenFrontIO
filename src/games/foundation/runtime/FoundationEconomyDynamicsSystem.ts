import {
  initialDynamicsSimulationState,
  stepDynamicsSimulationState,
  type DynamicsGraphBinding,
  type DynamicsGraphBindingResult,
  type DynamicsSavedSystem,
} from "../../../core/systems/dynamics";
import type { GameSystemContext } from "../../../core/systems/GameSystemContext";
import {
  createEmptyFoundationFoodStockMetrics,
  type FoundationFoodStockMetrics,
  type FoundationSimulationParameters,
  type Player,
} from "../domain";
import {
  createFoundationEconomyDynamicsSystem,
  FOUNDATION_ECONOMY_NODE_IDS,
} from "../dynamics/FoundationEconomyDynamics";
import type { FoundationUpdateMetrics } from "./FoundationProtocol";

export interface FoundationEconomyDynamicsSnapshot {
  readonly metrics: FoundationUpdateMetrics;
  readonly operatorValues: Readonly<Record<string, number>>;
  readonly sinkStates: Readonly<Record<string, number>>;
}

export interface FoundationEconomyDynamicsTick {
  readonly player: Player;
  readonly foodStockMetrics: FoundationFoodStockMetrics;
  readonly metrics: FoundationUpdateMetrics;
  readonly operatorValues: Readonly<Record<string, number>>;
  readonly sinkStates: Readonly<Record<string, number>>;
}

export interface FoundationEconomyDynamicsBindingOptions<
  TContext extends GameSystemContext,
> {
  readonly id?: string;
  readonly order?: number;
  readPlayer(context: TContext): Player;
  readParameters(context: TContext): FoundationSimulationParameters;
  applyTick(tick: FoundationEconomyDynamicsTick, context: TContext): void;
}

export function createFoundationEconomyDynamicsBinding<
  TContext extends GameSystemContext,
>(
  options: FoundationEconomyDynamicsBindingOptions<TContext>,
): DynamicsGraphBinding<TContext> {
  return {
    id: options.id ?? "foundation-economy-dynamics",
    phase: "simulation",
    order: options.order ?? 10,
    readSystem: (context) =>
      createSystemForPlayer(
        options.readPlayer(context),
        options.readParameters(context),
      ),
    applyResult: (result, context) => {
      options.applyTick(
        foundationEconomyTickFromGraphResult(
          options.readPlayer(context),
          options.readParameters(context),
          result,
        ),
        context,
      );
    },
  };
}

export function evaluateFoundationEconomyDynamicsSnapshot(
  player: Player,
  parameters: FoundationSimulationParameters,
  lastFoodStock: FoundationFoodStockMetrics = createEmptyFoundationFoodStockMetrics(
    player,
    parameters,
  ),
): FoundationEconomyDynamicsSnapshot {
  const state = initialDynamicsSimulationState(
    createSystemForPlayer(player, parameters),
  );
  const frame = state.frames[state.frames.length - 1];
  return {
    metrics: metricsForPlayer(player, frame.operatorValues, lastFoodStock),
    operatorValues: frame.operatorValues,
    sinkStates: state.sinkStates,
  };
}

export function tickFoundationEconomyDynamicsRuntime(
  player: Player,
  parameters: FoundationSimulationParameters,
): FoundationEconomyDynamicsTick {
  const system = createSystemForPlayer(player, parameters);
  const initialState = initialDynamicsSimulationState(system);
  const nextState = stepDynamicsSimulationState(initialState, system);
  const frame = nextState.frames[nextState.frames.length - 1];
  if (frame === undefined) {
    throw new Error("Foundation economy dynamics produced no frame.");
  }
  return foundationEconomyTickFromGraphResult(player, parameters, {
    system,
    initialState,
    nextState,
    frame,
  });
}

function foundationEconomyTickFromGraphResult(
  player: Player,
  parameters: FoundationSimulationParameters,
  result: DynamicsGraphBindingResult,
): FoundationEconomyDynamicsTick {
  const foodStockMetrics = foodStockMetricsFromDynamics(
    player,
    result.frame.operatorValues,
    result.nextState.sinkStates,
  );
  const nextPlayer = playerWithDynamicsSinks(
    player,
    result.nextState.sinkStates,
  );
  return {
    player: nextPlayer,
    foodStockMetrics,
    metrics: metricsForPlayer(
      nextPlayer,
      evaluateFoundationEconomyDynamicsSnapshot(
        nextPlayer,
        parameters,
        foodStockMetrics,
      ).operatorValues,
      foodStockMetrics,
    ),
    operatorValues: result.frame.operatorValues,
    sinkStates: result.nextState.sinkStates,
  };
}

function createSystemForPlayer(
  player: Player,
  parameters: FoundationSimulationParameters,
): DynamicsSavedSystem {
  return createFoundationEconomyDynamicsSystem({
    inputValues: {
      [FOUNDATION_ECONOMY_NODE_IDS.isPlaced]: player.placement === null ? 0 : 1,
      [FOUNDATION_ECONOMY_NODE_IDS.tilesOwned]:
        player.placement?.claimedTileCount ?? 0,
      [FOUNDATION_ECONOMY_NODE_IDS.foodPerTile]: parameters.foodPerTile,
      [FOUNDATION_ECONOMY_NODE_IDS.foodReservePercentage]:
        parameters.foodReservePercentage,
      [FOUNDATION_ECONOMY_NODE_IDS.foodPerTroop]: parameters.foodPerTroop,
      [FOUNDATION_ECONOMY_NODE_IDS.baseFoodStorageCapacity]:
        parameters.baseFoodStorageCapacity,
      [FOUNDATION_ECONOMY_NODE_IDS.baseSilosOwned]: parameters.baseSilosOwned,
      [FOUNDATION_ECONOMY_NODE_IDS.addedStorageCapacityPerSilo]:
        parameters.addedStorageCapacityPerSilo,
      [FOUNDATION_ECONOMY_NODE_IDS.stockpileGrowthRate]:
        parameters.stockpileGrowthRate,
      [FOUNDATION_ECONOMY_NODE_IDS.maxPopulationGrowthRate]:
        parameters.maxPopulationGrowthRate,
    },
    sinkInitialStates: {
      [FOUNDATION_ECONOMY_NODE_IDS.foodStock]: player.foodStock,
      [FOUNDATION_ECONOMY_NODE_IDS.troops]: player.troops,
    },
  });
}

function metricsForPlayer(
  player: Player,
  operatorValues: Readonly<Record<string, number>>,
  lastFoodStock: FoundationFoodStockMetrics,
): FoundationUpdateMetrics {
  const foodProduction =
    operatorValues[FOUNDATION_ECONOMY_NODE_IDS.foodProduction] ?? 0;
  const foodDemand =
    operatorValues[FOUNDATION_ECONOMY_NODE_IDS.foodDemand] ?? 0;
  const foodSupportedTroops =
    operatorValues[FOUNDATION_ECONOMY_NODE_IDS.populationCapacity] ?? 0;
  const producedForPeople =
    operatorValues[FOUNDATION_ECONOMY_NODE_IDS.producedForPeople] ?? 0;

  return {
    pendingTurns: 0,
    troops: player.troops,
    troopIncreaseRate:
      operatorValues[FOUNDATION_ECONOMY_NODE_IDS.troopIncreaseRate] ?? 0,
    maxTroops: foodSupportedTroops,
    foodProduction,
    foodDemand,
    foodSupportedTroops,
    foodSurplus: Math.max(0, producedForPeople - foodDemand),
    foodDeficit: Math.max(0, foodDemand - producedForPeople),
    foodStock: player.foodStock,
    foodStockCapacity:
      operatorValues[FOUNDATION_ECONOMY_NODE_IDS.foodStockCapacity] ?? 0,
    foodStockDelta: lastFoodStock.stockDelta,
    foodStockOverflow: lastFoodStock.overflow,
    exploringTroops: player.activeExploration?.troops ?? 0,
  };
}

function foodStockMetricsFromDynamics(
  player: Player,
  operatorValues: Readonly<Record<string, number>>,
  sinkStates: Readonly<Record<string, number>>,
): FoundationFoodStockMetrics {
  return {
    produced: operatorValues[FOUNDATION_ECONOMY_NODE_IDS.foodProduction] ?? 0,
    producedForPeople:
      operatorValues[FOUNDATION_ECONOMY_NODE_IDS.producedForPeople] ?? 0,
    producedForStorage:
      operatorValues[FOUNDATION_ECONOMY_NODE_IDS.producedForStorage] ?? 0,
    demanded: operatorValues[FOUNDATION_ECONOMY_NODE_IDS.foodDemand] ?? 0,
    populationCapacity:
      operatorValues[FOUNDATION_ECONOMY_NODE_IDS.populationCapacity] ?? 0,
    stockBefore: player.foodStock,
    stockAfter: sinkStates[FOUNDATION_ECONOMY_NODE_IDS.foodStock] ?? 0,
    stockCapacity:
      operatorValues[FOUNDATION_ECONOMY_NODE_IDS.foodStockCapacity] ?? 0,
    stockDelta: operatorValues[FOUNDATION_ECONOMY_NODE_IDS.foodStockDelta] ?? 0,
    overflow:
      operatorValues[FOUNDATION_ECONOMY_NODE_IDS.foodStockOverflow] ?? 0,
  };
}

function playerWithDynamicsSinks(
  player: Player,
  sinkStates: Readonly<Record<string, number>>,
): Player {
  const foodStock = sinkStates[FOUNDATION_ECONOMY_NODE_IDS.foodStock] ?? 0;
  const troops = sinkStates[FOUNDATION_ECONOMY_NODE_IDS.troops] ?? 0;
  if (foodStock === player.foodStock && troops === player.troops) {
    return player;
  }
  return {
    ...player,
    foodStock,
    troops,
  };
}

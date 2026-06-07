import type { GameSystem } from "../GameSystem";
import type { GameSystemContext } from "../GameSystemContext";
import type {
  DynamicsRuntimeState,
  DynamicsSavedSystem,
  DynamicsTraceFrame,
} from "./DynamicsSchema";
import {
  initialDynamicsSimulationState,
  stepDynamicsSimulationState,
} from "./DynamicsSimulator";

export interface DynamicsGraphBindingResult {
  readonly system: DynamicsSavedSystem;
  readonly initialState: DynamicsRuntimeState;
  readonly nextState: DynamicsRuntimeState;
  readonly frame: DynamicsTraceFrame;
}

export interface DynamicsGraphBinding<
  TContext extends GameSystemContext = GameSystemContext,
> {
  readonly id: string;
  readonly phase: GameSystem["phase"];
  readonly order?: number;
  activeDuringSpawnPhase?(): boolean;
  readSystem(context: TContext): DynamicsSavedSystem;
  applyResult(result: DynamicsGraphBindingResult, context: TContext): void;
}

export function tickDynamicsGraphBinding<TContext extends GameSystemContext>(
  binding: DynamicsGraphBinding<TContext>,
  context: TContext,
): DynamicsGraphBindingResult {
  const system = binding.readSystem(context);
  const initialState = initialDynamicsSimulationState(system);
  const nextState = stepDynamicsSimulationState(initialState, system);
  const frame = nextState.frames[nextState.frames.length - 1];
  if (frame === undefined) {
    throw new Error(
      `Dynamics graph binding "${binding.id}" produced no frame.`,
    );
  }
  const result = { system, initialState, nextState, frame };
  binding.applyResult(result, context);
  return result;
}

export function createDynamicsGraphGameSystem<
  TContext extends GameSystemContext = GameSystemContext,
>(binding: DynamicsGraphBinding<TContext>): GameSystem {
  return {
    id: binding.id,
    phase: binding.phase,
    order: binding.order,
    activeDuringSpawnPhase: binding.activeDuringSpawnPhase,
    tick: (context) => {
      tickDynamicsGraphBinding(binding, context as TContext);
    },
  };
}
